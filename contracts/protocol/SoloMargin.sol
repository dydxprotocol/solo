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
pragma experimental ABIEncoderV2;

import { Admin } from "./impl/Admin.sol";
import { Interactions } from "./impl/Interactions.sol";
import { Permissions } from "./impl/Permissions.sol";
import { Queries } from "./impl/Queries.sol";


/**
 * @title SoloMargin
 * @author dYdX
 *
 * TODO
 */
contract SoloMargin is
    Interactions,
    Permissions,
    Admin,
    Queries
{
    // ============ Constructor ============

    constructor(
        address adminlib,
        RiskParams memory rp,
        RiskLimits memory rl
    )
        public
    {
        g_adminlib = adminlib;
        g_riskParams = rp;
        g_riskLimits = rl;
    }
}
