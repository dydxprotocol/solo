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

import { IERC20Detailed } from "../interfaces/IERC20Detailed.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { IRecyclable } from "../interfaces/IRecyclable.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title AdminImpl
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
library AdminImpl {
    using Math for uint256;
    using Storage for Storage.State;
    using Token for address;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "AdminImpl";

    uint256 constant HEAD_POINTER = uint(-1);

    uint256 constant ONE_WEEK = 86400 * 7;

    // ============ Events ============

    event LogWithdrawExcessTokens(
        address token,
        uint256 amount
    );

    event LogWithdrawUnsupportedTokens(
        address token,
        uint256 amount
    );

    event LogAddMarket(
        uint256 marketId,
        address token
    );

    event LogRemoveMarket(
        uint256 marketId,
        address token
    );

    event LogSetIsClosing(
        uint256 marketId,
        bool isClosing
    );

    event LogSetPriceOracle(
        uint256 marketId,
        address priceOracle
    );

    event LogSetInterestSetter(
        uint256 marketId,
        address interestSetter
    );

    event LogSetMarginPremium(
        uint256 marketId,
        Decimal.D256 marginPremium
    );

    event LogSetSpreadPremium(
        uint256 marketId,
        Decimal.D256 spreadPremium
    );

    event LogSetMaxWei(
        uint256 marketId,
        Types.Wei maxWei
    );

    event LogSetMarginRatio(
        Decimal.D256 marginRatio
    );

    event LogSetLiquidationSpread(
        Decimal.D256 liquidationSpread
    );

    event LogSetEarningsRate(
        Decimal.D256 earningsRate
    );

    event LogSetMinBorrowedValue(
        Monetary.Value minBorrowedValue
    );

    event LogSetAccountMaxNumberOfMarketsWithBalances(
        uint256 accountMaxNumberOfMarketsWithBalances
    );

    event LogSetGlobalOperator(
        address operator,
        bool approved
    );

    event LogSetAutoTraderIsSpecial(
        address autoTrader,
        bool isSpecial
    );

    // ============ Token Functions ============

    function ownerWithdrawExcessTokens(
        Storage.State storage state,
        uint256 marketId,
        address recipient
    )
    public
    returns (uint256)
    {
        _validateMarketId(state, marketId);
        Types.Wei memory excessWei = state.getNumExcessTokens(marketId);

        Require.that(
            !excessWei.isNegative(),
            FILE,
            "Negative excess"
        );

        address token = state.getToken(marketId);

        uint256 actualBalance = IERC20Detailed(token).balanceOf(address(this));
        if (excessWei.value > actualBalance) {
            excessWei.value = actualBalance;
        }

        token.transfer(recipient, excessWei.value);

        emit LogWithdrawExcessTokens(token, excessWei.value);

        return excessWei.value;
    }

    function ownerWithdrawUnsupportedTokens(
        Storage.State storage state,
        address token,
        address recipient
    )
    public
    returns (uint256)
    {
        _requireNoMarket(state, token);

        uint256 balance = IERC20Detailed(token).balanceOf(address(this));
        token.transfer(recipient, balance);

        emit LogWithdrawUnsupportedTokens(token, balance);

        return balance;
    }

    // ============ Market Functions ============

    function ownerAddMarket(
        Storage.State storage state,
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter,
        Decimal.D256 memory marginPremium,
        Decimal.D256 memory spreadPremium,
        uint256 maxWei,
        bool isClosing,
        bool isRecyclable
    )
    public
    {
        _requireNoMarket(state, token);

        uint256 marketId = state.recycledMarketIds[HEAD_POINTER];
        if (marketId == 0) {
            // we can't recycle a marketId, so we get a new ID and increment the number of markets
            marketId = state.numMarkets;
            state.numMarkets++;
        } else {
            // we successfully recycled the market ID.
            // reset the head pointer to the next item in the linked list
            state.recycledMarketIds[HEAD_POINTER] = state.recycledMarketIds[marketId];
        }

        state.markets[marketId].token = token;
        state.markets[marketId].index = Interest.newIndex();
        state.markets[marketId].isClosing = isClosing;
        state.markets[marketId].isRecyclable = isRecyclable;
        state.tokenToMarketId[token] = marketId;

        emit LogAddMarket(marketId, token);
        if (isClosing) {
            emit LogSetIsClosing(marketId, isClosing);
        }

        _setPriceOracle(state, marketId, priceOracle);
        _setInterestSetter(state, marketId, interestSetter);
        _setMarginPremium(state, marketId, marginPremium);
        _setSpreadPremium(state, marketId, spreadPremium);
        _setMaxWei(state, marketId, maxWei);

        if (isRecyclable) {
            IRecyclable(token).initialize();
        }
    }

    function ownerRemoveMarkets(
        Storage.State storage state,
        uint[] memory marketIds,
        address salvager
    )
    public
    {
        for (uint i = 0; i < marketIds.length; i++) {
            address token = state.markets[marketIds[i]].token;
            Require.that(
                token != address(0),
                FILE,
                "market does not exist",
                marketIds[i]
            );
            Require.that(
                state.markets[marketIds[i]].isRecyclable,
                FILE,
                "market is not recyclable",
                marketIds[i]
            );

            (
                Types.Wei memory supplyWei,
                Types.Wei memory borrowWei
            ) = Interest.totalParToWei(state.getTotalPar(marketIds[i]), state.getIndex(marketIds[i]));

            Require.that(
                borrowWei.value == 0,
                FILE,
                "market has active borrows",
                marketIds[i]
            );
            uint expirationTimestamp = IRecyclable(state.getToken(marketIds[i])).MAX_EXPIRATION_TIMESTAMP();
            Require.that(
                expirationTimestamp < block.timestamp,
                FILE,
                "market is not expired",
                marketIds[i],
                expirationTimestamp
            );
            Require.that(
                (expirationTimestamp + ONE_WEEK) < block.timestamp, // give the expiration timestamp a 7-day buffer
                FILE,
                "expiration must pass buffer",
                marketIds[i],
                expirationTimestamp
            );

            Token.transfer(token, salvager, supplyWei.value);

            delete state.markets[marketIds[i]];
            delete state.tokenToMarketId[token];

            uint previousHead = state.recycledMarketIds[HEAD_POINTER];
            state.recycledMarketIds[HEAD_POINTER] = marketIds[i];
            if (previousHead != 0) {
                // marketId=0 is not recyclable so we can assume previousHead == 0 means the null case
                state.recycledMarketIds[marketIds[i]] = previousHead;
            }

            IRecyclable(token).recycle();

            emit LogRemoveMarket(marketIds[i], token);
        }
    }

    function ownerSetIsClosing(
        Storage.State storage state,
        uint256 marketId,
        bool isClosing
    )
    public
    {
        _validateMarketId(state, marketId);

        state.markets[marketId].isClosing = isClosing;
        emit LogSetIsClosing(marketId, isClosing);
    }

    function ownerSetPriceOracle(
        Storage.State storage state,
        uint256 marketId,
        IPriceOracle priceOracle
    )
    public
    {
        _validateMarketId(state, marketId);
        _setPriceOracle(state, marketId, priceOracle);
    }

    function ownerSetInterestSetter(
        Storage.State storage state,
        uint256 marketId,
        IInterestSetter interestSetter
    )
    public
    {
        _validateMarketId(state, marketId);
        _setInterestSetter(state, marketId, interestSetter);
    }

    function ownerSetMarginPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
    public
    {
        _validateMarketId(state, marketId);
        _setMarginPremium(state, marketId, marginPremium);
    }

    function ownerSetSpreadPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
    public
    {
        _validateMarketId(state, marketId);
        _setSpreadPremium(state, marketId, spreadPremium);
    }

    function ownerSetMaxWei(
        Storage.State storage state,
        uint256 marketId,
        uint256 maxWei
    )
    public
    {
        _validateMarketId(state, marketId);
        _setMaxWei(state, marketId, maxWei);
    }

    // ============ Risk Functions ============

    function ownerSetMarginRatio(
        Storage.State storage state,
        Decimal.D256 memory ratio
    )
    public
    {
        Require.that(
            ratio.value <= state.riskLimits.marginRatioMax,
            FILE,
            "Ratio too high"
        );
        Require.that(
            ratio.value > state.riskParams.liquidationSpread.value,
            FILE,
            "Ratio cannot be <= spread"
        );
        state.riskParams.marginRatio = ratio;
        emit LogSetMarginRatio(ratio);
    }

    function ownerSetLiquidationSpread(
        Storage.State storage state,
        Decimal.D256 memory spread
    )
    public
    {
        Require.that(
            spread.value <= state.riskLimits.liquidationSpreadMax,
            FILE,
            "Spread too high"
        );
        Require.that(
            spread.value < state.riskParams.marginRatio.value,
            FILE,
            "Spread cannot be >= ratio"
        );
        state.riskParams.liquidationSpread = spread;
        emit LogSetLiquidationSpread(spread);
    }

    function ownerSetEarningsRate(
        Storage.State storage state,
        Decimal.D256 memory earningsRate
    )
    public
    {
        Require.that(
            earningsRate.value <= state.riskLimits.earningsRateMax,
            FILE,
            "Rate too high"
        );
        state.riskParams.earningsRate = earningsRate;
        emit LogSetEarningsRate(earningsRate);
    }

    function ownerSetMinBorrowedValue(
        Storage.State storage state,
        Monetary.Value memory minBorrowedValue
    )
    public
    {
        Require.that(
            minBorrowedValue.value <= state.riskLimits.minBorrowedValueMax,
            FILE,
            "Value too high"
        );
        state.riskParams.minBorrowedValue = minBorrowedValue;
        emit LogSetMinBorrowedValue(minBorrowedValue);
    }

    function ownerSetAccountMaxNumberOfMarketsWithBalances(
        Storage.State storage state,
        uint256 accountMaxNumberOfMarketsWithBalances
    ) public {
        Require.that(
            accountMaxNumberOfMarketsWithBalances >= 2,
            FILE,
            "Acct MaxNumberOfMarkets too low"
        );
        state.riskParams.accountMaxNumberOfMarketsWithBalances = accountMaxNumberOfMarketsWithBalances;
        emit LogSetAccountMaxNumberOfMarketsWithBalances(accountMaxNumberOfMarketsWithBalances);
    }

    // ============ Global Operator Functions ============

    function ownerSetGlobalOperator(
        Storage.State storage state,
        address operator,
        bool approved
    )
    public
    {
        state.globalOperators[operator] = approved;

        emit LogSetGlobalOperator(operator, approved);
    }

    function ownerSetAutoTraderSpecial(
        Storage.State storage state,
        address autoTrader,
        bool isSpecial
    )
    public
    {
        state.specialAutoTraders[autoTrader] = isSpecial;

        emit LogSetAutoTraderIsSpecial(autoTrader, isSpecial);
    }

    // ============ Private Functions ============

    function _setPriceOracle(
        Storage.State storage state,
        uint256 marketId,
        IPriceOracle priceOracle
    )
    private
    {
        // require oracle can return non-zero price
        address token = state.markets[marketId].token;

        Require.that(
            priceOracle.getPrice(token).value != 0,
            FILE,
            "Invalid oracle price"
        );

        state.markets[marketId].priceOracle = priceOracle;

        emit LogSetPriceOracle(marketId, address(priceOracle));
    }

    function _setInterestSetter(
        Storage.State storage state,
        uint256 marketId,
        IInterestSetter interestSetter
    )
    private
    {
        // ensure interestSetter can return a value without reverting
        address token = state.markets[marketId].token;
        interestSetter.getInterestRate(token, 0, 0);

        state.markets[marketId].interestSetter = interestSetter;

        emit LogSetInterestSetter(marketId, address(interestSetter));
    }

    function _setMarginPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
    private
    {
        Require.that(
            marginPremium.value <= state.riskLimits.marginPremiumMax,
            FILE,
            "Margin premium too high"
        );
        state.markets[marketId].marginPremium = marginPremium;

        emit LogSetMarginPremium(marketId, marginPremium);
    }

    function _setSpreadPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
    private
    {
        Require.that(
            spreadPremium.value <= state.riskLimits.spreadPremiumMax,
            FILE,
            "Spread premium too high"
        );
        state.markets[marketId].spreadPremium = spreadPremium;

        emit LogSetSpreadPremium(marketId, spreadPremium);
    }

    function _setMaxWei(
        Storage.State storage state,
        uint256 marketId,
        uint256 maxWei
    )
    private
    {
        Types.Wei memory maxWeiStruct = Types.Wei(true, maxWei.to128());
        state.markets[marketId].maxWei = maxWeiStruct;

        emit LogSetMaxWei(marketId, maxWeiStruct);
    }

    function _requireNoMarket(
        Storage.State storage state,
        address token
    )
    private
    view
    {
        // not-found case is marketId of 0. 0 is a valid market ID so we need to check market ID 0's token equality.
        uint marketId = state.tokenToMarketId[token];
        bool marketExists = token == state.markets[marketId].token;

        Require.that(
            !marketExists,
            FILE,
            "Market exists"
        );
    }

    function _validateMarketId(
        Storage.State storage state,
        uint256 marketId
    )
    private
    view
    {
        Require.that(
            marketId < state.numMarkets && state.markets[marketId].token != address(0),
            FILE,
            "Invalid market",
            marketId
        );
    }
}
