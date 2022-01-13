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

import { OnlyDolomiteMargin } from "../external/helpers/OnlyDolomiteMargin.sol";
import { ILiquidationCallback } from "../protocol/interfaces/ILiquidationCallback.sol";
import { Require } from "../protocol/lib/Require.sol";
import { Types } from "../protocol/lib/Types.sol";

contract TestLiquidateCallback is OnlyDolomiteMargin, ILiquidationCallback {

    bytes32 public constant FILE = "TestLiquidateCallback";

    bool public SHOULD_REVERT;
    bool public SHOULD_REVERT_WITH_MESSAGE;

    constructor(
        address dolomiteMargin,
        bool shouldRevert,
        bool shouldRevertWithMessage
    ) public OnlyDolomiteMargin(dolomiteMargin) {
        SHOULD_REVERT = shouldRevert;
        SHOULD_REVERT_WITH_MESSAGE = shouldRevertWithMessage;
    }

    function onLiquidate(
        uint,
        uint,
        Types.Wei memory,
        uint,
        Types.Wei memory
    ) public {
        if (SHOULD_REVERT) {
            if (SHOULD_REVERT_WITH_MESSAGE) {
                Require.that(
                    false,
                    FILE,
                    "purposeful reversion"
                );
            } else {
                revert();
            }
        }
    }

}
