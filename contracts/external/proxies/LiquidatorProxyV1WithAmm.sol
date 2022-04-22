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
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";

import { LiquidatorProxyHelper } from "../helpers/LiquidatorProxyHelper.sol";
import { IExpiry } from "../interfaces/IExpiry.sol";

import { DolomiteAmmRouterProxy } from "./DolomiteAmmRouterProxy.sol";


/**
 * @title LiquidatorProxyV1WithAmm
 * @author Dolomite
 *
 * Contract for liquidating other accounts in DolomiteMargin and atomically selling off collateral via Dolomite AMM
 * markets.
 */
contract LiquidatorProxyV1WithAmm is ReentrancyGuard, LiquidatorProxyHelper {
    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidatorProxyV1WithAmm";

    // ============ Structs ============

    struct Constants {
        IDolomiteMargin dolomiteMargin;
        Account.Info solidAccount;
        Account.Info liquidAccount;
        MarketInfo[] markets;
        uint256[] liquidMarkets;
        IExpiry expiryProxy;
        uint32 expiry;
    }

    struct LiquidatorProxyWithAmmCache {
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

    // ============ Events ============

    /**
     * @param solidAccountOwner         The liquidator's address
     * @param solidAccountOwner         The liquidator's account number
     * @param heldMarket                The held market (collateral) that will be received by the liquidator
     * @param heldDeltaWeiWithReward    The amount of heldMarket the liquidator will receive, including the reward
     *                                  (positive number)
     * @param profitHeldWei             The amount of profit the liquidator will realize by performing the liquidation
     *                                  and atomically selling off the collateral. Can be negative or positive.
     * @param owedMarket                The debt market that will be received by the liquidator
     * @param owedDeltaWei              The amount of owedMarket that will be received by the liquidator (negative
     *                                  number)
     */
    event LogLiquidateWithAmm(
        address indexed solidAccountOwner,
        uint solidAccountNumber,
        uint heldMarket,
        uint heldDeltaWeiWithReward,
        Types.Wei profitHeldWei, // calculated as `heldWeiWithReward - soldHeldWeiToBreakEven`
        uint owedMarket,
        uint owedDeltaWei
    );

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
     * @param  minOwedOutputAmount          The minimum amount that should be outputted by the trade from heldWei to
     *                                      owedWei. Used to prevent sandwiching and mem-pool other attacks. Only used
     *                                      if `revertOnFailToSellCollateral` is set to `false` and the collateral
     *                                      cannot cover the `liquidAccount`'s debt.
     * @param  revertOnFailToSellCollateral True to revert the transaction completely if all collateral from the
     *                                      liquidation cannot repay the owed debt. False to swallow the error and sell
     *                                      whatever is possible. If set to false, the liquidator must have sufficient
     *                                      assets to be prevent becoming liquidated or under-collateralized.
     */
    function liquidate(
        Account.Info memory solidAccount,
        Account.Info memory liquidAccount,
        uint256 owedMarket,
        uint256 heldMarket,
        address[] memory tokenPath,
        uint expiry,
        uint minOwedOutputAmount,
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
            uint32(expiry) == expiry,
            FILE,
            "expiry overflow",
            expiry
        );

        // put all values that will not change into a single struct
        Constants memory constants;
        constants.dolomiteMargin = DOLOMITE_MARGIN;
        constants.solidAccount = solidAccount;
        constants.liquidAccount = liquidAccount;
        constants.liquidMarkets = constants.dolomiteMargin.getAccountMarketsWithBalances(liquidAccount);
        constants.markets = getMarketInfos(
            constants.dolomiteMargin,
            constants.dolomiteMargin.getAccountMarketsWithBalances(solidAccount),
            constants.liquidMarkets
        );
        constants.expiryProxy = expiry > 0 ? EXPIRY_PROXY: IExpiry(address(0));
        constants.expiry = uint32(expiry);

        LiquidatorProxyWithAmmCache memory cache = initializeCache(
            constants,
            heldMarket,
            owedMarket
        );

        // validate the msg.sender and that the liquidAccount can be liquidated
        checkRequirements(
            constants,
            heldMarket,
            owedMarket,
            tokenPath
        );

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
            // We do this so we can accurately track how much the solid account has (and will have after the swap), in
            // case we need to input it exactly to Router#getParamsForSwapExactTokensForTokens
            totalSolidHeldWei = totalSolidHeldWei.add(cache.solidHeldWei.value);
        }

        (
            Account.Info[] memory accounts,
            Actions.ActionArgs[] memory actions
        ) = ROUTER_PROXY.getParamsForSwapTokensForExactTokens(
            constants.solidAccount.owner,
            constants.solidAccount.number,
            uint(- 1), // maxInputWei
            cache.toLiquidate, // the amount of owedMarket that needs to be repaid. Exact output amount
            tokenPath
        );

        if (cache.solidHeldUpdateWithReward >= actions[0].amount.value) {
            uint profit = cache.solidHeldUpdateWithReward.sub(actions[0].amount.value);
            uint _owedMarket = owedMarket; // used to prevent the "stack too deep" error
            emit LogLiquidateWithAmm(
                constants.solidAccount.owner,
                constants.solidAccount.number,
                heldMarket,
                cache.solidHeldUpdateWithReward,
                Types.Wei(true, profit),
                _owedMarket,
                cache.toLiquidate
            );
        } else {
            Require.that(
                !revertOnFailToSellCollateral,
                FILE,
                "totalSolidHeldWei is too small",
                totalSolidHeldWei,
                actions[0].amount.value
            );

            // This value needs to be calculated before `actions` is overwritten below with the new swap parameters
            uint profit = actions[0].amount.value.sub(cache.solidHeldUpdateWithReward);
            (accounts, actions) = ROUTER_PROXY.getParamsForSwapExactTokensForTokens(
                constants.solidAccount.owner,
                constants.solidAccount.number,
                totalSolidHeldWei, // inputWei
                minOwedOutputAmount,
                tokenPath
            );

            uint _owedMarket = owedMarket; // used to prevent the "stack too deep" error
            emit LogLiquidateWithAmm(
                constants.solidAccount.owner,
                constants.solidAccount.number,
                heldMarket,
                cache.solidHeldUpdateWithReward,
                Types.Wei(false, profit),
                _owedMarket,
                cache.toLiquidate
            );
        }

        accounts = constructAccountsArray(constants, accounts);

        // execute the liquidations
        constants.dolomiteMargin.operate(
            accounts,
            constructActionsArray(constants, cache, accounts, actions) //solium-disable-line arg-overflow
        );
    }

    // ============ Calculation Functions ============

    /**
     * Calculate the additional owedAmount that can be liquidated until the collateralization of the
     * liquidator account reaches the minLiquidatorRatio. By this point, the cache will be set such
     * that the amount of owedMarket is non-positive and the amount of heldMarket is non-negative.
     */
    function calculateMaxLiquidationAmount(
        LiquidatorProxyWithAmmCache memory cache
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
            cache.solidHeldUpdateWithReward = Math.getPartial(
                cache.liquidOwedWei.value,
                cache.owedPriceAdj,
                cache.heldPrice
            );
            cache.toLiquidate = cache.liquidOwedWei.value;
        }
    }

    // ============ Helper Functions ============

    /**
     * Make some basic checks before attempting to liquidate an account.
     *  - Require that the msg.sender has the permission to use the liquidator account
     *  - Require that the liquid account is liquidatable based on the accounts global value (all assets held and owed,
     *    not just what's being liquidated)
     */
    function checkRequirements(
        Constants memory constants,
        uint256 heldMarket,
        uint256 owedMarket,
        address[] memory tokenPath
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

        Require.that(
            constants.dolomiteMargin.getMarketIdByTokenAddress(tokenPath[0]) == heldMarket,
            FILE,
            "0-index token path incorrect",
            tokenPath[0]
        );

        Require.that(
            constants.dolomiteMargin.getMarketIdByTokenAddress(tokenPath[tokenPath.length - 1]) == owedMarket,
            FILE,
            "last-index token path incorrect",
            tokenPath[tokenPath.length - 1]
        );

        if (constants.expiry == 0) {
            // user is getting liquidated, not expired. Check liquid account is indeed liquid
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
                "Liquid account not liquidatable"
            );
        } else {
            // check the expiration is valid; to get here we already know constants.expiry != 0
            uint expiry = constants.expiryProxy.getExpiry(constants.liquidAccount, owedMarket);
            Require.that(
                expiry == constants.expiry,
                FILE,
                "expiry mismatch",
                expiry,
                constants.expiry
            );
            Require.that(
                expiry <= Time.currentTime(),
                FILE,
                "Borrow not yet expired",
                expiry
            );
        }
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
     * Pre-populates cache values for some pair of markets.
     */
    function initializeCache(
        Constants memory constants,
        uint256 heldMarket,
        uint256 owedMarket
    )
    private
    view
    returns (LiquidatorProxyWithAmmCache memory)
    {
        MarketInfo memory heldMarketInfo = binarySearch(constants.markets, heldMarket);
        MarketInfo memory owedMarketInfo = binarySearch(constants.markets, owedMarket);
        uint256 heldPrice = heldMarketInfo.price.value;
        uint256 owedPrice = owedMarketInfo.price.value;

        uint256 owedPriceAdj;
        if (constants.expiry > 0) {
            (, Monetary.Price memory owedPricePrice) = constants.expiryProxy.getSpreadAdjustedPrices(
                heldMarket,
                owedMarket,
                constants.expiry
            );
            owedPriceAdj = owedPricePrice.value;
        } else {
            owedPriceAdj = Decimal.mul(
                owedPrice,
                Decimal.onePlus(constants.dolomiteMargin.getLiquidationSpreadForPair(heldMarket, owedMarket))
            );
        }

        return LiquidatorProxyWithAmmCache({
            toLiquidate: 0,
            solidHeldUpdateWithReward: 0,
            solidHeldWei: Interest.parToWei(
                constants.dolomiteMargin.getAccountPar(constants.solidAccount, heldMarket),
                heldMarketInfo.index
            ),
            liquidHeldWei: Interest.parToWei(
                constants.dolomiteMargin.getAccountPar(constants.liquidAccount, heldMarket),
                heldMarketInfo.index
            ),
            liquidOwedWei: Interest.parToWei(
                constants.dolomiteMargin.getAccountPar(constants.liquidAccount, owedMarket),
                owedMarketInfo.index
            ),
            heldMarket: heldMarket,
            owedMarket: owedMarket,
            heldPrice: heldPrice,
            owedPrice: owedPrice,
            owedPriceAdj: owedPriceAdj
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
        LiquidatorProxyWithAmmCache memory cache,
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
            // accountId is solidAccount; otherAccountId is liquidAccount
            actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Trade,
            accountId: 0,
            amount: Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: cache.toLiquidate
            }),
            primaryMarketId: cache.owedMarket,
            secondaryMarketId: cache.heldMarket,
            otherAddress: address(constants.expiryProxy),
            otherAccountId: accounts.length - 1,
            data: abi.encode(cache.owedMarket, constants.expiry)
            });
        } else {
            // First action is a liquidation
            // accountId is solidAccount; otherAccountId is liquidAccount
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
            otherAccountId: accounts.length - 1,
            data: new bytes(0)
            });
        }

        for (uint i = 0; i < actionsForTrade.length; i++) {
            actions[i + 1] = actionsForTrade[i];
        }

        return actions;
    }
}
