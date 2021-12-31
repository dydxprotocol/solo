/*

    Copyright 2021 Dolomite.

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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { SafeERC20 } from "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import { SoloMargin } from "../../protocol/SoloMargin.sol";

import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { IRecyclable } from "../../protocol/interfaces/IRecyclable.sol";

import { OnlySolo } from "../helpers/OnlySolo.sol";

import { IERC20Detailed } from "../interfaces/IERC20Detailed.sol";


/**
 * @title RecyclableTokenProxy
 * @author Dolomite
 *
 * Contract for wrapping around tokens to control how they are deposited into Solo, to be combined with "market
 * recycling" so "throwaway tokens" like options contracts that are represented as tokens can be used with the protocol
 * and their market IDs can be safely reclaimed.
 *
 * This contract works by serving as a proxy account for a user. Meaning, a user deposits funds into Solo using this
 * contract's address as the `owner` and the user's address (converted to a uint) as the `number`. As a consequence and
 * tradeoff, users can only have one margin position open per instance of this contract (per option token).
 *
 * The reason why this contract works well with a recycling strategy is because all usages of the instance's
 * `marketId` are confined to this address as the `owner`. So, if the `marketId` is reused, it doesn't impact the user's
 * balance, since a new instance of `RecyclableTokenProxy` will be deployed for the recycled marketId. Then, the new
 * instance of `RecyclableTokenProxy` would serve as the new address for the user to interact with Solo, masking/hiding
 * the user's old (potentially) non-zero balance for that `marketId`. As a visualization, balances are mapped like so:
 *
 * `owner` --> `accountNumber` --> `marketId`
 *
 * `owner` corresponds with `address(this)`, `accountNumber` is the user's address, and `marketId` is recycled.
 *
 * Since `owner` constantly chances, the value of the mapping is able to reset, each time Solo recycles a market.
 *
 * NOTE: Contracts that reference this token and implement IExchangeWrapper must set an allowance for this contract to
 * spend `TOKEN` on the IExchangeWrapper implementor (TOKEN.approve(RecyclableTokenProxy, uint(-1)); call from
 * IExchangeWrapper).
 *
 * Another note on balances: Part of the idea behind the implementation is to restrict usage of the recyclable token to
 * only be held in `address(this)` owner address / Account.Info. The only time this marketId may reside in an `owner`
 * that is NOT this contract is after a liquidation. This should not matter though, since the liquidator will withdraw
 * the token to sell all of it for the owed collateral. So, after the liquidation transaction is over, the liquidator
 * should have a zero balance anyway. Keeping the this token in the liquidators Solo account, would cause catastrophic
 * issues for the protocol when the `marketId` is recycled, since the liquidator's balance would be dirty upon reuse of
 * the `marketId`. To mitigate this issue, a special liquidation contract should be created that purposely performs a
 * withdrawal (down to zero) of this recyclable token's underlying `TOKEN`. Even if an implementing liquidation contract
 * messes this up, there is a check done in `OperationImpl._verifyFinalState` that prevents this from happening.
 */
