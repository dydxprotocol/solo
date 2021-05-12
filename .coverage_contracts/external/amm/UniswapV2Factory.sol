pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";

import "../interfaces/IUniswapV2Factory.sol";

import "./UniswapV2Pair.sol";
import "../../protocol/Permission.sol";
import "../../protocol/Permission.sol";
import "../../protocol/Permission.sol";

contract UniswapV2Factory is IUniswapV2Factory {
function coverage_0x14bed2b3(bytes32 c__0x14bed2b3) public pure {}

    address public feeTo;
    address public feeToSetter;
    address public soloMargin;
    address public transferProxy;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    mapping(address => bool) public isPairCreated;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(
        address _feeToSetter,
        address _soloMargin,
        address _transferProxy
    ) public {coverage_0x14bed2b3(0x6420089ae37b284c1af35e76fdb6781dba84b832586a083130268ba2b10a406a); /* function */ 

coverage_0x14bed2b3(0x8c3ed4544fd1682453adcadb929a3b6df3275101e9ba123382446e6a08857256); /* line */ 
        coverage_0x14bed2b3(0xdcd8193cd6ac60bd03465afd9a4759cb591acc7e6ce5a8c678cb8e80911e51e5); /* statement */ 
feeToSetter = _feeToSetter;
coverage_0x14bed2b3(0x0a2ef37e664c2d2c14bc786d2389637aa19a4ca4d5388283296762c8ba4692e1); /* line */ 
        coverage_0x14bed2b3(0x6114f0599804d03532c370cb70adb722e62e2cf78c1a1da6b55e183740325d56); /* statement */ 
soloMargin = _soloMargin;
coverage_0x14bed2b3(0xf13e7facc949db55b7c7c740e646862ebb0e253777afb2db4f06bf3824cbaae1); /* line */ 
        coverage_0x14bed2b3(0xcc29bb825c8dc1a0ab13f211270d35e99ae50bac87f78f46808b4782b908ec9b); /* statement */ 
transferProxy = _transferProxy;
    }

    function allPairsLength() external view returns (uint) {coverage_0x14bed2b3(0xf2e2c549703c6f4869800a27c81d3d5a473fc1e7454c131ee198819f9b1a57ec); /* function */ 

coverage_0x14bed2b3(0x2fcb7de7d78dbce8f2295b5c925af61752d4bfceb9fbc3a1420787242eab49bd); /* line */ 
        coverage_0x14bed2b3(0x1235b91d801779d38a26fc7fcc4775e18aeab3c56eb0c109e5190dc07a799836); /* statement */ 
return allPairs.length;
    }

    function getPairInitCode() public pure returns (bytes memory) {coverage_0x14bed2b3(0xcd30d3fbf7f9d8df608e0ccd364de900d63dbca1f48cc73ad4980f01bdbd9200); /* function */ 

coverage_0x14bed2b3(0xde4bfd0d0eb1de4674e4a9b0775da5ab9505833a088c288aef2863f07e41a538); /* line */ 
        coverage_0x14bed2b3(0x09442719d8e9926341243e00d1e8de62d6498a9b9ceb6c99985c8f98e14ff65f); /* statement */ 
return type(UniswapV2Pair).creationCode;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {coverage_0x14bed2b3(0x3163dea28b0bd312d3346616f7b295ea71d70779320ba822bdbe2273715dd825); /* function */ 

coverage_0x14bed2b3(0x4a09ca3e3ae1766692ef36d97189df5636a0f42a5f1d3f8be0c6672e60ae6541); /* line */ 
        coverage_0x14bed2b3(0x976d56a2d34a32309475e4bff5e327cedde299f6e565b4024d94b3e0dbfc80d5); /* assertPre */ 
coverage_0x14bed2b3(0x47c55d9e45afcd217c97f6da9f88f16fefdc427e6b9a9ba3fae87b2bc50a9296); /* statement */ 
require(tokenA != tokenB, "UniswapV2: IDENTICAL_ADDRESSES");coverage_0x14bed2b3(0x215fb33c03b9a45b8d28fc71cf09aae50d72924e4fb2c77434b2ee5a52acc2df); /* assertPost */ 

coverage_0x14bed2b3(0xb300b43087d2e5a5091906e6816ac98b72956bee42ed34e6c291b59ace8890bc); /* line */ 
        coverage_0x14bed2b3(0x128c2a63399376b11be453b022912e4e63229d226035a2fa1935d8742e0adb9d); /* statement */ 
(address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
coverage_0x14bed2b3(0x6a898a4a86db0cf7065e3b47bcbed03895d34284c517c69987c3247319178837); /* line */ 
        coverage_0x14bed2b3(0x1c8f55f28d044f9b5df77217ac5ffffab811e041a60d944e70d6f0a622e3b602); /* assertPre */ 
coverage_0x14bed2b3(0x2101fdecebdac6dddefa5d47c1d53c7ec4de2c4ca5d57e118d13a172a913a2bb); /* statement */ 
require(token0 != address(0), "UniswapV2: ZERO_ADDRESS");coverage_0x14bed2b3(0xf78e7911d3c1a50ed398cb6b66734b9f5acc6d6ede9ee1e016612f7802fc54d2); /* assertPost */ 

coverage_0x14bed2b3(0x1fbbc5ed6ec6978b564f5446f21d0309dec7da90bd846cb776450be87acdba90); /* line */ 
        coverage_0x14bed2b3(0x8065b8cd3dd9b3041a4066a53c6bf31d4a4017a17d8449edee967c7e10c14134); /* assertPre */ 
coverage_0x14bed2b3(0x074119da38c3d14e20f6e8810660b6e113ed8b88629e66f2ec7a5a59e755103e); /* statement */ 
require(getPair[token0][token1] == address(0), "UniswapV2: PAIR_EXISTS");coverage_0x14bed2b3(0x95a326702e10ec572117e8bb24befcc4ca8f03ba85d355bd27ba48223e8e1fef); /* assertPost */ 

        // single check is sufficient
coverage_0x14bed2b3(0x69da801d808914430c50f4f649e20d7806ba5365efdb0b78f0c58095d04a75e7); /* line */ 
        coverage_0x14bed2b3(0xfa0db7757221aab7454a04ccf20befdff6dedb56331eff47122a3ab6d717fc73); /* statement */ 
bytes memory bytecode = getPairInitCode();
coverage_0x14bed2b3(0xa1e8a7b474207802ddaa91bbf8d360dd048a6668155eae3cd2517fdd78182805); /* line */ 
        coverage_0x14bed2b3(0xb0eed0d882869f0a418e68ad9e65b113f4ee6a5a60ca2c572198ca88e7d8909f); /* statement */ 
bytes32 salt = keccak256(abi.encodePacked(token0, token1));
coverage_0x14bed2b3(0x2a6ec0829f6fb66f4e1ed83d1c71a98eb8d8a7f3c55d661dd64d7b52396bd232); /* line */ 
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
coverage_0x14bed2b3(0xc2a89105c415019f47f2f0ee3be74f7abef3b39087c2990930e5652e84bad1e9); /* line */ 
        coverage_0x14bed2b3(0xb99bbe50439b028836e99351aff09f3c596add2dfe045baa3641154e6d09f326); /* statement */ 
IUniswapV2Pair(pair).initialize(token0, token1, transferProxy);
coverage_0x14bed2b3(0x4df08a2210628ae29003866fdea0076cde62e172843eac0b2922b260cd2bf14e); /* line */ 
        coverage_0x14bed2b3(0x3f0cd16da58dd6bbe9dec54af52e504710cf5361deb683281f8762d0f08f2f2e); /* statement */ 
getPair[token0][token1] = pair;
coverage_0x14bed2b3(0x34f8d6ab20433ff2c02d3e5d5c53a5137f22b2db188c53300e7cfb85dd0f0222); /* line */ 
        coverage_0x14bed2b3(0xa3768569e9c0cb7add08de35f0dd473d80260ca638f8faf382dd1bd43de02f96); /* statement */ 
getPair[token1][token0] = pair;
coverage_0x14bed2b3(0xa01d5f107add6b684b7c7b9585550256dd786ff401c1159998c971588265f250); /* line */ 
        coverage_0x14bed2b3(0x1b3c95df00c7f37211da3f08a918c08e014c56c13a63e580b6be46a134cebcdc); /* statement */ 
isPairCreated[pair] = true;
        // populate mapping in the reverse direction
coverage_0x14bed2b3(0xeb7e9cf0b7618609b97cac6c53c6c9d80926e7861cae1aca698163d1ee47e9aa); /* line */ 
        coverage_0x14bed2b3(0x42bc8453b602a1e983735a205cc69b5eba38abbde6d600a728dc0a81e7bc594b); /* statement */ 
allPairs.push(pair);
coverage_0x14bed2b3(0xea5114663ea560459b83e4879a74b400a7425cf2ad27c60c2a354175e8bfabf1); /* line */ 
        coverage_0x14bed2b3(0x9ba588dc27214cf94011aae236cb937c81fe067f616cd4b9f82c795bd1ad31fd); /* statement */ 
emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {coverage_0x14bed2b3(0x12a23751c52dc4f2c06d7f89acc40a1af71c8529271cf8704bbfed4cb0d03ea6); /* function */ 

coverage_0x14bed2b3(0xc44e84d35ca8eeb36e11898dc5e2eadabbfef59d6a30804de19d7178f6a9119a); /* line */ 
        coverage_0x14bed2b3(0xdc2da77e35d74597e9f54b69ea8feae482b04c7d1eea65bf51674e7f3b10fa84); /* assertPre */ 
coverage_0x14bed2b3(0x20f8013ed73a04fc8ef7f9d1b0022361fdce06a3ff5b2cfef6297e4e16107dad); /* statement */ 
require(msg.sender == feeToSetter, "UniswapV2: FORBIDDEN");coverage_0x14bed2b3(0x56b09b8ade9605abf38d59fe25918da7c8f190f5efcf799eb0bd4f6f39984644); /* assertPost */ 

coverage_0x14bed2b3(0x653eb5d1075e0187c098f60fe42fc58c8478f970e9a97483cc70c77f3c053e8f); /* line */ 
        coverage_0x14bed2b3(0x5058e34e966e4392f1c4184dfc47ebcaa50297a2b0c1227d3a0e84e5f6c86648); /* statement */ 
feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {coverage_0x14bed2b3(0x7ccc731d6867a367f781ea9f3878b2abff8e9afbf409738435f2249d87f49dd7); /* function */ 

coverage_0x14bed2b3(0x0a14d9d573141a01f0bf0ee3a424b292b269fcfab8107a2c171841226aac3adf); /* line */ 
        coverage_0x14bed2b3(0x4896117755eab660b92792c99810d562f2f960a4941c671f61390d31f565decf); /* assertPre */ 
coverage_0x14bed2b3(0xef7717ed46e562bb0fe8a870af7ef1052e4da2955d4432fee2b0b97333459a17); /* statement */ 
require(msg.sender == feeToSetter, "UniswapV2: FORBIDDEN");coverage_0x14bed2b3(0xc8a4d11c45144d979332d5a6dc9ea56ed003c1c1073cb53eddae06fa01ca4564); /* assertPost */ 

coverage_0x14bed2b3(0xc86b8d93cb5f1bb8c19f20d857b3c5788e41709bf8360bb1fb07d76d75f0181d); /* line */ 
        coverage_0x14bed2b3(0xaefe6158d7070d668178fd5cd52c8bc92e0cf6096e195d3d6fe2652934fb6c3c); /* statement */ 
feeToSetter = _feeToSetter;
    }
}
