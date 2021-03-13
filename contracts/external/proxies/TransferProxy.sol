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
import { Require } from "../../protocol/lib/Require.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title PayableProxyForSoloMargin
 * @author dYdX
 *
 * Contract for wrapping/unwrapping ETH before/after interacting with Solo
 */
contract TransferProxy is
OnlySolo,
ReentrancyGuard
{
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
        uint fromAccountId,
        address token,
        address recipient,
        uint recipientId,
        uint amount
    )
    public
    nonReentrant
    {
       uint marketId = SOLO_MARGIN.getMarketIdByTokenAddress(token);
        Account.Info[] memory accounts = new Account.Info[](2);
        accounts[0] = Account.Info(msg.sender, fromAccountId);
        accounts[1] = Account.Info(recipient, recipientId);

        Types.AssetAmount memory assetAmount;
        if(amount == uint(-1)) {
            assetAmount = Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0);
        } else {
            assetAmount = Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount);
        }

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : 0,
        amount : assetAmount,
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : 1,
        data : bytes("")
        });

        SOLO_MARGIN.operate(accounts, actions);
    }
}
