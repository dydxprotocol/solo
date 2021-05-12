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

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title Refunder
 * @author dYdX
 *
 * Allows refunding a user for some amount of tokens for some market.
 */
contract Refunder is
    Ownable,
    OnlySolo,
    IAutoTrader
{
function coverage_0x7c4a9962(bytes32 c__0x7c4a9962) public pure {}

    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "Refunder";

    // ============ Events ============

    event LogGiverAdded(
        address giver
    );

    event LogGiverRemoved(
        address giver
    );

    event LogRefund(
        Account.Info account,
        uint256 marketId,
        uint256 amount
    );

    // ============ Storage ============

    // the addresses that are able to give funds
    mapping (address => bool) public g_givers;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address[] memory givers
    )
        public
        OnlySolo(soloMargin)
    {coverage_0x7c4a9962(0x6e9b30aded85dfb2c078dee889506fe06183ca590ab17002861f77474850a76d); /* function */ 

coverage_0x7c4a9962(0x231873c86a298e9165312372012452fae40f6a0c53a787f5941f9115d6d61bcd); /* line */ 
        coverage_0x7c4a9962(0x3884c4ff83d1fe3c06b3276360aab506ab43242406414bd1d283bb8561884760); /* statement */ 
for (uint256 i = 0; i < givers.length; i++) {
coverage_0x7c4a9962(0xa9bcf32d99177bc2a90be782c62f7ea29d6c20b362b2d19f363b4152a7cd9865); /* line */ 
            coverage_0x7c4a9962(0x74a0fed388479cfe30363de52e4ac19b1b1a9b9a1344ce4f304efdec7b801336); /* statement */ 
g_givers[givers[i]] = true;
        }
    }

    // ============ Admin Functions ============

    function addGiver(
        address giver
    )
        external
        onlyOwner
    {coverage_0x7c4a9962(0xb27b6e12767c7f55f737d292f8f829c9299e10f715ed67012efee7b7f00f20c0); /* function */ 

coverage_0x7c4a9962(0xc7e97ff1f664b70463c4ce3f63e0164236e62b711da6e08ead50ff9ff2a94643); /* line */ 
        coverage_0x7c4a9962(0xd8a180ee90433a8d1afb14849c50f0032f9a15cb85c6613cafd7b785e572e095); /* statement */ 
emit LogGiverAdded(giver);
coverage_0x7c4a9962(0xa7df379982e65e94c254fb2dec66662a3c819dc4087aff107db5797c22413507); /* line */ 
        coverage_0x7c4a9962(0xc4123770f65ff7a1c559268ad21a1ada9126b4259157cac917acfc58728cdf8a); /* statement */ 
g_givers[giver] = true;
    }

    function removeGiver(
        address giver
    )
        external
        onlyOwner
    {coverage_0x7c4a9962(0xddea4260fed50b369d92e477e8ca4f15a0035b4b3f167655b1f9feca4e40d66c); /* function */ 

coverage_0x7c4a9962(0xb3c649cee9a1b173013879b264588265eb9720b750c0811db6f6f3f2efb1e85b); /* line */ 
        coverage_0x7c4a9962(0x9f6d1c573bcbdd127190b7b9984fe4bb2df5eb12b0794b801fec7cea70f64f83); /* statement */ 
emit LogGiverRemoved(giver);
coverage_0x7c4a9962(0x66545806d1ca41574864fe8c5d497222247fe7a0d05a142f3db0566ce18a771d); /* line */ 
        coverage_0x7c4a9962(0x02bdf2b7a28d28be19ebf5c1a67b2fa5c5c383f70d5c0de22146a34f630d70d0); /* statement */ 
g_givers[giver] = false;
    }

    // ============ Only-Solo Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 /* outputMarketId */,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory /* oldInputPar */,
        Types.Par memory /* newInputPar */,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {coverage_0x7c4a9962(0x926811b68534864b6ad0c6e99756c761f84e995302242e960ceaf1d1cfe08afb); /* function */ 

coverage_0x7c4a9962(0xa4e7e054a0bac756cbaf06241b43da4dea2397510976d8e65c2dc1be57e102c3); /* line */ 
        coverage_0x7c4a9962(0xdd351b37ff54c4fe4933fae0ed350870ad2a8cc756213a40a022ee05f5ce3848); /* statement */ 
Require.that(
            g_givers[takerAccount.owner],
            FILE,
            "Giver not approved",
            takerAccount.owner
        );

coverage_0x7c4a9962(0x4d650be536ffbb8bba94ebef1491afe6e67be392e56b87f94b575e9afb7d9bd0); /* line */ 
        coverage_0x7c4a9962(0xdac8105d88ebcb31d1990c8524e081ea8555562e68cc5bdc46a6203cdfac3ad8); /* statement */ 
Require.that(
            inputWei.isPositive(),
            FILE,
            "Refund must be positive"
        );

coverage_0x7c4a9962(0xcbad4fdf387d87a82dae23576847c1259b76312a61ad142fa6e215f70669e8ec); /* line */ 
        coverage_0x7c4a9962(0x413662949f1840fcc969ff25b6cda204412c3029ba02106ed9a1b09a4352aab9); /* statement */ 
emit LogRefund(
            makerAccount,
            inputMarketId,
            inputWei.value
        );

coverage_0x7c4a9962(0x44d031d546196ff5c40649e2791e791c382a13adb088136c263a4b27b999d4d2); /* line */ 
        coverage_0x7c4a9962(0x455ef56ded51e23842f4bb1513b4e1543dd3655ddeea2951592888aa77b7a53e); /* statement */ 
return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Par,
            ref: Types.AssetReference.Delta,
            value: 0
        });
    }
}
