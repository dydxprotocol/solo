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

pragma solidity ^0.5.7;


interface IDepositWithdrawalProxy {

    /**
     * @param _accountIndex The index into which `msg.sender` will be depositing
     * @param _marketId     The ID of the market being deposited
     * @param _amountWei    The amount, in Wei, to deposit. Use `uint(-1)` to deposit `msg.sender`'s entire balance
     */
    function depositWei(
        uint _accountIndex,
        uint _marketId,
        uint _amountWei
    ) external;

    /**
     * Same as `depositWei` but converts the `msg.sender`'s sent ETH into WETH before depositing into `DolomiteMargin`.
     *
     * @param _accountIndex The index into which `msg.sender` will be depositing
     */
    function depositETH(
        uint _accountIndex
    ) external payable;

    /**
     * @dev Same as `depositWei` but defaults to account index 0 to save additional call data
     *
     * @param _marketId     The ID of the market being deposited
     * @param _amountWei    The amount, in Wei, to deposit. Use `uint(-1)` to deposit `msg.sender`'s entire balance
     */
    function depositWeiIntoDefaultAccount(
        uint _marketId,
        uint _amountWei
    ) external;

    /**
     * Same as `depositWeiIntoDefaultAccount` but converts the `msg.sender`'s sent ETH into WETH before depositing into
     * `DolomiteMargin`.
     */
    function depositETHIntoDefaultAccount() external payable;

    /**
     * @param _accountIndex The index into which `msg.sender` will be withdrawing
     * @param _marketId     The ID of the market being withdrawn
     * @param _amountWei    The amount, in Wei, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawWei(
        uint _accountIndex,
        uint _marketId,
        uint _amountWei
    ) external;

    /**
     * Same as `withdrawWei` but for withdrawing ETH. The user will receive unwrapped ETH from DolomiteMargin.
     *
     * @param _accountIndex The index into which `msg.sender` will be withdrawing
     * @param _amountWei    The amount, in Wei, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawETH(
        uint _accountIndex,
        uint _amountWei
    ) external;

    /**
     * @dev Same as `depositWei` but defaults to account index 0 to save additional call data
     *
     * @param _marketId     The ID of the market being withdrawn
     * @param _amountWei    The amount, in Wei, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawWeiFromDefaultAccount(
        uint _marketId,
        uint _amountWei
    ) external;

    /**
     * Same as `withdrawWeiFromDefaultAccount` but for withdrawing ETH. The user will receive unwrapped ETH from
     * DolomiteMargin.
     *
     * @param _amountWei    The amount, in Wei, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawETHFromDefaultAccount(
        uint _amountWei
    ) external;

    /**
     * @param _accountIndex The index into which `msg.sender` will be depositing
     * @param _marketId     The ID of the market being deposited
     * @param _amountPar    The amount, in Par, to deposit.
     */
    function depositPar(
        uint _accountIndex,
        uint _marketId,
        uint _amountPar
    ) external;

    /**
     * @dev Same as `depositPar` but defaults to account index 0 to save additional call data
     *
     * @param _marketId     The ID of the market being deposited
     * @param _amountPar    The amount, in Par, to deposit.
     */
    function depositParIntoDefaultAccount(
        uint _marketId,
        uint _amountPar
    ) external;

    /**
     * @param _accountIndex The index into which `msg.sender` will be withdrawing
     * @param _marketId     The ID of the market being withdrawn
     * @param _amountPar    The amount, in Par, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawPar(
        uint _accountIndex,
        uint _marketId,
        uint _amountPar
    ) external;

    /**
     * @dev Same as `withdrawPar` but defaults to account index 0 to save additional call data
     *
     * @param _marketId     The ID of the market being withdrawn
     * @param _amountPar    The amount, in Par, to withdraw. Use `uint(-1)` to withdraw `msg.sender`'s entire balance
     */
    function withdrawParFromDefaultAccount(
        uint _marketId,
        uint _amountPar
    ) external;
}
