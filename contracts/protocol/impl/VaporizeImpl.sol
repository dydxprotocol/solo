/*

    Copyright 2021 Dolomite

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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Account } from "../lib/Account.sol";
import { Actions } from "../lib/Actions.sol";
import { Cache } from "../lib/Cache.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Events } from "../lib/Events.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";
import { LiquidationOrVaporization } from "../lib/LiquidationOrVaporization.sol";


library VaporizeImpl {
    using Cache for Cache.MarketCache;
    using Storage for Storage.State;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "VaporizeImpl";

    function vaporize(
        Storage.State storage state,
        Actions.VaporizeArgs memory args,
        Cache.MarketCache memory cache
    )
    public
    {
        state.requireIsOperator(args.solidAccount, msg.sender);

        // verify vaporizable
        if (Account.Status.Vapor != state.getStatus(args.vaporAccount)) {
            Require.that(
                state.isVaporizable(args.vaporAccount, cache),
                FILE,
                "Unvaporizable account",
                args.vaporAccount.owner,
                args.vaporAccount.number
            );
            state.setStatus(args.vaporAccount, Account.Status.Vapor);
        }

        // First, attempt to refund using the same token
        (
        bool fullyRepaid,
        Types.Wei memory excessWei
        ) = _vaporizeUsingExcess(state, args);
        if (fullyRepaid) {
            Events.logVaporize(
                state,
                args,
                Types.zeroWei(),
                Types.zeroWei(),
                excessWei
            );
            return;
        }

        Types.Wei memory maxHeldWei = state.getNumExcessTokens(args.heldMarket);

        Require.that(
            !maxHeldWei.isNegative(),
            FILE,
            "Excess cannot be negative",
            args.heldMarket
        );

        (
        Types.Par memory owedPar,
        Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.vaporAccount,
            args.owedMarket,
            args.amount
        );

        (
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
        ) = LiquidationOrVaporization._getLiquidationPrices(
            state,
            cache,
            args.heldMarket,
            args.owedMarket
        );

        Types.Wei memory heldWei = LiquidationOrVaporization._owedWeiToHeldWei(owedWei, heldPrice, owedPrice);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = LiquidationOrVaporization._heldWeiToOwedWei(heldWei, heldPrice, owedPrice);

            state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMarket,
                owedWei
            );
        } else {
            state.setPar(
                args.vaporAccount,
                args.owedMarket,
                owedPar
            );
        }

        // set the balances for the solid account
        state.setParFromDeltaWei(
            args.solidAccount,
            args.owedMarket,
            owedWei.negative()
        );
        state.setParFromDeltaWei(
            args.solidAccount,
            args.heldMarket,
            heldWei.negative()
        );

        Events.logVaporize(
            state,
            args,
            heldWei,
            owedWei,
            excessWei
        );
    }

    /**
     * Attempt to vaporize an account's balance using the excess tokens in the protocol. Return a
     * bool and a wei value. The boolean is true if and only if the balance was fully vaporized. The
     * Wei value is how many excess tokens were used to partially or fully vaporize the account's
     * negative balance.
     */
    function _vaporizeUsingExcess(
        Storage.State storage state,
        Actions.VaporizeArgs memory args
    )
    internal
    returns (bool, Types.Wei memory)
    {
        Types.Wei memory excessWei = state.getNumExcessTokens(args.owedMarket);

        // There are no excess funds, return zero
        if (!excessWei.isPositive()) {
            return (false, Types.zeroWei());
        }

        Types.Wei memory maxRefundWei = state.getWei(args.vaporAccount, args.owedMarket);
        maxRefundWei.sign = true;

        // The account is fully vaporizable using excess funds
        if (excessWei.value >= maxRefundWei.value) {
            state.setPar(
                args.vaporAccount,
                args.owedMarket,
                Types.zeroPar()
            );
            return (true, maxRefundWei);
        }

        // The account is only partially vaporizable using excess funds
        else {
            state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMarket,
                excessWei
            );
            return (false, excessWei);
        }
    }

}
