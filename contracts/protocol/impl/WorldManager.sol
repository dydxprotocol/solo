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

import { Storage } from "./Storage.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Math } from "../lib/Math.sol";
import { Price } from "../lib/Price.sol";
import { Time } from "../lib/Time.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title WorldManager
 * @author dYdX
 *
 * Functions for reading, writing, and verifying storage
 */
contract WorldManager is
    Storage
{
    using Math for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;
    using SafeMath for uint256;
    using SafeMath for uint128;

    // ============ Structs ============

    struct WorldState {
        AssetState[] assets;
        AccountState[] accounts;
        Decimal.Decimal earningsTax;
    }

    struct AccountInfo {
        address trader;
        uint256 account;
    }

    struct AccountState {
        AccountInfo info;
        Types.Par[] balance;
        Types.Par[] oldBalance;
        uint32 closingTime;

        // need to check permissions for every account that was touched except for ones that were
        // only liquidated
        bool checkPermission;
    }

    struct AssetState {
        address token;
        Interest.Index index;
        Price.Price price;
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
        returns (Interest.Index memory)
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
        returns (Price.Price memory)
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
        returns (Types.Par memory)
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
        returns (Types.Par memory)
    {
        return worldState.accounts[accountId].oldBalance[marketId];
    }

    function wsGetEarningsTax(
        WorldState memory worldState
    )
        internal
        view
        returns (Decimal.Decimal memory)
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
        Types.Par memory newBalance
    )
        internal
        pure
    {
        worldState.accounts[accountId].balance[marketId] = newBalance;
    }

    function wsSetBalanceFromDeltaWei(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
        view
    {
        Interest.Index memory index = wsGetIndex(worldState, marketId);
        Types.Par memory b0 = wsGetBalance(worldState, accountId, marketId);
        Types.Wei memory a0 = Interest.parToWei(b0, index);
        Types.Wei memory a1 = a0.add(deltaWei);
        Types.Par memory newBalance = Interest.weiToPar(a1, index);
        wsSetBalance(worldState, accountId, marketId, newBalance);
    }

    function wsSetBalanceFromAmountStruct(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        Actions.Amount memory amount
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Types.Par memory newPar;
        Types.Wei memory deltaWei;

        Interest.Index memory index = wsGetIndex(worldState, marketId);
        Types.Par memory oldPar = wsGetBalance(worldState, accountId, marketId);
        Types.Wei memory oldWei = Interest.parToWei(oldPar, index);

        if (amount.denom == Actions.AmountDenomination.Wei) {
            if (amount.ref == Actions.AmountReference.Delta) {
                deltaWei = Actions.amountToWei(amount);
            } else if (amount.ref == Actions.AmountReference.Target) {
                deltaWei = Actions.amountToWei(amount).sub(oldWei);
            }
            newPar = Interest.weiToPar(oldWei.add(deltaWei), index);
        } else if (amount.denom == Actions.AmountDenomination.Par) {
            if (amount.ref == Actions.AmountReference.Delta) {
                newPar = Actions.amountToPar(amount).add(oldPar);
            } else if (amount.ref == Actions.AmountReference.Target) {
                newPar = Actions.amountToPar(amount);
            }
            deltaWei = Interest.parToWei(newPar, index).sub(oldWei);
        }

        if (amount.intent == Actions.AmountIntention.Supply) {
            require(deltaWei.sign);
        }
        else if (amount.intent == Actions.AmountIntention.Borrow) {
            require(!deltaWei.sign);
        }

        wsSetBalance(
            worldState,
            accountId,
            marketId,
            newPar
        );

        return deltaWei;
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
            worldState.accounts[a].balance = new Types.Par[](worldState.assets.length);
            worldState.accounts[a].oldBalance = new Types.Par[](worldState.assets.length);
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
        Interest.Index memory index = g_markets[marketId].index;

        // if no time has passed since the last update, then simply load the cached value
        if (index.lastUpdate == Time.currentTime()) {
            worldState.assets[marketId].index = index;
            return;
        }

        // get previous rate
        Interest.TotalNominal memory totalNominal = g_markets[marketId].totalNominal;
        Interest.Rate memory rate = g_markets[marketId].interestSetter.getInterestRate(
            wsGetToken(worldState, marketId),
            totalNominal
        );

        worldState.assets[marketId].index = Interest.getUpdatedIndex(
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
        uint32 currentTime = Time.currentTime();

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
            Interest.TotalNominal memory total = g_markets[i].totalNominal;
            bool modified = false;

            for (uint256 a = 0; a < worldState.accounts.length; a++) {
                Types.Par memory b0 = wsGetOldBalance(worldState, a, i);
                Types.Par memory b1 = wsGetBalance(worldState, a, i);

                if (Types.equals(b0, b1)) {
                    continue;
                }

                modified = true;

                // roll-back oldBalance
                if (b0.sign) {
                    total.supply = total.supply.sub(b0.value).to128();
                } else {
                    total.borrow = total.borrow.sub(b0.value).to128();
                }

                // roll-forward newBalance
                if (b1.sign) {
                    total.supply = total.supply.sub(b1.value).to128();
                } else {
                    total.borrow = total.borrow.sub(b1.value).to128();
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
                Types.Par memory b1 = worldState.accounts[a].oldBalance[i];
                Types.Par memory b2 = worldState.accounts[a].balance[i];
                if (!Types.equals(b1, b2)) {
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
            Types.Wei memory held = Token.thisBalance(worldState.assets[i].token);
            Types.Par memory lent = Types.Par({
                sign: true,
                value: g_markets[i].totalNominal.supply
            });
            Types.Par memory borrowed = Types.Par({
                sign: false,
                value: g_markets[i].totalNominal.borrow
            });
            Types.Wei memory lentWei =
                Interest.parToWei(lent, worldState.assets[i].index);
            Types.Wei memory borrowedWei =
                Interest.parToWei(borrowed, worldState.assets[i].index);
            Types.Wei memory expected = lentWei.sub(borrowedWei);
            require(expected.sign, "We cannot expect more to be borrowed than lent");
            require(held.value >= expected.value, "We dont have as many tokens as expected");
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
        Price.Value memory lentValue;
        Price.Value memory borrowedValue;

        for (uint256 i = 0; i < worldState.assets.length; i++) {
            Types.Par memory balance = worldState.accounts[accountId].balance[i];

            if (balance.value == 0) {
                continue;
            }

            Types.Wei memory tokenWei = Interest.parToWei(balance, worldState.assets[i].index);

            Price.Value memory overallValue = Price.getTotalValue(
                worldState.assets[i].price,
                tokenWei.value
            );

            if (tokenWei.sign) {
                lentValue = Price.add(lentValue, overallValue);
            } else {
                borrowedValue = Price.add(borrowedValue, overallValue);
            }
        }

        if (borrowedValue.value > 0) {
            if (lentValue.value < Decimal.mul(g_liquidationRatio, borrowedValue.value)) {
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
