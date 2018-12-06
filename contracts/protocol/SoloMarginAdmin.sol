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

import { Ownable } from "../tempzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SoloMarginStorage } from "./SoloMarginStorage.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { LDecimal } from "./lib/LDecimal.sol";
import { LInterest } from "./lib/LInterest.sol";
import { LTypes } from "./lib/LTypes.sol";


contract SoloMarginAdmin is
    SoloMarginStorage,
    Ownable,
    ReentrancyGuard
{
    using LDecimal for LDecimal.D128;
    using LDecimal for LDecimal.D64;

    function ownerAddToken(
        address token,
        IPriceOracle oracle
    )
        external
        onlyOwner
        nonReentrant
    {
        // require current oracle can return a value
        require(!oracle.getPrice().equals(LDecimal.zero128()));

        g_activeTokens.push(token);

        g_markets[token].index = LInterest.newIndex();

        g_markets[token].oracle = oracle;
    }

    function ownerSetOracle(
        address token,
        IPriceOracle oracle
    )
        external
        onlyOwner
        nonReentrant
    {
        // require oracle can return value for token
        require(!oracle.getPrice().equals(LDecimal.zero128()));

        g_markets[token].oracle = oracle;
    }

    function ownerSetInterestSetter(
        address token,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        // require current oracle can return a value
        LTypes.Principal memory zero = LTypes.Principal({ value: 0 });
        require(!interestSetter.getNewInterest(token, zero, zero).equals(LDecimal.zero64()));

        g_markets[token].interestSetter = interestSetter;
    }

    function ownerSetMinCollateralRatio(
        LDecimal.D256 memory minCollateralRatio
    )
        public
        onlyOwner
        nonReentrant
    {
        g_minCollateralRatio = minCollateralRatio;
    }

    function ownerSetSpread(
        LDecimal.D256 memory spread
    )
        public
        onlyOwner
        nonReentrant
    {
        g_liquidationSpread = spread;
    }
}
