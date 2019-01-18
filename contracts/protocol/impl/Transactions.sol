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
import { Events } from "./Events.sol";
import { Manager } from "./Manager.sol";
import { Storage } from "./Storage.sol";
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Require } from "../lib/Require.sol";
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
    Manager,
    Events
{
    // ============ Constants ============

    string constant FILE = "Transactions";

    // ============ Public Functions ============

    function transact(
        Acct.Info[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        Cache memory cache = cacheInitialize(accounts);

        logTransaction();

        for (uint256 i = 0; i < args.length; i++) {
            _transact(cache, args[i]);
        }

        cacheVerify(cache);
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
        else if (ttype == Actions.TransactionType.Vaporize) {
            _vaporize(cache, Actions.parseVaporizeArgs(args));
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
        Acct.Info memory account = cache.accounts[args.acct];
        cacheSetPrimary(cache, args.acct);
        updateIndex(args.mkt);

        Require.that(
            args.from == msg.sender || args.from == account.owner,
            FILE,
            "Deposit must come from sender or owner"
        );

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            account,
            args.mkt,
            args.amount
        );

        setPar(
            account,
            args.mkt,
            newPar
        );

        address token = getToken(args.mkt);

        // requires a positive deltaWei
        Exchange.transferIn(token, args.from, deltaWei);

        logDeposit(
            cache,
            args,
            deltaWei
        );
    }

    function _withdraw(
        Cache memory cache,
        Actions.WithdrawArgs memory args
    )
        private
    {
        Acct.Info memory account = cache.accounts[args.acct];
        cacheSetPrimary(cache, args.acct);
        updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            account,
            args.mkt,
            args.amount
        );

        setPar(
            account,
            args.mkt,
            newPar
        );

        address token = getToken(args.mkt);

        // requires a negative deltaWei
        Exchange.transferOut(token, args.to, deltaWei);

        logWithdraw(
            cache,
            args,
            deltaWei
        );
    }

    function _transfer(
        Cache memory cache,
        Actions.TransferArgs memory args
    )
        private
    {
        Acct.Info memory accountOne = cache.accounts[args.acctOne];
        Acct.Info memory accountTwo = cache.accounts[args.acctTwo];
        cacheSetPrimary(cache, args.acctOne);
        cacheSetPrimary(cache, args.acctTwo);
        updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            accountOne,
            args.mkt,
            args.amount
        );

        setPar(
            accountOne,
            args.mkt,
            newPar
        );

        setParFromDeltaWei(
            accountTwo,
            args.mkt,
            deltaWei.negative()
        );

        logTransfer(
            cache,
            args,
            deltaWei
        );
    }

    function _buy(
        Cache memory cache,
        Actions.BuyArgs memory args
    )
        private
    {
        Acct.Info memory account = cache.accounts[args.acct];
        cacheSetPrimary(cache, args.acct);
        updateIndex(args.takerMkt);
        updateIndex(args.makerMkt);

        address takerToken = getToken(args.takerMkt);
        address makerToken = getToken(args.makerMkt);

        (
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = getNewParAndDeltaWei(
            account,
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

        Types.Wei memory tokensReceived = Exchange.exchange(
            args.exchangeWrapper,
            account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        Require.that(
            tokensReceived.value >= makerWei.value,
            FILE,
            "Exchange must receive more than expected from getCost"
        );

        setPar(
            account,
            args.makerMkt,
            makerPar
        );

        setParFromDeltaWei(
            account,
            args.takerMkt,
            takerWei
        );

        logBuy(
            cache,
            args,
            takerWei,
            makerWei
        );
    }

    function _sell(
        Cache memory cache,
        Actions.SellArgs memory args
    )
        private
    {
        Acct.Info memory account = cache.accounts[args.acct];
        cacheSetPrimary(cache, args.acct);
        updateIndex(args.takerMkt);
        updateIndex(args.makerMkt);

        address takerToken = getToken(args.takerMkt);
        address makerToken = getToken(args.makerMkt);

        (
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = getNewParAndDeltaWei(
            account,
            args.takerMkt,
            args.amount
        );

        Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        setPar(
            account,
            args.takerMkt,
            takerPar
        );

        setParFromDeltaWei(
            account,
            args.makerMkt,
            makerWei
        );

        logSell(
            cache,
            args,
            takerWei,
            makerWei
        );
    }

    function _trade(
        Cache memory cache,
        Actions.TradeArgs memory args
    )
        private
    {
        Acct.Info memory takerAccount = cache.accounts[args.takerAcct];
        Acct.Info memory makerAccount = cache.accounts[args.makerAcct];
        cacheSetPrimary(cache, args.takerAcct);
        cacheSetTraded(cache, args.makerAcct);
        updateIndex(args.inputMkt);
        updateIndex(args.outputMkt);

        Require.that(
            g_operators[makerAccount.owner][args.autoTrader],
            FILE,
            "AutoTrader not authorized"
        );

        Types.Par memory oldInputPar = getPar(
            makerAccount,
            args.inputMkt
        );
        (
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = getNewParAndDeltaWei(
            makerAccount,
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

        Require.that(
            outputWei.sign != inputWei.sign,
            FILE,
            "Trades cannot be one-sided"
        );

        // set the balance for the maker
        setPar(
            makerAccount,
            args.inputMkt,
            newInputPar
        );
        setParFromDeltaWei(
            makerAccount,
            args.outputMkt,
            outputWei
        );

        // set the balance for the taker
        setParFromDeltaWei(
            takerAccount,
            args.inputMkt,
            inputWei.negative()
        );
        setParFromDeltaWei(
            takerAccount,
            args.outputMkt,
            outputWei.negative()
        );

        logTrade(
            cache,
            args,
            inputWei,
            outputWei
        );
    }

    function _liquidate(
        Cache memory cache,
        Actions.LiquidateArgs memory args
    )
        private
    {
        Acct.Info memory solidAccount = cache.accounts[args.solidAcct];
        Acct.Info memory liquidAccount = cache.accounts[args.liquidAcct];
        cacheSetPrimary(cache, args.solidAcct);
        updateIndex(args.heldMkt);
        updateIndex(args.owedMkt);

        // verify liquidatable
        if (AccountStatus.Liquid != getStatus(liquidAccount)) {
            Require.that(
                cacheGetNextAccountStatus(cache, liquidAccount) == AccountStatus.Liquid,
                FILE,
                "Liquidation account must be undercollateralized"
            );
            setStatus(liquidAccount, AccountStatus.Liquid);
        }

        Types.Wei memory maxHeldWei = getWei(
            liquidAccount,
            args.heldMkt
        );

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Liquidation account must have positive collateral"
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = getNewParAndDeltaWeiForLiquidation(
            liquidAccount,
            args.owedMkt,
            args.amount
        );

        Types.Wei memory heldWei = cacheOwedWeiToHeldWei(
            cache,
            args.heldMkt,
            args.owedMkt,
            owedWei
        );

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = cacheHeldWeiToOwedWei(
                cache,
                args.owedMkt,
                args.heldMkt,
                heldWei
            );

            setPar(
                liquidAccount,
                args.heldMkt,
                Types.zeroPar()
            );
            setParFromDeltaWei(
                liquidAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            setPar(
                liquidAccount,
                args.owedMkt,
                owedPar
            );
            setParFromDeltaWei(
                liquidAccount,
                args.heldMkt,
                heldWei
            );
        }

        // set the balances for the solid account
        setParFromDeltaWei(
            solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        setParFromDeltaWei(
            solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        logLiquidate(
            cache,
            args,
            heldWei,
            owedWei
        );
    }

    function _vaporize(
        Cache memory cache,
        Actions.VaporizeArgs memory args
    )
        private
    {
        Acct.Info memory solidAccount = cache.accounts[args.solidAcct];
        Acct.Info memory vaporAccount = cache.accounts[args.vaporAcct];
        cacheSetPrimary(cache, args.solidAcct);
        updateIndex(args.heldMkt);
        updateIndex(args.owedMkt);

        // verify vaporizable
        if (AccountStatus.Vapor != getStatus(vaporAccount)) {
            Require.that(
                AccountStatus.Vapor == cacheGetNextAccountStatus(cache, vaporAccount),
                FILE,
                "Vaporization account must have only negative values"
            );
            setStatus(vaporAccount, AccountStatus.Vapor);
        }

        // First, attempt to refund using the same token
        if (vaporizeUsingExcess(vaporAccount, args.owedMkt)) {
            return;
        }

        Types.Wei memory maxHeldWei = getNumExcessTokens(args.heldMkt);

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Owner fund must have positive collateral"
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = getNewParAndDeltaWeiForLiquidation(
            vaporAccount,
            args.owedMkt,
            args.amount
        );

        Types.Wei memory heldWei = cacheOwedWeiToHeldWei(
            cache,
            args.heldMkt,
            args.owedMkt,
            owedWei
        );

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = cacheHeldWeiToOwedWei(
                cache,
                args.owedMkt,
                args.heldMkt,
                heldWei
            );

            setParFromDeltaWei(
                vaporAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            setPar(
                vaporAccount,
                args.owedMkt,
                owedPar
            );
        }

        // set the balances for the solid account
        setParFromDeltaWei(
            solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        setParFromDeltaWei(
            solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        logVaporize(
            cache,
            args,
            heldWei,
            owedWei
        );
    }

    function _call(
        Cache memory cache,
        Actions.CallArgs memory args
    )
        private
    {
        Acct.Info memory account = cache.accounts[args.acct];
        cacheSetPrimary(cache, args.acct);

        ICallee(args.callee).callFunction(
            msg.sender,
            account,
            args.data
        );

        logCall(
            cache,
            args
        );
    }
}
