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

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../protocol/interfaces/IPriceOracle.sol";
import "../../protocol/lib/Monetary.sol";
import "../interfaces/IChainlinkAggregator.sol";


/**
 * @title ChainlinkPriceOracleV1
 * @author Dolomite
 *
 * An implementation of the dYdX IPriceOracle interface that makes Chainlink prices compatible with the protocol.
 */
contract ChainlinkPriceOracleV1 is IPriceOracle, Ownable {
function coverage_0x62efe4e7(bytes32 c__0x62efe4e7) public pure {}


    using SafeMath for uint;

    event TokenInsertedOrUpdated(
        address indexed token,
        address indexed aggregator,
        address indexed tokenPair
    );

    mapping(address => IChainlinkAggregator) public tokenToAggregatorMap;
    mapping(address => uint8) public tokenToDecimalsMap;

    // Defaults to USD if the value is the ZERO address
    mapping(address => address) public tokenToPairingMap;
    // Should defaults to CHAINLINK_USD_DECIMALS when value is empty
    mapping(address => uint8) public tokenToAggregatorDecimalsMap;

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
     */
    constructor(
        address[] memory tokens,
        address[] memory chainlinkAggregators,
        uint8[] memory tokenDecimals,
        address[] memory tokenPairs,
        uint8[] memory aggregatorDecimals
    ) public {coverage_0x62efe4e7(0x435f7e573c2556a844a0a6268c913d27ca880080da33eb823a767dba94b60aef); /* function */ 

coverage_0x62efe4e7(0x4dd20882dbe5abf86752362e69bc2e189dcd19d37f72e82b2a0128d304329ad1); /* line */ 
        coverage_0x62efe4e7(0xbde9a297f5fc38a8a6515a6f52abc4a66da1174e29e936d616b7f840f69c1e3a); /* assertPre */ 
coverage_0x62efe4e7(0xf2c5b143d3203b9f8857c88e7b454a67b5656474f65f3358d2c35b0a02d05eb4); /* statement */ 
require(
            tokens.length == chainlinkAggregators.length,
            "ChainlinkPriceOracleV1::constructor: INVALID_LENGTH_AGGREGATORS"
        );coverage_0x62efe4e7(0xc7971aff302e9fda57ae8a18d7eb77053bb5a6539fae8366811eef5bd6e7272b); /* assertPost */ 

coverage_0x62efe4e7(0xe0ea26f97dc402363856b0e0b35aca0b64ab6a8ee2445db4ff104b6636e97f6d); /* line */ 
        coverage_0x62efe4e7(0xe643a9af4ac20bc3c7ed9220ce927544dda2f3bc34702d6b72e4e457d5dfb617); /* assertPre */ 
coverage_0x62efe4e7(0x730bc14b459d3abbb5825791e26351665e30a1cf43ba2edf1420d0edbe31106f); /* statement */ 
require(
            chainlinkAggregators.length == tokenDecimals.length,
            "ChainlinkPriceOracleV1::constructor: INVALID_LENGTH_TOKEN_DECIMALS"
        );coverage_0x62efe4e7(0x0456ad6b53b1d4f7b804ac47e7354d59d5dcb9780275e6cf6255065ad6b8b440); /* assertPost */ 

coverage_0x62efe4e7(0x5a1dc14040cc123f0f978588ba3a18908dcd8e57c6cf5e085ef6ff2be804a7e3); /* line */ 
        coverage_0x62efe4e7(0xe8bcb9cfc8a3657e6b1e87d73ea52e7dca4835721189875725bb64191ff67cdf); /* assertPre */ 
coverage_0x62efe4e7(0x056aef29873ddb8586edde0a787af0e9e3b102b1f7703072306aa3eafe5ffdb6); /* statement */ 
require(
            tokenDecimals.length == tokenPairs.length,
            "ChainlinkPriceOracleV1::constructor: INVALID_LENGTH_TOKEN_PAIRS"
        );coverage_0x62efe4e7(0xdf7efc02018cc189a8876bd0c09cbd1d4b8f88f78e846d17f35abf66765bffb2); /* assertPost */ 

coverage_0x62efe4e7(0xc51351b3fc4e09ebdf77a0aa2e45b261eb8bcf0b04155379e0b9c184df5ca44a); /* line */ 
        coverage_0x62efe4e7(0x9e566fb9c54b8b44e6da6d641c631331eba538c9f117391952052bd322803828); /* assertPre */ 
coverage_0x62efe4e7(0x59f39d44460027c9f7abdf579c5e8ed35d6f4e5e66ef6e4f3ecd22558128d125); /* statement */ 
require(
            tokenPairs.length == aggregatorDecimals.length,
            "ChainlinkPriceOracleV1::constructor: INVALID_LENGTH_AGGREGATOR_DECIMALS"
        );coverage_0x62efe4e7(0x9064931ee05530fd835b5bb43847415df297ede4911b191081b0354fa7d42cfa); /* assertPost */ 


coverage_0x62efe4e7(0x507c8dfac8b3886256d3eab5c2e217dbcd2bf23595351444445d921381542fb6); /* line */ 
        coverage_0x62efe4e7(0x5c3f32e0aa081d26e4723ea97d2ade835b69e7b1e00c0c47a055e95a8bbe8007); /* statement */ 
for (uint i = 0; i < tokens.length; i++) {
coverage_0x62efe4e7(0x8c4f24b45aefdb47147f6ae442051559c62f7b39fa1bd31fb3dee84d5cebbce4); /* line */ 
            coverage_0x62efe4e7(0xff56a0198bbb31827e5c484a81e028eb7f373c8cf35bae87d6c43290b6a1e724); /* statement */ 
address token = tokens[i];
coverage_0x62efe4e7(0x212c069a8957ff8400d8bfd879d2daeb912c4fcea5ff920448e6b6b1e4b36641); /* line */ 
            coverage_0x62efe4e7(0xf5ae4614fe3fd98ae51330bde6259ebe7d8e5c11f9e5b592422fc82214105a67); /* statement */ 
tokenToAggregatorMap[token] = IChainlinkAggregator(chainlinkAggregators[i]);
coverage_0x62efe4e7(0x72f977e0703fbc9206c367137a609a1169f208107882743784d58670edafe42f); /* line */ 
            coverage_0x62efe4e7(0xdfe354e578b2ae8e73a7a800441e2b0a5e82e4567be56274c44e707d524cdae5); /* statement */ 
tokenToDecimalsMap[token] = tokenDecimals[i];
coverage_0x62efe4e7(0xdb2ff0cd49b143b236467df5b591c455d978b26fdf09425c219986e029a5435a); /* line */ 
            coverage_0x62efe4e7(0x6fc5bd1292b1f52616ea5ce097274bb39d7d95163addadfc1cf847e415a89a68); /* statement */ 
if (tokenPairs[i] != address(0)) {coverage_0x62efe4e7(0xa63291f7693a2365124d6e6dfe3b631c180c0af597a0c0d4a147c15ac03e960c); /* branch */ 

coverage_0x62efe4e7(0xdc419160ade8f3794e61aedae0557b87202ae441f15a5744ddef379141be5c10); /* line */ 
                coverage_0x62efe4e7(0xd6f87aa3f40c356c969c1d06250c7ee9d985ea91402d2415893764eef9b09066); /* statement */ 
tokenToPairingMap[token] = tokenPairs[i];
coverage_0x62efe4e7(0x5ccbf1b5b5c997ddec61b6fe4ee57d2097ca3eb33eaa3ddab111530fb433b1d9); /* line */ 
                coverage_0x62efe4e7(0x525b003ff195502a4a9081de8a3880198e2551512eca2fc175e5812cfb10241f); /* statement */ 
tokenToAggregatorDecimalsMap[token] = aggregatorDecimals[i];
            }else { coverage_0x62efe4e7(0x954df746d8753dbe47832394c4eb1116509c550c270b688c9424930842836b7b); /* branch */ 
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
    ) public onlyOwner {coverage_0x62efe4e7(0xa61a5c7126a9222e3fa1170f3ea1ea33c752255f67dcbd41c0e5a5091c84f509); /* function */ 

coverage_0x62efe4e7(0x2862dd2464356795ba4db660a7660f160e13a7e809e8dfc5905f1c6a842df029); /* line */ 
        coverage_0x62efe4e7(0x4801ad1a4fe51e869ad13653bc8079bb1a6ac87ff346505153d5e6832f5dd04d); /* statement */ 
tokenToAggregatorMap[token] = IChainlinkAggregator(chainlinkAggregator);
coverage_0x62efe4e7(0x04b01fc36065cc05e264cc14c696129c7bcbe0d96246e26291526a5593d8a00f); /* line */ 
        coverage_0x62efe4e7(0xa5812ab093db23fed10d01c35378a4856dd867c07763bdf5f37a1941df52fa51); /* statement */ 
tokenToDecimalsMap[token] = tokenDecimals;
coverage_0x62efe4e7(0xe8cc28300853a06ad85d314b7937e597a8cee322066a75f47b4a79be757785bd); /* line */ 
        coverage_0x62efe4e7(0xaf7b6e0f7f4b5811527f7847c97e0f42cb83a2a96e1d0e068d0624fbf288638c); /* statement */ 
if (tokenPair != address(0)) {coverage_0x62efe4e7(0x899ca20f9486fd681123661c51366851cb886923ae9bcae871562585f36f941b); /* branch */ 

            // The aggregator's price is NOT against USD. Therefore, we need to store what it's against as well as the
            // # of decimals the aggregator's price has.
coverage_0x62efe4e7(0x553c1a696eccea0dc40efe4234512119d45c3a60f706a1ddbdf3883bebbd0bb5); /* line */ 
            coverage_0x62efe4e7(0x90c9eeefb5ddfe298690323bf2fa12ccdca02efbffbc6fc804a432fc30048528); /* statement */ 
tokenToPairingMap[token] = tokenPair;
coverage_0x62efe4e7(0x5b60599b94d8b677887d6d8b4513fee2b3658c44572a007f2374ba570eafa6a2); /* line */ 
            coverage_0x62efe4e7(0x4870fe0697fc2d46274493cd3504459d854242c4d59b56a1f8b596ee286d2f40); /* statement */ 
tokenToAggregatorDecimalsMap[token] = aggregatorDecimals;
        }else { coverage_0x62efe4e7(0x9aa6ed03a482f760a4fa7d72edab1024b869324e6f90a823639eb310b7ff24d4); /* branch */ 
}
coverage_0x62efe4e7(0xa2187e61682cea85847b5ee5d69aeab6782799de538933b84e5899271f5513a8); /* line */ 
        coverage_0x62efe4e7(0x239d00692252f6d18615724c198d62c2b8c6d597a9c2fd3c4163d3fd284b4c83); /* statement */ 
emit TokenInsertedOrUpdated(token, chainlinkAggregator, tokenPair);
    }

    // ============ Public Functions ============

    function getPrice(
        address token
    )
    public
    view
    returns (Monetary.Price memory) {coverage_0x62efe4e7(0xf86998ef20ce7d1b1001c6507cba024a78086cf8f17785c15e300dfd6c28b83b); /* function */ 

coverage_0x62efe4e7(0x438e88709172f2127cc06cb5f5d29aac2166fe6a2420259bff07af498efd21d8); /* line */ 
        coverage_0x62efe4e7(0x0c5aa7894fc1307781390b6731a18a66f0a1623191d5eedda588316e0a0a1af8); /* assertPre */ 
coverage_0x62efe4e7(0x6816bb2964450aa7ea7d864cd9a4b6303b6e03514690a50520457ae221f53014); /* statement */ 
require(
            address(tokenToAggregatorMap[token]) != address(0),
            "ChainlinkPriceOracleV1::getPrice: INVALID_TOKEN"
        );coverage_0x62efe4e7(0xed58249bb0d6ed8d3cec054ecf2cb1d37b44c184b687f8d8e83ccc5b5af31fb2); /* assertPost */ 


coverage_0x62efe4e7(0x190159a23cb6371bf82cfb219e061ca1c472a8d62e078fa91fa9c3b8b137022a); /* line */ 
        coverage_0x62efe4e7(0xf02b6a6941c99664577a6f0f0eeca9e34ad4edc04e1a4d7addefbfc509549d55); /* statement */ 
uint rawChainlinkPrice = uint(tokenToAggregatorMap[token].latestAnswer());
coverage_0x62efe4e7(0x746d8f6638d7062cd87da508f9203b2c0de4692189f09f56e5bc78d21556cb81); /* line */ 
        coverage_0x62efe4e7(0x72b0c555cf18307b7c9f9f4a624482bd38d7f49f69fe9ac403be1c6723da58de); /* statement */ 
address tokenPair = tokenToPairingMap[token];

        // standardize the Chainlink price to be the proper number of decimals of (36 - tokenDecimals)
coverage_0x62efe4e7(0x51373f5b89238a0a5cff2f5a8b402cffe438e17b6dc74fafba9621dec6b9090c); /* line */ 
        coverage_0x62efe4e7(0x036a44792eadefb167102f9fc6de0ffb481bed9c90c0eec792400f6f0e5ea71a); /* statement */ 
uint standardizedPrice = standardizeNumberOfDecimals(
            tokenToDecimalsMap[token],
            rawChainlinkPrice,
            tokenPair == address(0) ? CHAINLINK_USD_DECIMALS : tokenToAggregatorDecimalsMap[token]
        );

coverage_0x62efe4e7(0x94b1ab9302287c6f7877f1b788a6532781a6bf2dac2a387724ed46f3713f8712); /* line */ 
        coverage_0x62efe4e7(0x746bbff9b903fb4f0b1c65365a406c783ae1c4e2d11b41e9cde01692e7860f1e); /* statement */ 
if (tokenPair == address(0)) {coverage_0x62efe4e7(0xeb23409bc47d83f18964cc72dbe9eca00786ce9363e12ee0d7b445847a04fd3c); /* branch */ 

            // The pair has a USD base, we are done.
coverage_0x62efe4e7(0xd881a7af9b7a52bfe212a704071c8f57439e1cefdd7689f4bc3598df002d8231); /* line */ 
            coverage_0x62efe4e7(0x22abee1f47fd741d891a48c3facc9374e02104b737ac52bfea896ee42f371597); /* statement */ 
return Monetary.Price({value : standardizedPrice});
        } else {coverage_0x62efe4e7(0x16661c12677ed5461183b0c0efda92bce866830cb755f2490bc3820078996ebc); /* branch */ 

            // The price we just got and converted is NOT against USD. So we need to get its pair's price against USD.
            // We can do so by recursively calling #getPrice using the `tokenPair` as the parameter instead of `token`.
coverage_0x62efe4e7(0xa55e76dc852791e5a779b745a6f8886f37d207a15bc93b91c67acb6a4a22b07c); /* line */ 
            coverage_0x62efe4e7(0xcfc24936b8466d598ee8d3f140df3cf06f7ac8787b1cab8b60a8ede733ec45d2); /* statement */ 
uint tokenPairStandardizedPrice = getPrice(tokenPair).value;
            // Standardize the price to use 36 decimals.
coverage_0x62efe4e7(0x741632b6d5b6be0dc792b5564562614b596ced11dcc1d8fa24dc1192d1a85e7c); /* line */ 
            coverage_0x62efe4e7(0x276b72dd29be25dfec6be521dbb35f9213afa2aa8d5ad60b58e0f9f804b69e1d); /* statement */ 
uint tokenPairWith36Decimals = tokenPairStandardizedPrice.mul(10 ** uint(tokenToDecimalsMap[tokenPair]));
            // Now that the chained price uses 36 decimals (and thus is standardized), we can do easy math.
coverage_0x62efe4e7(0xb2a26016d22bd79134ba13e9b484b803def88a2798288c1a49983b1895bb7719); /* line */ 
            coverage_0x62efe4e7(0xfbfc8102f9927aa33350e2675aef95000d1c5b139015f4e8b59db6611404e325); /* statement */ 
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
    ) public pure returns (uint) {coverage_0x62efe4e7(0x468b418bf573bfe2b19acb3a77d929f8dd85835ae62ec6500e9d8017a2f2a23f); /* function */ 

coverage_0x62efe4e7(0x2235d88e3a18f33523032269f38d3aa2a5ae7de797a6c348752ccab166050f28); /* line */ 
        coverage_0x62efe4e7(0x0280e5a9ee029d6d94d05bfd2d602be8907badffc929270808078be5e446cad1); /* statement */ 
uint tokenDecimalsFactor = 10 ** uint(tokenDecimals);
coverage_0x62efe4e7(0x895aacedc06619a0ea8df3e7694043d7df7d980bc06a5ff4a37af68f0ab93311); /* line */ 
        coverage_0x62efe4e7(0xe1f098fc9f4ae6593de25c451acb127d4f6419ccbed3032ca609c325d65b2352); /* statement */ 
uint priceFactor = IPriceOracle.ONE_DOLLAR.div(tokenDecimalsFactor);
coverage_0x62efe4e7(0x89744ba23c975195aa11f33f3880f0f9c4dfb8916dd7ac250e8ef7c2a37c9678); /* line */ 
        coverage_0x62efe4e7(0x79ec6b0c0c9a4e723eea121c751977ec603b652767c82a099e6d3ef4874315a7); /* statement */ 
uint valueFactor = 10 ** uint(valueDecimals);
coverage_0x62efe4e7(0x9829995d13a7bb7ccc60a2fd101a4bdbb05e79174bab515b1a15903ea9bab509); /* line */ 
        coverage_0x62efe4e7(0xad3d9331ab155dc1c6a5201c2a2ea161112a9a20a6f3bf0488d7a2b9e1ad8bbd); /* statement */ 
return value.mul(priceFactor).div(valueFactor);
    }

}
