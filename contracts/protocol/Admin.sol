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

import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { State } from "./State.sol";
import { AdminImpl } from "./impl/AdminImpl.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { Decimal } from "./lib/Decimal.sol";
import { Interest } from "./lib/Interest.sol";
import { Monetary } from "./lib/Monetary.sol";
import { Token } from "./lib/Token.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Public functions that allow the privileged owner address to manage DolomiteMargin
 */
contract Admin is
    State,
    Ownable,
    ReentrancyGuard
{
    // ============ Token Functions ============

    /**
     * Withdraw an ERC20 token for which there is an associated market. Only excess tokens can be withdrawn. The number
     * of excess tokens is calculated by taking the current number of tokens held in DolomiteMargin, adding the number
     * of tokens owed to DolomiteMargin by borrowers, and subtracting the number of tokens owed to suppliers by
     * DolomiteMargin.
     */
    function ownerWithdrawExcessTokens(
        uint256 marketId,
        address recipient
    )
        public
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        return AdminImpl.ownerWithdrawExcessTokens(
            g_state,
            marketId,
            recipient
        );
    }

    /**
     * Withdraw an ERC20 token for which there is no associated market.
     */
    function ownerWithdrawUnsupportedTokens(
        address token,
        address recipient
    )
        public
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        return AdminImpl.ownerWithdrawUnsupportedTokens(
            g_state,
            token,
            recipient
        );
    }

    // ============ Market Functions ============

    /**
     * Sets the number of non-zero balances an account may have within the same `accountIndex`, if the account has any
     * debt. This ensures a user cannot DOS the system by filling their account with non-zero balances (which linearly
     * increases gas costs when checking collateralization) and disallowing themselves to close the position, because
     * the number of gas units needed to process their transaction exceed the block's gas limit. In turn, this would
     * prevent the user from also being liquidated, causing the all of the capital to be "stuck" in the position.
     */
    function ownerSetAccountMaxNumberOfMarketsWithBalances(
        uint256 accountMaxNumberOfMarketsWithBalances
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetAccountMaxNumberOfMarketsWithBalances(
            g_state,
            accountMaxNumberOfMarketsWithBalances
        );
    }

    /**
     * Add a new market to DolomiteMargin. Must be for a previously-unsupported ERC20 token.
     */
    function ownerAddMarket(
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
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerAddMarket(
            g_state,
            token,
            priceOracle,
            interestSetter,
            marginPremium,
            spreadPremium,
            maxWei,
            isClosing,
            isRecyclable
        );
    }

    /**
     * Removes a market from DolomiteMargin, sends any remaining tokens in this contract to `salvager` and invokes the
     * recyclable callback
     */
    function ownerRemoveMarkets(
        uint[] memory marketIds,
        address salvager
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerRemoveMarkets(
            g_state,
            marketIds,
            salvager
        );
    }

    /**
     * Set (or unset) the status of a market to "closing". The borrowedValue of a market cannot increase while its
     * status is "closing".
     */
    function ownerSetIsClosing(
        uint256 marketId,
        bool isClosing
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetIsClosing(
            g_state,
            marketId,
            isClosing
        );
    }

    /**
     * Set the price oracle for a market.
     */
    function ownerSetPriceOracle(
        uint256 marketId,
        IPriceOracle priceOracle
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetPriceOracle(
            g_state,
            marketId,
            priceOracle
        );
    }

    /**
     * Set the interest-setter for a market.
     */
    function ownerSetInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetInterestSetter(
            g_state,
            marketId,
            interestSetter
        );
    }

    /**
     * Set a premium on the minimum margin-ratio for a market. This makes it so that any positions that include this
     * market require a higher collateralization to avoid being liquidated.
     */
    function ownerSetMarginPremium(
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetMarginPremium(
            g_state,
            marketId,
            marginPremium
        );
    }

    function ownerSetMaxWei(
        uint256 marketId,
        uint256 maxWei
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetMaxWei(
            g_state,
            marketId,
            maxWei
        );
    }

    /**
     * Set a premium on the liquidation spread for a market. This makes it so that any liquidations that include this
     * market have a higher spread than the global default.
     */
    function ownerSetSpreadPremium(
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetSpreadPremium(
            g_state,
            marketId,
            spreadPremium
        );
    }

    // ============ Risk Functions ============

    /**
     * Set the global minimum margin-ratio that every position must maintain to prevent being liquidated.
     */
    function ownerSetMarginRatio(
        Decimal.D256 memory ratio
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetMarginRatio(
            g_state,
            ratio
        );
    }

    /**
     * Set the global liquidation spread. This is the spread between oracle prices that incentivizes the liquidation of
     * risky positions.
     */
    function ownerSetLiquidationSpread(
        Decimal.D256 memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetLiquidationSpread(
            g_state,
            spread
        );
    }

    /**
     * Set the global earnings-rate variable that determines what percentage of the interest paid by borrowers gets
     * passed-on to suppliers.
     */
    function ownerSetEarningsRate(
        Decimal.D256 memory earningsRate
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetEarningsRate(
            g_state,
            earningsRate
        );
    }

    /**
     * Set the global minimum-borrow value which is the minimum value of any new borrow on DolomiteMargin.
     */
    function ownerSetMinBorrowedValue(
        Monetary.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetMinBorrowedValue(
            g_state,
            minBorrowedValue
        );
    }

    // ============ Global Operator Functions ============

    /**
     * Approve (or disapprove) an address that is permissioned to be an operator for all accounts in DolomiteMargin.
     * Intended only to approve smart-contracts.
     */
    function ownerSetGlobalOperator(
        address operator,
        bool approved
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetGlobalOperator(
            g_state,
            operator,
            approved
        );
    }

    /**
     * Approve (or disapprove) an auto trader that can only be called by a global operator. IE for expirations
     */
    function ownerSetAutoTraderSpecial(
        address autoTrader,
        bool special
    )
        public
        onlyOwner
        nonReentrant
    {
        AdminImpl.ownerSetAutoTraderSpecial(
            g_state,
            autoTrader,
            special
        );
    }
}
