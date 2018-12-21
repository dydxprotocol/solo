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

pragma solidity 0.5.2;
pragma experimental ABIEncoderV2;

import { Storage } from "./Storage.sol";
import { WorldManager } from "./WorldManager.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { Actions } from "../lib/Actions.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Time } from "../lib/Time.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title TransactionLogic
 * @author dYdX
 *
 * Logic for processing transactions
 */
contract TransactionLogic is
    Storage,
    WorldManager,
    ReentrancyGuard
{
    using Math for uint256;
    using SafeMath for uint256;
    using SafeMath for uint128;
    using Time for uint32;

    // ============ Public Functions ============

    function transact(
        AccountInfo[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        nonReentrant
    {
        WorldState memory worldState = wsInitialize(accounts);

        for (uint256 i = 0; i < args.length; i++) {
            _transact(worldState, args[i]);
        }

        wsStore(worldState);
    }

    // ============ Private Functions ============

    function _transact(
        WorldState memory worldState,
        Actions.TransactionArgs memory args
    )
        private
    {
        Actions.TransactionType ttype = args.transactionType;

        if (ttype == Actions.TransactionType.Deposit) {
            _deposit(worldState, Actions.parseDepositArgs(args));
        }
        else if (ttype == Actions.TransactionType.Withdraw) {
            _withdraw(worldState, Actions.parseWithdrawArgs(args));
        }
        else if (ttype == Actions.TransactionType.Transfer) {
            _transfer(worldState, Actions.parseTransferArgs(args));
        }
        else if (ttype == Actions.TransactionType.Buy) {
            _buy(worldState, Actions.parseBuyArgs(args));
        }
        else if (ttype == Actions.TransactionType.Sell) {
            _sell(worldState, Actions.parseSellArgs(args));
        }
        else if (ttype == Actions.TransactionType.Liquidate) {
            _liquidate(worldState, Actions.parseLiquidateArgs(args));
        }
    }

    function _deposit(
        WorldState memory worldState,
        Actions.DepositArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        Types.Wei memory deltaWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        address token = wsGetToken(worldState, args.marketId);

        require(msg.sender == args.from || g_trustedAddress[args.from][msg.sender]);

        // requires a positive deltaWei
        Token.transferIn(token, args.from, deltaWei);
    }

    function _withdraw(
        WorldState memory worldState,
        Actions.WithdrawArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        Types.Wei memory deltaWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        address token = wsGetToken(worldState, args.marketId);

        // requires a negative deltaWei
        Token.transferOut(token, args.to, deltaWei);
    }

    function _transfer(
        WorldState memory worldState,
        Actions.TransferArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.accountId);
        wsSetCheckPerimissions(worldState, args.otherAccountId);

        Types.Wei memory deltaWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.accountId,
            args.marketId,
            args.amount
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.otherAccountId,
            args.marketId,
            deltaWei.negative()
        );
    }

    function _buy(
        WorldState memory worldState,
        Actions.BuyArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address borrowToken = wsGetToken(worldState, args.sellMarketId);
        address supplyToken = wsGetToken(worldState, args.buyMarketId);
        Types.Wei memory supplyWei;
        Types.Wei memory borrowWei;

        supplyWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.accountId,
            args.buyMarketId,
            args.amount
        );

        borrowWei = Exchange.getCost(
            args.exchangeWrapper,
            supplyToken,
            borrowToken,
            borrowWei,
            args.orderData
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.accountId,
            args.sellMarketId,
            borrowWei
        );

        Types.Wei memory tokensReceived = Exchange.exchange(
            args.exchangeWrapper,
            supplyToken,
            borrowToken,
            borrowWei,
            args.orderData
        );

        require(tokensReceived.value >= supplyWei.value);
    }

    function _sell(
        WorldState memory worldState,
        Actions.SellArgs memory args
    )
        private
    {
        wsSetCheckPerimissions(worldState, args.accountId);

        address borrowToken = wsGetToken(worldState, args.sellMarketId);
        address supplyToken = wsGetToken(worldState, args.buyMarketId);
        Types.Wei memory supplyWei;
        Types.Wei memory borrowWei;

        borrowWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.accountId,
            args.sellMarketId,
            args.amount
        );

        supplyWei = Exchange.exchange(
            args.exchangeWrapper,
            supplyToken,
            borrowToken,
            borrowWei,
            args.orderData
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.accountId,
            args.buyMarketId,
            supplyWei
        );
    }

    function _liquidate(
        WorldState memory worldState,
        Actions.LiquidateArgs memory args
    )
        private
        view
    {
        wsSetCheckPerimissions(worldState, args.stableAccountId);
        // doesn't mark liquidAccountId for permissions

        // verify that this account can be liquidated
        if (!wsGetLiquidationTime(worldState, args.liquidAccountId).hasHappened()) {
            require(!_isCollateralized(worldState, args.liquidAccountId));
            wsSetLiquidationTime(worldState, args.liquidAccountId, Time.currentTime());
        }

        // verify that underwater is being repaid
        require(!wsGetBalance(worldState, args.liquidAccountId, args.underwaterMarketId).sign);

        // verify that the liquidated account has collateral
        require(wsGetBalance(worldState, args.liquidAccountId, args.collateralMarketId).sign);


        // calculate the underwater to pay back
        Types.Wei memory underwaterWei = wsSetBalanceFromAssetAmount(
            worldState,
            args.liquidAccountId,
            args.underwaterMarketId,
            args.amount
        );

        Types.Wei memory collateralWei = _getCollateralWei(
            worldState,
            underwaterWei,
            args.underwaterMarketId,
            args.collateralMarketId
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.liquidAccountId,
            args.collateralMarketId,
            collateralWei
        );

        // verify that underwater is not overpaid
        require(
            0 == wsGetBalance(worldState, args.liquidAccountId, args.underwaterMarketId).value
            || !wsGetBalance(worldState, args.liquidAccountId, args.underwaterMarketId).sign
        );

        // verify that collateral is not overused
        require(
            0 == wsGetBalance(worldState, args.liquidAccountId, args.collateralMarketId).value
            || wsGetBalance(worldState, args.liquidAccountId, args.collateralMarketId).sign
        );

        wsSetBalanceFromDeltaWei(
            worldState,
            args.stableAccountId,
            args.collateralMarketId,
            collateralWei.negative()
        );
        wsSetBalanceFromDeltaWei(
            worldState,
            args.stableAccountId,
            args.underwaterMarketId,
            underwaterWei.negative()
        );

        // TODO: check if the liquidated account has only negative values left. then VAPORIZE it by
        // reducing the index of the negative token and then wiping away the negative value
    }

    function _getCollateralWei(
        WorldState memory worldState,
        Types.Wei memory underwaterWei,
        uint256 underwaterMarketId,
        uint256 collateralMarketId
    )
        private
        view
        returns (Types.Wei memory)
    {
        require(underwaterWei.sign);

        Monetary.Price memory underwaterPrice = wsGetPrice(worldState, underwaterMarketId);
        Monetary.Price memory collateralPrice = wsGetPrice(worldState, collateralMarketId);

        // get the equal-value amount of collateral wei
        Types.Wei memory collateralWei;
        collateralWei.sign = false;
        collateralWei.value = Math.getPartial(
            underwaterWei.value,
            underwaterPrice.value,
            collateralPrice.value
        );

        // boost the amount of collateral by the liquidation spread
        collateralWei.value = Decimal.mul(wsGetLiquidationSpread(worldState), collateralWei.value);
        return collateralWei;
    }
}
