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

pragma solidity 0.5.1;

import { IErc20 } from "../interfaces/IErc20.sol";
import { LTypes } from "./LTypes.sol";


/**
 * @title LToken
 * @author dYdX
 *
 * This library contains basic functions for interacting with ERC20 tokens
 */
library LToken {

    function thisBalance(
        address token
    )
        internal
        view
        returns (LTypes.SignedAccrued memory)
    {
        LTypes.SignedAccrued memory result;
        result.sign = true;
        result.accrued = IErc20(token).balanceOf(address(this));
        return result;
    }

    function transferOut(
        address token,
        address to,
        LTypes.SignedAccrued memory amount
    )
        internal
    {
        require(
            !amount.sign
        );

        if (amount.accrued == 0) {
            return;
        }

        require(
            IErc20(token).balanceOf(address(this)) >= amount.accrued,
            "TokenInteract#transferOut: Not enough tokens"
        );

        IErc20(token).transfer(to, amount.accrued);

        require(
            checkSuccess(),
            "TokenInteract#transferOut: Transfer failed"
        );
    }

    function transferIn(
        address token,
        address from,
        LTypes.SignedAccrued memory amount
    )
        internal
    {
        require(
            amount.sign
        );

        if (amount.accrued == 0) {
            return;
        }

        require(
            IErc20(token).balanceOf(from) >= amount.accrued,
            "TokenInteract#transferIn: Not enough tokens"
        );

        IErc20(token).transferFrom(from, address(this), amount.accrued);

        require(
            checkSuccess(),
            "TokenInteract#transferIn: TransferFrom failed"
        );
    }

    // ============ Private Helper-Functions ============

    /**
     * Checks the return value of the previous function up to 32 bytes. Returns true if the previous
     * function returned 0 bytes or 32 bytes that are not all-zero.
     */
    function checkSuccess()
        private
        pure
        returns (bool)
    {
        uint256 returnValue = 0;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            // check number of bytes returned from last function call
            switch returndatasize

            // no bytes returned: assume success
            case 0x0 {
                returnValue := 1
            }

            // 32 bytes returned: check if non-zero
            case 0x20 {
                // copy 32 bytes into scratch space
                returndatacopy(0x0, 0x0, 0x20)

                // load those bytes into returnValue
                returnValue := mload(0x0)
            }

            // not sure what was returned: dont mark as success
            default { }
        }

        return returnValue != 0;
    }
}
