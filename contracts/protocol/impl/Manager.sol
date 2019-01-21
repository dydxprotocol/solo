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

    // ============ Functions ============

    function getToken(
        uint256 marketId
    )
        internal
        view
        returns (address)
    {
        return g_markets[marketId].token;
    }

    function getTotalPar(
        uint256 marketId
    )
        internal
        view
        returns (Types.TotalPar memory)
    {
        return g_markets[marketId].totalPar;
    }

    function getIndex(
        uint256 marketId
    )
        internal
        view
        returns (Interest.Index memory)
    {
        return g_markets[marketId].index;
    }

    function getNumExcessTokens(
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Interest.Index memory index = getIndex(marketId);
        Types.TotalPar memory totalPar = getTotalPar(marketId);

        address token = getToken(marketId);

        Types.Wei memory balanceWei = Exchange.thisBalance(token);

        (
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

        return balanceWei.add(borrowWei).sub(supplyWei);
    }

    function getStatus(
        Acct.Info memory account
    )
        internal
        view
        returns (AccountStatus)
    {
        return g_accounts[account.owner][account.number].status;
    }

    function getPar(
        Acct.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Par memory)
    {
        return g_accounts[account.owner][account.number].balances[marketId];
    }

    function getWei(
        Acct.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Types.Par memory par = getPar(account, marketId);

        if (par.isZero()) {
            return Types.zeroWei();
        }

        Interest.Index memory index = getIndex(marketId);
        return Interest.parToWei(par, index);
    }

    function fetchInterestRate(
        uint256 marketId,
        Interest.Index memory index
    )
        internal
        view
        returns (Interest.Rate memory)
    {
        Types.TotalPar memory totalPar = getTotalPar(marketId);
        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(totalPar, index);

        return g_markets[marketId].interestSetter.getInterestRate(
            getToken(marketId),
            borrowWei.value,
            supplyWei.value
        );
    }

    function fetchPrice(
        uint256 marketId
    )
        internal
        view
        returns (Monetary.Price memory)
    {
        IPriceOracle oracle = IPriceOracle(g_markets[marketId].priceOracle);
        return oracle.getPrice(getToken(marketId));
    }

    // =============== Setter Functions ===============

    function updateIndex(
        uint256 marketId
    )
        internal
        returns (Interest.Index memory)
    {
        Interest.Index memory index = g_markets[marketId].index;

        if (index.lastUpdate == Time.currentTime()) {
            return index;
        }

        Interest.Rate memory rate = fetchInterestRate(marketId, index);

        index = Interest.calculateNewIndex(
            index,
            rate,
            getTotalPar(marketId),
            g_earningsRate
        );

        g_markets[marketId].index = index;

        return index;
    }

    function setStatus(
        Acct.Info memory account,
        AccountStatus status
    )
        internal
        returns (bool)
    {
        g_accounts[account.owner][account.number].status = status;
    }

    function setPar(
        Acct.Info memory account,
        uint256 marketId,
        Types.Par memory newPar
    )
        internal
    {
        Types.Par memory oldPar = getPar(account, marketId);

        if (Types.equals(oldPar, newPar)) {
            return;
        }

        // updateTotalPar
        Types.TotalPar memory totalPar = getTotalPar(marketId);

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

        g_markets[marketId].totalPar = totalPar;
        g_accounts[account.owner][account.number].balances[marketId] = newPar;
    }

    /**
     * Determines and sets an account's balance based on a change in wei
     */
    function setParFromDeltaWei(
        Acct.Info memory account,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
    {
        Interest.Index memory index = getIndex(marketId);
        Types.Wei memory oldWei = getWei(account, marketId);
        Types.Wei memory newWei = oldWei.add(deltaWei);
        Types.Par memory newPar = Interest.weiToPar(newWei, index);
        setPar(
            account,
            marketId,
            newPar
        );
    }

    /**
     * Determines and sets an account's balance based on the intended balance change. Returns the
     * equivalent amount in wei
     */
    function getNewParAndDeltaWei(
        Acct.Info memory account,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Interest.Index memory index = getIndex(marketId);
        Types.Par memory oldPar = getPar(account, marketId);
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

    function getNewParAndDeltaWeiForLiquidation(
        Acct.Info memory account,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Require.that(
            getPar(account, marketId).isNegative(),
            FILE,
            "Liquidating/Vaporizing account must have negative balance",
            account.number,
            marketId
        );

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = getNewParAndDeltaWei(
            account,
            marketId,
            amount
        );

        Require.that(
            deltaWei.isPositive(),
            FILE,
            "Liquidating/Vaporizing negative account balance must be repaid"
        );

        // if attempting to over-repay the owed asset, bound it by the maximum
        if (newPar.isPositive()) {
            newPar = Types.zeroPar();
            deltaWei = getWei(account, marketId).negative();
        }

        return (newPar, deltaWei);
    }

    function valuesToStatus(
        Monetary.Value memory supplyValue,
        Monetary.Value memory borrowValue
    )
        internal
        view
        returns (AccountStatus)
    {
        if (borrowValue.value == 0) {
            return AccountStatus.Normal;
        }

        if (supplyValue.value == 0) {
            return AccountStatus.Vapor;
        }

        uint256 requiredSupply = Decimal.mul(borrowValue.value, g_liquidationRatio);
        if (supplyValue.value >= requiredSupply) {
            return AccountStatus.Normal;
        } else {
            return AccountStatus.Liquid;
        }
    }

    function vaporizeUsingExcess(
        Acct.Info memory account,
        uint256 owedMarketId
    )
        internal
        returns (bool)
    {
        Types.Wei memory sameWei = getNumExcessTokens(owedMarketId);

        if (!sameWei.isPositive()) {
            return false;
        }

        Types.Wei memory toRefundWei = getWei(
            account,
            owedMarketId
        );

        if (sameWei.value >= toRefundWei.value) {
            setPar(
                account,
                owedMarketId,
                Types.zeroPar()
            );
            return true;
        } else {
            setParFromDeltaWei(
                account,
                owedMarketId,
                sameWei
            );
            return false;
        }
    }

    function getValues(
        Acct.Info memory account
    )
        internal
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        for (uint256 m = 0; m < g_numMarkets; m++) {
            Types.Par memory userPar = getPar(account, m);

            if (userPar.isZero()) {
                continue;
            }

            Interest.Index memory index = updateIndex(m);
            Types.Wei memory userWei = Interest.parToWei(userPar, index);

            Monetary.Value memory overallValue = Monetary.getValue(
                fetchPrice(m),
                userWei.value
            );

            if (userWei.sign) {
                supplyValue = Monetary.add(supplyValue, overallValue);
            } else {
                borrowValue = Monetary.add(borrowValue, overallValue);
            }
        }

        return (supplyValue, borrowValue);
    }

    function fetchPriceRatio(
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        Monetary.Price memory heldPrice = fetchPrice(heldMarketId);
        Monetary.Price memory owedPrice = fetchPrice(owedMarketId);
        return Decimal.D256({
            value: Math.getPartial(
                Decimal.one().value,
                owedPrice.value,
                heldPrice.value
            )
        });
    }

    function owedWeiToHeldWei(
        Decimal.D256 memory priceRatio,
        Types.Wei memory owedWei
    )
        internal
        view
        returns (Types.Wei memory)
    {
        // TODO: bug here?
        return Types.Wei({
            sign: false,
            value: Decimal.mul(owedWei.value, Decimal.mul(priceRatio, g_liquidationSpread))
        });
    }

    function heldWeiToOwedWei(
        Decimal.D256 memory priceRatio,
        Types.Wei memory heldWei
    )
        internal
        view
        returns (Types.Wei memory)
    {
        // TODO: bug here?
        return Types.Wei({
            sign: true,
            value: Decimal.div(heldWei.value, Decimal.div(priceRatio, g_liquidationSpread))
        });
    }
}
