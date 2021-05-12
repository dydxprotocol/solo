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

import { Require } from "./Require.sol";
import { IERC20 } from "../interfaces/IERC20.sol";


/**
 * @title Token
 * @author dYdX
 *
 * This library contains basic functions for interacting with ERC20 tokens. Modified to work with
 * tokens that don't adhere strictly to the ERC20 standard (for example tokens that don't return a
 * boolean value on success).
 */
library Token {
function coverage_0x17ff7472(bytes32 c__0x17ff7472) public pure {}


    // ============ Constants ============

    bytes32 constant FILE = "Token";

    // ============ Library Functions ============

    function balanceOf(
        address token,
        address owner
    )
        internal
        view
        returns (uint256)
    {coverage_0x17ff7472(0x5d22b77d8ddda079ea5ec5990383b525a1cf4a7d63b0aff00b376b4cc0fdc462); /* function */ 

coverage_0x17ff7472(0x7ee7e884a22ab2c72f813076dc18e594da2477b1cf7ee65d86cf2d680b8c373c); /* line */ 
        coverage_0x17ff7472(0xa54ec09eae9e728d46c4999ccceaab85af3c51399206910c70cddc2e83e75134); /* statement */ 
return IERC20(token).balanceOf(owner);
    }

    function allowance(
        address token,
        address owner,
        address spender
    )
        internal
        view
        returns (uint256)
    {coverage_0x17ff7472(0x5b5ebacaecb7290d6d694fcf5c49539b58d9ffe926ca8d7b69c599623437a345); /* function */ 

coverage_0x17ff7472(0x58913e4205d1b35081ae113f96b71bc49c4e23cf7a39ff2f932f0158e92f240e); /* line */ 
        coverage_0x17ff7472(0x5cef0461e6ea843e67571bc71a68a1dd815517a008f0b6e93f7c45b2646a631b); /* statement */ 
return IERC20(token).allowance(owner, spender);
    }

    function approve(
        address token,
        address spender,
        uint256 amount
    )
        internal
    {coverage_0x17ff7472(0x4ef4c2d7b43ad0ad99d9839917b86247b4dde0e4036129affe6669bdaa926ee4); /* function */ 

coverage_0x17ff7472(0xd375a996cdb700dd2bf648536fa8fa7165dfbd03c62de2f6ad8c2b57f0f85034); /* line */ 
        coverage_0x17ff7472(0x018518dd575b5cd7f10d33634fcab2dd65aef0504356a5b14c6bc08848b35e0b); /* statement */ 
IERC20(token).approve(spender, amount);

coverage_0x17ff7472(0xa506df84a6e766bf2178a0b3060ea9b04c55cf3b55630811489fd4e457b48eb5); /* line */ 
        coverage_0x17ff7472(0x1eec617d0c1b9683fa6024037a08fb458e6b3b74356f8f200dafffa9d6344276); /* statement */ 
Require.that(
            checkSuccess(),
            FILE,
            "Approve failed"
        );
    }

    function approveMax(
        address token,
        address spender
    )
        internal
    {coverage_0x17ff7472(0xd2832b6d5dcc2a0ee152b3aef9f247dd27999e80892067b475f0ec86607bf0c4); /* function */ 

coverage_0x17ff7472(0xd1f21010222f9e50461c82f93dd8a9dd1715c6a90ead4f81cd62d95ed5de6607); /* line */ 
        coverage_0x17ff7472(0x5653313bfc3ef7a0cad74644748df6160b604d767948795d5d6ecbd77933da7a); /* statement */ 
approve(
            token,
            spender,
            uint256(-1)
        );
    }

    function transfer(
        address token,
        address to,
        uint256 amount
    )
        internal
    {coverage_0x17ff7472(0xa880700f5dbabbda194e55d510c60cb0f94f4ac1c8e634e2bb099ce5f6cd1119); /* function */ 

coverage_0x17ff7472(0xb3b5aecb23e59c2b4456bfad6425a2d0ffd2d24f1a169e41085707cf5c84c4a9); /* line */ 
        coverage_0x17ff7472(0x95d32d15be4dc265d605fc32627af966b11087054e6870f8a77984dd9af5f840); /* statement */ 
if (amount == 0 || to == address(this)) {coverage_0x17ff7472(0xb35e2ddbb73feb2a6f07a4f7a134e422ceceb0021169533d8f49334992bc479b); /* branch */ 

coverage_0x17ff7472(0xb38b28a31300f2f3e883ee5a90b51e1ebd5a9ef69d022f8bfc19d38b050b305a); /* line */ 
            coverage_0x17ff7472(0xdfc75587689cf82e9a1b21ac8460a9e5f6a806948f97d33aa699447482604258); /* statement */ 
return;
        }else { coverage_0x17ff7472(0xd734f4b40cd9e143e4aaa0989e5a113f12b2dce4cc9909e8f045159e0b0ef070); /* branch */ 
}

coverage_0x17ff7472(0xc639a7eeb3790f40e75f0a8efaf355b80c86adc59a01b975a3d044d750eb3d62); /* line */ 
        coverage_0x17ff7472(0xe21e74f2301a3dc51f7db05e80fc476d8d4012b49987f641e046cc3887bb2b94); /* statement */ 
IERC20(token).transfer(to, amount);

coverage_0x17ff7472(0x6b10c7c3bda60712445b3601bf54311b652ab0faa3da4319ae2e776787525d0b); /* line */ 
        coverage_0x17ff7472(0x8656136147ddc3cfc843455cf9bdba2c3222d129819964d42f3073ae3a336adc); /* statement */ 
Require.that(
            checkSuccess(),
            FILE,
            "Transfer failed"
        );
    }

    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    )
        internal
    {coverage_0x17ff7472(0xb4a992a7e336ec2b19e0ef2c0738f9aaad1dd864ca81fde51595df130649dada); /* function */ 

coverage_0x17ff7472(0xbdb140473d12ba54c8f2d51e35598e05608a89e99472969b045462e4936f19cf); /* line */ 
        coverage_0x17ff7472(0xfc625493584b80855879789d3fa709a3a59f38c056e2042cd3311df3423c2365); /* statement */ 
if (amount == 0 || to == from) {coverage_0x17ff7472(0xbb55c65dfab3bda23668cb0ab948f04d40bdecf866ec2fc362e8b3e411121d52); /* branch */ 

coverage_0x17ff7472(0x636660a09df26162035f4283056f3c4d7be1f37c262906bf1f10468da964e052); /* line */ 
            coverage_0x17ff7472(0xdb793a979ecf84b406d1684bc94f0ab814536b889a54fa3096dbf8fe0c9dc124); /* statement */ 
return;
        }else { coverage_0x17ff7472(0x26cf085526ac64df2c120c83dcd8ebf9fe184c02b688af2f767c1920fc0051cd); /* branch */ 
}

coverage_0x17ff7472(0x9deba39dc1630bb63898082815a2e5abb276634843df40e85c9cb9b003546e9a); /* line */ 
        coverage_0x17ff7472(0x1ffab46abecd8772cff87a5e79efe751a1a64d42176fa3185034222bf7711640); /* statement */ 
IERC20(token).transferFrom(from, to, amount);

coverage_0x17ff7472(0xb3a12810af63b0391797c5ad8ed9222171314759c13e416b1ec8ae5c105fcd52); /* line */ 
        coverage_0x17ff7472(0x4b64ab56b7396d84189517d69c4344773b9288dcd96ed7753d4b10bee777edca); /* statement */ 
Require.that(
            checkSuccess(),
            FILE,
            "TransferFrom failed"
        );
    }

    // ============ Private Functions ============

    /**
     * Check the return value of the previous function up to 32 bytes. Return true if the previous
     * function returned 0 bytes or 32 bytes that are not all-zero.
     */
    function checkSuccess(
    )
        private
        pure
        returns (bool)
    {coverage_0x17ff7472(0x21f21b276265e33b3e717f646b37fef390d8ce729eb1d8abebe9f794302f2256); /* function */ 

coverage_0x17ff7472(0xa921e850e90981a73b7d7c5c44aaa04156fea4ff7fdb7742a0205098586a4f77); /* line */ 
        coverage_0x17ff7472(0x145546ad6e3d2a44dfab56c401600ee5489989af7e4a90732265e1e8fdd04bfc); /* statement */ 
uint256 returnValue = 0;

        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x17ff7472(0xb968ccbdafc8f4d8ba274d5c288474bc00e30b9ee0bc3dd11fd2c265cf88859a); /* line */ 
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

            // not sure what was returned: don't mark as success
            default { }
        }

coverage_0x17ff7472(0x71c1d06bb9249667e7b5617f672b4d650ab11d35a4171be26dbc44cdb2dceaeb); /* line */ 
        coverage_0x17ff7472(0x2113171f9a721fcb81392e6d13730b00c64c47227e86cc13d0d39f6b57c8cf29); /* statement */ 
return returnValue != 0;
    }
}
