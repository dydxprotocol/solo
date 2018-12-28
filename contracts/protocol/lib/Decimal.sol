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

pragma solidity ^0.5.0;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Decimal
 * @author dYdX
 *
 * TODO
 */
library Decimal {
    using SafeMath for uint256;

    // ============ Constants ============

    uint256 constant public BASE = 10**18;

    // ============ Structs ============

    struct D256 {
        uint256 value;
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

    // ============ multiply with other decimals ============

    function add(
        D256 memory a,
        D256 memory b
    )
        internal
        pure
        returns (D256 memory)
    {
        return D256({ value: a.value.add(b.value) });
    }

    function sub(
        D256 memory a,
        D256 memory b
    )
        internal
        pure
        returns (D256 memory)
    {
        return D256({ value: a.value.sub(b.value) });
    }

    // ============ Creator Functions ============

    function one()
        internal
        pure
        returns (D256 memory)
    {
        return D256({ value: BASE });
    }
}
