/*

    Copyright 2018 dYdX Trading Inc.

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

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { Storage } from "./Storage.sol";
import { WorldManager } from "./WorldManager.sol";
import { Accountz } from "../lib/Accountz.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Time } from "../lib/Time.sol";
import { Types } from "../lib/Types.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";


/**
 * @title TransactionLogic
 * @author dYdX
 *
 * Logic for processing transactions
 */
contract TransactionLogic is
    ReentrancyGuard,
    Storage,
    WorldManager
{
    using Math for uint256;
    using SafeMath for uint256;
    using Time for uint32;

    // ============ Public Functions ============

    function transact(
        Accountz.Info[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        WorldState memory worldState = wsInitialize(accounts);

        for (uint256 i = 0; i < args.length; i++) {
            _transact(worldState, args[i]);
        }

        wsStore(worldState);
    }

    // ============ Private Functions ============

    function _transact(
        WorldState memory worldState,
        Actions.TransactionArgs memory args
    )
        private
    {
        Actions.TransactionType ttype = args.transactionType;

        if (ttype == Actions.TransactionType.Deposit) {
            _deposit(worldState, Actions.parseDepositArgs(args));
        }
        else if (ttype == Actions.TransactionType.Withdraw) {
            _withdraw(worldState, Actions.parseWithdrawArgs(args));
        }
        else if (ttype == Actions.TransactionType.Transfer) {
            _transfer(worldState, Actions.parseTransferArgs(args));
        }
        else if (ttype == Actions.TransactionType.ExtBuy) {
            _extbuy(worldState, Actions.parseExtBuyArgs(args));
        }
        else if (ttype == Actions.TransactionType.ExtSell) {
            _extsell(worldState, Actions.parseExtSellArgs(args));
        }
        else if (ttype == Actions.TransactionType.IntBuy) {
            _intbuy(worldState, Actions.parseIntBuyArgs(args));
        }
        else if (ttype == Actions.TransactionType.IntSell) {
            _intsell(worldState, Actions.parseIntSell(args));
        }
        else if (ttype == Actions.TransactionType.Liquidate) {
            _liquidate(worldState, Actions.parseLiquidateArgs(args));
        }
        else if (ttype == Actions.TransactionType.Call) {
            _call(worldState, Actions.parseCallArgs(args));
        }
    }

    function _deposit(
        WorldState memory worldState,
        Actions.DepositArgs memory args
    )
        private
    {
        Accountz.Info memory accountInfo = wsGetAccountzInfo(worldState, args.accountId);

        require(
            args.from == msg.sender || args.from == accountInfo.owner,
            "TODO_REASON"
        );

        wsSetCheckPerimissions(worldState, args.accountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetBalance(
            worldState,
            args.accountId,
            args.marketId,
            newPar
        );

        address token = wsGetToken(worldState, args.marketId);

        // requires a positive deltaWei
        Exchange.transferIn(token, args.from, deltaWei);
    }

    function _withdraw(
        WorldState memory worldState,
        Actions.WithdrawArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetBalance(
            worldState,
            args.accountId,
            args.marketId,
            newPar
        );

        address token = wsGetToken(worldState, args.marketId);

        // requires a negative deltaWei
        Exchange.transferOut(token, args.to, deltaWei);
    }

    function _transfer(
        WorldState memory worldState,
        Actions.TransferArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetCheckPerimissions(worldState, args.otherAccountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetBalance(
            worldState,
            args.accountId,
            args.marketId,
            newPar
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.otherAccountId,
            args.marketId,
            deltaWei.negative()
        );
    }

    function _extbuy(
        WorldState memory worldState,
        Actions.ExtBuyArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address takerToken = wsGetToken(worldState, args.takerMarketId);
        address makerToken = wsGetToken(worldState, args.makerMarketId);

        (
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.makerMarketId,
            args.amount
        );

        Types.Wei memory takerWei = Exchange.getCost(
            args.exchangeWrapper,
            makerToken,
            takerToken,
            makerWei,
            args.orderData
        );

        Accountz.Info memory accountInfo = wsGetAccountzInfo(worldState, args.accountId);
        Types.Wei memory tokensReceived = Exchange.exchange(
            args.exchangeWrapper,
            accountInfo.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        require(
            tokensReceived.value >= makerWei.value,
            "TODO_REASON"
        );

        wsSetBalance(
            worldState,
            args.accountId,
            args.makerMarketId,
            makerPar
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.accountId,
            args.takerMarketId,
            takerWei
        );
    }

    function _extsell(
        WorldState memory worldState,
        Actions.ExtSellArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address takerToken = wsGetToken(worldState, args.takerMarketId);
        address makerToken = wsGetToken(worldState, args.makerMarketId);

        (
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.takerMarketId,
            args.amount
        );

        Accountz.Info memory accountInfo = wsGetAccountzInfo(worldState, args.accountId);
        Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            accountInfo.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        wsSetBalance(
            worldState,
            args.accountId,
            args.takerMarketId,
            takerPar
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.accountId,
            args.makerMarketId,
            makerWei
        );
    }

    function _intbuy(
        WorldState memory worldState,
        Actions.IntBuyArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        // !! Does not use WorldState, goes straight to storage
        Accountz.Info memory takerInfo = wsGetAccountzInfo(worldState, args.accountId);
        Accountz.Info memory makerInfo = wsGetAccountzInfo(worldState, args.makerAccountId);

        require(
            g_operators[makerInfo.owner][args.autoTrader],
            "TODO_REASON"
        );

        Actions.AssetAmount memory makerAmount = _getTradeCostRecurse(
            args.autoTrader,
            args.makerMarketId,
            args.takerMarketId,
            makerInfo,
            takerInfo,
            args.amount,
            args.data
        );

        // TODO transfer the funds between accounts
    }

    function _intsell(
        WorldState memory worldState,
        Actions.IntBuyArgs memory args
    )
        private
    {
        // TODO
    }

    function _liquidate(
        WorldState memory worldState,
        Actions.LiquidateArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.stableAccountId);
        // doesn't mark liquidAccountId for permissions

        // verify that this account can be liquidated
        if (!wsGetIsLiquidating(worldState, args.liquidAccountId)) {
            require(
                !_isCollateralized(worldState, args.liquidAccountId),
                "TODO_REASON"
            );
            wsSetIsLiquidating(worldState, args.liquidAccountId);
        }

        // verify that underwater is being repaid
        require(
            wsGetBalance(worldState, args.liquidAccountId, args.underwaterMarketId).isNonPositive(),
            "TODO_REASON"
        );

        // verify that the liquidated account has collateral
        require(
            wsGetBalance(worldState, args.liquidAccountId, args.collateralMarketId).isNonNegative(),
            "TODO_REASON"
        );


        // calculate the underwater to pay back
        (
            Types.Par memory underwaterPar,
            Types.Wei memory underwaterWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.liquidAccountId,
            args.underwaterMarketId,
            args.amount
        );

        Types.Wei memory collateralWei = _getCollateralWei(
            worldState,
            underwaterWei,
            args.underwaterMarketId,
            args.collateralMarketId
        );

        wsSetBalance(
            worldState,
            args.liquidAccountId,
            args.underwaterMarketId,
            underwaterPar
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.liquidAccountId,
            args.collateralMarketId,
            collateralWei
        );

        // verify that underwater is not overpaid
        require(
            wsGetBalance(worldState, args.liquidAccountId, args.underwaterMarketId).isNonPositive(),
            "TODO_REASON"
        );

        // verify that collateral is not overused
        require(
            wsGetBalance(worldState, args.liquidAccountId, args.collateralMarketId).isNonNegative(),
            "TODO_REASON"
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.stableAccountId,
            args.collateralMarketId,
            collateralWei.negative()
        );
        wsSetBalanceFromDeltaWei(
            worldState,
            args.stableAccountId,
            args.underwaterMarketId,
            underwaterWei.negative()
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _call(
        WorldState memory worldState,
        Actions.CallArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        // !! Does not use WorldState, goes straight to storage
        Accountz.Info memory accountInfo = wsGetAccountzInfo(worldState, args.accountId);

        _callRecurse(
            args.who,
            accountInfo,
            args.data
        );
    }

    function _getCollateralWei(
        WorldState memory worldState,
        Types.Wei memory underwaterWei,
        uint256 underwaterMarketId,
        uint256 collateralMarketId
    )
        private
        view
        returns (Types.Wei memory)
    {
        require(
            underwaterWei.sign,
            "TODO_REASON"
        );

        Monetary.Price memory underwaterPrice = wsGetPrice(worldState, underwaterMarketId);
        Monetary.Price memory collateralPrice = wsGetPrice(worldState, collateralMarketId);

        // get the equal-value amount of collateral wei
        Types.Wei memory collateralWei;
        collateralWei.sign = false;
        collateralWei.value = Math.getPartial(
            underwaterWei.value,
            underwaterPrice.value,
            collateralPrice.value
        );

        // boost the amount of collateral by the liquidation spread
        collateralWei.value = Decimal.mul(wsGetLiquidationSpread(worldState), collateralWei.value);
        return collateralWei;
    }

    function _callRecurse(
        address callee,
        Accountz.Info memory accountInfo,
        bytes memory data
    )
        private
    {
        (
            address nextCallee,
            bytes memory nextData
        ) = ICallee(callee).callFunction(
            msg.sender,
            accountInfo,
            data
        );

        require(
            nextCallee != address(0),
            "TransactionLogic#_callRecurse: Call Failed"
        );

        if (callee != nextCallee) {
            _callRecurse(
                nextCallee,
                accountInfo,
                nextData
            );
        }
    }

    function _getTradeCostRecurse(
        address trader,
        uint256 makerAsset,
        uint256 takerAsset,
        Accountz.Info memory makerInfo,
        Accountz.Info memory takerInfo,
        Actions.AssetAmount memory takerAssetAmount,
        bytes memory data
    )
        private
        returns (Actions.AssetAmount memory)
    {
        (
            address nextTrader,
            Actions.AssetAmount memory amount,
            bytes memory nextData
        ) = IAutoTrader(trader).getTradeCost(
            makerAsset,
            takerAsset,
            msg.sender,
            makerInfo,
            takerInfo,
            takerAssetAmount,
            data
        );

        require(
            nextTrader != address(0),
            "TransactionLogic#_getTradeCostRecurse: getTradeCost failed"
        );

        if (nextTrader != trader) {
            return _getTradeCostRecurse(
                nextTrader,
                makerAsset,
                takerAsset,
                makerInfo,
                takerInfo,
                takerAssetAmount,
                nextData
            );
        }

        return amount;
    }
}
