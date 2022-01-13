/*

    Copyright 2020 Dolomite.

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
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../external/interfaces/IChainlinkAggregator.sol";

contract TestPriceAggregator is IChainlinkAggregator, Ownable {

    string public symbol;
    int256 internal _latestAnswer;

    constructor(
        string memory _symbol
    )
    public
    Ownable() {
        symbol = _symbol;
    }

    function latestAnswer() public view returns (int256) {
        return _latestAnswer;
    }

    function setLatestAnswer(
        int256 __latestAnswer
    )
    public
    onlyOwner {
        _latestAnswer = __latestAnswer;
    }

}
