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

import { SafeMath } from "../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { LDecimal } from "./lib/LDecimal.sol";
import { LTransactions } from "./lib/LTransactions.sol";
import { LMath } from "./lib/LMath.sol";
import { LTime } from "./lib/LTime.sol";
import { LTypes } from "./lib/LTypes.sol";
import { LInterest } from "./lib/LInterest.sol";
import { LTokenInteract } from "./lib/LTokenInteract.sol";
import { IExchangeWrapper } from "./interfaces/IExchangeWrapper.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { SoloMarginStorage } from "./SoloMarginStorage.sol";
import { ReentrancyGuard } from "../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";


contract SoloMarginTransactions is
    SoloMarginStorage,
    ReentrancyGuard
{
    using LDecimal for LDecimal.D256;
    using LDecimal for LDecimal.D128;
    using LTokenInteract for address;
    using LMath for uint256;
    using LTime for LTime.Time;
    using LTypes for LTypes.Principal;
    using SafeMath for uint256;
    using SafeMath for uint128;

    // ============ Public Functions ============

    function transact(
        address trader,
        uint256 account,
        LTransactions.TransactionArgs[] memory args
    )
        public
        nonReentrant
        returns (LTransactions.TransactionReceipt[] memory)
    {
        // TODO: add other authentication
        require(msg.sender == trader);

        uint256 i = 0;
        address[] memory tokens = g_activeTokens;

        for (i = 0; i < tokens.length; i++) {
            _updateIndex(tokens[i]);
        }

        LTransactions.TransactionReceipt[] memory results =
            new LTransactions.TransactionReceipt[](args.length);

        // run all transactions
        for (i = 0; i < args.length; i++) {
            results[i] = _transact(
                trader,
                account,
                args[i]
            );
        }

        // update interest rate
        for (i = 0 ; i < tokens.length; i++) {
            _updateRate(tokens[i]);
        }

        // ensure token balances
        for (i = 0 ; i < tokens.length; i++) {
            Principals memory principals = g_markets[tokens[i]].principals;
            LTypes.TokenAmount memory held = tokens[i].balanceOf(address(this));
            LTypes.TokenAmount memory expected = LInterest.principalToActual(principals.lent.sub(principals.borrowed), g_markets[tokens[i]].index.accrued);
            require(held.value >= expected.value, "We dont have as many tokens as expected");
        }

        // verify the account is properly over-collateralized
        require(
            _verifyCollateralization(trader, account, tokens),
            "Position cannot end up undercollateralized"
        );

        return results;
    }

    // ============ Private Functions ============

    function _transact(
        address trader,
        uint256 account,
        LTransactions.TransactionArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        LTransactions.TransactionReceipt memory result;
        LTransactions.TransactionType ttype = args.transactionType;

        if (ttype == LTransactions.TransactionType.Deposit) {
            result = _deposit(trader, account, LTransactions.parseDepositArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Withdraw) {
            result = _withdraw(trader, account, LTransactions.parseWithdrawArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Exchange) {
            result = _exchange(trader, account, LTransactions.parseExchangeArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Liquidate) {
            result = _liquidate(trader, account, LTransactions.parseLiquidateArgs(args));
        }
        return result;
    }

    function _deposit(
        address trader,
        uint256 account,
        LTransactions.DepositArgs memory args
    )
        internal
        returns (LTransactions.TransactionReceipt memory)
    {
        LTypes.TokenAmount memory tokenAmount;
        LTypes.Principal memory principal;
        (tokenAmount, principal) = _parseAmount(
            trader,
            account,
            args.token,
            args.amount,
            g_markets[args.token].index,
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
        LTypes.TokenAmount memory tokenAmount;
        LTypes.Principal memory principal;
        (tokenAmount, principal) = _parseAmount(
            trader,
            account,
            args.token,
            args.amount,
            g_markets[args.token].index,
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
        LInterest.Index memory withdrawIndex = g_markets[args.tokenWithdraw].index;
        LInterest.Index memory depositIndex = g_markets[args.tokenDeposit].index;
        LTypes.TokenAmount memory withdrawAmount;
        LTypes.TokenAmount memory depositAmount;
        LTypes.Principal memory withdrawPrincipal;
        LTypes.Principal memory depositPrincipal;

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
            withdrawAmount.value = IExchangeWrapper(args.exchangeWrapper).getExchangeCost(
                args.tokenDeposit,
                args.tokenWithdraw,
                depositAmount.value,
                args.orderData
            );
            withdrawPrincipal = LInterest.actualToPrincipal(withdrawAmount, withdrawIndex.accrued);
        }

        LTypes.TokenAmount memory tempDepositAmount;
        tempDepositAmount.value = IExchangeWrapper(args.exchangeWrapper).exchange(
            msg.sender,
            address(this),
            args.tokenDeposit,
            args.tokenWithdraw,
            withdrawAmount.value,
            args.orderData
        );

        if (args.amountSide == LTransactions.AmountSide.Withdraw) {
            depositAmount = tempDepositAmount;
            depositPrincipal = LInterest.actualToPrincipal(depositAmount, depositIndex.accrued);
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
        LTime.Time memory closingTime = g_accounts[args.liquidTrader][args.liquidAccount].closingTime;
        bool isCollateralized = closingTime.hasHappened()
            || _verifyCollateralization(args.liquidTrader, args.liquidAccount, g_activeTokens);

        require(
            !isCollateralized,
            "Cannot liquidate collateralized account"
        );
        LDecimal.D128 memory tokenWithdrawPrice = g_markets[args.tokenWithdraw].oracle.getPrice();
        LDecimal.D128 memory tokenDepositPrice = g_markets[args.tokenDeposit].oracle.getPrice();
        tokenDepositPrice.value = g_liquidationSpread.mul(tokenDepositPrice.value).to128();

        // TODO: do liquidate
        trader; // TODO: remove
        account; // TODO: remove
        tokenWithdrawPrice; // TODO: remove
        g_liquidationSpread = g_liquidationSpread; // TODO: remove
    }

    // ============ Helper Functions ============

    function _updateIndex(
        address token
    )
        internal
    {
        LInterest.Index memory index = g_markets[token].index;
        if (index.time.value != LTime.currentTime().value) {
            g_markets[token].index = LInterest.getUpdatedIndex(index);
        }
    }

    function _updateRate(
        address token
    )
        internal
    {
        Principals memory principals = g_markets[token].principals;
        g_markets[token].index.rate = g_markets[token].interestSetter.getNewInterest(
            token,
            principals.borrowed,
            principals.lent
        );
    }

    function _verifyCollateralization(
        address trader,
        uint256 account,
        address[] memory tokens
    )
        internal
        view
        returns (bool)
    {
        uint256 lentValue = 0;
        uint256 borrowedValue = 0;

        for(uint256 i = 0; i < tokens.length; i++) {
            Balance memory balance = g_accounts[trader][account].balances[tokens[i]];
            LDecimal.D128 memory price = g_markets[tokens[i]].oracle.getPrice();
            LTypes.TokenAmount memory tokenAmount = LInterest.principalToActual(balance.principal, g_markets[tokens[i]].index.accrued);
            uint256 overallValue = price.mul(tokenAmount.value);
            if (balance.positive) {
                lentValue = lentValue.add(overallValue);
            } else {
                borrowedValue = borrowedValue.add(overallValue);
            }
        }

        return lentValue > g_minCollateralRatio.mul(borrowedValue);
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
        returns (LTypes.TokenAmount memory, LTypes.Principal memory)
    {
        LTypes.TokenAmount memory tokenAmount;
        LTypes.Principal memory principal;

        if (amountType == LTransactions.AmountType.TokenAmount) {
            tokenAmount.value = amount;
            principal = LInterest.actualToPrincipal(tokenAmount, index.accrued);
        } else if (amountType == LTransactions.AmountType.Principal) {
            principal.value = amount.to128();
            tokenAmount = LInterest.principalToActual(principal, index.accrued);
        } else if (amountType == LTransactions.AmountType.All) {
            Balance memory balance = g_accounts[trader][account].balances[token];
            if (amountSide == LTransactions.AmountSide.Withdraw) {
                require(balance.positive, "BALANCE MUST BE POSITIVE TO WITHDRAW ALL");
                principal = balance.principal;
                tokenAmount = LInterest.principalToActual(principal, index.accrued);
            } else if (amountSide == LTransactions.AmountSide.Deposit) {
                require(!balance.positive, "BALANCE MUST BE POSITIVE TO DEPOSIT ALL");
                principal = balance.principal;
                tokenAmount = LInterest.principalToActual(principal, index.accrued);
            }
        }

        return (tokenAmount, principal);
    }

    function _accountModify(
        address trader,
        uint256 account,
        address token,
        bool positive,
        LTypes.Principal memory principal
    )
        internal
    {
        Principals memory principals = g_markets[token].principals;
        Balance memory oldBalance = g_accounts[trader][account].balances[token];
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
            principals.lent = principals.lent.sub(oldBalance.principal);
        }

        // roll-forward newBalance
        if (newBalance.positive) {
            principals.lent = principals.lent.add(newBalance.principal);
        } else {
            principals.borrowed = principals.borrowed.add(newBalance.principal);
        }

        // verify
        require(principals.lent.value >= principals.borrowed.value, "CANNOT BORROW MORE THAN LENT");

        // update storage
        g_accounts[trader][account].balances[token] = newBalance;
        g_markets[token].principals = principals;
    }

    function _mergeBalances(
        Balance memory b1,
        Balance memory b2
    )
        internal
        pure
        returns (Balance memory)
    {
        if (b1.positive == b2.positive) {
            return Balance({
                positive: b1.positive,
                principal: b1.principal.add(b2.principal)
            });
        } else {
            if (b1.principal.value > b2.principal.value) {
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
