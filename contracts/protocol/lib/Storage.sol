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
import { Account } from "./Account.sol";
import { Actions } from "./Actions.sol";
import { Decimal } from "./Decimal.sol";
import { Interest } from "./Interest.sol";
import { Math } from "./Math.sol";
import { Monetary } from "./Monetary.sol";
import { Require } from "./Require.sol";
import { Time } from "./Time.sol";
import { Token } from "./Token.sol";
import { Types } from "./Types.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";


/**
 * @title Storage
 * @author dYdX
 *
 * Functions for reading, writing, and verifying storage
 */
library Storage {
    using Storage for Storage.State;
    using Math for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;
    using SafeMath for uint256;

    // ============ Constants ============

    string constant FILE = "Storage";

    // ============ Structs ============

    struct Market {
        address token;
        Types.TotalPar totalPar;
        Interest.Index index;
        IPriceOracle priceOracle;
        IInterestSetter interestSetter;
        bool isClosing;
    }

    struct RiskParams {
        // collateral ratio at which accounts can be liquidated
        Decimal.D256 liquidationRatio;

        // (1 - liquidationSpread) is the percentage penalty incurred by liquidated accounts
        Decimal.D256 liquidationSpread;

        // Percentage of the borrower's interest fee that gets passed to the suppliers
        Decimal.D256 earningsRate;

        // The minimum absolute borrow value of an account
        // There must be sufficient incentivize to liquidate undercollateralized accounts
        Monetary.Value minBorrowedValue;
    }

    struct RiskLimits {
        uint64 interestRateMax;
        uint64 liquidationRatioMax;
        uint64 liquidationRatioMin;
        uint64 liquidationSpreadMax;
        uint64 liquidationSpreadMin;
        uint64 earningsRateMin;
        uint64 earningsRateMax;
        uint128 minBorrowedValueMax;
        uint128 minBorrowedValueMin;
    }

    struct State {
        // number of markets
        uint256 numMarkets;

        // marketId => Market
        mapping (uint256 => Market) markets;

        // owner => account number => Account
        mapping (address => mapping (uint256 => Account.Storage)) accounts;

        // Addresses that can control other users accounts
        mapping (address => mapping (address => bool)) operators;

        // Addresses that can control all users accounts
        mapping (address => bool) globalOperators;

        // mutable risk parameters of the system
        RiskParams riskParams;

        // immutable risk limits of the system
        RiskLimits riskLimits;
    }

    // ============ Functions ============

    function getToken(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (address)
    {
        return state.markets[marketId].token;
    }

    function getTotalPar(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Types.TotalPar memory)
    {
        return state.markets[marketId].totalPar;
    }

    function getIndex(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Interest.Index memory)
    {
        return state.markets[marketId].index;
    }

    function getNumExcessTokens(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Interest.Index memory index = state.getIndex(marketId);
        Types.TotalPar memory totalPar = state.getTotalPar(marketId);

        address token = state.getToken(marketId);

        Types.Wei memory balanceWei = Types.Wei({
            sign: true,
            value: Token.balanceOf(token, address(this))
        });

        (
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

        return balanceWei.add(borrowWei).sub(supplyWei);
    }

    function getStatus(
        Storage.State storage state,
        Account.Info memory account
    )
        internal
        view
        returns (Account.Status)
    {
        return state.accounts[account.owner][account.number].status;
    }

    function getPar(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Par memory)
    {
        return state.accounts[account.owner][account.number].balances[marketId];
    }

    function getWei(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {
        Types.Par memory par = state.getPar(account, marketId);

        if (par.isZero()) {
            return Types.zeroWei();
        }

        Interest.Index memory index = state.getIndex(marketId);
        return Interest.parToWei(par, index);
    }

    function fetchNewIndex(
        Storage.State storage state,
        uint256 marketId,
        Interest.Index memory index
    )
        internal
        view
        returns (Interest.Index memory)
    {
        Interest.Rate memory rate = state.fetchInterestRate(marketId, index);

        return Interest.calculateNewIndex(
            index,
            rate,
            state.getTotalPar(marketId),
            state.riskParams.earningsRate
        );
    }

    function fetchInterestRate(
        Storage.State storage state,
        uint256 marketId,
        Interest.Index memory index
    )
        internal
        view
        returns (Interest.Rate memory)
    {
        Types.TotalPar memory totalPar = state.getTotalPar(marketId);
        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(totalPar, index);

        Interest.Rate memory rate = state.markets[marketId].interestSetter.getInterestRate(
            state.getToken(marketId),
            borrowWei.value,
            supplyWei.value
        );

        if (rate.value > state.riskLimits.interestRateMax) {
            rate.value = state.riskLimits.interestRateMax;
        }

        return rate;
    }

    function fetchPrice(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Monetary.Price memory)
    {
        IPriceOracle oracle = IPriceOracle(state.markets[marketId].priceOracle);
        return oracle.getPrice(state.getToken(marketId));
    }

    function getValues(
        Storage.State storage state,
        Account.Info memory account
    )
        internal
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        uint256 numMarkets = state.numMarkets;
        for (uint256 m = 0; m < numMarkets; m++) {
            Types.Wei memory userWei = state.getWei(account, m);

            if (userWei.isZero()) {
                continue;
            }

            Monetary.Value memory overallValue = Monetary.getValue(
                state.fetchPrice(m),
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
        Storage.State storage state,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        internal
        view
        returns (Decimal.D256 memory)
    {
        Monetary.Price memory heldPrice = state.fetchPrice(heldMarketId);
        Monetary.Price memory owedPrice = state.fetchPrice(owedMarketId);

        // get the actual price ratio
        Decimal.D256 memory priceRatio = Decimal.D256({
            value: Math.getPartial(
                Decimal.one().value,
                owedPrice.value,
                heldPrice.value
            )
        });

        // return the price ratio including the spread
        return Decimal.mul(priceRatio, state.riskParams.liquidationSpread);
    }

    function isGlobalOperator(
        Storage.State storage state,
        address operator
    )
        internal
        view
        returns (bool)
    {
        return state.globalOperators[operator];
    }

    function isLocalOperator(
        Storage.State storage state,
        Account.Info memory account,
        address operator
    )
        internal
        view
        returns (bool)
    {
        return state.operators[account.owner][operator];
    }

    function requireIsOperator(
        Storage.State storage state,
        Account.Info memory account,
        address operator
    )
        internal
        view
    {
        bool isValidOperator =
            operator == account.owner
            || state.isGlobalOperator(operator)
            || state.isLocalOperator(account, operator);

        Require.that(
            isValidOperator,
            FILE,
            "Unpermissioned Operator"
        );
    }

    // =============== Setter Functions ===============

    function updateIndex(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        returns (Interest.Index memory)
    {
        Interest.Index memory index = state.getIndex(marketId);
        if (index.lastUpdate == Time.currentTime()) {
            return index;
        }
        return state.markets[marketId].index = state.fetchNewIndex(marketId, index);
    }

    function setStatus(
        Storage.State storage state,
        Account.Info memory account,
        Account.Status status
    )
        internal
        returns (bool)
    {
        state.accounts[account.owner][account.number].status = status;
    }

    function setPar(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.Par memory newPar
    )
        internal
    {
        Types.Par memory oldPar = state.getPar(account, marketId);

        if (Types.equals(oldPar, newPar)) {
            return;
        }

        // updateTotalPar
        Types.TotalPar memory totalPar = state.getTotalPar(marketId);

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

        state.markets[marketId].totalPar = totalPar;
        state.accounts[account.owner][account.number].balances[marketId] = newPar;
    }

    /**
     * Determines and sets an account's balance based on a change in wei
     */
    function setParFromDeltaWei(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
    {
        Interest.Index memory index = state.getIndex(marketId);
        Types.Wei memory oldWei = state.getWei(account, marketId);
        Types.Wei memory newWei = oldWei.add(deltaWei);
        Types.Par memory newPar = Interest.weiToPar(newWei, index);
        state.setPar(
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
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Interest.Index memory index = state.getIndex(marketId);
        Types.Par memory oldPar = state.getPar(account, marketId);
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
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Actions.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {
        Require.that(
            state.getPar(account, marketId).isNegative(),
            FILE,
            "Balance must be negatives",
            account.number,
            marketId
        );

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            account,
            marketId,
            amount
        );

        Require.that(
            deltaWei.isPositive(),
            FILE,
            "Balance must be repaid"
        );

        // if attempting to over-repay the owed asset, bound it by the maximum
        if (newPar.isPositive()) {
            newPar = Types.zeroPar();
            deltaWei = state.getWei(account, marketId).negative();
        }

        return (newPar, deltaWei);
    }

    function valuesToStatus(
        Storage.State storage state,
        Monetary.Value memory supplyValue,
        Monetary.Value memory borrowValue
    )
        internal
        view
        returns (Account.Status)
    {
        if (borrowValue.value == 0) {
            return Account.Status.Normal;
        }

        if (supplyValue.value == 0) {
            return Account.Status.Vapor;
        }

        uint256 requiredSupply =
            Decimal.mul(borrowValue.value, state.riskParams.liquidationRatio);

        if (supplyValue.value >= requiredSupply) {
            return Account.Status.Normal;
        } else {
            return Account.Status.Liquid;
        }
    }

    function vaporizeUsingExcess(
        Storage.State storage state,
        Account.Info memory account,
        uint256 owedMarketId
    )
        internal
        returns (bool)
    {
        Types.Wei memory excessWei = state.getNumExcessTokens(owedMarketId);

        if (!excessWei.isPositive()) {
            return false;
        }

        Types.Wei memory maxRefundWei = state.getWei(
            account,
            owedMarketId
        );

        if (excessWei.value >= maxRefundWei.value) {
            state.setPar(
                account,
                owedMarketId,
                Types.zeroPar()
            );
            return true;
        } else {
            state.setParFromDeltaWei(
                account,
                owedMarketId,
                excessWei
            );
            return false;
        }
    }
}
