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

import { State } from "./State.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { Account } from "./lib/Account.sol";
import { Decimal } from "./lib/Decimal.sol";
import { Interest } from "./lib/Interest.sol";
import { Monetary } from "./lib/Monetary.sol";
import { Storage } from "./lib/Storage.sol";
import { Token } from "./lib/Token.sol";
import { Types } from "./lib/Types.sol";


/**
 * @title Getters
 * @author dYdX
 *
 * TODO
 */
contract Getters is
    State
{
    using Storage for Storage.State;

    // ============ Getters for Risk ============

    function getLiquidationRatio()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_state.riskParams.liquidationRatio;
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
        return g_state.getToken(marketId);
    }

    function getMarketTotalPar(
        uint256 marketId
    )
        public
        view
        returns (Types.TotalPar memory)
    {
        return g_state.getTotalPar(marketId);
    }

    function getMarketCachedIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        return g_state.getIndex(marketId);
    }

    function getMarketCurrentIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        return g_state.fetchNewIndex(marketId, g_state.getIndex(marketId));
    }

    function getMarketPriceOracle(
        uint256 marketId
    )
        public
        view
        returns (IPriceOracle)
    {
        return g_state.markets[marketId].priceOracle;
    }

    function getMarketInterestSetter(
        uint256 marketId
    )
        public
        view
        returns (IInterestSetter)
    {
        return g_state.markets[marketId].interestSetter;
    }

    function getMarketIsClosing(
        uint256 marketId
    )
        public
        view
        returns (bool)
    {
        return g_state.markets[marketId].isClosing;
    }

    function getMarketPrice(
        uint256 marketId
    )
        public
        view
        returns (Monetary.Price memory)
    {
        return g_state.fetchPrice(marketId);
    }

    function getMarketInterestRate(
        uint256 marketId
    )
        public
        view
        returns (Interest.Rate memory)
    {
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
        return (
            getMarket(marketId),
            getMarketCurrentIndex(marketId),
            getMarketPrice(marketId),
            getMarketInterestRate(marketId)
        );
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
        return g_state.getValues(account, false);
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
        uint256 numMarkets = getNumMarkets();

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
        Account.Info memory account,
        address operator
    )
        public
        view
        returns (bool)
    {
        return g_state.isLocalOperator(account, operator);
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
}
