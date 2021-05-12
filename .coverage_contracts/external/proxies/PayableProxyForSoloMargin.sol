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

import { WETH9 } from "canonical-weth/contracts/WETH9.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SoloMargin } from "../../protocol/SoloMargin.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title PayableProxyForSoloMargin
 * @author dYdX
 *
 * Contract for wrapping/unwrapping ETH before/after interacting with Solo
 */
contract PayableProxyForSoloMargin is
    OnlySolo,
    ReentrancyGuard
{
function coverage_0x6347c142(bytes32 c__0x6347c142) public pure {}

    // ============ Constants ============

    bytes32 constant FILE = "PayableProxyForSoloMargin";

    // ============ Storage ============

    WETH9 public WETH;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address payable weth
    )
        public
        OnlySolo(soloMargin)
    {coverage_0x6347c142(0xfab3b5b8f9fbcba340977d2994dc5827cd6b4a066ad9f5122212666ba068c7f3); /* function */ 

coverage_0x6347c142(0xa5cb4db4bda8236162e4aa3af3738eeeb2cd735f3c5d35643c0fc8c4feddcd36); /* line */ 
        coverage_0x6347c142(0xba6186777bca3af3236de8f3b03f1122182ca0af859f7d393f109e761d51a777); /* statement */ 
WETH = WETH9(weth);
coverage_0x6347c142(0x2b5dfaa7222c5873665f88d223bfd94793516c1fb5eafcfe90fa3b9893953103); /* line */ 
        coverage_0x6347c142(0x3a4c7ca1d43ae909a3c4a92f2f01bddb7f866ed0ee045728ddcc248cd5c6bfd7); /* statement */ 
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
    {coverage_0x6347c142(0x5159ac5243b2027aa7d74b6a611756699a68a20cb7bb03de84c0c046de3ae11f); /* function */ 

coverage_0x6347c142(0xfdd5fb3d9b59cd739dac9bbd71a56b73829824e77b41be4edb588435a9b4e95c); /* line */ 
        coverage_0x6347c142(0x50d4231d109ecb605cc4e96d50ad1e48da28ff06aa04abdfac95e397489057ca); /* assertPre */ 
coverage_0x6347c142(0x11a79df2c39109cb951cd9f682918f11f21e6fed48c5f7bbe88bb9cb8f22288a); /* statement */ 
require( // coverage-disable-line
            msg.sender == address(WETH),
            "Cannot receive ETH"
        );coverage_0x6347c142(0x7a561752a17b37572c8dd52604d823791c86d4505f8c0bf9992012479ee9c1b5); /* assertPost */ 

    }

    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        address payable sendEthTo
    )
        public
        payable
        nonReentrant
    {coverage_0x6347c142(0xef12305f8419a9f8071921feb5fa27f2a1fb958cd24dabeddb043ba65e92e62c); /* function */ 

coverage_0x6347c142(0x1f7078836fe45ba6adbdff8e79d3b701487b42451d8c670f091c6e14164ea895); /* line */ 
        coverage_0x6347c142(0x7b47b4ab5e64ba428f0e3d49c23542f6e75b1d579cf6d3a4ff5eb0c630c59aa5); /* statement */ 
WETH9 weth = WETH;

        // create WETH from ETH
coverage_0x6347c142(0xb88a1170d732369a1632230d4a0f7a7bfe510cc6fece3f42200acb2a5ad15e7f); /* line */ 
        coverage_0x6347c142(0xae7e5e548934a50362abfc4dd82a65d70f06d37f80532bec5bf6675f743d4c5a); /* statement */ 
if (msg.value != 0) {coverage_0x6347c142(0xba8ba14c18165d665da437f5c1fe33df0e8f144a05c1f9e021c7cab278aed66c); /* branch */ 

coverage_0x6347c142(0xa9b5e5e2d188e4a84ae05d5db416ea4c6cbf29187aba6a1bfe44836c6bb41a26); /* line */ 
            coverage_0x6347c142(0x1fe8161e76a6e314d05bbf25d432a020dbf34989e08cb2134b7714991320bdfd); /* statement */ 
weth.deposit.value(msg.value)();
        }else { coverage_0x6347c142(0xda3e9423065661529e95f00e57bb831cab4a304721dbfc2a6a033972c4c072c7); /* branch */ 
}

        // validate the input
coverage_0x6347c142(0x0a777ccbfd01a24fcacc54a67fd90951a9390dec41fbe58073f849c83df284e9); /* line */ 
        coverage_0x6347c142(0x891ccbb4f56d6faa4d22826f173a1e025e05484c6e7b66edd17e98b7ad6d2891); /* statement */ 
for (uint256 i = 0; i < actions.length; i++) {
coverage_0x6347c142(0xd6f84ab3f2fcaedc2e73923fa66da0818ff5c4831ca7497b98e6aabfd59bfabc); /* line */ 
            coverage_0x6347c142(0xba9a0ba55d53af315d743eb694ea3ea3488ed032af3d29854a68fbc38be9d082); /* statement */ 
Actions.ActionArgs memory action = actions[i];

            // Can only operate on accounts owned by msg.sender
coverage_0x6347c142(0x65a75b63d1b0e45b31ae84419fe8570482af95de7d1229c9a170abf8248d7235); /* line */ 
            coverage_0x6347c142(0xc75be678f87263c766c5302efaacc11a8f15e532bb1f18fc0600ca2e9efbfc82); /* statement */ 
address owner1 = accounts[action.accountId].owner;
coverage_0x6347c142(0xcde1101e34fd3b7599b67afbfdc58ffd71885de3c885f8dd18939b22f803c5d4); /* line */ 
            coverage_0x6347c142(0x89236aa058d99b640442f7cf61cc3f9ebfb38902ba8c2d452434bf36e20f725a); /* statement */ 
Require.that(
                owner1 == msg.sender,
                FILE,
                "Sender must be primary account",
                owner1
            );

            // For a transfer both accounts must be owned by msg.sender
coverage_0x6347c142(0xc52bc535142190e7958cd798dfe420853c60c0332fc7f065434791a93f8c60d4); /* line */ 
            coverage_0x6347c142(0x29efc357de19d9a7f5b5270f55240873068e4a153c8db0c5aac276dab1ab4336); /* statement */ 
if (action.actionType == Actions.ActionType.Transfer) {coverage_0x6347c142(0xebf3b09702d6b65ef43e0732aa87e79c28c206569266f61fc5213bb1897c96f0); /* branch */ 

coverage_0x6347c142(0xbcfd761bfae2ca750ec018a4883e388b3f4e353c0ef719d12ed21b1818c9ec4d); /* line */ 
                coverage_0x6347c142(0x7643d576fb8575b6cbddf90916c5defad84dfa3e6576dee97ff8ad4d5cc8393f); /* statement */ 
address owner2 = accounts[action.otherAccountId].owner;
coverage_0x6347c142(0x3ca3055c861f4d64f2e13a23be06d3a07daf23658e492101cec20efb18f3274c); /* line */ 
                coverage_0x6347c142(0xf149db06885f6c730166632ad8a6c1ac6e721afa55d228f9c3087f215b027595); /* statement */ 
Require.that(
                    owner2 == msg.sender,
                    FILE,
                    "Sender must be secondary account",
                    owner2
                );
            }else { coverage_0x6347c142(0x4f773a665c99e434be7c4010bdf4a99b1de20d152f1f4b4cfb683ed39f3bfaa6); /* branch */ 
}
        }

coverage_0x6347c142(0x5842b60e813c6c3e1bbae57657c120b7292e0ee1a9657e3eec6872a48f83d7a1); /* line */ 
        coverage_0x6347c142(0x9467eaff7054ba73e5540279d4ffb1e5ca792e796400cd7c731a2963bc964c0d); /* statement */ 
SOLO_MARGIN.operate(accounts, actions);

        // return all remaining WETH to the sendEthTo as ETH
coverage_0x6347c142(0x3dd472951668b066981a1ade3fd4969126b7a0340d1be93a486b2008f024298d); /* line */ 
        coverage_0x6347c142(0x967d751d1c98424286f5ea50e8c3ccea6b08858afbc72eef41b6f67d352fafa1); /* statement */ 
uint256 remainingWeth = weth.balanceOf(address(this));
coverage_0x6347c142(0x5c4c405ea5329cddf22c18a9dc5c24f513b522054c335f34a3f42dc0d48e6b31); /* line */ 
        coverage_0x6347c142(0x53168b38343db34c5bfd2ce7dcc7c6c67fa5dc435d9fe6a4dec5a34a131e2aae); /* statement */ 
if (remainingWeth != 0) {coverage_0x6347c142(0x7d0ccb9bb3fd96708fe587841c64d63c3d6180f9dce36b1f736600ff1a7ad1a6); /* branch */ 

coverage_0x6347c142(0xbb79c184687c2115ddcd701dec5a90e4b4a97114adf67c2fd80afabbbef0e1dd); /* line */ 
            coverage_0x6347c142(0xcf68a67d5622661774e2ded38dacdee46244fdc39f6e7fcacf7312d5439e2e26); /* statement */ 
Require.that(
                sendEthTo != address(0),
                FILE,
                "Must set sendEthTo"
            );

coverage_0x6347c142(0x67c22d778ab402be3a42bc94bca4cbb8b244a558748d749264a81e1f924c7f65); /* line */ 
            coverage_0x6347c142(0x2994b92dbc976992f8c0b8c3d69453022d6882575efdefe998c7f2d74e7b7c93); /* statement */ 
weth.withdraw(remainingWeth);
coverage_0x6347c142(0x9c09cfc73a1a762de0b3f6a4de9f7a5acbc9c9e7416e09eaa8c6f3b000ad17c6); /* line */ 
            coverage_0x6347c142(0x0e8de791341611bd6ebe52645da785f0b848c931bab378186db7186b25cf3202); /* statement */ 
sendEthTo.transfer(remainingWeth);
        }else { coverage_0x6347c142(0x046899bf22aa3680897c18efc80c5f1dd3c1c6813c1ac7ee17fa591f5f133f0f); /* branch */ 
}
    }
}
