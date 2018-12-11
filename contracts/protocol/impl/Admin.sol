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

import { Ownable } from "../../tempzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LTypes } from "../lib/LTypes.sol";
import { Storage } from "./Storage.sol";


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
    function ownerBorrowExcessToken(
        address token,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        // TODO
        token;
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
        g_markets[marketId].index = LInterest.newIndex();

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

    function ownerSetMinCollateralRatio(
        LDecimal.Decimal memory minCollateralRatio
    )
        public
        onlyOwner
        nonReentrant
    {
        g_minCollateralRatio = minCollateralRatio;
    }

    function ownerSetSpread(
        LDecimal.Decimal memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        g_liquidationSpread = spread;
    }

    function ownerSetEarningsRate(
        LDecimal.Decimal memory earningsRate
    )
        public
        onlyOwner
        nonReentrant
    {
        g_earningsRate = earningsRate;
    }

    function ownerSetMinBorrowedValue(
        LPrice.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {
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
        LInterest.TotalNominal memory zero;
        address token = g_markets[market].token;
        require(LInterest.isValidRate(interestSetter.getInterestRate(token, zero)),
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
        require(priceOracle.getPrice(token).value != 0, "INVALID ORACLE PRICE");
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
