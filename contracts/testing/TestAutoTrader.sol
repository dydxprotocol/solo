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
    mapping (uint256 => uint256) public data;

    uint256 public requireInputMarketId;
    uint256 public requireOutputMarketId;
    Acct.Info public requireMakerAccount;
    Acct.Info public requireTakerAccount;
    Types.Par public requireOldInputPar;
    Types.Par public requireNewInputPar;
    Types.Wei public requireInputWei;

    // ============ Testing Functions ============

    function setData(
        uint256 input,
        uint256 output
    )
        public
    {
        setDataInternal(input, output);
    }

    function setrequireInputMarketId(
        uint256 inputMarketId
    )
        public
    {
        requireInputMarketId = inputMarketId;
    }

    function setrequireOutputMarketId(
        uint256 outputMarketId
    )
        public
    {
        requireOutputMarketId = outputMarketId;
    }

    function setrequireMakerAccount(
        Acct.Info memory account
    )
        public
    {
        requireMakerAccount = account;
    }

    function setrequireTakerAccount(
        Acct.Info memory account
    )
        public
    {
        requireTakerAccount = account;
    }

    function setrequireOldInputPar(
        Types.Par memory oldInputPar
    )
        public
    {
        requireOldInputPar = oldInputPar;
    }

    function setrequireNewInputPar(
        Types.Par memory newInputPar
    )
        public
    {
        requireNewInputPar = newInputPar;
    }

    function setrequireInputWei(
        Types.Wei memory inputWei
    )
        public
    {
        requireInputWei = inputWei;
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
        bytes memory tradeData
    )
        public
        returns (Types.Wei memory)
    {
        if (requireInputMarketId != 0) {
            Require.that(
                requireInputMarketId == inputMarketId,
                FILE,
                "input market mismatch"
            );
        }
        if (requireOutputMarketId != 0) {
            Require.that(
                requireOutputMarketId == outputMarketId,
                FILE,
                "output market mismatch"
            );
        }
        if (requireMakerAccount.owner != address(0)) {
            Require.that(
                requireMakerAccount.owner == makerAccount.owner,
                FILE,
                "maker account owner mismatch"
            );
            Require.that(
                requireMakerAccount.number == makerAccount.number,
                FILE,
                "maker account number mismatch"
            );
        }
        if (requireTakerAccount.owner != address(0)) {
            Require.that(
                requireTakerAccount.owner == takerAccount.owner,
                FILE,
                "taker account owner mismatch"
            );
            Require.that(
                requireTakerAccount.number == takerAccount.number,
                FILE,
                "taker account number mismatch"
            );
        }
        if (requireOldInputPar.value != 0) {
            Require.that(
                requireOldInputPar.sign == oldInputPar.sign,
                FILE,
                "oldInputPar sign mismatch"
                );
            Require.that(
                requireOldInputPar.value == oldInputPar.value,
                FILE,
                "oldInputPar value mismatch"
                );
        }
        if (requireNewInputPar.value != 0) {
            Require.that(
                requireNewInputPar.sign == newInputPar.sign,
                FILE,
                "newInputPar sign mismatch"
            );
            Require.that(
                requireNewInputPar.value == newInputPar.value,
                FILE,
                "newInputPar value mismatch"
            );
        }
        if (requireInputWei.value != 0) {
            Require.that(
                requireInputWei.sign == inputWei.sign,
                FILE,
                "inputWei sign mismatch"
            );
            Require.that(
                requireInputWei.value == inputWei.value,
                FILE,
                "inputWei value mismatch"
            );
        }

        uint256 input = parseTradeData(tradeData);

        uint256 output = data[input];

        setDataInternal(input, 0);

        return Types.Wei({
            sign: true,
            value: output
        });
    }

    // ============ Private Functions ============

    function setDataInternal(
        uint256 input,
        uint256 output
    )
        private
    {
        emit DataSet(input, output);
        data[input] = output;
    }

    function parseTradeData(
        bytes memory tradeData
    )
        private
        pure
        returns (uint256)
    {
        Require.that(
            tradeData.length == 32,
            FILE,
            "Call data invalid length"
        );

        uint256 input;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            input := mload(add(tradeData, 32))
        }

        return input;
    }
}
