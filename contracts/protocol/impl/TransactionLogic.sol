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

import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LActions } from "../lib/LActions.sol";
import { LMath } from "../lib/LMath.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTime } from "../lib/LTime.sol";
import { LTypes } from "../lib/LTypes.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LToken } from "../lib/LToken.sol";
import { LExchange } from "../lib/LExchange.sol";
import { WorldManager } from "./WorldManager.sol";
import { Storage } from "./Storage.sol";


/**
 * @title TransactionLogic
 * @author dYdX
 *
 * Logic for processing transactions
 */
contract TransactionLogic is
    Storage,
    WorldManager,
    ReentrancyGuard
{
    using LMath for uint256;
    using SafeMath for uint256;
    using SafeMath for uint128;
    using LTime for uint32;

    // ============ Public Functions ============

    function transact(
        AccountInfo[] memory accounts,
        LActions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        WorldState memory worldState = wsInitialize(accounts);

        for (uint256 i = 0; i < args.length; i++) {
            _transact(worldState, args[i]);
        }

        wsStore(worldState);
    }


    // ============ Private Functions ============

    function _transact(
        WorldState memory worldState,
        LActions.TransactionArgs memory args
    )
        private
    {
        LActions.TransactionType ttype = args.transactionType;

        if (ttype == LActions.TransactionType.ExternalTransfer) {
            _externalTransfer(worldState, LActions.parseExternalTransferArgs(args));
        }
        else if (ttype == LActions.TransactionType.InternalTransfer) {
            _internalTransfer(worldState, LActions.parseInternalTransferArgs(args));
        }
        else if (ttype == LActions.TransactionType.Exchange) {
            _exchange(worldState, LActions.parseExchangeArgs(args));
        }
        else if (ttype == LActions.TransactionType.Liquidate) {
            _liquidate(worldState, LActions.parseLiquidateArgs(args));
        }
        else if (ttype == LActions.TransactionType.SetExpiry) {
            _setExpiry(worldState, LActions.parseSetExpiryArgs(args));
        }
    }

    function _externalTransfer(
        WorldState memory worldState,
        LActions.ExternalTransferArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        LTypes.SignedAccrued memory accrued = wsSetBalanceFromAmountStruct(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        address token = wsGetToken(worldState, args.marketId);

        if(args.amount.intent == LActions.AmountIntention.Supply) {
            address depositor = args.otherAddress;
            require(msg.sender == depositor || g_trustedAddress[depositor][msg.sender]);
            LToken.transferIn(token, args.otherAddress, accrued);
        }
        else if (args.amount.intent == LActions.AmountIntention.Borrow) {
            LToken.transferOut(token, args.otherAddress, accrued);
        }
    }

    function _internalTransfer(
        WorldState memory worldState,
        LActions.InternalTransferArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetCheckPerimissions(worldState, args.otherAccountId);

        // Get the values for your account
        LTypes.SignedAccrued memory accrued = wsSetBalanceFromAmountStruct(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        // Get the values for the other account
        LTypes.SignedAccrued memory otherAccrued = accrued.negative();
        wsSetBalanceFromDeltaAccrued(
            worldState,
            args.otherAccountId,
            args.marketId,
            otherAccrued
        );
    }

    function _exchange(
        WorldState memory worldState,
        LActions.ExchangeArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address borrowToken = wsGetToken(worldState, args.borrowMarketId);
        address supplyToken = wsGetToken(worldState, args.supplyMarketId);
        LTypes.SignedAccrued memory supplyAccrued;
        LTypes.SignedAccrued memory borrowAccrued;

        if (args.amount.intent == LActions.AmountIntention.Borrow) {
            borrowAccrued = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.borrowMarketId,
                args.amount
                );

            supplyAccrued = LExchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyAccrued,
                args.orderData
            );

            wsSetBalanceFromDeltaAccrued(
                worldState,
                args.accountId,
                args.supplyMarketId,
                supplyAccrued
            );
        }
        else if (args.amount.intent == LActions.AmountIntention.Supply) {
            supplyAccrued = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.supplyMarketId,
                args.amount
            );

            borrowAccrued = LExchange.getCost(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                borrowAccrued,
                args.orderData
            );

            wsSetBalanceFromDeltaAccrued(
                worldState,
                args.accountId,
                args.borrowMarketId,
                borrowAccrued
            );

            LTypes.SignedAccrued memory tokensReceived = LExchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyAccrued,
                args.orderData
            );

            require(tokensReceived.accrued >= borrowAccrued.accrued);
        }
    }

    function _liquidate(
        WorldState memory worldState,
        LActions.LiquidateArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        // don't mark liquidAccountId for permissions

        LTypes.SignedAccrued memory supplyAccrued;
        LTypes.SignedAccrued memory borrowAccrued;

        // verify that this account can be liquidated
        if (!wsGetClosingTime(worldState, args.liquidAccountId).hasHappened()) {
            require(!_isCollateralized(worldState, args.liquidAccountId));
            wsSetClosingTime(worldState, args.liquidAccountId, LTime.currentTime());
        }

        // normalize the oracle prices according to the liquidation spread
        LPrice.Price memory borrowPrice = wsGetPrice(worldState, args.borrowMarketId);
        LPrice.Price memory supplyPrice = wsGetPrice(worldState, args.supplyMarketId);
        supplyPrice.value = g_liquidationSpread.mul(supplyPrice.value).to128();

        // calculate the nominal amounts
        if (args.amount.intent == LActions.AmountIntention.Borrow) {
            borrowAccrued = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.borrowMarketId,
                args.amount
            );
            supplyAccrued = LPrice.getEquivalentAccrued(
                borrowAccrued,
                borrowPrice,
                supplyPrice
            );
            wsSetBalanceFromDeltaAccrued(
                worldState,
                args.accountId,
                args.supplyMarketId,
                supplyAccrued
            );
        }
        else if (args.amount.intent == LActions.AmountIntention.Supply) {
            supplyAccrued = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.supplyMarketId,
                args.amount
            );
            borrowAccrued = LPrice.getEquivalentAccrued(
                supplyAccrued,
                supplyPrice,
                borrowPrice
            );
            wsSetBalanceFromDeltaAccrued(
                worldState,
                args.accountId,
                args.borrowMarketId,
                borrowAccrued
            );
        }

        // TODO: verify that you're not overliquidating (causing liquid account to go from pos=>neg
        // or from neg=>pos for either of the two tokens)

        wsSetBalanceFromDeltaAccrued(
            worldState,
            args.liquidAccountId,
            args.supplyMarketId,
            supplyAccrued.negative()
        );
        wsSetBalanceFromDeltaAccrued(
            worldState,
            args.liquidAccountId,
            args.borrowMarketId,
            borrowAccrued.negative()
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _setExpiry(
        WorldState memory worldState,
        LActions.SetExpiryArgs memory args
    )
        private
        pure
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetClosingTime(worldState, args.accountId, args.time);
    }
}
