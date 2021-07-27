/*

    Copyright 2019 dYdX Trading Inc.

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

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/SoloMargin.sol";
import "../../protocol/lib/Types.sol";
import "../helpers/OnlySolo.sol";
import "../lib/TypedSignature.sol";
import "../lib/UniswapV2Library.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract DolomiteAmmRouterProxy is OnlySolo, ReentrancyGuard {

    using UniswapV2Library for *;

    int256 public constant MAX_INT_256 = int256((2 ** 255) - 1);

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'DolomiteAmmRouterProxy: EXPIRED');
        _;
    }

    struct ModifyPositionParams {
        uint accountNumber;
        uint amountInWei;
        uint amountOutWei;
        address[] tokenPath;
        address depositToken;
        /// a positive number means funds are deposited to `accountNumber` from accountNumber zero
        /// a negative number means funds are withdrawn from `accountNumber` and moved to accountNumber zero
        int256 marginDeposit;
    }

    struct ModifyPositionCache {
        ModifyPositionParams position;
        SoloMargin soloMargin;
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

    IUniswapV2Factory public UNISWAP_FACTORY;
    address public WETH;

    constructor(
        address soloMargin,
        address uniswapFactory,
        address weth
    ) public OnlySolo(soloMargin) {
        UNISWAP_FACTORY = IUniswapV2Factory(uniswapFactory);
        WETH = weth;
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
        ModifyPositionParams memory position,
        uint deadline
    ) public ensure(deadline) {
        _swapExactTokensForTokensAndModifyPosition(
            ModifyPositionCache({
        position : position,
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
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInWei,
        amountOutWei : amountOutMinWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
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
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInWei,
        amountOutWei : amountOutMinWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
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
        ModifyPositionParams memory position,
        uint deadline
    ) public ensure(deadline) {
        _swapTokensForExactTokensAndModifyPosition(
            ModifyPositionCache({
        position : position,
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
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInMaxWei,
        amountOutWei : amountOutWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
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
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInMaxWei,
        amountOutWei : amountOutWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
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
        // amountsWei[0] == amountInWei
        // amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = UniswapV2Library.getAmountsOutWei(address(cache.uniswapFactory), cache.position.amountInWei, cache.position.tokenPath);
        require(
            cache.amountsWei[cache.amountsWei.length - 1] >= cache.position.amountOutWei,
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
        // cache.amountsWei[0] == amountInWei
        // cache.amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = UniswapV2Library.getAmountsInWei(address(cache.uniswapFactory), cache.position.amountOutWei, cache.position.tokenPath);
        require(
            cache.amountsWei[0] <= cache.position.amountInWei,
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
        cache.marketPath = _getMarketPathFromTokenPath(cache);

        // pools.length == cache.position.tokenPath.length - 1
        address[] memory pools = UniswapV2Library.getPools(address(cache.uniswapFactory), cache.position.tokenPath);

        Account.Info[] memory accounts = _getAccountsForModifyPosition(cache, pools);
        Actions.ActionArgs[] memory actions = _getActionArgsForModifyPosition(cache, pools, accounts.length);

        return (accounts, actions);
    }

    function _getMarketPathFromTokenPath(
        ModifyPositionCache memory cache
    ) internal view returns (uint[] memory) {
        uint[] memory marketPath = new uint[](cache.position.tokenPath.length);
        for (uint i = 0; i < cache.position.tokenPath.length; i++) {
            marketPath[i] = cache.soloMargin.getMarketIdByTokenAddress(cache.position.tokenPath[i]);
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
        if (cache.position.depositToken == address(0)) {
            accounts = new Account.Info[](1 + pools.length);
        } else {
            accounts = new Account.Info[](2 + pools.length);
            accounts[accounts.length - 1] = Account.Info(cache.account, 0);
        }

        accounts[0] = Account.Info(cache.account, cache.position.accountNumber);

        for (uint i = 0; i < pools.length; i++) {
            accounts[i + 1] = Account.Info(pools[i], 0);
        }

        return accounts;
    }

    function _getActionArgsForModifyPosition(
        ModifyPositionCache memory cache,
        address[] memory pools,
        uint accountsLength
    ) internal view returns (Actions.ActionArgs[] memory) {
        Actions.ActionArgs[] memory actions;
        if (cache.position.depositToken == address(0)) {
            actions = new Actions.ActionArgs[](pools.length);
        } else {
            require(
                cache.position.marginDeposit != 0,
                "DolomiteAmmRouterProxy::_getActionArgsForModifyPosition: INVALID_MARGIN_DEPOSIT"
            );

            actions = new Actions.ActionArgs[](pools.length + 1);

            // if `cache.position.marginDeposit < 0` then the user is withdrawing to `accountNumber` (index 0).
            // `accountNumber` zero is at index `accountsLength - 1`
            uint amount;
            if (cache.position.marginDeposit == int256(- 1)) {
                amount = uint(- 1);
            } else if (cache.position.marginDeposit == MAX_INT_256) {
                amount = uint(- 1);
            } else if (cache.position.marginDeposit < 0) {
                amount = (~uint(cache.position.marginDeposit)) + 1;
            } else {
                amount = uint(cache.position.marginDeposit);
            }

            bool isWithdrawal = cache.position.marginDeposit < 0;
            actions[actions.length - 1] = _encodeTransferAction(
                isWithdrawal ? 0 : accountsLength - 1,
                isWithdrawal ? accountsLength - 1 : 0,
                cache.soloMargin.getMarketIdByTokenAddress(cache.position.depositToken),
                amount
            );
        }

        for (uint i = 0; i < pools.length; i++) {
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

}
