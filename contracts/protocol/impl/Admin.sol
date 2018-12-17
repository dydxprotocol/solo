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

pragma solidity 0.5.1;
pragma experimental ABIEncoderV2;

import { Storage } from "./Storage.sol";
import { Ownable } from "../../tempzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Price } from "../lib/Price.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
contract Admin is
    Storage,
    Ownable,
    ReentrancyGuard
{
    uint256 constant MAX_LIQUIDATION_RATIO  = 200 * 10**16; // 200%
    uint256 constant MIN_LIQUIDATION_RATIO  = 100 * 10**16; // 100%
    uint256 constant MAX_LIQUIDATION_SPREAD =  15 * 10**16; // 15%
    uint256 constant MIN_LIQUIDATION_SPREAD =   1 * 10**16; // 1%
    uint256 constant MAX_EARNINGS_TAX       =  50 * 10**16; // 50%
    uint256 constant MIN_EARNINGS_TAX       =   0 * 10**16; // 0%
    uint256 constant MAX_MIN_BORROWED_VALUE =       10**18; // $1

    function ownerWithdrawTaxes(
        uint256 marketId,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        // TODO
        marketId;
        recipient;
    }

    function ownerAddToken(
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        require(!_marketExistsForToken(token));

        uint256 marketId = g_numMarkets;

        g_numMarkets++;
        g_markets[marketId].token = token;
        g_markets[marketId].index = Interest.newIndex();

        _setPriceOracle(marketId, priceOracle);
        _setInterestSetter(marketId, interestSetter);
    }

    function ownerSetPriceOracle(
        uint256 market,
        IPriceOracle priceOracle
    )
        external
        onlyOwner
        nonReentrant
    {
        _setPriceOracle(market, priceOracle);
    }

    function ownerSetInterestSetter(
        uint256 market,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        _setInterestSetter(market, interestSetter);
    }

    function ownerSetLiquidationRatio(
        Decimal.Decimal memory liquidationRatio
    )
        public
        onlyOwner
        nonReentrant
    {
        require(liquidationRatio.value <= MAX_LIQUIDATION_RATIO);
        require(liquidationRatio.value >= MIN_LIQUIDATION_RATIO);
        g_liquidationRatio = liquidationRatio;
    }

    function ownerSetLiquidationSpread(
        Decimal.Decimal memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        require(spread.value <= MAX_LIQUIDATION_SPREAD);
        require(spread.value >= MIN_LIQUIDATION_SPREAD);
        g_liquidationSpread = spread;
    }

    function ownerSetEarningsTax(
        Decimal.Decimal memory earningsTax
    )
        public
        onlyOwner
        nonReentrant
    {
        require(earningsTax.value <= MAX_EARNINGS_TAX);
        require(earningsTax.value >= MIN_EARNINGS_TAX);
        g_earningsTax = earningsTax;
    }

    function ownerSetMinBorrowedValue(
        Price.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {
        require(minBorrowedValue.value <= MAX_MIN_BORROWED_VALUE);
        g_minBorrowedValue = minBorrowedValue;
    }

    // ============ Internal Functions ============

    function _setInterestSetter(
        uint256 market,
        IInterestSetter interestSetter
    )
        private
    {
        require(market < g_numMarkets);

        g_markets[market].interestSetter = interestSetter;

        // require current interestSetter can return a value
        Interest.TotalNominal memory zero;
        address token = g_markets[market].token;
        require(Interest.isValidRate(
            interestSetter.getInterestRate(token, zero)),
            "INVALID INTEREST VALUE"
        );
    }

    function _setPriceOracle(
        uint256 market,
        IPriceOracle priceOracle
    )
        private
    {
        require(market < g_numMarkets);

        g_markets[market].priceOracle = priceOracle;

        // require oracle can return value for token
        address token = g_markets[market].token;
        require(
            priceOracle.getPrice(token).value != 0,
            "INVALID ORACLE PRICE"
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

        for (uint256 i = 0; i < numMarkets; i++) {
            if (g_markets[i].token == token) {
                return true;
            }
        }

        return false;
    }
}
