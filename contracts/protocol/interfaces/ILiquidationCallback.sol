/*

    Copyright 2021 Dolomite.

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

pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import "../lib/Types.sol";


interface ILiquidationCallback {

    /**
     * A callback function to notify the smart contract that it is being liquidated. This function is called before the
     * new balances are set in state, so calling `getAccountPar/Wei` will return this liquidated account's balance
     * before `heldDeltaWei` or `owedDeltaWei` are applied.
     *
     * @param accountNumber The account number being liquidated
     * @param heldMarketId  The market that was positive for this account, whose collateral is being seized
     * @param heldDeltaWei  The amount of seized collateral; always negative or 0
     * @param owedMarketId  The borrowed balance that is being forcefully repaid
     * @param owedDeltaWei  The amount of borrowed assets to be repaid. Always 0 or positive, since the user's balance
     *                      is going from negative to 0.
     */
    function onLiquidate(
        uint accountNumber,
        uint heldMarketId,
        Types.Wei calldata heldDeltaWei,
        uint owedMarketId,
        Types.Wei calldata owedDeltaWei
    ) external;
}
