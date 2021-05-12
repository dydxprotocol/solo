pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/interfaces/IAutoTrader.sol";
import "../../protocol/interfaces/ISoloMargin.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

import "../lib/AdvancedMath.sol";
import "../lib/UQ112x112.sol";

import "../proxies/TransferProxy.sol";

import "./UniswapV2ERC20.sol";

contract UniswapV2Pair is IUniswapV2Pair, UniswapV2ERC20, IAutoTrader {
function coverage_0x04803ab0(bytes32 c__0x04803ab0) public pure {}

    using SafeMath  for uint;
    using UQ112x112 for uint224;

    bytes32 private constant FILE = "UniswapV2Pair";

    uint public constant INTEREST_INDEX_BASE = 1e18;
    uint public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factory;
    address public soloMargin;
    address public soloMarginTransferProxy;
    address public token0;
    address public token1;

    uint112 private reserve0Par;            // uses single storage slot, accessible via getReserves
    uint112 private reserve1Par;            // uses single storage slot, accessible via getReserves
    uint32  private blockTimestampLast;     // uses single storage slot, accessible via getReserves

    uint128 public marketId0;
    uint128 public marketId1;

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

    uint private unlocked = 1;
    modifier lock() {coverage_0x04803ab0(0x14a673dc919d184d8f5ffd42ad8335e3089358f2b5c27b78e06b5c84f5f89a9c); /* function */ 

coverage_0x04803ab0(0xd7546cdfeedb893b4a2ac44710ad5cd0a3de0246645c53cc42264b0b9b04ae00); /* line */ 
        coverage_0x04803ab0(0x7c483ab2865348ea16bcd490d90bb284a02d7c7d2762715a9474416eb959a8cb); /* assertPre */ 
coverage_0x04803ab0(0x481eb921592f486d9201b77dfe2bb2d06838b99e0c3e87cd4b13cb0dd97390e6); /* statement */ 
require(unlocked == 1, "UniswapV2: LOCKED");coverage_0x04803ab0(0xbe71e95b11d6a40ee80c878767e08799f8514d6bb4106faeb1123afb3893ebea); /* assertPost */ 

coverage_0x04803ab0(0x4b098245f05f9e4253b57f64acbf27c5e142baab250699a6f432a24d8ee570c3); /* line */ 
        coverage_0x04803ab0(0x51537eaa392812c57e9004f6f350683e49cc43cd4223135f802aeb64cd4a3d37); /* statement */ 
unlocked = 0;
coverage_0x04803ab0(0xd51a45addc63190fe84e33a5dc2e12a887e1766c4d6028986543438879c4f0b4); /* line */ 
        _;
coverage_0x04803ab0(0x2ab429b042366526f7b31f31c5dbda1c76361eb07acc5e4b482fd3b2977c8fc1); /* line */ 
        coverage_0x04803ab0(0x7df14e3a8ef57606735bb427b00ba4274211918e5dd65e281552aa69056877c5); /* statement */ 
unlocked = 1;
    }

    struct Cache {
        ISoloMargin soloMargin;
        uint marketId0;
        uint marketId1;
        uint balance0;
        uint balance1;
        Interest.Index inputIndex;
        Interest.Index outputIndex;
    }

    constructor() public {coverage_0x04803ab0(0xf4b3d13ef4330b13ed657f3dcc2492d9c28081304e71841aece29d2ac7177030); /* function */ 

coverage_0x04803ab0(0xa1c638345819230e11e5301988840d9ab36406f7932a5bcd8350a7bcbfaee169); /* line */ 
        coverage_0x04803ab0(0xc4f4af29635ebebc49ecb12a305cf537fee888766d6bc524d355b0d5889ab12f); /* statement */ 
factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(address _token0, address _token1, address _transferProxy) external {coverage_0x04803ab0(0xe1a4e485d0a55034a4dda08b1aebc51ce16d55cc28f85e28a082a3218bacbae2); /* function */ 

coverage_0x04803ab0(0x2fe406131549babdc1f7a9e93f020ae18bdf9def6bd9eb2858ecb3ea5f2cb36f); /* line */ 
        coverage_0x04803ab0(0xd353400aae1ffc5b3bea22991615199081ee0a3494a9b7e3c86a92507d6f9939); /* assertPre */ 
coverage_0x04803ab0(0xbce96cdc4d033e5a4d36317936d48b1080c0c6ec135587d599dbf6cd371639ec); /* statement */ 
require(msg.sender == factory, "UniswapV2: FORBIDDEN");coverage_0x04803ab0(0xd432e0b7d252b85910f229e6010e9fdbc772af464b93ddece82536188d57c69f); /* assertPost */ 

        // sufficient check
coverage_0x04803ab0(0x119e01eeed729be59d1e1b8f00e6e274ea30be28d4e07df84902698cdaf11363); /* line */ 
        coverage_0x04803ab0(0xd45bc97523fce6d462276b687e2e0d5b3b7cc87c5124076909641122ea22bfa2); /* statement */ 
token0 = _token0;
coverage_0x04803ab0(0xe8ffc04b27f23417948dd9d71752bf9542bf1b4257d413c2eca5e1f608d7611e); /* line */ 
        coverage_0x04803ab0(0x6b4ed37cd39ea86bcf93801b79fef1f46bae53f16b2444a4ca12b7fbb26ff76f); /* statement */ 
token1 = _token1;
coverage_0x04803ab0(0x917f419efc840d4f474c2750185c7be91faf6d31911aeef80269c615547a002e); /* line */ 
        coverage_0x04803ab0(0x67fe0ad0c4505e6fce44d9daa180d35905678b2ba2273ea0ff80bd4a639e4b0a); /* statement */ 
soloMargin = IUniswapV2Factory(msg.sender).soloMargin();
coverage_0x04803ab0(0xe851cebd894d97aaf698264cce8498945426976ec26bb9e46f55db82dd4afd61); /* line */ 
        coverage_0x04803ab0(0x2200af92f1ca4cf56e4f0645fc078cdc2d4a7ae409afc5e499449970c3be0bea); /* statement */ 
soloMarginTransferProxy = _transferProxy;

coverage_0x04803ab0(0xf46d518457f4128c3626095627ff0c1c8a99d3f22607d89212c80af9499ff76d); /* line */ 
        coverage_0x04803ab0(0xa69ab8b357ae8017219d673e4812eee05999a4d6756f77c8a8fab3e1ada6c1ae); /* statement */ 
marketId0 = uint128(ISoloMargin(soloMargin).getMarketIdByTokenAddress(token0));
coverage_0x04803ab0(0x7b5c51ca0d4d1d6dcd2a2c20c47d638f8a9128edfc3e5a91e00b046e7fcf09f8); /* line */ 
        coverage_0x04803ab0(0x74ded08960e21a212566730e402aece6a6448fc18421b6098eecb794cb289bcb); /* statement */ 
marketId1 = uint128(ISoloMargin(soloMargin).getMarketIdByTokenAddress(token1));
    }

    function getReservesPar() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {coverage_0x04803ab0(0xda8552382d33c63dfee9c7ab8cace410d8657c98f8a57eb1feb2a6acc7093adc); /* function */ 

coverage_0x04803ab0(0xe2fc551bdff85055b74699292ed57b72820454d0c62c42af37a3892a072ed6f1); /* line */ 
        coverage_0x04803ab0(0x31996cde4e8448919b84bbb559ce9c901a0ea126c8fd8ff097a70b209e69ca4a); /* statement */ 
_reserve0 = reserve0Par;
coverage_0x04803ab0(0xc1467c41b80eaa2ccf3d444e9f780a6a74b4722031c59997c94f2fab03df0463); /* line */ 
        coverage_0x04803ab0(0x66304ca0ea98fb5de1fd3961b133e994ef1633f5e5591ba34b231013a5d8b4f6); /* statement */ 
_reserve1 = reserve1Par;
coverage_0x04803ab0(0x203f036768568513bd9a215ade444c8b7a750e25aac0a89b8b0d38d98da237f9); /* line */ 
        coverage_0x04803ab0(0x061b32657ccef2b9ca79402f5cff662326bb0528764825445a725cc2a3534966); /* statement */ 
_blockTimestampLast = blockTimestampLast;
    }

    function getReservesWei() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {coverage_0x04803ab0(0x81ae619fc6d3e5775a1a0b94bb135c3562e0108d1130d0c56e0d254c0f93aa48); /* function */ 

coverage_0x04803ab0(0x48108aff128fad7f67885c0e21c2dfc26b019796612860ea43209ef760bff595); /* line */ 
        coverage_0x04803ab0(0xa6d2369e93edab3c3fe884939e81b3f9d154e0863141c7eb33df62e93d487ad7); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);

coverage_0x04803ab0(0xecabea00b724cd43de802ab30de6446559a14a5a7479e44442183992ff0d14be); /* line */ 
        coverage_0x04803ab0(0xbd46a973e57c2a9018a4c8617d5968a25579bd3069b3b10c2c0e80af7d173b11); /* statement */ 
uint reserve0InterestIndex = _soloMargin.getMarketCurrentIndex(marketId0).supply;
coverage_0x04803ab0(0x1b2ccc0324f95df8392d429a9fa6481ddfa820d5f0d784589a478fe538c72471); /* line */ 
        coverage_0x04803ab0(0x4fc311c7d7d5105f35ec5349eed1a1bfcf870dd6bb68d43fd27e76ce25560fda); /* statement */ 
uint reserve1InterestIndex = _soloMargin.getMarketCurrentIndex(marketId1).supply;

coverage_0x04803ab0(0xdb7bc5a4dc9b13bb350741a5418caf775ebd9c4db98a02157d99acda7eb0cbc4); /* line */ 
        coverage_0x04803ab0(0x37537781a0f26de752d875f2b4d70b888ce079d0f9d83e25387750e34a1f911a); /* statement */ 
_reserve0 = uint112(uint(reserve0Par).mul(reserve0InterestIndex).div(INTEREST_INDEX_BASE));
coverage_0x04803ab0(0x370ff5751a24e5e3cc593944ae2848c1802436944abdaa244468265eafea36f2); /* line */ 
        coverage_0x04803ab0(0xb70dbe1a28e696f345a841c0f352dc57eabbaab8ff274088763f58eb7eed908d); /* statement */ 
_reserve1 = uint112(uint(reserve1Par).mul(reserve1InterestIndex).div(INTEREST_INDEX_BASE));
coverage_0x04803ab0(0x2808b9b1a98ad229bf163e9329f0ecea44d64827d444f28a883bfd02dc6188e1); /* line */ 
        coverage_0x04803ab0(0xd3a43f59ccef1f7bebb25d249de76359ef4625b07a815fdd11480571d93c7ea5); /* statement */ 
_blockTimestampLast = blockTimestampLast;
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external lock returns (uint liquidity) {coverage_0x04803ab0(0xf2027017ff2d3bfbc9d5d98504d3108822286d564a826bfaf1e55a0424b97970); /* function */ 

coverage_0x04803ab0(0xb0beb002452331da259df24737388fc7145c4e9f6d73f32656372f5de7eca70c); /* line */ 
        coverage_0x04803ab0(0x9344f91ae7e2c42a6b9044bd48365f86d6e6182ea9f08a1cae863cc87d6cfe75); /* statement */ 
(uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
coverage_0x04803ab0(0xc486df13158d39b8d7801a8cf617933731986cbed09d8156442c24f068918f57); /* line */ 
        coverage_0x04803ab0(0x6537ac350d404b86d0102ed2ae13fcefc4c8a743f55fbb5cadc4f4e8128443f6); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);
coverage_0x04803ab0(0xf526b78fe6db316362c91b75378c224448728c004e5f78344f007aa397c68a09); /* line */ 
        coverage_0x04803ab0(0xd39f5c2d584f8d830586b20bf35949d4860d0eaade477a1ebb608df6b5859db6); /* statement */ 
uint balance0 = _getTokenBalancePar(_soloMargin, marketId0);
coverage_0x04803ab0(0x67bfe7685c4053950c4bd81d9b478812f92aa7a7ea860ce90a146d909e827c7f); /* line */ 
        coverage_0x04803ab0(0x18ad0d56e0f3eba1910a3a89af99773d11336968d9602e685a2da5511d2082ee); /* statement */ 
uint balance1 = _getTokenBalancePar(_soloMargin, marketId1);
coverage_0x04803ab0(0x04abb9766a7265ccc3cf11834f6d82944e375377fc44e0f9c2dbd4a9314ca12f); /* line */ 
        coverage_0x04803ab0(0x1a6a0b18be7b722acef764005f3feec242e9c4d0c2289fcd1a36c46052595d38); /* statement */ 
uint amount0 = balance0.sub(_reserve0);
coverage_0x04803ab0(0x4f7083f76f4deb14b8d94b89ca026565129597032c465bc336dbb461ad4a60d4); /* line */ 
        coverage_0x04803ab0(0xea7006eaedccfa4d0434f1cd8b8196bf4386e2bbd22a77c37501702044d11aea); /* statement */ 
uint amount1 = balance1.sub(_reserve1);

coverage_0x04803ab0(0xf9e5870bd561a596eaa8d9a1cbef0fb7180e20edde6575ad8784e40a2d1cdd4f); /* line */ 
        coverage_0x04803ab0(0xa00ed4885a4a50c394dcb2ed3487732bd2f0ff62504012b8bef0c199a24f65b6); /* assertPre */ 
coverage_0x04803ab0(0x338fbe05b6d84b1b9b7bf6d7e36412145cef3b1b3cfee188e56d31a229efed79); /* statement */ 
require(
            amount0 > 0,
            "UniswapV2: INVALID_MINT_AMOUNT_0"
        );coverage_0x04803ab0(0x862a03147e17d5a799dc714a88dc553156e4b67e87bb724436b6cdfbe64d7d78); /* assertPost */ 

coverage_0x04803ab0(0x12b069847cdd450aaa7bf319351af76db8e43387d41c58133096e229eaacab97); /* line */ 
        coverage_0x04803ab0(0xdf3de19de50f0fa0c4eb98c1e86bbf2d679d47b3003ca75c4dac1e65680c069a); /* assertPre */ 
coverage_0x04803ab0(0x5f125117b993ed9935a3df2447a99d4b4a743aaa35c6c0fdf8fb11a63bdb29ab); /* statement */ 
require(
            amount1 > 0,
            "UniswapV2: INVALID_MINT_AMOUNT_1"
        );coverage_0x04803ab0(0x5eba7e5bf6c47251e821173d37b11ec99db215c889e88c7ecfa2eb1906610a2f); /* assertPost */ 


coverage_0x04803ab0(0xf7c765c0760f49379b17c158281da67bf8b4962933ffde7b58eabc14dd7f601c); /* line */ 
        coverage_0x04803ab0(0x66faa42d1125fa68717fc77f4f58bd3d4a671451cf7ccfd2ac5b722b739cb8b6); /* statement */ 
bool feeOn = _mintFee(_reserve0, _reserve1);
coverage_0x04803ab0(0x658057e1943672a29cf34f1e68b95560fb4ba9ade5571eef08691a3e5021eff9); /* line */ 
        coverage_0x04803ab0(0x7dd159e2b9c23ca2d1b64f0b5d0e396675ede22065bc9b23bd65292a9cc2edd0); /* statement */ 
uint _totalSupply = totalSupply;
        // gas savings, must be defined here since totalSupply can update in _mintFee
coverage_0x04803ab0(0x352978e0800112f03b9752186ff299805f66c0ab41e026088ee607bf4d7b055f); /* line */ 
        coverage_0x04803ab0(0xa613a0c72ca8666facd18a115535294d9a99cda7a15a86662fc06434ce1f4553); /* statement */ 
if (_totalSupply == 0) {coverage_0x04803ab0(0x8dce520e0de9f3c627d2a13395b3c5737613b18835c986a2c83d62838d0f3ebc); /* branch */ 

coverage_0x04803ab0(0x7a7e7527465264db0dce12c78c8e843aa3dbe00fb0ee5f3aad4f1fef6018051b); /* line */ 
            coverage_0x04803ab0(0xdd2f8fdff38ddd730c8b5af22f11558f1f4105dc11af5698f1d1dd5b99cf754b); /* statement */ 
liquidity = AdvancedMath.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            // permanently lock the first MINIMUM_LIQUIDITY tokens
coverage_0x04803ab0(0x11e693f2635177e4894fe945e1e126599a4dfbb6175eb5a02b75ad2c25583d96); /* line */ 
            coverage_0x04803ab0(0x3a29f035e6ded78f95e004ad90097cee90a19b9c12941e4f3fa6472fcfa415f2); /* statement */ 
_mint(address(0), MINIMUM_LIQUIDITY);
        } else {coverage_0x04803ab0(0xbdbd6bc63f0dbf6c7c8f09592d24454fb2110a931bb4cf6ab2638643edf18907); /* branch */ 

coverage_0x04803ab0(0x822f607fa7f9d5bc8e8dbbe4de18e75f7ba03ba35d1857d9fe01bdd8550d2bb3); /* line */ 
            coverage_0x04803ab0(0xfdc1a68bc4d1a3865d69ee0582cc4051c2a56d93fbf7c2fa47a993915b875c10); /* statement */ 
liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0, amount1.mul(_totalSupply) / _reserve1);
        }

coverage_0x04803ab0(0xa52a620cc5d59eeee3264e179756d6a6efc2417ce95630451fc6b09b2f7db2ac); /* line */ 
        coverage_0x04803ab0(0xb1d759e06f7e83bf2aad70705851b6c649fd6a89a0da1a47a1fd9b820ab618e9); /* assertPre */ 
coverage_0x04803ab0(0xff5ee52f59ea354a2d23b9cfd622431c7ec01a3f03b4622f420f30afcd740e2d); /* statement */ 
require(
            liquidity > 0,
            "UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED"
        );coverage_0x04803ab0(0x6281f3fe1a801581ad3ddc73c8a177d27e027ab696fdc047d55d0a75a301d2e4); /* assertPost */ 


coverage_0x04803ab0(0x4e37a48555d64be5483d459c787f73d69e517a19a3093838432d72023abe9582); /* line */ 
        coverage_0x04803ab0(0xea2ac7e247f2edfb98f033962c180543f41aff30f1d2a232af8bd700b9df5330); /* statement */ 
_mint(to, liquidity);

coverage_0x04803ab0(0x3b5d5ea3acd1277b1b85c26febd1ec11190d483c85bff8ed786bb7786acbe1c3); /* line */ 
        coverage_0x04803ab0(0x972969254c7739c22275c61613c27e3eabd7fd2172dfc369c397a5541efd8d81); /* statement */ 
_update(balance0, balance1, _reserve0, _reserve1);
coverage_0x04803ab0(0xe665365926f3ce00f03753301a1e1f9a8e27ff0a8a92d35ada98fc7b5215b9ff); /* line */ 
        coverage_0x04803ab0(0x2764031b2aedac1da6444db0c8646acfa9ce1c6ad18bca85b88e1586272fcf49); /* statement */ 
if (feeOn) {coverage_0x04803ab0(0x8303de056aef3e600c0a5da4fdf42ac79818d20dec732eaa2ff2ca6b26792270); /* statement */ 
coverage_0x04803ab0(0xe7c0c8de006c2bc3377e956e6ed75e711ca4758320ee56db3daf38f915242e3f); /* branch */ 
kLast = uint(reserve0Par).mul(reserve1Par);}else { coverage_0x04803ab0(0xcade44833341d9826f834721d7ffc7647969a460b5f1d58b2d14a06d42bc1307); /* branch */ 
}
        // reserve0 and reserve1 are up-to-date
coverage_0x04803ab0(0x144a5e3dafebdfca1f7238d4ae5f9f243b3303b755c573e17302c1f30c70d59a); /* line */ 
        coverage_0x04803ab0(0xa7affa7ea63d9232e8b9c966bb509d3640130c29d3dbdd7f154935c6ee3c140b); /* statement */ 
emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to, uint toAccountNumber) external lock returns (uint amount0, uint amount1) {coverage_0x04803ab0(0x2949a05b0f7d609c550c74a2b147cab80ebee8e473e0f713ad076228249a61b1); /* function */ 

coverage_0x04803ab0(0x8241fdb5bd5dd0ae336e469914f0e3f2fa82b70192d8e87c03e3229712bed176); /* line */ 
        coverage_0x04803ab0(0x9c55249e915134a25a491d1ef6510c7315c0ce6bd0a3fb665779c51f9c90d5d6); /* statement */ 
(uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
coverage_0x04803ab0(0x03670cfeab883c603d0f1a9e4b0863f020b48ac6224b81a02080565c8785ddda); /* line */ 
        coverage_0x04803ab0(0x50738d69e2285ce5351130944ca26514daaf216c8f21636dec097176e67d9a61); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);
coverage_0x04803ab0(0x8134910f92c0df4fda2f410a3dc3bd1fecac068329826fa7206de80594ff0178); /* line */ 
        coverage_0x04803ab0(0x83a290b0e62bea98af27da0f37bf8127dc184402fe352f7211c5f40098d51194); /* statement */ 
uint[] memory markets = new uint[](2);
coverage_0x04803ab0(0xb457ab7c38c0f042c2e44840ff9eb379be5084d36203710ce210b9084d28e589); /* line */ 
        coverage_0x04803ab0(0xd7274c77a0fc38722d6007d7814448895d4b6ec183b911e405b5f56482f45200); /* statement */ 
markets[0] = marketId0;
coverage_0x04803ab0(0xd298a306f4180a71e90beea42c20b1f1be72a454178802cd8d00e9236ff8b205); /* line */ 
        coverage_0x04803ab0(0xb243625a5226ed8836a35af9a2ea1ec60a7b2ad7ba8b442063ea9f5d90fb6c6c); /* statement */ 
markets[1] = marketId1;

        // gas savings
coverage_0x04803ab0(0xdbe71e501ae440a613fdbde1891b936d49465c0ff0a4e3f5fac201349f403210); /* line */ 
        coverage_0x04803ab0(0x8a2cde002305dc81823f6e57cf4a49dfe927f8a053e2e539398d7150d36cb0d4); /* statement */ 
uint balance0 = _getTokenBalancePar(_soloMargin, markets[0]);
coverage_0x04803ab0(0x3539a134642dc631c0651895eddcd628c3938e3b584f23fdaa5d1b34ce994fbc); /* line */ 
        coverage_0x04803ab0(0x4c5e98ada01ec1b02132ad6d2321158a5d1f04948bdda9ab586504bbb4bb19a7); /* statement */ 
uint balance1 = _getTokenBalancePar(_soloMargin, markets[1]);

coverage_0x04803ab0(0xe891bde7d730e48d6b3d7e25528b28c66f7eabfbecde8a1fe887acb00c677e0f); /* line */ 
        coverage_0x04803ab0(0x63e243cd0809c150e4d66c583cdd09a135820cb8bf89003bc0b96ae556621226); /* statement */ 
bool feeOn;
        // new scope to prevent stack-too-deep issues
coverage_0x04803ab0(0xaa3a6e123b415187af293d7f7498cb3f207156fa41df3a0d799849c9e018ee89); /* line */ 
        {
coverage_0x04803ab0(0x8a4b1ec89b70955f45478c59b67dc3241f58f33b92f4c00592f8ac1ff2cbd48b); /* line */ 
            coverage_0x04803ab0(0x318c681968f6778171ca87990a41dba47b6a91688ab0184248d729378161e06b); /* statement */ 
uint liquidity = balanceOf[address(this)];

coverage_0x04803ab0(0x7ac93c803d1b6dd25a459f40b68ea4dd759e15d245a41c63ea708d6bfef7945c); /* line */ 
            coverage_0x04803ab0(0x2db0fcd24223a6d6f0317e0b7f92bfe367662047cef8b0ecd88dce4a189ab0f9); /* statement */ 
feeOn = _mintFee(_reserve0, _reserve1);
coverage_0x04803ab0(0xcd560a4ab53af24a620965cb97eeefec2cf68d5ef7925a4de0f940a83bba95a5); /* line */ 
            coverage_0x04803ab0(0x8eaa84a15e81820228174d1f88408c41e31c301cee51c72a19eeba2f8a76c8a7); /* statement */ 
uint _totalSupply = totalSupply;
            // gas savings, must be defined here since totalSupply can update in _mintFee
coverage_0x04803ab0(0xeefa7519a214dfd2868c6840bdc98f020f47588a075363eb6ab628d92a6f834d); /* line */ 
            coverage_0x04803ab0(0x73e93f8c8cf047427cbc068c5fd9ddda3846b96addb2b27c0f6824832d1b77a2); /* statement */ 
amount0 = liquidity.mul(balance0) / _totalSupply;
            // using balances ensures pro-rata distribution
coverage_0x04803ab0(0x49ad2d123ef9ad4ea0db31e80421fbcb6cd87fa0b6878b2d7b87fb33891b111a); /* line */ 
            coverage_0x04803ab0(0x3855f10e7f9917a1bf25335c6d72845de49758715eaa7ee7238ea7907db949a6); /* statement */ 
amount1 = liquidity.mul(balance1) / _totalSupply;
            // using balances ensures pro-rata distribution
coverage_0x04803ab0(0x543b5e44fd961263b13cb7acfc57cb704b7f206f2563f07737cd7987b0eb9047); /* line */ 
            coverage_0x04803ab0(0x8e5d918929497193279a1e75713bc2bd786df13f576ba8ec4c0b6afe939db041); /* assertPre */ 
coverage_0x04803ab0(0xa3bb64c39d3eedc82466b0f436250527850488c37e440cd37a93c62594b3fa9d); /* statement */ 
require(
                amount0 > 0 && amount1 > 0,
                "UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED"
            );coverage_0x04803ab0(0xd06a60a4b12dbe053c0422851d9e17b21bd6d4db650d073517a660320386f981); /* assertPost */ 


coverage_0x04803ab0(0x8363da47ced41e35d5834da28846fb2b18f60945aa67060710b5ca3bfb65844c); /* line */ 
            coverage_0x04803ab0(0xf6667fa22517e10ead903d3277ef3ec8ac6eb012e3ecfde637ed9cfdf86cd5fa); /* statement */ 
_burn(address(this), liquidity);
        }

coverage_0x04803ab0(0x7fc214f6cc223f30f6a45990f230bee97af5985e8e468a38450b22e57c2852f7); /* line */ 
        coverage_0x04803ab0(0x8c263264e795ccef36d3270c5969af6f963a4a09f8c116266f852ed63f29bfc8); /* statement */ 
uint[] memory amounts = new uint[](2);
coverage_0x04803ab0(0x92034ad50403d7f39d10d444e32e416f61f6462e64cc85a2ad0ca69c569611c6); /* line */ 
        coverage_0x04803ab0(0x6e1ac6ff567fc27e0b47aa1ddb8289ab7f4f614f6fc4ae921eb942e5a804fb66); /* statement */ 
amounts[0] = amount0;
coverage_0x04803ab0(0xfe7013de1d36eb614859e1b03bce89fe912ecdd6ad845a4ed0e3d56dc4e82cce); /* line */ 
        coverage_0x04803ab0(0x00f4f4f14e4d3aa66727c9745778012850d7c8a2159d14cd4a2dfb8def2ed620); /* statement */ 
amounts[1] = amount1;

coverage_0x04803ab0(0x15be295bf0c2c83c94cc3a114b3994ccc032a451dcc03ac4558ee21174e7ccad); /* line */ 
        coverage_0x04803ab0(0x9a1a2850d89216e1b25ca3de519799ca1ffdd7d45c1a916732b96d42fe925d02); /* statement */ 
TransferProxy(soloMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );

coverage_0x04803ab0(0xa781b0e96143220c8129778b98c9dfc0b0272841238925e02780995fe7971edb); /* line */ 
        coverage_0x04803ab0(0xb46ed0aef0132a91d73e14860174ce94d6c1c02e1f8787af2bc272eb18da724a); /* statement */ 
balance0 = _getTokenBalancePar(_soloMargin, markets[0]);
coverage_0x04803ab0(0xbbb4cd19c6bb0e12648c12b403c7070692b72379feab1fc0e5de32e549608602); /* line */ 
        coverage_0x04803ab0(0x252dfcf26e3f7050146723930159f13ebaf500ed2fb795ca55bf221400e6ae83); /* statement */ 
balance1 = _getTokenBalancePar(_soloMargin, markets[1]);

coverage_0x04803ab0(0x67e5b34e0155042c27832c71472ca0354d949fdab092f598a119f3c8c706792b); /* line */ 
        coverage_0x04803ab0(0xc5b8e772cc6ecbbe8c97d5eca75d21d806990f96d135d38096060428e14f734a); /* statement */ 
_update(balance0, balance1, _reserve0, _reserve1);
coverage_0x04803ab0(0x8352e92cde5e74523f63b6b94376ceb71dca4b8e575fd131f129811cefd8cd33); /* line */ 
        coverage_0x04803ab0(0x9dde2015b360f1a6089a3622bf18d3724c45bec2abfb689121c13bbf19e8ab37); /* statement */ 
if (feeOn) {coverage_0x04803ab0(0xf72823dc0b53e437d76246c2d8e2e6293b92413061bb1c09c56700cfce601ac4); /* statement */ 
coverage_0x04803ab0(0xea1c800465715ddae3430438e505a0ed1eec61e2deefb3b18cfcc70aebc91640); /* branch */ 
kLast = uint(reserve0Par).mul(reserve1Par);}else { coverage_0x04803ab0(0x9af094415ef86e8e9e56c7af7908456790aa50d60936e05d6cc153606c37639d); /* branch */ 
}

        // reserve0 and reserve1 are up-to-date
coverage_0x04803ab0(0xa1e3060387094b7645cd7bfcf0d9f4d6074a90a0c01f6aea925ddeeecc9ad4c0); /* line */ 
        coverage_0x04803ab0(0x4225c6d3dea70a9cf8cab8b94d503714115dedab45a92732b8cf8511f4911ad2); /* statement */ 
emit Burn(msg.sender, amount0, amount1, to);
    }

    function _encodeTransferAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId,
        uint amount
    ) internal pure returns (Actions.ActionArgs memory) {coverage_0x04803ab0(0xb1b2635faa7cd3b47bae8d7dd234bbd9360b058ab50a5de0eb800efab9882ae6); /* function */ 

coverage_0x04803ab0(0xbbc46977b16450b392931979603aef1ddeb0a6a94d5b98865d952d02471b00d0); /* line */ 
        coverage_0x04803ab0(0xe14298ec0b452c06f65744b767d9cb731046eae6aa472a041501e775e649a65a); /* statement */ 
return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(false, Types.AssetDenomination.Par, Types.AssetReference.Delta, amount),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory,
        Types.Par memory,
        Types.Wei memory inputWei,
        bytes memory data
    )
    public
    returns (Types.AssetAmount memory) {coverage_0x04803ab0(0xed9d75a6db2754d57b4ebd0a8cc0cb4e95750eb6a7e159ad7015e1972a66d17a); /* function */ 

coverage_0x04803ab0(0x1529839a5cd9b5238cf12eac58f1605612b76c673bfb27e0de7a2845c55dfed7); /* line */ 
        coverage_0x04803ab0(0x7f390693710c8d0162a85c5a1f9b2d7f82279360c5a5e6524858b8a2b715e31d); /* statement */ 
Cache memory cache;
coverage_0x04803ab0(0xd2c38dd03e4f966f21373b9233acf8412b4c38f1ce7835c1a23116cae4096397); /* line */ 
        {
coverage_0x04803ab0(0xd3f9808f622efb5c0bdb457e8be68a023c7bea54af83f0fff726361815b3bcf1); /* line */ 
            coverage_0x04803ab0(0x80ed4cd7ee992330bd0c3c8d7872ff7c09aacad6611ceab553360f9b6c083990); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);
coverage_0x04803ab0(0x1943d7118ec7ff385cbbd22eed4b45f9399128eef7fda5bf8eb091cc01c6b7c4); /* line */ 
            coverage_0x04803ab0(0x23ba65f51dc9fe9237d1379d1a6d2694a93d2045bae5f9cae396aecf985518a3); /* statement */ 
cache = Cache({
            soloMargin : _soloMargin,
            marketId0 : marketId0,
            marketId1 : marketId1,
            balance0 : _getTokenBalancePar(_soloMargin, marketId0),
            balance1 : _getTokenBalancePar(_soloMargin, marketId1),
            inputIndex : _soloMargin.getMarketCurrentIndex(inputMarketId),
            outputIndex : _soloMargin.getMarketCurrentIndex(outputMarketId)
            });
        }

