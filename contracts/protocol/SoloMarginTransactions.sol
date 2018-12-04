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

import { LTransactions } from "./lib/LTransactions.sol";
import { LInterest } from "./lib/LInterest.sol";
import { LTokenInteract } from "./lib/LTokenInteract.sol";
import { IExchangeWrapper } from "./interfaces/IExchangeWrapper.sol";
import { IInterestOracle } from "./interfaces/IInterestOracle.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { SoloMarginStorage } from "./SoloMarginStorage.sol";
import { ReentrancyGuard } from "../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";


contract SoloMarginTransactions is
    SoloMarginStorage,
    ReentrancyGuard
{
    using LTokenInteract for address;

    // ============ Public Functions ============

    function transact(
        address trader,
        uint256 account,
        bytes calldata txData
    )
        external
        nonReentrant
        returns (LTransactions.TransactionReceipt[] memory)
    {
        (uint256 numTransactions, uint256 pointer) = LTransactions.parseNumTransactions(txData, 0);

        LTransactions.TransactionReceipt[] memory results =
            new LTransactions.TransactionReceipt[](numTransactions);

        for (uint256 i = 0; i < numTransactions; i++) {
            (results[i], pointer) = _transact(
                trader,
                account,
                txData,
                pointer
            );
        }

        // TODO: verify msg.sender is authorized to touch this trader's account

        // TODO: verify trader account is collateralized properly

        return results;
    }

    // ============ Private Functions ============

    function _transact(
        address trader,
        uint256 account,
        bytes memory txData,
        uint256 startPointer
    )
        internal
        returns (LTransactions.TransactionReceipt memory result, uint256 pointer)
    {
        LTransactions.TransactionType ttype;
        LTransactions.DepositArgs memory dargs;
        LTransactions.WithdrawArgs memory wargs;
        LTransactions.ExchangeArgs memory eargs;
        LTransactions.LiquidateArgs memory largs;

        (ttype, pointer) = LTransactions.parseTransactionType(txData, startPointer);

        if (ttype == LTransactions.TransactionType.Deposit) {
            (dargs, pointer) = LTransactions.parseDepositArgs(txData, pointer);
            _updateIndex(dargs.token);
            result = _deposit(trader, account, dargs);
            _updateRate(dargs.token);
        }
        else if (ttype == LTransactions.TransactionType.Withdraw) {
            (wargs, pointer) = LTransactions.parseWithdrawArgs(txData, pointer);
            _updateIndex(wargs.token);
            result = _withdraw(trader, account, wargs);
            _updateRate(wargs.token);
        }
        else if (ttype == LTransactions.TransactionType.Exchange) {
            (eargs, pointer) = LTransactions.parseExchangeArgs(txData, pointer);
            _updateIndex(eargs.tokenWithdraw);
            _updateIndex(eargs.tokenDeposit);
            result = _exchange(trader, account, eargs);
            _updateRate(eargs.tokenWithdraw);
            _updateRate(eargs.tokenDeposit);
        }
        else if (ttype == LTransactions.TransactionType.Liquidate) {
            (largs, pointer) = LTransactions.parseLiquidateArgs(txData, pointer);
            _updateIndex(largs.tokenWithdraw);
            _updateIndex(largs.tokenDeposit);
            result = _liquidate(trader, account, largs);
            _updateRate(largs.tokenWithdraw);
            _updateRate(largs.tokenDeposit);
        }
    }

    function _deposit(
        address trader,
        uint256 account,
        LTransactions.DepositArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        (uint256 tokenAmount, uint256 principal) = _parseAmount(
            trader,
            account,
            args.token,
            args.amount,
            g_index[args.token],
            args.amountType,
            LTransactions.AmountSide.Deposit
        );

        args.token.transferFrom(trader, address(this), tokenAmount);

        _accountModify(
            trader,
            account,
            args.token,
            true,
            principal
        );
    }

    function _withdraw(
        address trader,
        uint256 account,
        LTransactions.WithdrawArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        (uint256 tokenAmount, uint256 principal) = _parseAmount(
            trader,
            account,
            args.token,
            args.amount,
            g_index[args.token],
            args.amountType,
            LTransactions.AmountSide.Withdraw
        );

        args.token.transfer(trader, tokenAmount);

        _accountModify(
            trader,
            account,
            args.token,
            false,
            principal
        );
    }

    function _exchange(
        address trader,
        uint256 account,
        LTransactions.ExchangeArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        LInterest.Index memory withdrawIndex = g_index[args.tokenWithdraw];
        LInterest.Index memory depositIndex = g_index[args.tokenDeposit];
        uint256 withdrawAmount;
        uint256 withdrawPrincipal;
        uint256 depositAmount;
        uint256 depositPrincipal;

        if (args.amountSide == LTransactions.AmountSide.Withdraw) {
            (withdrawAmount, withdrawPrincipal) = _parseAmount(
                trader,
                account,
                args.tokenWithdraw,
                args.amount,
                withdrawIndex,
                args.amountType,
                args.amountSide
            );
        } else if (args.amountSide == LTransactions.AmountSide.Deposit) {
            (depositAmount, depositPrincipal) = _parseAmount(
                trader,
                account,
                args.tokenDeposit,
                args.amount,
                depositIndex,
                args.amountType,
                args.amountSide
            );
            withdrawAmount = IExchangeWrapper(args.exchangeWrapper).getExchangeCost(
                args.tokenDeposit,
                args.tokenWithdraw,
                depositAmount,
                args.orderData
            );
            withdrawPrincipal = LInterest.amountToPrincipal(withdrawAmount, withdrawIndex.i);
        }

        uint256 tempDepositAmount = IExchangeWrapper(args.exchangeWrapper).exchange(
            msg.sender,
            address(this),
            args.tokenDeposit,
            args.tokenWithdraw,
            withdrawAmount,
            args.orderData
        );

        if (args.amountSide == LTransactions.AmountSide.Withdraw) {
            depositAmount = tempDepositAmount;
            depositPrincipal = LInterest.amountToPrincipal(depositAmount, depositIndex.i);
        }

        args.tokenDeposit.transferFrom(args.exchangeWrapper, address(this), depositAmount);

        _accountModify(
            trader,
            account,
            args.tokenWithdraw,
            false,
            withdrawPrincipal
        );

        _accountModify(
            trader,
            account,
            args.tokenDeposit,
            true,
            depositPrincipal
        );
    }

    function _liquidate(
        address trader,
        uint256 account,
        LTransactions.LiquidateArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        // TODO
    }

    // ============ Helper Functions ============

    function _updateIndex(
        address token
    )
        internal
    {
        LInterest.Index memory index = g_index[token];
        if (index.i != LInterest.now32()) {
            g_index[token] = LInterest.getUpdatedIndex(index);
        }
    }

    function _updateRate(
        address token
    )
        internal
    {
        g_index[token].r = IInterestOracle(g_interestOracle).getNewInterest(token, g_principals[token]);
    }

    function _parseAmount(
        address trader,
        uint256 account,
        address token,
        uint256 amount,
        LInterest.Index memory index,
        LTransactions.AmountType amountType,
        LTransactions.AmountSide amountSide
    )
        internal
        view
        returns (uint256 tokenAmount, uint256 principal)
    {
        if (amountType == LTransactions.AmountType.TokenAmount) {
            tokenAmount = amount;
            principal = LInterest.amountToPrincipal(amount, index.i);
        } else if (amountType == LTransactions.AmountType.Principal) {
            principal = amount;
            tokenAmount = LInterest.principalToAmount(principal, index.i);
        } else if (amountType == LTransactions.AmountType.All) {
            Balance memory balance = g_balances[trader][account][token];
            if (amountSide == LTransactions.AmountSide.Withdraw) {
                require(balance.positive, "BALANCE MUST BE POSITIVE TO WITHDRAW ALL");
                principal = balance.principal;
                tokenAmount = LInterest.principalToAmount(principal, index.i);
            } else if (amountSide == LTransactions.AmountSide.Deposit) {
                require(!balance.positive, "BALANCE MUST BE POSITIVE TO DEPOSIT ALL");
                principal = balance.principal;
                tokenAmount = LInterest.principalToAmount(principal, index.i);
            }
        }
    }

    function _accountModify(
        address trader,
        uint256 account,
        address token,
        bool positive,
        uint256 principal
    )
        internal
    {
        Principals memory principals = g_principals[token];
        Balance memory oldBalance = g_balances[trader][account][token];
        Balance memory newBalance = _mergeBalances(
            oldBalance,
            Balance({
                positive: positive,
                principal: principal
            })
        );

        // roll-back oldBalance
        if (oldBalance.positive) {
            principals.borrowed = principals.borrowed.sub(oldBalance.principal);
        } else {
            principals.lent = principals.lent.sub(oldBalance.lent);
        }

        // roll-forward newBalance
        if (newBalance.positive) {
            principals.lent = principals.lent.add(newBalance.lent);
        } else {
            principals.borrowed = principals.borrowed.add(newBalance.lent);
        }
    }

    function _mergeBalances(
        Balance memory b1,
        Balance memory b2
    )
        internal
        returns (Balance memory)
    {
        if (b1.positive == b2.positive) {
            return Balance({
                positive: b1.positive,
                principal: b1.principal.add(b2.principal)
            });
        } else {
            if (b1.principal > b2.principal) {
                return Balance({
                    positive: b1.positive,
                    principal: b1.principal.sub(b2.principal)
                });
            } else {
                return Balance({
                    positive: b2.positive,
                    principal: b2.principal.sub(b1.principal)
                });
            }
        }
    }
}
