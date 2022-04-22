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

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Account } from "../lib/Account.sol";
import { Actions } from "../lib/Actions.sol";
import { Cache } from "../lib/Cache.sol";
import { Decimal } from "../lib/Decimal.sol";
import { EnumerableSet } from "../lib/EnumerableSet.sol";
import { Events } from "../lib/Events.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Interest } from "../lib/Interest.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";
import { CallImpl } from "./CallImpl.sol";
import { DepositImpl } from "./DepositImpl.sol";
import { LiquidateOrVaporizeImpl } from "./LiquidateOrVaporizeImpl.sol";
import { TradeImpl } from "./TradeImpl.sol";
import { TransferImpl } from "./TransferImpl.sol";
import { WithdrawalImpl } from "./WithdrawalImpl.sol";


/**
 * @title OperationImpl
 * @author dYdX
 *
 * Logic for processing actions
 */
library OperationImpl {
    using Cache for Cache.MarketCache;
    using EnumerableSet for EnumerableSet.Set;
    using SafeMath for uint256;
    using Storage for Storage.State;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "OperationImpl";

    // ============ Public Functions ============

    function operate(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        public
    {
        Events.logOperation();

        _verifyInputs(accounts, actions);

        (
            bool[] memory primaryAccounts,
            Cache.MarketCache memory cache
        ) = _runPreprocessing(
            state,
            accounts,
            actions
        );

        _runActions(
            state,
            accounts,
            actions,
            cache
        );

        _verifyFinalState(
            state,
            accounts,
            primaryAccounts,
            cache
        );
    }

    // ============ Helper Functions ============

    function _verifyInputs(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        private
        pure
    {
        Require.that(
            accounts.length != 0,
            FILE,
            "Cannot have zero accounts"
        );
        Require.that(
            actions.length != 0,
            FILE,
            "Cannot have zero actions"
        );

        for (uint256 a = 0; a < accounts.length; a++) {
            for (uint256 b = a + 1; b < accounts.length; b++) {
                Require.that(
                    !Account.equals(accounts[a], accounts[b]),
                    FILE,
                    "Cannot duplicate accounts",
                    accounts[a].owner,
                    accounts[a].number
                );
            }
        }
    }

    function _runPreprocessing(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        private
        returns (
            bool[] memory,
            Cache.MarketCache memory
        )
    {
        uint256 numMarkets = state.numMarkets;
        bool[] memory primaryAccounts = new bool[](accounts.length);
        Cache.MarketCache memory cache = Cache.create(numMarkets);

        // keep track of primary accounts and indexes that need updating
        for (uint256 i = 0; i < actions.length; i++) {
            Actions.ActionArgs memory arg = actions[i];
            Actions.ActionType actionType = arg.actionType;
            Actions.MarketLayout marketLayout = Actions.getMarketLayout(actionType);
            Actions.AccountLayout accountLayout = Actions.getAccountLayout(actionType);

            // parse out primary accounts
            if (accountLayout != Actions.AccountLayout.OnePrimary) {
                Require.that(
                    arg.accountId != arg.otherAccountId,
                    FILE,
                    "Duplicate accounts in action",
                    i
                );
                if (accountLayout == Actions.AccountLayout.TwoPrimary) {
                    primaryAccounts[arg.otherAccountId] = true;
                } else {
                    // accountLayout == Actions.AccountLayout.PrimaryAndSecondary
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
                _updateMarket(state, cache, arg.primaryMarketId);
            } else if (marketLayout == Actions.MarketLayout.TwoMarkets) {
                Require.that(
                    arg.primaryMarketId != arg.secondaryMarketId,
                    FILE,
                    "Duplicate markets in action",
                    i
                );
                _updateMarket(state, cache, arg.primaryMarketId);
                _updateMarket(state, cache, arg.secondaryMarketId);
            }
        }

        // get any other markets for which an account has a balance
        for (uint256 a = 0; a < accounts.length; a++) {
            uint[] memory marketIdsWithBalance = state.getMarketsWithBalances(accounts[a]);
            for (uint256 i = 0; i < marketIdsWithBalance.length; i++) {
                _updateMarket(state, cache, marketIdsWithBalance[i]);
            }
        }

        state.initializeCache(cache);

        for (uint i = 0; i < cache.getNumMarkets(); i++) {
            Events.logOraclePrice(cache.getAtIndex(i));
        }

        return (primaryAccounts, cache);
    }

    function _updateMarket(
        Storage.State storage state,
        Cache.MarketCache memory cache,
        uint256 marketId
    )
        private
    {
        if (!cache.hasMarket(marketId)) {
            cache.set(marketId);
            Events.logIndexUpdate(marketId, state.updateIndex(marketId));
        }
    }

    function _runActions(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Cache.MarketCache memory cache
    )
        private
    {
        for (uint256 i = 0; i < actions.length; i++) {
            Actions.ActionArgs memory action = actions[i];
            Actions.ActionType actionType = action.actionType;

            if (actionType == Actions.ActionType.Deposit) {
                Actions.DepositArgs memory depositArgs = Actions.parseDepositArgs(accounts, action);
                DepositImpl.deposit(
                    state,
                    depositArgs,
                    cache.get(depositArgs.market).index
                );
            } else if (actionType == Actions.ActionType.Withdraw) {
                Actions.WithdrawArgs memory withdrawArgs = Actions.parseWithdrawArgs(accounts, action);
                WithdrawalImpl.withdraw(
                    state,
                    withdrawArgs,
                    cache.get(withdrawArgs.market).index
                );
            } else if (actionType == Actions.ActionType.Transfer) {
                Actions.TransferArgs memory transferArgs = Actions.parseTransferArgs(accounts, action);
                TransferImpl.transfer(
                    state,
                    transferArgs,
                    cache.get(transferArgs.market).index
                );
            } else if (actionType == Actions.ActionType.Buy) {
                Actions.BuyArgs memory buyArgs = Actions.parseBuyArgs(accounts, action);
                TradeImpl.buy(
                    state,
                    buyArgs,
                    cache.get(buyArgs.takerMarket).index,
                    cache.get(buyArgs.makerMarket).index
                );
            } else if (actionType == Actions.ActionType.Sell) {
                Actions.SellArgs memory sellArgs = Actions.parseSellArgs(accounts, action);
                TradeImpl.sell(
                    state,
                    sellArgs,
                    cache.get(sellArgs.takerMarket).index,
                    cache.get(sellArgs.makerMarket).index
                );
            } else if (actionType == Actions.ActionType.Trade) {
                Actions.TradeArgs memory tradeArgs = Actions.parseTradeArgs(accounts, action);
                TradeImpl.trade(
                    state,
                    tradeArgs,
                    cache.get(tradeArgs.inputMarket).index,
                    cache.get(tradeArgs.outputMarket).index
                );
            } else if (actionType == Actions.ActionType.Liquidate) {
                LiquidateOrVaporizeImpl.liquidate(
                    state,
                    cache,
                    Actions.parseLiquidateArgs(accounts, action)
                );
            } else if (actionType == Actions.ActionType.Vaporize) {
                LiquidateOrVaporizeImpl.vaporize(
                    state,
                    cache,
                    Actions.parseVaporizeArgs(accounts, action)
                );
            } else if (actionType == Actions.ActionType.Call) {
                CallImpl.call(
                    state,
                    Actions.parseCallArgs(accounts, action)
                );
            }
        }
    }

    function _verifyFinalState(
        Storage.State storage state,
        Account.Info[] memory accounts,
        bool[] memory primaryAccounts,
        Cache.MarketCache memory cache
    )
        private
    {
        // verify no increase in borrowPar for closing markets
        uint256 numMarkets = cache.getNumMarkets();
        for (uint256 i = 0; i < numMarkets; i++) {
            uint256 marketId = cache.getAtIndex(i).marketId;
            Types.TotalPar memory totalPar = state.getTotalPar(marketId);
            if (cache.getAtIndex(i).isClosing) {
                Require.that(
                    totalPar.borrow <= cache.getAtIndex(i).borrowPar,
                    FILE,
                    "Market is closing",
                    marketId
                );
            }

            Types.Wei memory maxWei = state.getMaxWei(marketId);
            if (maxWei.value != 0) {
                // require total supply is less than the max OR it scaled down
                Interest.Index memory index = cache.getAtIndex(i).index;
                (Types.Wei memory totalSupplyWei,) = Interest.totalParToWei(totalPar, index);
                Types.Wei memory cachedSupplyWei = Interest.parToWei(
                    Types.Par(true, cache.getAtIndex(i).supplyPar),
                    index
                );
                Require.that(
                    totalSupplyWei.value <= maxWei.value || totalSupplyWei.value <= cachedSupplyWei.value,
                    FILE,
                    "Total supply exceeds max supply",
                    marketId
                );
            }

            if (state.markets[marketId].isRecyclable) {
                // This market is recyclable. Check that only the `token` is the owner
                for (uint256 a = 0; a < accounts.length; a++) {
                    if (accounts[a].owner != cache.getAtIndex(i).token) {
                        // If the owner of the recyclable token isn't the TokenProxy,
                        // THEN check that the account doesn't have a balance for this recyclable `marketId`
                        Require.that(
                            !state.getMarketsWithBalancesSet(accounts[a]).contains(marketId),
                            FILE,
                            "Invalid recyclable owner",
                            accounts[a].owner,
                            accounts[a].number,
                            marketId
                        );
                    }
                }
            }
        }

        // verify account collateralization
        for (uint256 a = 0; a < accounts.length; a++) {
            Account.Info memory account = accounts[a];

            Require.that(
                state.getNumberOfMarketsWithBalances(account) <= state.riskParams.accountMaxNumberOfMarketsWithBalances,
                FILE,
                "Too many non-zero balances",
                account.owner,
                account.number
            );

            // don't check collateralization for non-primary accounts
            if (!primaryAccounts[a]) {
                continue;
            }

            // validate minBorrowedValue
            bool collateralized = state.isCollateralized(account, cache, /* requireMinBorrow = */ true);

            // check collateralization for primary accounts
            Require.that(
                collateralized,
                FILE,
                "Undercollateralized account",
                account.owner,
                account.number
            );

            // ensure status is normal for primary accounts
            if (state.getStatus(account) != Account.Status.Normal) {
                state.setStatus(account, Account.Status.Normal);
            }
        }
    }

}
