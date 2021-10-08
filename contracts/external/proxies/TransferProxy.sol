/*

    Copyright 2019 dYdX Trading Inc.

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

import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SoloMargin } from "../../protocol/SoloMargin.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title TransferProxy
 * @author Dolomite
 *
 * Contract for sending internal balances within Dolomite to other users/margin accounts easily
 */
contract TransferProxy is OnlySolo, ReentrancyGuard {
    // ============ Constants ============

    bytes32 constant FILE = "TransferProxy";

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
    public
    OnlySolo(soloMargin)
    {}

    // ============ Public Functions ============

    function transfer(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address token,
        uint amount
    )
    public
    nonReentrant
    {
        uint[] memory markets = new uint[](1);
        markets[0] = SOLO_MARGIN.getMarketIdByTokenAddress(token);

        uint[] memory amounts = new uint[](1);
        amounts[0] = amount;

        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function transferMultiple(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address[] calldata tokens,
        uint[] calldata amounts
    )
    external
    nonReentrant
    {
        SoloMargin soloMargin = SOLO_MARGIN;
        uint[] memory markets = new uint[](tokens.length);
        for (uint i = 0; i < markets.length; i++) {
            markets[i] = soloMargin.getMarketIdByTokenAddress(tokens[i]);
        }

        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function transferMultipleWithMarkets(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        uint[] calldata markets,
        uint[] calldata amounts
    )
    external
    nonReentrant
    {
        _transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function _transferMultiple(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        uint[] memory markets,
        uint[] memory amounts
    )
    internal
    {
        require(
            markets.length == amounts.length,
            "TransferProxy::_transferMultiple: INVALID_PARAMS_LENGTH"
        );

        Account.Info[] memory accounts = new Account.Info[](2);
        accounts[0] = Account.Info(msg.sender, fromAccountIndex);
        accounts[1] = Account.Info(to, toAccountIndex);

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](markets.length);
        for (uint i = 0; i < markets.length; i++) {
            Types.AssetAmount memory assetAmount;
            if (amounts[i] == uint(- 1)) {
                assetAmount = Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0);
            } else {
                assetAmount = Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amounts[i]);
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

        SOLO_MARGIN.operate(accounts, actions);
    }
}
