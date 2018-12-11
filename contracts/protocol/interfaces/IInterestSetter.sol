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

import { LDecimal } from "../lib/LDecimal.sol";
import { LInterest } from "../lib/LInterest.sol";


contract IInterestSetter {

    // ============ Public Functions ============

    /**
     * Get the interest rate of a token given some borrowed and lent amounts
     *
     * @param  token        The address of the token to get the interest rate for
     * @param  totalNominal The total borrow/supply nominal amounts
     * @return              The interest rate per second
     */
    function getInterestRate(
        address token,
        LInterest.TotalNominal memory totalNominal
    )
        public
        view
        returns (LInterest.Rate memory);
}
