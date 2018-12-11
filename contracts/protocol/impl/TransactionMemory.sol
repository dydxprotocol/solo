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
pragma experimental ABIEncoderV2;

import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LActions } from "../lib/LActions.sol";
import { LMath } from "../lib/LMath.sol";
import { LTime } from "../lib/LTime.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTypes } from "../lib/LTypes.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LToken } from "../lib/LToken.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Storage } from "./Storage.sol";


/**
 * @title TransactionMemory
 * @author dYdX
 *
 * Functions for reading, writing, and verifying storage
 */
contract TransactionMemory is
    Storage
{
    using LDecimal for LDecimal.Decimal;
    using LMath for uint256;
    using LTime for LTime.Time;
    using LTypes for LTypes.SignedNominal;
    using LTypes for LTypes.SignedAccrued;
    using SafeMath for uint256;
    using SafeMath for uint128;

    // ============ Reading Functions ============

    function _readWorldState(
        address trader,
        uint256 account
    )
        internal
        view
        returns (LActions.WorldState memory)
    {
        LActions.WorldState memory worldState;

        worldState.trader = trader;
        worldState.account = account;
        worldState.numAssets = g_numMarkets;
        worldState.assets = new LActions.AssetInfo[](worldState.numAssets);

        _readTokens(worldState);
        _readTotalNominals(worldState);
        _readIndexes(worldState);
        _readPrices(worldState);
        _readBalances(worldState);

        assert(worldState.numAssets == worldState.assets.length);
    }

    function _readTokens(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            worldState.assets[i].token = g_markets[i].token;
        }
    }

    function _readIndexes(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        LTime.Time memory currentTime = LTime.currentTime();
        LTime.Time memory timeDelta = currentTime.sub(g_lastUpdate);
        LDecimal.Decimal memory earningsRate = g_earningsRate;

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            // if no time has passed since the last update, then simply load the cached value
            if (timeDelta.value == 0) {
                worldState.assets[i].index = g_markets[i].index;
                continue;
            }

            // get previous rate
            LInterest.TotalNominal memory totalNominal = worldState.assets[i].totalNominal;
            LInterest.Rate memory rate = g_markets[i].interestSetter.getInterestRate(
                worldState.assets[i].token,
                totalNominal
            );

            worldState.assets[i].index = LInterest.getUpdatedIndex(
                g_markets[i].index,
                rate,
                timeDelta,
                totalNominal,
                earningsRate
            );
        }
    }

    function _readTotalNominals(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            worldState.assets[i].totalNominal = g_markets[i].totalNominal;
        }
    }

    function _readPrices(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            worldState.assets[i].price = IPriceOracle(g_markets[i].priceOracle).getPrice(token);
        }
    }

    function _readBalances(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            worldState.assets[i].balance =
                worldState.assets[i].oldBalance =
                    g_accounts[worldState.trader][worldState.account].balances[i];
        }
    }

    // ============ Writing Functions ============

    function _writeWorldState(
        LActions.WorldState memory worldState
    )
        internal
    {
        _writeIndexes(worldState);
        _writeTotalNominals(worldState);
        _writeBalances(worldState);
    }

    function _writeIndexes(
        LActions.WorldState memory worldState
    )
        internal
    {
        LTime.Time memory currentTime = LTime.currentTime();
        if (g_lastUpdate.value == currentTime.value) {
            return;
        }

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            g_markets[i].index = worldState.assets[i].index;
        }

        g_lastUpdate = currentTime;
    }

    function _writeTotalNominals(
        LActions.WorldState memory worldState
    )
        internal
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            g_markets[i].totalNominal = worldState.assets[i].totalNominal;
        }
    }

    function _writeBalances(
        LActions.WorldState memory worldState
    )
        internal
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            g_accounts[worldState.trader][worldState.account].balances[i] = worldState.assets[i].balance;
        }
    }

    // ============ Verification Functions ============

    function _verifyWorldState(
        LActions.WorldState memory worldState
    )
        internal
        view
    {
        // authenticate the msg.sender
        require(msg.sender == worldState.trader);
        // TODO: add other forms of authentication (onBehalfOf, approval mapping, etc)

        // verify the account is properly over-collateralized
        _verifyCollateralization(worldState);

        // ensure token balances
        for (uint256 i = 0 ; i < worldState.numAssets; i++) {
            LTypes.SignedAccrued memory held = LToken.thisBalance(worldState.assets[i].token);
            LTypes.SignedNominal memory lent = LTypes.SignedNominal({
                sign: true,
                nominal: g_markets[i].totalNominal.supply
            });
            LTypes.SignedNominal memory borrowed = LTypes.SignedNominal({
                sign: false,
                nominal: g_markets[i].totalNominal.borrow
            });
            LTypes.SignedAccrued memory lentAccrued =
                LInterest.nominalToAccrued(lent, worldState.assets[i].index);
            LTypes.SignedAccrued memory borrowedAccrued =
                LInterest.nominalToAccrued(borrowed, worldState.assets[i].index);
            LTypes.SignedAccrued memory expected = lentAccrued.sub(borrowedAccrued);
            require(expected.sign, "We cannot expect more to be borrowed than lent");
            require(held.accrued.value >= expected.accrued.value, "We dont have as many tokens as expected");
        }
    }

    function _verifyCollateralization(
        LActions.WorldState memory worldState
    )
        internal
        view
        returns (bool)
    {
        LPrice.Value memory lentValue;
        LPrice.Value memory borrowedValue;

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            LTypes.SignedNominal memory balance = worldState.assets[i].balance;

            if (balance.nominal.value == 0) {
                continue;
            }

            LTypes.SignedAccrued memory accrued = LInterest.nominalToAccrued(
                balance,
                worldState.assets[i].index
            );

            LPrice.Value memory overallValue = LPrice.getTotalValue(
                worldState.assets[i].price,
                accrued.accrued.value
            );

            if (accrued.sign) {
                lentValue = LPrice.add(lentValue, overallValue);
            } else {
                borrowedValue = LPrice.add(borrowedValue, overallValue);
            }
        }

        // always okay if borrowed amount is zero
        if (borrowedValue.value == 0) {
            return true;
        }

        // don't let borrowed amount be less than a dollar??? TODO: improve this logic
        if (borrowedValue.value < g_minBorrowedValue.value) {
            return false;
        }

        return lentValue.value >= g_minCollateralRatio.mul(borrowedValue.value);
    }
}
