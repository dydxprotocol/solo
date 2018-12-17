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


/**
 * @title Math
 * @author dYdX
 *
 * TODO
 */
library Math {
    using SafeMath for uint256;

    // ============ Public Functions ============

    function getPartial(
        uint256 target,
        uint256 numerator,
        uint256 denominator
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(numerator).div(denominator);
    }

    function to128(
        uint256 x
    )
        internal
        pure
        returns (uint128)
    {
        uint128 r = uint128(x);
        require(r == x, "UNSAFE CAST TO UINT128");
        return r;
    }

    function to96(
        uint256 x
    )
        internal
        pure
        returns (uint96)
    {
        uint96 r = uint96(x);
        require(r == x, "UNSAFE CAST TO UINT96");
        return r;
    }

    function to64(
        uint256 x
    )
        internal
        pure
        returns (uint64)
    {
        uint64 r = uint64(x);
        require(r == x, "UNSAFE CAST TO UINT64");
        return r;
    }

    function to32(
        uint256 x
    )
        internal
        pure
        returns (uint32)
    {
        uint32 r = uint32(x);
        require(r == x, "UNSAFE CAST TO UINT32");
        return r;
    }
}
