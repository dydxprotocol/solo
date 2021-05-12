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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Math } from "./Math.sol";


/**
 * @title Decimal
 * @author dYdX
 *
 * Library that defines a fixed-point number with 18 decimal places.
 */
library Decimal {
function coverage_0x16ec37ac(bytes32 c__0x16ec37ac) public pure {}

    using SafeMath for uint256;

    // ============ Constants ============

    uint256 constant BASE = 10**18;

    // ============ Structs ============

    struct D256 {
        uint256 value;
    }

    // ============ Functions ============

    function one()
        internal
        pure
        returns (D256 memory)
    {coverage_0x16ec37ac(0x596ac2566b74ac69cbde77cce4d87356a3c2c56056ca1600a62e947eb0057f3c); /* function */ 

coverage_0x16ec37ac(0x3c748de588a15cd8e5494bc22871baa2426726314cdd29767bfb5124027d252a); /* line */ 
        coverage_0x16ec37ac(0x6ff545f886d36d538720a626b750d2c4d537059bb06b5ee057db39700514cb59); /* statement */ 
return D256({ value: BASE });
    }

    function onePlus(
        D256 memory d
    )
        internal
        pure
        returns (D256 memory)
    {coverage_0x16ec37ac(0x9fd4bfe5ae96a0cac794b6d36e7be949080fe3c5a17f982bbdeed1fe18cbbe76); /* function */ 

coverage_0x16ec37ac(0xeb450532643fead9aa4fc5befe5be07ef7310d9eec9ec698ae56d3b90146683a); /* line */ 
        coverage_0x16ec37ac(0x35f2e6a4cb9e60b4b9b0443c92099009b8d6d4fa48a4780525b0df2ae4477ce7); /* statement */ 
return D256({ value: d.value.add(BASE) });
    }

    function mul(
        uint256 target,
        D256 memory d
    )
        internal
        pure
        returns (uint256)
    {coverage_0x16ec37ac(0x0d8e272c445dd372d3ad5a6f9ceb2bd11ffd6e5e3abb615029a77fb2ba3b8535); /* function */ 

coverage_0x16ec37ac(0x698777f2299d6e18ac200ae438e34cc6c1ee701266c4a273d83d4b4bae5d05b0); /* line */ 
        coverage_0x16ec37ac(0x9401b3ae04a8d1066bc42484cb9452592f4cf8e0777e83ba79b05b0879b46daa); /* statement */ 
return Math.getPartial(target, d.value, BASE);
    }

    function div(
        uint256 target,
        D256 memory d
    )
        internal
        pure
        returns (uint256)
    {coverage_0x16ec37ac(0xf2aeeef4c9831d8df819cf9bc84dde8498af5562f3284d33f82b8620409b7694); /* function */ 

coverage_0x16ec37ac(0x04ff9a7733c1006a9888510716c097e4f575e29b02ea694ca44458127a846080); /* line */ 
        coverage_0x16ec37ac(0x703d27e315fc08983ec84f0858e89f1a658e434bd1e9606472243d8b4bebf6ee); /* statement */ 
return Math.getPartial(target, BASE, d.value);
    }
}
