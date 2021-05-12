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
function coverage_0xe39b7f53(bytes32 c__0xe39b7f53) public pure {}

    // ============ Public Functions ============

    /**
     * The main entry-point to Solo that allows users and contracts to manage accounts.
     * Take one or more actions on one or more accounts. The msg.sender must be the owner or
     * operator of all accounts except for those being liquidated, vaporized, or traded with.
     * One call to operate() is considered a singular "operation". Account collateralization is
     * ensured only after the completion of the entire operation.
     *
     * @param  accounts  A list of all accounts that will be used in this operation. Cannot contain
     *                   duplicates. In each action, the relevant account will be referred-to by its
     *                   index in the list.
     * @param  actions   An ordered list of all actions that will be taken in this operation. The
     *                   actions will be processed in order.
     */
    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        public
        nonReentrant
    {coverage_0xe39b7f53(0xd5c0a653e3f4a1af03412c3363a172e9c3111a861644d2ff529fc960bbdee370); /* function */ 

coverage_0xe39b7f53(0xf5259212ddc6ad5df2bd05ee3ad3e006bb5db8bd0e1a32d5f5cdafe68fb92ad0); /* line */ 
        coverage_0xe39b7f53(0xeb6c4731be832e935d884aeea4e13666a3e4600796489f08d30d1a7408ab1cf2); /* statement */ 
OperationImpl.operate(
            g_state,
            accounts,
            actions
        );
    }
}
