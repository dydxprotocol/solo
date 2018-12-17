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
import { WorldManager } from "./WorldManager.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Price } from "../lib/Price.sol";
import { Time } from "../lib/Time.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


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
    using Math for uint256;
    using SafeMath for uint256;
    using SafeMath for uint128;
    using Time for uint32;

    // ============ Public Functions ============

    function transact(
        AccountInfo[] memory accounts,
        Actions.TransactionArgs[] memory args
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
        Actions.TransactionArgs memory args
    )
        private
    {
        Actions.TransactionType ttype = args.transactionType;

        if (ttype == Actions.TransactionType.ExternalTransfer) {
            _externalTransfer(worldState, Actions.parseExternalTransferArgs(args));
        }
        else if (ttype == Actions.TransactionType.InternalTransfer) {
            _internalTransfer(worldState, Actions.parseInternalTransferArgs(args));
        }
        else if (ttype == Actions.TransactionType.Exchange) {
            _exchange(worldState, Actions.parseExchangeArgs(args));
        }
        else if (ttype == Actions.TransactionType.Liquidate) {
            _liquidate(worldState, Actions.parseLiquidateArgs(args));
        }
        else if (ttype == Actions.TransactionType.SetExpiry) {
            _setExpiry(worldState, Actions.parseSetExpiryArgs(args));
        }
    }

    function _externalTransfer(
        WorldState memory worldState,
        Actions.ExternalTransferArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        Types.Wei memory deltaWei = wsSetBalanceFromAmountStruct(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        address token = wsGetToken(worldState, args.marketId);

        if(args.amount.intent == Actions.AmountIntention.Supply) {
            address depositor = args.otherAddress;
            require(msg.sender == depositor || g_trustedAddress[depositor][msg.sender]);
            Token.transferIn(token, args.otherAddress, deltaWei);
        }
        else if (args.amount.intent == Actions.AmountIntention.Borrow) {
            Token.transferOut(token, args.otherAddress, deltaWei);
        }
    }

    function _internalTransfer(
        WorldState memory worldState,
        Actions.InternalTransferArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetCheckPerimissions(worldState, args.otherAccountId);

        // Get the values for your account
        Types.Wei memory deltaWei = wsSetBalanceFromAmountStruct(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        // Get the values for the other account
        wsSetBalanceFromDeltaWei(
            worldState,
            args.otherAccountId,
            args.marketId,
            deltaWei.negative()
        );
    }

    function _exchange(
        WorldState memory worldState,
        Actions.ExchangeArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address borrowToken = wsGetToken(worldState, args.borrowMarketId);
        address supplyToken = wsGetToken(worldState, args.supplyMarketId);
        Types.Wei memory supplyWei;
        Types.Wei memory borrowWei;

        if (args.amount.intent == Actions.AmountIntention.Borrow) {
            borrowWei = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.borrowMarketId,
                args.amount
                );

            supplyWei = Exchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyWei,
                args.orderData
            );

            wsSetBalanceFromDeltaWei(
                worldState,
                args.accountId,
                args.supplyMarketId,
                supplyWei
            );
        }
        else if (args.amount.intent == Actions.AmountIntention.Supply) {
            supplyWei = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.supplyMarketId,
                args.amount
            );

            borrowWei = Exchange.getCost(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                borrowWei,
                args.orderData
            );

            wsSetBalanceFromDeltaWei(
                worldState,
                args.accountId,
                args.borrowMarketId,
                borrowWei
            );

            Types.Wei memory tokensReceived = Exchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyWei,
                args.orderData
            );

            require(tokensReceived.value >= borrowWei.value);
        }
    }

    function _liquidate(
        WorldState memory worldState,
        Actions.LiquidateArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        // don't mark liquidAccountId for permissions

        Types.Wei memory supplyWei;
        Types.Wei memory borrowWei;

        // verify that this account can be liquidated
        if (!wsGetClosingTime(worldState, args.liquidAccountId).hasHappened()) {
            require(!_isCollateralized(worldState, args.liquidAccountId));
            wsSetClosingTime(worldState, args.liquidAccountId, Time.currentTime());
        }

        // normalize the oracle prices according to the liquidation spread
        Price.Price memory borrowPrice = wsGetPrice(worldState, args.borrowMarketId);
        Price.Price memory supplyPrice = wsGetPrice(worldState, args.supplyMarketId);
        supplyPrice.value = Decimal.mul(g_liquidationSpread, supplyPrice.value).to128();

        // calculate the nominal amounts
        if (args.amount.intent == Actions.AmountIntention.Borrow) {
            borrowWei = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.borrowMarketId,
                args.amount
            );
            supplyWei = Price.getEquivalentWei(
                borrowWei,
                borrowPrice,
                supplyPrice
            );
            wsSetBalanceFromDeltaWei(
                worldState,
                args.accountId,
                args.supplyMarketId,
                supplyWei
            );
        }
        else if (args.amount.intent == Actions.AmountIntention.Supply) {
            supplyWei = wsSetBalanceFromAmountStruct(
                worldState,
                args.accountId,
                args.supplyMarketId,
                args.amount
            );
            borrowWei = Price.getEquivalentWei(
                supplyWei,
                supplyPrice,
                borrowPrice
            );
            wsSetBalanceFromDeltaWei(
                worldState,
                args.accountId,
                args.borrowMarketId,
                borrowWei
            );
        }

        // TODO: verify that you're not overliquidating (causing liquid account to go from pos=>neg
        // or from neg=>pos for either of the two tokens)

        wsSetBalanceFromDeltaWei(
            worldState,
            args.liquidAccountId,
            args.supplyMarketId,
            supplyWei.negative()
        );
        wsSetBalanceFromDeltaWei(
            worldState,
            args.liquidAccountId,
            args.borrowMarketId,
            borrowWei.negative()
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _setExpiry(
        WorldState memory worldState,
        Actions.SetExpiryArgs memory args
    )
        private
        pure
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetClosingTime(worldState, args.accountId, args.time);
    }
}
