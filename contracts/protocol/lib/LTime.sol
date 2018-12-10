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
import { LMath } from "./LMath.sol";


library LTime {
    using LMath for uint256;
    using SafeMath for uint256;
    
    // ============ Structs ============

    struct Time {
        uint32 value;
    }

    // ============ Public Functions ============

    function currentTime()
        internal
        view
        returns (Time memory)
    {
        uint32 timestamp = uint32(block.timestamp);
        require(uint256(timestamp) == block.timestamp, "WE LIVE IN THE FUTURE");
        return Time({ value: timestamp });
    }

    function toTime(
        uint256 t
    )
        internal
        pure
        returns (Time memory)
    {
        return Time({ value: t.to32() });
    }

    function sub(
        Time memory t1,
        Time memory t0
    )
        internal
        pure
        returns (Time memory)
    {
        require(t1.value >= t0.value, "TIME FAILURE");
        return Time({ value: t1.value - t0.value });
    }

    function equals(
        Time memory a,
        Time memory b
    )
        internal
        pure
        returns (bool)
    {
        return a.value == b.value;
    }

    function hasHappened(
        Time memory t
    )
        internal
        view
        returns (bool)
    {
        return (t.value != 0) && (t.value <= currentTime().value);
    }
}
