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

import { Storage } from "./Storage.sol";
import { WorldManager } from "./WorldManager.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Acct } from "../lib/Acct.sol";
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
    Storage,
    WorldManager
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
        WorldState memory worldState = wsInitializeEmpty();
        return wsGetIndex(worldState, marketId);
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

    function getAccountPar(
        Acct.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Par memory)
    {
        return g_accounts[account.owner][account.number].balances[marketId];
    }

    function getAccountWei(
        Acct.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Wei memory)
    {
        WorldState memory worldState = wsInitializeSingle(account);
        return wsGetWei(worldState, 0, marketId);
    }

    function getAccountIsLiquidating(
        Acct.Info memory account
    )
        public
        view
        returns (bool)
    {
        return g_accounts[account.owner][account.number].isLiquidating;
    }

    function getAccountValues(
        Acct.Info memory account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        WorldState memory worldState = wsInitializeSingle(account);
        return wsGetAccountValues(worldState, 0);
    }

}
