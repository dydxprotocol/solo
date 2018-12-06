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
import { LTypes } from "../lib/LTypes.sol";


contract InterestSetter is
    IInterestSetter
{
    using SafeMath for uint256;

    uint128 constant SECONDS_IN_A_YEAR = 60 * 60 * 24 * 365;

    LDecimal.D64 g_maxInterest;

    constructor(
        LDecimal.D64 memory maxInterest
    )
        public
    {
        g_maxInterest = maxInterest;
    }

    function getNewInterest(
        address token,
        LTypes.Principal memory borrowed,
        LTypes.Principal memory lent
    )
        public
        view
        returns (LDecimal.D64 memory)
    {
        // TODO: this whole contract
        token;
        borrowed;
        lent;
        return LDecimal.one64(); // returns 0% interest
    }
}
