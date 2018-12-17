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

import { LTypes } from "./LTypes.sol";
import { LToken } from "./LToken.sol";
import { IExchangeWrapper } from "../interfaces/IExchangeWrapper.sol";

/**
 * @title LExcchange
 * @author dYdX
 *
 * This library contains basic functions for interacting with ExchangeWrappers
 */
library LExchange {

    function getCost(
        address exchangeWrapper,
        address supplyToken,
        address borrowToken,
        LTypes.SignedAccrued memory desiredAmount,
        bytes memory orderData
    )
        internal
        view
        returns (LTypes.SignedAccrued memory)
    {
        require(desiredAmount.sign);

        LTypes.SignedAccrued memory result;
        result.sign = false;
        result.accrued = IExchangeWrapper(exchangeWrapper).getExchangeCost(
            supplyToken,
            borrowToken,
            desiredAmount.accrued,
            orderData
        );

        return result;
    }

    function exchange(
        address exchangeWrapper,
        address supplyToken,
        address borrowToken,
        LTypes.SignedAccrued memory requestedFillAmount,
        bytes memory orderData
    )
        internal
        returns (LTypes.SignedAccrued memory)
    {
        require(!requestedFillAmount.sign);

        LToken.transferOut(borrowToken, exchangeWrapper, requestedFillAmount);

        LTypes.SignedAccrued memory result;
        result.sign = true;
        result.accrued = IExchangeWrapper(exchangeWrapper).exchange(
            msg.sender,
            address(this),
            supplyToken,
            borrowToken,
            requestedFillAmount.accrued,
            orderData
        );

        LToken.transferIn(supplyToken, exchangeWrapper, result);

        return result;
    }
}
