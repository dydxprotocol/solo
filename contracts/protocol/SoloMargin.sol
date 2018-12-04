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

pragma solidity 0.5.1;

import { SoloMarginAdmin } from "./SoloMarginAdmin.sol";
import { SoloMarginTransactions } from "./SoloMarginTransactions.sol";


contract SoloMargin is
    SoloMarginTransactions,
    SoloMarginAdmin
{
    constructor (
        address priceOracle,
        address interestOracle,
        uint256 minCollateralRatio,
        uint256 spread
    )
        public
    {
        g_priceOracle = priceOracle;
        g_interestOracle = interestOracle;
        g_minCollateralRatio = minCollateralRatio;
        g_spread = spread;
    }
}
