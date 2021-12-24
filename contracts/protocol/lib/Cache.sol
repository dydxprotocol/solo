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

import { Monetary } from "./Monetary.sol";


/**
 * @title Cache
 * @author dYdX
 *
 * Library for caching information about markets
 */
library Cache {

    // ============ Structs ============

    struct MarketInfo {
        uint marketId;
        bool isClosing;
        uint128 borrowPar;
        Monetary.Price price;
    }

    struct MarketCache {
        MarketInfo[] markets;
        uint256[] marketBitmaps;
        bool isSorted;
        uint256 marketsLength;
    }

    // ============ Setter Functions ============

    /**
     * Initialize an empty cache for some given number of total markets.
     */
    function create(
        uint256 numMarkets
    )
        internal
        pure
        returns (MarketCache memory)
    {
        return MarketCache({
            markets: new MarketInfo[](0),
            marketBitmaps: new uint[]((numMarkets / 256) + 1),
            isSorted: false,
            marketsLength: 0
        });
    }

    // ============ Getter Functions ============

    function getNumMarkets(
        MarketCache memory cache
    )
        internal
        pure
        returns (uint256)
    {
        return cache.markets.length;
    }

    function hasMarket(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (bool)
    {
        uint bucketIndex = uint(keccak256(abi.encodePacked(marketId))) % 4;
        uint indexFromRight = uint(keccak256(abi.encodePacked(marketId))) % 256;
        uint bit = cache.marketBitmaps[bucketIndex] & (1 << indexFromRight);
        return bit > 0;
    }

    function get(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (MarketInfo memory)
    {
        // TODO binary search
        MarketInfo memory marketInfo = cache.markets[marketId];

        require(marketId == marketInfo.marketId, "Cache: invalid marketId");
        return marketInfo;
    }

    function set(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
    {
        require(
            !cache.isSorted,
            "Cache: cache already sorted"
        );

        uint bucketIndex = marketId / 256;
        uint indexFromRight = marketId % 256;
        cache.marketBitmaps[bucketIndex] |= (1 << indexFromRight);

//        cache.markets[cache.marketsLength].marketId = marketId;
//        cache.markets[cache.marketsLength].isClosing = isClosing;
//        cache.markets[cache.marketsLength].borrowPar = borrowPar;
//        cache.markets[cache.marketsLength].price = price;
        cache.marketsLength += 1;
    }

    function getAtIndex(
        MarketCache memory cache,
        uint256 index
    )
        internal
        pure
        returns (MarketInfo memory)
    {
        require(index < cache.marketsLength, "Cache: invalid index");
        return cache.markets[index];
    }

    function leastSignificantBit(uint256 x) private pure returns (uint8) {
        require(x > 0, 'Cache::leastSignificantBit: zero');
        // TODO - reverse ordering so small numbers are checked first

        uint8 lsb = 255;

        if (x & uint128(-1) > 0) {
            lsb -= 128;
        } else {
            x >>= 128;
        }

        if (x & uint64(-1) > 0) {
            lsb -= 64;
        } else {
            x >>= 64;
        }

        if (x & uint32(-1) > 0) {
            lsb -= 32;
        } else {
            x >>= 32;
        }

        if (x & uint16(-1) > 0) {
            lsb -= 16;
        } else {
            x >>= 16;
        }

        if (x & uint8(-1) > 0) {
            lsb -= 8;
        } else {
            x >>= 8;
        }

        if (x & 0xf > 0) {
            lsb -= 4;
        } else {
            x >>= 4;
        }

        if (x & 0x3 > 0) {
            lsb -= 2;
        } else {
            x >>= 2;
        }

        if (x & 0x1 > 0) {
            lsb -= 1;
        }

        return lsb;
    }

}
