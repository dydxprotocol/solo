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


interface IInterestOracle {

    // ============ Public Functions ============

    /**
     * Get the interest rate of a token given some borrowed and lent amounts
     *
     * @param  token     The address of the token to get the interest rate for
     * @param  borrowed  The principal amount of token borrowed
     * @param  lent      The principal amount of token lent
     * @return           The interest rate per second
     */
    function getNewInterest(
        address token,
        uint128 borrowed,
        uint128 lent
    )
        external
        view
        returns (uint64);
}
