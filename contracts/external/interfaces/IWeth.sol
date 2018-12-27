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

pragma solidity 0.5.2;
pragma experimental ABIEncoderV2;


/**
 * @title IWeth
 * @author dYdX
 *
 * TODO
 */
interface IWeth {

    function balanceOf(
        address
    )
        external
        view
        returns (uint256);

    function allowance(
        address,
        address
    )
        external
        view
        returns (uint256);

    function()
        external
        payable;

    function deposit()
        external
        payable;

    function withdraw(
        uint256 wad
    )
        external;

    function totalSupply()
        external
        view
        returns (uint256);

    function approve(
        address guy,
        uint wad
    )
        external
        returns (bool);

    function transfer(
        address dst,
        uint256 wad
    )
        external
        returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    )
        external
        returns (bool);
}
