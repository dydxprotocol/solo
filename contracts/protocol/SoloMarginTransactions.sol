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

import { LTransactions } from "./lib/LTransactions.sol";
import { IInterestOracle } from "./interfaces/IInterestOracle.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { SoloMarginStorage } from "./SoloMarginStorage.sol";
import { ReentrancyGuard } from "../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";


contract SoloMarginTransactions is
    SoloMarginStorage,
    ReentrancyGuard
{

    // ============ Public Functions ============

    function transact(
        address trader,
        uint256 account,
        bytes calldata txData
    )
        external
        nonReentrant
        returns (uint256[] memory)
    {
        (uint256 numTransactions, uint256 pointer) = LTransactions.parseNumTransactions(txData, 0);

        uint256[] results = new uint256[](numTransactions);

        for (uint256 i = 0; i < numTransactions; i++) {
            (results[i], pointer) = _transact(
                trader,
                account,
                txData,
                pointer
            );
        }

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
        returns (uint256 result, uint256 pointer)
    {
        LTransactions.TransactionType ttype;
        LTransactions.DepositArgs memory dargs;
        LTransactions.WithdrawArgs memory wargs;
        LTransactions.ExchangeArgs memory eargs;
        LTransactions.LiquidateArgs memory largs;

        (ttype, pointer) = LTransactions.parseTransactionType(txData, startPointer);

        if (ttype == TransactionType.deposit) {
            (dargs, pointer) = LTransactions.parseDepositArgs(txData, pointer);
            _updateIndex(dargs.token);
            result = _deposit(trader, account, dargs);
            _updateRate(dargs.token);
        }
        else if (ttype == TransactionType.withdraw) {
            (wargs, pointer) = LTransactions.parseWithdrawArgs(txData, pointer);
            _updateIndex(wargs.token);
            result = _withdraw(trader, account, wargs);
            _updateRate(wargs.token);
        }
        else if (ttype == TransactionType.exchange) {
            (eargs, pointer) = LTransactions.parseExchangeArgs(txData, pointer);
            _updateIndex(eargs.tokenWithdraw);
            _updateIndex(eargs.tokenDeposit);
            result = _exchange(trader, account, eargs);
            _updateRate(eargs.tokenWithdraw);
            _updateRate(eargs.tokenDeposit);
        }
        else if (ttype == TransactionType.liquidate) {
            (largs, pointer) = LTransactions.parseLiquidateArgs(txData, pointer);
            _updateIndex(largs.tokenWithdraw);
            _updateIndex(largs.tokenDeposit);
            result = _liquidate(trader, account, largs);
            _updateRate(largs.tokenWithdraw);
            _updateRate(largs.tokenDeposit);
        }

        index.r = IInterestOracle(g_interestOracle).getNewInterest(token, principals);
        g_index[token] = index;

        return (result, pointer);
    }

    function _deposit(
        address trader,
        uint256 account,
        LTransactions.DepositArgs memory args
    )
        internal
    {
        uint256 principal = amount.mul(c_BASE_INDEX).div(index.i);

        token.transferFrom(trader, address(this), amount);

        _accountModify(
            trader,
            account,
            token,
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
    {
        uint256 principal = amount.mul(c_BASE_INDEX).div(index.i);

        token.transfer(trader, amount);

        _accountModify(
            trader,
            account,
            token,
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
    {
        token.transfer(exchangeWrapper, withdrawAmount);
        uint256 withdrawPrincipal = withdrawAmount.mul(c_BASE_INDEX).div(index.i);
        uint256 tokensReceived = IExchangeWrapper(exchangeWrapper).exchange(
            trader,
            tokenWithdraw,
            tokenDeposit,
            withdrawAmount,
            orderData
        );
        tokenDeposit.transferFrom(exchangeWrapper, address(this), tokensReceived);
        uint256 depositPrincipal = withdrawAmount.mul(c_BASE_INDEX).div(index.i);

        _accountModify(
            trader,
            account,
            token,
            false,
            withdrawPrincipal
        );

        _accountModify(
            trader,
            account,
            token,
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
    {
        // TODO
    }

    // ============ Helper Functions ============

    function _updateIndex(
        address token
    )
        internal
    {
        Index memory index = g_index[token];
        index.i = Interest.getInterest(index.i, index.r, (index.t - now32()));
        index.t = now32();
        g_index[token] = index;
    }

    function _updateRate(
        address token
    )
        internal
    {
        g_rate[token] = IInterestOracle(g_interestOracle).getNewInterest(token, g_principals[token]);
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
