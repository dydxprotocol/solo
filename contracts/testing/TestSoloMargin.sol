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

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { SoloMargin } from "../protocol/SoloMargin.sol";
import { Acct } from "../protocol/lib/Acct.sol";
import { Interest } from "../protocol/lib/Interest.sol";
import { Math } from "../protocol/lib/Math.sol";
import { Types } from "../protocol/lib/Types.sol";


contract TestSoloMargin is
    SoloMargin
{
    using Math for uint256;

    // ============ Constructor ============

    constructor (
        address adminlib,
        RiskParameters memory rp
    )
        public
        SoloMargin(adminlib, rp)
    {}

    // ============ Testing Functions ============

    function setAccountBalance(
        Acct.Info memory account,
        uint256 market,
        Types.Par memory newPar
    )
        public
    {
        Types.Par memory oldPar = g_accounts[account.owner][account.number].balances[market];
        Types.TotalPar memory totalPar = g_markets[market].totalPar;

        // roll-back oldPar
        if (oldPar.sign) {
            totalPar.supply = uint256(totalPar.supply).sub(oldPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).sub(oldPar.value).to128();
        }

        // roll-forward newPar
        if (newPar.sign) {
            totalPar.supply = uint256(totalPar.supply).add(newPar.value).to128();
        } else {
            totalPar.borrow = uint256(totalPar.borrow).add(newPar.value).to128();
        }

        g_markets[market].totalPar = totalPar;
        g_accounts[account.owner][account.number].balances[market] = newPar;
    }

    function setAccountStatus(
        Acct.Info memory account,
        AccountStatus status
    )
        public
    {
        g_accounts[account.owner][account.number].status = status;
    }

    function setMarketIndex(
        uint256 market,
        Interest.Index memory index
    )
        public
    {
        Interest.Index memory oldIndex = g_markets[market].index;

        if (index.borrow == 0) {
            index.borrow = oldIndex.borrow;
        }
        if (index.supply == 0) {
            index.supply = oldIndex.supply;
        }

        g_markets[market].index = index;
    }
}
