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

import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Events } from "../lib/Events.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title InteractionImpl
 * @author dYdX
 *
 * Logic for processing actions
 */
library InteractionImpl {
    using Storage for Storage.State;
    using Types for Types.Wei;

    // ============ Constants ============

    string constant FILE = "InteractionImpl";

    // ============ Public Functions ============

    function transact(
        Storage.State storage state,
        Acct.Info[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
    {
        Events.logTransaction();

        bool[] memory primary = new bool[](accounts.length);
        bool[] memory traded = new bool[](accounts.length);

        for (uint256 i = 0; i < args.length; i++) {
            Actions.TransactionArgs memory arg = args[i];
            Actions.TransactionType ttype = arg.transactionType;

            if (ttype == Actions.TransactionType.Deposit) {
                _deposit(state, Actions.parseDepositArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Withdraw) {
                _withdraw(state, Actions.parseWithdrawArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Transfer) {
                _transfer(state, Actions.parseTransferArgs(accounts, arg));
                primary[arg.accountId] = true;
            }
            else if (ttype == Actions.TransactionType.Buy) {
                _buy(state, Actions.parseBuyArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Sell) {
                _sell(state, Actions.parseSellArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Trade) {
                _trade(state, Actions.parseTradeArgs(accounts, arg));
                traded[arg.accountId] = true;
            }
            else if (ttype == Actions.TransactionType.Liquidate) {
                _liquidate(state, Actions.parseLiquidateArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Vaporize) {
                _vaporize(state, Actions.parseVaporizeArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Call) {
                _call(state, Actions.parseCallArgs(accounts, arg));
            }
            primary[arg.accountId] = true;
        }

        _verify(
            state,
            accounts,
            primary,
            traded
        );
    }

    function _verify(
        Storage.State storage state,
        Acct.Info[] memory accounts,
        bool[] memory primary,
        bool[] memory traded
    )
        private
    {
        Monetary.Value memory minBorrowedValue = state.riskParams.minBorrowedValue;

        for (uint256 a = 0; a < accounts.length; a++) {
            Acct.Info memory account = accounts[a];

            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = state.getValues(account);

            // check minimum borrowed value for all accounts
            Require.that(
                borrowValue.value == 0 || borrowValue.value >= minBorrowedValue.value,
                FILE,
                "Borrow value too low",
                a
            );

            // check collateralization for non-liquidated accounts
            if (primary[a] || traded[a]) {
                Require.that(
                    state.valuesToStatus(supplyValue, borrowValue) == Acct.Status.Normal,
                    FILE,
                    "Undercollateralized account",
                    a
                );
                if (state.getStatus(account) != Acct.Status.Normal) {
                    state.setStatus(account, Acct.Status.Normal);
                }
            }

            // check permissions for primary accounts
            if (primary[a]) {
                Require.that(
                    account.owner == msg.sender || state.operators[account.owner][msg.sender],
                    FILE,
                    "Unpermissioned account",
                    a
                );
            }
        }
    }

    // ============ Private Functions ============

    function _deposit(
        Storage.State storage state,
        Actions.DepositArgs memory args
    )
        private
    {
        state.updateIndex(args.mkt);

        Require.that(
            args.from == msg.sender || args.from == args.account.owner,
            FILE,
            "Invalid deposit source"
        );

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.mkt,
            args.amount
        );

        state.setPar(
            args.account,
            args.mkt,
            newPar
        );

        // requires a positive deltaWei
        Exchange.transferIn(
            state.getToken(args.mkt),
            args.from,
            deltaWei
        );

        Events.logDeposit(
            state,
            args,
            deltaWei
        );
    }

    function _withdraw(
        Storage.State storage state,
        Actions.WithdrawArgs memory args
    )
        private
    {
        state.updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.mkt,
            args.amount
        );

        state.setPar(
            args.account,
            args.mkt,
            newPar
        );

        // requires a negative deltaWei
        Exchange.transferOut(
            state.getToken(args.mkt),
            args.to,
            deltaWei
        );

        Events.logWithdraw(
            state,
            args,
            deltaWei
        );
    }

    function _transfer(
        Storage.State storage state,
        Actions.TransferArgs memory args
    )
        private
    {
        state.updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.accountOne,
            args.mkt,
            args.amount
        );

        state.setPar(
            args.accountOne,
            args.mkt,
            newPar
        );

        state.setParFromDeltaWei(
            args.accountTwo,
            args.mkt,
            deltaWei.negative()
        );

        Events.logTransfer(
            state,
            args,
            deltaWei
        );
    }

    function _buy(
        Storage.State storage state,
        Actions.BuyArgs memory args
    )
        private
    {
        state.updateIndex(args.takerMkt);
        state.updateIndex(args.makerMkt);

        address takerToken = state.getToken(args.takerMkt);
        address makerToken = state.getToken(args.makerMkt);

        (
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = state.getNewParAndDeltaWei(
            args.account,
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
            args.account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        Require.that(
            tokensReceived.value >= makerWei.value,
            FILE,
            "Buy amount less than promised"
        );

        state.setPar(
            args.account,
            args.makerMkt,
            makerPar
        );

        state.setParFromDeltaWei(
            args.account,
            args.takerMkt,
            takerWei
        );

        Events.logBuy(
            state,
            args,
            takerWei,
            makerWei
        );
    }

    function _sell(
        Storage.State storage state,
        Actions.SellArgs memory args
    )
        private
    {
        state.updateIndex(args.takerMkt);
        state.updateIndex(args.makerMkt);

        address takerToken = state.getToken(args.takerMkt);
        address makerToken = state.getToken(args.makerMkt);

        (
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.takerMkt,
            args.amount
        );

        Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            args.account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

        state.setPar(
            args.account,
            args.takerMkt,
            takerPar
        );

        state.setParFromDeltaWei(
            args.account,
            args.makerMkt,
            makerWei
        );

        Events.logSell(
            state,
            args,
            takerWei,
            makerWei
        );
    }

    function _trade(
        Storage.State storage state,
        Actions.TradeArgs memory args
    )
        private
    {
        state.updateIndex(args.inputMkt);
        state.updateIndex(args.outputMkt);

        Require.that(
            state.operators[args.makerAccount.owner][args.autoTrader],
            FILE,
            "Unpermissioned AutoTrader"
        );

        Types.Par memory oldInputPar = state.getPar(
            args.makerAccount,
            args.inputMkt
        );
        (
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = state.getNewParAndDeltaWei(
            args.makerAccount,
            args.inputMkt,
            args.amount
        );

        Types.Wei memory outputWei = IAutoTrader(args.autoTrader).getTradeCost(
            args.inputMkt,
            args.outputMkt,
            args.makerAccount,
            args.takerAccount,
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
        state.setPar(
            args.makerAccount,
            args.inputMkt,
            newInputPar
        );
        state.setParFromDeltaWei(
            args.makerAccount,
            args.outputMkt,
            outputWei
        );

        // set the balance for the taker
        state.setParFromDeltaWei(
            args.takerAccount,
            args.inputMkt,
            inputWei.negative()
        );
        state.setParFromDeltaWei(
            args.takerAccount,
            args.outputMkt,
            outputWei.negative()
        );

        Events.logTrade(
            state,
            args,
            inputWei,
            outputWei
        );
    }

    function _liquidate(
        Storage.State storage state,
        Actions.LiquidateArgs memory args
    )
        private
    {
        state.updateIndex(args.heldMkt);
        state.updateIndex(args.owedMkt);

        // verify liquidatable
        if (Acct.Status.Liquid != state.getStatus(args.liquidAccount)) {
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = state.getValues(args.liquidAccount);
            Require.that(
                Acct.Status.Liquid == state.valuesToStatus(supplyValue, borrowValue),
                FILE,
                "Unliquidatable account"
            );
            state.setStatus(args.liquidAccount, Acct.Status.Liquid);
        }

        Types.Wei memory maxHeldWei = state.getWei(
            args.liquidAccount,
            args.heldMkt
        );

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Collateral must be positive"
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.liquidAccount,
            args.owedMkt,
            args.amount
        );

        Decimal.D256 memory priceRatio = state.fetchPriceRatio(args.owedMkt, args.heldMkt);

        Types.Wei memory heldWei = owedWeiToHeldWei(priceRatio, owedWei);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = heldWeiToOwedWei(priceRatio, heldWei);

            state.setPar(
                args.liquidAccount,
                args.heldMkt,
                Types.zeroPar()
            );
            state.setParFromDeltaWei(
                args.liquidAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            state.setPar(
                args.liquidAccount,
                args.owedMkt,
                owedPar
            );
            state.setParFromDeltaWei(
                args.liquidAccount,
                args.heldMkt,
                heldWei
            );
        }

        // set the balances for the solid account
        state.setParFromDeltaWei(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        state.setParFromDeltaWei(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        Events.logLiquidate(
            state,
            args,
            heldWei,
            owedWei
        );
    }

    function _vaporize(
        Storage.State storage state,
        Actions.VaporizeArgs memory args
    )
        private
    {
        state.updateIndex(args.heldMkt);
        state.updateIndex(args.owedMkt);

        // verify vaporizable
        if (Acct.Status.Vapor != state.getStatus(args.vaporAccount)) {
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = state.getValues(args.vaporAccount);
            Require.that(
                Acct.Status.Vapor == state.valuesToStatus(supplyValue, borrowValue),
                FILE,
                "Unvaporizable account"
            );
            state.setStatus(args.vaporAccount, Acct.Status.Vapor);
        }

        // First, attempt to refund using the same token
        if (state.vaporizeUsingExcess(args.vaporAccount, args.owedMkt)) {
            return;
        }

        Types.Wei memory maxHeldWei = state.getNumExcessTokens(args.heldMkt);

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Excess token must be positive"
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.vaporAccount,
            args.owedMkt,
            args.amount
        );

        Decimal.D256 memory priceRatio = state.fetchPriceRatio(args.owedMkt, args.heldMkt);

        Types.Wei memory heldWei = owedWeiToHeldWei(priceRatio, owedWei);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = heldWeiToOwedWei(priceRatio, heldWei);

            state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            state.setPar(
                args.vaporAccount,
                args.owedMkt,
                owedPar
            );
        }

        // set the balances for the solid account
        state.setParFromDeltaWei(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        state.setParFromDeltaWei(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        Events.logVaporize(
            state,
            args,
            heldWei,
            owedWei
        );
    }

    function _call(
        Storage.State storage state,
        Actions.CallArgs memory args
    )
        private
    {
        ICallee(args.callee).callFunction(
            msg.sender,
            args.account,
            args.data
        );

        Events.logCall(args);
    }

    // ============ Private Functions ============

    function owedWeiToHeldWei(
        Decimal.D256 memory priceRatio,
        Types.Wei memory owedWei
    )
        private
        pure
        returns (Types.Wei memory)
    {
        return Types.Wei({
            sign: false,
            value: Decimal.mul(owedWei.value, priceRatio)
        });
    }

    function heldWeiToOwedWei(
        Decimal.D256 memory priceRatio,
        Types.Wei memory heldWei
    )
        private
        pure
        returns (Types.Wei memory)
    {
        return Types.Wei({
            sign: true,
            value: Decimal.div(heldWei.value, priceRatio)
        });
    }
}
