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

import { SoloMargin } from "../../protocol/SoloMargin.sol";
import { Require } from "../../protocol/lib/Require.sol";


/**
 * @title OnlySolo
 * @author dYdX
 *
 * Inheritable contract that restricts the calling of certain functions to Solo only
 */
contract OnlySolo {
function coverage_0xe4977db4(bytes32 c__0xe4977db4) public pure {}


    // ============ Constants ============

    bytes32 constant FILE = "OnlySolo";

    // ============ Storage ============

    SoloMargin public SOLO_MARGIN;

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
        public
    {coverage_0xe4977db4(0x0d6d57fb0bb2745919e2f2ca61cee20b5cea6005eb8b4d3669535a1ed532d1be); /* function */ 

coverage_0xe4977db4(0x2b1f0afefd1f5c953b54857ed8f282dca43ab6f988400deb55c1a6d38e8c5109); /* line */ 
        coverage_0xe4977db4(0x3427f23a59e2b12b027314c88e3b11de10ac4626f044a6420d83f18a14910645); /* statement */ 
SOLO_MARGIN = SoloMargin(soloMargin);
    }

    // ============ Modifiers ============

    modifier onlySolo(address from) {coverage_0xe4977db4(0xf0c9fa4a33bdb126ae5c7eddcdeab76dcaa44c7adea4527405b37994b15f4e62); /* function */ 

coverage_0xe4977db4(0xfbf1ed1727665bc94a7c491f788710cdd715387bfe73072f03c3136a2d3e3844); /* line */ 
        coverage_0xe4977db4(0x18ac4c12170b922909dab0e48158280245ac9747d5693b4c7f2a0a3c57d9d827); /* statement */ 
Require.that(
            from == address(SOLO_MARGIN),
            FILE,
            "Only Solo can call function",
            from
        );
coverage_0xe4977db4(0xe925cc53c489b35f40e1d8e3edab472f758675a314deb05e939b819521bbcaa6); /* line */ 
        _;
    }
}
