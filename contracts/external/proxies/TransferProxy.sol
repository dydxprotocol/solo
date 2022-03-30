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

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { IDolomiteMargin } from "../../protocol/interfaces/IDolomiteMargin.sol";

import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { Require } from "../../protocol/lib/Require.sol";

import { OnlyDolomiteMargin } from "../helpers/OnlyDolomiteMargin.sol";

import { ITransferProxy } from "../interfaces/ITransferProxy.sol";


/**
 * @title TransferProxy
 * @author Dolomite
 *
 * Contract for sending internal balances within Dolomite to other users/margin accounts easily
 */
contract TransferProxy is ITransferProxy, OnlyDolomiteMargin, ReentrancyGuard {

    // ============ Constants ============

    bytes32 constant FILE = "TransferProxy";

    // ============ State Variables ============

    mapping(address => bool) public isCallerTrusted;

    // ============ Modifiers ============

    modifier isAuthorized(address sender) {
        Require.that(
            isCallerTrusted[sender],
            FILE,
            "unauthorized"
        );
        _;
    }

    // ============ Constructor ============

    constructor (
        address dolomiteMargin
    )
    public
    OnlyDolomiteMargin(dolomiteMargin)
    {}

    // ============ External Functions ============

    function setIsCallerTrusted(address caller, bool isTrusted) external {
        Require.that(
            DOLOMITE_MARGIN.getIsGlobalOperator(msg.sender),
            FILE,
            "unauthorized"
        );
        isCallerTrusted[caller] = isTrusted;
    }

    function transfer(
        uint256 fromAccountIndex,
        address to,
        uint256 toAccountIndex,
        address token,
        uint256 amountWei
    )
        external
        nonReentrant
        isAuthorized(msg.sender)
    {
        uint256[] memory markets = new uint256[](1);
        markets[0] = DOLOMITE_MARGIN.getMarketIdByTokenAddress(token);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountWei;

        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function transferMultiple(
        uint256 fromAccountIndex,
        address to,
        uint256 toAccountIndex,
        address[] calldata tokens,
        uint256[] calldata amountsWei
    )
        external
        nonReentrant
        isAuthorized(msg.sender)
    {
        IDolomiteMargin dolomiteMargin = DOLOMITE_MARGIN;
        uint256[] memory markets = new uint256[](tokens.length);
        for (uint256 i = 0; i < markets.length; i++) {
            markets[i] = dolomiteMargin.getMarketIdByTokenAddress(tokens[i]);
        }

        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amountsWei
        );
    }

    function transferMultipleWithMarkets(
        uint256 fromAccountIndex,
        address to,
        uint256 toAccountIndex,
        uint256[] calldata markets,
        uint256[] calldata amountsWei
    )
        external
        nonReentrant
        isAuthorized(msg.sender)
    {
        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amountsWei
        );
    }

    function _transferMultiple(
        uint256 fromAccountIndex,
        address to,
        uint256 toAccountIndex,
        uint256[] memory markets,
        uint256[] memory amounts
    )
        internal
    {
        Require.that(
            markets.length == amounts.length,
            FILE,
            "invalid params length"
        );

        Account.Info[] memory accounts = new Account.Info[](2);
        accounts[0] = Account.Info(msg.sender, fromAccountIndex);
        accounts[1] = Account.Info(to, toAccountIndex);

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](markets.length);
        for (uint i = 0; i < markets.length; i++) {
            Types.AssetAmount memory assetAmount;
            if (amounts[i] == uint(- 1)) {
                assetAmount = Types.AssetAmount(
                    true,
                    Types.AssetDenomination.Wei,
                    Types.AssetReference.Target,
                    0
                );
            } else {
                assetAmount = Types.AssetAmount(
                    false,
                    Types.AssetDenomination.Wei,
                    Types.AssetReference.Delta,
                    amounts[i]
                );
            }

            actions[i] = Actions.ActionArgs({
                actionType : Actions.ActionType.Transfer,
                accountId : 0,
                amount : assetAmount,
                primaryMarketId : markets[i],
                secondaryMarketId : uint(- 1),
                otherAddress : address(0),
                otherAccountId : 1,
                data : bytes("")
            });
        }

        DOLOMITE_MARGIN.operate(accounts, actions);
    }
}
