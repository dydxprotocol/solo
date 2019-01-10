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

import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { Storage } from "./Storage.sol";
import { WorldManager } from "./WorldManager.sol";
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Types } from "../lib/Types.sol";


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

    // ============ Public Functions ============

    function transact(
        Acct.Info[] memory accounts,
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
        else if (ttype == Actions.TransactionType.Buy) {
            _buy(worldState, Actions.parseBuyArgs(args));
        }
        else if (ttype == Actions.TransactionType.Sell) {
            _sell(worldState, Actions.parseSellArgs(args));
        }
        else if (ttype == Actions.TransactionType.Trade) {
            _trade(worldState, Actions.parseTradeArgs(args));
        }
        else if (ttype == Actions.TransactionType.Liquidate) {
            _liquidate(worldState, Actions.parseLiquidateArgs(args));
        }
        else if (ttype == Actions.TransactionType.Vaporize) {
            _vaporize(worldState, Actions.parseVaporizeArgs(args));
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
        Acct.Info memory account = wsGetAcctInfo(worldState, args.accountId);

        require(
            args.from == msg.sender || args.from == account.owner,
            "TODO_REASON"
        );

        wsSetPrimary(worldState, args.accountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetPar(
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
        wsSetPrimary(worldState, args.accountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetPar(
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
        wsSetPrimary(worldState, args.accountId);
        wsSetPrimary(worldState, args.otherAccountId);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetPar(
            worldState,
            args.accountId,
            args.marketId,
            newPar
        );

        wsSetParFromDeltaWei(
            worldState,
            args.otherAccountId,
            args.marketId,
            deltaWei.negative()
        );
    }

    function _buy(
        WorldState memory worldState,
        Actions.BuyArgs memory args
    )
        private
    {
        wsSetPrimary(worldState, args.accountId);

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

        Acct.Info memory account = wsGetAcctInfo(worldState, args.accountId);
        Types.Wei memory tokensReceived = Exchange.exchange(
            args.exchangeWrapper,
            account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        require(
            tokensReceived.value >= makerWei.value,
            "TODO_REASON"
        );

        wsSetPar(
            worldState,
            args.accountId,
            args.makerMarketId,
            makerPar
        );

        wsSetParFromDeltaWei(
            worldState,
            args.accountId,
            args.takerMarketId,
            takerWei
        );
    }

    function _sell(
        WorldState memory worldState,
        Actions.SellArgs memory args
    )
        private
    {
        wsSetPrimary(worldState, args.accountId);

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

        Acct.Info memory account = wsGetAcctInfo(worldState, args.accountId);
        Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        wsSetPar(
            worldState,
            args.accountId,
            args.takerMarketId,
            takerPar
        );

        wsSetParFromDeltaWei(
            worldState,
            args.accountId,
            args.makerMarketId,
            makerWei
        );
    }

    function _trade(
        WorldState memory worldState,
        Actions.TradeArgs memory args
    )
        private
    {
        wsSetTraded(worldState, args.makerAccountId);
        wsSetPrimary(worldState, args.accountId);

        Acct.Info memory makerAccount = wsGetAcctInfo(worldState, args.makerAccountId);
        Acct.Info memory takerAccount = wsGetAcctInfo(worldState, args.accountId);

        require(
            g_operators[makerAccount.owner][args.tradeContract],
            "TODO_REASON"
        );

        Types.Par memory oldInputPar = wsGetPar(
            worldState,
            args.inputMarketId,
            args.makerAccountId
        );
        (
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = wsGetNewParAndDeltaWei(
            worldState,
            args.accountId,
            args.inputMarketId,
            args.amount
        );

        Types.Wei memory outputWei = IAutoTrader(args.tradeContract).getTradeCost(
            args.inputMarketId,
            args.outputMarketId,
            makerAccount,
            takerAccount,
            oldInputPar,
            newInputPar,
            inputWei,
            args.tradeData
        );

        require(
            outputWei.sign != inputWei.sign,
            "TODO_REASON"
        );

        // set the balance for the maker
        wsSetPar(
            worldState,
            args.makerAccountId,
            args.inputMarketId,
            newInputPar
        );
        wsSetParFromDeltaWei(
            worldState,
            args.makerAccountId,
            args.outputMarketId,
            outputWei
        );

        // set the balance for the taker
        wsSetParFromDeltaWei(
            worldState,
            args.accountId,
            args.inputMarketId,
            inputWei.negative()
        );
        wsSetParFromDeltaWei(
            worldState,
            args.accountId,
            args.outputMarketId,
            outputWei.negative()
        );
    }

    function _liquidate(
        WorldState memory worldState,
        Actions.LiquidateArgs memory args
    )
        private
    {
        wsSetPrimary(worldState, args.solidAccountId);

        // verify liquidatable
        if (AccountStatus.Liquidating != wsGetAccountStatus(worldState, args.liquidAccountId)) {
            require(
                wsGetNextAccountStatus(worldState, args.liquidAccountId) == AccountStatus.Liquidating,
                "TODO_REASON"
            );
            wsSetAccountStatus(worldState, args.liquidAccountId, AccountStatus.Liquidating);
        }

        Types.Wei memory maxCollateralWei = wsGetWei(
            worldState,
            args.liquidAccountId,
            args.collateralMarketId
        ).negative();

        require(
            maxCollateralWei.isNegative(),
            "TODO_REASON"
        );

        (
            Types.Par memory underwaterPar,
            Types.Wei memory underwaterWei
        ) = wsGetNewParAndDeltaWeiForLiquidation(
            worldState,
            args.liquidAccountId,
            args.underwaterMarketId,
            args.amount
        );

        Types.Wei memory collateralWei = wsGetCollateralWeiFromUnderwaterWei(
            worldState,
            args.collateralMarketId,
            args.underwaterMarketId,
            underwaterWei
        );

        // if attempting to over-borrow the collateral asset, bound it by the maximum
        if (collateralWei.value > maxCollateralWei.value) {
            collateralWei = maxCollateralWei;
            underwaterWei = wsGetUnderwaterWeiFromCollateralWei(
                worldState,
                args.underwaterMarketId,
                args.collateralMarketId,
                collateralWei
            );

            wsSetPar(
                worldState,
                args.liquidAccountId,
                args.collateralMarketId,
                Types.zeroPar()
            );
            wsSetParFromDeltaWei(
                worldState,
                args.liquidAccountId,
                args.underwaterMarketId,
                underwaterWei
            );
        } else {
            wsSetPar(
                worldState,
                args.liquidAccountId,
                args.underwaterMarketId,
                underwaterPar
            );
            wsSetParFromDeltaWei(
                worldState,
                args.liquidAccountId,
                args.collateralMarketId,
                collateralWei
            );
        }

        // set the balances for the solid account
        wsSetParFromDeltaWei(
            worldState,
            args.solidAccountId,
            args.underwaterMarketId,
            underwaterWei.negative()
        );
        wsSetParFromDeltaWei(
            worldState,
            args.solidAccountId,
            args.collateralMarketId,
            collateralWei.negative()
        );
    }

    function _vaporize(
        WorldState memory worldState,
        Actions.VaporizeArgs memory args
    )
        private
    {
        wsSetPrimary(worldState, args.solidAccountId);

        // verify vaporizable
        if (AccountStatus.Vaporizing != wsGetAccountStatus(worldState, args.vaporAccountId)) {
            require(
                AccountStatus.Vaporizing == wsGetNextAccountStatus(worldState, args.vaporAccountId),
                "TODO_REASON"
            );
            wsSetAccountStatus(worldState, args.vaporAccountId, AccountStatus.Vaporizing);
        }

        // TODO: the case where collateralMarketId == underwaterMarketId

        Types.Wei memory maxCollateralWei = wsGetNumExcessTokens(
            worldState,
            args.collateralMarketId
        ).negative();

        require(
            maxCollateralWei.isNegative(),
            "TODO_REASON"
        );

        (
            Types.Par memory underwaterPar,
            Types.Wei memory underwaterWei
        ) = wsGetNewParAndDeltaWeiForLiquidation(
            worldState,
            args.vaporAccountId,
            args.underwaterMarketId,
            args.amount
        );

        Types.Wei memory collateralWei = wsGetCollateralWeiFromUnderwaterWei(
            worldState,
            args.collateralMarketId,
            args.underwaterMarketId,
            underwaterWei
        );

        // if attempting to over-borrow the collateral asset, bound it by the maximum
        if (collateralWei.value > maxCollateralWei.value) {
            collateralWei = maxCollateralWei;
            underwaterWei = wsGetUnderwaterWeiFromCollateralWei(
                worldState,
                args.underwaterMarketId,
                args.collateralMarketId,
                collateralWei
            );

            wsSetParFromDeltaWei(
                worldState,
                args.vaporAccountId,
                args.underwaterMarketId,
                underwaterWei
            );
        } else {
            wsSetPar(
                worldState,
                args.vaporAccountId,
                args.underwaterMarketId,
                underwaterPar
            );
        }

        // set the balances for the solid account
        wsSetParFromDeltaWei(
            worldState,
            args.solidAccountId,
            args.underwaterMarketId,
            underwaterWei.negative()
        );
        wsSetParFromDeltaWei(
            worldState,
            args.solidAccountId,
            args.collateralMarketId,
            collateralWei.negative()
        );
    }

    function _call(
        WorldState memory worldState,
        Actions.CallArgs memory args
    )
        private
    {
        wsSetPrimary(worldState, args.accountId);

        Acct.Info memory account = wsGetAcctInfo(worldState, args.accountId);

        ICallee(args.who).callFunction(
            msg.sender,
            account,
            args.data
        );
    }
}
