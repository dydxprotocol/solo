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

pragma solidity 0.5.2;
pragma experimental ABIEncoderV2;

import { Storage } from "./Storage.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Queries
 * @author dYdX
 *
 * Read-only functions to help understand the state of the protocol
 */
contract Queries is
    Storage
{
    // ============ Admin Variables ============

    function getLiquidationRatio()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_liquidationRatio;
    }

    function getLiquidationSpread()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_liquidationSpread;
    }

    function getEarningsRate()
        public
        view
        returns (Decimal.D256 memory)
    {
        return g_earningsRate;
    }

    function getMinBorrowedValue()
        public
        view
        returns (Monetary.Value memory)
    {
        return g_minBorrowedValue;
    }

    // ============ Individual Variables ============

    function getNumMarkets()
        public
        view
        returns (uint256)
    {
        return g_numMarkets;
    }

    // ============ Market-Based Variables ============

    function getMarketTokenAddress(
        uint256 marketId
    )
        public
        view
        returns (address)
    {
        return g_markets[marketId].token;
    }

    function getMarketTotalPar(
        uint256 marketId
    )
        public
        view
        returns (Types.TotalPar memory)
    {
        return g_markets[marketId].totalPar;
    }

    function getMarketCachedIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        return g_markets[marketId].index;
    }

    function getMarketCurrentIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {
        marketId;
        g_markets[marketId].index;
        // TODO: give the updated index
    }

    function getMarketLastUpdateTime(
        uint256 marketId
    )
        public
        view
        returns (uint32)
    {
        return g_markets[marketId].index.lastUpdate;
    }

    function getMarketPriceOracle(
        uint256 marketId
    )
        public
        view
        returns (IPriceOracle)
    {
        return g_markets[marketId].priceOracle;
    }

    function getMarketInterestSetter(
        uint256 marketId
    )
        public
        view
        returns (IInterestSetter)
    {
        return g_markets[marketId].interestSetter;
    }

    function getMarketPrice(
        uint256 marketId
    )
        public
        view
        returns (Monetary.Price memory)
    {
        return g_markets[marketId].priceOracle.getPrice(
            getMarketTokenAddress(marketId)
        );
    }

    function getMarketInterestRate(
        uint256 marketId
    )
        public
        view
        returns (Interest.Rate memory)
    {
        Interest.Index memory index = getMarketCachedIndex(marketId);

        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(
            getMarketTotalPar(marketId),
            index
        );

        return g_markets[marketId].interestSetter.getInterestRate(
            getMarketTokenAddress(marketId),
            borrowWei.value,
            supplyWei.value
        );
    }

    // ============ Account-Based Variables ============

    function getAccountBalance(
        address owner,
        uint256 account,
        uint256 marketId
    )
        public
        view
        returns (Types.Par memory)
    {
        return g_accounts[owner][account].balances[marketId];
    }

    function getAccountLiquidationTime(
        address owner,
        uint256 account
    )
        public
        view
        returns (uint32)
    {
        return g_accounts[owner][account].liquidationTime;
    }

    function getAccountValues(
        address owner,
        uint256 account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        owner;
        account;
        g_numMarkets;
        // TODO: return the value of the borrowAmount and the value of the supplyAmount
        // The client can decide if the position is collateralized using the liquidationRatio
    }

}
