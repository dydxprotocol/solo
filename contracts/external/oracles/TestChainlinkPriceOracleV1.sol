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

import "./ChainlinkPriceOracleV1.sol";


/**
 * @title ChainlinkPriceOracleV1
 * @author Dolomite
 *
 * An implementation of the dYdX IPriceOracle interface that makes Chainlink prices compatible with the protocol.
 */
contract TestChainlinkPriceOracleV1 is ChainlinkPriceOracleV1 {

    event OverrideOraclePrice(address indexed token, uint8 percent);
    event UnsetOverrideOraclePrice(address indexed token);

    mapping (address => uint8) public tokenToPercentChange;

    /**
     * Note, these arrays are set up, such that each index corresponds with one-another.
     *
     * @param tokens                The tokens that are supported by this adapter.
     * @param chainlinkAggregators  The Chainlink aggregators that have on-chain prices.
     * @param tokenDecimals         The number of decimals that each token has.
     * @param tokenPairs            The token against which this token's value is compared using the aggregator. The
     *                              zero address means USD.
     * @param aggregatorDecimals    The number of decimals that the value has that comes back from the corresponding
     *                              Chainlink Aggregator.
     */
    constructor(
        address[] memory tokens,
        address[] memory chainlinkAggregators,
        uint8[] memory tokenDecimals,
        address[] memory tokenPairs,
        uint8[] memory aggregatorDecimals
    )
    public
    /* solium-disable-next-line no-empty-blocks */
    ChainlinkPriceOracleV1(tokens, chainlinkAggregators, tokenDecimals, tokenPairs, aggregatorDecimals) {
    }

    // ============ Admin Functions ============

    /**
     * @param token     The token whose price should change
     * @param percent   The percent that should be applied to the current oracle price. Use 0 to unset. A value of 100
     *                  indicates no change. 90 is a 10% drop (0.9 times the price) and 110 is a 10% increase (1.1
     *                  times the price).
     */
    function changeOraclePrice(
        address token,
        uint8 percent
    ) public onlyOwner {
        tokenToPercentChange[token] = percent;
        if (percent == 0 || percent == 100) {
            emit UnsetOverrideOraclePrice(token);
        } else {
            emit OverrideOraclePrice(token, percent);
        }
    }

    // ============ Public Functions ============

    function getPrice(
        address token
    )
    public
    view
    returns (Monetary.Price memory) {
        Monetary.Price memory price = super.getPrice(token);
        uint8 percent = tokenToPercentChange[token];
        if (percent == 0 || percent == 100) {
            return price;
        } else {
            return Monetary.Price(price.value.mul(percent).div(100));
        }
    }

}
