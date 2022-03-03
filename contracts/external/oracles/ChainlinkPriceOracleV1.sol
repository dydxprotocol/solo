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

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

import "../../protocol/interfaces/IPriceOracle.sol";
import "../../protocol/lib/Monetary.sol";
import "../../protocol/lib/Require.sol";

import "../interfaces/IChainlinkAggregator.sol";

import "./IChainlinkFlags.sol";


/**
 * @title ChainlinkPriceOracleV1
 * @author Dolomite
 *
 * An implementation of the dYdX IPriceOracle interface that makes Chainlink prices compatible with the protocol.
 */
contract ChainlinkPriceOracleV1 is IPriceOracle, Ownable {
    using SafeMath for uint;

    bytes32 private constant FILE = "ChainlinkPriceOracleV1";
    // solium-disable-next-line max-len
    address constant private FLAG_ARBITRUM_SEQ_OFFLINE = address(bytes20(bytes32(uint256(keccak256("chainlink.flags.arbitrum-seq-offline")) - 1)));

    event TokenInsertedOrUpdated(
        address indexed token,
        address indexed aggregator,
        address indexed tokenPair
    );

    mapping(address => IChainlinkAggregator) public tokenToAggregatorMap;
    mapping(address => uint8) public tokenToDecimalsMap;

    /// Defaults to USD if the value is the ZERO address
    mapping(address => address) public tokenToPairingMap;

    /// Should defaults to CHAINLINK_USD_DECIMALS when value is empty
    mapping(address => uint8) public tokenToAggregatorDecimalsMap;

    IChainlinkFlags public chainlinkFlags;

    uint8 public CHAINLINK_USD_DECIMALS = 8;
    uint8 public CHAINLINK_ETH_DECIMALS = 18;

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
     * @param chainlinkFlagsOrNull  The contract for layer-2 that denotes whether or not Chainlink oracles are currently
     *                              offline, meaning data is stale and any critical operations should *not* occur. If
     *                              not on layer 2, this value can be set to `address(0)`.
     */
    constructor(
        address[] memory tokens,
        address[] memory chainlinkAggregators,
        uint8[] memory tokenDecimals,
        address[] memory tokenPairs,
        uint8[] memory aggregatorDecimals,
        address chainlinkFlagsOrNull
    ) public {
        // can't use Require.that because it causes the compiler to hang for some reason
        require(
            tokens.length == chainlinkAggregators.length,
            "ChainlinkPriceOracleV1: invalid aggregators length"
        );
        require(
            chainlinkAggregators.length == tokenDecimals.length,
            "ChainlinkPriceOracleV1: invalid token decimals length"
        );
        require(
            tokenDecimals.length == tokenPairs.length,
            "ChainlinkPriceOracleV1: invalid token pairs length"
        );
        require(
            tokenPairs.length == aggregatorDecimals.length,
            "ChainlinkPriceOracleV1: invalid aggregator decimals length"
        );

        for (uint i = 0; i < tokens.length; i++) {
            _insertOrUpdateOracleToken(
                tokens[i],
                tokenDecimals[i],
                chainlinkAggregators[i],
                aggregatorDecimals[i],
                tokenPairs[i]
            );
        }

        if (chainlinkFlagsOrNull != address(0)) {
            chainlinkFlags = IChainlinkFlags(chainlinkFlagsOrNull);
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
        _insertOrUpdateOracleToken(
            token,
            tokenDecimals,
            chainlinkAggregator,
            aggregatorDecimals,
            tokenPair
        );
    }

    // ============ Public Functions ============

    function getPrice(
        address token
    )
    public
    view
    returns (Monetary.Price memory) {
        Require.that(
            address(tokenToAggregatorMap[token]) != address(0),
            FILE,
            "invalid token",
            token
        );
        IChainlinkFlags _chainlinkFlags = chainlinkFlags;
        if (address(_chainlinkFlags) != address(0)) {
            // https://docs.chain.link/docs/l2-sequencer-flag/
            bool isFlagRaised = _chainlinkFlags.getFlag(FLAG_ARBITRUM_SEQ_OFFLINE);
            Require.that(
                !isFlagRaised,
                FILE,
                "Chainlink price oracles offline"
            );
        }

        uint rawChainlinkPrice = uint(tokenToAggregatorMap[token].latestAnswer());
        address tokenPair = tokenToPairingMap[token];

        // standardize the Chainlink price to be the proper number of decimals of (36 - tokenDecimals)
        uint standardizedPrice = standardizeNumberOfDecimals(
            tokenToDecimalsMap[token],
            rawChainlinkPrice,
            tokenPair == address(0) ? CHAINLINK_USD_DECIMALS : tokenToAggregatorDecimalsMap[token]
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

    /**
     * Standardizes `value` to have `ONE_DOLLAR` - `tokenDecimals` number of decimals.
     */
    function standardizeNumberOfDecimals(
        uint8 tokenDecimals,
        uint value,
        uint8 valueDecimals
    ) public pure returns (uint) {
        uint tokenDecimalsFactor = 10 ** uint(tokenDecimals);
        uint priceFactor = IPriceOracle.ONE_DOLLAR.div(tokenDecimalsFactor);
        uint valueFactor = 10 ** uint(valueDecimals);
        return value.mul(priceFactor).div(valueFactor);
    }

    // ============ Internal Functions ============

    function _insertOrUpdateOracleToken(
        address token,
        uint8 tokenDecimals,
        address chainlinkAggregator,
        uint8 aggregatorDecimals,
        address tokenPair
    ) internal {
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
}
