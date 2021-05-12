/*

    Copyright 2019 dYdX Trading Inc.

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
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/SoloMargin.sol";
import "../../protocol/lib/Types.sol";
import "../helpers/OnlySolo.sol";
import "../lib/TypedSignature.sol";
import "../lib/UniswapV2Library.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract DolomiteAmmRouterProxy is OnlySolo, ReentrancyGuard {
function coverage_0x38b9235c(bytes32 c__0x38b9235c) public pure {}


    using UniswapV2Library for *;

    int256 public constant MAX_INT_256 = int256((2 ** 255) - 1);

    modifier ensure(uint deadline) {coverage_0x38b9235c(0x6cd53f5102f9558095c668996820fdc67ff3503a04cd1990f03095ad3071d0f8); /* function */ 

coverage_0x38b9235c(0x080cdc208c057fde4c9f1611faa336e6b983c6caa8a063122bb3bd4240b06f3c); /* line */ 
        coverage_0x38b9235c(0x318af06409200626a3cd5c34eee3e5a06479d45cd785bc4fc9c6dd6ce0fb9788); /* assertPre */ 
coverage_0x38b9235c(0x2e3d3c5e1fa49c2eac3daa6bf4ad44d81ba67bec14f8fbd6b75e7cfa6d32863e); /* statement */ 
require(deadline >= block.timestamp, 'DolomiteAmmRouterProxy: EXPIRED');coverage_0x38b9235c(0x907cfdb104a4a310c329ccb1e4b92f1f264935a6d11853413ca5f4215134b498); /* assertPost */ 

coverage_0x38b9235c(0x6c2b4215d815db6cdcac9b7979562278b58c2738b3689c0e3d21db926a440fb6); /* line */ 
        _;
    }

    struct ModifyPositionParams {
        uint accountNumber;
        uint amountInWei;
        uint amountOutWei;
        address[] tokenPath;
        address depositToken;
        /// a positive number means funds are deposited to `accountNumber` from accountNumber zero
        /// a negative number means funds are withdrawn from `accountNumber` and moved to accountNumber zero
        int256 marginDeposit;
    }

    struct ModifyPositionCache {
        ModifyPositionParams position;
        SoloMargin soloMargin;
        IUniswapV2Factory uniswapFactory;
        address account;
        uint[] marketPath;
        uint[] amountsWei;
    }

    IUniswapV2Factory public UNISWAP_FACTORY;
    address public WETH;

    constructor(
        address soloMargin,
        address uniswapFactory,
        address weth
    ) public OnlySolo(soloMargin) {coverage_0x38b9235c(0x610131bb4f095c3921636c3563eddc5a8144cb71c9b91f9433d32d83f069efa0); /* function */ 

coverage_0x38b9235c(0x05b32630f8e2f38fab11e7446d3ae9beb88617aee8b625d1548376e9fca61cb3); /* line */ 
        coverage_0x38b9235c(0x17218c69693f7af956326ef08dd41214b5c04caf41feec4dad5705220a0fcad2); /* statement */ 
UNISWAP_FACTORY = IUniswapV2Factory(uniswapFactory);
coverage_0x38b9235c(0xc12d85ac1ba2cacc83817026dd3d774bbf111eb0da2e7bc36cf173e06a1f64e4); /* line */ 
        coverage_0x38b9235c(0xf36873bae8159a8fd825d30ba9a377dadf53196bb857b516645b9ac6c394fb5b); /* statement */ 
WETH = weth;
    }

    function addLiquidity(
        address to,
        uint fromAccountNumber,
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    )
    external
    ensure(deadline)
    returns (uint amountA, uint amountB, uint liquidity) {coverage_0x38b9235c(0x73efc53b18709edb61ce5acf737637644ba228ed5b5e13b5076e9883e87c8c8a); /* function */ 

coverage_0x38b9235c(0x22c3d6f23d73de3d55ba55e247f34d0441e8068f86a016c5bcd57c4f1a89fa2c); /* line */ 
        coverage_0x38b9235c(0xcfbbbbd2e07c4d2937e575afe33ecebb923231345d560c0ceca35fd7d11951ff); /* statement */ 
(amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
coverage_0x38b9235c(0xef356958101e3a61e7a1a10bc44809b591051c7ccd53d172f3e2a61305089b28); /* line */ 
        coverage_0x38b9235c(0x19835080af05a39e0921352f6fa8dc5ab2c65f79731f12bd3beab2b14bacd796); /* statement */ 
address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);

coverage_0x38b9235c(0x35d613f722067dcf7cbe9b752f52f8e1861892fafae8cd8ce2853d6e3598c9d2); /* line */ 
        {
coverage_0x38b9235c(0x97a27c9c8e423015c3ce0fc00d4c7c0cc611e2a0e88a448eafdbc2d6dff6b12b); /* line */ 
            coverage_0x38b9235c(0xb3aebaf5d6ae572af75146e6da14ee5f7c24af2e83753fd0c3743758140ade9d); /* statement */ 
Account.Info[] memory accounts = new Account.Info[](2);
coverage_0x38b9235c(0x7eae2cfbd55307cea1ed0fe174600e9c9306010106bba64cd392952853ed9e22); /* line */ 
            coverage_0x38b9235c(0x92fcb5ed81b2ebd696d791543b2420cfa21c7a434424642b7e5397a9c16227ad); /* statement */ 
accounts[0] = Account.Info(msg.sender, fromAccountNumber);
coverage_0x38b9235c(0xcb70412d17594bda463e601f8f4a9f52d21a52f8062c48d49a4b71908ee85946); /* line */ 
            coverage_0x38b9235c(0x72d922b27c8751b9b457ed6478352b2270b0edfde6cc1ebee21780fcf6b92cb3); /* statement */ 
accounts[1] = Account.Info(pair, 0);

coverage_0x38b9235c(0x80e138250699ac787a452bb5a1187a987abadd04f9905517bcb1d5328c428e35); /* line */ 
            coverage_0x38b9235c(0x2732e49100564b44631a059085282fc948b5bf4014a635e5416e28a4ab9a64ff); /* statement */ 
uint marketIdA = SOLO_MARGIN.getMarketIdByTokenAddress(tokenA);
coverage_0x38b9235c(0x8a5822676832fc9ff40c76205d042e593d1fcc0b886fca1eca60d34c9c72e8e4); /* line */ 
            coverage_0x38b9235c(0x5d99c0a1744a7116f9dcb24fdf0cef273c1c820117fe7f3dd383dcb150b4d650); /* statement */ 
uint marketIdB = SOLO_MARGIN.getMarketIdByTokenAddress(tokenB);

coverage_0x38b9235c(0x65515acc7e1e463dd25dcc0d662cb56d5aa540b4e9e8945865c2172b2df87744); /* line */ 
            coverage_0x38b9235c(0x475c865981eeeb4a17e8a1c99c638535df0796c3cb0f7e13c9a81caf625329da); /* statement */ 
Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
coverage_0x38b9235c(0x9c1cb04c285398c2ec1f92f0bdf42eae9fb6aefb458b59221b4ca4ad1d989e0f); /* line */ 
            coverage_0x38b9235c(0xa4de82e3012efd2334639731c46847f3ed3af73146ac11b6315b526145216f21); /* statement */ 
actions[0] = _encodeTransferAction(0, 1, marketIdA, amountA);
coverage_0x38b9235c(0xc7459b8f06f09cef1b8358ac770f1eb081f67c576eb21eca27ed61804739023f); /* line */ 
            coverage_0x38b9235c(0xfe0dfadcc8d0a8f8a66e3a86e77e985d03cabfc45afb06207c46d559024d47f9); /* statement */ 
actions[1] = _encodeTransferAction(0, 1, marketIdB, amountB);
coverage_0x38b9235c(0x42d6acb26070051744ce29d2a81dfbc6ade701be4806b2f70b7ab3a0e90ed86b); /* line */ 
            coverage_0x38b9235c(0xf395e34285674f48e69810b9cf75eb1ee946188be0c2c2bd8b8bf685cfe0b339); /* statement */ 
SOLO_MARGIN.operate(accounts, actions);
        }

coverage_0x38b9235c(0xa5a03b3307cd6b3f240072dd0687fbef805f2de8e5e418728b11e60de93d34cc); /* line */ 
        coverage_0x38b9235c(0x1569ba3e2ba0bd5ca644da21d2b28f91583921c0a9c128b14b0209b5c6377bc8); /* statement */ 
liquidity = IUniswapV2Pair(pair).mint(to);
    }

    function removeLiquidity(
        address to,
        uint fromAccountNumber,
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    ) public ensure(deadline) returns (uint amountA, uint amountB) {coverage_0x38b9235c(0xf4fbdad49533a20125d5d0dc402162f180f24c592f308d32624e924051ab0913); /* function */ 

coverage_0x38b9235c(0x1d5545ff97278333b15fd12ee6be73bc026466c6619bd3f51f4dcdb8999442af); /* line */ 
        coverage_0x38b9235c(0x12193bf277cb53255f42482464b7779cf27ee75fec4b0246a705e8ab868479cc); /* statement */ 
address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);
        // send liquidity to pair
