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

import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import {Ownable} from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import {IPriceOracle} from "../../protocol/interfaces/IPriceOracle.sol";
import {Monetary} from "../../protocol/lib/Monetary.sol";
import {IChainlinkAggregator} from "../interfaces/IChainlinkAggregator.sol";


/**
 * @title ChainlinkPriceOracleV1
 * @author Dolomite
 *
 * An implementation of the dYdX IPriceOracle interface that makes Chainlink prices compatible with the protocol.
 */
contract ChainlinkPriceOracleV1 is IPriceOracle, Ownable {

    event TokenInsertedOrUpdated(
        address indexed token,
        address indexed aggregator,
        address indexed tokenPair
    );

    using SafeMath for uint;

    mapping(address => IChainlinkAggregator) public tokenToAggregatorMap;
    mapping(address => uint8) public tokenToDecimalsMap;

    // Defaults to USD if the value is the ZERO address
    mapping(address => address) public tokenToPairingMap;
    // Should defaults to IChainlinkAggregator.USD_AGGREGATOR_DECIMALS when value is empty
    mapping(address => uint8) public tokenToAggregatorDecimalsMap;

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
    ) public {
        require(
            tokens.length == chainlinkAggregators.length,
            "INVALID_LENGTH: chainlinkAggregators"
        );
        require(
            chainlinkAggregators.length == tokenDecimals.length,
            "INVALID_LENGTH: tokenDecimals"
        );
        require(
            tokenDecimals.length == tokenPairs.length,
            "INVALID_LENGTH: tokenPairs"
        );

        for (uint i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            tokenToAggregatorMap[token] = IChainlinkAggregator(chainlinkAggregators[i]);
            tokenToDecimalsMap[token] = tokenDecimals[i];
            if (tokenPairs[i] != address(0)) {
                tokenToPairingMap[token] = tokenPairs[i];
                tokenToAggregatorDecimalsMap[token] = aggregatorDecimals[i];
            }
        }
    }

    // ============ Admin Functions ============

    function insertOrUpdateOracleToken(
        address token,
        uint8 tokenDecimals,
        address chainlinkAggregator,
        uint8 aggregatorDecimals,
        address tokenPair
    ) public onlyOwner {
        tokenToAggregatorMap[token] = IChainlinkAggregator(chainlinkAggregator);
        tokenToDecimalsMap[token] = tokenDecimals;
        if (tokenPair != address(0)) {
            // The aggregator's price is NOT against USD. Therefore, we need to store what it's against as well as the
            // # of decimals the aggregator's price has.
            tokenToPairingMap[token] = tokenPair;
            tokenToAggregatorDecimalsMap[token] = aggregatorDecimals;
        }
        emit TokenInsertedOrUpdated(token, chainlinkAggregator, tokenPair);
    }

    // ============ Public Functions ============

    function getPrice(
        address token
    )
    public
    view
    returns (Monetary.Price memory) {
        require(address(tokenToAggregatorMap[token]) != address(0), "INVALID_TOKEN");

        uint rawChainlinkPrice = tokenToAggregatorMap[token].latestAnswer();
        address tokenPair = tokenToPairingMap[token];

        // standardize the Chainlink price to be the proper number of decimals of (36 - tokenDecimals)
        uint standardizedPrice = standardizeNumberOfDecimals(
            tokenToDecimalsMap[token],
            rawChainlinkPrice,
            tokenPair == address(0) ? tokenToAggregatorMap[token].USD_DECIMALS() : tokenToAggregatorDecimalsMap[token]
        );

        if (tokenPair == address(0)) {
            // The pair has a USD base, we are done.
            return Monetary.Price({value : standardizedPrice});
        } else {
            // The price we just got and converted is NOT against USD. So we need to get its pair's price against USD.
            // We can do so by recursively calling #getPrice using the `tokenPair` as the parameter instead of `token`.
            uint tokenPairStandardizedPrice = getPrice(tokenPair).value;
            // Standardize the price to use 36 decimals.
            uint tokenPairWith36Decimals = tokenPairStandardizedPrice.mul(10 ** uint(tokenToDecimalsMap[tokenPair]));
            // Now that the chained price uses 36 decimals (and thus is standardized), we can do easy math.
            return Monetary.Price({value : standardizedPrice.mul(tokenPairWith36Decimals).div(ONE_DOLLAR)});
        }
    }

    function standardizeNumberOfDecimals(
        uint8 tokenDecimals,
        uint value,
        uint8 valueDecimals
    ) internal pure returns (uint) {
        uint tokenDecimalsFactor = 10 ** uint(tokenDecimals);
        uint priceFactor = IPriceOracle.ONE_DOLLAR.div(tokenDecimalsFactor);
        uint valueFactor = 10 ** uint(valueDecimals);
        if (priceFactor > valueFactor) {
            return value.mul(priceFactor.div(valueFactor));
        } else /* priceFactor <= valueFactor */ {
            return value.div(valueFactor.div(priceFactor));
        }
    }

}
