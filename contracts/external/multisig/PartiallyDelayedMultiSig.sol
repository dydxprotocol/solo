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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { DelayedMultiSig } from "./DelayedMultiSig.sol";


/**
 * @title PartiallyDelayedMultiSig
 * @author dYdX
 *
 * Multi-Signature Wallet with delay in execution except for some function selectors.
 */
contract PartiallyDelayedMultiSig is
    DelayedMultiSig
{
    // ============ Storage ============

    mapping (bytes4 => bool) public noDelayFunctions;

    // ============ Modifiers ============

    // Overrides old modifier that requires a timelock for every transaction
    modifier pastTimeLock(
        uint256 transactionId
    ) {
        bytes memory txnData = transactions[transactionId].data;

        // if the function selector is not exempt from timelock, then require timelock
        if (!isNoDelayData(txnData)) {
            require(
                block.timestamp >= confirmationTimes[transactionId] + secondsTimeLocked,
                "TIME_LOCK_INCOMPLETE"
            );
        }
        _;
    }

    // ============ Constructor ============

    /**
     * Contract constructor sets initial owners, required number of confirmations, and time lock.
     *
     * @param  _owners             List of initial owners.
     * @param  _required           Number of required confirmations.
     * @param  _secondsTimeLocked  Duration needed after a transaction is confirmed and before it
     *                             becomes executable, in seconds.
     * @param  _noDelayFunctions   All function selectors that do not require a delay to execute.
     *                             Fallback function is 0x00000000.
     */
    constructor (
        address[] memory _owners,
        uint256 _required,
        uint256 _secondsTimeLocked,
        bytes4[] memory _noDelayFunctions
    )
        public
        DelayedMultiSig(_owners, _required, _secondsTimeLocked)
    {
        for (uint256 i = 0; i < _noDelayFunctions.length; i++) {
            noDelayFunctions[_noDelayFunctions[i]] = true;
        }
    }

    // ============ Helper Functions ============

    /**
     * Returns true if function selector is in noDelayFunctions.
     */
    function isNoDelayData(
        bytes memory b
    )
        internal
        view
        returns (bool)
    {
        // fallback function
        if (b.length == 0) {
            return noDelayFunctions[bytes4(0x0)];
        }

        // invalid function selector
        if (b.length < 4) {
            return false;
        }

        // check first four bytes (function selector)
        bytes32 rawData;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            rawData := mload(add(b, 32))
        }
        return noDelayFunctions[bytes4(rawData)];
    }
}
