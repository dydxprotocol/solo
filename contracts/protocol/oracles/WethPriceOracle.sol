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

import { IMakerOracle } from "../../external/interfaces/IMakerOracle.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Monetary } from "../lib/Monetary.sol";


/**
 * @title WethPriceOracle
 * @author dYdX
 *
 * PriceOracle that returns the price of Wei in USD
 */
contract WethPriceOracle is
    IPriceOracle
{
    // ============ Storage ============

    IMakerOracle public MEDIANIZER;

    // ============ Constructor =============

    constructor(
        address medianizer
    )
        public
    {
        MEDIANIZER = IMakerOracle(medianizer);
    }

    // ============ IPriceOracle Functions =============

    function getPrice(
        /* address token */
    )
        public
        view
        returns (Monetary.Price memory)
    {
        (bytes32 value, /* bool fresh */) = MEDIANIZER.peek();
        // TODO: require if the price is not fresh? this will lock the protocol
        return Monetary.Price({ value: uint256(value) });
    }
}
