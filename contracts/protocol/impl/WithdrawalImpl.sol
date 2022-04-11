/*

    Copyright 2021 Dolomite

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

import { Actions } from "../lib/Actions.sol";
import { Events } from "../lib/Events.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Interest } from "../lib/Interest.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";


library WithdrawalImpl {
    using Storage for Storage.State;

    // ============ Constants ============

    bytes32 constant FILE = "WithdrawalImpl";

    // ============ Account Actions ============

    function withdraw(
        Storage.State storage state,
        Actions.WithdrawArgs memory args,
        Interest.Index memory index
    )
    public
    {
        state.requireIsOperator(args.account, msg.sender);

        (
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.market,
            index,
            args.amount
        );

        state.setPar(
            args.account,
            args.market,
            newPar
        );

        // requires a negative deltaWei
        Exchange.transferOut(
            state.getToken(args.market),
            args.to,
            deltaWei
        );

        Events.logWithdraw(
            state,
            args,
            deltaWei
        );
    }
}
