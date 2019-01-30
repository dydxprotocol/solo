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
import { SoloMargin } from "../protocol/SoloMargin.sol";
import { Storage } from "../protocol/lib/Storage.sol";
import { Acct } from "../protocol/lib/Acct.sol";
import { Decimal } from "../protocol/lib/Decimal.sol";
import { Interest } from "../protocol/lib/Interest.sol";
import { Monetary } from "../protocol/lib/Monetary.sol";
import { Types } from "../protocol/lib/Types.sol";


/**
 * @title SoloMarginReader
 * @author dYdX
 *
 * Getter functions for SoloMargin that only require a single call to a node to read.
 * Not gas efficient, but useful for reading state for use in off-chain applications.
 */
contract SoloMarginReader {

    // ============ Structs ============

    struct MarketWithInfo {
        Storage.Market market;
        Interest.Index currentIndex;
        Monetary.Price currentPrice;
        Interest.Rate currentInterestRate;
    }

    struct Globals {
        Decimal.D256 liquidationRatio;
        Decimal.D256 liquidationSpread;
        Decimal.D256 earningsRate;
        Monetary.Value minBorrowedValue;
        uint256 numMarkets;
    }

    struct Balance {
        address tokenAddress;
        Types.Par parBalance;
        Types.Wei weiBalance;
    }

    // ============ Storage ============

    SoloMargin public SOLO_MARGIN;

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
        public
    {
        SOLO_MARGIN = SoloMargin(soloMargin);
    }

    // ============ Getter Functions ============

    function getMarketWithInfo(
        uint256 marketId
    )
        public
        view
        returns (MarketWithInfo memory)
    {
        return MarketWithInfo({
            market: getMarket(marketId),
            currentIndex: SOLO_MARGIN.getMarketCurrentIndex(marketId),
            currentPrice: SOLO_MARGIN.getMarketPrice(marketId),
            currentInterestRate: SOLO_MARGIN.getMarketInterestRate(marketId)
        });
    }

     function getMarket(
        uint256 marketId
    )
        public
        view
        returns (Storage.Market memory)
    {
        return Storage.Market({
            token: SOLO_MARGIN.getMarketTokenAddress(marketId),
            totalPar: SOLO_MARGIN.getMarketTotalPar(marketId),
            index: SOLO_MARGIN.getMarketCachedIndex(marketId),
            priceOracle: SOLO_MARGIN.getMarketPriceOracle(marketId),
            interestSetter: SOLO_MARGIN.getMarketInterestSetter(marketId),
            isClosing: SOLO_MARGIN.getMarketIsClosing(marketId)
        });
    }

    function getAccountBalances(
        Acct.Info memory account
    )
        public
        view
        returns (Balance[] memory)
    {
        uint256 numMarkets = SOLO_MARGIN.getNumMarkets();
        Balance[] memory balances = new Balance[](numMarkets);

        for (uint256 m = 0; m < numMarkets; m++) {
            balances[m] = Balance({
                tokenAddress: SOLO_MARGIN.getMarketTokenAddress(m),
                parBalance: SOLO_MARGIN.getAccountPar(account, m),
                weiBalance: SOLO_MARGIN.getAccountWei(account, m)
            });
        }

        return balances;
    }
}