coverage_0x04803ab0(0x93245c450b52577f0f367283128b32524e56b50779ff599145d106214fa0aa99); /* line */ 
        coverage_0x04803ab0(0xa6f696b4f975a86eaca63c7fa69e6de23643f4e2b4eb9be1f5e59a23bef22c5f); /* assertPre */ 
coverage_0x04803ab0(0x8e331ea63be5b2e1100f21c3e53ad6bc55c98fe5a793fba5da80b0d00155652a); /* statement */ 
require(
            msg.sender == address(cache.soloMargin),
            "UniswapV2: INVALID_SENDER"
        );coverage_0x04803ab0(0x91da5181c9c2ea5476f42e5561cf74c2e76eeebde8a469ca829059e2f0eb757e); /* assertPost */ 

coverage_0x04803ab0(0x93228187343ed9d70adc406c509cf94880059d9e80904002cdf5afb5c41c0fb9); /* line */ 
        coverage_0x04803ab0(0x688ecaf4b0eed04ec189d2874bb02fba5c9d1b141df908c08ce7d8c307f8a454); /* assertPre */ 
coverage_0x04803ab0(0x459a8f444edd90d05c2dc32a33c80b395cb96088f136f5e8589763b6c5e8c203); /* statement */ 
require(
            makerAccount.owner == address(this),
            "UniswapV2: INVALID_MAKER_ACCOUNT_OWNER"
        );coverage_0x04803ab0(0x50fc005c88580446e85f7dc96405d8409ba4630778408e2a5fb858b083b10541); /* assertPost */ 

