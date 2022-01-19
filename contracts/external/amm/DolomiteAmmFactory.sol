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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/lib/Require.sol";

import "../interfaces/IDolomiteAmmFactory.sol";

import "./DolomiteAmmPair.sol";


contract DolomiteAmmFactory is IDolomiteAmmFactory {

    bytes32 internal constant FILE = "DolomiteAmmFactory";

    address public feeTo;
    address public feeToSetter;
    address public dolomiteMargin;
    address public transferProxy;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    mapping(address => bool) public isPairCreated;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(
        address _feeToSetter,
        address _dolomiteMargin,
        address _transferProxy
    ) public {
        feeToSetter = _feeToSetter;
        dolomiteMargin = _dolomiteMargin;
        transferProxy = _transferProxy;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        Require.that(
            tokenA != tokenB,
            FILE,
            "identical address"
        );
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Require.that(
            token0 != address(0) && token1 != address(0),
            FILE,
            "zero address"
        );
        Require.that(
            getPair[token0][token1] == address(0),
            FILE,
            "pair already exists"
        );
        // single check is sufficient
        bytes memory bytecode = getPairInitCode();
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        ITransferProxy(transferProxy).setIsCallerTrusted(pair, true);
        IDolomiteAmmPair(pair).initialize(token0, token1, transferProxy);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        isPairCreated[pair] = true;
        // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(
            token0,
            token1,
            pair,
            allPairs.length
        );
    }

    function setFeeTo(address _feeTo) external {
        Require.that(
            msg.sender == feeToSetter,
            FILE,
            "forbidden"
        );
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        Require.that(
            msg.sender == feeToSetter,
            FILE,
            "forbidden"
        );
        feeToSetter = _feeToSetter;
    }

    function getPairInitCode() public pure returns (bytes memory) {
        return type(DolomiteAmmPair).creationCode;
    }

    function getPairInitCodeHash() public pure returns (bytes32) {
        return keccak256(type(DolomiteAmmPair).creationCode);
    }
}
