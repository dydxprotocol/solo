/*

    Copyright 2019 dYdX Trading Inc.

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
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { IDolomiteMargin } from "../../protocol/interfaces/IDolomiteMargin.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Interest } from "../../protocol/lib/Interest.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { LiquidatorProxyHelper } from "../helpers/LiquidatorProxyHelper.sol";
import { OnlyDolomiteMargin } from "../helpers/OnlyDolomiteMargin.sol";


/**
 * @title LiquidatorProxyV1
 * @author dYdX
 *
 * Contract for liquidating other accounts in DolomiteMargin.
 */
contract LiquidatorProxyV1 is OnlyDolomiteMargin, ReentrancyGuard, LiquidatorProxyHelper {
    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidatorProxyV1";

    // ============ Structs ============

    struct Constants {
        IDolomiteMargin dolomiteMargin;
        Account.Info solidAccount;
        Account.Info liquidAccount;
        Decimal.D256 minLiquidatorRatio;
        MarketInfo[] markets;
        uint256[] liquidMarkets;
    }

    struct LiquidatorProxyCache {
        // mutable
        uint256 toLiquidate;
        Types.Wei heldWei;
        Types.Wei owedWei;
        uint256 supplyValue;
        uint256 borrowValue;

        // immutable
        Decimal.D256 spread;
        uint256 heldMarket;
        uint256 owedMarket;
        uint256 heldPrice;
        uint256 owedPrice;
        uint256 owedPriceAdj;
    }

    // ============ Constructor ============

    constructor (
        address dolomiteMargin
    )
        public
        OnlyDolomiteMargin(dolomiteMargin)
    {} /* solium-disable-line no-empty-blocks */

    // ============ Public Functions ============

    /**
     * Liquidate liquidAccount using solidAccount. This contract and the msg.sender to this contract
     * must both be operators for the solidAccount.
     *
     * @param  solidAccount         The account that will do the liquidating
     * @param  liquidAccount       The account that will be liquidated
     * @param  minLiquidatorRatio  The minimum collateralization ratio to leave the solidAccount at
     * @param  owedPreferences     Ordered list of markets to repay first
     * @param  heldPreferences     Ordered list of markets to receive payout for first
     */
    function liquidate(
        Account.Info memory solidAccount,
        Account.Info memory liquidAccount,
        Decimal.D256 memory minLiquidatorRatio,
        uint256 minValueLiquidated,
        uint256[] memory owedPreferences,
        uint256[] memory heldPreferences
    )
        public
        nonReentrant
    {
        // put all values that will not change into a single struct
        Constants memory constants;
        constants.dolomiteMargin = DOLOMITE_MARGIN;
        constants.solidAccount = solidAccount;
        constants.liquidAccount = liquidAccount;
        constants.minLiquidatorRatio = minLiquidatorRatio;
        constants.liquidMarkets = constants.dolomiteMargin.getAccountMarketsWithBalances(liquidAccount);
        constants.markets = getMarketInfos(
            constants.dolomiteMargin,
            constants.dolomiteMargin.getAccountMarketsWithBalances(solidAccount),
            constants.liquidMarkets
        );

        // validate the msg.sender and that the liquidAccount can be liquidated
        checkRequirements(constants);

        // keep a running tally of how much value will be attempted to be liquidated
        uint256 totalValueLiquidated = 0;

        // for each owedMarket
        for (uint256 owedIndex = 0; owedIndex < owedPreferences.length; owedIndex++) {
            uint256 owedMarket = owedPreferences[owedIndex];

            // for each heldMarket
            for (uint256 heldIndex = 0; heldIndex < heldPreferences.length; heldIndex++) {
                uint256 heldMarket = heldPreferences[heldIndex];

                // cannot use the same market
                if (heldMarket == owedMarket) {
                    continue;
                }

                // cannot liquidate non-negative markets
                if (!constants.dolomiteMargin.getAccountPar(liquidAccount, owedMarket).isNegative()) {
                    break;
                }

                // cannot use non-positive markets as collateral
                if (!constants.dolomiteMargin.getAccountPar(liquidAccount, heldMarket).isPositive()) {
                    continue;
                }

                // get all relevant values
                LiquidatorProxyCache memory cache = initializeCache(constants, heldMarket, owedMarket);

                // get the liquidation amount (before liquidator decreases in collateralization)
                calculateSafeLiquidationAmount(cache);

                // get the max liquidation amount (before liquidator reaches minLiquidatorRatio)
                calculateMaxLiquidationAmount(constants, cache);

                // if nothing to liquidate, do nothing
                if (cache.toLiquidate == 0) {
                    continue;
                }

                // execute the liquidations
                constants.dolomiteMargin.operate(
                    constructAccountsArray(constants),
                    constructActionsArray(cache)
                );

                // increment the total value liquidated
                totalValueLiquidated = totalValueLiquidated.add(cache.toLiquidate.mul(cache.owedPrice));
            }
        }

        // revert if liquidator account does not have a lot of overhead to liquidate these pairs
        Require.that(
            totalValueLiquidated >= minValueLiquidated,
            FILE,
            "Not enough liquidatable value",
            totalValueLiquidated,
            minValueLiquidated
        );
    }

    // ============ Calculation Functions ============

    /**
     * Calculate the owedAmount that can be liquidated until the liquidator account will be left
     * with BOTH a non-negative balance of heldMarket AND a non-positive balance of owedMarket.
     * This is the amount that can be liquidated until the collateralization of the liquidator
     * account will begin to decrease.
     */
    function calculateSafeLiquidationAmount(
        LiquidatorProxyCache memory cache
    )
        private
        pure
    {
        bool negOwed = !cache.owedWei.isPositive();
        bool posHeld = !cache.heldWei.isNegative();

        // owedWei is already negative and heldWei is already positive
        if (negOwed && posHeld) {
            return;
        }

        // true if it takes longer for the liquidator owed balance to become negative than it takes
        // the liquidator held balance to become positive.
        bool owedGoesToZeroLast;
        if (negOwed) {
            owedGoesToZeroLast = false;
        } else if (posHeld) {
            owedGoesToZeroLast = true;
        } else {
            // owed is still positive and held is still negative
            owedGoesToZeroLast = cache.owedWei.value.mul(cache.owedPriceAdj) > cache.heldWei.value.mul(cache.heldPrice);
        }

        if (owedGoesToZeroLast) {
            // calculate the change in heldWei to get owedWei to zero
            Types.Wei memory heldWeiDelta = Types.Wei({
                sign: cache.owedWei.sign,
                value: cache.owedWei.value.getPartial(cache.owedPriceAdj, cache.heldPrice)
            });
            setCacheWeiValues(
                cache,
                cache.heldWei.add(heldWeiDelta),
                Types.zeroWei()
            );
        } else {
            // calculate the change in owedWei to get heldWei to zero
            Types.Wei memory owedWeiDelta = Types.Wei({
                sign: cache.heldWei.sign,
                value: cache.heldWei.value.getPartial(cache.heldPrice, cache.owedPriceAdj)
            });
            setCacheWeiValues(
                cache,
                Types.zeroWei(),
                cache.owedWei.add(owedWeiDelta)
            );
        }
    }

    /**
     * Calculate the additional owedAmount that can be liquidated until the collateralization of the
     * liquidator account reaches the minLiquidatorRatio. By this point, the cache will be set such
     * that the amount of owedMarket is non-positive and the amount of heldMarket is non-negative.
     */
    function calculateMaxLiquidationAmount(
        Constants memory constants,
        LiquidatorProxyCache memory cache
    )
        private
        pure
    {
        assert(!cache.heldWei.isNegative());
        assert(!cache.owedWei.isPositive());

        // if the liquidator account is already not above the collateralization requirement, return
        bool liquidatorAboveCollateralization = isCollateralized(
            cache.supplyValue,
            cache.borrowValue,
            constants.minLiquidatorRatio
        );
        if (!liquidatorAboveCollateralization) {
            cache.toLiquidate = 0;
            return;
        }

        // find the value difference between the current margin and the margin at minLiquidatorRatio
        uint256 requiredOverhead = Decimal.mul(cache.borrowValue, constants.minLiquidatorRatio);
        uint256 requiredSupplyValue = cache.borrowValue.add(requiredOverhead);
        uint256 remainingValueBuffer = cache.supplyValue.sub(requiredSupplyValue);

        // get the absolute difference between the minLiquidatorRatio and the liquidation spread
        Decimal.D256 memory spreadMarginDiff = Decimal.D256({
            value: constants.minLiquidatorRatio.value.sub(cache.spread.value)
        });

        // get the additional value of owedToken I can borrow to liquidate this position
        uint256 owedValueToTakeOn = Decimal.div(remainingValueBuffer, spreadMarginDiff);

        // get the additional amount of owedWei to liquidate
        uint256 owedWeiToLiquidate = owedValueToTakeOn.div(cache.owedPrice);

        // store the additional amount in the cache
        cache.toLiquidate = cache.toLiquidate.add(owedWeiToLiquidate);
    }

    // ============ Helper Functions ============

    /**
     * Make some basic checks before attempting to liquidate an account.
     *  - Require that the msg.sender has the permission to use the liquidator account
     *  - Require that the liquid account is liquidatable
     */
    function checkRequirements(
        Constants memory constants
    )
        private
        view
    {
        // check credentials for msg.sender
        Require.that(
            constants.solidAccount.owner == msg.sender
            || constants.dolomiteMargin.getIsLocalOperator(constants.solidAccount.owner, msg.sender),
            FILE,
            "Sender not operator",
            constants.solidAccount.owner
        );

        // require that the liquidAccount is liquidatable
        (
            Monetary.Value memory liquidSupplyValue,
            Monetary.Value memory liquidBorrowValue
        ) = getAdjustedAccountValues(
            constants.dolomiteMargin,
            constants.markets,
            constants.liquidAccount,
            constants.liquidMarkets
        );
        Require.that(
            liquidSupplyValue.value != 0,
            FILE,
            "Liquid account no supply"
        );
        Require.that(
            constants.dolomiteMargin.getAccountStatus(constants.liquidAccount) == Account.Status.Liquid ||
            !isCollateralized(
                liquidSupplyValue.value,
                liquidBorrowValue.value,
                constants.dolomiteMargin.getMarginRatio()
            ),
            FILE,
            "Liquid account not liquidatable",
            liquidSupplyValue.value,
            liquidBorrowValue.value
        );
    }

    /**
     * Changes the cache values to reflect changing the heldWei and owedWei of the liquidator
     * account. Changes toLiquidate, heldWei, owedWei, supplyValue, and borrowValue.
     */
    function setCacheWeiValues(
        LiquidatorProxyCache memory cache,
        Types.Wei memory newHeldWei,
        Types.Wei memory newOwedWei
    )
        private
        pure
    {
        // roll-back the old held value
        uint256 oldHeldValue = cache.heldWei.value.mul(cache.heldPrice);
        if (cache.heldWei.sign) {
            cache.supplyValue = cache.supplyValue.sub(oldHeldValue, "cache.heldWei.sign");
        } else {
            cache.borrowValue = cache.borrowValue.sub(oldHeldValue, "!cache.heldWei.sign");
        }

        // add the new held value
        uint256 newHeldValue = newHeldWei.value.mul(cache.heldPrice);
        if (newHeldWei.sign) {
            cache.supplyValue = cache.supplyValue.add(newHeldValue);
        } else {
            cache.borrowValue = cache.borrowValue.add(newHeldValue);
        }

        // roll-back the old owed value
        uint256 oldOwedValue = cache.owedWei.value.mul(cache.owedPrice);
        if (cache.owedWei.sign) {
            cache.supplyValue = cache.supplyValue.sub(oldOwedValue, "cache.owedWei.sign");
        } else {
            cache.borrowValue = cache.borrowValue.sub(oldOwedValue, "!cache.owedWei.sign");
        }

        // add the new owed value
        uint256 newOwedValue = newOwedWei.value.mul(cache.owedPrice);
        if (newOwedWei.sign) {
            cache.supplyValue = cache.supplyValue.add(newOwedValue);
        } else {
            cache.borrowValue = cache.borrowValue.add(newOwedValue);
        }

        // update toLiquidate, heldWei, and owedWei
        Types.Wei memory delta = cache.owedWei.sub(newOwedWei);
        assert(!delta.isNegative());
        cache.toLiquidate = cache.toLiquidate.add(delta.value);
        cache.heldWei = newHeldWei;
        cache.owedWei = newOwedWei;
    }

    /**
     * Returns true if the supplyValue over-collateralizes the borrowValue by the ratio.
     */
    function isCollateralized(
        uint256 supplyValue,
        uint256 borrowValue,
        Decimal.D256 memory ratio
    )
        private
        pure
        returns(bool)
    {
        uint256 requiredMargin = Decimal.mul(borrowValue, ratio);
        return supplyValue >= borrowValue.add(requiredMargin);
    }

    // ============ Getter Functions ============

    /**
     * Pre-populates cache values for some pair of markets.
     */
    function initializeCache(
        Constants memory constants,
        uint256 heldMarket,
        uint256 owedMarket
    )
        private
        view
        returns (LiquidatorProxyCache memory)
    {
        (
            Monetary.Value memory supplyValue,
            Monetary.Value memory borrowValue
        ) = getAccountValues(
            constants.dolomiteMargin,
            constants.markets,
            constants.solidAccount,
            constants.dolomiteMargin.getAccountMarketsWithBalances(constants.solidAccount)
        );

        MarketInfo memory heldMarketInfo = binarySearch(constants.markets, heldMarket);
        MarketInfo memory owedMarketInfo = binarySearch(constants.markets, owedMarket);

        uint256 heldPrice = heldMarketInfo.price.value;
        uint256 owedPrice = owedMarketInfo.price.value;
        Decimal.D256 memory spread = constants.dolomiteMargin.getLiquidationSpreadForPair(heldMarket, owedMarket);

        return LiquidatorProxyCache({
            heldWei: Interest.parToWei(
                constants.dolomiteMargin.getAccountPar(constants.solidAccount, heldMarket),
                heldMarketInfo.index
            ),
            owedWei: Interest.parToWei(
                constants.dolomiteMargin.getAccountPar(constants.solidAccount, owedMarket),
                owedMarketInfo.index
            ),
            toLiquidate: 0,
            supplyValue: supplyValue.value,
            borrowValue: borrowValue.value,
            heldMarket: heldMarket,
            owedMarket: owedMarket,
            spread: spread,
            heldPrice: heldPrice,
            owedPrice: owedPrice,
            owedPriceAdj: Decimal.mul(owedPrice, Decimal.onePlus(spread))
        });
    }

    // ============ Operation-Construction Functions ============

    function constructAccountsArray(
        Constants memory constants
    )
        private
        pure
        returns (Account.Info[] memory)
    {
        Account.Info[] memory accounts = new Account.Info[](2);
        accounts[0] = constants.solidAccount;
        accounts[1] = constants.liquidAccount;
        return accounts;
    }

    function constructActionsArray(
        LiquidatorProxyCache memory cache
    )
        private
        pure
        returns (Actions.ActionArgs[] memory)
    {
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Liquidate,
            accountId: 0,
            amount: Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: cache.toLiquidate
            }),
            primaryMarketId: cache.owedMarket,
            secondaryMarketId: cache.heldMarket,
            otherAddress: address(0),
            otherAccountId: 1,
            data: new bytes(0)
        });
        return actions;
    }
}
