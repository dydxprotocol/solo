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

pragma solidity 0.5.1;
pragma experimental ABIEncoderV2;

import { LDecimal } from "../lib/LDecimal.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTime } from "../lib/LTime.sol";
import { LTypes } from "../lib/LTypes.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Storage } from "./Storage.sol";


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

    function getMinCollateralRatio()
        public
        view
        returns (LDecimal.Decimal memory)
    {
        return g_minCollateralRatio;
    }

    function getLiquidationSpread()
        public
        view
        returns (LDecimal.Decimal memory)
    {
        return g_liquidationSpread;
    }

    function getEarningsRate()
        public
        view
        returns (LDecimal.Decimal memory)
    {
        return g_earningsRate;
    }

    function getMinBorrowedValue()
        public
        view
        returns (LPrice.Value memory)
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

    function getLastUpdateTime()
        public
        view
        returns (LTime.Time memory)
    {
        return g_lastUpdate;
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

    function getMarketTotalNominal(
        uint256 marketId
    )
        public
        view
        returns (LInterest.TotalNominal memory)
    {
        return g_markets[marketId].totalNominal;
    }

    function getMarketIndex(
        uint256 marketId
    )
        public
        view
        returns (LInterest.Index memory)
    {
        return g_markets[marketId].index;
        // TODO: give the updated index
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
        returns (LPrice.Price memory)
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
        returns (LInterest.Rate memory)
    {
        return g_markets[marketId].interestSetter.getInterestRate(
            getMarketTokenAddress(marketId),
            getMarketTotalNominal(marketId)
        );
    }

    // ============ Account-Based Variables ============

    function getAccountBalance(
        address trader,
        uint256 account,
        uint256 marketId
    )
        public
        view
        returns (LTypes.SignedNominal memory)
    {
        return g_accounts[trader][account].balances[marketId];
    }

    function getAccountClosingTime(
        address trader,
        uint256 account
    )
        public
        view
        returns (LTime.Time memory)
    {
        return g_accounts[trader][account].closingTime;
    }

    function getAccountValues(
        address trader,
        uint256 account
    )
        public
        view
        returns (LPrice.Value memory, LPrice.Value memory)
    {
        trader;
        account;
        g_numMarkets;
        // TODO: return the value of the borrowAmount and the value of the supplyAmount
        // The client can decide if the position is collateralized using the minCollateralRatio
    }

}
