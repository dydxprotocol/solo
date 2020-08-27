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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IUniswapV2Pair } from "../external/interfaces/IUniswapV2Pair.sol";


/**
 * @title TestUniswapV2Pair
 * @author dYdX
 *
 * Mock Uniswap V2 pair.
 */
contract TestUniswapV2Pair is
    IUniswapV2Pair
{
    uint112 public RESERVE0 = 0;
    uint112 public RESERVE1 = 0;

    // ============ Getter Functions ============

    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
    {
        return (RESERVE0, RESERVE1, 0);
    }

    // ============ Test Data Setter Functions ============

    function setReserves(
        uint112 reserve0,
        uint112 reserve1
    )
        external
    {
        RESERVE0 = reserve0;
        RESERVE1 = reserve1;
    }
}
