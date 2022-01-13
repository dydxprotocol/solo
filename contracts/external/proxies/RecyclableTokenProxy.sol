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

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { IDolomiteMargin } from "../../protocol/interfaces/IDolomiteMargin.sol";
import { IERC20Detailed } from "../../protocol/interfaces/IERC20Detailed.sol";
import { IRecyclable } from "../../protocol/interfaces/IRecyclable.sol";

import { OnlyDolomiteMargin } from "../helpers/OnlyDolomiteMargin.sol";


import { IExpiry } from "../interfaces/IExpiry.sol";


/**
 * @title RecyclableTokenProxy
 * @author Dolomite
 *
 * Contract for wrapping around tokens to control how they are deposited into DolomiteMargin, to be combined with "market
 * recycling" so "throwaway tokens" like options contracts that are represented as tokens can be used with the protocol
 * and their market IDs can be safely reclaimed.
 *
 * This contract works by serving as a proxy account for a user. Meaning, a user deposits funds into DolomiteMargin using this
 * contract's address as the `owner` and the user's address (converted to a uint) as the `number`. As a consequence and
 * tradeoff, users can only have one margin position open per instance of this contract (per option token).
 *
 * The reason why this contract works well with a recycling strategy is because all usages of the instance's
 * `marketId` are confined to this address as the `owner`. So, if the `marketId` is reused, it doesn't impact the user's
 * balance, since a new instance of `RecyclableTokenProxy` will be deployed for the recycled marketId. Then, the new
 * instance of `RecyclableTokenProxy` would serve as the new address for the user to interact with DolomiteMargin, masking/hiding
 * the user's old (potentially) non-zero balance for that `marketId`. As a visualization, balances are mapped like so:
 *
 * `owner` --> `accountNumber` --> `marketId`
 *
 * `owner` corresponds with `address(this)`, `accountNumber` is the user's address, and `marketId` is recycled.
 *
 * Since `owner` constantly chances, the value of the mapping is able to reset, each time DolomiteMargin recycles a market.
 *
 * NOTE: Contracts that reference this token and implement IExchangeWrapper must set an allowance for this contract to
 * spend `TOKEN` on the IExchangeWrapper implementor (TOKEN.approve(RecyclableTokenProxy, uint(-1)); call from
 * IExchangeWrapper).
 *
 * Another note on balances: Part of the idea behind the implementation is to restrict usage of the recyclable token to
 * only be held in `address(this)` owner address / Account.Info. The only time this marketId may reside in an `owner`
 * that is NOT this contract is after a liquidation. This should not matter though, since the liquidator will withdraw
 * the token to sell all of it for the owed collateral. So, after the liquidation transaction is over, the liquidator
 * should have a zero balance anyway. Keeping the this token in the liquidators DolomiteMargin account, would cause catastrophic
 * issues for the protocol when the `marketId` is recycled, since the liquidator's balance would be dirty upon reuse of
 * the `marketId`. To mitigate this issue, a special liquidation contract should be created that purposely performs a
 * withdrawal (down to zero) of this recyclable token's underlying `TOKEN`. Even if an implementing liquidation contract
 * messes this up, there is a check done in `OperationImpl._verifyFinalState` that prevents this from happening.
 */
