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

import { LInterest } from "./lib/LInterest.sol";


contract SoloMarginStorage {

    // ============ Structs ============

    struct Principals {
        uint128 borrowed;
        uint128 lent;
    }

    struct Balance {
        bool positive;
        uint128 principal;
    }

    // ============ Storage ============

    // address of price oracle
    address g_priceOracle;

    // address of interest oracle
    address g_interestOracle;

    // array of all approved tokens
    address[] g_approvedTokens;

    // collateral ratio at which accounts can be liquidated
    uint256 g_minCollateralRatio;

    // percentage spread of what trades are acceptable
    uint256 g_spread;

    // trader => account => token => balance
    mapping (address => mapping (uint256 => mapping (address => Balance))) g_balances;

    // trader => account => is closing
    mapping (address => mapping (uint256 => bool)) g_closing;

    // token address => principals
    mapping (address => Principals) g_principals;

    // token address => interestIndex
    mapping (address => LInterest.Index) g_index;

    // token address => interestRate
    mapping (address => uint64) g_rate;
}
