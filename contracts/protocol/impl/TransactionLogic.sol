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
import { LActions } from "../lib/LActions.sol";
import { LMath } from "../lib/LMath.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LTime } from "../lib/LTime.sol";
import { LTypes } from "../lib/LTypes.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LToken } from "../lib/LToken.sol";
import { LExchange } from "../lib/LExchange.sol";
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
    using LMath for uint256;
    using LTime for LTime.Time;
    using SafeMath for uint256;
    using SafeMath for uint128;

    // ============ Public Functions ============

    function transact(
        address trader,
        uint256 account,
        LActions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        LActions.WorldState memory worldState = _readWorldState(trader, account);

        // run all transactions
        for (uint256 i = 0; i < args.length; i++) {
            _transact(worldState, args[i]);
        }

        _verifyWorldState(worldState);
        _writeWorldState(worldState);
    }

    // ============ Private Functions ============

    function _transact(
        LActions.WorldState memory worldState,
        LActions.TransactionArgs memory args
    )
        private
    {
        LActions.TransactionType ttype = args.transactionType;

        if (ttype == LActions.TransactionType.Supply) {
            _supply(worldState, LActions.parseSupplyArgs(args));
        }
        else if (ttype == LActions.TransactionType.Borrow) {
            _borrow(worldState, LActions.parseBorrowArgs(args));
        }
        else if (ttype == LActions.TransactionType.Exchange) {
            _exchange(worldState, LActions.parseExchangeArgs(args));
        }
        else if (ttype == LActions.TransactionType.Liquidate) {
            _liquidate(worldState, LActions.parseLiquidateArgs(args));
        }
        else if (ttype == LActions.TransactionType.SetExpiry) {
            _setExpiry(worldState, LActions.parseSetExpiryArgs(args));
        }
    }

    function _supply(
        LActions.WorldState memory worldState,
        LActions.SupplyArgs memory args
    )
        private
    {
        require(args.amount.intent == LActions.AmountIntention.Supply);

        (
            LTypes.SignedNominal memory newBalance,
            LTypes.SignedAccrued memory accrued
        ) = _calculateUsingAmountStruct(worldState, args.marketId, args.amount);

        require(accrued.sign, "DEPOSIT AMOUNT MUST BE POSITIVE");

        // transfer the tokens
        address token = worldState.assets[args.marketId].token;
        LToken.transferIn(token, worldState.trader, accrued);

        _updateBalance(
            worldState,
            args.marketId,
            newBalance
        );
    }

    function _borrow(
        LActions.WorldState memory worldState,
        LActions.BorrowArgs memory args
    )
        private
    {
        require(args.amount.intent == LActions.AmountIntention.Borrow);

        (
            LTypes.SignedNominal memory newBalance,
            LTypes.SignedAccrued memory accrued
        ) = _calculateUsingAmountStruct(worldState, args.marketId, args.amount);

        require(!accrued.sign, "WITHDRAW AMOUNT MUST BE NEGATIVE");

        // transfer the tokens
        address token = worldState.assets[args.marketId].token;
        LToken.transferOut(token, worldState.trader, accrued);

        _updateBalance(
            worldState,
            args.marketId,
            newBalance
        );
    }

    function _exchange(
        LActions.WorldState memory worldState,
        LActions.ExchangeArgs memory args
    )
        private
    {
        address borrowToken = worldState.assets[args.borrowMarketId].token;
        address supplyToken = worldState.assets[args.supplyMarketId].token;
        LTypes.SignedAccrued memory supplyAccrued;
        LTypes.SignedAccrued memory borrowAccrued;
        LTypes.SignedNominal memory newSupplyBalance;
        LTypes.SignedNominal memory newBorrowBalance;

        if (args.amount.intent == LActions.AmountIntention.Borrow) {
            (
                newBorrowBalance,
                borrowAccrued
            ) = _calculateUsingAmountStruct(worldState, args.borrowMarketId, args.amount);

            supplyAccrued = LExchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyAccrued,
                args.orderData
            );

            newSupplyBalance = _getUpdatedBalanceFromDeltaAccrued(
                worldState,
                args.supplyMarketId,
                supplyAccrued
            );
        }
        else if (args.amount.intent == LActions.AmountIntention.Supply) {
            (
                newSupplyBalance,
                supplyAccrued
            ) = _calculateUsingAmountStruct(worldState, args.supplyMarketId, args.amount);

            borrowAccrued = LExchange.getCost(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                borrowAccrued,
                args.orderData
            );

            newBorrowBalance = _getUpdatedBalanceFromDeltaAccrued(
                worldState,
                args.borrowMarketId,
                borrowAccrued
            );

            LTypes.SignedAccrued memory tokensReceived = LExchange.exchange(
                args.exchangeWrapper,
                supplyToken,
                borrowToken,
                supplyAccrued,
                args.orderData
            );

            require(tokensReceived.accrued.value >= supplyAccrued.accrued.value);
        }

        _updateBalance(
            worldState,
            args.borrowMarketId,
            newBorrowBalance
        );
        _updateBalance(
            worldState,
            args.supplyMarketId,
            newSupplyBalance
        );
    }

    function _liquidate(
        LActions.WorldState memory worldState,
        LActions.LiquidateArgs memory args
    )
        private
    {
        LTypes.SignedAccrued memory supplyAccrued;
        LTypes.SignedAccrued memory borrowAccrued;
        LTypes.SignedNominal memory newSupplyBalance;
        LTypes.SignedNominal memory newBorrowBalance;

        // verify that this account can be liquidated
        if (!g_accounts[args.liquidTrader][args.liquidAccount].closingTime.hasHappened()) {
            // TODO: require account is undercollateralized
            g_accounts[args.liquidTrader][args.liquidAccount].closingTime = LTime.currentTime();
        }

        // normalize the oracle prices according to the liquidation spread
        LPrice.Price memory borrowPrice = worldState.assets[args.borrowMarketId].price;
        LPrice.Price memory supplyPrice = worldState.assets[args.supplyMarketId].price;
        supplyPrice.value = g_liquidationSpread.mul(supplyPrice.value).to128();

        // calculate the nominal amounts
        if (args.amount.intent == LActions.AmountIntention.Borrow) {
            (newBorrowBalance, borrowAccrued) = _calculateUsingAmountStruct(
                worldState,
                args.borrowMarketId,
                args.amount
            );
            supplyAccrued.sign = true;
            supplyAccrued.accrued.value = LPrice.getEquivalentAmount(
                borrowAccrued.accrued.value,
                borrowPrice,
                supplyPrice
            );
            newSupplyBalance = _getUpdatedBalanceFromDeltaAccrued(
                worldState,
                args.supplyMarketId,
                supplyAccrued
            );
        }
        else if (args.amount.intent == LActions.AmountIntention.Supply) {
            (newSupplyBalance, supplyAccrued) = _calculateUsingAmountStruct(
                worldState,
                args.supplyMarketId,
                args.amount
            );
            borrowAccrued.sign = false;
            borrowAccrued.accrued.value = LPrice.getEquivalentAmount(
                supplyAccrued.accrued.value,
                supplyPrice,
                borrowPrice
            );
            newBorrowBalance = _getUpdatedBalanceFromDeltaAccrued(
                worldState,
                args.borrowMarketId,
                borrowAccrued
            );
        }

        // TODO: verify that you're not overliquidating (causing liquid account to go from pos=>neg
        // or from neg=>pos for either of the two tokens)

        // pay back the debt of the liquidated account
        _shiftBalance(
            worldState,
            args.supplyMarketId,
            args.liquidTrader,
            args.liquidAccount,
            newSupplyBalance.sub(worldState.assets[args.supplyMarketId].balance)
        );
        _shiftBalance(
            worldState,
            args.borrowMarketId,
            args.liquidTrader,
            args.liquidAccount,
            newBorrowBalance.sub(worldState.assets[args.borrowMarketId].balance)
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _setExpiry(
        LActions.WorldState memory worldState,
        LActions.SetExpiryArgs memory args
    )
        private
    {
        g_accounts[worldState.trader][worldState.account].closingTime = args.time;
    }

    // ============ Helper Functions ============

    function _calculateUsingAmountStruct(
        LActions.WorldState memory worldState,
        uint256 marketId,
        LActions.Amount memory amount
    )
        private
        pure
        returns (LTypes.SignedNominal memory newNominal, LTypes.SignedAccrued memory newAccrued)
    {
        LInterest.Index memory index = worldState.assets[marketId].index;
        LTypes.SignedNominal memory nominal = worldState.assets[marketId].balance;
        LTypes.SignedAccrued memory accrued = LInterest.nominalToAccrued(
            nominal,
            index
        );

        if (amount.denom == LActions.AmountDenomination.Accrued) {
            if (amount.ref == LActions.AmountReference.Delta) {
                newAccrued = LActions.amountToSignedAccrued(amount);
            } else if (amount.ref == LActions.AmountReference.Target) {
                newAccrued = LActions.amountToSignedAccrued(amount).sub(accrued);
            }
            newNominal = LInterest.accruedToNominal(newAccrued.add(accrued), index);
        } else if (amount.denom == LActions.AmountDenomination.Nominal) {
            if (amount.ref == LActions.AmountReference.Delta) {
                newNominal = LActions.amountToSignedNominal(amount).add(nominal);
            } else if (amount.ref == LActions.AmountReference.Target) {
                newNominal = LActions.amountToSignedNominal(amount);
            }
            newAccrued = LInterest.nominalToAccrued(newNominal, index).sub(accrued);
        }

        if (amount.intent == LActions.AmountIntention.Supply) {
            require(newAccrued.sign);
        }
        else if (amount.intent == LActions.AmountIntention.Borrow) {
            require(!newAccrued.sign);
        }
    }

    function _getUpdatedBalanceFromDeltaAccrued(
        LActions.WorldState memory worldState,
        uint256 marketId,
        LTypes.SignedAccrued memory accrued
    )
        private
        pure
        returns (LTypes.SignedNominal memory)
    {
        LInterest.Index memory index = worldState.assets[marketId].index;
        LTypes.SignedNominal memory currentBalance = worldState.assets[marketId].balance;
        LTypes.SignedAccrued memory currentAccrued = LInterest.nominalToAccrued(
            currentBalance,
            index
        );

        return LInterest.accruedToNominal(
            currentAccrued.add(accrued),
            index
        );
    }

    function _updateBalance(
        LActions.WorldState memory worldState,
        uint256 marketId,
        LTypes.SignedNominal memory newBalance
    )
        private
        pure
    {
        LTypes.SignedNominal memory oldBalance = worldState.assets[marketId].balance;
        LInterest.TotalNominal memory totalNominal = worldState.assets[marketId].totalNominal;

        // roll-back oldBalance
        if (oldBalance.sign) {
            totalNominal.borrow = LTypes.sub(totalNominal.borrow, oldBalance.nominal);
        } else {
            totalNominal.supply = LTypes.sub(totalNominal.supply, oldBalance.nominal);
        }

        // roll-forward newBalance
        if (newBalance.sign) {
            totalNominal.supply = LTypes.add(totalNominal.supply, newBalance.nominal);
        } else {
            totalNominal.borrow = LTypes.add(totalNominal.borrow, newBalance.nominal);
        }

        // verify
        require(totalNominal.supply.value >= totalNominal.borrow.value, "CANNOT BORROW MORE THAN LENT");

        // update worldState
        worldState.assets[marketId].balance = newBalance;
        worldState.assets[marketId].totalNominal = totalNominal;
    }

    // move balance to/from an external account
    function _shiftBalance(
        LActions.WorldState memory worldState,
        uint256 marketId,
        address exernalTrader,
        uint256 externalAccount,
        LTypes.SignedNominal memory deltaBalance
    )
        private
    {
        // subtract deltaBalance from external account
        g_accounts[exernalTrader][externalAccount].balances[marketId] =
            g_accounts[exernalTrader][externalAccount].balances[marketId].sub(deltaBalance);

        // add deltaBalance to user's account
        worldState.assets[marketId].balance =
            worldState.assets[marketId].balance.add(deltaBalance);

        // no need to update the gobal nominal values (they stay constant)
    }
}
