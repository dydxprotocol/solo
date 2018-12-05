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


interface IPriceOracle {

    // ============ Public Functions ============

    /**
     * Get the price of a token
     *
     * @param  token  Address of the token to get the price for
     * @return        The wei price of the token in USD, multiplied by 10**18
     */
    function getPrice(
        address token
    )
        external
        view
        returns (uint128);

}
