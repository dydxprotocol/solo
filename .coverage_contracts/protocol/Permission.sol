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

import { State } from "./State.sol";


/**
 * @title Permission
 * @author dYdX
 *
 * Public function that allows other addresses to manage accounts
 */
contract Permission is
    State
{
function coverage_0xdd650c4b(bytes32 c__0xdd650c4b) public pure {}

    // ============ Events ============

    event LogOperatorSet(
        address indexed owner,
        address operator,
        bool trusted
    );

    // ============ Structs ============

    struct OperatorArg {
        address operator;
        bool trusted;
    }

    // ============ Public Functions ============

    /**
     * Approves/disapproves any number of operators. An operator is an external address that has the
     * same permissions to manipulate an account as the owner of the account. Operators are simply
     * addresses and therefore may either be externally-owned Ethereum accounts OR smart contracts.
     *
     * Operators are also able to act as AutoTrader contracts on behalf of the account owner if the
     * operator is a smart contract and implements the IAutoTrader interface.
     *
     * @param  args  A list of OperatorArgs which have an address and a boolean. The boolean value
     *               denotes whether to approve (true) or revoke approval (false) for that address.
     */
    function setOperators(
        OperatorArg[] memory args
    )
        public
    {coverage_0xdd650c4b(0x99a7d1044642aa9f3c7fcff27eadc7f7b5c40cf2e7318fe7ce3ba9e2b00cd67a); /* function */ 

coverage_0xdd650c4b(0x952cba675bc554483b2202837ac429302ece5b6a2f742c605e6c90f37e9c98ad); /* line */ 
        coverage_0xdd650c4b(0x55081586c331e6aea0732b9bcdc8cc70c9f602e43959357e01c58d07444c1723); /* statement */ 
for (uint256 i = 0; i < args.length; i++) {
coverage_0xdd650c4b(0xbfd0f3a60ee94983900e554f6e04628b02dd72afade9d57dcc43413adf5762d8); /* line */ 
            coverage_0xdd650c4b(0xa9add468d83de5b5a31f6a56f646a85efbcd38f6984e352140a413d8dcf0273d); /* statement */ 
address operator = args[i].operator;
coverage_0xdd650c4b(0xd88fe893efbd1620d0e643197e92eafb61f53fcf6fb811b42cd9ed641adbd686); /* line */ 
            coverage_0xdd650c4b(0xc9d9e56d49f441144906c4fa18d0aa5aa8f34a2d11a5eb9422ecb15524458ad1); /* statement */ 
bool trusted = args[i].trusted;
coverage_0xdd650c4b(0xc2b8caee4b42ded15e5c5ec24cd920ccc8a86a17ca1524787e7d29e44a7e462d); /* line */ 
            coverage_0xdd650c4b(0x0110444a31194fe050e0e7337a722e8f2e075e4bce08a6278dd6e11f21480b95); /* statement */ 
g_state.operators[msg.sender][operator] = trusted;
coverage_0xdd650c4b(0x7e0c4b462ecd16a03a11c057c2539002d852ebe5bbefde4ae4ea8651ccdc9cf3); /* line */ 
            coverage_0xdd650c4b(0x82009700cf2f73134e4206cd7ab92f553954aa6e6d972c5d68e1ccfe6a331f30); /* statement */ 
emit LogOperatorSet(msg.sender, operator, trusted);
        }
    }
}
