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

import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Storage
 * @author dYdX
 *
 * Storing the state of the protocol
 */
contract Storage {

    // ============ Structs ============

    struct Account {
        mapping (uint256 => Types.Par) balances;
        mapping (address => bool) authorizedTraders;
        bool isLiquidating; // is able to be liquidated
    }

    struct Market {
        address token;
        Types.TotalPar totalPar;
        Interest.Index index;
        IPriceOracle priceOracle;
        IInterestSetter interestSetter;
    }

    // ============ Storage ============

    // number of markets
    uint256 g_numMarkets;

    // marketId => Market
    mapping (uint256 => Market) g_markets;

    // owner => account number => Account
    mapping (address => mapping (uint256 => Account)) g_accounts;

    // ============ Risk Parameters ============

    // collateral ratio at which accounts can be liquidated
    Decimal.D256 g_liquidationRatio;

    // (1 - g_liquidationSpread) is the percentage penalty incurred by liquidated accounts
    Decimal.D256 g_liquidationSpread;

    // Percentage of the borrower's interest fee that gets passed to the suppliers
    Decimal.D256 g_earningsRate;

    // The minimum absolute borrow value of an account
    // There must be sufficient incentivize to liquidate undercollateralized accounts
    Monetary.Value g_minBorrowedValue;

    // ============ Permissioning ============

    // Addresses that can control other users accounts
    mapping (address => mapping (address => bool)) g_operators;
}
