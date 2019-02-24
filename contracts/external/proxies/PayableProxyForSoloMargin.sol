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

pragma solidity 0.5.4;
pragma experimental ABIEncoderV2;

import { WETH9 } from "canonical-weth/contracts/WETH9.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SoloMargin } from "../../protocol/SoloMargin.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Require } from "../../protocol/lib/Require.sol";


/**
 * @title PayableProxyForSoloMargin
 * @author dYdX
 *
 * Contract for wrapping/unwrapping ETH before/after interacting with Solo
 */
contract PayableProxyForSoloMargin is
    ReentrancyGuard
{
    // ============ Constants ============

    bytes32 constant FILE = "PayableProxyForSoloMargin";

    // ============ Storage ============

    SoloMargin public SOLO_MARGIN;
    WETH9 public WETH;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address payable weth
    )
        public
    {
        SOLO_MARGIN = SoloMargin(soloMargin);
        WETH = WETH9(weth);
        WETH.approve(soloMargin, uint256(-1));
    }

    // ============ Public Functions ============

    /**
     * Fallback function. Disallows ether to be sent to this contract without data except when
     * unwrapping WETH.
     */
    function ()
        external
        payable
    {
        require( // coverage-disable-line
            msg.sender == address(WETH),
            "Cannot recieve ETH"
        );
    }

    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory args
    )
        public
        payable
        nonReentrant
    {
        // create WETH from ETH
        if (msg.value != 0) {
            WETH.deposit.value(msg.value)();
        }

        // validate the input
        for (uint256 i = 0; i < args.length; i++) {
            // For a transfer both accounts must be owned by msg.sender
            if (args[i].actionType == Actions.ActionType.Transfer) {
                address accountTwoOwner = Actions.parseTransferArgs(
                    accounts,
                    args[i]
                ).accountTwo.owner;

                Require.that(
                    accountTwoOwner == msg.sender,
                    FILE,
                    "Sender must own account two",
                    accountTwoOwner
                );
            }

            // Can only operate on accounts owned by msg.sender
            Require.that(
                accounts[args[i].accountId].owner == msg.sender,
                FILE,
                "Sender must own account",
                accounts[args[i].accountId].owner
            );
        }

        SOLO_MARGIN.operate(accounts, args);

        // return all remaining WETH to the msg.sender as ETH
        uint256 remainingWeth = WETH.balanceOf(address(this));
        if (remainingWeth != 0) {
            WETH.withdraw(remainingWeth);
            msg.sender.transfer(remainingWeth);
        }
    }
}
