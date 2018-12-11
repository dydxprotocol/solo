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

import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LInterest } from "../lib/LInterest.sol";


contract InterestSetter is
    IInterestSetter
{
    using SafeMath for uint256;

    uint128 constant SECONDS_IN_A_YEAR = 60 * 60 * 24 * 365;

    LInterest.Rate g_maxInterest;

    constructor(
        LInterest.Rate memory maxInterest
    )
        public
    {
        g_maxInterest = maxInterest;
    }

    function getInterestRate(
        address token,
        LInterest.TotalNominal memory totalNominal
    )
        public
        view
        returns (LInterest.Rate memory)
    {
        // TODO: this whole contract
        token;
        totalNominal;
        return LInterest.Rate({ value: 10**18 });
    }
}
