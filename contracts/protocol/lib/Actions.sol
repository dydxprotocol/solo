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

import { Types } from "./Types.sol";


/**
 * @title Actions
 * @author dYdX
 *
 * TODO
 */
library Actions {

    // ============ Enums ============

    enum TransactionType {
        Deposit,   // supply tokens
        Withdraw,  // borrow tokens
        Transfer,  // transfer balance between accounts
        Buy,       // buy an amount of some token (externally)
        Sell,      // sell an amount of some token (externally)
        Trade,     // buy an amount of some token (internally)
        Liquidate, // liquidate an undercollateralized or expiring account
        Call       // send arbitrary data to an address
    }

    enum AssetDenomination {
        Wei, // the amount is denominated in token amount
        Par  // the amount is denominated in principal
    }

    enum AssetReference {
        Delta, // the amount is given as a delta from the current value
        Target // the amount is given as an exact number to end up at
    }

    // ============ Structs ============

    struct AssetAmount {
        bool sign;
        AssetDenomination denomination;
        AssetReference ref;
        uint256 value;
    }

    struct TransactionArgs {
        TransactionType transactionType;
        uint256 accountId;
        AssetAmount amount;
        uint256 primaryMarketId;
        uint256 secondaryMarketId;
        address otherAddress;
        uint256 otherAccountId;
        bytes data;
    }

    // ============ Action Types ============

    struct DepositArgs {
        AssetAmount amount;
        uint256 acct;
        uint256 mkt;
        address from;
    }

    struct WithdrawArgs {
        AssetAmount amount;
        uint256 acct;
        uint256 mkt;
        address to;
    }

    struct TransferArgs {
        AssetAmount amount;
        uint256 acctOne;
        uint256 acctTwo;
        uint256 mkt;
    }

    struct BuyArgs {
        AssetAmount amount;
        uint256 acct;
        uint256 makerMkt;
        uint256 takerMkt;
        address exchangeWrapper;
        bytes orderData;
    }

    struct SellArgs {
        AssetAmount amount;
        uint256 acct;
        uint256 takerMkt;
        uint256 makerMkt;
        address exchangeWrapper;
        bytes orderData;
    }

    struct TradeArgs {
        AssetAmount amount;
        uint256 takerAcct;
        uint256 makerAcct;
        uint256 inputMkt;
        uint256 outputMkt;
        address autoTrader;
        bytes tradeData;
    }

    struct LiquidateArgs {
        AssetAmount amount;
        uint256 stableAcct;
        uint256 liquidAcct;
        uint256 owedMkt;
        uint256 heldMkt;
    }

    struct CallArgs {
        uint256 acct;
        address who;
        bytes data;
    }

    // ============ Parsing Functions ============

    function parseDepositArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (DepositArgs memory)
    {
        assert(args.transactionType == TransactionType.Deposit);
        return DepositArgs({
            amount: args.amount,
            acct: args.accountId,
            mkt: args.primaryMarketId,
            from: args.otherAddress
        });
    }

    function parseWithdrawArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (WithdrawArgs memory)
    {
        assert(args.transactionType == TransactionType.Withdraw);
        return WithdrawArgs({
            amount: args.amount,
            acct: args.accountId,
            mkt: args.primaryMarketId,
            to: args.otherAddress
        });
    }

    function parseTransferArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (TransferArgs memory)
    {
        assert(args.transactionType == TransactionType.Transfer);
        require(
            args.accountId != args.otherAccountId,
            "TODO_REASON"
        );
        return TransferArgs({
            amount: args.amount,
            acctOne: args.accountId,
            acctTwo: args.otherAccountId,
            mkt: args.primaryMarketId
        });
    }

    function parseBuyArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (BuyArgs memory)
    {
        assert(args.transactionType == TransactionType.Buy);
        return BuyArgs({
            amount: args.amount,
            acct: args.accountId,
            makerMkt: args.primaryMarketId,
            takerMkt: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseSellArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (SellArgs memory)
    {
        assert(args.transactionType == TransactionType.Sell);
        return SellArgs({
            amount: args.amount,
            acct: args.accountId,
            takerMkt: args.primaryMarketId,
            makerMkt: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseTradeArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (TradeArgs memory)
    {
        assert(args.transactionType == TransactionType.Trade);
        require(
            args.accountId != args.otherAccountId,
            "TODO_REASON"
        );
        return TradeArgs({
            amount: args.amount,
            takerAcct: args.accountId,
            makerAcct: args.otherAccountId,
            inputMkt: args.primaryMarketId,
            outputMkt: args.secondaryMarketId,
            autoTrader: args.otherAddress,
            tradeData: args.data
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
        require(
            args.primaryMarketId != args.secondaryMarketId,
            "TODO_REASON"
        );
        require(
            args.accountId != args.otherAccountId,
            "TODO_REASON"
        );
        return LiquidateArgs({
            amount: args.amount,
            stableAcct: args.accountId,
            liquidAcct: args.otherAccountId,
            owedMkt: args.primaryMarketId,
            heldMkt: args.secondaryMarketId
        });
    }

    function parseCallArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (CallArgs memory)
    {
        assert(args.transactionType == TransactionType.Call);
        return CallArgs({
            acct: args.accountId,
            who: args.otherAddress,
            data: args.data
        });
    }
}