contract RecyclableTokenProxy is IERC20Detailed, IRecyclable, OnlyDolomiteMargin, ReentrancyGuard {
    using SafeERC20 for IERC20Detailed;

    // ============ Constants ============

    bytes32 internal constant FILE = "RecyclableTokenProxy";

    // ============ Public Variables ============

    IERC20Detailed public TOKEN;
    IExpiry public EXPIRY;
    uint256 public MARKET_ID;
    bool public isRecycled;
    mapping(address => mapping (uint256 => bool)) public userToAccountNumberHasWithdrawnAfterRecycle;

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        address token,
        address expiry,
        uint maxExpirationTimestamp
    )
    public
    OnlyDolomiteMargin(dolomiteMargin)
    {
        TOKEN = IERC20Detailed(token);
        EXPIRY = IExpiry(expiry);
        MAX_EXPIRATION_TIMESTAMP = maxExpirationTimestamp;
        isRecycled = false;
    }

    // ============ Public Functions ============

    function initialize() external onlyDolomiteMargin(msg.sender) {
        Require.that(
            MARKET_ID == 0,
            FILE,
            "already initialized"
        );

        MARKET_ID = DOLOMITE_MARGIN.getMarketIdByTokenAddress(address(this));

        Require.that(
            DOLOMITE_MARGIN.getMarketIsClosing(MARKET_ID),
            FILE,
            "market cannot allow borrowing"
        );
        // This statement is in this function because of an "InternalCompileError" error that occurs in the constructor
        Require.that(
            MAX_EXPIRATION_TIMESTAMP >= block.timestamp,
            FILE,
            "invalid expiration timestamp",
            MAX_EXPIRATION_TIMESTAMP
        );
    }

    function recycle() external onlyDolomiteMargin(msg.sender) {
        Require.that(
            DOLOMITE_MARGIN.getRecyclableMarkets(1)[0] == MARKET_ID,
            FILE,
            "not recyclable"
        );

        isRecycled = true;
    }

    function getAccountNumber(
        Account.Info memory account
    ) public pure returns (uint256) {
        return _getAccountNumber(account.owner, account.number);
    }

    function getAccountPar(
        Account.Info memory account
    ) public view returns (Types.Par memory) {
        if (userToAccountNumberHasWithdrawnAfterRecycle[account.owner][account.number]) {
            return Types.zeroPar();
        } else {
            return DOLOMITE_MARGIN.getAccountParNoMarketCheck(
                Account.Info(address(this), getAccountNumber(account)),
                MARKET_ID
            );
        }
    }

    function depositIntoDolomiteMargin(uint accountNumber, uint amount) public nonReentrant {
        Require.that(
            !isRecycled,
            FILE,
            "cannot deposit when recycled"
        );
        Require.that(
            !isExpired(),
            FILE,
            "market is expired",
            MAX_EXPIRATION_TIMESTAMP
        );

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), _getAccountNumber(msg.sender, accountNumber));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Deposit,
            accountId: 0,
            // solium-disable-next-line arg-overflow
            amount: Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount),
            primaryMarketId: MARKET_ID,
            secondaryMarketId: uint(-1),
            otherAddress: address(this),
            otherAccountId: uint(-1),
            data: bytes("")
        });

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    function withdrawFromDolomiteMargin(uint accountNumber, uint amount) public nonReentrant {
        Require.that(
            !isRecycled,
            FILE,
            "cannot withdraw when recycled"
        );

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), _getAccountNumber(msg.sender, accountNumber));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Withdraw,
            accountId: 0,
            // solium-disable-next-line arg-overflow
            amount: Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount),
            primaryMarketId: MARKET_ID,
            secondaryMarketId: uint(-1),
            otherAddress: msg.sender,
            otherAccountId: uint(-1),
            data: bytes("")
        });

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    function withdrawAfterRecycle(uint accountNumber) public {
        Require.that(
            isRecycled,
            FILE,
            "not recycled yet"
        );
        Require.that(
            !userToAccountNumberHasWithdrawnAfterRecycle[msg.sender][accountNumber],
            FILE,
            "user already withdrew"
        );
        userToAccountNumberHasWithdrawnAfterRecycle[msg.sender][accountNumber] = true;
        TOKEN.safeTransfer(
            msg.sender,
            DOLOMITE_MARGIN.getAccountParNoMarketCheck(
                Account.Info(address(this), _getAccountNumber(msg.sender, accountNumber)),
                MARKET_ID
            ).value
        );
    }

    function trade(
        uint accountNumber,
        Types.AssetAmount memory supplyAmount, // equivalent to amounts[amounts.length - 1]
        address borrowToken,
        Types.AssetAmount memory borrowAmount,
        address exchangeWrapper,
        uint expirationTimestamp,
        bool isOpen,
        bytes memory tradeData
    ) public {
        Require.that(
            !isRecycled,
            FILE,
            "cannot trade when recycled"
        );
        Require.that(
            !isExpired(),
            FILE,
            "market is expired",
            MAX_EXPIRATION_TIMESTAMP
        );
        Require.that(
            expirationTimestamp > block.timestamp,
            FILE,
            "expiration timestamp too low",
            expirationTimestamp
        );
        Require.that(
            expirationTimestamp <= MAX_EXPIRATION_TIMESTAMP,
            FILE,
            "expiration timestamp too high",
            expirationTimestamp
        );

        uint marketId = MARKET_ID;
        uint borrowMarketId = DOLOMITE_MARGIN.getMarketIdByTokenAddress(borrowToken);

        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info(address(this), _getAccountNumber(msg.sender, accountNumber));

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Sell,
            accountId: 0,
            amount: isOpen ? borrowAmount : supplyAmount,
            primaryMarketId: isOpen ? borrowMarketId : marketId,
            secondaryMarketId: isOpen ? marketId : borrowMarketId,
            otherAddress: exchangeWrapper,
            otherAccountId: 0,
            data: tradeData
        });

        actions[1] = Actions.ActionArgs({
            actionType : Actions.ActionType.Call,
            accountId : 0,
            // solium-disable-next-line arg-overflow
            amount : Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, 0),
            primaryMarketId : 0,
            secondaryMarketId : 0,
            otherAddress : address(EXPIRY),
            otherAccountId : 0,
            data : abi.encode(
                    IExpiry.CallFunctionType.SetExpiry,
                    _getExpiryArgs(accounts[0], borrowMarketId, isOpen ? expirationTimestamp : 0)
                )
        });

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    // ============ ERC20 Functions ============

    function name() public view returns (string memory) {
        (bool isSuccess, bytes memory data) = address(TOKEN).staticcall(abi.encodePacked(TOKEN.name.selector));
        if (isSuccess && data.length > 0) {
            return string(abi.encodePacked("Recyclable: ", abi.decode(data, (string))));
        } else {
            return "Recyclable: Dolomite Token";
        }
    }

    function symbol() public view returns (string memory) {
        (bool isSuccess, bytes memory data) = address(TOKEN).staticcall(abi.encodePacked(TOKEN.symbol.selector));
        if (isSuccess && data.length > 0) {
            return string(abi.encodePacked("r", abi.decode(data, (string))));
        } else {
            return "rDOLO_TOKEN";
        }
    }

    function decimals() public view returns (uint8) {
        (bool isSuccess, bytes memory data) = address(TOKEN).staticcall(abi.encodePacked(TOKEN.decimals.selector));
        if (isSuccess && data.length > 0) {
            return abi.decode(data, (uint8));
        } else {
            return 18;
        }
    }

    function totalSupply() public view returns (uint256) {
        return TOKEN.totalSupply();
    }

    function balanceOf(address account) public view returns (uint256) {
        if (account == address(DOLOMITE_MARGIN)) {
            // The effective balance of DolomiteMargin is the balance held of the underlying token in this contract
            return TOKEN.balanceOf(address(this));
        }

        uint accountNumber = 0;
        if (userToAccountNumberHasWithdrawnAfterRecycle[account][accountNumber]) {
            return 0;
        } else {
            return getAccountPar(Account.Info(account, accountNumber)).value;
        }
    }

    function transfer(address recipient, uint256 amount) public onlyDolomiteMargin(msg.sender) returns (bool) {
        // This condition fails when the market is recycled but DolomiteMargin attempts to call this contract still
        Require.that(
            DOLOMITE_MARGIN.getMarketTokenAddress(MARKET_ID) == address(this),
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

    function allowance(address, address) public view returns (uint256) {
        return 0;
    }

    function approve(address, uint256) public returns (bool) {
        return false;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public onlyDolomiteMargin(msg.sender) returns (bool) {
        // transferFrom should always send tokens to DOLOMITE_MARGIN
        Require.that(
            to == address(msg.sender), // msg.sender eq DOLOMITE_MARGIN
            FILE,
            "invalid recipient"
        );
        Require.that(
            !isRecycled,
            FILE,
            "cannot transfer while recycled"
        );
        // This condition fails when the market is recycled but DolomiteMargin attempts to call this contract anyway
        Require.that(
            DOLOMITE_MARGIN.getMarketTokenAddress(MARKET_ID) == address(this),
            FILE,
            "invalid state"
        );

        if (from == address(this)) {
            // token is being transferred from here to DolomiteMargin, for a deposit. The market's total par was already updated
            // before the call to `transferFrom`. Make sure enough was transferred in.
            // This implementation allows the user to "steal" funds from users that blindly send TOKEN into this
            // contract, without calling properly calling the `deposit` function to set their balances.
            Require.that(
                TOKEN.balanceOf(address(this)) >= DOLOMITE_MARGIN.getMarketTotalPar(MARKET_ID).supply,
                FILE,
                "insufficient balance for deposit"
            );
            emit Transfer(address(this), to, amount);
        } else {
            // TOKEN is being traded via IExchangeWrapper, transfer the tokens into this contract
            TOKEN.safeTransferFrom(from, address(this), amount);

            // The market's total par was already updated before the call to `transferFrom`. Make sure enough was
            // transferred in. This implementation allows the user to "steal" funds from users that blindly send TOKEN
            // into this contract, without calling properly calling the `deposit` function to set their balances.
            Require.that(
                TOKEN.balanceOf(address(this)) >= DOLOMITE_MARGIN.getMarketTotalPar(MARKET_ID).supply,
                FILE,
                "insufficient balance for deposit"
            );

            // this transfer event is technically incorrect since the tokens are really sent from address(this) to
            // recipient, not `sender`. However, we'll let it go.
            emit Transfer(from, to, amount);
        }
        return true;
    }

    // ============ Private Functions ============

    function _getAccountNumber(address owner, uint number) private pure returns (uint256) {
        return uint(keccak256(abi.encode(owner, number)));
    }

    function _getExpiryArgs(
        Account.Info memory account,
        uint marketId,
        uint expirationTimestamp
    ) private view returns (IExpiry.SetExpiryArg[] memory) {
        IExpiry.SetExpiryArg[] memory expiryArgs = new IExpiry.SetExpiryArg[](1);
        expiryArgs[0] = IExpiry.SetExpiryArg({
            account : account,
            marketId : marketId,
            timeDelta : expirationTimestamp == 0 ? 0 : uint32(expirationTimestamp - block.timestamp),
            forceUpdate : true
        });
        return expiryArgs;
    }

}
