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

import { TestToken } from "./TestToken.sol";
import { IExchangeWrapper } from "../protocol/interfaces/IExchangeWrapper.sol";


/**
 * @title TestExchangeWrapper
 * @author dYdX
 *
 * An ExchangeWrapper for testing
 */
contract TestExchangeWrapper {

    function exchange(
        address /* tradeOriginator */,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata orderData
    )
        external
        returns (uint256)
    {
        (, uint256 result) = parseData(orderData);

        // Transfer away takerTokens
        TestToken(takerToken).transfer(address(0x1), requestedFillAmount);

        // Get makerTokens ready and set approval
        TestToken(makerToken).issue(result);
        TestToken(makerToken).approve(receiver, result);

        return result;
    }

    function getExchangeCost(
        address /* makerToken */,
        address /* takerToken */,
        uint256 desiredMakerToken,
        bytes calldata orderData
    )
        external
        pure
        returns (uint256)
    {
        (uint256 cost, uint256 result) = parseData(orderData);

        require(
            result == desiredMakerToken,
            "Result must equal desiredMakerToken"
        );

        return cost;
    }

    function parseData(
        bytes memory data
    )
        private
        pure
        returns (uint256, uint256)
    {
        require(
            data.length == 64,
            "Exchange data invalid length"
        );

        uint256 result;
        uint256 cost;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            result := mload(add(data, 32))
            cost := mload(add(data, 64))
        }

        return (result, cost);
    }
}
