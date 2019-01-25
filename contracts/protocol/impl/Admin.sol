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

    uint256 constant MAX_LIQUIDATION_RATIO  = 200 * 10**16; // 200%
    uint256 constant DEF_LIQUIDATION_RATIO  = 125 * 10**16; // 125%
    uint256 constant MIN_LIQUIDATION_RATIO  = 110 * 10**16; // 110%

    uint256 constant MAX_LIQUIDATION_SPREAD = 115 * 10**16; // 115%
    uint256 constant DEF_LIQUIDATION_SPREAD = 105 * 10**16; // 105%
    uint256 constant MIN_LIQUIDATION_SPREAD = 101 * 10**16; // 101%

    uint256 constant MIN_EARNINGS_RATE      =  50 * 10**16; // 50%
    uint256 constant DEF_EARNINGS_RATE      =  50 * 10**16; // 90%
    uint256 constant MAX_EARNINGS_RATE      = 100 * 10**16; // 100%

    uint256 constant MAX_MIN_BORROWED_VALUE = 100 * 10**18; // $100
    uint256 constant DEF_MIN_BORROWED_VALUE = 100 * 10**18; // $5
    uint256 constant MIN_MIN_BORROWED_VALUE =   1 * 10**18; // $1

    // ============ Constructor ============

    constructor()
        public
    {
        g_liquidationRatio =  Decimal.D256({ value: DEF_LIQUIDATION_RATIO });
        g_liquidationSpread = Decimal.D256({ value: DEF_LIQUIDATION_SPREAD });
        g_earningsRate =      Decimal.D256({ value: DEF_EARNINGS_RATE });
        g_minBorrowedValue =  Monetary.Value({ value: DEF_MIN_BORROWED_VALUE });
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
        Require.that(
            !_marketExistsForToken(token),
            FILE,
            "Market exists"
        );

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
        Require.that(
            !_marketExistsForToken(token),
            FILE,
            "Market exists"
        );

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
            Interest.isValidRate(interestSetter.getInterestRate(token, 0, 0)),
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

    function _marketExistsForToken(
        address token
    )
        private
        view
        returns (bool)
    {
        uint256 numMarkets = g_numMarkets;

        for (uint256 m = 0; m < numMarkets; m++) {
            if (g_markets[m].token == token) {
                return true;
            }
        }

        return false;
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
            "Market out-of-bounds",
            marketId
        );
    }
}