coverage_0x04803ab0(0x02695bb51d55d5ff881a9c35aebc292a27f89d1f37c637ea9a383b8c65e4b2e1); /* line */ 
        coverage_0x04803ab0(0xbc6b42a4b9e45e737640b2ec254c07df9bbe5b3a6b6624719abca6a7e775cd03); /* assertPre */ 
coverage_0x04803ab0(0x6a6ae93a835e310e142d3a7ee3cc34eccef067cee253421e5d8589edd89af336); /* statement */ 
require(
            makerAccount.number == 0,
            "UniswapV2: INVALID_MAKER_ACCOUNT_NUMBER"
        );coverage_0x04803ab0(0x9338ba082e901671279fe4df7188a3806e0a501f6033449200fa21eb78545a8e); /* assertPost */ 


coverage_0x04803ab0(0x4da6a36f724b13fb77a64a0a26d19983077bdbb505bdd2e579382735f489f48b); /* line */ 
        coverage_0x04803ab0(0x876fa7a4071222f64ec29559b2589980146cd2dbf0e45c4ccd544117e6501237); /* assertPre */ 
coverage_0x04803ab0(0x9bb389ebcf315b2c8d12eb328ca4d13acc94dee76688ceb0af470d495f4d8b53); /* statement */ 
require(
            token0 != takerAccount.owner && token1 != takerAccount.owner,
            "UniswapV2: INVALID_TO"
        );coverage_0x04803ab0(0x9c2923c6cf3d4e1325f759c69cfe94b859e9ef7595647f8d199d386a00fd1acc); /* assertPost */ 


