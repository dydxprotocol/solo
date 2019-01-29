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
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Interactions
 * @author dYdX
 *
 * Logic for processing actions
 */
contract Interactions is
    ReentrancyGuard,
    Storage,
    Manager,
    Events
{
    // ============ Constants ============

    string constant FILE = "Interactions";

    // ============ Public Functions ============

    function transact(
        Acct.Info[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        logTransaction();

        bool[] memory primary = new bool[](accounts.length);
        bool[] memory traded = new bool[](accounts.length);

        for (uint256 i = 0; i < args.length; i++) {
            Actions.TransactionArgs memory arg = args[i];
            Actions.TransactionType ttype = arg.transactionType;

            if (ttype == Actions.TransactionType.Deposit) {
                _deposit(Actions.parseDepositArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Withdraw) {
                _withdraw(Actions.parseWithdrawArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Transfer) {
                _transfer(Actions.parseTransferArgs(accounts, arg));
                primary[arg.accountId] = true;
            }
            else if (ttype == Actions.TransactionType.Buy) {
                _buy(Actions.parseBuyArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Sell) {
                _sell(Actions.parseSellArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Trade) {
                _trade(Actions.parseTradeArgs(accounts, arg));
                traded[arg.accountId] = true;
            }
            else if (ttype == Actions.TransactionType.Liquidate) {
                _liquidate(Actions.parseLiquidateArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Vaporize) {
                _vaporize(Actions.parseVaporizeArgs(accounts, arg));
            }
            else if (ttype == Actions.TransactionType.Call) {
                _call(Actions.parseCallArgs(accounts, arg));
            }
            primary[arg.accountId] = true;
        }

        _verify(accounts, primary, traded);
    }

    function _verify(
        Acct.Info[] memory accounts,
        bool[] memory primary,
        bool[] memory traded
    )
        private
    {
        Monetary.Value memory minBorrowedValue = g_riskParams.minBorrowedValue;

        for (uint256 a = 0; a < accounts.length; a++) {
            Acct.Info memory account = accounts[a];

            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = getValues(account);

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
                    valuesToStatus(supplyValue, borrowValue) == AccountStatus.Normal,
                    FILE,
                    "Undercollateralized account",
                    a
                );
                if (getStatus(account) != AccountStatus.Normal) {
                    setStatus(account, AccountStatus.Normal);
                }
            }

            // check permissions for primary accounts
            if (primary[a]) {
                Require.that(
                    account.owner == msg.sender || g_operators[account.owner][msg.sender],
                    FILE,
                    "Unpermissioned account",
                    a
                );
            }
        }
    }

    // ============ Private Functions ============

    function _deposit(
        Actions.DepositArgs memory args
    )
        private
    {
        updateIndex(args.mkt);

        Require.that(
            args.from == msg.sender || args.from == args.account.owner,
            FILE,
            "Invalid deposit source"
        );

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            args.account,
            args.mkt,
            args.amount
        );

        setPar(
            args.account,
            args.mkt,
            newPar
        );

        // requires a positive deltaWei
        Exchange.transferIn(
            getToken(args.mkt),
            args.from,
            deltaWei
        );

        logDeposit(args, deltaWei);
    }

    function _withdraw(
        Actions.WithdrawArgs memory args
    )
        private
    {
        updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            args.account,
            args.mkt,
            args.amount
        );

        setPar(
            args.account,
            args.mkt,
            newPar
        );

        // requires a negative deltaWei
        Exchange.transferOut(
            getToken(args.mkt),
            args.to,
            deltaWei
        );

        logWithdraw(args, deltaWei);
    }

    function _transfer(
        Actions.TransferArgs memory args
    )
        private
    {
        updateIndex(args.mkt);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            args.accountOne,
            args.mkt,
            args.amount
        );

        setPar(
            args.accountOne,
            args.mkt,
            newPar
        );

        setParFromDeltaWei(
            args.accountTwo,
            args.mkt,
            deltaWei.negative()
        );

        logTransfer(
            args,
            deltaWei
        );
    }

    function _buy(
        Actions.BuyArgs memory args
    )
        private
    {
        updateIndex(args.takerMkt);
        updateIndex(args.makerMkt);

        address takerToken = getToken(args.takerMkt);
        address makerToken = getToken(args.makerMkt);

        (
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = getNewParAndDeltaWei(
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

        setPar(
            args.account,
            args.makerMkt,
            makerPar
        );

        setParFromDeltaWei(
            args.account,
            args.takerMkt,
            takerWei
        );

        logBuy(
            args,
            takerWei,
            makerWei
        );
    }

    function _sell(
        Actions.SellArgs memory args
    )
        private
    {
        updateIndex(args.takerMkt);
        updateIndex(args.makerMkt);

        address takerToken = getToken(args.takerMkt);
        address makerToken = getToken(args.makerMkt);

        (
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = getNewParAndDeltaWei(
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

        setPar(
            args.account,
            args.takerMkt,
            takerPar
        );

        setParFromDeltaWei(
            args.account,
            args.makerMkt,
            makerWei
        );

        logSell(
            args,
            takerWei,
            makerWei
        );
    }

    function _trade(
        Actions.TradeArgs memory args
    )
        private
    {
        updateIndex(args.inputMkt);
        updateIndex(args.outputMkt);

        Require.that(
            g_operators[args.makerAccount.owner][args.autoTrader],
            FILE,
            "Unpermissioned AutoTrader"
        );

        Types.Par memory oldInputPar = getPar(
            args.makerAccount,
            args.inputMkt
        );
        (
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = getNewParAndDeltaWei(
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
        setPar(
            args.makerAccount,
            args.inputMkt,
            newInputPar
        );
        setParFromDeltaWei(
            args.makerAccount,
            args.outputMkt,
            outputWei
        );

        // set the balance for the taker
        setParFromDeltaWei(
            args.takerAccount,
            args.inputMkt,
            inputWei.negative()
        );
        setParFromDeltaWei(
            args.takerAccount,
            args.outputMkt,
            outputWei.negative()
        );

        logTrade(
            args,
            inputWei,
            outputWei
        );
    }

    function _liquidate(
        Actions.LiquidateArgs memory args
    )
        private
    {
        updateIndex(args.heldMkt);
        updateIndex(args.owedMkt);

        // verify liquidatable
        if (AccountStatus.Liquid != getStatus(args.liquidAccount)) {
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = getValues(args.liquidAccount);
            Require.that(
                AccountStatus.Liquid == valuesToStatus(supplyValue, borrowValue),
                FILE,
                "Unliquidatable account"
            );
            setStatus(args.liquidAccount, AccountStatus.Liquid);
        }

        Types.Wei memory maxHeldWei = getWei(
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
        ) = getNewParAndDeltaWeiForLiquidation(
            args.liquidAccount,
            args.owedMkt,
            args.amount
        );

        Decimal.D256 memory priceRatio = fetchPriceRatio(args.owedMkt, args.heldMkt);

        Types.Wei memory heldWei = owedWeiToHeldWei(priceRatio, owedWei);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = heldWeiToOwedWei(priceRatio, heldWei);

            setPar(
                args.liquidAccount,
                args.heldMkt,
                Types.zeroPar()
            );
            setParFromDeltaWei(
                args.liquidAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            setPar(
                args.liquidAccount,
                args.owedMkt,
                owedPar
            );
            setParFromDeltaWei(
                args.liquidAccount,
                args.heldMkt,
                heldWei
            );
        }

        // set the balances for the solid account
        setParFromDeltaWei(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        setParFromDeltaWei(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        logLiquidate(
            args,
            heldWei,
            owedWei
        );
    }

    function _vaporize(
        Actions.VaporizeArgs memory args
    )
        private
    {
        updateIndex(args.heldMkt);
        updateIndex(args.owedMkt);

        // verify vaporizable
        if (AccountStatus.Vapor != getStatus(args.vaporAccount)) {
            (
                Monetary.Value memory supplyValue,
                Monetary.Value memory borrowValue
            ) = getValues(args.vaporAccount);
            Require.that(
                AccountStatus.Vapor == valuesToStatus(supplyValue, borrowValue),
                FILE,
                "Unvaporizable account"
            );
            setStatus(args.vaporAccount, AccountStatus.Vapor);
        }

        // First, attempt to refund using the same token
        if (vaporizeUsingExcess(args.vaporAccount, args.owedMkt)) {
            return;
        }

        Types.Wei memory maxHeldWei = getNumExcessTokens(args.heldMkt);

        Require.that(
            maxHeldWei.isPositive(),
            FILE,
            "Excess token must be positive"
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = getNewParAndDeltaWeiForLiquidation(
            args.vaporAccount,
            args.owedMkt,
            args.amount
        );

        Decimal.D256 memory priceRatio = fetchPriceRatio(args.owedMkt, args.heldMkt);

        Types.Wei memory heldWei = owedWeiToHeldWei(priceRatio, owedWei);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = heldWeiToOwedWei(priceRatio, heldWei);

            setParFromDeltaWei(
                args.vaporAccount,
                args.owedMkt,
                owedWei
            );
        } else {
            setPar(
                args.vaporAccount,
                args.owedMkt,
                owedPar
            );
        }

        // set the balances for the solid account
        setParFromDeltaWei(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        setParFromDeltaWei(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );

        logVaporize(
            args,
            heldWei,
            owedWei
        );
    }

    function _call(
        Actions.CallArgs memory args
    )
        private
    {
        ICallee(args.callee).callFunction(
            msg.sender,
            args.account,
            args.data
        );

        logCall(args);
    }
}
