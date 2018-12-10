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
pragma experimental ABIEncoderV2;

import { LDecimal } from "./lib/LDecimal.sol";
import { Admin } from "./impl/Admin.sol";
import { Queries } from "./impl/Queries.sol";
import { TransactionLogic } from "./impl/TransactionLogic.sol";


contract SoloMargin is
    TransactionLogic,
    Admin,
    Queries
{
    constructor (
        LDecimal.D256 memory minCollateralRatio,
        LDecimal.D256 memory spread
    )
        public
    {
        g_minCollateralRatio = minCollateralRatio;
        g_liquidationSpread = spread;
    }
}