coverage_0x04803ab0(0x209585e3007d5020f749e475824ab1c226b7d4e79ec417321885c2fc0ae5ca0c); /* line */ 
        coverage_0x04803ab0(0xbf8ed88a90cafffaad8452b5b37f8a043d93a79a0051f47442e181ec548e0755); /* statement */ 
uint amount0OutPar;
coverage_0x04803ab0(0x9576c949e648ffaf758ead9ce10fae29f5d6405f9249ae9b61089719f9080b40); /* line */ 
        coverage_0x04803ab0(0xf5db8b17d8bc19e2e0ff5aa4e050a3db18df67a759e3d3ac6ccf8287026ae90e); /* statement */ 
uint amount1OutPar;
coverage_0x04803ab0(0x1a95d368b5c9da6e6dcc62361f9d426c29aa70d5af826c958fd1f934c515c6d7); /* line */ 
        {
coverage_0x04803ab0(0x010a11f3adbc24fa4b40169859aab77db006d9799d6858d37c3f863206926e75); /* line */ 
            coverage_0x04803ab0(0x3f74aa82c4060d38311c44ffc4de88c7c1e4e7e367dbea1f08996a77adf5cadc); /* assertPre */ 
coverage_0x04803ab0(0x6afd2e8205a09c19086fd3809ac190cbd4ec56db8961f3d1b8700b824d5a97bc); /* statement */ 
require(
                inputMarketId == cache.marketId0 || inputMarketId == cache.marketId1,
                "UniswapV2: INVALID_INPUT_TOKEN"
            );coverage_0x04803ab0(0x8e974ad624e1c76f6ae6818dc0f22b6e0bcd364fc3052c67310f7a9433e9f2ed); /* assertPost */ 

coverage_0x04803ab0(0x1655aa4bfa5797212d1ea63a2ef9040db6710443357b0641f3b551f09b7e15e1); /* line */ 
            coverage_0x04803ab0(0x29561a04b39dddcdcc14934a26b4fc5b7cfadb7ddc1863264709d00a91f05b55); /* assertPre */ 
coverage_0x04803ab0(0x82881b0a6a6a9bea3101e20d5e69220ece063311dcf95b8712ffc78c0ece212a); /* statement */ 
require(
                outputMarketId == cache.marketId0 || outputMarketId == cache.marketId1,
                "UniswapV2: INVALID_INPUT_TOKEN"
            );coverage_0x04803ab0(0x417bd21569528786872818e7d4971b1788e9be117efc4e699b4290d19a346abf); /* assertPost */ 

coverage_0x04803ab0(0x488a335562e080af5d6e73153487ab5cd747b37ae829798242f75b9dfc25b6d1); /* line */ 
            coverage_0x04803ab0(0x9461ee5441bedf16849fc1a553dcc0336b7ac73521388d2a35d0e2ab99c6a65f); /* assertPre */ 
coverage_0x04803ab0(0x6750b475e34541805b218e10844ccf8f22c616da621fff217a71a3de1bd2fa52); /* statement */ 
require(
                inputWei.sign,
                "UniswapV2: INPUT_WEI_MUST_BE_POSITIVE"
            );coverage_0x04803ab0(0x0b29636360f122fc24f61f53f3cb7223f35ed90dedda4de94d1c8f5ee1581a2e); /* assertPost */ 


coverage_0x04803ab0(0x3fe3fd1a1cd9457f662fa3421bb0c10c76f94a17bdf1923b66e02f08748f5efa); /* line */ 
            coverage_0x04803ab0(0xb5d332a26ab30127c5d3533fc1c755e38683bacfeb67647543dbec8347024e69); /* statement */ 
(uint amountOutWei) = abi.decode(data, ((uint)));
coverage_0x04803ab0(0x5179915f4a1ec50839f2710e0f258a92100b064918bfebf371833301ee5f84f5); /* line */ 
            coverage_0x04803ab0(0x7ff6232f888206f9e95a1611ce11ec0e764f8827388f3c7fb8154f49fa4b1c1f); /* statement */ 
uint amountOutPar = Interest.weiToPar(Types.Wei(true, amountOutWei), cache.outputIndex).value;

coverage_0x04803ab0(0xf87de6f921ee34f8de0fc0d968d899dae26bdb658d4553668ee287642e26030f); /* line */ 
            coverage_0x04803ab0(0x7c02d44cf1a17547f9eff598fe0f7919df5fc53207b7f2f258fd6bc6023af845); /* assertPre */ 
coverage_0x04803ab0(0x92f823b920e38ef167d3df290fe56488db62ec165fe41f5ac5777b7cb32fc704); /* statement */ 
require(
                amountOutPar > 0,
                "UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT"
            );coverage_0x04803ab0(0x2822b42b6579c78ecb03fb546c419df795f0ea32c09503e887c5f4bfd3cf7e6c); /* assertPost */ 


coverage_0x04803ab0(0xcec8daf210b9e1409469a6d33b75c7dc057d82a4a4c96d0a747a4c87f21d2ebe); /* line */ 
            coverage_0x04803ab0(0x2cc0fc77dfb843e0cd2c7daf2e6db3602c8221e37caae2526a6cc80e6a40ff43); /* statement */ 
if (inputMarketId == cache.marketId0) {coverage_0x04803ab0(0x1dd383e266d584654d57df457fd851444e188330e2b6785ba2a7fc8915b4c3a7); /* branch */ 

coverage_0x04803ab0(0xc3388e25837724eb0148a99a7882bed8d10edc163fcdbcc095eba6095fde85a5); /* line */ 
                coverage_0x04803ab0(0x87a69b0dec83ec31ace0c2190ff7a59fc910bf31704d0b252fa63e99aa69ec6b); /* statement */ 
cache.balance0 = cache.balance0.add(Interest.weiToPar(inputWei, cache.inputIndex).value);
coverage_0x04803ab0(0x56ac82f51f1c5ac7e62d30dfa517d88966132d017f6fa341ef0445adfd5f81b2); /* line */ 
                coverage_0x04803ab0(0x5df2a1b1c8a86a8ed3e2137dcb37691fc0d2e8b8c20f4e06cbc91a4d933bf692); /* statement */ 
cache.balance1 = cache.balance1.sub(amountOutPar);

coverage_0x04803ab0(0x4b011053a6b0676fa4fd1fc190a35e2e3e1991723282f42f97fc6d321e83cf8f); /* line */ 
                coverage_0x04803ab0(0x54aab725b47275e3b1db803b978f72df5efeda61f8820b3fa009cde4622a6c01); /* statement */ 
amount0OutPar = 0;
coverage_0x04803ab0(0x57f0e2e1cd93c5760434fa13696566463ef9e29f9cec812554fb94f4edb79772); /* line */ 
                coverage_0x04803ab0(0x61a4dd316ade26e9de7462ade2c9b805cd021a19d2e4f61032c6706ff5cd41bd); /* statement */ 
amount1OutPar = amountOutPar;
            } else {coverage_0x04803ab0(0x87799d1e822e18f4b406ef87a47ef5963f5776395f4d15d8a53e1704b7148dd4); /* branch */ 

coverage_0x04803ab0(0xfe208e42b7263c057722a58ac16f363d9255e4a05720f863bf1c3f9761ff3961); /* line */ 
                coverage_0x04803ab0(0x72d7309c72f1bdb206fcf4a73d496f272234b6834f2a3dbf186155fc53418427); /* assertPre */ 
coverage_0x04803ab0(0xb41b8ead81ef98571373092273d6a041b3abcc00349d37ecc9c85777215f0758); /* statement */ 
assert(inputMarketId == cache.marketId1);coverage_0x04803ab0(0x7e680d4a6680440f74782c4f7531cd25074dceb8dac0f85ab4793228ce067b38); /* assertPost */ 


coverage_0x04803ab0(0x2396402c0804f23e9785f6c10a7c85b6da5209ad64446f06aefdfae8b1b596c3); /* line */ 
                coverage_0x04803ab0(0x717f2284307dadbea0a40550accac51833d93e4a749afefaf103a5b707ace9ea); /* statement */ 
cache.balance1 = cache.balance1.add(Interest.weiToPar(inputWei, cache.inputIndex).value);
coverage_0x04803ab0(0xd4a1e6b40ecd76712d8181181fb60a21af102424da98733dee7ce2f6107ae610); /* line */ 
                coverage_0x04803ab0(0xa3ac404d79644e50f3d049e73149ce4dd7b0ce92c199f7342c85f08ac4acd071); /* statement */ 
cache.balance0 = cache.balance0.sub(amountOutPar);

coverage_0x04803ab0(0xeef2e9d8550a2d7f0b22bf1bc39f6cceabe231696c1f18c45a13883df771cfd2); /* line */ 
                coverage_0x04803ab0(0x2872ec87d1dcef03c7e5c461c81556f37ec1e9f38c598125ad72198ef6e8bc8a); /* statement */ 
amount0OutPar = amountOutPar;
coverage_0x04803ab0(0xb4fa9e543fc4834e4ee4a1d7747d17430fa4aa58a9f9c940d3cb916280a78275); /* line */ 
                coverage_0x04803ab0(0x7a34db5cc9822fa3583d136b28d0cfefae0d62bbc5bd88ad20d0ce95c79f2dd8); /* statement */ 
amount1OutPar = 0;
            }
        }

