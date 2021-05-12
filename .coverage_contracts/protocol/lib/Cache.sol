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
import { Storage } from "./Storage.sol";


/**
 * @title Cache
 * @author dYdX
 *
 * Library for caching information about markets
 */
library Cache {
function coverage_0xaa3216f1(bytes32 c__0xaa3216f1) public pure {}

    using Cache for MarketCache;
    using Storage for Storage.State;

    // ============ Structs ============

    struct MarketInfo {
        bool isClosing;
        uint128 borrowPar;
        Monetary.Price price;
    }

    struct MarketCache {
        MarketInfo[] markets;
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
    {coverage_0xaa3216f1(0x2954e2375a396932ecc9d2a3c955185815c9f5590e61f7a79d124b5fcf9f522e); /* function */ 

coverage_0xaa3216f1(0xcba1cc12bf005c93d182a0fb96f7303a79cfcee189973b3742fcbd9f71f93a2f); /* line */ 
        coverage_0xaa3216f1(0x3b21e1244f9c2ef1af447b68d0210c028e8e658ef2252a6b472e10f499109001); /* statement */ 
return MarketCache({
            markets: new MarketInfo[](numMarkets)
        });
    }

    /**
     * Add market information (price and total borrowed par if the market is closing) to the cache.
     * Return true if the market information did not previously exist in the cache.
     */
    function addMarket(
        MarketCache memory cache,
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (bool)
    {coverage_0xaa3216f1(0x501dbb0663f1e239e75ce7ebad3e32e122d67100a69ed542896b236d54edfd8a); /* function */ 

coverage_0xaa3216f1(0x3f79630d93669d1e03477922a5c5c8101fb80049c3b6e55f36e148f5d6eb620a); /* line */ 
        coverage_0xaa3216f1(0x5c7e1c5da12b06f80bf398a3a98078b5c149319a5f078ee9a9c2404ae34d7196); /* statement */ 
if (cache.hasMarket(marketId)) {coverage_0xaa3216f1(0x31efc9e91db37cfb6c7c27babcb61ba3a6cc01695f9746319893c358e37b871a); /* branch */ 

coverage_0xaa3216f1(0x96aebbb22a086fa501e5e79d459a8dd4b1b1ac0b5c54c9a4604b327c372ee8ae); /* line */ 
            coverage_0xaa3216f1(0xcf7c9b1523f99017f5c8800ef1b86bba459e653d3be410a01b1427dab69b7e99); /* statement */ 
return false;
        }else { coverage_0xaa3216f1(0x23460b61d9594bc21d7b02d50131e155d96bec3eff608be8a0914e320e74a332); /* branch */ 
}
coverage_0xaa3216f1(0x84a619e389b006c9729cad5cca78bd2f0c933441514daacbf7f9d2a8533dcbd3); /* line */ 
        coverage_0xaa3216f1(0x7ebdacf9c770aeb259b4f250afb2e68a8d06538ecff663d3424ee257543d591c); /* statement */ 
cache.markets[marketId].price = state.fetchPrice(marketId);
coverage_0xaa3216f1(0x8435d08ec7a7e385de1cf665549660c155026a5826563e0724eb74c8b40c589d); /* line */ 
        coverage_0xaa3216f1(0xa2052c151b77881fec08b6c4f1d5a6404c9bfb1b8ffc142e20aeadada4662678); /* statement */ 
if (state.markets[marketId].isClosing) {coverage_0xaa3216f1(0x8108b1bf455b80f154a7159d8fb4c4fd7dcd1283e58fd5a65712b7c81f34f436); /* branch */ 

coverage_0xaa3216f1(0xb3baecd40f87dd89460e3bb21f68e5d1ad3840f9e47786ada4d6956c449aacf5); /* line */ 
            coverage_0xaa3216f1(0x057bc2363d3eed1f06a28b4e4036554e44496a0c334c4750c6e4ff80b7799466); /* statement */ 
cache.markets[marketId].isClosing = true;
coverage_0xaa3216f1(0x44c863af3a60efb712e4ac76758185a55dff554f91f7f233587612f90ae262ab); /* line */ 
            coverage_0xaa3216f1(0xb081d06e6c8701324ceeb1729daf6ed0cfa686267cb6fbaac94ad3f016df5f93); /* statement */ 
cache.markets[marketId].borrowPar = state.getTotalPar(marketId).borrow;
        }else { coverage_0xaa3216f1(0x0e49fbbecfe9c247c07f250886e41a3d8e9085bf783869e989182c5d934e1bb9); /* branch */ 
}
coverage_0xaa3216f1(0xff865390c5e5f4fd2fb557bfc079f6835b1078266c3ad1ba7a5eb537d1f4cd2b); /* line */ 
        coverage_0xaa3216f1(0xd1514fdcddac43cbd2843b8c1a85feff802b597de5e9a76c531f297021589d73); /* statement */ 
return true;
    }

    // ============ Getter Functions ============

    function getNumMarkets(
        MarketCache memory cache
    )
        internal
        pure
        returns (uint256)
    {coverage_0xaa3216f1(0x76bc3fdfa7c14a0606d2f1cdcdfa32f812f6d4479ad401ea9c4cba991ce5e8a2); /* function */ 

coverage_0xaa3216f1(0x0f06306780afdd145f63f90209b1a2950581261bb47445ea59ffc94454ac7949); /* line */ 
        coverage_0xaa3216f1(0x201b1eb9cdf8a18303cb1bda4acb0423dad64f7ab983dc6df4c024e6ab1ecb60); /* statement */ 
return cache.markets.length;
    }

    function hasMarket(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (bool)
    {coverage_0xaa3216f1(0x3f6774f4db08964fe9ca62a923a39bbf22df49bc6d6682198728296af786bfb2); /* function */ 

coverage_0xaa3216f1(0x9e02055338b540d0380f4ab3e24b1f6f45ccb0df863919b3db7a27d44ce64f9f); /* line */ 
        coverage_0xaa3216f1(0x6340da22658740263d029608ad989dc6ac9dff87b964466570efad631a238ad9); /* statement */ 
return cache.markets[marketId].price.value != 0;
    }

    function getIsClosing(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (bool)
    {coverage_0xaa3216f1(0x2cd055f4d35fd61be59472d1073c8dfd2b7a65b556cf74fb21a947bc44a36b15); /* function */ 

coverage_0xaa3216f1(0xf3ff82d0f28a6aefde8687ec0f0eda3416499d94d9804c5e8ffb7ed9e3d40c10); /* line */ 
        coverage_0xaa3216f1(0x97e350567b568579411b66daeb54f89a64fd1401f4c65960f9d98223d4b54071); /* statement */ 
return cache.markets[marketId].isClosing;
    }

    function getPrice(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (Monetary.Price memory)
    {coverage_0xaa3216f1(0xbbb7d0bd4af869968fabdd517eb7676136f5b1d21cb7012addeb88a7e435c76a); /* function */ 

coverage_0xaa3216f1(0xce726215fe6af45f9ddf75fc7b4c3434437a2a4962fa84b0ec137f98675c7c7b); /* line */ 
        coverage_0xaa3216f1(0xf9df36ef3c4c64a56059c2d317236346cd6e18c0ab91a24d97f4afb6a3e782cb); /* statement */ 
return cache.markets[marketId].price;
    }

    function getBorrowPar(
        MarketCache memory cache,
        uint256 marketId
    )
        internal
        pure
        returns (uint128)
    {coverage_0xaa3216f1(0x1c74232bb0d30209ebb24ed76fbed4547c5363cf3a0f91f8e8f708a294070366); /* function */ 

coverage_0xaa3216f1(0x0aa073a42cf3e6b9a43027bea40a6d3f4a2cd5f474f9c00c48ce25f3cb428a42); /* line */ 
        coverage_0xaa3216f1(0x4bcd96470c989b96e69dfab9e4adbeb6b867108036ff68e246ec2f1b61848d6d); /* statement */ 
return cache.markets[marketId].borrowPar;
    }
}
