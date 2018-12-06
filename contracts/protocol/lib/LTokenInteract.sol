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

import { LTypes } from "./LTypes.sol";

/**
 * @title GeneralERC20
 * @author dYdX
 *
 * Interface for using ERC20 Tokens. We have to use a special interface to call ERC20 functions so
 * that we dont automatically revert when calling non-compliant tokens that have no return value for
 * transfer(), transferFrom(), or approve().
 */
interface GeneralERC20 {
    function totalSupply(
    )
        external
        view
        returns (uint256);

    function balanceOf(
        address who
    )
        external
        view
        returns (uint256);

    function allowance(
        address owner,
        address spender
    )
        external
        view
        returns (uint256);

    function transfer(
        address to,
        uint256 value
    )
        external;


    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        external;

    function approve(
        address spender,
        uint256 value
    )
        external;
}


/**
 * @title TokenInteract
 * @author dYdX
 *
 * This library contains basic functions for interacting with ERC20 tokens
 */
library LTokenInteract {
    string constant CONTRACT_NAME = "TokenInteract";

    function balanceOf(
        address token,
        address owner
    )
        internal
        view
        returns (LTypes.TokenAmount memory)
    {
        return LTypes.TokenAmount({ value: GeneralERC20(token).balanceOf(owner) });
    }

    function allowance(
        address token,
        address owner,
        address spender
    )
        internal
        view
        returns (LTypes.TokenAmount memory)
    {
        return LTypes.TokenAmount({ value: GeneralERC20(token).allowance(owner, spender) });
    }

    function approve(
        address token,
        address spender,
        LTypes.TokenAmount memory amount
    )
        internal
    {
        GeneralERC20(token).approve(spender, amount.value);

        require(
            checkSuccess(),
            "TokenInteract#approve: Approval failed"
        );
    }

    function transfer(
        address token,
        address to,
        LTypes.TokenAmount memory amount
    )
        internal
    {
        address from = address(this);
        if (
            amount.value == 0
            || from == to
        ) {
            return;
        }

        GeneralERC20(token).transfer(to, amount.value);

        require(
            checkSuccess(),
            "TokenInteract#transfer: Transfer failed"
        );
    }

    function transferFrom(
        address token,
        address from,
        address to,
        LTypes.TokenAmount memory amount
    )
        internal
    {
        if (
            amount.value == 0
            || from == to
        ) {
            return;
        }

        GeneralERC20(token).transferFrom(from, to, amount.value);

        require(
            checkSuccess(),
            "TokenInteract#transferFrom: TransferFrom failed"
        );
    }

    // ============ Private Helper-Functions ============

    /**
     * Checks the return value of the previous function up to 32 bytes. Returns true if the previous
     * function returned 0 bytes or 32 bytes that are not all-zero.
     */
    function checkSuccess(
    )
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
