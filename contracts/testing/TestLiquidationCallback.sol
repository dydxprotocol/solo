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
import { Require } from "../protocol/lib/Require.sol";
import { Types } from "../protocol/lib/Types.sol";


contract TestLiquidationCallback is OnlyDolomiteMargin {

    bytes32 public constant FILE = "TestLiquidationCallback";

    event LogOnLiquidateInputs(
        uint accountNumber,
        uint heldMarketId,
        Types.Wei heldDeltaWei,
        uint owedMarketId,
        Types.Wei owedDeltaWei
    );

    bool public SHOULD_REVERT;
    bool public SHOULD_REVERT_WITH_MESSAGE;
    bool public SHOULD_CONSUME_TONS_OF_GAS;
    bool public SHOULD_RETURN_BOMB;

    string private REVERT_MESSAGE;

    uint private value = 0;

    constructor(
        address dolomiteMargin,
        bool shouldRevert,
        bool shouldRevertWithMessage,
        bool shouldConsumeTonsOfGas,
        bool shouldReturnBomb
    ) public OnlyDolomiteMargin(dolomiteMargin) {
        SHOULD_REVERT = shouldRevert;
        SHOULD_REVERT_WITH_MESSAGE = shouldRevertWithMessage;
        SHOULD_CONSUME_TONS_OF_GAS = shouldConsumeTonsOfGas;
        SHOULD_RETURN_BOMB = shouldReturnBomb;
    }

    function setLocalOperator() external {
        Types.OperatorArg[] memory operators = new Types.OperatorArg[](1);
        operators[0].operator = msg.sender;
        operators[0].trusted = true;
        DOLOMITE_MARGIN.setOperators(operators);
    }

    function setRevertMessage(string calldata revertMessage) external {
        REVERT_MESSAGE = revertMessage;
    }

    function onLiquidate(
        uint accountNumber,
        uint heldMarketId,
        Types.Wei memory heldDeltaWei,
        uint owedMarketId,
        Types.Wei memory owedDeltaWei
    ) public returns (bytes memory) {
        if (SHOULD_REVERT) {
            if (SHOULD_REVERT_WITH_MESSAGE) {
                if (bytes(REVERT_MESSAGE).length == 0) {
                    Require.that(
                        false,
                        FILE,
                        "purposeful reversion"
                    );
                } else {
                    revert(REVERT_MESSAGE);
                }
                return "";
            } else if (SHOULD_CONSUME_TONS_OF_GAS) {
                for (uint i = 0; i < 50000; i++) {
                    value += 1;
                }
                return "";
            } else if (SHOULD_RETURN_BOMB) {
                // send back 1,000,000 bytes
                assembly {
                    revert(0, 1000000)
                }
                revert();
            } else {
                revert();
            }
        } else {
            emit LogOnLiquidateInputs(accountNumber, heldMarketId, heldDeltaWei, owedMarketId, owedDeltaWei);
            return "";
        }
    }

}
