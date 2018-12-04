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

    struct DepositArgs {
        address token;
        uint256 amount;
        AmountType amountType;
    }

    struct WithdrawArgs {
        address token;
        uint256 amount;
        AmountType amountType;
    }

    struct ExchangeArgs {
        address tokenWithdraw;
        address tokenDeposit;
        address exchangeWrapper;
        uint256 amount;
        AmountSide amountSide;
        AmountType amountType;
        bytes orderData;
    }

    struct LiquidateArgs {
        address tokenWithdraw;
        address tokenDeposit;
        address liquidTrader;
        uint256 liquidAccount;
        uint256 amount;
        AmountSide amountSide;
        AmountType amountType;
    }

    struct TransactionReceipt {
        uint256 placeHolder; // TODO
    }

    // ============ Parsing Functions ============

    function parseNumTransactions(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (uint256 numTransactions, uint256 pointer)
    {
        uint8 temp;
        (temp, pointer) = _parseUint8(b, p);
        numTransactions = uint256(temp);
    }

    function parseTransactionType(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (TransactionType, uint256)
    {
        // TODO
    }

    function parseDepositArgs(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (DepositArgs memory, uint256)
    {
        // TODO
    }

    function parseWithdrawArgs(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (WithdrawArgs memory, uint256)
    {
        // TODO
    }

    function parseExchangeArgs(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (ExchangeArgs memory, uint256)
    {
        // TODO
    }

    function parseLiquidateArgs(
        bytes memory b,
        uint256 p
    )
        internal
        view
        returns (LiquidateArgs memory, uint256)
    {
        // TODO
    }

    // ============ Helper Functions ============

    function _parseUint8(
        bytes memory b,
        uint256 p
    )
        private
        view
        returns (uint8 result, uint256 pointer)
    {
        result = uint8(_staticParse(b, p) >> 31);
        pointer = p + 1;
    }

    function _parseAddress(
        bytes memory b,
        uint256 p
    )
        private
        view
        returns (address result, uint256 pointer)
    {
        result = address(_staticParse(b, p) & ADDRESS_MASK);
        pointer = p + 32;
    }

    function _parseUint256(
        bytes memory b,
        uint256 p
    )
        private
        view
        returns (uint256 result, uint256 pointer)
    {
        result = _staticParse(b, p);
        pointer = p + 32;
    }

    function _staticParse(
        bytes memory b,
        uint256 p
    )
        private
        view
        returns (uint256 result)
    {
        assembly {
            result := mload(add(b, add(32, p)))
        }
    }
}
