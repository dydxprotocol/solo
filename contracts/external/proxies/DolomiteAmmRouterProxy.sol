/*

    Copyright 2021 Dolomite.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "../../protocol/interfaces/ISoloMargin.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Types.sol";

import "../lib/TypedSignature.sol";
import "../lib/UniswapV2Library.sol";

import "../interfaces/IExpiryV2.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract DolomiteAmmRouterProxy is ReentrancyGuard {

    using UniswapV2Library for *;
    using SafeMath for uint;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'DolomiteAmmRouterProxy: EXPIRED');
        _;
    }

    struct ModifyPositionParams {
        uint accountNumber;
        Types.AssetAmount amountIn;
        Types.AssetAmount amountOut;
        address[] tokenPath;
        /// the token to be deposited/withdrawn to/from account number. To not perform any margin deposits or
        /// withdrawals, simply set this to `address(0)`
        address depositToken;
        /// a positive number means funds are deposited to `accountNumber` from accountNumber zero
        /// a negative number means funds are withdrawn from `accountNumber` and moved to accountNumber zero
        bool isPositiveMarginDeposit;
        /// the amount of the margin deposit/withdrawal, in wei
        uint marginDeposit;
        /// the amount of seconds from the time at which the position is opened to expiry. 0 for no expiration
        uint expiryTimeDelta;
    }

    struct ModifyPositionCache {
        ModifyPositionParams params;
        ISoloMargin soloMargin;
        IUniswapV2Factory uniswapFactory;
        address account;
        uint[] marketPath;
        uint[] amountsWei;
    }

    struct PermitSignature {
        bool approveMax;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    ISoloMargin public SOLO_MARGIN;
    IUniswapV2Factory public UNISWAP_FACTORY;
    address public WETH;
    address public EXPIRY_V2;

    constructor(
        address soloMargin,
        address uniswapFactory,
        address weth,
        address expiryV2
    ) public {
        SOLO_MARGIN = ISoloMargin(soloMargin);
        UNISWAP_FACTORY = IUniswapV2Factory(uniswapFactory);
        WETH = weth;
        EXPIRY_V2 = expiryV2;
    }

    function addLiquidity(
        address to,
        uint fromAccountNumber,
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMinWei,
        uint amountBMinWei,
        uint deadline
    )
    external
    ensure(deadline)
    returns (uint amountAWei, uint amountBWei, uint liquidity) {
        (amountAWei, amountBWei) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMinWei, amountBMinWei);
        address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);

        {
            Account.Info[] memory accounts = new Account.Info[](2);
            accounts[0] = Account.Info(msg.sender, fromAccountNumber);
            accounts[1] = Account.Info(pair, 0);

            uint marketIdA = SOLO_MARGIN.getMarketIdByTokenAddress(tokenA);
            uint marketIdB = SOLO_MARGIN.getMarketIdByTokenAddress(tokenB);

            Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
            actions[0] = _encodeTransferAction(0, 1, marketIdA, amountAWei);
            actions[1] = _encodeTransferAction(0, 1, marketIdB, amountBWei);
            SOLO_MARGIN.operate(accounts, actions);
        }

        liquidity = IUniswapV2Pair(pair).mint(to);
    }

    function removeLiquidity(
        address to,
        uint toAccountNumber,
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMinWei,
        uint amountBMinWei,
        uint deadline
    ) public ensure(deadline) returns (uint amountAWei, uint amountBWei) {
        address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);
        // send liquidity to pair
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);

        (uint amount0Wei, uint amount1Wei) = IUniswapV2Pair(pair).burn(to, toAccountNumber);
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountAWei, amountBWei) = tokenA == token0 ? (amount0Wei, amount1Wei) : (amount1Wei, amount0Wei);
        require(amountAWei >= amountAMinWei, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_A_AMOUNT');
        require(amountBWei >= amountBMinWei, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_B_AMOUNT');
    }

    function removeLiquidityWithPermit(
        address to,
        uint toAccountNumber,
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMinWei,
        uint amountBMinWei,
        uint deadline,
        PermitSignature memory permit
    ) public returns (uint amountAWei, uint amountBWei) {
        address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);
        uint value = permit.approveMax ? uint(- 1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, permit.v, permit.r, permit.s);

        (amountAWei, amountBWei) = removeLiquidity(
            to,
            toAccountNumber,
            tokenA,
            tokenB,
            liquidity,
            amountAMinWei,
            amountBMinWei,
            deadline
        );
    }

    function swapExactTokensForTokensAndModifyPosition(
        ModifyPositionParams memory params,
        uint deadline
    ) public ensure(deadline) {
        _swapExactTokensForTokensAndModifyPosition(
            ModifyPositionCache({
        params : params,
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapExactTokensForTokens(
        uint accountNumber,
        uint amountInWei,
        uint amountOutMinWei,
        address[] calldata tokenPath,
        uint deadline
    )
    external
    ensure(deadline) {
        _swapExactTokensForTokensAndModifyPosition(
            ModifyPositionCache({
        params : ModifyPositionParams({
        accountNumber : accountNumber,
        amountIn : _defaultAssetAmount(amountInWei),
        amountOut : _defaultAssetAmount(amountOutMinWei),
        tokenPath : tokenPath,
        depositToken : address(0),
        isPositiveMarginDeposit : false,
        marginDeposit : 0,
        expiryTimeDelta : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function getParamsForSwapExactTokensForTokens(
        address account,
        uint accountNumber,
        uint amountInWei,
        uint amountOutMinWei,
        address[] calldata tokenPath
    )
    external view returns (Account.Info[] memory, Actions.ActionArgs[] memory) {
        return _getParamsForSwapExactTokensForTokens(
            ModifyPositionCache({
        params : ModifyPositionParams({
        accountNumber : accountNumber,
        amountIn : _defaultAssetAmount(amountInWei),
        amountOut : _defaultAssetAmount(amountOutMinWei),
        tokenPath : tokenPath,
        depositToken : address(0),
        isPositiveMarginDeposit : false,
        marginDeposit : 0,
        expiryTimeDelta : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : account,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapTokensForExactTokensAndModifyPosition(
        ModifyPositionParams memory params,
        uint deadline
    ) public ensure(deadline) {
        _swapTokensForExactTokensAndModifyPosition(
            ModifyPositionCache({
        params : params,
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapTokensForExactTokens(
        uint accountNumber,
        uint amountInMaxWei,
        uint amountOutWei,
        address[] calldata tokenPath,
        uint deadline
    )
    external
    ensure(deadline) {
        _swapTokensForExactTokensAndModifyPosition(
            ModifyPositionCache({
        params : ModifyPositionParams({
        accountNumber : accountNumber,
        amountIn : _defaultAssetAmount(amountInMaxWei),
        amountOut : _defaultAssetAmount(amountOutWei),
        tokenPath : tokenPath,
        depositToken : address(0),
        isPositiveMarginDeposit : false,
        marginDeposit : 0,
        expiryTimeDelta : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function getParamsForSwapTokensForExactTokens(
        address account,
        uint accountNumber,
        uint amountInMaxWei,
        uint amountOutWei,
        address[] calldata tokenPath
    )
    external view returns (Account.Info[] memory, Actions.ActionArgs[] memory) {
        return _getParamsForSwapTokensForExactTokens(
            ModifyPositionCache({
        params : ModifyPositionParams({
        accountNumber : accountNumber,
        amountIn : _defaultAssetAmount(amountInMaxWei),
        amountOut : _defaultAssetAmount(amountOutWei),
        tokenPath : tokenPath,
        depositToken : address(0),
        isPositiveMarginDeposit : false,
        marginDeposit : 0,
        expiryTimeDelta : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : account,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    // *************************
    // ***** Internal Functions
    // *************************

    function _swapExactTokensForTokensAndModifyPosition(
        ModifyPositionCache memory cache
    ) internal {
        (
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
        ) = _getParamsForSwapExactTokensForTokens(cache);

        cache.soloMargin.operate(accounts, actions);
    }

    function _swapTokensForExactTokensAndModifyPosition(
        ModifyPositionCache memory cache
    ) internal {
        (
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
        ) = _getParamsForSwapTokensForExactTokens(cache);

        cache.soloMargin.operate(accounts, actions);
    }

    function _getParamsForSwapExactTokensForTokens(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {
        cache.marketPath = _getMarketPathFromTokenPath(cache);

        // Convert from par to wei, if necessary
        uint amountInWei = _convertAssetAmountToWei(cache.params.amountIn, cache.marketPath[0], cache);

        // Convert from par to wei, if necessary
        uint amountOutMinWei = _convertAssetAmountToWei(cache.params.amountOut, cache.marketPath[cache.marketPath.length - 1], cache);

        // amountsWei[0] == amountInWei
        // amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = UniswapV2Library.getAmountsOutWei(address(cache.uniswapFactory), amountInWei, cache.params.tokenPath);
        require(
            cache.amountsWei[cache.amountsWei.length - 1] >= amountOutMinWei,
            "DolomiteAmmRouterProxy::_getParamsForSwapExactTokensForTokens: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        return _getParamsForSwap(cache);
    }

    function _getParamsForSwapTokensForExactTokens(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {
        cache.marketPath = _getMarketPathFromTokenPath(cache);

        // Convert from par to wei, if necessary
        uint amountInMaxWei = _convertAssetAmountToWei(cache.params.amountIn, cache.marketPath[0], cache);

        // Convert from par to wei, if necessary
        uint amountOutWei = _convertAssetAmountToWei(cache.params.amountOut, cache.marketPath[cache.marketPath.length - 1], cache);

        // cache.amountsWei[0] == amountInWei
        // cache.amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = UniswapV2Library.getAmountsInWei(address(cache.uniswapFactory), amountOutWei, cache.params.tokenPath);
        require(
            cache.amountsWei[0] <= amountInMaxWei,
            "DolomiteAmmRouterProxy::_getParamsForSwapTokensForExactTokens: EXCESSIVE_INPUT_AMOUNT"
        );

        return _getParamsForSwap(cache);
    }

    function _getParamsForSwap(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {
        require(
            cache.params.amountIn.ref == Types.AssetReference.Delta && cache.params.amountOut.ref == Types.AssetReference.Delta,
            "DolomiteAmmRouterProxy::_getParamsForSwap: INVALID_ASSET_REFERENCE"
        );

        // pools.length == cache.params.tokenPath.length - 1
        address[] memory pools = UniswapV2Library.getPools(address(cache.uniswapFactory), cache.params.tokenPath);

        Account.Info[] memory accounts = _getAccountsForModifyPosition(cache, pools);
        Actions.ActionArgs[] memory actions = _getActionArgsForModifyPosition(cache, accounts, pools);

        return (accounts, actions);
    }

    function _getMarketPathFromTokenPath(
        ModifyPositionCache memory cache
    ) internal view returns (uint[] memory) {
        uint[] memory marketPath = new uint[](cache.params.tokenPath.length);
        for (uint i = 0; i < cache.params.tokenPath.length; i++) {
            marketPath[i] = cache.soloMargin.getMarketIdByTokenAddress(cache.params.tokenPath[i]);
        }
        return marketPath;
    }

    function _encodeTransferAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId,
        uint amount
    ) internal pure returns (Actions.ActionArgs memory) {
        Types.AssetAmount memory assetAmount;
        if (amount == uint(- 1)) {
            assetAmount = Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0);
        } else {
            assetAmount = Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount);
        }
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        amount : assetAmount,
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    function _encodeExpirationAction(
        ModifyPositionParams memory params,
        Account.Info memory account,
        uint accountIndex,
        uint owedMarketId
    ) internal view returns (Actions.ActionArgs memory) {
        require(
            params.expiryTimeDelta == uint32(params.expiryTimeDelta),
            "DolomiteAmmRouterProxy::_encodeExpirationAction: INVALID_EXPIRY_TIME"
        );

        IExpiryV2.SetExpiryArg[] memory expiryArgs = new IExpiryV2.SetExpiryArg[](1);
        expiryArgs[0] = IExpiryV2.SetExpiryArg({
        account : account,
        marketId : owedMarketId,
        timeDelta : uint32(params.expiryTimeDelta),
        forceUpdate : true
        });

        return Actions.ActionArgs({
        actionType : Actions.ActionType.Call,
        accountId : accountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, 0),
        primaryMarketId : uint(- 1),
        secondaryMarketId : uint(- 1),
        otherAddress : EXPIRY_V2,
        otherAccountId : uint(- 1),
        data : abi.encode(IExpiryV2.CallFunctionType.SetExpiry, expiryArgs)
        });
    }

    function _encodeTradeAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        address traderAddress,
        uint amountInWei,
        uint amountOutWei
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Trade,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
        primaryMarketId : primaryMarketId,
        secondaryMarketId : secondaryMarketId,
        otherAddress : traderAddress,
        otherAccountId : toAccountIndex,
        data : abi.encode(amountOutWei)
        });
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesiredWei,
        uint amountBDesiredWei,
        uint amountAMinWei,
        uint amountBMinWei
    ) internal returns (uint amountAWei, uint amountBWei) {
        IUniswapV2Factory uniswapFactory = UNISWAP_FACTORY;
        // create the pair if it doesn't exist yet
        if (uniswapFactory.getPair(tokenA, tokenB) == address(0)) {
            uniswapFactory.createPair(tokenA, tokenB);
        }
        (uint reserveAWei, uint reserveBWei) = UniswapV2Library.getReservesWei(address(uniswapFactory), tokenA, tokenB);
        if (reserveAWei == 0 && reserveBWei == 0) {
            (amountAWei, amountBWei) = (amountADesiredWei, amountBDesiredWei);
        } else {
            uint amountBOptimal = UniswapV2Library.quote(amountADesiredWei, reserveAWei, reserveBWei);
            if (amountBOptimal <= amountBDesiredWei) {
                require(amountBOptimal >= amountBMinWei, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_B_AMOUNT');
                (amountAWei, amountBWei) = (amountADesiredWei, amountBOptimal);
            } else {
                uint amountAOptimal = UniswapV2Library.quote(amountBDesiredWei, reserveBWei, reserveAWei);
                assert(amountAOptimal <= amountADesiredWei);
                require(amountAOptimal >= amountAMinWei, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_A_AMOUNT');
                (amountAWei, amountBWei) = (amountAOptimal, amountBDesiredWei);
            }
        }
    }

    function _getAccountsForModifyPosition(
        ModifyPositionCache memory cache,
        address[] memory pools
    ) internal pure returns (Account.Info[] memory) {
        Account.Info[] memory accounts;
        if (cache.params.depositToken == address(0)) {
            accounts = new Account.Info[](1 + pools.length);
        } else {
            accounts = new Account.Info[](2 + pools.length);
            accounts[accounts.length - 1] = Account.Info(cache.account, 0);
        }

        accounts[0] = Account.Info(cache.account, cache.params.accountNumber);

        for (uint i = 0; i < pools.length; i++) {
            accounts[i + 1] = Account.Info(pools[i], 0);
        }

        return accounts;
    }

    function _getActionArgsForModifyPosition(
        ModifyPositionCache memory cache,
        Account.Info[] memory accounts,
        address[] memory pools
    ) internal view returns (Actions.ActionArgs[] memory) {
        Actions.ActionArgs[] memory actions;
        if (cache.params.depositToken == address(0)) {
            actions = new Actions.ActionArgs[](pools.length);
        } else {
            require(
                cache.params.marginDeposit != 0,
                "DolomiteAmmRouterProxy::_getActionArgsForModifyPosition: INVALID_MARGIN_DEPOSIT"
            );

            uint expiryActionCount = cache.params.expiryTimeDelta == 0 ? 0 : 1;
            actions = new Actions.ActionArgs[](pools.length + 1 + expiryActionCount);

            // `accountNumber` `0` is at index `accountsLength - 1`

            bool isWithdrawal = !cache.params.isPositiveMarginDeposit;
            actions[actions.length - 1 - expiryActionCount] = _encodeTransferAction(
                isWithdrawal ? 0 : accounts.length - 1 /* from */,
                isWithdrawal ? accounts.length - 1 : 0 /* to */,
                cache.soloMargin.getMarketIdByTokenAddress(cache.params.depositToken),
                cache.params.marginDeposit
            );
            if (expiryActionCount == 1) {
                actions[actions.length - 1] = _encodeExpirationAction(
                    cache.params,
                    accounts[0],
                    0,
                    cache.marketPath[0] /* the market at index 0 is being borrowed and traded */
                );
            }
        }

        for (uint i = 0; i < pools.length; i++) {
            require(
                accounts[i + 1].owner == pools[i],
                "DolomiteAmmRouterProxy::_getActionArgsForModifyPosition: INVALID_OTHER_ADDRESS"
            );
            actions[i] = _encodeTradeAction(
                0,
                i + 1,
                cache.marketPath[i],
                cache.marketPath[i + 1],
                pools[i],
                cache.amountsWei[i],
                cache.amountsWei[i + 1]
            );
        }

        return actions;
    }

    function _defaultAssetAmount(uint value) internal pure returns (Types.AssetAmount memory) {
        return Types.AssetAmount({
        sign : true,
        denomination : Types.AssetDenomination.Wei,
        ref : Types.AssetReference.Delta,
        value : value
        });
    }

    function _convertAssetAmountToWei(
        Types.AssetAmount memory amount,
        uint marketId,
        ModifyPositionCache memory cache
    ) internal view returns (uint) {
        if (amount.denomination == Types.AssetDenomination.Wei) {
            return amount.value;
        } else {
            require(
                uint128(amount.value) == amount.value,
                "DolomiteAmmRouterProxy::_convertAssetAmountToWei: INVALID_VALUE"
            );
            return Interest.parToWei(
                Types.Par({sign : amount.sign, value : uint128(amount.value)}),
                cache.soloMargin.getMarketCurrentIndex(marketId)
            ).value;
        }
    }

}
