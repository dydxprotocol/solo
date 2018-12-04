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

import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";


library LInterest {
    using SafeMath for uint256;

    uint64 constant BASE = 10**18;

    struct Index {
        uint128 i; // current index of the token. starts at BASE and is monotonically increasing
        uint32 t; // last updated timestamp of the index
    }

    // ============ Public Functions ============

    function getInterest(
        uint256 principal,
        uint64 interest,
        uint32 time
    )
        external
        view
        returns (uint256)
    {
        // aggregate is the result of the caulculation
        uint256 aggregate = BASE;

        // localInterest is interest^(2^rounds)
        uint256 localInterest = uint256(interest);
        uint256 localTime = uint256(time);

        while (localTime != 0) {

            if (localTime & 1 != 0) {
                aggregate = _multiply(aggregate, localInterest);
            }

            localTime = localTime >> 1;
            localInterest = _multiply(localInterest, localInterest);
        }

        return _multiply(principal, aggregate);
    }

    function multiplyByInterest(
        uint256 target,
        uint64 interest
    )
        external
        view
        returns (uint256)
    {
        return target.mul(interest).div(BASE);
    }

    function divideByInterest(
        uint256 target,
        uint64 interest
    )
        external
        view
        returns (uint256)
    {
        return target.mul(BASE).div(interest);
    }

    // ============ Private Functions ============

    function _multiply(
        uint256 x,
        uint256 y
    )
        private
        pure
        returns (uint256)
    {
        return x * y / BASE;
    }

    function _now32()
        private
        view
        returns (uint32)
    {
        return uint32(block.timestamp);
    }
}