coverage_0x04803ab0(0x9f8824ca2facf9e0363458f2a1301c6b7cd514b7ed03f1eb2f0df1a587d09261); /* line */ 
        coverage_0x04803ab0(0x11e4299f1bb7c17edddfa698a23dae2b7dc2f1681d5af77f8ec988ab084837a1); /* statement */ 
uint amount0In;
coverage_0x04803ab0(0x68ca3a0d82b6947e77e8555b6e26b72690c340de765c2127e01351db0f31f14d); /* line */ 
        coverage_0x04803ab0(0xcdf3e35053c7b4709ba024687e99f1397d353b34580815940b6d5fc93f002b65); /* statement */ 
uint amount1In;
coverage_0x04803ab0(0x70a567c5a8dc82f84a85dbe052481e410f5ad485b3154cee0573be131e661f1a); /* line */ 
        {
            // gas savings
coverage_0x04803ab0(0xfe5be64a06da4ca927369ad4059c58bbc13d52d1dfc7265b5f27fc482b7b6005); /* line */ 
            coverage_0x04803ab0(0xc0b97526863860fd2159ec9fb8a0964572de5b7634deb038915d3ee00aea367e); /* statement */ 
(uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
coverage_0x04803ab0(0x61ac4697e32cf8979be27b31411b4bf6a9870adec73cf3ff0c30d70a7690d4d7); /* line */ 
            coverage_0x04803ab0(0xc9c2e5401f5c175b048586a55f46ac49d059bfd400dd66944d8672cfdb42ec9e); /* assertPre */ 
coverage_0x04803ab0(0x765ba5798fec27ef3915a32d86896f9a26c43b5e749f6c9adb993357a4a75954); /* statement */ 
require(
                amount0OutPar < _reserve0 && amount1OutPar < _reserve1,
                "UniswapV2: INSUFFICIENT_LIQUIDITY"
            );coverage_0x04803ab0(0x8605fbb18996d3edd3faf3ab99028bd3ea53a8cb7a18599bcc2c6c130bd66e19); /* assertPost */ 


coverage_0x04803ab0(0xc9eb9572b283e099532a50bb749784647f25f7e2715cfb9a8ed1307f84d527a6); /* line */ 
            coverage_0x04803ab0(0xab5ca70ae4468b7cbb1de1266966199fa4cd56d24f2d54556d0fe2565bb18b09); /* statement */ 
amount0In = cache.balance0 > _reserve0 - amount0OutPar ? cache.balance0 - (_reserve0 - amount0OutPar) : 0;
coverage_0x04803ab0(0xc1cd19b2ec5bc926ea460a167380ac9abb4d775ec234e94799ff660e33989d94); /* line */ 
            coverage_0x04803ab0(0x7e9fe2bf507b81a2279b8f705b49ee9043b5d17ba97b33a940200e026f401598); /* statement */ 
amount1In = cache.balance1 > _reserve1 - amount1OutPar ? cache.balance1 - (_reserve1 - amount1OutPar) : 0;
coverage_0x04803ab0(0x3d6bdd90dab58a2fca68e03d4bb292e781a76c515acc88429fbc0b1520816f19); /* line */ 
            coverage_0x04803ab0(0x9c5e26655843d7027873c03741b2932274ff2b4787632d09165e1ec2fec2a08d); /* assertPre */ 
coverage_0x04803ab0(0xb290dc80318cceef0d7fc7712caaaa8417d3a752db1cd1919c43381c25d848a0); /* statement */ 
require(
                amount0In > 0 || amount1In > 0,
                "UniswapV2: INSUFFICIENT_INPUT_AMOUNT"
            );coverage_0x04803ab0(0x04942b436ac5fb2016eaa2c1c155b98e472e13382375da4d8cc468162de76d73); /* assertPost */ 


coverage_0x04803ab0(0xb6a108a14a3a3bdf878af7577caeba9fdde5f6036d2b7f809856c5c663e2921d); /* line */ 
            coverage_0x04803ab0(0x6b1e0a81122e768c8a5094f70a8ed3eafdbbb5fa7e010d18640b485056872a20); /* statement */ 
uint balance0Adjusted = cache.balance0.mul(1000).sub(amount0In.mul(3));
coverage_0x04803ab0(0x42503795b53616fc54d26dc9d7f226ff10abf13a7cc7f673f3c9b52fa217b5d1); /* line */ 
            coverage_0x04803ab0(0x954a4d6cf6c19840f8b3c4182728419d95623e8177a66d1f39fcdb8499e9622e); /* statement */ 
uint balance1Adjusted = cache.balance1.mul(1000).sub(amount1In.mul(3));
coverage_0x04803ab0(0x68c90169054c4ebe4df5823a276d0cf23b6ff6e91b448d96d6f751d7e469993f); /* line */ 
            coverage_0x04803ab0(0x420fc0e7d286308a45f88b6cf7ed0b9dbe793c84fcc7298e59f63f4c88ceb651); /* assertPre */ 
coverage_0x04803ab0(0x83fb18a11b50b73c3383a91274875761be8b7b3c2e9ec1d200ab42a10a56a997); /* statement */ 
require(
                balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000 ** 2),
                "UniswapV2: K"
            );coverage_0x04803ab0(0x80b0b9f0a171623dd6af770f88b8c0e4b6e59c9adaf72fe3e22a460b8953945f); /* assertPost */ 


coverage_0x04803ab0(0x048ea0748b5ab877628b2bed4f4a0fe9d8a23a162f347c260889c9dbc3a9beab); /* line */ 
            coverage_0x04803ab0(0xb720bd40491fcf7739f89d1439ca4ba4feae8f3b6c90c87eac331547648cf9c4); /* statement */ 
_update(cache.balance0, cache.balance1, _reserve0, _reserve1);
        }

