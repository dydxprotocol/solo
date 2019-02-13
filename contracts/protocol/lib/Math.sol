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
import { Require } from "./Require.sol";


/**
 * @title Math
 * @author dYdX
 *
 * TODO
 */
library Math {
    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "Math";

    // ============ Library Functions ============

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

    function getPartialRoundUp(
        uint256 target,
        uint256 numerator,
        uint256 denominator
    )
        internal
        pure
        returns (uint256)
    {
        if (target == 0 || numerator == 0) {
            // SafeMath will check for zero denominator
            return SafeMath.div(0, denominator);
        }
        return numerator.mul(target).sub(1).div(denominator).add(1);
    }

    function to128(
        uint256 x
    )
        internal
        pure
        returns (uint128)
    {
        uint128 r = uint128(x);
        Require.that(
            r == x,
            FILE,
            "Unsafe cast to uint128"
        );
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
        Require.that(
            r == x,
            FILE,
            "Unsafe cast to uint96"
        );
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
        Require.that(
            r == x,
            FILE,
            "Unsafe cast to uint64"
        );
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
        Require.that(
            r == x,
            FILE,
            "Unsafe cast to uint32"
        );
        return r;
    }
}
