/*

    Copyright 2019 dYdX Trading Inc.

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

pragma solidity ^0.5.7;

interface ITransferProxy {

    /**
     * @dev Allows or disallows the caller from invoking the different transfer functions in this contract
     */
    function setIsCallerTrusted(address caller, bool isTrusted) external;

    function isCallerTrusted(address caller) external view returns (bool);

    function transfer(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address token,
        uint amount
    ) external;

    function transferMultiple(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address[] calldata tokens,
        uint[] calldata amounts
    ) external;

    function transferMultipleWithMarkets(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        uint[] calldata markets,
        uint[] calldata amounts
    ) external;
}
