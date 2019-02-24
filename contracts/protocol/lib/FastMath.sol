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


/**
 * @title FastMath
 * @author dYdX
 *
 * Gas-optimized version of Open Zeppelin's SafeMath
 * The current Solidity compiler fails to optimize the non-assembly version
 */
library FastMath {

    // solium-disable-next-line security/no-named-returns
    function mul(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256 r)
    {
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            switch a
            case 0 {}
            default {
              r := mul(a, b)

              switch iszero(eq(div(r, a), b))
              case 1 {
                  revert(0, 0)
              }
            }
        }
    }

    // solium-disable-next-line security/no-named-returns
    function div(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256 r)
    {
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            switch b
            case 0 {
                revert(0, 0)
            }
            r := div(a, b)
        }
    }

    // solium-disable-next-line security/no-named-returns
    function sub(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256 r)
    {
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            switch lt(a, b)
            case 1 {
                revert(0, 0)
            }
            r := sub(a, b)
        }
    }

    // solium-disable-next-line security/no-named-returns
    function add(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256 r)
    {
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            r := add(a, b)
            switch lt(r, a)
            case 1 {
                revert(0, 0)
            }
        }
    }
}
