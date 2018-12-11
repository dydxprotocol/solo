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

import { LPrice } from "../lib/LPrice.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LTime } from "../lib/LTime.sol";
import { LTypes } from "../lib/LTypes.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";


/**
 * @title Storage
 * @author dYdX
 *
 * Storing the state of the protocol
 */
contract Storage {

    // ============ Structs ============

    struct Account {
        mapping (uint256 => LTypes.SignedNominal) balances;
        LTime.Time closingTime;
    }

    struct Market {
        address token;
        LInterest.TotalNominal totalNominal;
        LInterest.Index index;
        IPriceOracle priceOracle;
        IInterestSetter interestSetter;
    }

    // ============ Storage ============

    // timestamp of the last index update
    LTime.Time g_lastUpdate;

    // number of markets
    uint256 g_numMarkets;

    // marketId => Market
    mapping (uint256 => Market) g_markets;

    // trader => account number => Account
    mapping (address => mapping (uint256 => Account)) g_accounts;

    // ============ Risk Parameters ============

    // collateral ratio at which accounts can be liquidated
    LDecimal.Decimal g_minCollateralRatio;

    // (1 - g_liquidationSpread) is the percentage penalty incurred by liquidated accounts
    LDecimal.Decimal g_liquidationSpread;

    // (1 - g_earningsRate) is the percentage fee that the exchange takes of lender's earnings
    LDecimal.Decimal g_earningsRate;

    // the minimum value of a negative position
    LPrice.Value g_minBorrowedValue;
}
