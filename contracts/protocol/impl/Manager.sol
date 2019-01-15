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
import { Require } from "../lib/Require.sol";
import { Time } from "../lib/Time.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Manager
 * @author dYdX
 *
 * Functions for reading, writing, and verifying storage
 */
contract Manager is
    Storage
{
    using Math for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;
    using SafeMath for uint256;

    // ============ Constants ============

    string constant FILE = "Manager";

    // ============ Structs ============

    struct Cache {
        MarketCache[] markets;
        AccountCache[] accounts;
        Decimal.D256 earningsRate;
        Decimal.D256 liquidationSpread;
        Decimal.D256 liquidationRatio;
    }

    struct AccountCache {
        Acct.Info info;
        Types.Par[] balance;
        bool primary; // was used as a primary account
        bool traded; // was used as an account to trade against
    }

    struct MarketCache {
        address token;
        Interest.Index index;
        Monetary.Price price;
        Types.TotalPar totalPar;
        bool totalParLoaded;
    }

    // ============ Getter Functions ============

    function cacheGetToken(
        Cache memory cache,
        uint256 marketId
    )
        internal
        view
        returns (address)
    {
        if (cache.markets[marketId].token == address(0)) {
            cache.markets[marketId].token = g_markets[marketId].token;
        }
        return cache.markets[marketId].token;
    }

    function cacheGetIndex(
        Cache memory cache,
        uint256 marketId
    )
        internal
        view
        returns (Interest.Index memory)
    {
        if (cache.markets[marketId].index.lastUpdate == 0) {
            _loadIndex(cache, marketId);
        }
        return cache.markets[marketId].index;
    }

    function cacheGetTotalPar(
        Cache memory cache,
        uint256 marketId
    )
        internal
        view
        returns (Types.TotalPar memory)
    {
        if (!cache.markets[marketId].totalParLoaded) {
            cache.markets[marketId].totalPar = g_markets[marketId].totalPar;
            cache.markets[marketId].totalParLoaded = true;
        }
        return cache.markets[marketId].totalPar;
    }

    function cacheGetPrice(
        Cache memory cache,
        uint256 marketId
    )
        internal
        view
        returns (Monetary.Price memory)
    {
        if (cache.markets[marketId].price.value == 0) {
            _loadPrice(cache, marketId);
        }
        return cache.markets[marketId].price;
    }

    function cacheGetAcctInfo(
        Cache memory cache,
        uint256 accountId
    )
        internal
        pure
        returns (Acct.Info memory)
    {
        return cache.accounts[accountId].info;
    }

    function cacheGetIsLiquidating(
        Cache memory cache,
        uint256 accountId
    )
        internal
        view
        returns (bool)
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, accountId);
        return g_accounts[account.owner][account.number].isLiquidating;
    }

    function cacheGetPar(
        Cache memory cache,
        uint256 accountId,
        uint256 marketId
    )
        internal
        pure
        returns (Types.Par memory)
    {
        return cache.accounts[accountId].balance[marketId];
    }

    function cacheGetWei(
        Cache memory cache,
        uint256 accountId,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Types.Par memory par = cacheGetPar(cache, accountId, marketId);

        if (par.isZero()) {
            return Types.zeroWei();
        }

        Interest.Index memory index = cacheGetIndex(cache, marketId);
        return Interest.parToWei(par, index);
    }

    function cacheGetEarningsRate(
        Cache memory cache
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (cache.earningsRate.value == 0) {
            cache.earningsRate = g_earningsRate;
        }
        return cache.earningsRate;
    }

    function cacheGetLiquidationSpread(
        Cache memory cache
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (cache.liquidationSpread.value == 0) {
            cache.liquidationSpread = g_liquidationSpread;
        }
        return cache.liquidationSpread;
    }

    function cacheGetLiquidationRatio(
        Cache memory cache
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (cache.liquidationRatio.value == 0) {
            cache.liquidationRatio = g_liquidationRatio;
        }
        return cache.liquidationRatio;
    }

    // ============ Setter Functions ============

    function cacheSetPrimary(
        Cache memory cache,
        uint256 accountId
    )
        internal
        pure
    {
        cache.accounts[accountId].primary = true;
    }

    function cacheSetTraded(
        Cache memory cache,
        uint256 accountId
    )
        internal
        pure
    {
        cache.accounts[accountId].traded = true;
    }

    function cacheSetIsLiquidating(
        Cache memory cache,
        uint256 accountId
    )
        internal
        returns (bool)
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, accountId);
        g_accounts[account.owner][account.number].isLiquidating = true;
    }

    function cacheSetPar(
        Cache memory cache,
        uint256 accountId,
        uint256 marketId,
        Types.Par memory newPar
    )
        internal
        view
    {
        Types.Par memory oldPar = cacheGetPar(cache, accountId, marketId);

        if (Types.equals(oldPar, newPar)) {
            return;
        }

        // updateTotalPar
        Types.TotalPar memory totalPar = cacheGetTotalPar(cache, marketId);

        // roll-back oldPar
        if (oldPar.sign) {
            totalPar.supply = uint256(totalPar.supply).sub(oldPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).sub(oldPar.value).to128();
        }

        // roll-forward newPar
        if (newPar.sign) {
            totalPar.supply = uint256(totalPar.supply).add(newPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).add(newPar.value).to128();
        }

        cache.markets[marketId].totalPar = totalPar;
        cache.accounts[accountId].balance[marketId] = newPar;
    }

    /**
     * Determines and sets an account's balance based on a change in wei
     */
    function cacheSetParFromDeltaWei(
        Cache memory cache,
        uint256 accountId,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
        view
    {
        Interest.Index memory index = cacheGetIndex(cache, marketId);
        Types.Wei memory oldWei = cacheGetWei(cache, accountId, marketId);
        Types.Wei memory newWei = oldWei.add(deltaWei);
        Types.Par memory newPar = Interest.weiToPar(newWei, index);
        cacheSetPar(
            cache,
            accountId,
            marketId,
            newPar
        );
    }

    /**
     * Determines and sets an account's balance based on the intended balance change. Returns the
     * equivalent amount in wei
     */
    function cacheGetNewParAndDeltaWei(
        Cache memory cache,
        uint256 accountId,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Interest.Index memory index = cacheGetIndex(cache, marketId);
        Types.Par memory oldPar = cacheGetPar(cache, accountId, marketId);
        Types.Wei memory oldWei = cacheGetWei(cache, accountId, marketId);

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

    function cacheInitializeEmpty()
        internal
        view
        returns (Cache memory)
    {
        Acct.Info[] memory nullAccounts = new Acct.Info[](0);
        return cacheInitialize(nullAccounts);
    }

    function cacheInitializeSingle(
        Acct.Info memory account
    )
        internal
        view
        returns (Cache memory)
    {
        Acct.Info[] memory accounts = new Acct.Info[](1);
        accounts[0] = account;
        return cacheInitialize(accounts);
    }

    function cacheInitialize(
        Acct.Info[] memory accounts
    )
        internal
        view
        returns (Cache memory)
    {
        // verify no duplicate accounts
        for (uint256 i = 0; i < accounts.length; i++) {
            for (uint256 j = i + 1; j < accounts.length; j++) {
                Require.that(
                    !Acct.equals(accounts[i], accounts[j]),
                    FILE,
                    "Cannot duplicate accounts"
                );
            }
        }

        Cache memory cache;

        cache.markets = new MarketCache[](g_numMarkets);
        cache.accounts = new AccountCache[](accounts.length);

        // load all account information aggressively
        for (uint256 a = 0; a < cache.accounts.length; a++) {
            cache.accounts[a].info.owner = accounts[a].owner;
            cache.accounts[a].info.number = accounts[a].number;
            cache.accounts[a].balance = new Types.Par[](cache.markets.length);
        }
        _loadBalances(cache);

        // do not load any market information, load it lazily later

        return cache;
    }

    function _loadIndex(
        Cache memory cache,
        uint256 marketId
    )
        private
        view
    {
        Interest.Index memory index = g_markets[marketId].index;

        // if no time has passed since the last update, then simply load the cached value
        if (index.lastUpdate == Time.currentTime()) {
            cache.markets[marketId].index = index;
            return;
        }

        // get previous rate
        Types.TotalPar memory totalPar = g_markets[marketId].totalPar;
        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(totalPar, index);

        Interest.Rate memory rate = g_markets[marketId].interestSetter.getInterestRate(
            cacheGetToken(cache, marketId),
            borrowWei.value,
            supplyWei.value
        );

        cache.markets[marketId].index = Interest.calculateNewIndex(
            index,
            rate,
            totalPar,
            cacheGetEarningsRate(cache)
        );
    }

    function _loadPrice(
        Cache memory cache,
        uint256 marketId
    )
        private
        view
    {
        address token = cache.markets[marketId].token;
        IPriceOracle oracle = IPriceOracle(g_markets[marketId].priceOracle);
        cache.markets[marketId].price = oracle.getPrice(token);
    }

    function _loadBalances(
        Cache memory cache
    )
        private
        view
    {
        for (uint256 a = 0; a < cache.accounts.length; a++) {
            Acct.Info memory account = cache.accounts[a].info;
            for (uint256 m = 0; m < cache.markets.length; m++) {
                cache.accounts[a].balance[m] =
                    g_accounts[account.owner][account.number].balances[m];
            }
        }
    }

    // ============ Writing Functions ============

    function cacheStore(
        Cache memory cache
    )
        internal
    {
        _verifyCache(cache);

        //store indexes
        for (uint256 i = 0; i < cache.markets.length; i++) {
            if (cache.markets[i].index.lastUpdate != 0) {
                g_markets[i].index = cache.markets[i].index;
            }
        }

        // store total pars
        for (uint256 m = 0; m < cache.markets.length; m++) {
            if (cache.markets[m].totalParLoaded) {
                Require.that(
                    !g_markets[m].isClosing
                    || g_markets[m].totalPar.borrow >= cache.markets[m].totalPar.borrow,
                    FILE,
                    "Cannot increase borrow amount for closing market"
                );
                g_markets[m].totalPar = cache.markets[m].totalPar;
            }
        }

        // store balances
        for (uint256 a = 0; a < cache.accounts.length; a++) {
            Acct.Info memory account = cache.accounts[a].info;
            for (uint256 m = 0; m < cache.markets.length; m++) {
                g_accounts[account.owner][account.number].balances[m] =
                    cacheGetPar(cache, a, m);
            }
        }
    }

    // ============ Verification Functions ============

    function _verifyCache(
        Cache memory cache
    )
        private
    {
        Monetary.Value memory minBorrowedValue = g_minBorrowedValue;

        for (uint256 a = 0; a < cache.accounts.length; a++) {
            Acct.Info memory account = cacheGetAcctInfo(cache, a);

            // check minimum borrowed value for all accounts
            (, Monetary.Value memory borrowValue) = cacheGetAccountValues(cache, a);
            Require.that(
                borrowValue.value >= minBorrowedValue.value,
                FILE,
                "Cannot leave account with borrow value less than minBorrowedValue",
                a
            );

            // check collateralization for non-liquidated accounts
            if (cache.accounts[a].primary || cache.accounts[a].traded) {
                Require.that(
                    cacheGetIsCollateralized(cache, a),
                    FILE,
                    "Cannot leave primary or traded account undercollateralized",
                    a
                );
                g_accounts[account.owner][account.number].isLiquidating = false;
            }

            // check permissions for primary accounts
            if (cache.accounts[a].primary) {
                Require.that(
                    account.owner == msg.sender || g_operators[account.owner][msg.sender],
                    FILE,
                    "Must have permissions for primary accounts"
                );
            }
        }
    }

    // ============ Query Functions ============

    function cacheGetIsCollateralized(
        Cache memory cache,
        uint256 accountId
    )
        internal
        view
        returns (bool)
    {
        (
            Monetary.Value memory supplyValue,
            Monetary.Value memory borrowValue
        ) = cacheGetAccountValues(cache, accountId);

        if (borrowValue.value == 0) {
            return true;
        }

        uint256 requiredSupply = Decimal.mul(borrowValue.value, cacheGetLiquidationRatio(cache));

        return supplyValue.value >= requiredSupply;
    }

    function cacheGetAccountValues(
        Cache memory cache,
        uint256 accountId
    )
        internal
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        for (uint256 m = 0; m < cache.markets.length; m++) {
            Types.Wei memory tokenWei = cacheGetWei(cache, accountId, m);

            if (tokenWei.isZero()) {
                continue;
            }

            Monetary.Value memory overallValue = Monetary.getValue(
                cacheGetPrice(cache, m),
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

    function cacheGetNumExcessTokens(
        Cache memory cache,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Interest.Index memory index = cacheGetIndex(cache, marketId);
        Types.TotalPar memory totalPar = cacheGetTotalPar(cache, marketId);

        address token = cacheGetToken(cache, marketId);

        Types.Wei memory balanceWei = Exchange.thisBalance(token);

        (
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

        return balanceWei.add(borrowWei).sub(supplyWei);
    }
}
