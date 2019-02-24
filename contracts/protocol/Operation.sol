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

import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { State } from "./State.sol";
import { OperationImpl } from "./impl/OperationImpl.sol";
import { Account } from "./lib/Account.sol";
import { Actions } from "./lib/Actions.sol";


/**
 * @title Operation
 * @author dYdX
 *
 * Primary public function for allowing users and contracts to manage accounts within Solo
 */
contract Operation is
    State,
    ReentrancyGuard
{
    // ============ Public Functions ============

    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        public
        nonReentrant
    {
        OperationImpl.operate(
            g_state,
            accounts,
            actions
        );
    }
}
