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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import {IDolomiteMargin} from "../../protocol/interfaces/IDolomiteMargin.sol";

import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Interest } from "../../protocol/lib/Interest.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";

import { IExpiry } from "../interfaces/IExpiry.sol";

import { DolomiteAmmRouterProxy } from "./DolomiteAmmRouterProxy.sol";


/**
 * @title LiquidatorProxyV1WithAmm
 * @author dYdX
 *
 * Contract for liquidating other accounts in DolomiteMargin. Does not take marginPremium into account.
 */
contract LiquidatorProxyV1WithAmm is ReentrancyGuard {
    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidatorProxyV1WithAmm";

    // ============ Structs ============

    struct Constants {
        Account.Info solidAccount;
        Account.Info liquidAccount;
        MarketInfo[] markets;
        IExpiry EXPIRY_PROXY;
        uint32 expiry;
    }

    struct MarketInfo {
        Monetary.Price price;
        Interest.Index index;
    }

    struct LiquidatorWithAmmCache {
        // mutable
        uint256 toLiquidate;
        // The amount of heldMarket the solidAccount will receive. Includes the liquidation reward.
        uint256 solidHeldUpdateWithReward;
        Types.Wei solidHeldWei;
        Types.Wei liquidHeldWei;
        Types.Wei liquidOwedWei;

        // immutable
        uint256 heldMarket;
        uint256 owedMarket;
        uint256 heldPrice;
        uint256 owedPrice;
        uint256 owedPriceAdj;
    }

    // ============ Storage ============

    IDolomiteMargin DOLOMITE_MARGIN;
    DolomiteAmmRouterProxy ROUTER_PROXY;
    IExpiry EXPIRY_PROXY;

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        address dolomiteAmmRouterProxy,
        address expiryProxy
    )
    public
    {
        DOLOMITE_MARGIN = IDolomiteMargin(dolomiteMargin);
        ROUTER_PROXY = DolomiteAmmRouterProxy(dolomiteAmmRouterProxy);
        EXPIRY_PROXY = IExpiry(expiryProxy);
    }

    // ============ Public Functions ============

    /**
     * Liquidate liquidAccount using solidAccount. This contract and the msg.sender to this contract
     * must both be operators for the solidAccount.
     *
     * @param  solidAccount                 The account that will do the liquidating
     * @param  liquidAccount                The account that will be liquidated
     * @param  owedMarket                   The owed market whose borrowed value will be added to `toLiquidate`
     * @param  heldMarket                   The held market whose collateral will be recovered to take on the debt of
     *                                      `owedMarket`
     * @param  tokenPath                    The path through which the trade will be routed to recover the collateral
     * @param  expiry                       The time at which the position expires, if this liquidation is for closing
     *                                      an expired position. Else, 0.
     * @param  revertOnFailToSellCollateral True to revert the transaction completely if all collateral from the
     *                                      liquidation cannot repay the owed debt. False to swallow the error and sell
     *                                      whatever is possible.
     */
    function liquidate(
        Account.Info memory solidAccount,
        Account.Info memory liquidAccount,
        uint256 owedMarket,
        uint256 heldMarket,
        address[] memory tokenPath,
        uint expiry,
        bool revertOnFailToSellCollateral
    )
    public
    nonReentrant
    {
        Require.that(
            owedMarket != heldMarket,
            FILE,
            "owedMarket equals heldMarket",
            owedMarket,
            heldMarket
        );

        Require.that(
            !DOLOMITE_MARGIN.getAccountPar(liquidAccount, owedMarket).isPositive(),
            FILE,
            "owed market cannot be positive",
            owedMarket
        );

        Require.that(
            DOLOMITE_MARGIN.getAccountPar(liquidAccount, heldMarket).isPositive(),
            FILE,
            "held market cannot be negative",
            heldMarket
        );

        Require.that(
            DOLOMITE_MARGIN.getMarketIdByTokenAddress(tokenPath[0]) == heldMarket,
            FILE,
            "0-index token path incorrect",
            tokenPath[0]
        );

        Require.that(
            DOLOMITE_MARGIN.getMarketIdByTokenAddress(tokenPath[tokenPath.length - 1]) == owedMarket,
            FILE,
            "last-index token path incorrect",
            tokenPath[tokenPath.length - 1]
        );

        Require.that(
            uint32(expiry) == expiry,
            FILE,
            "expiry overflow",
            expiry
        );

        // put all values that will not change into a single struct
        Constants memory constants = Constants({
        solidAccount : solidAccount,
        liquidAccount : liquidAccount,
        markets : getMarketsInfo(),
        EXPIRY_PROXY: expiry > 0 ? EXPIRY_PROXY : IExpiry(address(0)),
        expiry: uint32(expiry)
        });

        LiquidatorWithAmmCache memory cache = initializeCache(
            constants,
            heldMarket,
            owedMarket
        );

        // validate the msg.sender and that the liquidAccount can be liquidated
        checkRequirements(constants);

        // get the max liquidation amount
        calculateMaxLiquidationAmount(cache);

        // if nothing to liquidate, do nothing
        Require.that(
            cache.toLiquidate != 0,
            FILE,
            "nothing to liquidate"
        );

        uint totalSolidHeldWei = cache.solidHeldUpdateWithReward;
        if (cache.solidHeldWei.sign) {
            // If the solid account has held wei, add the amount the solid account will receive from liquidation to its
            // total held wei
            // We do this so we can accurately track how much the solid account has, in case we need to input it
            // exactly to Router#getParamsForSwapExactTokensForTokens
            totalSolidHeldWei = totalSolidHeldWei.add(cache.solidHeldWei.value);
        }

        (Account.Info[] memory accounts, Actions.ActionArgs[] memory actions) =
        ROUTER_PROXY.getParamsForSwapTokensForExactTokens(
            constants.solidAccount.owner,
            constants.solidAccount.number,
            uint(- 1), // maxInputWei
            cache.toLiquidate, // the amount of owedMarket that needs to be repaid. Exact output amount
            tokenPath
        );
        if (revertOnFailToSellCollateral) {
            Require.that(
                totalSolidHeldWei >= actions[0].amount.value,
                FILE,
                "totalSolidHeldWei is too small",
                totalSolidHeldWei,
                actions[0].amount.value
            );
        } else if (totalSolidHeldWei < actions[0].amount.value) {
            (accounts, actions) = ROUTER_PROXY.getParamsForSwapExactTokensForTokens(
                constants.solidAccount.owner,
                constants.solidAccount.number,
                totalSolidHeldWei, // inputWei
                1, // minOutputAmount; we will sell whatever collateral we can
                tokenPath
            );
        }

        accounts = constructAccountsArray(constants, accounts);

        // execute the liquidations
        DOLOMITE_MARGIN.operate(
            accounts,
            constructActionsArray(constants, cache, accounts, actions)
        );
    }

    // ============ Calculation Functions ============

    /**
     * Calculate the additional owedAmount that can be liquidated until the collateralization of the
     * liquidator account reaches the minLiquidatorRatio. By this point, the cache will be set such
     * that the amount of owedMarket is non-positive and the amount of heldMarket is non-negative.
     */
    function calculateMaxLiquidationAmount(
        LiquidatorWithAmmCache memory cache
    )
    private
    pure
    {
        uint liquidHeldValue = cache.heldPrice.mul(cache.liquidHeldWei.value);
        uint liquidOwedValue = cache.owedPriceAdj.mul(cache.liquidOwedWei.value);
        if (liquidHeldValue <= liquidOwedValue) {
            // The user is under-collateralized; there is no reward left to give
            cache.solidHeldUpdateWithReward = cache.liquidHeldWei.value;
            cache.toLiquidate = Math.getPartialRoundUp(cache.liquidHeldWei.value, cache.heldPrice, cache.owedPriceAdj);
        } else {
            cache.solidHeldUpdateWithReward = Math.getPartial(cache.liquidOwedWei.value, cache.owedPriceAdj, cache.heldPrice);
            cache.toLiquidate = cache.liquidOwedWei.value;
        }
    }

    // ============ Helper Functions ============

    /**
     * Make some basic checks before attempting to liquidate an account.
     *  - Require that the msg.sender is permissioned to use the liquidator account
     *  - Require that the liquid account is liquidatable based on the accounts global value (all assets held and owed,
     *    not just what's being liquidated)
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
            || DOLOMITE_MARGIN.getIsLocalOperator(constants.solidAccount.owner, msg.sender),
            FILE,
            "Sender not operator",
            constants.solidAccount.owner
        );

        // require that the liquidAccount is liquidatable
        (
        Monetary.Value memory liquidSupplyValue,
        Monetary.Value memory liquidBorrowValue
        ) = getCurrentAccountValues(constants, constants.liquidAccount);
        Require.that(
            liquidSupplyValue.value != 0,
            FILE,
            "Liquid account no supply"
        );
        Require.that(
            DOLOMITE_MARGIN.getAccountStatus(constants.liquidAccount) == Account.Status.Liquid ||
            !isCollateralized(liquidSupplyValue.value, liquidBorrowValue.value, DOLOMITE_MARGIN.getMarginRatio()),
            FILE,
            "Liquid account not liquidatable"
        );
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
    returns (bool)
    {
        uint256 requiredMargin = Decimal.mul(borrowValue, ratio);
        return supplyValue >= borrowValue.add(requiredMargin);
    }

    // ============ Getter Functions ============

    /**
     * Gets the current total supplyValue and borrowValue for some account. Takes into account what
     * the current index will be once updated.
     */
    function getCurrentAccountValues(
        Constants memory constants,
        Account.Info memory account
    )
    private
    view
    returns (
        Monetary.Value memory,
        Monetary.Value memory
    )
    {
        Monetary.Value memory supplyValue;
        Monetary.Value memory borrowValue;

        for (uint256 m = 0; m < constants.markets.length; m++) {
            Types.Par memory par = DOLOMITE_MARGIN.getAccountPar(account, m);
            if (par.isZero()) {
                continue;
            }
            Types.Wei memory userWei = Interest.parToWei(par, constants.markets[m].index);
            uint256 assetValue = userWei.value.mul(constants.markets[m].price.value);
            if (userWei.sign) {
                supplyValue.value = supplyValue.value.add(assetValue);
            } else {
                borrowValue.value = borrowValue.value.add(assetValue);
            }
        }

        return (supplyValue, borrowValue);
    }

    /**
     * Get the updated index and price for every market.
     */
    function getMarketsInfo()
    private
    view
    returns (MarketInfo[] memory)
    {
        uint256 numMarkets = DOLOMITE_MARGIN.getNumMarkets();
        MarketInfo[] memory markets = new MarketInfo[](numMarkets);
        for (uint256 m = 0; m < numMarkets; m++) {
            markets[m] = MarketInfo({
            price : DOLOMITE_MARGIN.getMarketPrice(m),
            index : DOLOMITE_MARGIN.getMarketCurrentIndex(m)
            });
        }
        return markets;
    }

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
    returns (LiquidatorWithAmmCache memory)
    {
        uint256 heldPrice = constants.markets[heldMarket].price.value;
        uint256 owedPrice = constants.markets[owedMarket].price.value;

        uint256 owedPriceAdj;
        if (constants.expiry > 0) {
            (, Monetary.Price memory owedPricePrice) = constants.EXPIRY_PROXY.getSpreadAdjustedPrices(
                heldMarket,
                owedMarket,
                constants.expiry
            );
            owedPriceAdj = owedPricePrice.value;
        } else {
            owedPriceAdj = Decimal.mul(
                owedPrice,
                Decimal.onePlus(DOLOMITE_MARGIN.getLiquidationSpreadForPair(heldMarket, owedMarket))
            );
        }

        return LiquidatorWithAmmCache({
        toLiquidate : 0,
        solidHeldUpdateWithReward : 0,
        solidHeldWei : Interest.parToWei(
                DOLOMITE_MARGIN.getAccountPar(constants.solidAccount, heldMarket),
                constants.markets[heldMarket].index
            ),
        liquidHeldWei : Interest.parToWei(
                DOLOMITE_MARGIN.getAccountPar(constants.liquidAccount, heldMarket),
                constants.markets[heldMarket].index
            ),
        liquidOwedWei : Interest.parToWei(
                DOLOMITE_MARGIN.getAccountPar(constants.liquidAccount, owedMarket),
                constants.markets[owedMarket].index
            ),
        heldMarket : heldMarket,
        owedMarket : owedMarket,
        heldPrice : heldPrice,
        owedPrice : owedPrice,
        owedPriceAdj : owedPriceAdj
        });
    }

    // ============ Operation-Construction Functions ============

    function constructAccountsArray(
        Constants memory constants,
        Account.Info[] memory accountsForTrade
    )
    private
    pure
    returns (Account.Info[] memory)
    {
        Account.Info[] memory accounts = new Account.Info[](accountsForTrade.length + 1);
        for (uint i = 0; i < accountsForTrade.length; i++) {
            accounts[i] = accountsForTrade[i];
        }
        assert(
            accounts[0].owner == constants.solidAccount.owner &&
            accounts[0].number == constants.solidAccount.number
        );

        accounts[accounts.length - 1] = constants.liquidAccount;
        return accounts;
    }

    function constructActionsArray(
        Constants memory constants,
        LiquidatorWithAmmCache memory cache,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actionsForTrade
    )
    private
    pure
    returns (Actions.ActionArgs[] memory)
    {
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](actionsForTrade.length + 1);

        if (constants.expiry > 0) {
            // First action is a trade for closing the expired account
            actions[0] = Actions.ActionArgs({
            actionType : Actions.ActionType.Trade,
            accountId : 0, // solidAccount
            amount : Types.AssetAmount({
            sign : true,
            denomination : Types.AssetDenomination.Wei,
            ref : Types.AssetReference.Delta,
            value : cache.toLiquidate
            }),
            primaryMarketId : cache.owedMarket,
            secondaryMarketId : cache.heldMarket,
            otherAddress : address(constants.EXPIRY_PROXY),
            otherAccountId : accounts.length - 1, // liquidAccount
            data : abi.encode(cache.owedMarket, constants.expiry)
            });
        } else {
            // First action is a liquidation
            actions[0] = Actions.ActionArgs({
            actionType : Actions.ActionType.Liquidate,
            accountId : 0, // solidAccount
            amount : Types.AssetAmount({
            sign : true,
            denomination : Types.AssetDenomination.Wei,
            ref : Types.AssetReference.Delta,
            value : cache.toLiquidate
            }),
            primaryMarketId : cache.owedMarket,
            secondaryMarketId : cache.heldMarket,
            otherAddress : address(0),
            otherAccountId : accounts.length - 1, // liquidAccount
            data : new bytes(0)
            });
        }

        for (uint i = 0; i < actionsForTrade.length; i++) {
            actions[i + 1] = actionsForTrade[i];
        }

        return actions;
    }
}
