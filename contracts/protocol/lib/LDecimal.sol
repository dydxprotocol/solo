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

    uint256 constant public BASE = 10**18;

    // ============ Structs ============

    struct Decimal {
        uint256 value;
    }

    // ============ multiply with ints ============

    function mul(
        Decimal memory d,
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
        Decimal memory d,
        Decimal memory x
    )
        internal
        pure
        returns (uint256)
    {
        return x.value.mul(d.value).div(BASE).div(BASE);
    }

    // ============ invThenMul ============
    // returns target/d. Not called div because d is the first arg

    function invThenMul(
        Decimal memory d,
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
        Decimal memory a,
        Decimal memory b
    )
        internal
        pure
        returns (bool)
    {
        return a.value == b.value;
    }

    // ============ Creator Functions ============

    function zero()
        internal
        pure
        returns (Decimal memory)
    {
        return Decimal({ value: 0 });
    }

    function one()
        internal
        pure
        returns (Decimal memory)
    {
        return Decimal({ value: BASE });
    }
}
