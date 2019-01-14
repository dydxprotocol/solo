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
import { Manager } from "./Manager.sol";
import { Storage } from "./Storage.sol";
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Transactions
 * @author dYdX
 *
 * Logic for processing transactions
 */
contract Transactions is
    ReentrancyGuard,
    Storage,
    Manager
{

    // ============ Public Functions ============

    function transact(
        Acct.Info[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        Cache memory cache = cacheInitialize(accounts);

        for (uint256 i = 0; i < args.length; i++) {
            _transact(cache, args[i]);
        }

        cacheStore(cache);
    }

    // ============ Private Functions ============

    function _transact(
        Cache memory cache,
        Actions.TransactionArgs memory args
    )
        private
    {
        Actions.TransactionType ttype = args.transactionType;

        if (ttype == Actions.TransactionType.Deposit) {
            _deposit(cache, Actions.parseDepositArgs(args));
        }
        else if (ttype == Actions.TransactionType.Withdraw) {
            _withdraw(cache, Actions.parseWithdrawArgs(args));
        }
        else if (ttype == Actions.TransactionType.Transfer) {
            _transfer(cache, Actions.parseTransferArgs(args));
        }
        else if (ttype == Actions.TransactionType.Buy) {
            _buy(cache, Actions.parseBuyArgs(args));
        }
        else if (ttype == Actions.TransactionType.Sell) {
            _sell(cache, Actions.parseSellArgs(args));
        }
        else if (ttype == Actions.TransactionType.Trade) {
            _trade(cache, Actions.parseTradeArgs(args));
        }
        else if (ttype == Actions.TransactionType.Liquidate) {
            _liquidate(cache, Actions.parseLiquidateArgs(args));
        }
        else if (ttype == Actions.TransactionType.Call) {
            _call(cache, Actions.parseCallArgs(args));
        }
    }

    function _deposit(
        Cache memory cache,
        Actions.DepositArgs memory args
    )
        private
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        require(
            args.from == msg.sender || args.from == account.owner,
            "TODO_REASON"
        );

        cacheSetPrimary(cache, args.acct);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.acct,
            args.mkt,
            args.amount
        );

        cacheSetPar(
            cache,
            args.acct,
            args.mkt,
            newPar
        );

        address token = cacheGetToken(cache, args.mkt);

        // requires a positive deltaWei
        Exchange.transferIn(token, args.from, deltaWei);
    }

    function _withdraw(
        Cache memory cache,
        Actions.WithdrawArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.acct);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.acct,
            args.mkt,
            args.amount
        );

        cacheSetPar(
            cache,
            args.acct,
            args.mkt,
            newPar
        );

        address token = cacheGetToken(cache, args.mkt);

        // requires a negative deltaWei
        Exchange.transferOut(token, args.to, deltaWei);
    }

    function _transfer(
        Cache memory cache,
        Actions.TransferArgs memory args
    )
        private
        view
    {
        cacheSetPrimary(cache, args.acctOne);
        cacheSetPrimary(cache, args.acctTwo);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.acctOne,
            args.mkt,
            args.amount
        );

        cacheSetPar(
            cache,
            args.acctOne,
            args.mkt,
            newPar
        );

        cacheSetParFromDeltaWei(
            cache,
            args.acctTwo,
            args.mkt,
            deltaWei.negative()
        );
    }

    function _buy(
        Cache memory cache,
        Actions.BuyArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.acct);

        address takerToken = cacheGetToken(cache, args.takerMkt);
        address makerToken = cacheGetToken(cache, args.makerMkt);

        (
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.acct,
            args.makerMkt,
            args.amount
        );

        Types.Wei memory takerWei = Exchange.getCost(
            args.exchangeWrapper,
            makerToken,
            takerToken,
            makerWei,
            args.orderData
        );

        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);
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

        cacheSetPar(
            cache,
            args.acct,
            args.makerMkt,
            makerPar
        );

        cacheSetParFromDeltaWei(
            cache,
            args.acct,
            args.takerMkt,
            takerWei
        );
    }

    function _sell(
        Cache memory cache,
        Actions.SellArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.acct);

        address takerToken = cacheGetToken(cache, args.takerMkt);
        address makerToken = cacheGetToken(cache, args.makerMkt);

        (
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.acct,
            args.takerMkt,
            args.amount
        );

        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);
        Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        cacheSetPar(
            cache,
            args.acct,
            args.takerMkt,
            takerPar
        );

        cacheSetParFromDeltaWei(
            cache,
            args.acct,
            args.makerMkt,
            makerWei
        );
    }

    function _trade(
        Cache memory cache,
        Actions.TradeArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.takerAcct);
        cacheSetTraded(cache, args.makerAcct);

        Acct.Info memory makerAccount = cacheGetAcctInfo(cache, args.makerAcct);
        Acct.Info memory takerAccount = cacheGetAcctInfo(cache, args.takerAcct);

        require(
            g_operators[makerAccount.owner][args.autoTrader],
            "TODO_REASON"
        );

        Types.Par memory oldInputPar = cacheGetPar(
            cache,
            args.inputMkt,
            args.makerAcct
        );
        (
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.takerAcct,
            args.inputMkt,
            args.amount
        );

        Types.Wei memory outputWei = IAutoTrader(args.autoTrader).getTradeCost(
            args.inputMkt,
            args.outputMkt,
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
        cacheSetPar(
            cache,
            args.makerAcct,
            args.inputMkt,
            newInputPar
        );
        cacheSetParFromDeltaWei(
            cache,
            args.makerAcct,
            args.outputMkt,
            outputWei
        );

        // set the balance for the taker
        cacheSetParFromDeltaWei(
            cache,
            args.takerAcct,
            args.inputMkt,
            inputWei.negative()
        );
        cacheSetParFromDeltaWei(
            cache,
            args.takerAcct,
            args.outputMkt,
            outputWei.negative()
        );
    }

    function _liquidate(
        Cache memory cache,
        Actions.LiquidateArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.stableAcct);
        // doesn't mark liquidAcct for permissions

        // verify that this account can be liquidated
        if (!cacheGetIsLiquidating(cache, args.liquidAcct)) {
            require(
                !cacheGetIsCollateralized(cache, args.liquidAcct),
                "TODO_REASON"
            );
            cacheSetIsLiquidating(cache, args.liquidAcct);
        }

        // verify that owed is being repaid
        require(
            cacheGetPar(cache, args.liquidAcct, args.owedMkt).isNegative(),
            "TODO_REASON"
        );

        // verify that the liquidated account has held
        require(
            cacheGetPar(cache, args.liquidAcct, args.heldMkt).isPositive(),
            "TODO_REASON"
        );

        // calculate the owed to pay back
        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = cacheGetNewParAndDeltaWei(
            cache,
            args.liquidAcct,
            args.owedMkt,
            args.amount
        );

        Types.Wei memory heldWei = _getCollateralWei(
            cache,
            owedWei,
            args.owedMkt,
            args.heldMkt
        );

        cacheSetPar(
            cache,
            args.liquidAcct,
            args.owedMkt,
            owedPar
        );

        cacheSetParFromDeltaWei(
            cache,
            args.liquidAcct,
            args.heldMkt,
            heldWei
        );

        // verify that owed is not overpaid
        require(
            !cacheGetPar(cache, args.liquidAcct, args.owedMkt).isPositive(),
            "TODO_REASON"
        );

        // verify that held is not overused
        require(
            !cacheGetPar(cache, args.liquidAcct, args.heldMkt).isNegative(),
            "TODO_REASON"
        );

        cacheSetParFromDeltaWei(
            cache,
            args.stableAcct,
            args.heldMkt,
            heldWei.negative()
        );
        cacheSetParFromDeltaWei(
            cache,
            args.stableAcct,
            args.owedMkt,
            owedWei.negative()
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _call(
        Cache memory cache,
        Actions.CallArgs memory args
    )
        private
    {
        cacheSetPrimary(cache, args.acct);

        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        ICallee(args.who).callFunction(
            msg.sender,
            account,
            args.data
        );
    }

    function _getCollateralWei(
        Cache memory cache,
        Types.Wei memory owedWei,
        uint256 owedMkt,
        uint256 heldMkt
    )
        private
        view
        returns (Types.Wei memory)
    {
        require(
            owedWei.sign,
            "TODO_REASON"
        );

        Monetary.Price memory owedPrice = cacheGetPrice(cache, owedMkt);
        Monetary.Price memory heldPrice = cacheGetPrice(cache, heldMkt);

        // get the equal-value amount of held wei
        Types.Wei memory heldWei;
        heldWei.sign = false;
        heldWei.value = Math.getPartial(
            owedWei.value,
            owedPrice.value,
            heldPrice.value
        );

        // boost the amount of held by the liquidation spread
        heldWei.value = Decimal.mul(
            heldWei.value,
            cacheGetLiquidationSpread(cache)
        );

        return heldWei;
    }
}
