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

import { IPriceOracle } from "../../protocol//interfaces/IPriceOracle.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { IMakerOracle } from "../interfaces/IMakerOracle.sol";


/**
 * @title WethPriceOracle
 * @author dYdX
 *
 * PriceOracle that returns the price of Wei in USD
 */
contract WethPriceOracle is
    IPriceOracle
{
function coverage_0x133fc216(bytes32 c__0x133fc216) public pure {}

    // ============ Storage ============

    IMakerOracle public MEDIANIZER;

    // ============ Constructor =============

    constructor(
        address medianizer
    )
        public
    {coverage_0x133fc216(0x297537b474d2199874d9af51bd65d2aa8243750cdcb3c4ea2750874a0c68966d); /* function */ 

coverage_0x133fc216(0xbd98a4c5c4a11e29d452ca5e6c8e283ffd79e8e5d4fa43971deb9e3b2e233376); /* line */ 
        coverage_0x133fc216(0x26559c79bf993e4756999ada65454f66f884b754316d69b48f13f643af84de03); /* statement */ 
MEDIANIZER = IMakerOracle(medianizer);
    }

    // ============ IPriceOracle Functions =============

    function getPrice(
        address /* token */
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x133fc216(0x88cb280a8b966ddb6b79d67dc43aa7602bc6402f65c4014a3211db59b851ffd6); /* function */ 

coverage_0x133fc216(0x866216f0159f714044523ee7a54120d1c7669b1c93e7b507358e7d52f65d333c); /* line */ 
        coverage_0x133fc216(0xddfeab8936e749b3ae4c1c311c279d7120e0b62f9a36b3c8f3ffe8537c08fd02); /* statement */ 
(bytes32 value, /* bool fresh */) = MEDIANIZER.peek();
coverage_0x133fc216(0xab01575647e0d1e09aea44c563aca72c88d6b615323797e8391487934183d56f); /* line */ 
        coverage_0x133fc216(0x9673f7e2081720750383482cd52092a06476d7512539886a11bfb262a84792e0); /* statement */ 
return Monetary.Price({ value: uint256(value) });
    }
}
