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

import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LTransactions } from "../lib/LTransactions.sol";
import { LMath } from "../lib/LMath.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTime } from "../lib/LTime.sol";
import { LTypes } from "../lib/LTypes.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LTokenInteract } from "../lib/LTokenInteract.sol";
import { IExchangeWrapper } from "../interfaces/IExchangeWrapper.sol";
import { TransactionMemory } from "./TransactionMemory.sol";
import { Storage } from "./Storage.sol";


/**
 * @title TransactionLogic
 * @author dYdX
 *
 * Logic for processing transactions
 */
contract TransactionLogic is
    Storage,
    TransactionMemory,
    ReentrancyGuard
{
    using LDecimal for LDecimal.D256;
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
    {
        LTransactions.WorldState memory worldState = _readWorldState(trader, account);

        // run all transactions
        for (uint256 i = 0; i < args.length; i++) {
            _transact(worldState, args[i]);
        }

        _verifyWorldState(worldState);
        _writeWorldState(worldState);
    }

    // ============ Private Functions ============

    function _transact(
        LTransactions.WorldState memory worldState,
        LTransactions.TransactionArgs memory args
    )
        internal
    {
        LTransactions.TransactionType ttype = args.transactionType;

        if (ttype == LTransactions.TransactionType.Deposit) {
            _deposit(worldState, LTransactions.parseDepositArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Withdraw) {
            _withdraw(worldState, LTransactions.parseWithdrawArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Exchange) {
            _exchange(worldState, LTransactions.parseExchangeArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.Liquidate) {
            _liquidate(worldState, LTransactions.parseLiquidateArgs(args));
        }
        else if (ttype == LTransactions.TransactionType.SetExpiry) {
            _setExpiry(worldState, LTransactions.parseSetExpiryArgs(args));
        }
    }

    function _deposit(
        LTransactions.WorldState memory worldState,
        LTransactions.DepositArgs memory args
    )
        internal
    {
        require (args.amount.intent == LTransactions.AmountIntention.Deposit);

        (
            LTypes.SignedPrincipal memory newBalance,
            LTypes.SignedTokenAmount memory tokenAmount
        ) = _calculateUsingAmountStruct(worldState, args.assetId, args.amount);

        require(tokenAmount.sign, "DEPOSIT AMOUNT MUST BE POSITIVE");

        // transfer the tokens
        address token = worldState.assets[args.assetId].token;
        token.transferFrom(worldState.trader, address(this), tokenAmount.tokenAmount);

        // update the balance
        _updateBalance(
            worldState,
            args.assetId,
            newBalance
        );
    }

    function _withdraw(
        LTransactions.WorldState memory worldState,
        LTransactions.WithdrawArgs memory args
    )
        internal
    {
        require (args.amount.intent == LTransactions.AmountIntention.Withdraw);

        (
            LTypes.SignedPrincipal memory newBalance,
            LTypes.SignedTokenAmount memory tokenAmount
        ) = _calculateUsingAmountStruct(worldState, args.assetId, args.amount);

        require(!tokenAmount.sign, "WITHDRAW AMOUNT MUST BE NEGATIVE");

        // transfer the tokens
        address token = worldState.assets[args.assetId].token;
        token.transfer(worldState.trader, tokenAmount.tokenAmount);

        // update the balance
        _updateBalance(
            worldState,
            args.assetId,
            newBalance
        );
    }

    function _exchange(
        LTransactions.WorldState memory worldState,
        LTransactions.ExchangeArgs memory args
    )
        internal
    {
        address withdrawToken = worldState.assets[args.withdrawAssetId].token;
        address depositToken = worldState.assets[args.depositAssetId].token;
        LTypes.SignedTokenAmount memory depositTokenAmount;
        LTypes.SignedTokenAmount memory withdrawTokenAmount;
        LTypes.SignedPrincipal memory newDepositBalance;
        LTypes.SignedPrincipal memory newWithdrawBalance;

        if (args.amount.intent == LTransactions.AmountIntention.Withdraw) {
            (
                newWithdrawBalance,
                withdrawTokenAmount
            ) = _calculateUsingAmountStruct(worldState, args.withdrawAssetId, args.amount);
        }
        else if (args.amount.intent == LTransactions.AmountIntention.Deposit) {
            (
                newDepositBalance,
                depositTokenAmount
            ) = _calculateUsingAmountStruct(worldState, args.depositAssetId, args.amount);

            withdrawTokenAmount.sign = false;
            withdrawTokenAmount.tokenAmount = IExchangeWrapper(args.exchangeWrapper).getExchangeCost(
                depositToken,
                withdrawToken,
                withdrawTokenAmount.tokenAmount,
                args.orderData
            );
            newWithdrawBalance = _getUpdatedBalanceFromDeltaTokenAmount(
                worldState,
                args.withdrawAssetId,
                withdrawTokenAmount
            );
        }

        withdrawToken.transfer(args.exchangeWrapper, withdrawTokenAmount.tokenAmount);
        LTypes.TokenAmount memory tokensReceived = IExchangeWrapper(args.exchangeWrapper).exchange(
            msg.sender,
            address(this),
            depositToken,
            withdrawToken,
            depositTokenAmount.tokenAmount,
            args.orderData
        );
        require(tokensReceived.value >= depositTokenAmount.tokenAmount.value);
        depositToken.transferFrom(args.exchangeWrapper, address(this), tokensReceived);

        if (args.amount.intent == LTransactions.AmountIntention.Withdraw) {
            depositTokenAmount.sign = true;
            depositTokenAmount.tokenAmount = tokensReceived;
            newDepositBalance = _getUpdatedBalanceFromDeltaTokenAmount(
                worldState,
                args.depositAssetId,
                depositTokenAmount
            );
        }

        // update the balances
        _updateBalance(
            worldState,
            args.withdrawAssetId,
            newWithdrawBalance
        );
        _updateBalance(
            worldState,
            args.depositAssetId,
            newDepositBalance
        );
    }

    function _liquidate(
        LTransactions.WorldState memory worldState,
        LTransactions.LiquidateArgs memory args
    )
        internal
    {
        LTypes.SignedTokenAmount memory depositTokenAmount;
        LTypes.SignedTokenAmount memory withdrawTokenAmount;
        LTypes.SignedPrincipal memory newDepositBalance;
        LTypes.SignedPrincipal memory newWithdrawBalance;

        // verify that this account can be liquidated
        if (!g_accounts[args.liquidTrader][args.liquidAccount].closingTime.hasHappened()) {
            // TODO: require account is undercollateralized
            g_accounts[args.liquidTrader][args.liquidAccount].closingTime = LTime.currentTime();
        }

        // normalize the oracle prices according to the liquidation spread
        LPrice.Price memory withdrawPrice = worldState.assets[args.withdrawAssetId].price;
        LPrice.Price memory depositPrice = worldState.assets[args.depositAssetId].price;
        depositPrice.value = g_liquidationSpread.mul(depositPrice.value).to128();

        // calculate the principal amounts
        if (args.amount.intent == LTransactions.AmountIntention.Withdraw) {
            (newWithdrawBalance, withdrawTokenAmount) = _calculateUsingAmountStruct(
                worldState,
                args.withdrawAssetId,
                args.amount
            );
            depositTokenAmount.sign = true;
            depositTokenAmount.tokenAmount.value = LPrice.getEquivalentAmount(
                withdrawTokenAmount.tokenAmount.value,
                withdrawPrice,
                depositPrice
            );
            newDepositBalance = _getUpdatedBalanceFromDeltaTokenAmount(
                worldState,
                args.depositAssetId,
                depositTokenAmount
            );
        }
        else if (args.amount.intent == LTransactions.AmountIntention.Deposit) {
            (newDepositBalance, depositTokenAmount) = _calculateUsingAmountStruct(
                worldState,
                args.depositAssetId,
                args.amount
            );
            withdrawTokenAmount.sign = false;
            withdrawTokenAmount.tokenAmount.value = LPrice.getEquivalentAmount(
                depositTokenAmount.tokenAmount.value,
                depositPrice,
                withdrawPrice
            );
            newWithdrawBalance = _getUpdatedBalanceFromDeltaTokenAmount(
                worldState,
                args.withdrawAssetId,
                withdrawTokenAmount
            );
        }

        // TODO: verify that you're not overliquidating (causing liquid account to go from pos=>neg
        // or from neg=>pos for either of the two tokens)

        // pay back the debt of the liquidated account
        _shiftBalance(
            worldState,
            args.depositAssetId,
            args.liquidTrader,
            args.liquidAccount,
            newDepositBalance.sub(worldState.assets[args.depositAssetId].balance)
        );
        _shiftBalance(
            worldState,
            args.withdrawAssetId,
            args.liquidTrader,
            args.liquidAccount,
            newWithdrawBalance.sub(worldState.assets[args.withdrawAssetId].balance)
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _setExpiry(
        LTransactions.WorldState memory worldState,
        LTransactions.SetExpiryArgs memory args
    )
        internal
    {
        g_accounts[worldState.trader][worldState.account].closingTime = args.time;
    }

    // ============ Helper Functions ============

    function _calculateUsingAmountStruct(
        LTransactions.WorldState memory worldState,
        uint256 assetId,
        LTransactions.Amount memory amount
    )
        internal
        pure
        returns (LTypes.SignedPrincipal memory newPrincipal, LTypes.SignedTokenAmount memory newTokenAmount)
    {
        LInterest.Index memory index = worldState.assets[assetId].index;
        LTypes.SignedPrincipal memory principal = worldState.assets[assetId].balance;
        LTypes.SignedTokenAmount memory tokenAmount = LInterest.signedPrincipalToTokenAmount(
            principal,
            index
        );

        if (amount.denom == LTransactions.AmountDenomination.Actual) {
            if (amount.ref == LTransactions.AmountReference.Delta) {
                newTokenAmount = LTransactions.amountToSignedTokenAmount(amount);
            } else if (amount.ref == LTransactions.AmountReference.Target) {
                newTokenAmount = LTransactions.amountToSignedTokenAmount(amount).sub(tokenAmount);
            }
            newPrincipal = LInterest.signedTokenAmountToPrincipal(tokenAmount.add(tokenAmount), index);
        } else if (amount.denom == LTransactions.AmountDenomination.Principal) {
            if (amount.ref == LTransactions.AmountReference.Delta) {
                newPrincipal = LTransactions.amountToSignedPrincipal(amount).add(principal);
            } else if (amount.ref == LTransactions.AmountReference.Target) {
                newPrincipal = LTransactions.amountToSignedPrincipal(amount);
            }
            newTokenAmount = LInterest.signedPrincipalToTokenAmount(newPrincipal, index).sub(tokenAmount);
        }

        if (amount.intent == LTransactions.AmountIntention.Deposit) {
            require(newTokenAmount.sign);
        }
        else if (amount.intent == LTransactions.AmountIntention.Withdraw) {
            require(!newTokenAmount.sign);
        }
    }

    function _getUpdatedBalanceFromDeltaTokenAmount(
        LTransactions.WorldState memory worldState,
        uint256 assetId,
        LTypes.SignedTokenAmount memory tokenAmount
    )
        internal
        pure
        returns (LTypes.SignedPrincipal memory)
    {
        LInterest.Index memory index = worldState.assets[assetId].index;
        LTypes.SignedPrincipal memory currentBalance = worldState.assets[assetId].balance;
        LTypes.SignedTokenAmount memory currentTokenAmount = LInterest.signedPrincipalToTokenAmount(
            currentBalance,
            index
        );

        return LInterest.signedTokenAmountToPrincipal(
            currentTokenAmount.add(tokenAmount),
            index
        );
    }

    function _updateBalance(
        LTransactions.WorldState memory worldState,
        uint256 assetId,
        LTypes.SignedPrincipal memory newBalance
    )
        internal
        pure
    {
        LTypes.SignedPrincipal memory oldBalance = worldState.assets[assetId].balance;
        LInterest.TotalPrincipal memory totalPrincipal = worldState.assets[assetId].totalPrincipal;

        // roll-back oldBalance
        if (oldBalance.sign) {
            totalPrincipal.borrowed = totalPrincipal.borrowed.sub(oldBalance.principal);
        } else {
            totalPrincipal.lent = totalPrincipal.lent.sub(oldBalance.principal);
        }

        // roll-forward newBalance
        if (newBalance.sign) {
            totalPrincipal.lent = totalPrincipal.lent.add(newBalance.principal);
        } else {
            totalPrincipal.borrowed = totalPrincipal.borrowed.add(newBalance.principal);
        }

        // verify
        require(totalPrincipal.lent.value >= totalPrincipal.borrowed.value, "CANNOT BORROW MORE THAN LENT");

        // update worldState
        worldState.assets[assetId].balance = newBalance;
        worldState.assets[assetId].totalPrincipal = totalPrincipal;
    }

    // move balance to/from an external account
    function _shiftBalance(
        LTransactions.WorldState memory worldState,
        uint256 assetId,
        address exernalTrader,
        uint256 externalAccount,
        LTypes.SignedPrincipal memory deltaBalance
    )
        internal
    {
        // subtract deltaBalance from external account
        address token = worldState.assets[assetId].token;
        g_accounts[exernalTrader][externalAccount].balances[token] =
            g_accounts[exernalTrader][externalAccount].balances[token].sub(deltaBalance);

        // add deltaBalance to user's account
        worldState.assets[assetId].balance =
            worldState.assets[assetId].balance.add(deltaBalance);

        // no need to update the gobal principal values (they stay constant)
    }
}
