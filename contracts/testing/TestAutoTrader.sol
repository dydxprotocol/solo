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

import { IAutoTrader } from "../protocol/interfaces/IAutoTrader.sol";
import { Acct } from "../protocol/lib/Acct.sol";
import { Math } from "../protocol/lib/Math.sol";
import { Require } from "../protocol/lib/Require.sol";
import { Time } from "../protocol/lib/Time.sol";
import { Types } from "../protocol/lib/Types.sol";


/**
 * @title TestAutoTrader
 * @author dYdX
 *
 * IAutoTrader for testing
 */
contract TestAutoTrader is
    IAutoTrader
{
    // ============ Constants ============

    string constant FILE = "TestAutoTrader";

    // ============ Events ============

    event DataSet(
        uint256 indexed input,
        uint256 output
    );

    // ============ Storage ============

    // input => output
    mapping (uint256 => uint256) g_data;

    uint256 g_inputMarketId;
    uint256 g_outputMarketId;
    Acct.Info g_makerAccount;
    Acct.Info g_takerAccount;
    Types.Par g_oldInputPar;
    Types.Par g_newInputPar;
    Types.Wei g_inputWei;

    // ============ Testing Functions ============

    function setData(
        uint256 input,
        uint256 output
    )
        public
    {
        setDataInternal(input, output);
    }

    function setRequireInputMarketId(
        uint256 inputMarketId
    )
        public
    {
        g_inputMarketId = inputMarketId;
    }

    function setRequireOutputMarketId(
        uint256 outputMarketId
    )
        public
    {
        g_outputMarketId = outputMarketId;
    }

    function setRequireMakerAccount(
        Acct.Info memory account
    )
        public
    {
        g_makerAccount = account;
    }

    function setRequireTakerAccount(
        Acct.Info memory account
    )
        public
    {
        g_takerAccount = account;
    }

    function setRequireOldInputPar(
        Types.Par memory oldInputPar
    )
        public
    {
        g_oldInputPar = oldInputPar;
    }

    function setRequireNewInputPar(
        Types.Par memory newInputPar
    )
        public
    {
        g_newInputPar = newInputPar;
    }

    function setRequireInputWei(
        Types.Wei memory inputWei
    )
        public
    {
        g_inputWei = inputWei;
    }

    // ============ AutoTrader Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Acct.Info memory makerAccount,
        Acct.Info memory takerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        returns (Types.Wei memory)
    {
        if (g_inputMarketId != 0) {
            require(g_inputMarketId == inputMarketId);
        }
        if (g_outputMarketId != 0) {
            require(g_outputMarketId == outputMarketId);
        }
        if (g_makerAccount.owner != address(0)) {
            require(g_makerAccount.owner == makerAccount.owner);
            require(g_makerAccount.number == makerAccount.number);
        }
        if (g_takerAccount.owner != address(0)) {
            require(g_takerAccount.owner == takerAccount.owner);
            require(g_takerAccount.number == takerAccount.number);
        }
        if (g_oldInputPar.value != 0) {
            require(g_oldInputPar.sign == oldInputPar.sign);
            require(g_oldInputPar.value == oldInputPar.value);
        }
        if (g_newInputPar.value != 0) {
            require(g_newInputPar.sign == newInputPar.sign);
            require(g_newInputPar.value == newInputPar.value);
        }
        if (g_inputWei.value != 0) {
            require(g_inputWei.sign == inputWei.sign);
            require(g_inputWei.value == inputWei.value);
        }

        uint256 input = parseData(data);

        uint256 output = g_data[input];

        setDataInternal(input, 0);

        return Types.Wei({
            sign: true,
            value: output
        });
    }

    function setDataInternal(
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
        returns (uint256)
    {
        Require.that(
            data.length == 32,
            FILE,
            "Call data invalid length"
        );

        uint256 input;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            input := mload(add(data, 32))
        }

        return input;
    }
}
