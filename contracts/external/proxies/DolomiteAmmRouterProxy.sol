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

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../../protocol/interfaces/IDolomiteMargin.sol";
import "../../protocol/lib/Events.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Require.sol";
import "../../protocol/lib/Types.sol";

import "../lib/TypedSignature.sol";
import "../lib/DolomiteAmmLibrary.sol";

import "../interfaces/IExpiry.sol";
import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";


contract DolomiteAmmRouterProxy is ReentrancyGuard {
    using SafeMath for uint;

    // ============ Constants ============

    bytes32 constant internal FILE = "DolomiteAmmRouterProxy";

    // ============ Structs ============

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
        IDolomiteMargin dolomiteMargin;
        IDolomiteAmmFactory ammFactory;
        address account;
        uint[] marketPath;
        uint[] amountsWei;
        uint marginDepositDeltaWei;
    }

    struct PermitSignature {
        bool approveMax;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // ============ Events ============

    event MarginPositionOpen(
        address indexed user,
        uint indexed accountIndex,
        address inputToken,
        address outputToken,
        address depositToken,
        Events.BalanceUpdate inputBalanceUpdate, // the amount of borrow amount being sold to purchase collateral
        Events.BalanceUpdate outputBalanceUpdate, // the amount of collateral purchased by the borrowed amount
        Events.BalanceUpdate marginDepositUpdate
    );

    event MarginPositionClose(
        address indexed user,
        uint indexed accountIndex,
        address inputToken,
        address outputToken,
        address withdrawalToken,
        Events.BalanceUpdate inputBalanceUpdate, // the amount of held amount being sold to repay debt
        Events.BalanceUpdate outputBalanceUpdate, // the amount of borrow amount being repaid
        Events.BalanceUpdate marginWithdrawalUpdate
    );

    modifier ensure(uint deadline) {
        Require.that(
            deadline >= block.timestamp,
            FILE,
            "deadline expired",
            deadline,
            block.timestamp
        );
        _;
    }

    // ============ State Variables ============

    IDolomiteMargin public DOLOMITE_MARGIN;
    IDolomiteAmmFactory public DOLOMITE_AMM_FACTORY;
    address public EXPIRY;

    constructor(
        address dolomiteMargin,
        address dolomiteAmmFactory,
        address expiry
    ) public {
        DOLOMITE_MARGIN = IDolomiteMargin(dolomiteMargin);
        DOLOMITE_AMM_FACTORY = IDolomiteAmmFactory(dolomiteAmmFactory);
        EXPIRY = expiry;
    }

    function getPairInitCodeHash() external pure returns (bytes32) {
        return DolomiteAmmLibrary.getPairInitCodeHash();
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
        (amountAWei, amountBWei) = _addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMinWei,
            amountBMinWei
        );
        address pair = DolomiteAmmLibrary.pairFor(address(DOLOMITE_AMM_FACTORY), tokenA, tokenB);

        // solium-disable indentation, arg-overflow
        {
            Account.Info[] memory accounts = new Account.Info[](2);
            accounts[0] = Account.Info(msg.sender, fromAccountNumber);
            accounts[1] = Account.Info(pair, 0);

            uint marketIdA = DOLOMITE_MARGIN.getMarketIdByTokenAddress(tokenA);
            uint marketIdB = DOLOMITE_MARGIN.getMarketIdByTokenAddress(tokenB);

            Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
            actions[0] = _encodeTransferAction(0, 1, marketIdA, amountAWei);
            actions[1] = _encodeTransferAction(0, 1, marketIdB, amountBWei);
            DOLOMITE_MARGIN.operate(accounts, actions);
        }
        // solium-enable indentation, arg-overflow

        liquidity = IDolomiteAmmPair(pair).mint(to);
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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : msg.sender,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : account,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : msg.sender,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : account,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
            })
        );
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
        address pair = DolomiteAmmLibrary.pairFor(address(DOLOMITE_AMM_FACTORY), tokenA, tokenB);
        // send liquidity to pair
        IDolomiteAmmPair(pair).transferFrom(msg.sender, pair, liquidity);

        (uint amount0Wei, uint amount1Wei) = IDolomiteAmmPair(pair).burn(to, toAccountNumber);
        (address token0,) = DolomiteAmmLibrary.sortTokens(tokenA, tokenB);
        (amountAWei, amountBWei) = tokenA == token0 ? (amount0Wei, amount1Wei) : (amount1Wei, amount0Wei);
        Require.that(
            amountAWei >= amountAMinWei,
            FILE,
            "insufficient A amount",
            amountAWei,
            amountAMinWei
        );
        Require.that(
            amountBWei >= amountBMinWei,
            FILE,
            "insufficient B amount",
            amountBWei,
            amountBMinWei
        );
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
        address pair = DolomiteAmmLibrary.pairFor(address(DOLOMITE_AMM_FACTORY), tokenA, tokenB);
        uint value = permit.approveMax ? uint(- 1) : liquidity;
        IDolomiteAmmPair(pair).permit(
            msg.sender,
            address(this),
            value,
            deadline,
            permit.v,
            permit.r,
            permit.s
        );

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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : msg.sender,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
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
                dolomiteMargin : DOLOMITE_MARGIN,
                ammFactory : DOLOMITE_AMM_FACTORY,
                account : msg.sender,
                marketPath : new uint[](0),
                amountsWei : new uint[](0),
                marginDepositDeltaWei : 0
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

        cache.dolomiteMargin.operate(accounts, actions);

        _logEvents(cache, accounts);
    }

    function _swapTokensForExactTokensAndModifyPosition(
        ModifyPositionCache memory cache
    ) internal {
        (
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
        ) = _getParamsForSwapTokensForExactTokens(cache);

        cache.dolomiteMargin.operate(accounts, actions);

        _logEvents(cache, accounts);
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
        uint amountOutMinWei = _convertAssetAmountToWei(
            cache.params.amountOut,
            cache.marketPath[cache.marketPath.length - 1],
            cache
        );

        // amountsWei[0] == amountInWei
        // amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = DolomiteAmmLibrary.getAmountsOutWei(
            address(cache.ammFactory),
            amountInWei,
            cache.params.tokenPath
        );

        Require.that(
            cache.amountsWei[cache.amountsWei.length - 1] >= amountOutMinWei,
            FILE,
            "insufficient output amount",
            cache.amountsWei[cache.amountsWei.length - 1],
            amountOutMinWei
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
        uint amountOutWei = _convertAssetAmountToWei(
            cache.params.amountOut,
            cache.marketPath[cache.marketPath.length - 1],
            cache
        );

        // cache.amountsWei[0] == amountInWei
        // cache.amountsWei[amountsWei.length - 1] == amountOutWei
        cache.amountsWei = DolomiteAmmLibrary.getAmountsInWei(
            address(cache.ammFactory),
            amountOutWei,
            cache.params.tokenPath
        );
        Require.that(
            cache.amountsWei[0] <= amountInMaxWei,
            FILE,
            "excessive input amount",
            cache.amountsWei[0],
            amountInMaxWei
        );

        return _getParamsForSwap(cache);
    }

    function _getParamsForSwap(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {
        Require.that(
            cache.params.amountIn.ref == Types.AssetReference.Delta &&
                cache.params.amountOut.ref == Types.AssetReference.Delta,
            FILE,
            "invalid asset reference"
        );

        // pools.length == cache.params.tokenPath.length - 1
        address[] memory pools = DolomiteAmmLibrary.getPools(address(cache.ammFactory), cache.params.tokenPath);

        Account.Info[] memory accounts = _getAccountsForModifyPosition(cache, pools);
        Actions.ActionArgs[] memory actions = _getActionArgsForModifyPosition(cache, accounts, pools);

        if (cache.params.depositToken != address(0) && cache.params.marginDeposit == uint(- 1)) {
            uint expiryActionCount = cache.params.expiryTimeDelta == 0 ? 0 : 1;
            uint marketId = actions[actions.length - 1 - expiryActionCount].primaryMarketId;
            if (cache.params.isPositiveMarginDeposit) {
                // the marginDeposit is equal to the amount of `marketId` in account 0 (which is at accounts.length - 1)
                cache.marginDepositDeltaWei = cache.dolomiteMargin.getAccountWei(accounts[accounts.length - 1], marketId).value;
            } else {
                if (cache.marketPath[0] == marketId) {
                    // the trade downsizes the potential withdrawal
                    cache.marginDepositDeltaWei = cache.dolomiteMargin.getAccountWei(accounts[0], marketId).value.sub(cache.amountsWei[0]);
                } else if (cache.marketPath[cache.marketPath.length - 1] == marketId) {
                    // the trade upsizes the withdrawal
                    cache.marginDepositDeltaWei = cache.dolomiteMargin.getAccountWei(accounts[0], marketId).value.add(cache.amountsWei[cache.amountsWei.length - 1]);
                } else {
                    // the trade doesn't impact the withdrawal
                    cache.marginDepositDeltaWei = cache.dolomiteMargin.getAccountWei(accounts[0], marketId).value;
                }
            }
        } else {
            cache.marginDepositDeltaWei = cache.params.marginDeposit;
        }

        return (accounts, actions);
    }

    function _getMarketPathFromTokenPath(
        ModifyPositionCache memory cache
    ) internal view returns (uint[] memory) {
        uint[] memory marketPath = new uint[](cache.params.tokenPath.length);
        for (uint i = 0; i < cache.params.tokenPath.length; i++) {
            marketPath[i] = cache.dolomiteMargin.getMarketIdByTokenAddress(cache.params.tokenPath[i]);
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
            assetAmount = Types.AssetAmount(
                true,
                Types.AssetDenomination.Wei,
                Types.AssetReference.Target,
                0
            );
        } else {
            assetAmount = Types.AssetAmount(
                false,
                Types.AssetDenomination.Wei,
                Types.AssetReference.Delta,
                amount
            );
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
        Require.that(
            params.expiryTimeDelta == uint32(params.expiryTimeDelta),
            FILE,
            "invalid expiry time"
        );

        IExpiry.SetExpiryArg[] memory expiryArgs = new IExpiry.SetExpiryArg[](1);
        expiryArgs[0] = IExpiry.SetExpiryArg({
        account : account,
        marketId : owedMarketId,
        timeDelta : uint32(params.expiryTimeDelta),
        forceUpdate : true
        });

        return Actions.ActionArgs({
            actionType : Actions.ActionType.Call,
            accountId : accountIndex,
            // solium-disable-next-line arg-overflow
            amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, 0),
            primaryMarketId : uint(- 1),
            secondaryMarketId : uint(- 1),
            otherAddress : EXPIRY,
            otherAccountId : uint(- 1),
            data : abi.encode(IExpiry.CallFunctionType.SetExpiry, expiryArgs)
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
            // solium-disable-next-line arg-overflow
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
        IDolomiteAmmFactory dolomiteAmmFactory = DOLOMITE_AMM_FACTORY;
        // create the pair if it doesn't exist yet
        if (dolomiteAmmFactory.getPair(tokenA, tokenB) == address(0)) {
            dolomiteAmmFactory.createPair(tokenA, tokenB);
        }
        (uint reserveAWei, uint reserveBWei) = DolomiteAmmLibrary.getReservesWei(
            address(dolomiteAmmFactory),
            tokenA,
            tokenB
        );
        if (reserveAWei == 0 && reserveBWei == 0) {
            (amountAWei, amountBWei) = (amountADesiredWei, amountBDesiredWei);
        } else {
            uint amountBOptimal = DolomiteAmmLibrary.quote(amountADesiredWei, reserveAWei, reserveBWei);
            if (amountBOptimal <= amountBDesiredWei) {
                Require.that(
                    amountBOptimal >= amountBMinWei,
                    FILE,
                    "insufficient B amount",
                    amountBOptimal,
                    amountBMinWei
                );
                (amountAWei, amountBWei) = (amountADesiredWei, amountBOptimal);
            } else {
                uint amountAOptimal = DolomiteAmmLibrary.quote(amountBDesiredWei, reserveBWei, reserveAWei);
                assert(amountAOptimal <= amountADesiredWei);
                Require.that(
                    amountAOptimal >= amountAMinWei,
                    FILE,
                    "insufficient A amount",
                    amountAOptimal,
                    amountAMinWei
                );
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
            Require.that(
                cache.params.marginDeposit != 0,
                FILE,
                "invalid margin deposit"
            );

            uint expiryActionCount = cache.params.expiryTimeDelta == 0 ? 0 : 1;
            actions = new Actions.ActionArgs[](pools.length + 1 + expiryActionCount);

            // `accountNumber` `0` is at index `accountsLength - 1`

            bool isWithdrawal = !cache.params.isPositiveMarginDeposit;
            // solium-disable indentation
            actions[actions.length - 1 - expiryActionCount] = _encodeTransferAction(
                /* from */ isWithdrawal ? 0 : accounts.length - 1,
                /* to */ isWithdrawal ? accounts.length - 1 : 0,
                cache.dolomiteMargin.getMarketIdByTokenAddress(cache.params.depositToken),
                cache.params.marginDeposit
            );
            // solium-enable indentation
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
            Require.that(
                accounts[i + 1].owner == pools[i],
                FILE,
                "invalid other address"
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
            Require.that(
                uint128(amount.value) == amount.value,
                FILE,
                "invalid asset amount"
            );
            return Interest.parToWei(
                Types.Par({sign : amount.sign, value : uint128(amount.value)}),
                cache.dolomiteMargin.getMarketCurrentIndex(marketId)
            ).value;
        }
    }

    function _logEvents(
        ModifyPositionCache memory cache,
        Account.Info[] memory accounts
    ) internal {
        if (cache.params.isPositiveMarginDeposit && cache.params.accountNumber > 0) {
            Types.Par memory newOutputPar = cache.dolomiteMargin.getAccountPar(
                accounts[0],
                cache.marketPath[cache.marketPath.length - 1]
            );

            emit MarginPositionOpen(
                msg.sender,
                cache.params.accountNumber,
                cache.params.tokenPath[0],
                cache.params.tokenPath[cache.params.tokenPath.length - 1],
                cache.params.depositToken,
                Events.BalanceUpdate({
            deltaWei : Types.Wei(false, cache.amountsWei[0]),
            newPar : cache.dolomiteMargin.getAccountPar(accounts[0], cache.marketPath[0])
            }),
                Events.BalanceUpdate({
            deltaWei : Types.Wei(true, cache.amountsWei[cache.amountsWei.length - 1]),
            newPar : newOutputPar
            }),
                Events.BalanceUpdate({
            deltaWei : Types.Wei(true, cache.marginDepositDeltaWei),
            newPar : newOutputPar
            })
            );
        } else if (cache.params.accountNumber > 0) {
            Types.Par memory newInputPar = cache.dolomiteMargin.getAccountPar(accounts[0], cache.marketPath[0]);

            emit MarginPositionClose(
                msg.sender,
                cache.params.accountNumber,
                cache.params.tokenPath[0],
                cache.params.tokenPath[cache.params.tokenPath.length - 1],
                cache.params.depositToken,
                Events.BalanceUpdate({
            deltaWei : Types.Wei(false, cache.amountsWei[0]),
            newPar : newInputPar
            }),
                Events.BalanceUpdate({
            deltaWei : Types.Wei(true, cache.amountsWei[cache.amountsWei.length - 1]),
            newPar : _getOutputPar(cache, accounts[0])
            }),
                Events.BalanceUpdate({
            deltaWei : Types.Wei(false, cache.marginDepositDeltaWei),
            newPar : newInputPar
            })
            );
        }
    }

    function _getOutputPar(
        ModifyPositionCache memory cache,
        Account.Info memory account
    ) internal view returns (Types.Par memory) {
        return cache.dolomiteMargin.getAccountPar(
            account,
            cache.marketPath[cache.marketPath.length - 1]
        );
    }

}