coverage_0x04803ab0(0x8901d7f316dca05be6890cbef7c84451f82917369c9d710cae781e271daf9a8d); /* line */ 
        coverage_0x04803ab0(0xbe0eda72f5a2cb4934d025b9a8ea170315915c39e830e1a78dfe54de23a449d1); /* statement */ 
emit Swap(msg.sender, amount0In, amount1In, amount0OutPar, amount1OutPar, takerAccount.owner);

coverage_0x04803ab0(0x1c14ace6e8f9f14236d6c4724e00e7ba345e167a4f9a03c590c19d3b0c442b19); /* line */ 
        coverage_0x04803ab0(0x4f6d9970743579cacb6bce1e0e5d7d53963df1ec5bb94853d0f50f1500c06a3b); /* statement */ 
return Types.AssetAmount({
        sign : false,
        denomination : Types.AssetDenomination.Par,
        ref : Types.AssetReference.Delta,
        value : amount0OutPar > 0 ? amount0OutPar : amount1OutPar
        });
    }

    // force balances to match reserves
    function skim(address to, uint toAccountNumber) external lock {coverage_0x04803ab0(0xda4f0131d76e5f761e9a7bce02c4130acfd8b5aa947b35cc918063f50549fffe); /* function */ 

        // gas savings
coverage_0x04803ab0(0xbd7251503780394581a587961c51e41f5914ddd261af7cb899c6f4680e7d115a); /* line */ 
        coverage_0x04803ab0(0x0edcc4c48021cbd4488f2fd22efb6006d390609015d75ba1ace15b5cec77bbfc); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);

