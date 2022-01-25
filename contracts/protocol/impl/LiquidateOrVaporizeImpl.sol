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

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ILiquidationCallback } from "../interfaces/ILiquidationCallback.sol";
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


library LiquidateOrVaporizeImpl {
    using Address for address;
    using Cache for Cache.MarketCache;
    using SafeMath for uint256;
    using Storage for Storage.State;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidateOrVaporizeImpl";

    // ============ Events ============

    event LogLiquidationCallbackSuccess(address indexed liquidAccountOwner, uint liquidAccountNumber);

    event LogLiquidationCallbackFailure(address indexed liquidAccountOwner, uint liquidAccountNumber, string reason);

    // ============ Account Functions ============

    function liquidate(
        Storage.State storage state,
        Actions.LiquidateArgs memory args,
        Cache.MarketCache memory cache
    )
    public
    {
        state.requireIsGlobalOperator(msg.sender);

        // verify liquidatable
        if (Account.Status.Liquid != state.getStatus(args.liquidAccount)) {
            Require.that(
                !state.isCollateralized(args.liquidAccount, cache, /* requireMinBorrow = */ false),
                FILE,
                "Unliquidatable account",
                args.liquidAccount.owner,
                args.liquidAccount.number
            );
            state.setStatus(args.liquidAccount, Account.Status.Liquid);
        }

        Types.Wei memory maxHeldWei = state.getWei(
            args.liquidAccount,
            args.heldMarket
        );

        Require.that(
            !maxHeldWei.isNegative(),
            FILE,
            "Collateral cannot be negative",
            args.heldMarket
        );

        (
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.liquidAccount,
            args.owedMarket,
            args.amount
        );

        (
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPriceAdj
        ) = _getLiquidationPrices(
            state,
            cache,
            args.heldMarket,
            args.owedMarket
        );

        Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPriceAdj);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPriceAdj);

            _callLiquidateCallbackIfNecessary(
                args.liquidAccount,
                args.heldMarket,
                heldWei,
                args.owedMarket,
                owedWei
            );

            state.setPar(
                args.liquidAccount,
                args.heldMarket,
                Types.zeroPar()
            );
            state.setParFromDeltaWei(
                args.liquidAccount,
                args.owedMarket,
                owedWei
            );
        } else {
            _callLiquidateCallbackIfNecessary(
                args.liquidAccount,
                args.heldMarket,
                heldWei,
                args.owedMarket,
                owedWei
            );

            state.setPar(
                args.liquidAccount,
                args.owedMarket,
                owedPar
            );
            state.setParFromDeltaWei(
                args.liquidAccount,
                args.heldMarket,
                heldWei
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

        Events.logLiquidate(
            state,
            args,
            heldWei,
            owedWei
        );
    }

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
        ) = _getLiquidationPrices(
            state,
            cache,
            args.heldMarket,
            args.owedMarket
        );

        Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPrice);

        // if attempting to over-borrow the held asset, bound it by the maximum
        if (heldWei.value > maxHeldWei.value) {
            heldWei = maxHeldWei.negative();
            owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPrice);

            _callLiquidateCallbackIfNecessary(
                args.vaporAccount,
                args.heldMarket,
                Types.zeroWei(),
                args.owedMarket,
                owedWei
            );

            state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMarket,
                owedWei
            );
        } else {
            _callLiquidateCallbackIfNecessary(
                args.vaporAccount,
                args.heldMarket,
                Types.zeroWei(),
                args.owedMarket,
                owedWei
            );

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

    /**
     * For the purposes of liquidation or vaporization, get the value-equivalent amount of owedWei
     * given heldWei and the (spread-adjusted) prices of each asset.
     */
    function _heldWeiToOwedWei(
        Types.Wei memory heldWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
    internal
    pure
    returns (Types.Wei memory)
    {
        return Types.Wei({
        sign: true,
        value: Math.getPartialRoundUp(heldWei.value, heldPrice.value, owedPrice.value)
        });
    }

    /**
     * For the purposes of liquidation or vaporization, get the value-equivalent amount of heldWei
     * given owedWei and the (spread-adjusted) prices of each asset.
     */
    function _owedWeiToHeldWei(
        Types.Wei memory owedWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
    internal
    pure
    returns (Types.Wei memory)
    {
        return Types.Wei({
        sign: false,
        value: Math.getPartial(owedWei.value, owedPrice.value, heldPrice.value)
        });
    }

    /**
     * Return the (spread-adjusted) prices of two assets for the purposes of liquidation or
     * vaporization.
     */
    function _getLiquidationPrices(
        Storage.State storage state,
        Cache.MarketCache memory cache,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
    internal
    view
    returns (
        Monetary.Price memory,
        Monetary.Price memory
    )
    {
        uint256 owedPrice = cache.get(owedMarketId).price.value;
        Decimal.D256 memory spread = state.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

        Monetary.Price memory owedPriceAdj = Monetary.Price({
        value: owedPrice.add(Decimal.mul(owedPrice, spread))
        });

        return (cache.get(heldMarketId).price, owedPriceAdj);
    }

    function _callLiquidateCallbackIfNecessary(
        Account.Info memory liquidAccount,
        uint heldMarket,
        Types.Wei memory heldDeltaWei,
        uint owedMarket,
        Types.Wei memory owedDeltaWei
    ) internal {
        if (liquidAccount.owner.isContract()) {
            // solium-disable-next-line security/no-low-level-calls
            (bool isCallSuccessful, bytes memory result) = liquidAccount.owner.call(
                abi.encodeWithSelector(
                    ILiquidationCallback(liquidAccount.owner).onLiquidate.selector,
                    liquidAccount.number,
                    heldMarket,
                    heldDeltaWei,
                    owedMarket,
                    owedDeltaWei
                )
            );

            if (isCallSuccessful) {
                emit LogLiquidationCallbackSuccess(liquidAccount.owner, liquidAccount.number);
            } else {
                if (result.length < 68) {
                    result = bytes("");
                } else {
                    // solium-disable-next-line security/no-inline-assembly
                    assembly {
                        result := add(result, 0x04)
                    }
                    result = bytes(abi.decode(result, (string)));
                }
                emit LogLiquidationCallbackFailure(liquidAccount.owner, liquidAccount.number, string(result));
            }
        }
    }

}
