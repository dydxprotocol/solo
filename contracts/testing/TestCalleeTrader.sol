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
 * @title TestCalleeTrader
 * @author dYdX
 *
 * ICallee and IAutoTrader for testing
 */
contract TestCalleeTrader is
    ICallee,
    IAutoTrader
{
    // ============ Constants ============

    string constant FILE = "TestCalleeTrader";

    // ============ Events ============

    event DataSet(
        uint256 indexed input,
        uint256 output
    );

    // ============ Storage ============

    // input => output
    mapping (uint256 => uint256) g_data;

    // ============ Public Functions ============

    function callFunction(
        address /* sender */,
        Acct.Info memory /* account */,
        bytes memory data
    )
        public
    {
        (
            uint256 input,
            uint256 output
        ) = parseData(data);

        setData(input, output);
    }

    function getTradeCost(
        uint256 /* inputMarketId */,
        uint256 /* outputMarketId */,
        Acct.Info memory /* makerAccount */,
        Acct.Info memory /* takerAccount */,
        Types.Par memory /* oldInputPar */,
        Types.Par memory /* newInputPar */,
        Types.Wei memory /* inputWei */,
        bytes memory data
    )
        public
        returns (Types.Wei memory)
    {

        (uint256 input, ) = parseData(data);

        uint256 output = g_data[input];

        setData(input, 0);

        return Types.Wei({
            sign: true,
            value: output
        });
    }

    function setData(
        uint256 input,
        uint256 output
    )
        private
    {
        emit DataSet(input, output);
        g_data[input] = output;
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

        uint256 input;
        uint256 output;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            input := mload(add(data, 32))
            output := mload(add(data, 64))
        }

        return (
            input,
            output
        );
    }
}
