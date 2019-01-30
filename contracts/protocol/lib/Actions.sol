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

import { Account } from "./Account.sol";
import { Require } from "./Require.sol";
import { Types } from "./Types.sol";


/**
 * @title Actions
 * @author dYdX
 *
 * TODO
 */
library Actions {

    // ============ Constants ============

    string constant FILE = "Actions";

    // ============ Enums ============

    enum ActionType {
        Deposit,   // supply tokens
        Withdraw,  // borrow tokens
        Transfer,  // transfer balance between accounts
        Buy,       // buy an amount of some token (externally)
        Sell,      // sell an amount of some token (externally)
        Trade,     // buy an amount of some token (internally)
        Liquidate, // liquidate an undercollateralized or expiring account
        Vaporize,  // arbitrage admin funds to save a completely negative account
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

    struct ActionArgs {
        ActionType actionType;
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
        Account.Info account;
        uint256 mkt;
        address from;
    }

    struct WithdrawArgs {
        AssetAmount amount;
        Account.Info account;
        uint256 mkt;
        address to;
    }

    struct TransferArgs {
        AssetAmount amount;
        Account.Info accountOne;
        Account.Info accountTwo;
        uint256 mkt;
    }

    struct BuyArgs {
        AssetAmount amount;
        Account.Info account;
        uint256 makerMkt;
        uint256 takerMkt;
        address exchangeWrapper;
        bytes orderData;
    }

    struct SellArgs {
        AssetAmount amount;
        Account.Info account;
        uint256 takerMkt;
        uint256 makerMkt;
        address exchangeWrapper;
        bytes orderData;
    }

    struct TradeArgs {
        AssetAmount amount;
        Account.Info takerAccount;
        Account.Info makerAccount;
        uint256 inputMkt;
        uint256 outputMkt;
        address autoTrader;
        bytes tradeData;
    }

    struct LiquidateArgs {
        AssetAmount amount;
        Account.Info solidAccount;
        Account.Info liquidAccount;
        uint256 owedMkt;
        uint256 heldMkt;
    }

    struct VaporizeArgs {
        AssetAmount amount;
        Account.Info solidAccount;
        Account.Info vaporAccount;
        uint256 owedMkt;
        uint256 heldMkt;
    }

    struct CallArgs {
        Account.Info account;
        address callee;
        bytes data;
    }

    // ============ Parsing Functions ============

    function parseDepositArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (DepositArgs memory)
    {
        assert(args.actionType == ActionType.Deposit);
        return DepositArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            mkt: args.primaryMarketId,
            from: args.otherAddress
        });
    }

    function parseWithdrawArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (WithdrawArgs memory)
    {
        assert(args.actionType == ActionType.Withdraw);
        return WithdrawArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            mkt: args.primaryMarketId,
            to: args.otherAddress
        });
    }

    function parseTransferArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (TransferArgs memory)
    {
        assert(args.actionType == ActionType.Transfer);
        Require.that(
            args.accountId != args.otherAccountId,
            FILE,
            "Transfer accounts match"
        );
        return TransferArgs({
            amount: args.amount,
            accountOne: accounts[args.accountId],
            accountTwo: accounts[args.otherAccountId],
            mkt: args.primaryMarketId
        });
    }

    function parseBuyArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (BuyArgs memory)
    {
        assert(args.actionType == ActionType.Buy);
        return BuyArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            makerMkt: args.primaryMarketId,
            takerMkt: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseSellArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (SellArgs memory)
    {
        assert(args.actionType == ActionType.Sell);
        return SellArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            takerMkt: args.primaryMarketId,
            makerMkt: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseTradeArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (TradeArgs memory)
    {
        assert(args.actionType == ActionType.Trade);
        Require.that(
            args.accountId != args.otherAccountId,
            FILE,
            "Trade accounts match"
        );
        return TradeArgs({
            amount: args.amount,
            takerAccount: accounts[args.accountId],
            makerAccount: accounts[args.otherAccountId],
            inputMkt: args.primaryMarketId,
            outputMkt: args.secondaryMarketId,
            autoTrader: args.otherAddress,
            tradeData: args.data
        });
    }

    function parseLiquidateArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (LiquidateArgs memory)
    {
        assert(args.actionType == ActionType.Liquidate);
        Require.that(
            args.primaryMarketId != args.secondaryMarketId,
            FILE,
            "Liquidate markets match"
        );
        Require.that(
            args.accountId != args.otherAccountId,
            FILE,
            "Liquidate accounts match"
        );
        return LiquidateArgs({
            amount: args.amount,
            solidAccount: accounts[args.accountId],
            liquidAccount: accounts[args.otherAccountId],
            owedMkt: args.primaryMarketId,
            heldMkt: args.secondaryMarketId
        });
    }

    function parseVaporizeArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (VaporizeArgs memory)
    {
        assert(args.actionType == ActionType.Vaporize);
        Require.that(
            args.primaryMarketId != args.secondaryMarketId,
            FILE,
            "Vaporize markets match"
        );
        Require.that(
            args.accountId != args.otherAccountId,
            FILE,
            "Vaporize accounts match"
        );
        return VaporizeArgs({
            amount: args.amount,
            solidAccount: accounts[args.accountId],
            vaporAccount: accounts[args.otherAccountId],
            owedMkt: args.primaryMarketId,
            heldMkt: args.secondaryMarketId
        });
    }

    function parseCallArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (CallArgs memory)
    {
        assert(args.actionType == ActionType.Call);
        return CallArgs({
            account: accounts[args.accountId],
            callee: args.otherAddress,
            data: args.data
        });
    }
}
