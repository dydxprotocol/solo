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
import { Decimal } from "./lib/Decimal.sol";
import { Monetary } from "./lib/Monetary.sol";


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
    // ============ Structs ============

    struct RiskParameters {
        uint64 MAX_INTEREST_RATE;

        uint64 MAX_LIQUIDATION_RATIO;
        uint64 LIQUIDATION_RATIO;
        uint64 MIN_LIQUIDATION_RATIO;

        uint64 MAX_LIQUIDATION_SPREAD;
        uint64 LIQUIDATION_SPREAD;
        uint64 MIN_LIQUIDATION_SPREAD;

        uint64 MIN_EARNINGS_RATE;
        uint64 EARNINGS_RATE;
        uint64 MAX_EARNINGS_RATE;

        uint128 MAX_MIN_BORROWED_VALUE;
        uint128 MIN_BORROWED_VALUE;
        uint128 MIN_MIN_BORROWED_VALUE;
    }

    // ============ Constructor ============

    constructor(
        address adminlib,
        RiskParameters memory rp
    )
        public
    {
        g_adminlib = adminlib;
        MAX_INTEREST_RATE = rp.MAX_INTEREST_RATE;
        MAX_LIQUIDATION_RATIO = rp.MAX_LIQUIDATION_RATIO;
        MIN_LIQUIDATION_RATIO = rp.MIN_LIQUIDATION_RATIO;
        MAX_LIQUIDATION_SPREAD = rp.MAX_LIQUIDATION_SPREAD;
        MIN_LIQUIDATION_SPREAD = rp.MIN_LIQUIDATION_SPREAD;
        MAX_EARNINGS_RATE = rp.MAX_EARNINGS_RATE;
        MIN_EARNINGS_RATE = rp.MIN_EARNINGS_RATE;
        MAX_MIN_BORROWED_VALUE = rp.MAX_MIN_BORROWED_VALUE;
        MIN_MIN_BORROWED_VALUE = rp.MIN_MIN_BORROWED_VALUE;
        g_liquidationRatio =  Decimal.D256({ value: rp.LIQUIDATION_RATIO });
        g_liquidationSpread = Decimal.D256({ value: rp.LIQUIDATION_SPREAD });
        g_earningsRate =      Decimal.D256({ value: rp.EARNINGS_RATE });
        g_minBorrowedValue =  Monetary.Value({ value: rp.MIN_BORROWED_VALUE });
    }
}
