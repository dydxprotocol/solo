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

import { IPriceOracle } from "../../protocol/interfaces/IPriceOracle.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";


/**
 * @title UsdcPriceOracle
 * @author dYdX
 *
 * PriceOracle that returns the price of USDC in USD
 */
contract UsdcPriceOracle is
    IPriceOracle
{
function coverage_0x95793ae9(bytes32 c__0x95793ae9) public pure {}

    // ============ Constants ============

    uint256 constant DECIMALS = 6;

    uint256 constant EXPECTED_PRICE = ONE_DOLLAR / (10 ** DECIMALS);

    // ============ IPriceOracle Functions =============

    function getPrice(
        address /* token */
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x95793ae9(0xb6a49d7114e374f1fb06503b6af71f718a898ab2ac87a6fdd3cc6f52d73ebda0); /* function */ 

coverage_0x95793ae9(0xe5efe86d34e19d78d9b19e1a9e0fb106c5355259f5e1a85e64e709668d165eeb); /* line */ 
        coverage_0x95793ae9(0xd6cc2d4392f800eb5d15781a5cab7c72e9d2e51831627177e44e3a608fb141df); /* statement */ 
return Monetary.Price({ value: EXPECTED_PRICE });
    }
}
