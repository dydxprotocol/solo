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

import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Monetary } from "../lib/Monetary.sol";


/**
 * @title PriceOracle
 * @author dYdX
 *
 * TODO
 */
contract PriceOracle is IPriceOracle{

    mapping (address => uint128) g_prices;

    function setPrice(
        address token,
        uint128 price
    )
        external
    {
        g_prices[token] = price;
    }

    function getPrice(
        address token
    )
        public
        view
        returns (Monetary.Price memory)
    {
        // TODO: this whole contract
        require(
            g_prices[token] != 0,
            "TODO_REASON"
        );
        return Monetary.Price({
            value: g_prices[token]
        });
    }
}
