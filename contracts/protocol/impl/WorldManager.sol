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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Storage } from "./Storage.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
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

    // ============ Structs ============

    struct WorldState {
        AssetState[] assets;
        AccountState[] accounts;
        Decimal.D256 earningsRate;
        Decimal.D256 liquidationSpread;
    }

    struct AccountInfo {
        address owner;
        uint256 account;
    }

    struct AccountState {
        AccountInfo info;
        Types.Par[] balance;
        Types.Par[] oldBalance;
        bool isLiquidating;

        // need to check permissions for every account that was touched except for ones that were
        // only liquidated
        bool checkPermission;
    }

    struct AssetState {
        address token;
        Interest.Index index;
        Monetary.Price price;
        // doesn't cache totalPar, just recalculates it at the end if needed
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
            _loadToken(worldState, marketId);
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
        returns (Monetary.Price memory)
    {
        if (worldState.assets[marketId].price.value == 0) {
            _loadPrice(worldState, marketId);
        }
        return worldState.assets[marketId].price;
    }

    function wsGetOwner(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
        returns (address)
    {
        return worldState.accounts[accountId].info.owner;
    }

    function wsGetIsLiquidating(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
        returns (bool)
    {
        return worldState.accounts[accountId].isLiquidating;
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

    function wsGetInitialBalance(
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

    function wsGetEarningsRate(
        WorldState memory worldState
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (worldState.earningsRate.value == 0) {
            _loadEarningsRate(worldState);
        }
        return worldState.earningsRate;
    }

    function wsGetLiquidationSpread(
        WorldState memory worldState
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (worldState.liquidationSpread.value == 0) {
            _loadLiquidationSpread(worldState);
        }
        return worldState.liquidationSpread;
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

    /**
     * Determines and sets an account's balance based on a change in wei
     */
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
        Types.Par memory oldPar = wsGetBalance(worldState, accountId, marketId);
        Types.Wei memory oldWei = Interest.parToWei(oldPar, index);
        Types.Wei memory newWei = oldWei.add(deltaWei);
        Types.Par memory newPar = Interest.weiToPar(newWei, index);
        wsSetBalance(
            worldState,
            accountId,
            marketId,
            newPar
        );
    }

    /**
     * Determines and sets an account's balance based on the intended balance change. Returns the
     * equivalent amount in wei
     */
    function wsGetNewParAndDeltaWei(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Interest.Index memory index = wsGetIndex(worldState, marketId);
        Types.Par memory oldPar = wsGetBalance(worldState, accountId, marketId);
        Types.Wei memory oldWei = Interest.parToWei(oldPar, index);

        Types.Par memory newPar;
        Types.Wei memory deltaWei;

        if (amount.denomination == Actions.AssetDenomination.Wei) {
            deltaWei = Types.Wei({
                sign: amount.sign,
                value: amount.value
            });
            if (amount.ref == Actions.AssetReference.Target) {
                deltaWei = deltaWei.sub(oldWei);
            }
            newPar = Interest.weiToPar(oldWei.add(deltaWei), index);
        }
        else if (amount.denomination == Actions.AssetDenomination.Par) {
            newPar = Types.Par({
                sign: amount.sign,
                value: amount.value.to128()
            });
            if (amount.ref == Actions.AssetReference.Delta) {
                newPar = oldPar.add(newPar);
            }
            deltaWei = Interest.parToWei(newPar, index).sub(oldWei);
        }

        return (newPar, deltaWei);
    }

    function wsSetIsLiquidating(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
    {
        worldState.accounts[accountId].isLiquidating = true;
    }

    // ============ Loading Functions ============

    function wsInitialize(
        AccountInfo[] memory accounts
    )
        internal
        view
        returns (WorldState memory)
    {
        // verify no duplicate accounts
        for (uint256 i = 0; i < accounts.length; i++) {
            address ownerI = accounts[i].owner;
            uint256 accountI = accounts[i].account;
            for (uint256 j = i + 1; j < accounts.length; j++) {
                address ownerJ = accounts[j].owner;
                uint256 accountJ = accounts[j].account;
                require(
                    ownerI != ownerJ || accountI != accountJ,
                    "TODO_REASON"
                );
            }
        }

        WorldState memory worldState;

        worldState.assets = new AssetState[](g_numMarkets);
        worldState.accounts = new AccountState[](accounts.length);

        // load all account information aggressively
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            worldState.accounts[a].info.owner = accounts[a].owner;
            worldState.accounts[a].info.account = accounts[a].account;
            worldState.accounts[a].balance = new Types.Par[](worldState.assets.length);
            worldState.accounts[a].oldBalance = new Types.Par[](worldState.assets.length);
        }
        _loadBalances(worldState);
        _loadIsLiquidatings(worldState);

        // do not load any market information, load it lazily later
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
        Types.TotalPar memory totalPar = g_markets[marketId].totalPar;
        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(totalPar, index);

        Interest.Rate memory rate = g_markets[marketId].interestSetter.getInterestRate(
            wsGetToken(worldState, marketId),
            borrowWei.value,
            supplyWei.value
        );

        worldState.assets[marketId].index = Interest.calculateNewIndex(
            index,
            rate,
            totalPar,
            wsGetEarningsRate(worldState)
        );
    }

    function _loadEarningsRate(
        WorldState memory worldState
    )
        private
        view
    {
        worldState.earningsRate = g_earningsRate;
    }

    function _loadLiquidationSpread(
        WorldState memory worldState
    )
        private
        view
    {
        worldState.liquidationSpread = g_liquidationSpread;
    }

    function _loadPrice(
        WorldState memory worldState,
        uint256 marketId
    )
        private
        view
    {
        address token = worldState.assets[marketId].token;
        IPriceOracle oracle = IPriceOracle(g_markets[marketId].priceOracle);
        worldState.assets[marketId].price = oracle.getPrice(token);
    }

    function _loadBalances(
        WorldState memory worldState
    )
        private
        view
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address owner = worldState.accounts[a].info.owner;
            uint256 account = worldState.accounts[a].info.account;
            for (uint256 i = 0; i < worldState.assets.length; i++) {
                // load balance from memory
                worldState.accounts[a].oldBalance[i] = g_accounts[owner][account].balances[i];

                // copy-by-value into balance
                worldState.accounts[a].balance[i].sign =
                    worldState.accounts[a].oldBalance[i].sign;
                worldState.accounts[a].balance[i].value =
                    worldState.accounts[a].oldBalance[i].value;
            }
        }
    }

    function _loadIsLiquidatings(
        WorldState memory worldState
    )
        private
        view
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address owner = worldState.accounts[a].info.owner;
            uint256 account = worldState.accounts[a].info.account;
            worldState.accounts[a].isLiquidating = g_accounts[owner][account].isLiquidating;
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
        _storeTotalPars(worldState);
        _storeBalances(worldState);
        _storeIsLiquidatings(worldState);
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

    function _storeTotalPars(
        WorldState memory worldState
    )
        private
    {
        for (uint256 i = 0; i < worldState.assets.length; i++) {
            // load from storage
            Types.TotalPar memory oldTotal = g_markets[i].totalPar;

            // copy-by-value into newTotal
            Types.TotalPar memory newTotal;
            newTotal.supply = oldTotal.supply;
            newTotal.borrow = oldTotal.borrow;

            for (uint256 a = 0; a < worldState.accounts.length; a++) {
                Types.Par memory oldPar = wsGetInitialBalance(worldState, a, i);
                Types.Par memory newPar = wsGetBalance(worldState, a, i);

                if (Types.equals(oldPar, newPar)) {
                    continue;
                }

                // roll-back oldBalance
                if (oldPar.sign) {
                    newTotal.supply = uint256(newTotal.supply).sub(oldPar.value).to128();
                } else {
                    newTotal.borrow = uint256(newTotal.borrow).sub(oldPar.value).to128();
                }

                // roll-forward newBalance
                if (newPar.sign) {
                    newTotal.supply = uint256(newTotal.supply).sub(newPar.value).to128();
                } else {
                    newTotal.borrow = uint256(newTotal.borrow).sub(newPar.value).to128();
                }
            }

            // write to storage if modified
            if (newTotal.borrow != oldTotal.borrow || newTotal.supply != oldTotal.supply) {
                require(
                    newTotal.supply >= newTotal.borrow,
                    "TODO_REASON"
                );
                g_markets[i].totalPar = newTotal;
            }
        }
    }

    function _storeBalances(
        WorldState memory worldState
    )
        private
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address owner = worldState.accounts[a].info.owner;
            uint256 account = worldState.accounts[a].info.account;
            for (uint256 i = 0; i < worldState.assets.length; i++) {
                Types.Par memory oldPar = worldState.accounts[a].oldBalance[i];
                Types.Par memory newPar = worldState.accounts[a].balance[i];
                if (!Types.equals(oldPar, newPar)) {
                    g_accounts[owner][account].balances[i] = newPar;
                }
            }
        }
    }

    function _storeIsLiquidatings(
        WorldState memory worldState
    )
        private
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            address owner = worldState.accounts[a].info.owner;
            uint256 account = worldState.accounts[a].info.account;
            bool flag =
                worldState.accounts[a].isLiquidating
                && !worldState.accounts[a].checkPermission;

            if (g_accounts[owner][account].isLiquidating != flag) {
                g_accounts[owner][account].isLiquidating = flag;
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

            address owner = worldState.accounts[a].info.owner;
            require(
                owner == msg.sender
                || g_trustedAddress[owner][msg.sender],
                "TODO_REASON"
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
    }

    function _verifyCollateralization(
        WorldState memory worldState,
        uint256 accountId
    )
        private
        view
    {
        require(
            _isCollateralized(worldState, accountId),
            "TODO_REASON"
        );
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
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        for (uint256 i = 0; i < worldState.assets.length; i++) {
            Types.Par memory balance = worldState.accounts[accountId].balance[i];

            if (balance.value == 0) {
                continue;
            }

            Types.Wei memory tokenWei = Interest.parToWei(balance, worldState.assets[i].index);

            Monetary.Value memory overallValue = Monetary.getValue(
                worldState.assets[i].price,
                tokenWei.value
            );

            if (tokenWei.sign) {
                supplyValue = Monetary.add(supplyValue, overallValue);
            } else {
                borrowValue = Monetary.add(borrowValue, overallValue);
            }
        }

        if (borrowValue.value > 0) {
            if (supplyValue.value < Decimal.mul(g_liquidationRatio, borrowValue.value)) {
                return false;
            }
        }

        return true;
    }
}
