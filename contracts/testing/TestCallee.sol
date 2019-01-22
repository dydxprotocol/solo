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

import { ICallee } from "../protocol/interfaces/ICallee.sol";
import { IAutoTrader } from "../protocol/interfaces/IAutoTrader.sol";
import { Acct } from "../protocol/lib/Acct.sol";
import { Math } from "../protocol/lib/Math.sol";
import { Require } from "../protocol/lib/Require.sol";
import { Time } from "../protocol/lib/Time.sol";
import { Types } from "../protocol/lib/Types.sol";


/**
 * @title TestCallee
 * @author dYdX
 *
 * ICallee for testing
 */
contract TestCallee is
    ICallee
{
    // ============ Constants ============

    string constant FILE = "TestCallee";

    // ============ Events ============

    event Called(
        address indexed sender,
        address indexed accountOwner,
        uint256 accountNumber,
        uint256 accountData,
        uint256 senderData
    );

    // ============ Storage ============

    // owner => number => data
    mapping (address => mapping (uint256 => uint256)) g_account;

    // sender => data
    mapping (address => uint256) g_sender;

    // ============ Public Functions ============

    function getAccountData(
        Acct.Info memory account
    )
        public
        view
        returns (uint256)
    {
        return g_account[account.owner][account.number];
    }

    function getSenderData(
        address sender
    )
        public
        view
        returns (uint256)
    {
        return g_sender[sender];
    }

    // ============ ICallee Functions ============

    function callFunction(
        address sender,
        Acct.Info memory account,
        bytes memory data
    )
        public
    {
        (
            uint256 accountData,
            uint256 senderData
        ) = parseData(data);

        emit Called(
            sender,
            account.owner,
            account.number,
            accountData,
            senderData
        );

        g_account[account.owner][account.number] = accountData;
        g_sender[sender] = senderData;
    }

    // ============ Private Functions ============

    function parseData(
        bytes memory data
    )
        private
        pure
        returns (
            uint256,
            uint256
        )
    {
        Require.that(
            data.length == 64,
            FILE,
            "Call data invalid length"
        );

        uint256 accountData;
        uint256 senderData;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            accountData := mload(add(data, 32))
            senderData := mload(add(data, 64))
        }

        return (
            accountData,
            senderData
        );
    }
}
