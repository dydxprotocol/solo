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


library LDecimal {
    using SafeMath for uint256;

    // ============ Constants ============

    uint64 constant public BASE = 10**18;

    // ============ Structs ============

    struct D256 {
        uint256 value;
    }

    struct D128 {
        uint128 value;
    }

    struct D64 {
        uint64 value;
    }

    // ============ multiply with ints ============

    function mul(
        D256 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(d.value).div(BASE);
    }

    function mul(
        D128 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(d.value).div(BASE);
    }

    function mul(
        D64 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(d.value).div(BASE);
    }

    // ============ multiply with other decimals ============

    function mul(
        D256 memory d,
        D256 memory x
    )
        internal
        pure
        returns (uint256)
    {
        return x.value.mul(d.value).div(BASE).div(BASE);
    }

    function mul(
        D128 memory d,
        D128 memory x
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(x.value).mul(d.value).div(BASE).div(BASE);
    }

    function mul(
        D64 memory d,
        D64 memory x
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(x.value).mul(d.value).div(BASE).div(BASE);
    }

    // ============ invThenMul ============
    // returns target/d. Not called div because d is the first arg

    function invThenMul(
        D256 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(BASE).div(d.value);
    }

    function invThenMul(
        D128 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(BASE).div(d.value);
    }

    function invThenMul(
        D64 memory d,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(BASE).div(d.value);
    }

    // ============ Equality Functions ============

    function equals(
        D256 memory a,
        D256 memory b
    )
        internal
        pure
        returns (bool)
    {
        return a.value == b.value;
    }

    function equals(
        D128 memory a,
        D128 memory b
    )
        internal
        pure
        returns (bool)
    {
        return a.value == b.value;
    }

    function equals(
        D64 memory a,
        D64 memory b
    )
        internal
        pure
        returns (bool)
    {
        return a.value == b.value;
    }

    // ============ Creator Functions ============

    function zero256()
        internal
        pure
        returns (D256 memory)
    {
        return D256({ value: 0 });
    }

    function zero128()
        internal
        pure
        returns (D128 memory)
    {
        return D128({ value: 0 });
    }

    function zero64()
        internal
        pure
        returns (D64 memory)
    {
        return D64({ value: 0 });
    }

    function one256()
        internal
        pure
        returns (D256 memory)
    {
        return D256({ value: BASE });
    }

    function one128()
        internal
        pure
        returns (D128 memory)
    {
        return D128({ value: BASE });
    }

    function one64()
        internal
        pure
        returns (D64 memory)
    {
        return D64({ value: BASE });
    }
}
