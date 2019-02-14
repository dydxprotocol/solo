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

pragma solidity 0.5.4;
pragma experimental ABIEncoderV2;

import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Interest } from "../lib/Interest.sol";
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
    using Storage for Storage.State;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "AdminImpl";

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
            excessWei.isPositive(),
            FILE,
            "No excess tokens"
        );

        uint256 actualBalance = Token.balanceOf(state.getToken(marketId), address(this));
        if (excessWei.value > actualBalance) {
            excessWei.value = actualBalance;
        }

        Exchange.transferOut(
            state.getToken(marketId),
            recipient,
            excessWei
        );
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

        uint256 balance = Token.balanceOf(token, address(this));
        Token.transfer(token, recipient, balance);
        return balance;
    }

    // ============ Market Functions ============

    function ownerAddMarket(
        Storage.State storage state,
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter
    )
        public
    {
        _requireNoMarket(state, token);

        uint256 marketId = state.numMarkets;

        state.numMarkets++;
        state.markets[marketId].token = token;
        state.markets[marketId].index = Interest.newIndex();

        _setPriceOracle(state, marketId, priceOracle);
        _setInterestSetter(state, marketId, interestSetter);
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

    // ============ Risk Functions ============

    function ownerSetLiquidationRatio(
        Storage.State storage state,
        Decimal.D256 memory ratio
    )
        public
    {
        Require.that(
            ratio.value <= state.riskLimits.liquidationRatioMax,
            FILE,
            "Ratio too high"
        );
        Require.that(
            ratio.value >= state.riskLimits.liquidationRatioMin,
            FILE,
            "Ratio too low"
        );
        Require.that(
            ratio.value > state.riskParams.liquidationSpread.value,
            FILE,
            "Ratio higher than spread"
        );
        state.riskParams.liquidationRatio = ratio;
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
            spread.value >= state.riskLimits.liquidationSpreadMin,
            FILE,
            "Spread too low"
        );
        Require.that(
            spread.value < state.riskParams.liquidationRatio.value,
            FILE,
            "Spread lower than ratio"
        );
        state.riskParams.liquidationSpread = spread;
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
        Require.that(
            earningsRate.value >= state.riskLimits.earningsRateMin,
            FILE,
            "Rate too low"
        );
        state.riskParams.earningsRate = earningsRate;
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
        Require.that(
            minBorrowedValue.value >= state.riskLimits.minBorrowedValueMin,
            FILE,
            "Value too low"
        );
        state.riskParams.minBorrowedValue = minBorrowedValue;
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
    }

    // ============ Private Functions ============

    function _setInterestSetter(
        Storage.State storage state,
        uint256 marketId,
        IInterestSetter interestSetter
    )
        private
    {
        state.markets[marketId].interestSetter = interestSetter;

        // require current interestSetter can return a value
        address token = state.markets[marketId].token;

        Require.that(
            interestSetter.getInterestRate(token, 0, 0).value <= state.riskLimits.interestRateMax,
            FILE,
            "Invalid interest rate"
        );
    }

    function _setPriceOracle(
        Storage.State storage state,
        uint256 marketId,
        IPriceOracle priceOracle
    )
        private
    {
        state.markets[marketId].priceOracle = priceOracle;

        // require oracle can return value for token
        address token = state.markets[marketId].token;

        Require.that(
            priceOracle.getPrice(token).value != 0,
            FILE,
            "Invalid oracle price"
        );
    }

    function _requireNoMarket(
        Storage.State storage state,
        address token
    )
        private
        view
    {
        uint256 numMarkets = state.numMarkets;

        bool marketExists = false;

        for (uint256 m = 0; m < numMarkets; m++) {
            if (state.markets[m].token == token) {
                marketExists = true;
                break;
            }
        }

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
            marketId < state.numMarkets,
            FILE,
            "Market OOB",
            marketId
        );
    }
}
