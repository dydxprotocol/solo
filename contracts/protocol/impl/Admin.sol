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
import { Storage } from "./Storage.sol";
import { WorldManager } from "./WorldManager.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
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
    WorldManager
{
    uint256 constant MAX_LIQUIDATION_RATIO  = 200 * 10**16; // 200%
    uint256 constant MIN_LIQUIDATION_RATIO  = 110 * 10**16; // 100%
    uint256 constant MAX_LIQUIDATION_SPREAD =  15 * 10**16; // 15%
    uint256 constant MIN_LIQUIDATION_SPREAD =   1 * 10**16; // 1%
    uint256 constant MIN_EARNINGS_RATE      =  50 * 10**16; // 50%
    uint256 constant MAX_EARNINGS_RATE      = 100 * 10**16; // 100%
    uint256 constant MAX_MIN_BORROWED_VALUE =       10**18; // $1

    function ownerWithdrawExcessTokens(
        uint256 marketId,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        WorldState memory worldState = wsInitializeEmpty();
        Interest.Index memory index = wsGetIndex(worldState, marketId);
        g_markets[marketId].index = index;

        Types.TotalPar memory totalPar = g_markets[marketId].totalPar;

        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = Interest.totalParToWei(totalPar, index);

        address token = g_markets[marketId].token;
        uint256 balance = Token.balanceOf(token, address(this));

        uint256 positiveTokens = balance.add(borrowWei.value);
        uint256 negativeTokens = supplyWei.value;

        require(
            positiveTokens >= negativeTokens,
            "TODO_REASON"
        );

        uint256 tokensToWithdraw = positiveTokens.sub(negativeTokens);
        Token.transfer(token, recipient, tokensToWithdraw);
        return tokensToWithdraw;
    }

    function ownerWithdrawAirdroppedTokens(
        address token,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        require(
            !_marketExistsForToken(token),
            "TODO_REASON"
        );

        uint256 balance = Token.balanceOf(token, address(this));
        Token.transfer(token, recipient, balance);
        return balance;
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
        require(
            !_marketExistsForToken(token),
            "TODO_REASON"
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
        Decimal.D256 memory liquidationRatio
    )
        public
        onlyOwner
        nonReentrant
    {
        require(
            liquidationRatio.value <= MAX_LIQUIDATION_RATIO,
            "TODO_REASON"
        );
        require(
            liquidationRatio.value >= MIN_LIQUIDATION_RATIO,
            "TODO_REASON"
        );
        g_liquidationRatio = liquidationRatio;
    }

    function ownerSetLiquidationSpread(
        Decimal.D256 memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        require(
            spread.value <= MAX_LIQUIDATION_SPREAD,
            "TODO_REASON"
        );
        require(
            spread.value >= MIN_LIQUIDATION_SPREAD,
            "TODO_REASON"
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
        require(
            earningsRate.value <= MAX_EARNINGS_RATE,
            "TODO_REASON"
        );
        require(
            earningsRate.value >= MIN_EARNINGS_RATE,
            "TODO_REASON"
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
        require(
            minBorrowedValue.value <= MAX_MIN_BORROWED_VALUE,
            "TODO_REASON"
        );
        g_minBorrowedValue = minBorrowedValue;
    }

    // ============ Internal Functions ============

    function _setInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        private
    {
        g_markets[marketId].interestSetter = interestSetter;

        // require current interestSetter can return a value
        address token = g_markets[marketId].token;
        require(
            Interest.isValidRate(interestSetter.getInterestRate(token, 0, 0)),
            "INVALID INTEREST VALUE"
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
        require(
            marketId < g_numMarkets,
            "TODO_REASON"
        );
    }
}
