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

import { ICallee } from "../interfaces/ICallee.sol";
import { Actions } from "../lib/Actions.sol";
import { Cache } from "../lib/Cache.sol";
import { Events } from "../lib/Events.sol";
import { Storage } from "../lib/Storage.sol";


library CallImpl {
    using Cache for Cache.MarketCache;
    using Storage for Storage.State;

    // ============ Constants ============

    bytes32 constant FILE = "CallImpl";

    // ============ Account Actions ============

    function call(
        Storage.State storage state,
        Actions.CallArgs memory args
    )
    public
    {
        state.requireIsOperator(args.account, msg.sender);

        ICallee(args.callee).callFunction(
            msg.sender,
            args.account,
            args.data
        );

        Events.logCall(args);
    }
}
