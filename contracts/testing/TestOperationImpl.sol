/*

    Copyright 2021 Dolomite.

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

import { Account } from "../protocol/lib/Account.sol";
import { Storage } from "../protocol/lib/Storage.sol";
import { Types } from "../protocol/lib/Types.sol";

/**
 * @dev This is used to split apart the call to state#setPar to lessen the bytecode size of TestDolomiteMargin.sol
 */
library TestOperationImpl {
    using Storage for Storage.State;

    function setPar(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.Par memory newPar
    ) public {
        state.setPar(account, marketId, newPar);
    }

}