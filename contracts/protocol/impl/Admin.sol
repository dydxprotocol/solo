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

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import { Storage } from "./Storage.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Token } from "../lib/Token.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
contract Admin is
    Storage
{
    // ============ Owner-Only Functions ============

    function ownerWithdrawExcessTokens(
        uint256 marketId,
        address recipient
    )
        external
        returns (uint256)
    {
        return doDelegateCall();
    }

    function ownerWithdrawUnsupportedTokens(
        address token,
        address recipient
    )
        external
        returns (uint256)
    {
        return doDelegateCall();
    }

    function ownerAddMarket(
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter
    )
        external
    {
        doDelegateCall();
    }

    function ownerSetIsClosing(
        uint256 marketId,
        bool isClosing
    )
        external
    {
        doDelegateCall();
    }

    function ownerSetPriceOracle(
        uint256 marketId,
        IPriceOracle priceOracle
    )
        external
    {
        doDelegateCall();
    }

    function ownerSetInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        external
    {
        doDelegateCall();
    }

    function ownerSetLiquidationRatio(
        Decimal.D256 memory ratio
    )
        public
    {
        doDelegateCall();
    }

    function ownerSetLiquidationSpread(
        Decimal.D256 memory spread
    )
        public
    {
        doDelegateCall();
    }

    function ownerSetEarningsRate(
        Decimal.D256 memory earningsRate
    )
        public
    {
        doDelegateCall();
    }

    function ownerSetMinBorrowedValue(
        Monetary.Value memory minBorrowedValue
    )
        public
    {
        doDelegateCall();
    }

    // ============ Private Functions ============

    function doDelegateCall()
        private
        returns (uint256)
    {
        /* solium-disable-next-line security/no-low-level-calls */
        (bool success, bytes memory returnData) = g_adminlib.delegatecall(msg.data);
        if (!success) {
            revert(string(returnData));
        } else {
            return 0; // TODO
        }
        /*
        assembly {
            let freememstart := mload(0x40)
            returndatacopy(freememstart, 0, returndatasize())
            switch success
            case 0 { revert(freememstart, returndatasize()) }
            default { return(freememstart, returndatasize()) }
        }
        */
    }
}