coverage_0x04803ab0(0x2ea7e34b01b45268bfa2ebb83e56dbb72b27dd7a3deb1a07f3d591d1e31b53dc); /* line */ 
        coverage_0x04803ab0(0x8097b2ff7d856672c90cb00acfdd2b5bdbda3f87faa9bae4be333abc14af10d4); /* statement */ 
uint[] memory markets = new uint[](2);
coverage_0x04803ab0(0xfab9a2ff48e5df4f589f3187826042b93060cd74ac67378a3484a99d843558c3); /* line */ 
        coverage_0x04803ab0(0x8b86e3eafee777429e645dcdb71ead5ec6744c0d57867c6f3428d198846ddf0e); /* statement */ 
markets[0] = marketId0;
coverage_0x04803ab0(0x98b78bf9bee510f0d6639bfb114b101b5c214c3ce65ceb6d4e1a328484e08907); /* line */ 
        coverage_0x04803ab0(0x44e03292d8bbeba531f0506493be8520dafaf0922327ad58dc837495c10ddb16); /* statement */ 
markets[1] = marketId1;

coverage_0x04803ab0(0x06dd8acbfd4388d86a7ace690fe45b181a6c2e47817ddddad776716ba7716eb3); /* line */ 
        coverage_0x04803ab0(0xdfd8e2edfc4c1d35f0510c810c9576c3e44c71cdd8d98edd4f448ca0c2335da3); /* statement */ 
uint amount0 = _getTokenBalancePar(_soloMargin, markets[0]).sub(reserve0Par);
coverage_0x04803ab0(0x7d81ef6fb707aeb07291b4025f4a46797c6ea91fc74fc1384473c99446edcba0); /* line */ 
        coverage_0x04803ab0(0x5a0533ad5e8e43c461159dd7c67f7620e118e599badce13458afdd39a91610b9); /* statement */ 
uint amount1 = _getTokenBalancePar(_soloMargin, markets[1]).sub(reserve1Par);

coverage_0x04803ab0(0x041101eeaf0f9cab20b3ca65ca5526bf07ccf8405200717f09e6fd5f1386b659); /* line */ 
        coverage_0x04803ab0(0xb772f61206dafed4e8fc6893d7cf13d4b86a91e5fcc07d55ba870eb41ae808fd); /* statement */ 
uint[] memory amounts = new uint[](2);
coverage_0x04803ab0(0x906e5b7587d3904f2adf868a939801594b72c85d6c4fda242d2fdc1afa58a1b1); /* line */ 
        coverage_0x04803ab0(0xde18e58209ec5cb7bcef619a24d0f0073cdfbbd040c1cb8ac40b1a7fe46a7b06); /* statement */ 
amounts[0] = amount0;
coverage_0x04803ab0(0xaec2e6cbbe1d7b24ebef0e6e8db0aa59d0ce76701f0ef16958a1b4fa63785837); /* line */ 
        coverage_0x04803ab0(0x9dce6438547da0b55b710552056d40e6a6ee07e68c5e20a06f0cf9fef65cfce3); /* statement */ 
amounts[1] = amount1;

coverage_0x04803ab0(0xf9508de0f6f4d3b0a69b5b9e65ebdada9955ceaeefd8d4e468f4716021890b4e); /* line */ 
        coverage_0x04803ab0(0xca888740767109eb8e876c6dd6f5b9f266cd028c8ea7e74ba04f90e56d923566); /* statement */ 
