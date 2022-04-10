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

import { DolomiteMargin } from "../protocol/DolomiteMargin.sol";
import { Account } from "../protocol/lib/Account.sol";
import { Interest } from "../protocol/lib/Interest.sol";
import { Storage } from "../protocol/lib/Storage.sol";
import { Types } from "../protocol/lib/Types.sol";
import { TestOperationImpl } from "./TestOperationImpl.sol";


contract TestDolomiteMargin is DolomiteMargin {

    // ============ Constructor ============

    constructor (
        Storage.RiskParams memory rp,
        Storage.RiskLimits memory rl
    )
        public
        DolomiteMargin(rp, rl)
    {}

    // ============ Testing Functions ============

    function setAccountBalance(
        Account.Info memory account,
        uint256 market,
        Types.Par memory newPar
    )
        public
    {
        _requireValidMarket(market);
        TestOperationImpl.setPar(g_state, account, market, newPar);
    }

    function setAccountStatus(
        Account.Info memory account,
        Account.Status status
    )
        public
    {
        g_state.accounts[account.owner][account.number].status = status;
    }

    function setMarketIndex(
        uint256 market,
        Interest.Index memory index
    )
        public
    {
        Interest.Index memory oldIndex = g_state.markets[market].index;

        if (index.borrow == 0) {
            index.borrow = oldIndex.borrow;
        }
        if (index.supply == 0) {
            index.supply = oldIndex.supply;
        }

        g_state.markets[market].index = index;
    }
}
