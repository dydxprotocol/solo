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

import { LDecimal } from "./lib/LDecimal.sol";
import { LInterest } from "./lib/LInterest.sol";
import { LTime } from "./lib/LTime.sol";
import { LTypes } from "./lib/LTypes.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";


contract SoloMarginStorage {

    // ============ Structs ============

    struct Balance {
        bool positive;
        LTypes.Principal principal;
    }

    struct Account {
        mapping (address => Balance) balances;
        LTime.Time closingTime;
    }

    struct Principals {
        LTypes.Principal borrowed;
        LTypes.Principal lent;
    }

    struct Market {
        Principals principals;
        LInterest.Index index;
        IPriceOracle oracle;
        IInterestSetter interestSetter;
    }

    // ============ Storage ============

    // array of all approved tokens
    address[] g_activeTokens;

    // token address => principals
    mapping (address => Market) g_markets;

    // trader => account number => Account
    mapping (address => mapping (uint256 => Account)) g_accounts;

    // ============ Risk Parameters ============

    // collateral ratio at which accounts can be liquidated
    // default: 1.30
    LDecimal.D256 g_minCollateralRatio;

    // percentage spread of what trades are acceptable
    // default: 0.95
    LDecimal.D256 g_liquidationSpread;
}
