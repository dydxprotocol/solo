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

import { IInterestOracle } from "../interfaces/IInterestOracle.sol";
import { LInterest } from "../lib/LInterest.sol";


contract InterestOracle is IInterestOracle {
    uint128 constant SECONDS_IN_A_YEAR = 60 * 60 * 24 * 365;

    uint128 g_maxInterest;

    constructor(
        uint64 maxPercentage
    )
        public
    {
        g_maxInterest = maxPercentage * LInterest.BASE() / 100 / SECONDS_IN_A_YEAR;
    }

    function getNewInterest(
        address token,
        uint128 borrowed,
        uint128 lent
    )
        external
        view
        returns (uint64)
    {
        return LInterest.BASE() + (g_maxInterest * borrowed / lent);
    }
}
