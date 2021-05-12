pragma solidity >=0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

library UniswapV2Library {
function coverage_0x8e85fb56(bytes32 c__0x8e85fb56) public pure {}

    using SafeMath for uint;

    function getPools(
        address factory,
        address[] memory path
    ) internal pure returns (address[] memory) {coverage_0x8e85fb56(0xf8b9723119dd0ab102e7e681218529cd59ea8037357e57cc739522b38ef4f954); /* function */ 

coverage_0x8e85fb56(0xfe361fd759c5530642a3403c539e6fd2d8024622acbc56b0fd0452d93d7e5015); /* line */ 
        coverage_0x8e85fb56(0x0a45105af3ab8465056cd02fe7e33ed8bb365db694ea26e65dae3a4da5cc0241); /* assertPre */ 
coverage_0x8e85fb56(0x9be3c7dc7e05e7174f3b80023ca164cd50e6c22f7757396073aaec4db3a5ff27); /* statement */ 
require(
            path.length >= 2,
            "UniswapV2Library::getPools: INVALID_PATH_LENGTH"
        );coverage_0x8e85fb56(0x0d3238d56cf40d813a36bf23003035429bf358240906330d9c3733117a8997b2); /* assertPost */ 


coverage_0x8e85fb56(0xf225738545848ab8fa1fc69cd6d363f18e1316599e2871eb6e440af3bdfc2e44); /* line */ 
        coverage_0x8e85fb56(0x4d4922329c64fa46572efd0100656b2285f27437105a877de5ccd0070540f279); /* statement */ 
address[] memory pools = new address[](path.length - 1);
coverage_0x8e85fb56(0x0ab287fb4b3d49532b40fad9920f9d02be256f0ce2c2e9c79ea0975a8e2383de); /* line */ 
        coverage_0x8e85fb56(0x66b13e4f57cceb2d62a5a280bf9844208f5b15f36fbd000f7c5a78f13b5af4fe); /* statement */ 
for (uint i = 0; i < path.length - 1; i++) {
coverage_0x8e85fb56(0xdf06438a2227afd228d14c51baf276fd68295e10b83ea5cfdc9a7adfcd56a406); /* line */ 
            coverage_0x8e85fb56(0x34724f02a384fd98b339e6f5bf18a9575bbc45b8aa4f6f6de436e6b5dbc16af4); /* statement */ 
pools[i] = pairFor(factory, path[i], path[i + 1]);
        }
coverage_0x8e85fb56(0x7bc655771891e91903f7cd8e6ccec7cf1ce073ac9dcdb7b1e729cb7fbed05aac); /* line */ 
        coverage_0x8e85fb56(0x726bf61a19a305f3fce4801ac27594be575dccc29ff8a6638c79bd8909af5dde); /* statement */ 
return pools;
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {coverage_0x8e85fb56(0xee9f4b93d92535f9889813fca24bf69f709319eb2376c45274610f87f447c932); /* function */ 

coverage_0x8e85fb56(0x7797bd27ea219a58a8a7abfe55fbeec7c92da193e63be80a62fe0530fb554d95); /* line */ 
        coverage_0x8e85fb56(0x1a99b5c5c15e421a76e6fddaf44dcaebe93e3b3d404ce2b9936d67090a5084b9); /* assertPre */ 
coverage_0x8e85fb56(0xb9f54e9f87abcf8c771a43d9c822b05d16285541cacb458673a6907c44542b37); /* statement */ 
require(tokenA != tokenB, "UniswapV2Library: IDENTICAL_ADDRESSES");coverage_0x8e85fb56(0x38502873b9079776ec02f095564a0d833e98d73b3da49a51b24fdcda91735599); /* assertPost */ 

coverage_0x8e85fb56(0xa538b7bf5ec25f2beaba88c45d70216c9f987ae163ec549dd9e16db0ecfe71dd); /* line */ 
        coverage_0x8e85fb56(0xdb5e8898bdb2a964311816c58a4279b99eeda8cd4d05f410e9d6835f83e53d42); /* statement */ 
(token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
coverage_0x8e85fb56(0x99f1423a93dd9a79d2513193a11631b40737cb73ca48491afae22ea107757e86); /* line */ 
        coverage_0x8e85fb56(0xce81a6f82bed6624918861cdca1632e1ffd8551b4ea1689c8b85fb7fcd00ab33); /* assertPre */ 
coverage_0x8e85fb56(0xd53014c0361c6800a70c331813131767f45c54c8e33310a0f606da7027ae805d); /* statement */ 
require(token0 != address(0), "UniswapV2Library: ZERO_ADDRESS");coverage_0x8e85fb56(0xf371121cb30798f66f5088270f87888eed943ffd05b1f05bf523ff16fab165f1); /* assertPost */ 

    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {coverage_0x8e85fb56(0x150a9fc6b485a37e66594ec0954868d480fccc309b8117c8303af93872e1b0f8); /* function */ 

coverage_0x8e85fb56(0x5083e446661e09298fbbf476b5c8b53e2bf1d7541bea65928a1bcd7f5917152b); /* line */ 
        coverage_0x8e85fb56(0xd50a11b6d29326ffec69a6152cda455eeccbc2959caaaeb3324de4f1ed058040); /* statement */ 
(address token0, address token1) = sortTokens(tokenA, tokenB);
coverage_0x8e85fb56(0x768b0d6e88e40268abc5e547d28eaf6ed18800354d464c3fcc190bbf51988903); /* line */ 
        coverage_0x8e85fb56(0x34b78316707b7c0f85ee66ba7e3d11120934cd7ba9ddb789d7fcefe87517d202); /* statement */ 
pair = address(uint(keccak256(abi.encodePacked(
                hex"ff",
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                keccak256(IUniswapV2Factory(factory).getPairInitCode()) // init code hash
            ))));
    }

    // fetches and sorts the reserves for a pair
    function getReservesWei(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {coverage_0x8e85fb56(0xdcb0a80cf11fede2a89fa6fc249c0e0de65c513bd81a9faa6bc59bfe24828639); /* function */ 

coverage_0x8e85fb56(0x386a14f16ea39bc071baca680528b7bd3ffa7a1a0dff99ec7ffa947f4b32bfc1); /* line */ 
        coverage_0x8e85fb56(0x5f9c47de4aead1d307b0837efdb83c7607a130433c19b4c051dddfe84324abb1); /* statement */ 
(address token0,) = sortTokens(tokenA, tokenB);
coverage_0x8e85fb56(0xe5f8ce1aa19890ea58f7216c43f9ce5ce8d193a6a4f7faa910c224874c6523f5); /* line */ 
        coverage_0x8e85fb56(0x601e344d26695b2dd9057ec346c81fff34c2242957671b473b7fe8243aa93c57); /* statement */ 
(uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReservesWei();
coverage_0x8e85fb56(0xf7d569b78a35e76ec0397e16ee4d33521c445cfeaaacfd115e919ddd50062350); /* line */ 
        coverage_0x8e85fb56(0xc3c25a404d64b55f91da6a97c245fd9b9a728ecece609f1c45c36936d24048f8); /* statement */ 
(reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {coverage_0x8e85fb56(0x605da7688b6983e3fa006573509a6d500902cbe61bc487659663698659345880); /* function */ 

coverage_0x8e85fb56(0xbb8d37af10081f94ee5ea21c7e5c5506fd577bbba48e8c0a8e72c6c21a2012de); /* line */ 
        coverage_0x8e85fb56(0x883553908359ef13465fac133facb48e6b4a407bd561b790f9ff7852d0ed35c2); /* assertPre */ 
coverage_0x8e85fb56(0x980085556b191cdffd76c78a2b74e4dcdf827c47840efc55e086341b43356bb6); /* statement */ 
require(amountA > 0, "UniswapV2Library: INSUFFICIENT_AMOUNT");coverage_0x8e85fb56(0xb13420ca5e9bab950cda5124e060c52f31dd912786a55e85ff6ae046716bf44a); /* assertPost */ 

coverage_0x8e85fb56(0xfbaab8e5ccd212dca10470b1f5adf1e80d28c603ad4c7c47563a65f90605fdc4); /* line */ 
        coverage_0x8e85fb56(0xdee974150dd7f6a2bfc8eb63a83769914e78c828a801e28f7b25502b272f2ab3); /* assertPre */ 
coverage_0x8e85fb56(0x71aa1016b053ee377da01d12f2b81d8b5a2b5dc80f30a29deb41bd3653f950eb); /* statement */ 
require(reserveA > 0 && reserveB > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");coverage_0x8e85fb56(0xbc004b029cd708272d9a11cec2f0477e01a5a50f160c955e2a0283eecce7f484); /* assertPost */ 

coverage_0x8e85fb56(0x7d9863ea6ec014be5593a34bed86834bbfd3b335e764e3bf476f7a0a77df025f); /* line */ 
        coverage_0x8e85fb56(0x4d4893df40babbe37af2a7219421115e3075571be840b59afc8638f50e1ee723); /* statement */ 
amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {coverage_0x8e85fb56(0xc0833a898b027fd44db68fe8928332d62b10c1a80c0242bec5c53829df0f7365); /* function */ 

coverage_0x8e85fb56(0x090583ff3158685e94c0a6bec870c17fa07f0f9b4154d780bd637dcb41398c22); /* line */ 
        coverage_0x8e85fb56(0xa290b91cd7056b6b533688c580b81a5a0a06f7adc548fc089b89a11ebbc032b3); /* assertPre */ 
coverage_0x8e85fb56(0xcb37206f98475fbb1fdc9a9da681930f8d273f57f46beff8bc3478b84f4be204); /* statement */ 
require(amountIn > 0, "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");coverage_0x8e85fb56(0xa49717aeefc85f88f875f39e3ea158bf01945cfc9f255191b84bec8aa66cb079); /* assertPost */ 

coverage_0x8e85fb56(0xb152b94c35b8d3d6556d6dcdee360fa524cc51e1d97b779ce22a8cc8b49cc738); /* line */ 
        coverage_0x8e85fb56(0x816bba379d1fd3c46948f131676b487395a27170b0378b08af753834f793031b); /* assertPre */ 
coverage_0x8e85fb56(0x2cc11e14544e6f43221cb41266121d37f922c52a6b0e9de8c63d5e56620b0013); /* statement */ 
require(reserveIn > 0 && reserveOut > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");coverage_0x8e85fb56(0xe5b4f3d42f18258b4c49fa6df3ec43fb3fc9fc5686b739db86f2f40df92bd1ed); /* assertPost */ 

coverage_0x8e85fb56(0x1a6f7040f34cdfab2998dfdfa74d1ee30dee80cf567dd4e8127565c1c5ee59d4); /* line */ 
        coverage_0x8e85fb56(0x7b1b7429b0973777dccece3d6cadc1cf51cd5665125de3687580314b56373e11); /* statement */ 
uint amountInWithFee = amountIn.mul(997);
coverage_0x8e85fb56(0x8379a4959d33ed5dd6dc47a166e7d317857a50ecae0fddaba63d36f1bc244def); /* line */ 
        coverage_0x8e85fb56(0x7a0b477d9a249f8257755f49c36ebf3e6ec74123fcfd3cce14114d8f2ea2907f); /* statement */ 
uint numerator = amountInWithFee.mul(reserveOut);
coverage_0x8e85fb56(0x1fff86a84c88691b979913b135b7e6c7b9d7fb3eca279bc8274eb1d7d29570d5); /* line */ 
        coverage_0x8e85fb56(0xf91c17440cdcfa18f420dbb44180c2078881b099e5ea58d843c05537308d7531); /* statement */ 
uint denominator = reserveIn.mul(1000).add(amountInWithFee);
coverage_0x8e85fb56(0xaefed0309fe8d9385ddbb951fc6d1857c2f7f8cb856f1168385c6e7266291064); /* line */ 
        coverage_0x8e85fb56(0xe6d118dc1ca157ae30423a3fb8c6876dccd382eed587f68bbbd97fdc1e950ed6); /* statement */ 
amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {coverage_0x8e85fb56(0xaad990e2eb64d94bafb11a17d051084b421021bff6af56439f1af4ceab1811bb); /* function */ 

coverage_0x8e85fb56(0x84b9ec12f6d2565ec3d18e8d6d8196ab351afcb377277cc5a2a94bda4dc4300a); /* line */ 
        coverage_0x8e85fb56(0xc2fd29bf30a2da5cbcf61ae1cc6ac67530e1bfd2b32e819e89a5820608d3337c); /* assertPre */ 
coverage_0x8e85fb56(0xc4fa3500d03d7fe3a659ed1c0c8f9cc683797f725ce7c4cde992555433be4339); /* statement */ 
require(amountOut > 0, "UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");coverage_0x8e85fb56(0x831435f621ff4b692060c53d602288400c2b95dc445c6bf8ec057dc3db9ca4f6); /* assertPost */ 

coverage_0x8e85fb56(0x22674c1c446a6df21b10c93d1cd6380b25dc96d05c74c9e2ecbc4b2f8faeb3c8); /* line */ 
        coverage_0x8e85fb56(0x6e7b86f0a5669f6807a5c789c67775877e4eda46d611654f6b55f95ed6d00bdd); /* assertPre */ 
coverage_0x8e85fb56(0x32db7db50dbc6cda67db27f831103325410a3f566b6fe01c6c91f3249f6b616b); /* statement */ 
require(reserveIn > 0 && reserveOut > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");coverage_0x8e85fb56(0x957137d667dd2c60c54ee87a68070df9e28a0530ff971e36ef0db649cd55a5aa); /* assertPost */ 

coverage_0x8e85fb56(0x34abac5d4967b2ccbcdc68ac4210124d54af7307ade66d4a4b79d1448f01c958); /* line */ 
        coverage_0x8e85fb56(0x96beeafe30ac98addae452ce9ca4a15f41f9aee65dd5ad057275dc30388873f2); /* statement */ 
uint numerator = reserveIn.mul(amountOut).mul(1000);
coverage_0x8e85fb56(0xf9e71d8979118982611dc73baceb6738f24ea7152452481c3f03f090f508e54b); /* line */ 
        coverage_0x8e85fb56(0x09bd6a49cb9e38a5d373cb2a347c7af32e370bfedd31c0b86a341a92afef63ac); /* statement */ 
uint denominator = reserveOut.sub(amountOut).mul(997);
coverage_0x8e85fb56(0x2e19ac0a7c27451511d2e1032ff6b54ebfebb37e1c463241e09404a5fdf09a75); /* line */ 
        coverage_0x8e85fb56(0xab58c20fabb00e888339daa26c9f035232a01f2400979d6b3066fb94f8f25186); /* statement */ 
amountIn = (numerator / denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOutWei(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {coverage_0x8e85fb56(0x15627a4fdbcf74d1ba072588c5415a17397a5082877e8285b0386eb7b2dd7adb); /* function */ 

coverage_0x8e85fb56(0x688da8f34a84b9e51248cb938bf1e1e9b441048c1ac15cddb0ddfb38d09f8c97); /* line */ 
        coverage_0x8e85fb56(0xb06a5334b33fffa8026a19d46e6a7694acdc0fecad987495da3d92712984f646); /* assertPre */ 
coverage_0x8e85fb56(0x3b939c68acd7e026e5a643cb651a67603ec371eb3bec3981284053bc5c642704); /* statement */ 
require(path.length >= 2, "UniswapV2Library: INVALID_PATH");coverage_0x8e85fb56(0xd5991cea60ae24868c2ead3dabe25b6faf21e115598ff5a1383d2e445bba4d85); /* assertPost */ 

coverage_0x8e85fb56(0xc11a0191c73bde824ff62bdc622f24803acfa6cd471e126f58c0c74f88b4da8a); /* line */ 
        coverage_0x8e85fb56(0x2e567f8fd1ce38e3a137b81626d2a728f6006186eb63a1ae616f9babd75eb958); /* statement */ 
amounts = new uint[](path.length);
coverage_0x8e85fb56(0x30ee86b925c495a30ed44071c04e40b0b3c567d680d493ec33fb1e71971ef76d); /* line */ 
        coverage_0x8e85fb56(0xcb5bb892fe3a3a5ae9d3e3924baa783409e8bfcb298fd4e9753bf011cd75c447); /* statement */ 
amounts[0] = amountIn;
coverage_0x8e85fb56(0xf84adee622d9e859dad5f218f09f729acf6da2139c7fc434171c4a0c15b7ae18); /* line */ 
        coverage_0x8e85fb56(0x58502ec30ecac8d154e76554eb9fa4c791d4ddf9442218b6c2bc358186f0cd60); /* statement */ 
for (uint i; i < path.length - 1; i++) {
coverage_0x8e85fb56(0xed65c81459b8c6d601f3b24be797b91c78dacd3e9c0afffc8545cd4973d3b71f); /* line */ 
            coverage_0x8e85fb56(0x3dbdc7427e9f429d80cc344c9451b1aab5baf6b43c960ab6282980c05c821a2b); /* statement */ 
(uint reserveIn, uint reserveOut) = getReservesWei(factory, path[i], path[i + 1]);
coverage_0x8e85fb56(0xc4083e41668ca0714233f2c5c4bed792daaba85ca9227a024122d81cedb02ba4); /* line */ 
            coverage_0x8e85fb56(0x87dbabc474b9a1be567eefddd64d2f76915dd60888829096d1e0ce714b0d11ea); /* statement */ 
amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsInWei(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {coverage_0x8e85fb56(0xca528fda1c8a48fff947b9e8c19404150719fb3be8ec7c6fe13631c7863a3d72); /* function */ 

coverage_0x8e85fb56(0xc38d74b0d735f1d3a0267115b8211ba13ac38fa95c8e05b47b8ef9a80213bc64); /* line */ 
        coverage_0x8e85fb56(0x6bc6b16cb32fc7bfadb155c2fbf37fae783ab4bc7eea3630b65045cb6b69699f); /* assertPre */ 
coverage_0x8e85fb56(0x3032f67839a8b4421ead6b53ca9c7d8be13c72afcbfe29591c4483e07de130fb); /* statement */ 
require(path.length >= 2, "UniswapV2Library: INVALID_PATH");coverage_0x8e85fb56(0xd2deac304fdf18d0c3ae899d886a00d3e043bf4d8662dcc3681d38a4c8ec134b); /* assertPost */ 

coverage_0x8e85fb56(0x72196996ce3aaf790cf8890f8fb7287a12a61ec555de497c97b2a13580ffc484); /* line */ 
        coverage_0x8e85fb56(0x42326adea86e0da35f406f1467060d3b0e4a2944b3f8dd32790c09e9554a1c3e); /* statement */ 
amounts = new uint[](path.length);
coverage_0x8e85fb56(0x2140f3850f40a094382371c2dedafeb22846d39cf8583eb47a3bf4e6bdebaeb8); /* line */ 
        coverage_0x8e85fb56(0x50d3175d8358dabc1f3926501dcb98387f1d2c0928c59f786e5dcd82e6f1c2e6); /* statement */ 
amounts[amounts.length - 1] = amountOut;
coverage_0x8e85fb56(0xc8b40df1f106e49404b91462c33f13a19bc8dbc0cce661dbf0226e4e95f704a8); /* line */ 
        coverage_0x8e85fb56(0x0bf4cc9c927cc54cdf3645729e85f73cce5625d7c7cda5cf8428ea54ae25a3f6); /* statement */ 
for (uint i = path.length - 1; i > 0; i--) {
coverage_0x8e85fb56(0x302c730a4f574eb088ac59671b3044063cfdccc9d1b995c051bc094391305aa7); /* line */ 
            coverage_0x8e85fb56(0x19b77dc2d14d8be22873b98c0dfd0e71e9de64bb94661ee610b86be7443ef9db); /* statement */ 
(uint reserveIn, uint reserveOut) = getReservesWei(factory, path[i - 1], path[i]);
coverage_0x8e85fb56(0x0dff009de6d4e32a170403e563447440cd18c1163ac4ec72f51c6cfd78177b4a); /* line */ 
            coverage_0x8e85fb56(0xf31864cbe37348f571693707b617ab4f126d582b3dc95785c020af76d7f09db4); /* statement */ 
amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}
