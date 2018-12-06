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

library LTypes {
    using SafeMath for uint128;
    using LMath for uint256;

    struct Principal {
        uint128 value;
    }

    struct TokenAmount {
        uint256 value;
    }

    function sub(
        Principal memory a,
        Principal memory b
    )
        internal
        pure
        returns (Principal memory)
    {
        return Principal({ value: a.value.sub(b.value).to128() });
    }

    function add(
        Principal memory a,
        Principal memory b
    )
        internal
        pure
        returns (Principal memory)
    {
        return Principal({ value: a.value.add(b.value).to128() });
    }

}
