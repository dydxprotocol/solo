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

    uint64 constant public BASE = 10**18;

    struct Index {
        uint128 i; // current index of the token. starts at BASE and is monotonically increasing
        uint32 t; // last updated timestamp of the index
        uint64 r; // current interest rate per second (times BASE)
    }

    // ============ Public Functions ============

    function getUpdatedIndex(
        Index memory index
    )
        internal
        view
        returns (Index memory)
    {
        uint32 t = now32();
        uint128 i = _getInterest(
            index.i,
            index.r,
            uint32(uint256(index.t).sub(t))
        );
        return Index({
            i: i,
            t: t,
            r: index.r
        });
    }

    function principalToAmount(
        uint256 target,
        uint128 interest
    )
        internal
        view
        returns (uint256)
    {
        return target.mul(interest).div(BASE);
    }

    function amountToPrincipal(
        uint256 target,
        uint128 interest
    )
        internal
        view
        returns (uint256)
    {
        return target.mul(BASE).div(interest);
    }

    function now32()
        internal
        view
        returns (uint32)
    {
        return uint32(block.timestamp);
    }

    function newIndex()
        internal
        view
        returns (Index memory)
    {
        return Index({
            i: BASE,
            t: now32(),
            r: 0
        });
    }

    // ============ Private Functions ============

    function _getInterest(
        uint128 principal,
        uint64 interest,
        uint32 time
    )
        internal
        view
        returns (uint128)
    {
        // aggregate is the result of the caulculation
        uint128 aggregate = BASE;

        // localInterest is interest^(2^rounds)
        uint128 localInterest = uint128(interest);
        uint256 localTime = uint256(time);

        while (localTime != 0) {

            if (localTime & 1 != 0) {
                aggregate = _multiply(aggregate, localInterest);
            }

            localTime = localTime >> 1;
            localInterest = _multiply(localInterest, localInterest);
        }

        return uint128(_multiply(principal, aggregate));
    }

    function _multiply(
        uint128 x,
        uint128 y
    )
        private
        pure
        returns (uint128)
    {
        uint256 val = uint256(x) * uint256(y) / BASE;
        assert(uint128(val) == val);
        return uint128(val);
    }
}
