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
 * @title WorldManager
 * @author dYdX
 *
 * Functions for reading, writing, and verifying storage
 */
contract WorldManager is
    Storage
{
    using LDecimal for LDecimal.Decimal;
    using LMath for uint256;
    using LTypes for LTypes.SignedNominal;
    using LTypes for LTypes.SignedAccrued;
    using SafeMath for uint256;
    using SafeMath for uint128;

    // ============ Structs ============

    struct WorldState {
        AssetState[] assets;
        AccountState[] accounts;
        LDecimal.Decimal earningsTax;
    }

    struct AccountInfo {
        address trader;
        uint256 account;
    }

    struct AccountState {
        AccountInfo info;
        LTypes.SignedNominal[] balance;
        LTypes.SignedNominal[] oldBalance;
        uint32 closingTime;

        // need to check permissions for every account that was touched except for ones that were
        // only liquidated
        bool checkPermission;
    }

    struct AssetState {
        address token;
        LInterest.Index index;
        LPrice.Price price;
        // doesn't cache totalNominal, just recalculates it at the end if needed
    }

    // ============ Getter Functions ============

    function wsGetToken(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (address)
    {
        if (worldState.assets[marketId].token == address(0)) {
            worldState.assets[marketId].token = g_markets[marketId].token;
        }
        return worldState.assets[marketId].token;
    }

    function wsGetIndex(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (LInterest.Index memory)
    {
        if (worldState.assets[marketId].index.lastUpdate == 0) {
            _loadIndex(worldState, marketId);
        }
        return worldState.assets[marketId].index;
    }

    function wsGetPrice(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (LPrice.Price memory)
    {
        if (worldState.assets[marketId].price.value == 0) {
            _loadPrice(worldState, marketId);
        }
        return worldState.assets[marketId].price;
    }

    function wsGetClosingTime(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
        returns (uint32)
    {
        return worldState.accounts[accountId].closingTime;
    }

    function wsGetBalance(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId
    )
        internal
        pure
        returns (LTypes.SignedNominal memory)
    {
        return worldState.accounts[accountId].balance[marketId];
    }

    function wsGetOldBalance(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId
    )
        internal
        pure
        returns (LTypes.SignedNominal memory)
    {
        return worldState.accounts[accountId].oldBalance[marketId];
    }

    function wsGetEarningsTax(
        WorldState memory worldState
    )
        internal
        view
        returns (LDecimal.Decimal memory)
    {
        if (worldState.earningsTax.value == 0) {
            _loadEarningsTax(worldState);
        }
        return worldState.earningsTax;
    }

    // ============ Setter Functions ============

    function wsSetCheckPerimissions(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
    {
        worldState.accounts[accountId].checkPermission = true;
    }

    function wsSetBalance(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        LTypes.SignedNominal memory newBalance
    )
        internal
        pure
    {
        worldState.accounts[accountId].balance[marketId] = newBalance;
    }

    function wsSetBalanceFromDeltaAccrued(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        LTypes.SignedAccrued memory deltaAccrued
    )
        internal
        view
    {
        LInterest.Index memory index = wsGetIndex(worldState, marketId);
        LTypes.SignedNominal memory b0 = wsGetBalance(worldState, accountId, marketId);
        LTypes.SignedAccrued memory a0 = LInterest.nominalToAccrued(b0, index);
        LTypes.SignedAccrued memory a1 = a0.add(deltaAccrued);
        LTypes.SignedNominal memory newBalance = LInterest.accruedToNominal(a1, index);
        wsSetBalance(worldState, accountId, marketId, newBalance);
    }

    function wsSetBalanceFromAmountStruct(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        LActions.Amount memory amount
    )
        internal
        view
        returns (LTypes.SignedAccrued memory)
    {
        LTypes.SignedNominal memory newNominal;
        LTypes.SignedAccrued memory deltaAccrued;

        LInterest.Index memory index = wsGetIndex(worldState, marketId);
        LTypes.SignedNominal memory nominal = wsGetBalance(worldState, accountId, marketId);
        LTypes.SignedAccrued memory accrued = LInterest.nominalToAccrued(
            nominal,
            index
        );

        if (amount.denom == LActions.AmountDenomination.Accrued) {
            if (amount.ref == LActions.AmountReference.Delta) {
                deltaAccrued = LActions.amountToSignedAccrued(amount);
            } else if (amount.ref == LActions.AmountReference.Target) {
                deltaAccrued = LActions.amountToSignedAccrued(amount).sub(accrued);
            }
            newNominal = LInterest.accruedToNominal(deltaAccrued.add(accrued), index);
        } else if (amount.denom == LActions.AmountDenomination.Nominal) {
            if (amount.ref == LActions.AmountReference.Delta) {
                newNominal = LActions.amountToSignedNominal(amount).add(nominal);
            } else if (amount.ref == LActions.AmountReference.Target) {
                newNominal = LActions.amountToSignedNominal(amount);
            }
            deltaAccrued = LInterest.nominalToAccrued(newNominal, index).sub(accrued);
        }

        if (amount.intent == LActions.AmountIntention.Supply) {
            require(deltaAccrued.sign);
        }
        else if (amount.intent == LActions.AmountIntention.Borrow) {
            require(!deltaAccrued.sign);
        }

        wsSetBalance(
            worldState,
            accountId,
            marketId,
            newNominal
        );

        return deltaAccrued;
    }

    function wsSetClosingTime(
        WorldState memory worldState,
        uint256 accountId,
        uint32 closingTime
    )
        internal
        pure
    {
        worldState.accounts[accountId].closingTime = closingTime;
    }

    // ============ Loading Functions ============

    function wsInitialize(
        AccountInfo[] memory accounts
    )
        internal
        view
        returns (WorldState memory)
    {
        // TODO: allow address(0) to default to msg.sender
        // verify no duplicate accounts
        for (uint256 i = 0; i < accounts.length; i++) {
            for (uint256 j = i + 1; j < accounts.length; j++) {
                require(
                    (trueAddress(accounts[i].trader) != trueAddress(accounts[j].trader))
                    || (accounts[i].account != accounts[j].account)
                );
            }
        }

        WorldState memory worldState;

        worldState.assets = new AssetState[](g_numMarkets);
        worldState.accounts = new AccountState[](accounts.length);

        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            worldState.accounts[a].info.trader = trueAddress(accounts[a].trader);
            worldState.accounts[a].info.account = accounts[a].account;
            worldState.accounts[a].balance = new LTypes.SignedNominal[](worldState.assets.length);
            worldState.accounts[a].oldBalance = new LTypes.SignedNominal[](worldState.assets.length);
        }

        // markets
        for (uint256 i = 0; i < worldState.assets.length; i++) {
            _loadToken(worldState, i);
            _loadIndex(worldState, i);
            _loadPrice(worldState, i);
        }

        // accounts
        _loadBalances(worldState);
        _loadClosingTimes(worldState);
    }

    function _loadToken(
        WorldState memory worldState,
        uint256 marketId
    )
        private
        view
    {
        worldState.assets[marketId].token = g_markets[marketId].token;
    }

    function _loadIndex(
        WorldState memory worldState,
        uint256 marketId
    )
        private
        view
    {
        LInterest.Index memory index = g_markets[marketId].index;

        // if no time has passed since the last update, then simply load the cached value
        if (index.lastUpdate == LTime.currentTime()) {
            worldState.assets[marketId].index = index;
            return;
        }

        // get previous rate
        LInterest.TotalNominal memory totalNominal = g_markets[marketId].totalNominal;
        LInterest.Rate memory rate = g_markets[marketId].interestSetter.getInterestRate(
            wsGetToken(worldState, marketId),
            totalNominal
        );

        worldState.assets[marketId].index = LInterest.getUpdatedIndex(
            index,
            rate,
            totalNominal,
            wsGetEarningsTax(worldState)
        );
    }

    function _loadEarningsTax(
        WorldState memory worldState
    )
        private
        view
    {
        worldState.earningsTax = g_earningsTax;
    }

    function _loadPrice(
        WorldState memory worldState,
        uint256 marketId
    )
        private
        view
    {
        address token = worldState.assets[marketId].token;
        worldState.assets[marketId].price = IPriceOracle(g_markets[marketId].priceOracle).getPrice(token);
    }

    function _loadBalances(
        WorldState memory worldState
    )
        private
        view
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address trader = worldState.accounts[a].info.trader;
            uint256 account = worldState.accounts[a].info.account;
            for (uint256 i = 0; i < worldState.assets.length; i++) {
                worldState.accounts[a].balance[i] =
                    worldState.accounts[a].oldBalance[i] =
                        g_accounts[trader][account].balances[i];
            }
        }
    }

    function _loadClosingTimes(
        WorldState memory worldState
    )
        private
        view
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address trader = worldState.accounts[a].info.trader;
            uint256 account = worldState.accounts[a].info.account;
            worldState.accounts[a].closingTime = g_accounts[trader][account].closingTime;
        }
    }

    // ============ Writing Functions ============

    function wsStore(
        WorldState memory worldState
    )
        internal
    {
        _verifyWorldState(worldState);

        _storeIndexes(worldState);
        _storeTotalNominals(worldState);
        _storeBalances(worldState);
        _storeClosingTimes(worldState);
    }

    function _storeIndexes(
        WorldState memory worldState
    )
        private
    {
        uint32 currentTime = LTime.currentTime();

        // TODO: determine if we have to adjust the index for VAPORIZATION

        for (uint256 i = 0; i < worldState.assets.length; i++) {
            if (worldState.assets[i].index.lastUpdate != 0) {
                if (currentTime != g_markets[i].index.lastUpdate) {
                    g_markets[i].index = worldState.assets[i].index;
                }
            }
        }
    }

    function _storeTotalNominals(
        WorldState memory worldState
    )
        private
    {
        for (uint256 i = 0; i < worldState.assets.length; i++) {
            LInterest.TotalNominal memory total = g_markets[i].totalNominal;
            bool modified = false;

            for (uint256 a = 0; a < worldState.accounts.length; a++) {
                LTypes.SignedNominal memory b0 = wsGetOldBalance(worldState, a, i);
                LTypes.SignedNominal memory b1 = wsGetBalance(worldState, a, i);

                if (LTypes.equals(b0, b1)) {
                    continue;
                }

                modified = true;

                // roll-back oldBalance
                if (b0.sign) {
                    total.supply = total.supply.sub(b0.nominal).to128();
                } else {
                    total.borrow = total.borrow.sub(b0.nominal).to128();
                }

                // roll-forward newBalance
                if (b1.sign) {
                    total.supply = total.supply.sub(b1.nominal).to128();
                } else {
                    total.borrow = total.borrow.sub(b1.nominal).to128();
                }
            }

            if (modified) {
                g_markets[i].totalNominal = total;
            }
        }
    }

    function _storeBalances(
        WorldState memory worldState
    )
        private
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address trader = worldState.accounts[a].info.trader;
            uint256 account = worldState.accounts[a].info.account;
            for (uint256 i = 0; i < worldState.assets.length; i++) {
                LTypes.SignedNominal memory b1 = worldState.accounts[a].oldBalance[i];
                LTypes.SignedNominal memory b2 = worldState.accounts[a].balance[i];
                if (!LTypes.equals(b1, b2)) {
                    g_accounts[trader][account].balances[i] = b2;
                }
            }
        }
    }

    function _storeClosingTimes(
        WorldState memory worldState
    )
        private
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address trader = worldState.accounts[a].info.trader;
            uint256 account = worldState.accounts[a].info.account;
            uint32 newTime = worldState.accounts[a].closingTime;
            if (g_accounts[trader][account].closingTime != newTime) {
                g_accounts[trader][account].closingTime = newTime;
            }
        }
    }

    // ============ Verification Functions ============

    function _verifyWorldState(
        WorldState memory worldState
    )
        private
        view
    {
        // authenticate the msg.sender
        for (uint256 a = 0 ; a < worldState.accounts.length; a++) {

            // don't check permission for accounts just used to liquidate
            if (!worldState.accounts[a].checkPermission) {
                continue;
            }

            address trader = worldState.accounts[a].info.trader;
            require(
                trader == msg.sender
                || g_trustedAddress[trader][msg.sender]
                // TODO: add other forms of authentication (onBehalfOf)
            );
        }

        // verify the account is properly over-collateralized
        for (uint256 a = 0 ; a < worldState.accounts.length; a++) {
            // don't check collateralization for accounts just used to liquidate
            if (!worldState.accounts[a].checkPermission) {
                continue;
            }
            _verifyCollateralization(worldState, a);
        }

        // ensure token balances
        for (uint256 i = 0 ; i < worldState.assets.length; i++) {
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
            require(held.accrued >= expected.accrued, "We dont have as many tokens as expected");
        }
    }

    function _verifyCollateralization(
        WorldState memory worldState,
        uint256 accountId
    )
        private
        view
    {
        require(_isCollateralized(worldState, accountId));
        // TODO: require(borrowedValue.value >= g_minBorrowedValue.value);
    }

    function _isCollateralized(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        view
        returns (bool)
    {
        LPrice.Value memory lentValue;
        LPrice.Value memory borrowedValue;

        for (uint256 i = 0; i < worldState.assets.length; i++) {
            LTypes.SignedNominal memory balance = worldState.accounts[accountId].balance[i];

            if (balance.nominal == 0) {
                continue;
            }

            LTypes.SignedAccrued memory accrued = LInterest.nominalToAccrued(
                balance,
                worldState.assets[i].index
            );

            LPrice.Value memory overallValue = LPrice.getTotalValue(
                worldState.assets[i].price,
                accrued.accrued
            );

            if (accrued.sign) {
                lentValue = LPrice.add(lentValue, overallValue);
            } else {
                borrowedValue = LPrice.add(borrowedValue, overallValue);
            }
        }

        if (borrowedValue.value > 0) {
            if (lentValue.value < g_liquidationRatio.mul(borrowedValue.value)) {
                return false;
            }
        }

        return true;
    }

    function trueAddress(
        address a
    )
        private
        view
        returns (address)
    {
        return a == address(0) ? msg.sender : a;
    }
}