contract RecyclableTokenProxy is IERC20, IERC20Detailed, IRecyclable, OnlySolo, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    bytes32 constant FILE = "RecyclableTokenProxy";

    // ============ Public Variables ============

    IERC20 public TOKEN;
    uint256 public MARKET_ID;
    bool public isRecycled;
    mapping(address => bool) public userToHasWithdrawnAfterRecycle;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address token
    )
    public
    OnlySolo(soloMargin)
    {
        TOKEN = IERC20(token);
        isRecycled = false;
    }

    // ============ Public Functions ============

    function initialize() external onlySolo(msg.sender) {
        Require.that(
            MARKET_ID == 0,
            FILE,
            "already initialized"
        );

        MARKET_ID = SOLO_MARGIN.getMarketIdByTokenAddress(address(this));

        Require.that(
            SOLO_MARGIN.getMarketIsClosing(MARKET_ID),
            FILE,
            "market cannot allow borrowing"
        );
    }

    function depositIntoSolo(uint amount) public nonReentrant {
        Require.that(
            !isRecycled,
            FILE,
            "cannot deposit when recycled"
        );

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), uint(msg.sender));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
        actionType: Actions.ActionType.Deposit,
        accountId: 0,
        amount: Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount),
        primaryMarketId: MARKET_ID,
        secondaryMarketId: uint(-1),
        otherAddress: address(this),
        otherAccountId: uint(-1),
        data: bytes("")
        });

        SOLO_MARGIN.operate(accounts, actions);
    }

    function withdrawFromSolo(uint amount) public nonReentrant {
        Require.that(
            !isRecycled,
            FILE,
            "cannot withdraw when recycled"
        );

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), uint(msg.sender));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
        actionType: Actions.ActionType.Withdraw,
        accountId: 0,
        amount: Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount),
        primaryMarketId: MARKET_ID,
        secondaryMarketId: uint(-1),
        otherAddress: msg.sender,
        otherAccountId: uint(-1),
        data: bytes("")
        });

        SOLO_MARGIN.operate(accounts, actions);
    }

    function recycle() external onlySolo(msg.sender) {
        Require.that(
            SOLO_MARGIN.getRecyclableMarkets(1)[0] == MARKET_ID,
            FILE,
            "not recyclable"
        );

        isRecycled = true;
    }

    function withdrawAfterRecycle() public {
        Require.that(
            isRecycled,
            FILE,
            "not recycled yet"
        );
        Require.that(
            !userToHasWithdrawnAfterRecycle[msg.sender],
            FILE,
            "user already withdrew"
        );
        userToHasWithdrawnAfterRecycle[msg.sender] = true;
        TOKEN.safeTransfer(msg.sender, balanceOf(msg.sender));
    }

    function trade(
        address borrowToken,
        uint borrowAmount,
        address exchangeWrapper,
        bytes calldata tradeData
    ) external {
        Require.that(
            !isRecycled,
            FILE,
            "cannot trade when recycled"
        );

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), uint(msg.sender));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
        actionType: Actions.ActionType.Sell,
        accountId: 0,
        amount: Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, borrowAmount),
        primaryMarketId: SOLO_MARGIN.getMarketIdByTokenAddress(borrowToken),
        secondaryMarketId: MARKET_ID,
        otherAddress: exchangeWrapper,
        otherAccountId: uint(-1),
        data: tradeData
        });

        SOLO_MARGIN.operate(accounts, actions);
    }

    // ============ ERC20 Functions ============

    function name() external view returns (string memory) {
        return string(abi.encodePacked("Recyclable: ", IERC20Detailed(address(TOKEN)).name()));
    }

    function symbol() external view returns (string memory) {
        return string(abi.encodePacked("r", IERC20Detailed(address(TOKEN)).symbol()));
    }

    function decimals() external view returns (uint8) {
        return IERC20Detailed(address(TOKEN)).decimals();
    }

    function totalSupply() external view returns (uint256) {
        return TOKEN.totalSupply();
    }

    function balanceOf(address account) public view returns (uint256) {
        if (userToHasWithdrawnAfterRecycle[account]) {
            return 0;
        } else {
            return SOLO_MARGIN.getAccountPar(Account.Info(address(this), uint(account)), MARKET_ID).value;
        }
    }

    function transfer(address recipient, uint256 amount) external onlySolo(msg.sender) returns (bool) {
        // This condition fails when the market is recycled but Solo attempts to call this contract still
        Require.that(
            SOLO_MARGIN.getMarketTokenAddress(MARKET_ID) == address(this),
            FILE,
            "invalid state"
        );
        Require.that(
            !isRecycled,
            FILE,
            "cannot transfer while recycled"
        );

        TOKEN.safeTransfer(recipient, amount);
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address, address) external view returns (uint256) {
        return 0;
    }

    function approve(address, uint256) external returns (bool) {
        return false;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external onlySolo(msg.sender) returns (bool) {
        // transferFrom should always send tokens to SOLO_MARGIN
        Require.that(
            recipient == address(msg.sender), // msg.sender eq SOLO_MARGIN
            FILE,
            "invalid recipient"
        );
        // This condition fails when the market is recycled but Solo attempts to call this contract still
        Require.that(
            SOLO_MARGIN.getMarketTokenAddress(MARKET_ID) == address(this),
            FILE,
            "invalid state"
        );
        Require.that(
            !isRecycled,
            FILE,
            "cannot transfer while recycled"
        );

        if (sender == address(this)) {
            // token is being transferred from here to Solo, for a deposit. The market's total par was already updated
            // before the call to `transferFrom`. Make sure enough was transferred in.
            // This implementation allows the user to "steal" funds from users that blindly send TOKEN into this
            // contract, without calling properly calling the `deposit` function to set their balances.
            Require.that(
                TOKEN.balanceOf(sender) >= SOLO_MARGIN.getMarketTotalPar(MARKET_ID).supply,
                FILE,
                "insufficient balance for deposit"
            );
            emit Transfer(address(this), recipient, amount);
        } else {
            // TOKEN is being traded via IExchangeWrapper, transfer the tokens into this contract
            TOKEN.safeTransferFrom(sender, address(this), amount);
            // this transfer event is technically incorrect since the tokens are really sent from address(this) to
            // recipient, not `sender`. However, we'll let it go.
            emit Transfer(sender, recipient, amount);
        }
        return true;
    }

}
