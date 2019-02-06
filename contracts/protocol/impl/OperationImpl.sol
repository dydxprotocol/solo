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
import { Account } from "../lib/Account.sol";
import { Actions } from "../lib/Actions.sol";
import { Events } from "../lib/Events.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title OperationImpl
 * @author dYdX
 *
 * Logic for processing actions
 */
library OperationImpl {
    using Storage for Storage.State;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    string constant FILE = "OperationImpl";

    // ============ Public Functions ============

    function operate(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        public
    {
        _verifyNoDuplicateAccounts(accounts);

        (
            bool[] memory primaryAccounts,
            Monetary.Price[] memory priceCache
        ) = _getRelevantAccountsAndMarkets(
            state,
            accounts,
            actions
        );

        _runActions(
            state,
            accounts,
            actions,
            priceCache
        );

        _verifyAccountCollateralization(
            state,
            accounts,
            primaryAccounts,
            priceCache
        );
    }

    // ============ Helper Functions ============

    function _verifyNoDuplicateAccounts(
        Account.Info[] memory accounts
    )
        private
        pure
    {
        for (uint256 a = 0; a < accounts.length; a++) {
            for (uint256 b = a + 1; b < accounts.length; b++) {
                Require.that(
                    !Account.equals(accounts[a], accounts[b]),
                    FILE,
                    "Cannot duplicate accounts",
                    a,
                    b
                );
            }
        }
    }

    function _getRelevantAccountsAndMarkets(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        private
        returns (
            bool[] memory,
            Monetary.Price[] memory
        )
    {
        uint256 numMarkets = state.numMarkets;
        Monetary.Price[] memory priceCache = new Monetary.Price[](numMarkets);
        bool[] memory primaryAccounts = new bool[](accounts.length);

        // keep track of primary accounts and indexes that need updating
        for (uint256 i = 0; i < actions.length; i++) {
            Actions.ActionArgs memory arg = actions[i];
            Actions.ActionType ttype = arg.actionType;
            Actions.MarketLayout marketLayout = Actions.getMarketLayout(ttype);
            Actions.AccountLayout accountLayout = Actions.getAccountLayout(ttype);

            // parse out primary accounts
            if (accountLayout != Actions.AccountLayout.OnePrimary) {
                Require.that(
                    arg.accountId != arg.otherAccountId,
                    FILE,
                    "Accounts must be distinct"
                );
                if (accountLayout == Actions.AccountLayout.TwoPrimary) {
                    primaryAccounts[arg.otherAccountId] = true;
                } else {
                    assert(accountLayout == Actions.AccountLayout.PrimaryAndSecondary);
                    Require.that(
                        !primaryAccounts[arg.otherAccountId],
                        FILE,
                        "Requires non-primary account",
                        arg.otherAccountId
                    );
                }
            }
            primaryAccounts[arg.accountId] = true;

            // keep track of indexes to update
            if (marketLayout == Actions.MarketLayout.OneMarket) {
                _updateIndexAndPrice(state, priceCache, arg.primaryMarketId);
            } else if (marketLayout == Actions.MarketLayout.TwoMarkets) {
                Require.that(
                    arg.primaryMarketId != arg.secondaryMarketId,
                    FILE,
                    "Markets must be distinct"
                );
                _updateIndexAndPrice(state, priceCache, arg.primaryMarketId);
                _updateIndexAndPrice(state, priceCache, arg.secondaryMarketId);
            } else {
                assert(marketLayout == Actions.MarketLayout.ZeroMarkets);
            }
        }

        // get any other markets for which an account has a balance
        for (uint256 m = 0; m < numMarkets; m++) {
            if (priceCache[m].value != 0) {
                continue;
            }
            for (uint256 a = 0; a < accounts.length; a++) {
                if (!state.getPar(accounts[a], m).isZero()) {
                    _updateIndexAndPrice(state, priceCache, m);
                    break;
                }
            }
        }

        return (primaryAccounts, priceCache);
    }

    function _updateIndexAndPrice(
        Storage.State storage state,
        Monetary.Price[] memory priceCache,
        uint256 marketId
    )
        private
    {
        if (priceCache[marketId].value != 0) {
            return;
        }
        priceCache[marketId] = state.fetchPrice(marketId);
        Events.logIndexUpdate(marketId, state.updateIndex(marketId));
    }

    function _runActions(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Monetary.Price[] memory priceCache
    )
        private
    {
        Events.logTransaction();

        for (uint256 i = 0; i < actions.length; i++) {
            Actions.ActionArgs memory arg = actions[i];
            Actions.ActionType ttype = arg.actionType;

            if (ttype == Actions.ActionType.Deposit) {
                _deposit(state, Actions.parseDepositArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Withdraw) {
                _withdraw(state, Actions.parseWithdrawArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Transfer) {
                _transfer(state, Actions.parseTransferArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Buy) {
                _buy(state, Actions.parseBuyArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Sell) {
                _sell(state, Actions.parseSellArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Trade) {
                _trade(state, Actions.parseTradeArgs(accounts, arg));
            }
            else if (ttype == Actions.ActionType.Liquidate) {
                _liquidate(state, Actions.parseLiquidateArgs(accounts, arg), priceCache);
            }
            else if (ttype == Actions.ActionType.Vaporize) {
                _vaporize(state, Actions.parseVaporizeArgs(accounts, arg), priceCache);
            }
            else if (ttype == Actions.ActionType.Call) {
                _call(state, Actions.parseCallArgs(accounts, arg));
            }
        }
    }

    function _verifyAccountCollateralization(
        Storage.State storage state,
        Account.Info[] memory accounts,
        bool[] memory primaryAccounts,
        Monetary.Price[] memory priceCache
    )
        private
    {
        for (uint256 a = 0; a < accounts.length; a++) {
            Account.Info memory account = accounts[a];

            // get borrow and supply values of the account; also validate minBorrowedValue
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = state.getValues(account, priceCache, true);

            // don't check collateralization for non-primary accounts
            if (!primaryAccounts[a]) {
                continue;
            }

            // check collateralization for primary accounts
            Require.that(
                state.isCollateralized(supplyValue, borrowValue),
                FILE,
                "Undercollateralized account",
                a,
                supplyValue.value,
                borrowValue.value
            );

            // ensure status is normal for primary accounts
            if (state.getStatus(account) != Account.Status.Normal) {
                state.setStatus(account, Account.Status.Normal);
            }
        }
    }

    // ============ Action Functions ============

    function _deposit(
        Storage.State storage state,
        Actions.DepositArgs memory args
    )
        private
    {
        state.requireIsOperator(args.account, msg.sender);

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
        state.requireIsOperator(args.account, msg.sender);

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
        state.requireIsOperator(args.accountOne, msg.sender);
        state.requireIsOperator(args.accountTwo, msg.sender);

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
        state.requireIsOperator(args.account, msg.sender);

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
            "Buy amount less than promised",
            tokensReceived.value,
            makerWei.value
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
        state.requireIsOperator(args.account, msg.sender);

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
        state.requireIsOperator(args.takerAccount, msg.sender);
        state.requireIsOperator(args.makerAccount, args.autoTrader);

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
        Actions.LiquidateArgs memory args,
        Monetary.Price[] memory priceCache
    )
        private
    {
        state.requireIsOperator(args.solidAccount, msg.sender);

        // verify liquidatable
        if (Account.Status.Liquid != state.getStatus(args.liquidAccount)) {
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = state.getValues(args.liquidAccount, priceCache, false);
            Require.that(
                !state.isCollateralized(supplyValue, borrowValue),
                FILE,
                "Unliquidatable account"
            );
            state.setStatus(args.liquidAccount, Account.Status.Liquid);
        }

        Types.Wei memory maxHeldWei = state.getWei(
            args.liquidAccount,
            args.heldMkt
        );

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Collateral must be positive",
            maxHeldWei.value
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.liquidAccount,
            args.owedMkt,
            args.amount
        );

        (
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = state.fetchLiquidationPrices(args.heldMkt, args.owedMkt);

        Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPrice);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPrice);

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
        Actions.VaporizeArgs memory args,
        Monetary.Price[] memory priceCache
    )
        private
    {
        state.requireIsOperator(args.solidAccount, msg.sender);

        // verify vaporizable
        if (Account.Status.Vapor != state.getStatus(args.vaporAccount)) {
            uint256 numMarkets = state.numMarkets;
            for (uint256 m = 0; m < numMarkets; m++) {
                if (priceCache[m].value == 0) {
                    continue;
                }
                Require.that(
                    !state.getPar(args.vaporAccount, m).isPositive(),
                    FILE,
                    "Unvaporizable account"
                );
            }
            state.setStatus(args.vaporAccount, Account.Status.Vapor);
        }

        // First, attempt to refund using the same token
        if (_vaporizeUsingExcess(state, args.vaporAccount, args.owedMkt)) {
            return;
        }

        Types.Wei memory maxHeldWei = state.getNumExcessTokens(args.heldMkt);

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Excess token must be positive",
            maxHeldWei.value
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.vaporAccount,
            args.owedMkt,
            args.amount
        );


        (
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = state.fetchLiquidationPrices(args.heldMkt, args.owedMkt);

        Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPrice);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPrice);

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
        state.requireIsOperator(args.account, msg.sender);

        ICallee(args.callee).callFunction(
            msg.sender,
            args.account,
            args.data
        );

        Events.logCall(args);
    }

    // ============ Private Functions ============

    function _owedWeiToHeldWei(
        Types.Wei memory owedWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
        private
        pure
        returns (Types.Wei memory)
    {
        return Types.Wei({
            sign: false,
            value: Math.getPartial(owedWei.value, owedPrice.value, heldPrice.value)
        });
    }

    function _heldWeiToOwedWei(
        Types.Wei memory heldWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
        private
        pure
        returns (Types.Wei memory)
    {
        return Types.Wei({
            sign: true,
            value: Math.getPartialRoundUp(heldWei.value, heldPrice.value, owedPrice.value)
        });
    }

    function _vaporizeUsingExcess(
        Storage.State storage state,
        Account.Info memory account,
        uint256 owedMarketId
    )
        internal
        returns (bool)
    {
        Types.Wei memory excessWei = state.getNumExcessTokens(owedMarketId);

        if (!excessWei.isPositive()) {
            return false;
        }

        Types.Wei memory maxRefundWei = state.getWei(
            account,
            owedMarketId
        );

        if (excessWei.value >= maxRefundWei.value) {
            state.setPar(
                account,
                owedMarketId,
                Types.zeroPar()
            );
            return true;
        } else {
            state.setParFromDeltaWei(
                account,
                owedMarketId,
                excessWei
            );
            return false;
        }
    }
}