coverage_0x38b9235c(0x128dac9d8b7ec09c240e484e735a45b26b975c2c15acdd9411d677c645815226); /* line */ 
        coverage_0x38b9235c(0x889dde72e8637a07a16cbba8b1befb181308b6b59d9b08d6b8a16c5be8e2ab13); /* statement */ 
IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);

coverage_0x38b9235c(0x2d706f5995a116eef3dd6409309c0c8e8057a32ea1a33ea0c0183d63a198b83f); /* line */ 
        coverage_0x38b9235c(0x959ac97747c530439d2d351f835e38277c47709628913b8347b6167e832cb672); /* statement */ 
(uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to, fromAccountNumber);
coverage_0x38b9235c(0xe80f59b84111526c3550313af4f8d2626a85850162b55de23697948a8cdc8ec7); /* line */ 
        coverage_0x38b9235c(0xfa6b0413f7b3998d27c1accf91cce6c45398f90668d40107ecaa112208e96a82); /* statement */ 
(address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
coverage_0x38b9235c(0xf9edb49711fbc1f4db009b7f370427c6ee32f8789c332b61b118ab03bf414a5d); /* line */ 
        coverage_0x38b9235c(0x550cb5f9dc96f3fd6fb59ff4e495f315439e63d69ffa0aae61c8348a6b4a5a91); /* statement */ 
(amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
coverage_0x38b9235c(0x573e5abdba2898fe7f2ef04ef0aa65f24c527e1f9c97085e11e138ec303f01b2); /* line */ 
        coverage_0x38b9235c(0x23db68f70e0dd74686a8abc9b5efa9efc4448c8ec449238dd741a9b9a2c9c669); /* assertPre */ 
coverage_0x38b9235c(0x08fe4357997a04a0ab61f6b297593d0b9a5b9f40f20711cdad64b30163b33608); /* statement */ 
require(amountA >= amountAMin, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_A_AMOUNT');coverage_0x38b9235c(0x441b30e672cca3ee0730acabef54b07b93166e497dbf63bea7ccc564eda10185); /* assertPost */ 

coverage_0x38b9235c(0x561e0f69a6fe993d94113ca8d34582da4f1575d975115efce88dfe94799b6f3f); /* line */ 
        coverage_0x38b9235c(0xabdcbe5a22e531d87e8733a6ab44801db844640bc7edd8ea6020aef25c106e3a); /* assertPre */ 
coverage_0x38b9235c(0x3e959e4d22f9763f357d1dfb8532ced653c017988184fb26b24b18e3be9df4ce); /* statement */ 
require(amountB >= amountBMin, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_B_AMOUNT');coverage_0x38b9235c(0x37000d05af3b51b4eb7d0e8416894bfa629f1754aea2f6244569e83e2cb23ded); /* assertPost */ 

    }

    function swapExactTokensForTokensAndModifyPosition(
        ModifyPositionParams memory position,
        uint deadline
    ) public ensure(deadline) {coverage_0x38b9235c(0x3a0bb89a1665d1ebc34a088d703bb4acb7eba3287e8f74c9cf334064971c7bdf); /* function */ 

coverage_0x38b9235c(0xf0a9afa51c5aa7803b02af24f4a5a624518b4c03ed8bd91ea9f1977828cde0bd); /* line */ 
        coverage_0x38b9235c(0x104b36b65cfff263ce25ac5aa8d3561c70c2ebe7203cf4bfe5fe38b27809c022); /* statement */ 
_swapExactTokensForTokensAndModifyPosition(
            ModifyPositionCache({
        position : position,
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapExactTokensForTokens(
        uint accountNumber,
        uint amountInWei,
        uint amountOutMinWei,
        address[] calldata tokenPath,
        uint deadline
    )
    external
    ensure(deadline) {coverage_0x38b9235c(0x2286f10f151ce09c4950536075907a8b5a4122f1d938e5e073d17629629b73c8); /* function */ 

coverage_0x38b9235c(0xf201a35a1cad8d379aeae022f814b804408c62c84376f92e28287deaf42b6e06); /* line */ 
        coverage_0x38b9235c(0x5ed5095f906642d42d896b76bae29dc6c026b2dc950610befb20737fe5ab6a3a); /* statement */ 
_swapExactTokensForTokensAndModifyPosition(
            ModifyPositionCache({
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInWei,
        amountOutWei : amountOutMinWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function getParamsForSwapExactTokensForTokens(
        address account,
        uint accountNumber,
        uint amountInWei,
        uint amountOutMinWei,
        address[] calldata tokenPath
    )
    external view returns (Account.Info[] memory, Actions.ActionArgs[] memory) {coverage_0x38b9235c(0x10e179e8ddcc6baf348c86ba0a050a20e2cd2fac662de67f0d2e5004970758ce); /* function */ 

coverage_0x38b9235c(0x01034ce18561df7c3a12ff2440d453473f677d26fd3f77e90d665d28673a527f); /* line */ 
        coverage_0x38b9235c(0x2cab4f8a97baff8a959716f3530f25585658bacbd349d6cc22cdf10b619803b8); /* statement */ 
return _getParamsForSwapExactTokensForTokens(
            ModifyPositionCache({
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInWei,
        amountOutWei : amountOutMinWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : account,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapTokensForExactTokensAndModifyPosition(
        ModifyPositionParams memory position,
        uint deadline
    ) public ensure(deadline) {coverage_0x38b9235c(0x3f85192f700122e5127bfed560ac50fd6f54e320fa0ea7b2fa49aada9ea915b7); /* function */ 

coverage_0x38b9235c(0xd1590ea7f611623f226e86db9fbabd3344b63891ab5e7a7cec2d6b505a6e9d0e); /* line */ 
        coverage_0x38b9235c(0x91f9a36836d86441bcc6e28d8c5088629126fef2b0497aec6164b3f794bdc07c); /* statement */ 
_swapTokensForExactTokensAndModifyPosition(
            ModifyPositionCache({
        position : position,
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function swapTokensForExactTokens(
        uint accountNumber,
        uint amountInMaxWei,
        uint amountOutWei,
        address[] calldata tokenPath,
        uint deadline
    )
    external
    ensure(deadline) {coverage_0x38b9235c(0x72174950df3f23298202daf31f43c680e0897dc3443d6ad8b418e5a113bbe940); /* function */ 

coverage_0x38b9235c(0x37a44b930164e26b8bcf28bd0d5b6a6481d175db5ab73a19ab2cd7139e515b9c); /* line */ 
        coverage_0x38b9235c(0x489b5bf3668884cdc9837664a97f90531906478b89a22bf32b5bfbe8018f093a); /* statement */ 
_swapTokensForExactTokensAndModifyPosition(
            ModifyPositionCache({
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInMaxWei,
        amountOutWei : amountOutWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : msg.sender,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    function getParamsForSwapTokensForExactTokens(
        address account,
        uint accountNumber,
        uint amountInMaxWei,
        uint amountOutWei,
        address[] calldata tokenPath
    )
    external view returns (Account.Info[] memory, Actions.ActionArgs[] memory) {coverage_0x38b9235c(0xe853458f409eac3dc13edd15d7a202a25cb609801f72547f2b094aaafe6b89d9); /* function */ 

coverage_0x38b9235c(0x06baf454f534b696193ecaf8e3da9f49c6ede4d8fca18b32297a5b5ce313e7c6); /* line */ 
        coverage_0x38b9235c(0x23ec3a38b37750cd96161e2fb77ee0cbf740f44d620aad419e618615b642dd17); /* statement */ 
return _getParamsForSwapTokensForExactTokens(
            ModifyPositionCache({
        position : ModifyPositionParams({
        accountNumber : accountNumber,
        amountInWei : amountInMaxWei,
        amountOutWei : amountOutWei,
        tokenPath : tokenPath,
        depositToken : address(0),
        marginDeposit : 0
        }),
        soloMargin : SOLO_MARGIN,
        uniswapFactory : UNISWAP_FACTORY,
        account : account,
        marketPath : new uint[](0),
        amountsWei : new uint[](0)
        })
        );
    }

    // *************************
    // ***** Internal Functions
    // *************************

    function _swapExactTokensForTokensAndModifyPosition(
        ModifyPositionCache memory cache
    ) internal {coverage_0x38b9235c(0x4174ffcaee9204e4c00f39fecc28ea316beef7a7eeab210d240584b50339aada); /* function */ 

coverage_0x38b9235c(0x488472bbd7b38d8df7c44d160997ec81f836cabefb576ca90dc2195eea8c30ea); /* line */ 
        coverage_0x38b9235c(0x037a6cf0c6ebda251e90a7d4452b517fc8103fc144d2325216d77dcc1c73d4a4); /* statement */ 
(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
        ) = _getParamsForSwapExactTokensForTokens(cache);

coverage_0x38b9235c(0x0564b5553275d1320624523c062c964d89d48f1fe6d9accc15ca0c0a9ec2c212); /* line */ 
        coverage_0x38b9235c(0xfadf6cf6cb1f8b579ba39b5ebfc29a99fdfa4e52d730627f116da6c2adb02c51); /* statement */ 
cache.soloMargin.operate(accounts, actions);
    }

    function _swapTokensForExactTokensAndModifyPosition(
        ModifyPositionCache memory cache
    ) internal {coverage_0x38b9235c(0x61dcbf9692f3a1517ebbcce141c80ee83c28e2cb2fb9623bd239ef0acc103c8a); /* function */ 

coverage_0x38b9235c(0xd38eb4470609896ad1872fef212bb9ea0538c523a624f12ca72408435c99df40); /* line */ 
        coverage_0x38b9235c(0x94a390495ec85467c0fcd8e0db162fd16973c4eedb7e1e7b9114e7a2cc830615); /* statement */ 
(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
        ) = _getParamsForSwapTokensForExactTokens(cache);

coverage_0x38b9235c(0xa35e1ca752d322764e7750e7fea63c34bfa3968880efe868a62fb9b5b476d7f8); /* line */ 
        coverage_0x38b9235c(0x78c67cd1f699b32c1c29274d81f90790d4f925fe8296f20016c487f02e424eb4); /* statement */ 
cache.soloMargin.operate(accounts, actions);
    }

    function _getParamsForSwapExactTokensForTokens(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {coverage_0x38b9235c(0x5854a87cc64ac6b2cf782fd3ef1c5f7ee25a6c4badb944992a754085c6111a14); /* function */ 

        // amountsWei[0] == amountInWei
        // amountsWei[amountsWei.length - 1] == amountOutWei
coverage_0x38b9235c(0x756bedc6673aed7833ec7f3d232a0152dea0f861f1eba5ce033d280592c22df6); /* line */ 
        coverage_0x38b9235c(0x031b94dd480794e32e950aa480ba931bffb282a97436924d8de3f95b84b33eb6); /* statement */ 
cache.amountsWei = UniswapV2Library.getAmountsOutWei(address(cache.uniswapFactory), cache.position.amountInWei, cache.position.tokenPath);
coverage_0x38b9235c(0xc423661bef9090f51c93511c4dbaf9acc0f6fa97092d4c55fe3c7565b5cbea7e); /* line */ 
        coverage_0x38b9235c(0x292117c86037fdc6a09bfa4cbee8397f7053d9017e9ecf2d852d285bf4b82152); /* assertPre */ 
coverage_0x38b9235c(0xa9bbc7cc1a9e5d66c43f82d30d2be1a94b4b594b788a586ebd7508f4324080c8); /* statement */ 
require(
            cache.amountsWei[cache.amountsWei.length - 1] >= cache.position.amountOutWei,
            "DolomiteAmmRouterProxy::_getParamsForSwapExactTokensForTokens: INSUFFICIENT_OUTPUT_AMOUNT"
        );coverage_0x38b9235c(0x9d377220db264fc668e705034a173a0f8845cfb214a61a93a40097cb0a339a07); /* assertPost */ 


coverage_0x38b9235c(0xf83361db395fef813e3f3f75d88eff020aba644f9f513ffb67de620fced7f7d8); /* line */ 
        coverage_0x38b9235c(0x26b048cd27166f136fee409a8a98f4ff3928136534142949e210f0a462abb4b4); /* statement */ 
return _getParamsForSwap(cache);
    }

    function _getParamsForSwapTokensForExactTokens(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {coverage_0x38b9235c(0x5285295771c6f2bfa1ae6f725eb5bf3f562e257d072a6f59a7b2cc9be1e066f9); /* function */ 

        // cache.amountsWei[0] == amountInWei
        // cache.amountsWei[amountsWei.length - 1] == amountOutWei
coverage_0x38b9235c(0xc4221bf2911db8271d7b05d77a0e95ca40ba1bdebee64ac0fbac300b6d3a9491); /* line */ 
        coverage_0x38b9235c(0xc775eb5ad4f75d7c7339618f6ac1c3205439d8098b623c7089d2c5ad70b6ff5d); /* statement */ 
cache.amountsWei = UniswapV2Library.getAmountsInWei(address(cache.uniswapFactory), cache.position.amountOutWei, cache.position.tokenPath);
coverage_0x38b9235c(0xb7e3900927f22ac29ae88c96e652962544ef8b13e3293dcec08a7363ff2431e2); /* line */ 
        coverage_0x38b9235c(0xc6ed314e31e1dce2cde24a5bf83720de2e8d38f4dc35718651f4ae09e8f9eb45); /* assertPre */ 
coverage_0x38b9235c(0xf55673227dc6d88c0b9e49333ab1613c33be1de3a5ccd5b8fcf8ccc09fc1f386); /* statement */ 
require(
            cache.amountsWei[0] <= cache.position.amountInWei,
            "DolomiteAmmRouterProxy::_getParamsForSwapTokensForExactTokens: EXCESSIVE_INPUT_AMOUNT"
        );coverage_0x38b9235c(0x256c1688673beaf76d7765b5f7d34df1834769514af621691fe7ed48e4363a28); /* assertPost */ 


coverage_0x38b9235c(0x48bc0e87dab5585a29160668e37272982fc99f2550fa43101205186a6e138cda); /* line */ 
        coverage_0x38b9235c(0xd4229dfcf1e17e072878002eafffc4b2d518adca978e37f78f5daad784112826); /* statement */ 
return _getParamsForSwap(cache);
    }

    function _getParamsForSwap(
        ModifyPositionCache memory cache
    ) internal view returns (
        Account.Info[] memory,
        Actions.ActionArgs[] memory
    ) {coverage_0x38b9235c(0x4777da56665e129cf341ffe248b92f5ba750ec89816534b9bf3c13874acc76d6); /* function */ 

coverage_0x38b9235c(0x08ceebbf9d24f7e9abb0096e8514b8c7e1d98eb29aebfc508a9c757cf40b43f7); /* line */ 
        coverage_0x38b9235c(0xa22492c22cc6821427ae558e7637323643dfb99b4d17817d14c3a580d13cff9d); /* statement */ 
cache.marketPath = _getMarketPathFromTokenPath(cache);

        // pools.length == cache.position.tokenPath.length - 1
coverage_0x38b9235c(0x92f9bd7218f9e484a565a94727d32eb23aae0e9d8281d3c8bf74cf48a64dd608); /* line */ 
        coverage_0x38b9235c(0x75a0606ae6b821b09495bb084d30a05df9f103aec324605f5a7931ce5f151469); /* statement */ 
address[] memory pools = UniswapV2Library.getPools(address(cache.uniswapFactory), cache.position.tokenPath);

coverage_0x38b9235c(0xcd912ed7507b01d0d356c19bb52d5ef4baecb9f238b5ef1b13ef3c04838b64d0); /* line */ 
        coverage_0x38b9235c(0x7943d3c442a374f9e7e3f132d21f907468b3e2082f59c33940f4d4af4fa3e9d7); /* statement */ 
Account.Info[] memory accounts = _getAccountsForModifyPosition(cache, pools);
coverage_0x38b9235c(0x4ac7f08b8bfb513671e16f824a3b15e511071267a4ce27f3c89b77b67d538a59); /* line */ 
        coverage_0x38b9235c(0x923841a3b1dc17ce02b25b6f64a84f280984ea8d458615459ed0b2bec2c919d1); /* statement */ 
Actions.ActionArgs[] memory actions = _getActionArgsForModifyPosition(cache, pools, accounts.length);

coverage_0x38b9235c(0x37272697a8b0913ad5ffac720c101df0c73b3a065a348f3ed8306af26ae3a534); /* line */ 
        coverage_0x38b9235c(0x726c86614e32b15f8235794fe977c7bcc110b5d2a56f6273d9cd4b652ba1aa68); /* statement */ 
return (accounts, actions);
    }

    function _getMarketPathFromTokenPath(
        ModifyPositionCache memory cache
    ) internal view returns (uint[] memory) {coverage_0x38b9235c(0xcba6d7028ae72a2eb884e3d8b5f0e07d01b679ffc355f5ee02cc5c9319580f08); /* function */ 

coverage_0x38b9235c(0xa9a0c4f34bb787ee6bb0ad2735b273b0a940744a89acb50979fc78343442c8c8); /* line */ 
        coverage_0x38b9235c(0x04b49a6784e6eb0b315a4f17a99e4aae0d8bc0bbc37aca551f2e95a9ba206157); /* statement */ 
uint[] memory marketPath = new uint[](cache.position.tokenPath.length);
coverage_0x38b9235c(0x3d189c4d40d6f431426e7dbc218275643cc5916a8d50958f3f15831a259ff656); /* line */ 
        coverage_0x38b9235c(0x8da650f88b0394a7d510a215c4d2df435deee15bd6420cfe2b82a968f5dfa6bb); /* statement */ 
for (uint i = 0; i < cache.position.tokenPath.length; i++) {
coverage_0x38b9235c(0xa477d855a6396898861c8fa26b1b2ccb50b0df5e2b2d494f83940411e2520e40); /* line */ 
            coverage_0x38b9235c(0x26d9639b378eb371fbe5b711ea3fa04021075c43ff2cd8439ecc57d73998cb5a); /* statement */ 
marketPath[i] = cache.soloMargin.getMarketIdByTokenAddress(cache.position.tokenPath[i]);
        }
coverage_0x38b9235c(0x12d14f137a5fabd519b415569ae8084e3e653e712d5466cd69c85cf3cdff9d4d); /* line */ 
        coverage_0x38b9235c(0xd74ccdcadd00286384ec34e7f0360ea003bcae74d0e007c2bcada4263cdac471); /* statement */ 
return marketPath;
    }

    function _encodeTransferAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId,
        uint amount
    ) internal pure returns (Actions.ActionArgs memory) {coverage_0x38b9235c(0xf1b84fba134b907fab4e05b2f9e5ccc45b24d7c7bbcbe839d0f02f0dc8a17490); /* function */ 

coverage_0x38b9235c(0x0dfeb91fb2ee91c242a634f9cd2ae973e7372b9167f736abe316d716b2ffe8bd); /* line */ 
        coverage_0x38b9235c(0x240c6f6864475301be19b1ce80548578b6b1aeb7e3403e1521f87ea9b1dbb182); /* statement */ 
Types.AssetAmount memory assetAmount;
coverage_0x38b9235c(0xf9dc9bc023e9e4b2883627572ebba03b8ff88c38d746c172d3bb34ccb56b9073); /* line */ 
        coverage_0x38b9235c(0xd8ad9e676280fdd64f7c18758147bb3a1a9a25af1d3603a13c9e7d72f276681a); /* statement */ 
if (amount == uint(- 1)) {coverage_0x38b9235c(0xd3a488561aa52460ede96fab63250207aa45c54231f895cdd0fb575ca118976f); /* branch */ 

coverage_0x38b9235c(0xa948beb0342bdcb7cce4df7e688a26bd4652509692e89bbf4158b9febd96f6d3); /* line */ 
            coverage_0x38b9235c(0xa491d0f062f1f7ed092a4275ecc3fabfd1a515d56df836d2dfde6aeecc4239d1); /* statement */ 
assetAmount = Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0);
        } else {coverage_0x38b9235c(0x9802d4a3fc419e385e5c229acd37518e2ca7da15982145edc233c365d7526476); /* branch */ 

coverage_0x38b9235c(0xdf863ea02596e3afcbd38ccdb71553418ddae7cd181ea0e3e1729212a41cc1b2); /* line */ 
            coverage_0x38b9235c(0xf47ac3ddf4d38026613fb10712ecfa37639d4ad3d3008acd65c6d7a4046574ea); /* statement */ 
assetAmount = Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount);
        }
coverage_0x38b9235c(0x036f23e1f43863a3d4a1ae86a3728bcb3b88c9fc4c2b92ea33ac559c6b2e3080); /* line */ 
        coverage_0x38b9235c(0x3ad35ac99fadb47bb4e8ae66d849bdf78389158b075fde3fc1c37df2541f9000); /* statement */ 
return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        amount : assetAmount,
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    function _encodeTradeAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        address traderAddress,
        uint amountInWei,
        uint amountOutWei
    ) internal pure returns (Actions.ActionArgs memory) {coverage_0x38b9235c(0x90772b08ed096a02f1c99ce4fd59f91387f681faaf793456b16fd8e8ba86d36d); /* function */ 

coverage_0x38b9235c(0x15466145611e4273e8f5b4d11d7e12189a44717d524bf107e0e3324190a307e2); /* line */ 
        coverage_0x38b9235c(0xe14d61d0cdcbf5430f399ec7c18c07878bc12010ae2d0344f03ea07fce26b880); /* statement */ 
return Actions.ActionArgs({
        actionType : Actions.ActionType.Trade,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
        primaryMarketId : primaryMarketId,
        secondaryMarketId : secondaryMarketId,
        otherAddress : traderAddress,
        otherAccountId : toAccountIndex,
        data : abi.encode(amountOutWei)
        });
    }

    function _encodeCallAction(
        uint accountIndex,
        address callee,
        bytes memory data
    ) internal pure returns (Actions.ActionArgs memory) {coverage_0x38b9235c(0x9ad3b5cc5ab1f9f22e60e74c77a4788190357cfea221eabc545310a9129fba20); /* function */ 

coverage_0x38b9235c(0x2da80677a5356cbb7cc48e323fc210c1044097189f9e87271ab2d92761ead85a); /* line */ 
        coverage_0x38b9235c(0xa1e5a39d5dabc76cd6ecabf44e9091a73c9992aa494fd6a95f770b397f63580f); /* statement */ 
return Actions.ActionArgs({
        actionType : Actions.ActionType.Call,
        accountId : accountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, 0),
        primaryMarketId : uint(- 1),
        secondaryMarketId : uint(- 1),
        otherAddress : callee,
        otherAccountId : uint(- 1),
        data : data
        });
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal returns (uint amountA, uint amountB) {coverage_0x38b9235c(0x1ab18710fb6a95966d6f5336df496471459d05af6c28e199f3f10274922c6e65); /* function */ 

        // create the pair if it doesn't exist yet
coverage_0x38b9235c(0x654376643aacfb439db48d671b07fda9296f0b6b8fd1758d3fbe59036399f185); /* line */ 
        coverage_0x38b9235c(0x54c66d733133c76086e6931b5f678ce08d118726fec243a2da02240284342bbd); /* statement */ 
if (UNISWAP_FACTORY.getPair(tokenA, tokenB) == address(0)) {coverage_0x38b9235c(0x89aeddb681c400ec1f6dff50639509e0ae7e7eb1c688ff2a498c53dc551a87e9); /* branch */ 

coverage_0x38b9235c(0x977c74048a527d03ea77953c78b4ec9a11acd03ef90948e0a2788fd77d84375e); /* line */ 
            coverage_0x38b9235c(0xcbe7c20ac7a9ec5fe9d4cbf2bb17caceba7ab59527c32a09fac75e0e7642b746); /* statement */ 
UNISWAP_FACTORY.createPair(tokenA, tokenB);
        }else { coverage_0x38b9235c(0xcecbb276ab7a76d1e5f530697e7a36db6e4b19fe98770589e95778e641930199); /* branch */ 
}
coverage_0x38b9235c(0x5e162a4dea5b4fd4d47da0c40918d5120381e4c7843ace780f54be4946b6a3b0); /* line */ 
        coverage_0x38b9235c(0xda60532323591e66a9f0ef2669606fd82474390bd3743fdbf80be800c202716d); /* statement */ 
(uint reserveA, uint reserveB) = UniswapV2Library.getReservesWei(address(UNISWAP_FACTORY), tokenA, tokenB);
coverage_0x38b9235c(0x11d1d3f9d47ef1defeaefb42cd523aff38ffb92cc8202c53e25803d00fa3d98f); /* line */ 
        coverage_0x38b9235c(0xb0013e56173d9f80d874fbebd7d8ecd48dd42bdbe95af36859dcb796085ce69f); /* statement */ 
if (reserveA == 0 && reserveB == 0) {coverage_0x38b9235c(0x140163ad7712586eebe4852add2a6be83295967d89d7ae087c7840ee8f188c87); /* branch */ 

coverage_0x38b9235c(0x6c643c81dc49fde874f48668ab90b54533ae52c4c1186a66ef19433d7d75996d); /* line */ 
            coverage_0x38b9235c(0xcd65771c6e3946f6f1f2b800f3ba3282356f8b595a26e8352aadd13667974a46); /* statement */ 
(amountA, amountB) = (amountADesired, amountBDesired);
        } else {coverage_0x38b9235c(0x5d4a732570194fd576bb35886ce34cf89864e345214168e9bb59b3d100c7d5ca); /* branch */ 

coverage_0x38b9235c(0x027f219e3f3016cbe8947c56ba136b17e90629771fc0bcbb707cdafb93951537); /* line */ 
            coverage_0x38b9235c(0xaaffbedad738c220422f761ad4271a0c99671e60141ccb8a7df0fd4fac76870e); /* statement */ 
uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
coverage_0x38b9235c(0xf0250bb9d12ccd04c925b23a3cac665982af6e74e0963bd69b7d8d2f6f7b1aa3); /* line */ 
            coverage_0x38b9235c(0xab404715055cf537792b8c9c84bffb9d37ee0785085bf556119080541ab1be64); /* statement */ 
if (amountBOptimal <= amountBDesired) {coverage_0x38b9235c(0x3f91abb8bba5d00b28b9608a9fb8e58c6c56d4097966241f1e77ae2536fa21ab); /* branch */ 

coverage_0x38b9235c(0x26a038e5b1e7ab69dd2de8b2f3c13e087d2cbac45d71bd63719293a1285fc15f); /* line */ 
                coverage_0x38b9235c(0xbbc71624a125e6bf7b267d6ea5d09238c0432dc29fd9e12f3f4ef1121011d031); /* assertPre */ 
coverage_0x38b9235c(0xdda3bc79f9f6d8e7eca4ad5a0f0d7bcf2b11329601816a0b9a8021ecf5f6f6ae); /* statement */ 
require(amountBOptimal >= amountBMin, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_B_AMOUNT');coverage_0x38b9235c(0x2f0862df8ef4dc7fa9333bf32a20968572d3a6152ac4ed0dca83a8d6c256767b); /* assertPost */ 

coverage_0x38b9235c(0xcdacfe1d03ec98ae82267afa2b2f4aa73062c7317e63fbf48793ccb717a477c1); /* line */ 
                coverage_0x38b9235c(0x57c08ce71b93f003313cd7497085f5be6ca336ab3b7e4d98c89a42300b67590b); /* statement */ 
(amountA, amountB) = (amountADesired, amountBOptimal);
            } else {coverage_0x38b9235c(0x64b68b0cd2faeddeaa4b45beeeeaad3cf357695090a24a047aea0708545b0247); /* branch */ 

coverage_0x38b9235c(0x0bceef367a00ed49deed91e079c0984e482feda87404aebdd3ce58a3b1ed4c78); /* line */ 
                coverage_0x38b9235c(0x0b710ba0b3b3374bbeb537d07cb1ff05fd25d7bbecf75a4b3f1915cef05be891); /* statement */ 
uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
coverage_0x38b9235c(0x59826f4d1abbf7c3b10b84b3f739c3c5145475c88c33854ec2bafb2339df33a9); /* line */ 
                coverage_0x38b9235c(0x0ada32834b605ac1626330a678db252945ba44f961a4d3ef837aad053b77c1f3); /* assertPre */ 
coverage_0x38b9235c(0x18582f378f16632aff439f553ea5ce3c1ce411cca04c85b9aaac0f45c6b88499); /* statement */ 
assert(amountAOptimal <= amountADesired);coverage_0x38b9235c(0x2204989ce45ba31f54b5db4adfcf9a4a1af3a4909bc543e36b4f0132c48bcaad); /* assertPost */ 

coverage_0x38b9235c(0xf0f9e95dac4d558a6d9e9ec0c2df79494a30387345cfa6dbeb772c5dcdee06c8); /* line */ 
                coverage_0x38b9235c(0x09c78be70f10552676afe2465ade8d474a4570a474da9b02ce6c94959479bd14); /* assertPre */ 
coverage_0x38b9235c(0x5d397303eaeb965c2106024d6022fdb6165acdce8d3571b7ea8b2066a3f51def); /* statement */ 
require(amountAOptimal >= amountAMin, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_A_AMOUNT');coverage_0x38b9235c(0x8fba7e4096a1d5ab1820b73b9779c027542a0d32cdc6ce3c914c7fb7ea344a25); /* assertPost */ 

coverage_0x38b9235c(0x7cda5b427accf31e73b02d7d7e0da967e289eaaad5e044732db620706fb37699); /* line */ 
                coverage_0x38b9235c(0xc171c418ace2e0f01c43991b67e00930b6439756332df9e702b5839d6f5f294e); /* statement */ 
(amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function _getAccountsForModifyPosition(
        ModifyPositionCache memory cache,
        address[] memory pools
    ) internal pure returns (Account.Info[] memory) {coverage_0x38b9235c(0x6777c058011780020c9553d07044e57594b159d7c44430f7b9793deced02a3ef); /* function */ 

coverage_0x38b9235c(0xf1efbe67e7ffa7eaf1aa2fa9e903414b7d03f9d140fad9bf63a854c1f07bee14); /* line */ 
        coverage_0x38b9235c(0x2d7b9525e14d300967541c914b5dce5959e9803b0d11b4ef9ba09ca8f8237fd2); /* statement */ 
Account.Info[] memory accounts;
coverage_0x38b9235c(0x7da0391fc51356e2795198e4ef621879d782f0db177f84409172babdd3e08da7); /* line */ 
        coverage_0x38b9235c(0x609758c99407b433b1708d230e31b64d3e5743708a34a8781445c82ba6dddbda); /* statement */ 
if (cache.position.depositToken == address(0)) {coverage_0x38b9235c(0xcb43cca290c82209dd83c0c4e36434398f7fb9e73e28f0b6e1c1ed18c11bd19b); /* branch */ 

coverage_0x38b9235c(0x6f62c683880963a664064c763233d41fb8ee506ac2c825811d5d0f3f65584a45); /* line */ 
            coverage_0x38b9235c(0x81c98b99a01b5670dfbb0fbb491bec0543907cd131b9659ae40ac6b3e02fd646); /* statement */ 
accounts = new Account.Info[](1 + pools.length);
        } else {coverage_0x38b9235c(0x875847c17c9f452edc6df02ff8bae473eeb9af85d5d8f31e1bda911c8f86d3ab); /* branch */ 

coverage_0x38b9235c(0x04292d6a9c327eb212bb09bfa1465193a6d8bf8118109f937fb40c43c252bd05); /* line */ 
            coverage_0x38b9235c(0xba3bc46b4a053578554d26b1e8fb83bb2c352e4111c129037773ae485b004dc8); /* statement */ 
accounts = new Account.Info[](2 + pools.length);
coverage_0x38b9235c(0xd4a929cd5e9a836fb9057acca1c5d1660f3c317f42cdbda741fc0ec0305142df); /* line */ 
            coverage_0x38b9235c(0x7e424608ab88ca9fcfd50c1755c57693d711b102361f0b22cd1cc0d0431ee3ef); /* statement */ 
accounts[accounts.length - 1] = Account.Info(cache.account, 0);
coverage_0x38b9235c(0x60a8b395ba3055ce2a52abc76885f99db42691166bfea6dd96932f65328d2451); /* line */ 
            coverage_0x38b9235c(0x8bfaa5f6cacf0cca0f31057264346bf7a1ca2ae459b187867d1bef2a18161647); /* statement */ 
return accounts;
        }

coverage_0x38b9235c(0x05ac6596fa6dc1cc82b3f8f4bef5152e5a81a22b71b2e2cb52649c67e125a067); /* line */ 
        coverage_0x38b9235c(0xf723eb3ea1294329c3f6ed448e1e7293f2949a9f5c3981697ecdd4d2715db14f); /* statement */ 
accounts[0] = Account.Info(cache.account, cache.position.accountNumber);

coverage_0x38b9235c(0xde4f9ccba9700e8a3c6347c8fa81f7930ab2de5f013ccb4f2a20009ab5e2cc77); /* line */ 
        coverage_0x38b9235c(0xb693e280548df6f62aa1903fc5fa14c87c32d86b2ff0d1b0a5827a6d0ec14516); /* statement */ 
for (uint i = 0; i < pools.length; i++) {
coverage_0x38b9235c(0x7d511792819fa347bfe2b8f1cbc21ec44af96d9a542b43708d4bcf4711fe07a6); /* line */ 
            coverage_0x38b9235c(0xa89cb989d426343c279fbf6f431736cc5ef8424a50574a5e23a314e162fd3582); /* statement */ 
accounts[i + 1] = Account.Info(pools[i], 0);
        }

coverage_0x38b9235c(0x4bb1f1f601066b4dc6f746f8428b021a4c78b2ea297b998f5b10311543811738); /* line */ 
        coverage_0x38b9235c(0x3fdc79475ffbfc3afe2803b55725cc15f82b35467b1e3d12db537f5f44b6a6d2); /* statement */ 
return accounts;
    }

    function _getActionArgsForModifyPosition(
        ModifyPositionCache memory cache,
        address[] memory pools,
        uint accountsLength
    ) internal view returns (Actions.ActionArgs[] memory) {coverage_0x38b9235c(0xb0142a13429bb401b41e317f69917d07130ef8d86e9a685a5f9d67b58b3bdf5a); /* function */ 

coverage_0x38b9235c(0x7f3cfacbb1e10ddcb93e53e60d87092c9f8cf88cb5cc78b9b2e824e5dbafaef5); /* line */ 
        coverage_0x38b9235c(0x48e06375e04c187eab3c1bd7340aa3fae70a82e4cef9dd91482854c5d9b52bb3); /* statement */ 
Actions.ActionArgs[] memory actions;
coverage_0x38b9235c(0x70588d361707cede8f44a203dc01832314182af1c307b06f640c05c7b469acb3); /* line */ 
        coverage_0x38b9235c(0x6fd12bbdc1e80b18c525a58c901508c77ba37521e855c75443f6ee2091f26407); /* statement */ 
if (cache.position.depositToken == address(0)) {coverage_0x38b9235c(0xb8acc8d9cac13bc2aed8fbbfb45395f8e713df520f4c926fc0f21f47b115c796); /* branch */ 

coverage_0x38b9235c(0x2c6fac56b5b248fcb61a447bc2336785765af77a528021fcf06ecdfb6b4a55d7); /* line */ 
            coverage_0x38b9235c(0x318e03b769d471934fa3c1204ce7b8e1c95a9f39cff39e6103d81777de1b38df); /* statement */ 
actions = new Actions.ActionArgs[](pools.length);
        } else {coverage_0x38b9235c(0x42b7fe5c3b5a71ddee208b5f5e3a36ee6104db328c9631cd77a71e06b2f92190); /* branch */ 

coverage_0x38b9235c(0xc20ff7fa572634fbdc763200fdcb3ab5d43d590a923c18581872eceac69f6907); /* line */ 
            coverage_0x38b9235c(0x65b7e4da200489d42370ffd9ac1ed4df55b5902c18d2ff4038f2c13ae17cd1fd); /* statement */ 
actions = new Actions.ActionArgs[](pools.length + 1);

            // if `cache.position.marginDeposit < 0` then the user is withdrawing from `accountNumber` (index 0).
            // `accountNumber` zero is at index `accountsLength - 1`
coverage_0x38b9235c(0x4fe6d93fa6bb4ab90c72ae3042502a8056f79b98716f8a94dc440a7b8cb32b9a); /* line */ 
            coverage_0x38b9235c(0x85e3db980439c2bcd3c9cc35431d1973f1bb51ac2efd4c0c2afb6a7062083cbe); /* statement */ 
uint amount;
coverage_0x38b9235c(0x644eb13d89d0051ea2874f76f4f326287cd8a17db514fbbe17d552d5e67dc786); /* line */ 
            coverage_0x38b9235c(0xb2eed243056811b37b32ce6bb6fb1a455991af4b0915a3ea6bb811e984b5eaf7); /* statement */ 
if (cache.position.marginDeposit == int256(- 1)) {coverage_0x38b9235c(0x0e03f198c74a23fb9437baac41600c5b5d92eb55e0257a7bfe16031977e82ed8); /* branch */ 

coverage_0x38b9235c(0xf071e47888da7435228222ae4b7bd15661120d33cee207db1ae8db289437cebc); /* line */ 
                coverage_0x38b9235c(0x1e8697194a711331264b59668437de06689d92543400626c464bc87c131fea42); /* statement */ 
amount = uint(- 1);
            } else {coverage_0x38b9235c(0x198c614084456237ec95921a97d3c0027c0d248d7d60ee64e8e499077f8f90a6); /* statement */ 
coverage_0x38b9235c(0xe2e964078bc91ca1d8ce0ddd44869c72c2edddbdebdb19fb682756b4b675df03); /* branch */ 
if (cache.position.marginDeposit == MAX_INT_256) {coverage_0x38b9235c(0x715de118cb54ab5f5eeb1c15aeac708175762ce98e6929a2536a233649725f82); /* branch */ 

coverage_0x38b9235c(0xc7947ead4dc2872689ed60e2152aa1b9d2cc9df59fb6621aff67e614ad72a2d7); /* line */ 
                coverage_0x38b9235c(0x336ee7b00c9e2593da89c97c408e83c58980d77c37367f51d07292f74eed19b2); /* statement */ 
amount = uint(- 1);
            } else {coverage_0x38b9235c(0xef760381fd8f6b67cd789231a0b472bb33dac99695ea86a190d120ec141ae3cd); /* statement */ 
coverage_0x38b9235c(0xc18d6c3e80331ced1611f852154935c7b4bcdc8ec25a1d5f8d222d8d419abae4); /* branch */ 
if (cache.position.marginDeposit < 0) {coverage_0x38b9235c(0x8bf8acaf2dcbfe64a2f170629075d89d1a60345a8247adfbbe39598e76a3e76e); /* branch */ 

coverage_0x38b9235c(0x491919b0511f7dc965ee996734107396028e823f8b5cb4324199ac13da7c2676); /* line */ 
                coverage_0x38b9235c(0xd606238a62156455065de42d31aca6c051f5450c266211e439f2fb6596ed4521); /* statement */ 
amount = (~uint(cache.position.marginDeposit)) + 1;
            } else {coverage_0x38b9235c(0x7d889edcbd070db5a34fe38c21955a76ad667e747792ddbf1410b87392a383af); /* branch */ 

coverage_0x38b9235c(0xb9c900b4a5b3c18c0e025c73b914f5711a455150bb8036020dd7d56c9fbd2fc5); /* line */ 
                coverage_0x38b9235c(0xe277039d3037d8deb584562684340bef6110ac7c73b6852779c7699edca7488a); /* statement */ 
amount = uint(amount);
            }}}

coverage_0x38b9235c(0x00c4274d23e05c53e1b5b501432402c5db02b6d31c4c837f985a941615c310e6); /* line */ 
            coverage_0x38b9235c(0x991835af5b028c5cd9cc0c01d083ad75efe7c532e048672257eaac3d2e438ee1); /* statement */ 
bool isWithdrawal = cache.position.marginDeposit < 0;
coverage_0x38b9235c(0x91b33f41efc67185b31eb5fa8532c948ed3a86c609cfdebe7ac04575fa613fbe); /* line */ 
            coverage_0x38b9235c(0x0e3e2fad83e05ead27693c8bda74ab36c4c6d7a5f0cd264772f090985284c55d); /* statement */ 
actions[actions.length - 1] = _encodeTransferAction(
                isWithdrawal ? 0 : accountsLength - 1,
                isWithdrawal ? accountsLength - 1 : 0,
                cache.soloMargin.getMarketIdByTokenAddress(cache.position.depositToken),
                amount
            );
        }

coverage_0x38b9235c(0x3ac1524494b627d02619a0061ed9351b9dd8b137b989b19e0dc8b21f582b2dda); /* line */ 
        coverage_0x38b9235c(0xd9e9d79109986b822e48e3a9b0eff5cf596a0df8b1b5281a42e896f458bd5a0c); /* statement */ 
for (uint i = 0; i < pools.length; i++) {
coverage_0x38b9235c(0xbf96662dc1f6a1fd85213510b6b4902ea3ccf32154722e0c0feb89772bff5c42); /* line */ 
            coverage_0x38b9235c(0xb6822e31e413f4927393d985912fd9bb329d424b8aee017c1962403bc12bcc38); /* statement */ 
actions[i] = _encodeTradeAction(
                0,
                i + 1,
                cache.marketPath[i],
                cache.marketPath[i + 1],
                pools[i],
                cache.amountsWei[i],
                cache.amountsWei[i + 1]
            );
        }

coverage_0x38b9235c(0xcbfed5de69671b244929b3b036f9cb618e4e191e163210a1a39192ab5f722cf2); /* line */ 
        coverage_0x38b9235c(0xa60c2cc9d4b2994a093c67957b52b39fcd028d75151021741c5f780117a3e9bd); /* statement */ 
return actions;
    }

}
