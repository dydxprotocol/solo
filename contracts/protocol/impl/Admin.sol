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

import { Ownable } from "../../tempzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "../../tempzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { LDecimal } from "../lib/LDecimal.sol";
import { LPrice } from "../lib/LPrice.sol";
import { LInterest } from "../lib/LInterest.sol";
import { LTypes } from "../lib/LTypes.sol";
import { Storage } from "./Storage.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
contract Admin is
    Storage,
    Ownable,
    ReentrancyGuard
{
    function ownerWithdrawExcessToken(
        address token,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        // TODO
    }

    function ownerAddToken(
        address token,
        IPriceOracle oracle,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        require(!g_markets[token].exists);

        g_activeTokens.push(token);
        g_markets[token].index = LInterest.newIndex();
        g_markets[token].exists = true;

        _setOracle(token, oracle);
        _setInterestSetter(token, interestSetter);
    }

    function ownerSetOracle(
        address token,
        IPriceOracle oracle
    )
        external
        onlyOwner
        nonReentrant
    {
        _setOracle(token, oracle);
    }

    function ownerSetInterestSetter(
        address token,
        IInterestSetter interestSetter
    )
        external
        onlyOwner
        nonReentrant
    {
        _setInterestSetter(token, interestSetter);
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

    function ownerSetEarningsRate(
        LDecimal.D256 memory earningsRate
    )
        public
        onlyOwner
        nonReentrant
    {
        g_earningsRate = earningsRate;
    }

    function ownerSetMinBorrowedValue(
        LPrice.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {
        g_minBorrowedValue = minBorrowedValue;
    }

    // ============ Internal Functions ============

    function _setInterestSetter(
        address token,
        IInterestSetter interestSetter
    )
        private
    {
        require(g_markets[token].exists);

        g_markets[token].interestSetter = interestSetter;

        // require current interestSetter can return a value
        LInterest.TotalPrincipal memory zero;
        require(LInterest.isValidRate(interestSetter.getInterestRate(token, zero)),
            "INVALID INTEREST VALUE"
        );
    }

    function _setOracle(
        address token,
        IPriceOracle oracle
    )
        private
    {
        require(g_markets[token].exists);

        g_markets[token].oracle = oracle;

        // require oracle can return value for token
        require(oracle.getPrice(token).value != 0, "INVALID ORACLE PRICE");
    }
}
