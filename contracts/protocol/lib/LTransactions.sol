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


library LTransactions {

    uint256 constant ADDRESS_MASK = 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    // ============ Enums ============

    enum TransactionType {
        Deposit,
        Withdraw,
        Exchange,
        Liquidate
    }

    enum AmountSide {
        Withdraw,
        Deposit
    }

    enum AmountType {
        TokenAmount,
        Principal,
        All
    }

    // ============ Structs ============

    struct TransactionArgs {
        TransactionType transactionType;
        AmountSide amountSide;
        AmountType amountType;
        address tokenDeposit;
        address tokenWithdraw;
        address exchangeWrapperOrLiquidTrader;
        uint256 liquidAccount;
        uint256 amount;
        bytes orderData;
    }

    struct DepositArgs {
        AmountType amountType;
        address token;
        uint256 amount;
    }

    struct WithdrawArgs {
        AmountType amountType;
        address token;
        uint256 amount;
    }

    struct ExchangeArgs {
        AmountSide amountSide;
        AmountType amountType;
        address tokenWithdraw;
        address tokenDeposit;
        address exchangeWrapper;
        uint256 amount;
        bytes orderData;
    }

    struct LiquidateArgs {
        AmountSide amountSide;
        AmountType amountType;
        address tokenWithdraw;
        address tokenDeposit;
        address liquidTrader;
        uint256 liquidAccount;
        uint256 amount;
    }

    struct TransactionReceipt {
        uint256 placeHolder; // TODO
    }

    // ============ Parsing Functions ============

    function parseDepositArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (DepositArgs memory)
    {
        return DepositArgs({
            amountType: args.amountType,
            token: args.tokenDeposit,
            amount: args.amount
        });
    }

    function parseWithdrawArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (WithdrawArgs memory)
    {
        return WithdrawArgs({
            amountType: args.amountType,
            token: args.tokenWithdraw,
            amount: args.amount
        });
    }

    function parseExchangeArgs(
        TransactionArgs memory args
    )
        internal
        pure
        returns (ExchangeArgs memory)
    {
        return ExchangeArgs({
            amountSide: args.amountSide,
            amountType: args.amountType,
            tokenWithdraw: args.tokenWithdraw,
            tokenDeposit: args.tokenDeposit,
            exchangeWrapper: args.exchangeWrapperOrLiquidTrader,
            amount: args.amount,
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
        return LiquidateArgs({
            amountSide: args.amountSide,
            amountType: args.amountType,
            tokenWithdraw: args.tokenWithdraw,
            tokenDeposit: args.tokenWithdraw,
            liquidTrader: args.exchangeWrapperOrLiquidTrader,
            liquidAccount: args.liquidAccount,
            amount: args.amount
        });
    }
}
