/*

    Copyright 2022 Dolomite.

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

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ILiquidationCallback } from "../interfaces/ILiquidationCallback.sol";
import { Account } from "../lib/Account.sol";
import { ExcessivelySafeCall } from "../lib/ExcessivelySafeCall.sol";
import { Math } from "../lib/Math.sol";
import { Types } from "../lib/Types.sol";


library SafeLiquidationCallback {
    using Address for address;
    using ExcessivelySafeCall for address;

    // ============ Events ============

    event LogLiquidationCallbackSuccess(address indexed liquidAccountOwner, uint liquidAccountNumber);

    event LogLiquidationCallbackFailure(address indexed liquidAccountOwner, uint liquidAccountNumber, string reason);

    // ============ Functions ============

    function callLiquidateCallbackIfNecessary(
        Account.Info memory liquidAccount,
        uint heldMarket,
        Types.Wei memory heldDeltaWei,
        uint owedMarket,
        Types.Wei memory owedDeltaWei
    ) internal {
        if (liquidAccount.owner.isContract()) {
            uint16 maxCopyBytes = 256;
            (bool isCallSuccessful, bytes memory result) = liquidAccount.owner.excessivelySafeCall(
                /* _gas= */ Math.min(gasleft(), 1000000), // send, at most, 1,000,000 gas to the liquidation callback
                maxCopyBytes, // receive at-most this many bytes worth of return data
                abi.encodeWithSelector(
                    ILiquidationCallback(liquidAccount.owner).onLiquidate.selector,
                    liquidAccount.number,
                    heldMarket,
                    heldDeltaWei,
                    owedMarket,
                    owedDeltaWei
                )
            );

            if (isCallSuccessful) {
                emit LogLiquidationCallbackSuccess(liquidAccount.owner, liquidAccount.number);
            } else {
                // For reversions:
                // - the first 4 bytes is the method ID
                // - the next 32 bytes is the offset (hardcoded 0x20)
                // - the next 32 bytes is the length of the string
                // Here is an example result. The first 68 bytes (136 hexadecimal characters) are the templated
                // 08c379a0                                                         // erroring method ID
                // 0000000000000000000000000000000000000000000000000000000000000020 // offset to where string is
                // 0000000000000000000000000000000000000000000000000000000000000001 // string length
                // 2100000000000000000000000000000000000000000000000000000000000000 // string itself - not templated
                if (result.length < 68) {
                    result = bytes("");
                } else {
                    // parse the result bytes error message into a human-readable string
                    uint length;
                    // solium-disable-next-line security/no-inline-assembly
                    assembly {
                        result := add(result, 0x04)
                        length := mload(add(result, 0x40))
                        if gt(length, sub(maxCopyBytes, 0x44)) {
                            // if the length from `result` is longer than the max length, subtract the 68 bytes
                            // from the maxCopyBytes
                            mstore(add(result, 0x40), sub(maxCopyBytes, 0x44))
                        }
                    }
                    result = bytes(abi.decode(result, (string)));
                }
                emit LogLiquidationCallbackFailure(
                    liquidAccount.owner,
                    liquidAccount.number,
                    string(result)
                );
            }
        }
    }

}
