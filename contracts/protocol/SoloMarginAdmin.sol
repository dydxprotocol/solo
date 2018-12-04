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

import { Ownable } from "../tempzeppelin-solidity/contracts/ownership/Ownable.sol";
import { SoloMarginStorage } from "./SoloMarginStorage.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { IInterestOracle } from "./interfaces/IInterestOracle.sol";
import { LInterest } from "./lib/LInterest.sol";


contract SoloMarginAdmin is
    SoloMarginStorage,
    Ownable
{
    function ownerAddToken(
        address token
    )
        external
        onlyOwner
    {
        g_approvedTokens.push(token);

        g_index(token) = LInterest.Index({
            i: LInterest.BASE,
            t: uint32(block.timestamp),
            r: 0
        });

        // require current oracle can return a value
        require(0 != IPriceOracle(g_priceOracle).getPrice(token));
    }

    function ownerSetPriceOracle(
        address priceOracle
    )
        external
        onlyOwner
    {
        // require oracle can return values for all tokens
        for (uint256 i = 0; i < g_approvedTokens.length; i++) {
            require(0 != IPriceOracle(priceOracle).getPrice(g_approvedTokens[i]));
        }

        g_priceOracle = priceOracle;
    }

    function ownerSetInterestOracle(
        address interestOracle
    )
        external
        onlyOwner
    {
        g_interestOracle = interestOracle;
    }

    function ownerSetMinCollateralRatio(
        uint256 minCollateralRatio
    )
        external
        onlyOwner
    {
        g_minCollateralRatio = minCollateralRatio;
    }

    function ownerSetSpread(
        uint256 spread
    )
        external
        onlyOwner
    {
        g_spread = spread;
    }
}
