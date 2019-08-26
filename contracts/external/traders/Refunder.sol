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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title Refunder
 * @author dYdX
 *
 * Allows refunding a user for some amount of tokens for some market.
 */
contract Refunder is
    Ownable,
    OnlySolo,
    IAutoTrader
{
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "Refunder";

    // ============ Events ============

    event LogGiverAdded(
        address giver
    );

    event LogGiverRemoved(
        address giver
    );

    event LogRefund(
        Account.Info account,
        uint256 marketId,
        uint256 amount
    );

    // ============ Storage ============

    // the addresses that are able to give funds
    mapping (address => bool) public g_givers;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address[] memory givers
    )
        public
        OnlySolo(soloMargin)
    {
        for (uint256 i = 0; i < givers.length; i++) {
            g_givers[givers[i]] = true;
        }
    }

    // ============ Admin Functions ============

    function addGiver(
        address giver
    )
        external
        onlyOwner
    {
        emit LogGiverAdded(giver);
        g_givers[giver] = true;
    }

    function removeGiver(
        address giver
    )
        external
        onlyOwner
    {
        emit LogGiverRemoved(giver);
        g_givers[giver] = false;
    }

    // ============ Only-Solo Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 /* outputMarketId */,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory /* oldInputPar */,
        Types.Par memory /* newInputPar */,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {
        Require.that(
            g_givers[takerAccount.owner],
            FILE,
            "Giver not approved",
            takerAccount.owner
        );

        Require.that(
            inputWei.isPositive(),
            FILE,
            "Refund must be positive"
        );

        emit LogRefund(
            makerAccount,
            inputMarketId,
            inputWei.value
        );

        return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Par,
            ref: Types.AssetReference.Delta,
            value: 0
        });
    }
}
