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

import { Price } from "../lib/Price.sol";


/**
 * @title IPriceOracle
 * @author dYdX
 *
 * TODO
 */
contract IPriceOracle {

    // ============ Public Functions ============

    /**
     * Get the price of a token
     *
     * @return  The USD price of a base unit of the token, then multiplied by 10^36.
     *          So a stablecoin with 18 decimal places would return 10^18.
     *          Remember that this is the price of the base unit rather than the price of a
     *          "human-readable" token amount. Every ERC20 may have a different number of decimals.
     */
    function getPrice(
        address token
    )
        public
        view
        returns (Price.Price memory);

}
