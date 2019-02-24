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

pragma solidity 0.5.4;
pragma experimental ABIEncoderV2;

import { State } from "./State.sol";


/**
 * @title Permission
 * @author dYdX
 *
 * Public function that allows other addresses to manage accounts
 */
contract Permission is
    State
{
    // ============ Events ============

    event OperatorSet(
        address indexed owner,
        address operator,
        bool trusted
    );

    // ============ Structs ============

    struct OperatorArg {
        address operator;
        bool trusted;
    }

    // ============ Public Functions ============

    function setOperators(
        OperatorArg[] memory args
    )
        public
    {
        for (uint256 i = 0; i < args.length; i++) {
            address operator = args[i].operator;
            bool trusted = args[i].trusted;
            g_state.operators[msg.sender][operator] = trusted;
            emit OperatorSet(msg.sender, operator, trusted);
        }
    }
}
