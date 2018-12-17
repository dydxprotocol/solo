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

import { Math } from "./Math.sol";
import { Types } from "./Types.sol";


/**
 * @title Actions
 * @author dYdX
 *
 * TODO
 */
library Actions {
    using Math for uint256;

    // ============ Enums ============

    enum TransactionType {
        ExternalTransfer, // supply tokens
        InternalTransfer, // borrow tokens
        Exchange,         // exchange one token for another on an external exchange
        Liquidate,        // liquidate an undercollateralized or expiring account
        SetExpiry         // set the expiry of your account
    }

    enum AmountDenomination {
        Wei, // the amount is denominated in token amount
        Par  // the amount is denominated in principal
    }

    enum AmountReference {
        Delta, // the amount is given as a delta from the current value
        Target // the amount is given as an exact number to end up at
    }

    enum AmountIntention {
        Supply, // the amount applies to the supplyAsset
        Borrow // the amount applies to the borrowAsset
    }

    // ============ Structs ============

    struct Amount {
        bool sign;
        AmountIntention intent;
        AmountDenomination denom;
        AmountReference ref;
        uint256 value;
    }

    struct TransactionArgs {
        TransactionType transactionType;
        uint256 accountId;
        Amount amount;
        uint256 supplyMarketId;
        uint256 borrowMarketId;
        address otherAddress;
        uint256 otherAccountId;
        bytes orderData;
    }

    // ============ Action Types ============

    struct ExternalTransferArgs {
        uint256 accountId;
        Amount amount;
        uint256 marketId;
        address otherAddress;
    }

    struct InternalTransferArgs {
        uint256 accountId;
        Amount amount;
        uint256 marketId;
        uint256 otherAccountId;
    }

    struct ExchangeArgs {
        uint256 accountId;
        Amount amount;
        uint256 borrowMarketId;
        uint256 supplyMarketId;
        address exchangeWrapper;
        bytes orderData;
    }

    struct LiquidateArgs {
        uint256 accountId;
        Amount amount;
        uint256 borrowMarketId;
        uint256 supplyMarketId;
        uint256 liquidAccountId;
    }

    struct SetExpiryArgs {
        uint256 accountId;
        uint32 time;
    }

    // ============ Parsing Functions ============

    function parseExternalTransferArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (ExternalTransferArgs memory)
    {
        assert(args.transactionType == TransactionType.ExternalTransfer);
        return ExternalTransferArgs({
            accountId: args.accountId,
            amount: args.amount,
            marketId: args.amount.intent == AmountIntention.Supply ? args.supplyMarketId : args.borrowMarketId,
            otherAddress: args.otherAddress
        });
    }

    function parseInternalTransferArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (InternalTransferArgs memory)
    {
        assert(args.transactionType == TransactionType.InternalTransfer);
        return InternalTransferArgs({
            accountId: args.accountId,
            amount: args.amount,
            marketId: args.amount.intent == AmountIntention.Supply ? args.supplyMarketId : args.borrowMarketId,
            otherAccountId: args.otherAccountId
        });
    }

    function parseExchangeArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (ExchangeArgs memory)
    {
        assert(args.transactionType == TransactionType.Exchange);
        return ExchangeArgs({
            accountId: args.accountId,
            amount: args.amount,
            supplyMarketId: args.supplyMarketId,
            borrowMarketId: args.borrowMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.orderData
        });
    }

    function parseLiquidateArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (LiquidateArgs memory)
    {
        assert(args.transactionType == TransactionType.Liquidate);
        return LiquidateArgs({
            accountId: args.accountId,
            amount: args.amount,
            supplyMarketId: args.supplyMarketId,
            borrowMarketId: args.borrowMarketId,
            liquidAccountId: args.otherAccountId
        });
    }

    function parseSetExpiryArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (SetExpiryArgs memory)
    {
        assert(args.transactionType == TransactionType.SetExpiry);
        return SetExpiryArgs({
            accountId: args.accountId,
            time: args.amount.value.to32()
        });
    }

    function amountToPar(
        Amount memory amount
    )
        internal
        pure
        returns (Types.Par memory)
    {
        return Types.Par({
            sign: amount.sign,
            value: amount.value.to128()
        });
    }

    function amountToWei(
        Amount memory amount
    )
        internal
        pure
        returns (Types.Wei memory)
    {
        return Types.Wei({
            sign: amount.sign,
            value: amount.value
        });
    }
}
