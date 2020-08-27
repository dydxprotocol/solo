/*

    Copyright 2019 dYdX Trading Inc.

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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { IErc20 } from "../protocol/interfaces/IErc20.sol";
import { Math } from "../protocol/lib/Math.sol";


/**
 * @title TestCurve
 * @author dYdX
 *
 * Mock of the Curve contract.
 */
contract TestCurve {
    uint256 public fee = 4000000;
    uint256 public dy = 0;

    // ============ Getter Functions ============

    function get_dy_underlying(
        uint128 /* i */,
        uint128 /* j */,
        uint256 /* dx */
    )
        external
        view
        returns (uint256)
    {
        return dy;
    }

    // ============ Test Data Setter Functions ============

    function setFee(
        uint112 newFee
    )
        external
    {
        fee = newFee;
    }

    function setDy(
        uint112 newDy
    )
        external
    {
        dy = newDy;
    }
}
