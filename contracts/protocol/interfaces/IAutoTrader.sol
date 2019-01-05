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

import { Actions } from '../lib/Actions.sol';


/**
 * @title IAutoTrader
 * @author dYdX
 *
 * TODO
 */
contract IAutoTrader {

    // ============ Public Functions ============

    function getTradeCost(
        uint256 makerAsset,
        uint256 takerAsset,
        address taker,
        address makerAccountOwner,
        uint256 makerAccountId,
        address takerAccountOwner,
        uint256 takerAccountId,
        Actions.AssetAmount memory takerAssetAmount,
        bytes memory data
    )
        public
        returns (
            address,
            Actions.AssetAmount memory,
            bytes memory
        );
}
