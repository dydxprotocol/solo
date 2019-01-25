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

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { Manager } from "./Manager.sol";
import { Storage } from "./Storage.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
contract Admin is
    Ownable,
    ReentrancyGuard,
    Storage,
    Manager
{
    // ============ Constants ============

    string constant FILE = "Admin";

    // ============ Structs ============

    struct RiskParameters {
        uint64 MAX_INTEREST_RATE;

        uint64 MAX_LIQUIDATION_RATIO;
        uint64 LIQUIDATION_RATIO;
        uint64 MIN_LIQUIDATION_RATIO;

        uint64 MAX_LIQUIDATION_SPREAD;
        uint64 LIQUIDATION_SPREAD;
        uint64 MIN_LIQUIDATION_SPREAD;

        uint64 MIN_EARNINGS_RATE;
        uint64 EARNINGS_RATE;
        uint64 MAX_EARNINGS_RATE;

        uint128 MAX_MIN_BORROWED_VALUE;
        uint128 MIN_BORROWED_VALUE;
        uint128 MIN_MIN_BORROWED_VALUE;
    }

    // ============ Constructor ============

    constructor(
        RiskParameters memory rp
    )
        public
    {
        MAX_INTEREST_RATE = rp.MAX_INTEREST_RATE;
        MAX_LIQUIDATION_RATIO = rp.MAX_LIQUIDATION_RATIO;
        MIN_LIQUIDATION_RATIO = rp.MIN_LIQUIDATION_RATIO;
        MAX_LIQUIDATION_SPREAD = rp.MAX_LIQUIDATION_SPREAD;
        MIN_LIQUIDATION_SPREAD = rp.MIN_LIQUIDATION_SPREAD;
        MAX_EARNINGS_RATE = rp.MAX_EARNINGS_RATE;
        MIN_EARNINGS_RATE = rp.MIN_EARNINGS_RATE;
        MAX_MIN_BORROWED_VALUE = rp.MAX_MIN_BORROWED_VALUE;
        MIN_MIN_BORROWED_VALUE = rp.MIN_MIN_BORROWED_VALUE;
        g_liquidationRatio =  Decimal.D256({ value: rp.LIQUIDATION_RATIO });
        g_liquidationSpread = Decimal.D256({ value: rp.LIQUIDATION_SPREAD });
        g_earningsRate =      Decimal.D256({ value: rp.EARNINGS_RATE });
        g_minBorrowedValue =  Monetary.Value({ value: rp.MIN_BORROWED_VALUE });
    }

    // ============ Owner-Only Functions ============

    function ownerWithdrawExcessTokens(
        uint256 marketId,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        _validateMarketId(marketId);
        updateIndex(marketId);
        Types.Wei memory excessWei = getNumExcessTokens(marketId);
        Exchange.transferOut(getToken(marketId), recipient, excessWei);
        return excessWei.value;
    }

    function ownerWithdrawUnsupportedTokens(
        address token,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        _requireNoMarket(token);

        uint256 balance = Token.balanceOf(token, address(this));
        Token.transfer(token, recipient, balance);
        return balance;
    }

    function ownerAddMarket(
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        _requireNoMarket(token);

        uint256 marketId = g_numMarkets;

        g_numMarkets++;
        g_markets[marketId].token = token;
        g_markets[marketId].index = Interest.newIndex();

        _setPriceOracle(marketId, priceOracle);
        _setInterestSetter(marketId, interestSetter);
    }

    function ownerSetIsClosing(
        uint256 marketId,
        bool isClosing
    )
        external
        onlyOwner
        nonReentrant
    {
        _validateMarketId(marketId);
        g_markets[marketId].isClosing = isClosing;
    }

    function ownerSetPriceOracle(
        uint256 marketId,
        IPriceOracle priceOracle
    )
        external
        onlyOwner
        nonReentrant
    {
        _validateMarketId(marketId);
        _setPriceOracle(marketId, priceOracle);
    }

    function ownerSetInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        _validateMarketId(marketId);
        _setInterestSetter(marketId, interestSetter);
    }

    function ownerSetLiquidationRatio(
        Decimal.D256 memory ratio
    )
        public
        onlyOwner
        nonReentrant
    {
        Require.that(
            ratio.value <= MAX_LIQUIDATION_RATIO,
            FILE,
            "Ratio too high"
        );
        Require.that(
            ratio.value >= MIN_LIQUIDATION_RATIO,
            FILE,
            "Ratio too low"
        );
        Require.that(
            ratio.value > g_liquidationSpread.value,
            FILE,
            "Ratio higher than spread"
        );
        g_liquidationRatio = ratio;
    }

    function ownerSetLiquidationSpread(
        Decimal.D256 memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        Require.that(
            spread.value <= MAX_LIQUIDATION_SPREAD,
            FILE,
            "Spread too high"
        );
        Require.that(
            spread.value >= MIN_LIQUIDATION_SPREAD,
            FILE,
            "Spread too low"
        );
        Require.that(
            spread.value < g_liquidationRatio.value,
            FILE,
            "Spread lower than ratio"
        );
        g_liquidationSpread = spread;
    }

    function ownerSetEarningsRate(
        Decimal.D256 memory earningsRate
    )
        public
        onlyOwner
        nonReentrant
    {
        Require.that(
            earningsRate.value <= MAX_EARNINGS_RATE,
            FILE,
            "Rate too high"
        );
        Require.that(
            earningsRate.value >= MIN_EARNINGS_RATE,
            FILE,
            "Rate too low"
        );
        g_earningsRate = earningsRate;
    }

    function ownerSetMinBorrowedValue(
        Monetary.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {
        Require.that(
            minBorrowedValue.value <= MAX_MIN_BORROWED_VALUE,
            FILE,
            "Value too high"
        );
        Require.that(
            minBorrowedValue.value >= MIN_MIN_BORROWED_VALUE,
            FILE,
            "Value too low"
        );
        g_minBorrowedValue = minBorrowedValue;
    }

    // ============ Private Functions ============

    function _setInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        private
    {
        g_markets[marketId].interestSetter = interestSetter;

        // require current interestSetter can return a value
        address token = g_markets[marketId].token;

        Require.that(
            Manager.isValidRate(interestSetter.getInterestRate(token, 0, 0)),
            FILE,
            "Invalid interest rate"
        );
    }

    function _setPriceOracle(
        uint256 marketId,
        IPriceOracle priceOracle
    )
        private
    {
        g_markets[marketId].priceOracle = priceOracle;

        // require oracle can return value for token
        address token = g_markets[marketId].token;

        Require.that(
            priceOracle.getPrice(token).value != 0,
            FILE,
            "Invalid oracle price"
        );
    }

    function _requireNoMarket(
        address token
    )
        private
        view
    {
        uint256 numMarkets = g_numMarkets;

        bool marketExists = false;

        for (uint256 m = 0; m < numMarkets; m++) {
            if (g_markets[m].token == token) {
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
        uint256 marketId
    )
        private
        view
    {
        Require.that(
            marketId < g_numMarkets,
            FILE,
            "Market OOB",
            marketId
        );
    }
}
