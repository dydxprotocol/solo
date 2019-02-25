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

pragma solidity 0.5.4;
pragma experimental ABIEncoderV2;

import { State } from "./State.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { Account } from "./lib/Account.sol";
import { Cache } from "./lib/Cache.sol";
import { Decimal } from "./lib/Decimal.sol";
import { Interest } from "./lib/Interest.sol";
import { Monetary } from "./lib/Monetary.sol";
import { Require } from "./lib/Require.sol";
import { Storage } from "./lib/Storage.sol";
import { Token } from "./lib/Token.sol";
import { Types } from "./lib/Types.sol";


/**
 * @title Getters
 * @author dYdX
 *
 * Public read-only functions that allow transparency into the state of Solo
 */
contract Getters is
    State
{
    using Cache for Cache.MarketCache;
    using Storage for Storage.State;
    using Types for Types.Par;

    // ============ Constants ============

    bytes32 FILE = "Getters";

    // ============ Getters for Risk ============

    function getMarginRatio()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_state.riskParams.marginRatio;
    }

    function getLiquidationSpread()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_state.riskParams.liquidationSpread;
    }

    function getEarningsRate()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_state.riskParams.earningsRate;
    }

    function getMinBorrowedValue()
        public
        view
        returns (Monetary.Value memory)
    {
        return g_state.riskParams.minBorrowedValue;
    }

    function getRiskParams()
        public
        view
        returns (Storage.RiskParams memory)
    {
        return g_state.riskParams;
    }

    function getRiskLimits()
        public
        view
        returns (Storage.RiskLimits memory)
    {
        return g_state.riskLimits;
    }

    // ============ Getters for Markets ============

    function getNumMarkets()
        public
        view
        returns (uint256)
    {
        return g_state.numMarkets;
    }

    function getMarketTokenAddress(
        uint256 marketId
    )
        public
        view
        returns (address)
    {
        _requireValidMarket(marketId);
        return g_state.getToken(marketId);
    }

    function getMarketTotalPar(
        uint256 marketId
    )
        public
        view
        returns (Types.TotalPar memory)
    {
        _requireValidMarket(marketId);
        return g_state.getTotalPar(marketId);
    }

    function getMarketCachedIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        _requireValidMarket(marketId);
        return g_state.getIndex(marketId);
    }

    function getMarketCurrentIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        _requireValidMarket(marketId);
        return g_state.fetchNewIndex(marketId, g_state.getIndex(marketId));
    }

    function getMarketPriceOracle(
        uint256 marketId
    )
        public
        view
        returns (IPriceOracle)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId].priceOracle;
    }

    function getMarketInterestSetter(
        uint256 marketId
    )
        public
        view
        returns (IInterestSetter)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId].interestSetter;
    }

    function getMarketMarginPremium(
        uint256 marketId
    )
        public
        view
        returns (Decimal.D256 memory)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId].marginPremium;
    }

    function getMarketSpreadPremium(
        uint256 marketId
    )
        public
        view
        returns (Decimal.D256 memory)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId].spreadPremium;
    }

    function getMarketIsClosing(
        uint256 marketId
    )
        public
        view
        returns (bool)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId].isClosing;
    }

    function getMarketPrice(
        uint256 marketId
    )
        public
        view
        returns (Monetary.Price memory)
    {
        _requireValidMarket(marketId);
        return g_state.fetchPrice(marketId);
    }

    function getMarketInterestRate(
        uint256 marketId
    )
        public
        view
        returns (Interest.Rate memory)
    {
        _requireValidMarket(marketId);
        return g_state.fetchInterestRate(
            marketId,
            g_state.getIndex(marketId)
        );
    }

    function getMarket(
        uint256 marketId
    )
        public
        view
        returns (Storage.Market memory)
    {
        _requireValidMarket(marketId);
        return g_state.markets[marketId];
    }

    function getMarketWithInfo(
        uint256 marketId
    )
        public
        view
        returns (
            Storage.Market memory,
            Interest.Index memory,
            Monetary.Price memory,
            Interest.Rate memory
        )
    {
        _requireValidMarket(marketId);
        return (
            getMarket(marketId),
            getMarketCurrentIndex(marketId),
            getMarketPrice(marketId),
            getMarketInterestRate(marketId)
        );
    }

    function getNumExcessTokens(
        uint256 marketId
    )
        public
        view
        returns (Types.Wei memory)
    {
        _requireValidMarket(marketId);
        return g_state.getNumExcessTokens(marketId);
    }

    // ============ Getters for Accounts ============

    function getAccountPar(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Par memory)
    {
        _requireValidMarket(marketId);
        return g_state.getPar(account, marketId);
    }

    function getAccountWei(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Wei memory)
    {
        _requireValidMarket(marketId);
        return Interest.parToWei(
            g_state.getPar(account, marketId),
            g_state.fetchNewIndex(marketId, g_state.getIndex(marketId))
        );
    }

    function getAccountStatus(
        Account.Info memory account
    )
        public
        view
        returns (Account.Status)
    {
        return g_state.getStatus(account);
    }

    function getAccountValues(
        Account.Info memory account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        return getAccountValuesInternal(account, false);
    }

    function getAdjustedAccountValues(
        Account.Info memory account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        return getAccountValuesInternal(account, true);
    }

    function getAccountBalances(
        Account.Info memory account
    )
        public
        view
        returns (
            address[] memory,
            Types.Par[] memory,
            Types.Wei[] memory
        )
    {
        uint256 numMarkets = g_state.numMarkets;
        address[] memory tokens = new address[](numMarkets);
        Types.Par[] memory pars = new Types.Par[](numMarkets);
        Types.Wei[] memory weis = new Types.Wei[](numMarkets);

        for (uint256 m = 0; m < numMarkets; m++) {
            tokens[m] = getMarketTokenAddress(m);
            pars[m] = getAccountPar(account, m);
            weis[m] = getAccountWei(account, m);
        }

        return (
            tokens,
            pars,
            weis
        );
    }

    // ============ Getters for Permissions ============

    function getIsLocalOperator(
        address owner,
        address operator
    )
        public
        view
        returns (bool)
    {
        return g_state.isLocalOperator(owner, operator);
    }

    function getIsGlobalOperator(
        address operator
    )
        public
        view
        returns (bool)
    {
        return g_state.isGlobalOperator(operator);
    }

    // ============ Private Helper Functions ============

    function _requireValidMarket(
        uint256 marketId
    )
        private
        view
    {
        Require.that(
            marketId < g_state.numMarkets,
            FILE,
            "Market OOB"
        );
    }

    function getAccountValuesInternal(
        Account.Info memory account,
        bool adjustForLiquidity
    )
        private
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        uint256 numMarkets = g_state.numMarkets;

        // populate cache
        Cache.MarketCache memory cache = Cache.create(numMarkets);
        for (uint256 m = 0; m < numMarkets; m++) {
            if (!g_state.getPar(account, m).isZero()) {
                cache.addMarket(g_state, m);
            }
        }

        return g_state.getAccountValues(account, cache, adjustForLiquidity);
    }
}
