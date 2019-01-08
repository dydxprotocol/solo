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

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import { OnlySolo } from "./helpers/OnlySolo.sol";
import { ICallee } from "../protocol/interfaces/ICallee.sol";
import { IAutoTrader } from "../protocol/interfaces/IAutoTrader.sol";
import { Acct } from "../protocol/lib/Acct.sol";
import { Types } from "../protocol/lib/Types.sol";


/**
 * @title Expiry
 * @author dYdX
 *
 * TODO
 */
contract Expiry is
    OnlySolo,
    ICallee,
    IAutoTrader
{
    struct AccountExpiries {
        mapping (uint256 => uint256) expiryTimes;
    }

    mapping (address => mapping (uint256 => AccountExpiries)) g_accountExpiries;

    constructor (
        address soloMargin
    )
        public
        OnlySolo(soloMargin)
    {}

    function callFunction(
        address /* sender */,
        Acct.Info memory accountInfo,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {
        (
            uint256 marketId,
            uint256 expiryTime
        ) = parseCallArgs(data);

        g_accountExpiries[accountInfo.owner][accountInfo.number].expiryTimes[marketId] = expiryTime;
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 /* outputMarketId */,
        Acct.Info memory makerAccount,
        Acct.Info memory /* takerAccount */,
        Types.Par memory /* oldInputPar */,
        Types.Par memory /* newInputPar */,
        Types.Wei memory /* inputWei */,
        bytes memory /* data */
    )
        public
        // view
        returns (Types.Wei memory)
    {
        uint256 expiryTime = g_accountExpiries[makerAccount.owner][makerAccount.number]
            .expiryTimes[inputMarketId];

        require(
            block.timestamp >= expiryTime,
            "Expiry#getTradeCost: market not yet expired for account"
        );

        // TODO set the cost to the oracle price + spread or whatever we want to do
        return Types.Wei({
            sign: true,
            value: 0
        });
    }

    function parseCallArgs(
        bytes memory data
    )
        private
        pure
        returns (
            uint256,
            uint256
        )
    {
        require(
            data.length == 64,
            "Expiry:#parseCallArgs: data is not the right length"
        );

        uint256 marketId;
        uint256 expiryTime;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            marketId := mload(add(data, 32))
            expiryTime := mload(add(data, 64))
        }

        return (
            marketId,
            expiryTime
        );
    }
}
