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

library LActions {

    // ============ Enums ============

    enum TransactionType {
        Supply,   // supply tokens
        Borrow,  // borrow tokens
        Exchange,  // exchange one token for another on an external exchange
        Liquidate, // liquidate an undercollateralized or expiring account
        SetExpiry  // set the expiry of your account
    }

    enum AmountDenomination {
        Accrued, // the amount is denominated in token amount (accrued amount)
        Nominal  // the amount is denominated in the nominal amount
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

    struct WorldState {
        uint256 numAssets;
        address trader;
        uint256 account;
        AssetInfo[] assets;
    }

    struct AssetInfo {
        address token;
        LInterest.Index index;
        LInterest.TotalNominal totalNominal;
        LPrice.Price price;
        LTypes.SignedNominal oldBalance;
        LTypes.SignedNominal balance;
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
        uint256 supplyMarketId;
        uint256 borrowMarketId;
        address exchangeWrapperOrLiquidTrader;
        uint256 liquidAccount;
        bytes orderData;
    }

    struct SupplyArgs {
        Amount amount;
        uint256 marketId;
    }

    struct BorrowArgs {
        Amount amount;
        uint256 marketId;
    }

    struct ExchangeArgs {
        Amount amount;
        uint256 borrowMarketId;
        uint256 supplyMarketId;
        address exchangeWrapper;
        bytes orderData;
    }

    struct LiquidateArgs {
        Amount amount;
        uint256 borrowMarketId;
        uint256 supplyMarketId;
        address liquidTrader;
        uint256 liquidAccount;
    }

    struct SetExpiryArgs {
         LTime.Time time;
    }

    // ============ Parsing Functions ============

    function parseSupplyArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (SupplyArgs memory)
    {
        assert(args.transactionType == TransactionType.Supply);
        return SupplyArgs({
            amount: args.amount,
            marketId: args.supplyMarketId
        });
    }

    function parseBorrowArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (BorrowArgs memory)
    {
        assert(args.transactionType == TransactionType.Supply);
        return BorrowArgs({
            amount: args.amount,
            marketId: args.borrowMarketId
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
            supplyMarketId: args.supplyMarketId,
            borrowMarketId: args.borrowMarketId,
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
            supplyMarketId: args.supplyMarketId,
            borrowMarketId: args.borrowMarketId,
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

    function amountToSignedNominal(
        Amount memory amount
    )
        internal
        pure
        returns (LTypes.SignedNominal memory result)
    {
        result.sign = amount.sign;
        result.nominal.value = LMath.to128(amount.value);
    }

    function amountToSignedAccrued(
        Amount memory amount
    )
        internal
        pure
        returns (LTypes.SignedAccrued memory result)
    {
        result.sign = amount.sign;
        result.accrued.value = amount.value;
    }
}