TransferProxy(soloMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );
    }

    // force reserves to match balances
    function sync() external lock {coverage_0x04803ab0(0x9b622be0bb811300fd5999bb78ed4975e7f7f34ee6dd8a805a1b6c1555c3fe63); /* function */ 

coverage_0x04803ab0(0x745db5984197eb17682d5251d2603f41454403942e006d23dbda53c9034df304); /* line */ 
        coverage_0x04803ab0(0x8937d0d11b40a4377529663df16b83ef460e7184b64fea3225f79ba8ee7c8c8c); /* statement */ 
ISoloMargin _soloMargin = ISoloMargin(soloMargin);
coverage_0x04803ab0(0x50141f0e5bba841c992be06c323c2430e6cd398109a5d1212dc896880be867e3); /* line */ 
        coverage_0x04803ab0(0xca17595f62ff5140f97b821936361d7d4cfab04f5edbdfb086f1c11b32345154); /* statement */ 
_update(
            _getTokenBalancePar(_soloMargin, marketId0),
            _getTokenBalancePar(_soloMargin, marketId1),
            reserve0Par,
            reserve1Par
        );
    }

    // *************************
    // ***** Internal Functions
    // *************************

    // update reserves and, on the first call per block, price accumulators. THESE SHOULD ALL BE IN PAR
    function _update(
        uint balance0,
        uint balance1,
        uint112 reserve0,
        uint112 reserve1
    ) internal {coverage_0x04803ab0(0x0e451b9a1962945f09ad43bd09d979213315a8ae3fceac4dd40210f6a719dd70); /* function */ 

coverage_0x04803ab0(0xfb699a4d7530f2962e2a28faaeaf4523e8aa54d463fa0ee450d31a9851029c5c); /* line */ 
        coverage_0x04803ab0(0x2409ec522ba0e37b7db1413bdcf2033bfc6a3c182e5ff6def16f0bc2622629f8); /* assertPre */ 
coverage_0x04803ab0(0x28f6b3028296b0ffd69ce7e7a528a288da244477494d1cee0866622c96df36de); /* statement */ 
require(
            balance0 <= uint112(- 1) && balance1 <= uint112(- 1),
            "UniswapV2: OVERFLOW"
        );coverage_0x04803ab0(0x07974c326ed368af84705a0aff30faadd6a48fb03ab0cea5e4e2b0b02a5cf889); /* assertPost */ 


coverage_0x04803ab0(0xb34c3f207faf6bcec9ef714a0c98e7c71a970f4d1e5f20a379a671941f89da14); /* line */ 
        coverage_0x04803ab0(0xa02f03e3c4a2c4274212a4729b1a8dbf24a8288c254ec519660ec182aeb0c290); /* statement */ 
uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
coverage_0x04803ab0(0x6c456b389b78950f48d1dbfdf72549799f9b3130ce758312f94f649804034606); /* line */ 
        coverage_0x04803ab0(0xd58b28c9bab2fe00cdd687e61635b499c73cda7dbaa10798a5b0a9bfce31bd18); /* statement */ 
uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        // overflow is desired
coverage_0x04803ab0(0xf0a99ceef2f99a57656b2cbb465661d4060a8fb241dd04d6ee438b38eaa8aff2); /* line */ 
        coverage_0x04803ab0(0xe9066e14f73033e13d8ecaa77cb1b6305a38ea0ea2266f9af41a32a5a7c4d0fc); /* statement */ 
if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {coverage_0x04803ab0(0xee6e59d6526ca70ab13e7978304639e6b71c0643d46a15d416ee9484f59ddf11); /* branch */ 

            // * never overflows, and + overflow is desired
coverage_0x04803ab0(0xd69b3dadbf67878d3b73ef4b9547ebac85a26d8965543a05942bdeff2d086a10); /* line */ 
            coverage_0x04803ab0(0x63c9fb7ad35c2665b0b1955e882b09a68cb0895ce90aed7a4924b27240518cd1); /* statement */ 
price0CumulativeLast += uint(UQ112x112.encode(reserve1).uqdiv(reserve0)) * timeElapsed;
coverage_0x04803ab0(0x6e0ecafe76d46c371cc96627262e7e000a06660e904829f28318f16ceea50d92); /* line */ 
            coverage_0x04803ab0(0xb03f1fef198262d2710c0bf1f25828aeb33cd7a789f67d7aa0f55915f4b6d314); /* statement */ 
price1CumulativeLast += uint(UQ112x112.encode(reserve0).uqdiv(reserve1)) * timeElapsed;
        }else { coverage_0x04803ab0(0x191fdb508c96433714839ffc2e01824374dc00552e4bfebee2471cc6f10db082); /* branch */ 
}
coverage_0x04803ab0(0xc21c8a34ab8adfd52ba970d74145f563dd3cbd28619e784d466c4188ad0a1920); /* line */ 
        coverage_0x04803ab0(0x787791c34003f4ba0795604237abfeafcf2075e3b607e6112090b8f1248dc205); /* statement */ 
reserve0Par = uint112(balance0);
coverage_0x04803ab0(0x8465fda094d7b670b833808545ef3cf4687ccf61c84df44b25e07b277850bb7c); /* line */ 
        coverage_0x04803ab0(0x48549098054f224730a716b55aa0881788c2540a1ef63ce6c638755578d098e5); /* statement */ 
reserve1Par = uint112(balance1);
coverage_0x04803ab0(0xffb3e169f38ebc309c32b73cd94cad7da539f17ff597b07e811f700f87061883); /* line */ 
        coverage_0x04803ab0(0x53bedfaee11ccd9838c3b9010fa6a4b5eb2af8260262de563e355960535d44f5); /* statement */ 
blockTimestampLast = blockTimestamp;
coverage_0x04803ab0(0x350a5aa8cc34e2347976f327d47f65406fc7675c7f49390ce4fa947d92f7ef91); /* line */ 
        coverage_0x04803ab0(0x6cdb2d7948ba3b2adee43525b1fc83a6e73a4f06019300fa0e50ec9a2e545322); /* statement */ 
emit Sync(reserve0Par, reserve1Par);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(
        uint112 reserve0,
        uint112 reserve1
    ) private returns (bool feeOn) {coverage_0x04803ab0(0x8c33a5e1eee2ba7b58dd87dfb2b02bfa3bad4978cb4c1bcd3896853ed18d0060); /* function */ 

coverage_0x04803ab0(0xd9551cc73a568a26561a1dfac669779f03735874f5b0020c30d2e3eaab6c0527); /* line */ 
        coverage_0x04803ab0(0xc5e07b337c9c70ebbaf7ca3f2ea37d8a7937536222929b6050962c7172eaa97b); /* statement */ 
address feeTo = IUniswapV2Factory(factory).feeTo();
        // gas savings
coverage_0x04803ab0(0xdc95d632944faa2d5d0576cb6da2bc4fa6ad2bd0f6884a84358e1896a2bb9ab2); /* line */ 
        coverage_0x04803ab0(0xaed5cf4bb5ec0582f4bccedd0d1b60ec1bb6b3e1895571496a21a316b306cd8b); /* statement */ 
feeOn = feeTo != address(0);
coverage_0x04803ab0(0x8cf6c5ece68dad82d7d929f609da405058c2178954604d47ef4e08c84293f1cf); /* line */ 
        coverage_0x04803ab0(0xa7e71ae5ef219c41d7a9d0efac05c80bc10756d1f6797b975b0b85db0f561126); /* statement */ 
uint _kLast = kLast;
        // gas savings
coverage_0x04803ab0(0xd1557054b74b720ef91c6337e83509bec8c0454cc5ced7fcccd095ad6bc6e7a2); /* line */ 
        coverage_0x04803ab0(0xcaed8c37d4050bdfcb197b63cb2567eab50b57788aadfe2eba4f44cf80d894f8); /* statement */ 
if (feeOn) {coverage_0x04803ab0(0x67ee363134a6f55ad1914b9a6974fb3bfbabfcc4d3e3abbbb49217d6dbfe9f2b); /* branch */ 

coverage_0x04803ab0(0xadcd1d171abfa86c55818db0f0162b20f3b78cc29fa5940ed4d544c32b525c8e); /* line */ 
            coverage_0x04803ab0(0x22e262956cf0820931e520f36909bf655c6332e743a78e8ae844f6396b9a54a3); /* statement */ 
if (_kLast != 0) {coverage_0x04803ab0(0x6055dca9783fb6b239206bb7b17db5451f741d7074408bf93d6929c7b3b71791); /* branch */ 

coverage_0x04803ab0(0x001ff330a30c5f5e0cd57d961291d523b18bd2d5331a3f11a039100d52536ecd); /* line */ 
                coverage_0x04803ab0(0xbc0942bdd67c867a963027e4835b67457216a4328613b11406cde90fe54267c4); /* statement */ 
uint rootK = AdvancedMath.sqrt(uint(reserve0).mul(reserve1));
coverage_0x04803ab0(0x88cfd0786dae3c72980d6ad1995a959b1c79af7040503fb1b46c72fd2af41f5b); /* line */ 
                coverage_0x04803ab0(0xa64ecd4d6224e24f2ee24beb77f3544ca5436153481feeaeaf2cb9ac0e68879a); /* statement */ 
uint rootKLast = AdvancedMath.sqrt(_kLast);
coverage_0x04803ab0(0x9e6640f18d10739dde2e24de38d58dd59ded9b11c584a1ed4f3c527aa535eb79); /* line */ 
                coverage_0x04803ab0(0x985809e021149d9bf3d43a5421f7d7364f2ecb3c65eb396bb295104979263acd); /* statement */ 
if (rootK > rootKLast) {coverage_0x04803ab0(0x43221a524d3c1eaaebd57cba1699940c56fb666233bd948451f930e6c634a37a); /* branch */ 

coverage_0x04803ab0(0x82b98ac1dcdd04993203e1c000e5de1456f4a87ed95f79f6054beb1272d298d5); /* line */ 
                    coverage_0x04803ab0(0x84a872303d5f5a23cdf767e51e33a5c8c9282767ad5b75235ec2bf1bbca13c17); /* statement */ 
uint numerator = totalSupply.mul(rootK.sub(rootKLast));
coverage_0x04803ab0(0xfc6268381de9129253bbdb1781d982b02cb48a5fa8877afde5618f8bc77712a0); /* line */ 
                    coverage_0x04803ab0(0xd7869a03809c53bcd35174f15519caf080c9239bec84f5814af4962e497eb273); /* statement */ 
uint denominator = rootK.mul(5).add(rootKLast);
coverage_0x04803ab0(0x1a0919bfc3b5555d98d8fab5ce466f393b79727e62f4260c635067f96a299dfd); /* line */ 
                    coverage_0x04803ab0(0x025b812701bc43596a85d15831a41799dbf2596ba80cc159fdf0fa279e30b34c); /* statement */ 
uint liquidity = numerator / denominator;
coverage_0x04803ab0(0x43348c3d7ea0b70dc8585767d88bf9d5540ae61480369d6ba63a6a315409aea8); /* line */ 
                    coverage_0x04803ab0(0x32a3da257e2a69b3bb4dfe0c748e308bc6dba8a0d56b91ea3f1e0862b73b76fe); /* statement */ 
if (liquidity > 0) {coverage_0x04803ab0(0x64592be835fedbcb3332a5dc60b608ccbdcea8122799af6774cd3270b17a5d41); /* statement */ 
coverage_0x04803ab0(0x539abe7ba4ddf3bf23462015ae1acf5abfdf6601f09ed44b80be5354529fc880); /* branch */ 
_mint(feeTo, liquidity);}else { coverage_0x04803ab0(0xe69161f0be9b94de029b2569873f296089ce439bb0e0190d1f60c4572df7b45b); /* branch */ 
}
                }else { coverage_0x04803ab0(0xb88ce737154e5b9b8ee1cf894efabb20bedc888153c356c6eaacbc6e78b62249); /* branch */ 
}
            }else { coverage_0x04803ab0(0x62863d429a897e21aae5e084fa0da2a03b4dbb7bd403cf472e1b56e4ab2e2572); /* branch */ 
}
        } else {coverage_0x04803ab0(0xae0606562850c230ee5ca4a85bf0f065260fa4937c9b97fd8d4cf25ed354ff70); /* statement */ 
coverage_0x04803ab0(0x65920101c9ad19d8e2a65d6c13d4caa837695cae7fb0ddc0a9246af12d638602); /* branch */ 
if (_kLast != 0) {coverage_0x04803ab0(0x3207521943d74b2310a9fa71a364d1cbd037f0841769ce8c5c8c180812401704); /* branch */ 

coverage_0x04803ab0(0xe8aef3585a60bd20726557e0e7f834a2e557b242a870fe194e208ab8ea000488); /* line */ 
            coverage_0x04803ab0(0x2c75a35345b96924719a469e6af7b568224d03e6f1960697916317c36c1e93b2); /* statement */ 
kLast = 0;
        }else { coverage_0x04803ab0(0xbc003005cd1238485f23bb0ca2234f6d818f5112de4d633cec363b0b42085abe); /* branch */ 
}}
    }

    function _getTokenBalancePar(
        ISoloMargin _soloMargin,
        uint marketId
    ) internal view returns (uint) {coverage_0x04803ab0(0x8d2b29bdc988ab471601675513a38145071c413d3e6eaa1b399a0d15b6525aba); /* function */ 

coverage_0x04803ab0(0xc6c9b9fbe15db4fcf44d42450fd14f4c4727dbcb24b3a21135435ea882ee44b2); /* line */ 
        coverage_0x04803ab0(0xa86edc342e2dba3a961d15a176e394d759a99c816f3f011a3257449fb2922a58); /* statement */ 
return _soloMargin.getAccountPar(Account.Info(address(this), 0), marketId).value;
    }

}
