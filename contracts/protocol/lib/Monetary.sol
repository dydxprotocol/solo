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

pragma solidity 0.5.3;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Math } from "./Math.sol";


/**
 * @title Monetary
 * @author dYdX
 *
 * TODO
 */
library Monetary {
    using SafeMath for uint256;

    // ============ Structs ============

    struct Price {
        uint256 value;
    }

    struct Value {
        uint256 value;
    }

    // ============ Library Functions ============

    function getValue(
        Price memory price,
        uint256 amount
    )
        internal
        pure
        returns (Value memory)
    {
        return Value({
            value: amount.mul(price.value)
        });
    }

    function add(
        Value memory a,
        Value memory b
    )
        internal
        pure
        returns (Value memory)
    {
        return Value({
            value: a.value.add(b.value)
        });
    }
}
