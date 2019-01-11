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
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
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
        MarketState[] markets;
        AccountState[] accounts;
        Decimal.D256 earningsRate;
        Decimal.D256 liquidationSpread;
        Decimal.D256 liquidationRatio;
    }

    struct AccountState {
        Acct.Info info;
        Types.Par[] balance;
        bool primary; // was used as a primary account
        bool traded; // was used as an account to trade against
    }

    struct MarketState {
        address token;
        Interest.Index index;
        Monetary.Price price;
        Types.TotalPar totalPar;
        bool totalParLoaded;
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
        if (worldState.markets[marketId].token == address(0)) {
            worldState.markets[marketId].token = g_markets[marketId].token;
        }
        return worldState.markets[marketId].token;
    }

    function wsGetIndex(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (Interest.Index memory)
    {
        if (worldState.markets[marketId].index.lastUpdate == 0) {
            _loadIndex(worldState, marketId);
        }
        return worldState.markets[marketId].index;
    }

    function wsGetTotalPar(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (Types.TotalPar memory)
    {
        if (!worldState.markets[marketId].totalParLoaded) {
            worldState.markets[marketId].totalPar = g_markets[marketId].totalPar;
            worldState.markets[marketId].totalParLoaded = true;
        }
        return worldState.markets[marketId].totalPar;
    }

    function wsGetPrice(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (Monetary.Price memory)
    {
        if (worldState.markets[marketId].price.value == 0) {
            _loadPrice(worldState, marketId);
        }
        return worldState.markets[marketId].price;
    }

    function wsGetAcctInfo(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
        returns (Acct.Info memory)
    {
        return worldState.accounts[accountId].info;
    }

    function wsGetIsLiquidating(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        view
        returns (bool)
    {
        Acct.Info memory account = wsGetAcctInfo(worldState, accountId);
        return g_accounts[account.owner][account.number].isLiquidating;
    }

    function wsGetPar(
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

    function wsGetWei(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Types.Par memory par = wsGetPar(worldState, accountId, marketId);

        if (par.isZero()) {
            return Types.zeroWei();
        }

        Interest.Index memory index = wsGetIndex(worldState, marketId);
        return Interest.parToWei(par, index);
    }

    function wsGetEarningsRate(
        WorldState memory worldState
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (worldState.earningsRate.value == 0) {
            worldState.earningsRate = g_earningsRate;
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
            worldState.liquidationSpread = g_liquidationSpread;
        }
        return worldState.liquidationSpread;
    }

    function wsGetLiquidationRatio(
        WorldState memory worldState
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (worldState.liquidationRatio.value == 0) {
            worldState.liquidationRatio = g_liquidationRatio;
        }
        return worldState.liquidationRatio;
    }

    // ============ Setter Functions ============

    function wsSetPrimary(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
    {
        worldState.accounts[accountId].primary = true;
    }

    function wsSetTraded(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        pure
    {
        worldState.accounts[accountId].traded = true;
    }

    function wsSetIsLiquidating(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        returns (bool)
    {
        Acct.Info memory account = wsGetAcctInfo(worldState, accountId);
        g_accounts[account.owner][account.number].isLiquidating = true;
    }

    function wsSetPar(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        Types.Par memory newPar
    )
        internal
        view
    {
        Types.Par memory oldPar = wsGetPar(worldState, accountId, marketId);

        if (Types.equals(oldPar, newPar)) {
            return;
        }

        // updateTotalPar
        Types.TotalPar memory totalPar = wsGetTotalPar(worldState, marketId);

        // roll-back oldPar
        if (oldPar.sign) {
            totalPar.supply = uint256(totalPar.supply).sub(oldPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).sub(oldPar.value).to128();
        }

        // roll-forward newPar
        if (newPar.sign) {
            totalPar.supply = uint256(totalPar.supply).sub(newPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).sub(newPar.value).to128();
        }

        worldState.markets[marketId].totalPar = totalPar;
        worldState.accounts[accountId].balance[marketId] = newPar;
    }

    /**
     * Determines and sets an account's balance based on a change in wei
     */
    function wsSetParFromDeltaWei(
        WorldState memory worldState,
        uint256 accountId,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
        view
    {
        Interest.Index memory index = wsGetIndex(worldState, marketId);
        Types.Wei memory oldWei = wsGetWei(worldState, accountId, marketId);
        Types.Wei memory newWei = oldWei.add(deltaWei);
        Types.Par memory newPar = Interest.weiToPar(newWei, index);
        wsSetPar(
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
        Types.Par memory oldPar = wsGetPar(worldState, accountId, marketId);
        Types.Wei memory oldWei = wsGetWei(worldState, accountId, marketId);

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

    // ============ Loading Functions ============

    function wsInitializeEmpty()
        internal
        view
        returns (WorldState memory)
    {
        Acct.Info[] memory nullAccounts = new Acct.Info[](0);
        return wsInitialize(nullAccounts);
    }

    function wsInitializeSingle(
        Acct.Info memory account
    )
        internal
        view
        returns (WorldState memory)
    {
        Acct.Info[] memory accounts = new Acct.Info[](1);
        accounts[0] = account;
        return wsInitialize(accounts);
    }

    function wsInitialize(
        Acct.Info[] memory accounts
    )
        internal
        view
        returns (WorldState memory)
    {
        // verify no duplicate accounts
        for (uint256 i = 0; i < accounts.length; i++) {
            for (uint256 j = i + 1; j < accounts.length; j++) {
                require(
                    !Acct.equals(accounts[i], accounts[j]),
                    "TODO_REASON"
                );
            }
        }

        WorldState memory worldState;

        worldState.markets = new MarketState[](g_numMarkets);
        worldState.accounts = new AccountState[](accounts.length);

        // load all account information aggressively
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            worldState.accounts[a].info.owner = accounts[a].owner;
            worldState.accounts[a].info.number = accounts[a].number;
            worldState.accounts[a].balance = new Types.Par[](worldState.markets.length);
        }
        _loadBalances(worldState);

        // do not load any market information, load it lazily later
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
            worldState.markets[marketId].index = index;
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

        worldState.markets[marketId].index = Interest.calculateNewIndex(
            index,
            rate,
            totalPar,
            wsGetEarningsRate(worldState)
        );
    }

    function _loadPrice(
        WorldState memory worldState,
        uint256 marketId
    )
        private
        view
    {
        address token = worldState.markets[marketId].token;
        IPriceOracle oracle = IPriceOracle(g_markets[marketId].priceOracle);
        worldState.markets[marketId].price = oracle.getPrice(token);
    }

    function _loadBalances(
        WorldState memory worldState
    )
        private
        view
    {
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            Acct.Info memory account = worldState.accounts[a].info;
            for (uint256 m = 0; m < worldState.markets.length; m++) {
                worldState.accounts[a].balance[m] =
                    g_accounts[account.owner][account.number].balances[m];
            }
        }
    }

    // ============ Writing Functions ============

    function wsStore(
        WorldState memory worldState
    )
        internal
    {
        _verifyWorldState(worldState);

        //store indexes
        for (uint256 i = 0; i < worldState.markets.length; i++) {
            if (worldState.markets[i].index.lastUpdate != 0) {
                g_markets[i].index = worldState.markets[i].index;
            }
        }

        // store total pars
        for (uint256 m = 0; m < worldState.markets.length; m++) {
            if (worldState.markets[m].totalParLoaded) {
                require(
                    !g_markets[m].isClosing
                    || g_markets[m].totalPar.borrow >= worldState.markets[m].totalPar.borrow,
                    "TODO_REASON"
                );
                g_markets[m].totalPar = worldState.markets[m].totalPar;
            }
        }

        // store balances
        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            Acct.Info memory account = worldState.accounts[a].info;
            for (uint256 m = 0; m < worldState.markets.length; m++) {
                g_accounts[account.owner][account.number].balances[m] =
                    wsGetPar(worldState, a, m);
            }
        }
    }

    // ============ Verification Functions ============

    function _verifyWorldState(
        WorldState memory worldState
    )
        private
    {
        Monetary.Value memory minBorrowedValue = g_minBorrowedValue;

        for (uint256 a = 0; a < worldState.accounts.length; a++) {
            Acct.Info memory account = wsGetAcctInfo(worldState, a);

            // check minimum borrowed value for all accounts
            (, Monetary.Value memory borrowValue) = wsGetAccountValues(worldState, a);
            require(
                borrowValue.value >= minBorrowedValue.value,
                "TODO_REASON"
            );

            // check collateralization for non-liquidated accounts
            if (worldState.accounts[a].primary || worldState.accounts[a].traded) {
                require(
                    wsGetIsCollateralized(worldState, a),
                    "TODO_REASON"
                );
                g_accounts[account.owner][account.number].isLiquidating = false;
            }

            // check permissions for primary accounts
            if (worldState.accounts[a].primary) {
                require(
                    account.owner == msg.sender || g_operators[account.owner][msg.sender],
                    "TODO_REASON"
                );
            }
        }
    }

    // ============ Query Functions ============

    function wsGetIsCollateralized(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        view
        returns (bool)
    {
        (
            Monetary.Value memory supplyValue,
            Monetary.Value memory borrowValue
        ) = wsGetAccountValues(worldState, accountId);

        if (borrowValue.value == 0) {
            return true;
        }

        uint256 requiredSupply = Decimal.mul(borrowValue.value, wsGetLiquidationRatio(worldState));

        return supplyValue.value >= requiredSupply;
    }

    function wsGetAccountValues(
        WorldState memory worldState,
        uint256 accountId
    )
        internal
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        for (uint256 m = 0; m < worldState.markets.length; m++) {
            Types.Wei memory tokenWei = wsGetWei(worldState, accountId, m);

            if (tokenWei.isZero()) {
                continue;
            }

            Monetary.Value memory overallValue = Monetary.getValue(
                wsGetPrice(worldState, m),
                tokenWei.value
            );

            if (tokenWei.sign) {
                supplyValue = Monetary.add(supplyValue, overallValue);
            } else {
                borrowValue = Monetary.add(borrowValue, overallValue);
            }
        }

        return (supplyValue, borrowValue);
    }

    function wsGetNumExcessTokens(
        WorldState memory worldState,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Interest.Index memory index = wsGetIndex(worldState, marketId);
        Types.TotalPar memory totalPar = wsGetTotalPar(worldState, marketId);

        address token = wsGetToken(worldState, marketId);

        Types.Wei memory balanceWei = Exchange.thisBalance(token);

        (
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

        return balanceWei.add(borrowWei).sub(supplyWei);
    }
}
