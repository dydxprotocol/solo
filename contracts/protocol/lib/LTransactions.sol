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

import { LMath } from "./LMath.sol";
import { LTime } from "./LTime.sol";
import { LDecimal } from "./LDecimal.sol";
import { LPrice } from "./LPrice.sol";
import { LTypes } from "./LTypes.sol";
import { LInterest } from "./LInterest.sol";

library LTransactions {

    // ============ Enums ============

    enum TransactionType {
        Deposit,   // deposit tokens
        Withdraw,  // withdraw tokens
        Exchange,  // exchange one token for another on an external exchange
        Liquidate, // liquidate an undercollateralized or expiring account
        SetExpiry  // set the expiry of your account
    }

    enum AmountDenomination {
        Actual,   // the amount is denominated in token amount (accrued amount)
        Principal // the amount is denominated in principal
    }

    enum AmountReference {
        Delta, // the amount is given as a delta from the current value
        Target // the amount is given as an exact number to end up at
    }

    enum AmountIntention {
        Deposit, // the amount applies to the depositAsset
        Withdraw // the amount applies to the withdrawAsset
    }

    // ============ Structs ============

    struct WorldState {
        uint256 numAssets;
        address trader;
        uint256 account;
        AssetInfo[] assets;
    }

    struct AssetInfo {
        address token;
        LInterest.Index index;
        LInterest.TotalPrincipal totalPrincipal;
        LPrice.Price price;
        LTypes.SignedPrincipal oldBalance;
        LTypes.SignedPrincipal balance;
    }

    struct Amount {
        bool sign;
        AmountIntention intent;
        AmountDenomination denom;
        AmountReference ref;
        uint256 value;
    }

    struct TransactionArgs {
        TransactionType transactionType;
        Amount amount;
        uint256 depositAssetId;
        uint256 withdrawAssetId;
        address exchangeWrapperOrLiquidTrader;
        uint256 liquidAccount;
        bytes orderData;
    }

    struct DepositArgs {
        Amount amount;
        uint256 assetId;
    }

    struct WithdrawArgs {
        Amount amount;
        uint256 assetId;
    }

    struct ExchangeArgs {
        Amount amount;
        uint256 withdrawAssetId;
        uint256 depositAssetId;
        address exchangeWrapper;
        bytes orderData;
    }

    struct LiquidateArgs {
        Amount amount;
        uint256 withdrawAssetId;
        uint256 depositAssetId;
        address liquidTrader;
        uint256 liquidAccount;
    }

    struct SetExpiryArgs {
         LTime.Time time;
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
            assetId: args.depositAssetId
        });
    }

    function parseWithdrawArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (WithdrawArgs memory)
    {
        assert(args.transactionType == TransactionType.Deposit);
        return WithdrawArgs({
            amount: args.amount,
            assetId: args.withdrawAssetId
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
            amount: args.amount,
            depositAssetId: args.depositAssetId,
            withdrawAssetId: args.withdrawAssetId,
            exchangeWrapper: args.exchangeWrapperOrLiquidTrader,
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
            amount: args.amount,
            depositAssetId: args.depositAssetId,
            withdrawAssetId: args.withdrawAssetId,
            liquidTrader: args.exchangeWrapperOrLiquidTrader,
            liquidAccount: args.liquidAccount
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
            time: LTime.toTime(args.amount.value)
        });
    }

    function amountToSignedPrincipal(
        Amount memory amount
    )
        internal
        pure
        returns (LTypes.SignedPrincipal memory result)
    {
        result.sign = amount.sign;
        result.principal.value = LMath.to128(amount.value);
    }

    function amountToSignedTokenAmount(
        Amount memory amount
    )
        internal
        pure
        returns (LTypes.SignedTokenAmount memory result)
    {
        result.sign = amount.sign;
        result.tokenAmount.value = amount.value;
    }
}
