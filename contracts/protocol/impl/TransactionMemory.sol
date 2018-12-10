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
import { LTransactions } from "../lib/LTransactions.sol";
import { LMath } from "../lib/LMath.sol";
import { LTime } from "../lib/LTime.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTypes } from "../lib/LTypes.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LTokenInteract } from "../lib/LTokenInteract.sol";
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
    using LDecimal for LDecimal.D256;
    using LMath for uint256;
    using LTime for LTime.Time;
    using LTypes for LTypes.Principal;
    using LTypes for LTypes.TokenAmount;
    using LTypes for LTypes.SignedPrincipal;
    using LTypes for LTypes.SignedTokenAmount;
    using SafeMath for uint256;
    using SafeMath for uint128;
    using LTokenInteract for address;

    // ============ Reading Functions ============

    function _readWorldState(
        address trader,
        uint256 account
    )
        internal
        view
        returns (LTransactions.WorldState memory)
    {
        LTransactions.WorldState memory worldState;

        worldState.trader = trader;
        worldState.account = account;
        worldState.numAssets = g_activeTokens.length;
        worldState.assets = new LTransactions.AssetInfo[](worldState.numAssets);

        _readTokens(worldState);
        _readTotalPrincipals(worldState);
        _readIndexes(worldState);
        _readPrices(worldState);
        _readBalances(worldState);

        assert(worldState.numAssets == worldState.assets.length);
    }

    function _readTokens(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            worldState.assets[i].token = g_activeTokens[i];
        }
    }

    function _readIndexes(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        LTime.Time memory currentTime = LTime.currentTime();
        LTime.Time memory timeDelta = currentTime.sub(g_lastUpdate);
        LDecimal.D256 memory earningsRate = g_earningsRate;

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;

            // if no time has passed since the last update, then simply load the cached value
            if (timeDelta.value == 0) {
                worldState.assets[i].index = g_markets[token].index;
                continue;
            }

            // get previous rate
            LInterest.TotalPrincipal memory totalPrincipal = worldState.assets[i].totalPrincipal;
            LInterest.Rate memory rate = g_markets[token].interestSetter.getInterestRate(
                token,
                totalPrincipal
            );

            worldState.assets[i].index = LInterest.getUpdatedIndex(
                g_markets[token].index,
                rate,
                timeDelta,
                totalPrincipal,
                earningsRate
            );
        }
    }

    function _readTotalPrincipals(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            worldState.assets[i].totalPrincipal = g_markets[token].totalPrincipal;
        }
    }

    function _readPrices(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            worldState.assets[i].price = IPriceOracle(g_markets[token].oracle).getPrice(token);
        }
    }

    function _readBalances(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            worldState.assets[i].balance =
                worldState.assets[i].oldBalance =
                    g_accounts[worldState.trader][worldState.account].balances[token];
        }
    }

    // ============ Writing Functions ============

    function _writeWorldState(
        LTransactions.WorldState memory worldState
    )
        internal
    {
        _writeIndexes(worldState);
        _writeTotalPrincipals(worldState);
        _writeBalances(worldState);
    }

    function _writeIndexes(
        LTransactions.WorldState memory worldState
    )
        internal
    {
        LTime.Time memory currentTime = LTime.currentTime();
        if (g_lastUpdate.value == currentTime.value) {
            return;
        }

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            g_markets[token].index = worldState.assets[i].index;
        }

        g_lastUpdate = currentTime;
    }

    function _writeTotalPrincipals(
        LTransactions.WorldState memory worldState
    )
        internal
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            g_markets[token].totalPrincipal = worldState.assets[i].totalPrincipal;
        }
    }

    function _writeBalances(
        LTransactions.WorldState memory worldState
    )
        internal
    {
        for (uint256 i = 0; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            g_accounts[worldState.trader][worldState.account].balances[token] = worldState.assets[i].balance;
        }
    }

    // ============ Verification Functions ============

    function _verifyWorldState(
        LTransactions.WorldState memory worldState
    )
        internal
        view
    {
        // authenticate the msg.sender
        require(msg.sender == worldState.trader);
        // TODO: add other forms of authentication (onBehalfOf, approval mapping, etc)

        // verify the account is properly over-collateralized
        require(
            _verifyCollateralization(worldState),
            "Position cannot end up undercollateralized"
        );

        // ensure token balances
        for (uint256 i = 0 ; i < worldState.numAssets; i++) {
            address token = worldState.assets[i].token;
            LInterest.TotalPrincipal memory totalPrincipal = g_markets[token].totalPrincipal;
            LTypes.TokenAmount memory held = worldState.assets[i].token.balanceOf(address(this));
            LTypes.SignedPrincipal memory lent = LTypes.SignedPrincipal({
                sign: true,
                principal: totalPrincipal.lent
            });
            LTypes.SignedPrincipal memory borrowed = LTypes.SignedPrincipal({
                sign: false,
                principal: totalPrincipal.borrowed
            });
            LTypes.SignedTokenAmount memory lentTokenAmount =
                LInterest.signedPrincipalToTokenAmount(lent, worldState.assets[i].index);
            LTypes.SignedTokenAmount memory borrowedTokenAmount =
                LInterest.signedPrincipalToTokenAmount(borrowed, worldState.assets[i].index);
            LTypes.SignedTokenAmount memory expected = lentTokenAmount.sub(borrowedTokenAmount);
            require(expected.sign, "We cannot expect more to be borrowed than lent");
            require(held.value >= expected.tokenAmount.value, "We dont have as many tokens as expected");
        }
    }

    function _verifyCollateralization(
        LTransactions.WorldState memory worldState
    )
        internal
        view
        returns (bool)
    {
        LPrice.Value memory lentValue;
        LPrice.Value memory borrowedValue;

        for (uint256 i = 0; i < worldState.numAssets; i++) {
            LTypes.SignedPrincipal memory balance = worldState.assets[i].balance;

            if (balance.principal.value == 0) {
                continue;
            }

            LTypes.SignedTokenAmount memory tokenAmount = LInterest.signedPrincipalToTokenAmount(
                balance,
                worldState.assets[i].index
            );

            LPrice.Value memory overallValue = LPrice.getTotalValue(
                worldState.assets[i].price,
                tokenAmount.tokenAmount.value
            );

            if (tokenAmount.sign) {
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
