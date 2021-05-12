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

import { Math } from "./Math.sol";


/**
 * @title Time
 * @author dYdX
 *
 * Library for dealing with time, assuming timestamps fit within 32 bits (valid until year 2106)
 */
library Time {
function coverage_0x43edd3b6(bytes32 c__0x43edd3b6) public pure {}


    // ============ Library Functions ============

    function currentTime()
        internal
        view
        returns (uint32)
    {coverage_0x43edd3b6(0x35e0a62b5daeef20d6e5d433df68fd4a3813c48c102077615d9c0027c3d4c64b); /* function */ 

coverage_0x43edd3b6(0x480620ee2f2f4073e03a420692f8ed508e4c919aa36b6e52861f816506396b62); /* line */ 
        coverage_0x43edd3b6(0x6affb1844faaf106b9f026afcf3841acf301555433de9299c164d65bd79f904d); /* statement */ 
return Math.to32(block.timestamp);
    }
}
