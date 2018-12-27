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

pragma solidity 0.5.2;
pragma experimental ABIEncoderV2;

import { SoloMargin } from "../protocol/SoloMargin.sol";
import { Actions } from "../protocol/lib/Actions.sol";
import { Address } from "../protocol/lib/Address.sol";
import { IWeth } from "./interfaces/IWeth.sol";


/**
 * @title PayableProxyForSoloMargin
 * @author dYdX
 *
 * TODO
 */
contract PayableProxyForSoloMargin {

    SoloMargin public SOLO_MARGIN;
    IWeth public WETH;

    constructor (
        address soloMargin,
        address payable weth
    )
        public
    {
        SOLO_MARGIN = SoloMargin(soloMargin);
        WETH = IWeth(weth);
        WETH.approve(soloMargin, uint256(-1));
    }

    function transact(
        SoloMargin.AccountInfo[] memory accounts,
        Actions.TransactionArgs[] memory args
    )
        public
        payable
    {
        // create WETH from ETH
        WETH.deposit.value(msg.value)();

        // replace the shorthand for each msg.sender
        for (uint256 i = 0; i < accounts.length; i++) {
            accounts[i].owner = Address.trueAddress(accounts[i].owner);
        }

        // validate the input
        for (uint256 i = 0; i < args.length; i++) {
            // for each deposit, deposit.from must be this or msg.sender
            if (args[i].transactionType == Actions.TransactionType.Deposit) {
                require(accounts[args[i].accountId].owner == msg.sender);
            }

            // for each non-liquidate, account owner must be msg.sender
            if (args[i].transactionType != Actions.TransactionType.Liquidate) {
                require(accounts[args[i].accountId].owner == msg.sender);
            }
        }

        SOLO_MARGIN.transact(accounts, args);

        // return all remaining WETH to the msg.sender as ETH
        uint256 remainingWeth = WETH.balanceOf(address(this));
        if (remainingWeth != 0) {
            WETH.withdraw(remainingWeth);
            msg.sender.transfer(remainingWeth);
        }
    }
}
