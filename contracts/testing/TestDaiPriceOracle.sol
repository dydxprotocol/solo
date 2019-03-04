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

import { DaiPriceOracle } from "../protocol/oracles/DaiPriceOracle.sol";


/**
 * @title TestDaiPriceOracle
 * @author dYdX
 *
 * DaiPriceOracle for testing
 */
contract TestDaiPriceOracle is
    DaiPriceOracle
{
    // ============ Storage ============

    uint256 public MOCK_MEDIANIZER_PRICE;

    uint256 public MOCK_OASIS_PRICE;

    uint256 public MOCK_UNISWAP_PRICE;

    // ============ Testing Functions ============

    function setMedianizerPrice(
        uint256 newMockPrice
    )
        external
    {
        MOCK_MEDIANIZER_PRICE = newMockPrice;
    }

    function setOasisPrice(
        uint256 newMockPrice
    )
        external
    {
        MOCK_OASIS_PRICE = newMockPrice;
    }

    function setUniswapPrice(
        uint256 newMockPrice
    )
        external
    {
        MOCK_UNISWAP_PRICE = newMockPrice;
    }

    // ============ Overwritten Functions ============

    function getMedianizerPrice()
        public
        view
        returns (uint256)
    {
        if (MOCK_MEDIANIZER_PRICE != 0) {
            return MOCK_MEDIANIZER_PRICE;
        }
        return super.getMedianizerPrice();
    }

    function getOasisPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        if (MOCK_OASIS_PRICE != 0) {
            return MOCK_OASIS_PRICE;
        }
        return super.getOasisPrice(ethUsd);
    }

    function getUniswapPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        if (MOCK_UNISWAP_PRICE != 0) {
            return MOCK_UNISWAP_PRICE;
        }
        return super.getUniswapPrice(ethUsd);
    }
}
