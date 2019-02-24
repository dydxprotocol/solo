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

pragma solidity 0.5.4;

import { FastMath } from "./FastMath.sol";
import { Math } from "./Math.sol";


/**
 * @title Monetary
 * @author dYdX
 *
 * Library for types involving money
 */
library Monetary {
    using FastMath for uint256;

    // ============ Structs ============

    struct Price {
        uint256 value;
    }

    struct Value {
        uint256 value;
    }
}
