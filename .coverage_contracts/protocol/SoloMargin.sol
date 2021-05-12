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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { Admin } from "./Admin.sol";
import { Getters } from "./Getters.sol";
import { Operation } from "./Operation.sol";
import { Permission } from "./Permission.sol";
import { State } from "./State.sol";
import { Storage } from "./lib/Storage.sol";


/**
 * @title SoloMargin
 * @author dYdX
 *
 * Main contract that inherits from other contracts
 */
contract SoloMargin is
    State,
    Admin,
    Getters,
    Operation,
    Permission
{
function coverage_0xf33a7812(bytes32 c__0xf33a7812) public pure {}

    // ============ Constructor ============

    constructor(
        Storage.RiskParams memory riskParams,
        Storage.RiskLimits memory riskLimits
    )
        public
    {coverage_0xf33a7812(0xbb36d04f5e717e885a04fc95bcebc0d9f940e054e8c1d2d9b060cc06409fd364); /* function */ 

coverage_0xf33a7812(0x89b9cf18b2fbf02a796e4aa7d0c28c2dc2a208171b893591c8d76adf2b11fbdd); /* line */ 
        coverage_0xf33a7812(0xfae9434e7a279e379d0e72e4b4df21b19443809a4aae80b10567465f949064c8); /* statement */ 
g_state.riskParams = riskParams;
coverage_0xf33a7812(0x680a681163a995de213032317345cf9ceae32f22bfb1dfb170318ee8c4e83617); /* line */ 
        coverage_0xf33a7812(0xa9d430b2a36f6ebb15a56c184e3c93e37aeefc6543543d1ab30a9a5ce9a11c8d); /* statement */ 
g_state.riskLimits = riskLimits;
    }
}
