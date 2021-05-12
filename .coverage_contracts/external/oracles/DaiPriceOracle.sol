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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IERC20 } from "../../protocol/interfaces/IERC20.sol";
import { IPriceOracle } from "../../protocol/interfaces/IPriceOracle.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { IMakerOracle } from "../interfaces/IMakerOracle.sol";
import { IOasisDex } from "../interfaces/IOasisDex.sol";


/**
 * @title DaiPriceOracle
 * @author dYdX
 *
 * PriceOracle that gives the price of Dai in USD
 */
contract DaiPriceOracle is
    Ownable,
    IPriceOracle
{
function coverage_0x68f19e0e(bytes32 c__0x68f19e0e) public pure {}

    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "DaiPriceOracle";

    uint256 constant DECIMALS = 18;

    uint256 constant EXPECTED_PRICE = ONE_DOLLAR / (10 ** DECIMALS);

    // ============ Structs ============

    struct PriceInfo {
        uint128 price;
        uint32 lastUpdate;
    }

    struct DeviationParams {
        uint64 denominator;
        uint64 maximumPerSecond;
        uint64 maximumAbsolute;
    }

    // ============ Events ============

    event PriceSet(
        PriceInfo newPriceInfo
    );

    // ============ Storage ============

    PriceInfo public g_priceInfo;

    address public g_poker;

    DeviationParams public DEVIATION_PARAMS;

    uint256 public OASIS_ETH_AMOUNT;

    IERC20 public WETH;

    IERC20 public DAI;

    IMakerOracle public MEDIANIZER;

    IOasisDex public OASIS;

    address public UNISWAP;

    // ============ Constructor =============

    constructor(
        address poker,
        address weth,
        address dai,
        address medianizer,
        address oasis,
        address uniswap,
        uint256 oasisEthAmount,
        DeviationParams memory deviationParams
    )
        public
    {coverage_0x68f19e0e(0x347c48289a2a406c692d0c8195f16b9972b8ed286f87fc6ac6f6ba4c59b0aff7); /* function */ 

coverage_0x68f19e0e(0x3825788fe19720bb61ed1dc39f00e86525aaaefcb9c96fba3dc5363718adc31c); /* line */ 
        coverage_0x68f19e0e(0xf743745e680a36027d826b15497e491614d18fb897691bc492831965565f6a1c); /* statement */ 
g_poker = poker;
coverage_0x68f19e0e(0xa8ad71242eea1ec66e8792711a6bfec18624075366e4457620aa65153adbbef6); /* line */ 
        coverage_0x68f19e0e(0xcf23b77007eae996877d2e019b433055ee0e14c05519d8f57844ab42d966f59b); /* statement */ 
MEDIANIZER = IMakerOracle(medianizer);
coverage_0x68f19e0e(0x6b4964566fa539c5bae24545c80e76b432cce49bcbd0a3bce74e3a0dc5a74abc); /* line */ 
        coverage_0x68f19e0e(0xb4345c2c8818bd05ac1efd7e1a94d6d2ff53e9aebf2802a900f87dab0c015805); /* statement */ 
WETH = IERC20(weth);
coverage_0x68f19e0e(0x4be54cfb9a481e30b3a7d1772efe6750f67433f3c581840ed95b6c612af22920); /* line */ 
        coverage_0x68f19e0e(0xd508d48e750d48f2d19995c7bcb753dfb27c01095addd7d11dc589c5f28e9832); /* statement */ 
DAI = IERC20(dai);
coverage_0x68f19e0e(0xd41b8231669e0c4b99b9b36992017de7cb14dc54bfd73095f12feea3c06dcf3e); /* line */ 
        coverage_0x68f19e0e(0x9548148303de09242b88a510cc7cbd02af2ee264d1be28440c54d00e62ad559d); /* statement */ 
OASIS = IOasisDex(oasis);
coverage_0x68f19e0e(0xc39597f3f63375689c2a51191d127560d4088d9a681d51e0d13c1e481afec0f6); /* line */ 
        coverage_0x68f19e0e(0x14f3258c80d62830b4896b04cefe9302d6cc37578d34a390eb845c78c4f7eab0); /* statement */ 
UNISWAP = uniswap;
coverage_0x68f19e0e(0x35e73307bd596a8a1d74ed7ede893b037a985aadf77da183c870bb55bd9f50b6); /* line */ 
        coverage_0x68f19e0e(0x185b19f2b7b1b23b8e72cbc9d58ceaa0882025c1e5507b35d366a19c9fc6dc2d); /* statement */ 
DEVIATION_PARAMS = deviationParams;
coverage_0x68f19e0e(0xccc61f1a2ea432971bcbf4364a321ed7751158c763cf5bb0b0a6d6edc5d52e36); /* line */ 
        coverage_0x68f19e0e(0x1507e2a7d1609ff8735010cdede9331b519dfd1f539397132f8646f3d75737da); /* statement */ 
OASIS_ETH_AMOUNT = oasisEthAmount;
coverage_0x68f19e0e(0xa44bccd94760076809cc3550c9634abee58f905f5e46f013bb969164ca0e2baf); /* line */ 
        coverage_0x68f19e0e(0x52f20ce928935a0f54fe54a2b623a8ab4664fd224e8c2d1e515b5a41dfa50c1e); /* statement */ 
g_priceInfo = PriceInfo({
            lastUpdate: uint32(block.timestamp),
            price: uint128(EXPECTED_PRICE)
        });
    }

    // ============ Admin Functions ============

    function ownerSetPokerAddress(
        address newPoker
    )
        external
        onlyOwner
    {coverage_0x68f19e0e(0x72f18c9d2c2faba7dbe5a738c3f56d527b36e8618097f364318823f7e4901149); /* function */ 

coverage_0x68f19e0e(0xb3237a519601dacc0a5ca5a491ef373131b0edd0c237fc4b7325c246936a2ed2); /* line */ 
        coverage_0x68f19e0e(0x704dedab17a75ea5917b02dc5d8474a2fc6848011ff127aa84b0c8819f43f8d5); /* statement */ 
g_poker = newPoker;
    }

    // ============ Public Functions ============

    function updatePrice(
        Monetary.Price memory minimum,
        Monetary.Price memory maximum
    )
        public
        returns (PriceInfo memory)
    {coverage_0x68f19e0e(0x32e8bfb6a9bccd416dfd2293851d17f908f741c452f3fae62746d41c6278d740); /* function */ 

coverage_0x68f19e0e(0xdc671eac968a2238b7edff956c35067f25922a1d4138e925dbb355824e33b522); /* line */ 
        coverage_0x68f19e0e(0xa761195882436aea780d3b46a5798aa2e72302ee8589aad951ce1cdfc4902df8); /* statement */ 
Require.that(
            msg.sender == g_poker,
            FILE,
            "Only poker can call updatePrice",
            msg.sender
        );

coverage_0x68f19e0e(0xa98524a01014b84f1eeb387589cd717aafeb479d06a1a9888186f27a030106d3); /* line */ 
        coverage_0x68f19e0e(0x2130e1184b8ffdb9e976517fad3a4965fcb837898861a414bd12919ac8b0ca69); /* statement */ 
Monetary.Price memory newPrice = getBoundedTargetPrice();

coverage_0x68f19e0e(0x81e306cdf324a342fd5417c412e95e15bd7ecd9db82f4f7f703f78981f233ff7); /* line */ 
        coverage_0x68f19e0e(0xae7983b8597ba21702a5b4f378745cb248614d500ca3dd0895aceecf3c621c9c); /* statement */ 
Require.that(
            newPrice.value >= minimum.value,
            FILE,
            "newPrice below minimum",
            newPrice.value,
            minimum.value
        );

coverage_0x68f19e0e(0x7e2946d6300e37b7634aebf087f028504282bb5608122b4c70af7c1a9fea712b); /* line */ 
        coverage_0x68f19e0e(0x3a83d5be9b06e5e95318719e3ca36e6a8ed9d9cdc517544a89a6055fd5c507a1); /* statement */ 
Require.that(
            newPrice.value <= maximum.value,
            FILE,
            "newPrice above maximum",
            newPrice.value,
            maximum.value
        );

coverage_0x68f19e0e(0x2b12909614f337cdc9e48ba5b464776739c8a4ce3b4b64968e5b2c2dc6732054); /* line */ 
        coverage_0x68f19e0e(0xa42c063f8fe627ab8691df9b5be8ce2d31181ab20b6cc2747995b3ab56cbe553); /* statement */ 
g_priceInfo = PriceInfo({
            price: Math.to128(newPrice.value),
            lastUpdate: Time.currentTime()
        });

coverage_0x68f19e0e(0xd9dde9ac71e14bdd5d5700528c117ba4edd3e65251fba057c79f92fcef439197); /* line */ 
        coverage_0x68f19e0e(0x7606099c3506dbe57a57aa4a0c11d4c29465eecde33a709e42a6492e6446266d); /* statement */ 
emit PriceSet(g_priceInfo);
coverage_0x68f19e0e(0x8fc58cf461a0d27c7fea1699d1a2481473207f1410a92e2bf7a8bd88334da691); /* line */ 
        coverage_0x68f19e0e(0xa27892f7a4b02ad0f3b903c0a38273f136be753359b5e5427e9371a1e549fc3d); /* statement */ 
return g_priceInfo;
    }

    // ============ IPriceOracle Functions ============

    function getPrice(
        address /* token */
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0x3a8ed358f9395a1701791eee712046e711686d572d1791d02647431c294022c1); /* function */ 

coverage_0x68f19e0e(0x5116a480c43f21316ecb128aa6441c9c4c2f699ba384880d12180ef55dc86e18); /* line */ 
        coverage_0x68f19e0e(0x5486d6aff7ce2345ffba3cbdec2978e1a7206aa059a507570e896af560e65835); /* statement */ 
return Monetary.Price({
            value: g_priceInfo.price
        });
    }

    // ============ Price-Query Functions ============

    /**
     * Get the new price that would be stored if updated right now.
     */
    function getBoundedTargetPrice()
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0xf1bb56b62ffd2519a1ed1a0dc2f60123cf95c84c893b367d9e9a7b4abfa9ba06); /* function */ 

coverage_0x68f19e0e(0x7ea01e63fd35ac1aaec7cd106c14d3326b255cbfc676881423c9397fd7547b01); /* line */ 
        coverage_0x68f19e0e(0xbfdaaea4b273b2c219781f7d14ef6b9ae8da57c6d9ae72b47f739e6351d4a472); /* statement */ 
Monetary.Price memory targetPrice = getTargetPrice();

coverage_0x68f19e0e(0xb1e9072aa3310fc950af24b6e52279eba54852027a6cfc151ef49d3cfa54ae02); /* line */ 
        coverage_0x68f19e0e(0x654121cc5318dc54e4f08218574127682c34d78eeddd435ea78dabf43ff1ca56); /* statement */ 
PriceInfo memory oldInfo = g_priceInfo;
coverage_0x68f19e0e(0x9658763e39d5fe33e6d8c904a2a38b0ec66f66f2da1e2a266bc5e57064532347); /* line */ 
        coverage_0x68f19e0e(0x16c8417777f337851559bca12c6f0a7d9c66ad98b70bc4959d380a1b8050628f); /* statement */ 
uint256 timeDelta = uint256(Time.currentTime()).sub(oldInfo.lastUpdate);
coverage_0x68f19e0e(0xe7b04d9bd10450f5926b93ab67b183aa38d72eb6cce073b9093270221f4c0484); /* line */ 
        coverage_0x68f19e0e(0xb656e88b7483e29f896682871d31a70316953d735e05774f4c22129d9585f370); /* statement */ 
(uint256 minPrice, uint256 maxPrice) = getPriceBounds(oldInfo.price, timeDelta);
coverage_0x68f19e0e(0x565f41a788f57209ad0626385ed69f951dea1d9f7b5d162be6e044317a3e8d6f); /* line */ 
        coverage_0x68f19e0e(0x5c87dd0e83048833547e2595dd1bcd3504b9a9855d0574da2831e4788dfd87ad); /* statement */ 
uint256 boundedTargetPrice = boundValue(targetPrice.value, minPrice, maxPrice);

coverage_0x68f19e0e(0x5a9ce4b18e29873abbeddc38ed16abe6006c71583408955bbad4289bdde6aee9); /* line */ 
        coverage_0x68f19e0e(0xa1f4871158fed9eae09f1fce64750f07c88849882f29030eb6dbd9b1e7f1a7a5); /* statement */ 
return Monetary.Price({
            value: boundedTargetPrice
        });
    }

    /**
     * Get the USD price of DAI that this contract will move towards when updated. This price is
     * not bounded by the variables governing the maximum deviation from the old price.
     */
    function getTargetPrice()
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0x0255147c6ea42080ff902e05268710e47233f614474701bc224eff815154b97e); /* function */ 

coverage_0x68f19e0e(0x618a9372b066726d7b1379a6d3985a3ee1717c39a271119f9450bfa6d1960362); /* line */ 
        coverage_0x68f19e0e(0xaaa0269f190c49914225ed5652da1e4b71585cd3b44296df36ddd67aab86f37a); /* statement */ 
Monetary.Price memory ethUsd = getMedianizerPrice();

coverage_0x68f19e0e(0x5b1e5032b9a9fb934432821ff03aa274e35efbcfcfda026bfc13509d2a01930f); /* line */ 
        coverage_0x68f19e0e(0xa29ad800b38e48d85227f931126fef6b62d7a01c3da056af2b04d3a8cc44db39); /* statement */ 
uint256 targetPrice = getMidValue(
            EXPECTED_PRICE,
            getOasisPrice(ethUsd).value,
            getUniswapPrice(ethUsd).value
        );

coverage_0x68f19e0e(0xeefd2ac54f37f4abc5c099bed1df48677d595b1c7cdf3989ea9faf2324b61f0f); /* line */ 
        coverage_0x68f19e0e(0x7ae7cbcd876c2c99e789677a8a7e81545a330247a2c82e5dee6193f3ddf6b662); /* statement */ 
return Monetary.Price({
            value: targetPrice
        });
    }

    /**
     * Get the USD price of ETH according the Maker Medianizer contract.
     */
    function getMedianizerPrice()
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0x86a2d471f6878275cf8a21defaeee39dbf1d3ee00575a7c5958ab9c55b8d5507); /* function */ 

        // throws if the price is not fresh
coverage_0x68f19e0e(0x470d5a3cbeda357c7619f82b4c36ba43f4b8812c2a30470affa083494f38195b); /* line */ 
        coverage_0x68f19e0e(0x76cd13036614fde8aeb4ba4ef84784cc431a74c14b1340660b4343fb102ecf96); /* statement */ 
return Monetary.Price({
            value: uint256(MEDIANIZER.read())
        });
    }

    /**
     * Get the USD price of DAI according to OasisDEX given the USD price of ETH.
     */
    function getOasisPrice(
        Monetary.Price memory ethUsd
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0x0938f3fb3b4406d6362053002a8c0df61b377636bd8374548645cde4fe6bd708); /* function */ 

coverage_0x68f19e0e(0x058e2d600343545fac0ea028e41ac971df48ab32a35604d1f05acf7976a0b494); /* line */ 
        coverage_0x68f19e0e(0x7dd41aa772329d2f509a69825668e56ba0c4aac232c84eab0528aff4c9842735); /* statement */ 
IOasisDex oasis = OASIS;

        // If exchange is not operational, return old value.
        // This allows the price to move only towards 1 USD
coverage_0x68f19e0e(0x255758bc49a7781bf60001fc104d497604b986cd2e8549f34c2cbb0e1847bbf7); /* line */ 
        coverage_0x68f19e0e(0x4f17c23e1a560cfbf8256b649386e7c91037e413a261f58865c3ff5b8cbd87c0); /* statement */ 
if (
            oasis.isClosed()
            || !oasis.buyEnabled()
            || !oasis.matchingEnabled()
        ) {coverage_0x68f19e0e(0x2a86a26c0eb8486724885abfbfe24edce0de21fa7153f8bb576e119185b18796); /* branch */ 

coverage_0x68f19e0e(0x8e911cf17a325a57a44ca823c2194baff2396d82a8906481215e7d5ffcdccd8e); /* line */ 
            coverage_0x68f19e0e(0x62a6dc89736895d7e161b6c27cd9197401d8199966448ad808cb3300d96a36e2); /* statement */ 
return Monetary.Price({
                value: g_priceInfo.price
            });
        }else { coverage_0x68f19e0e(0x7148b68a62eff8555390b702abcbc2e8004891015653ab9d59c22b30e9fddfcf); /* branch */ 
}

coverage_0x68f19e0e(0x9dd94c14829fdb0cfb8f9c9dc494ce355b570d5f3fb46d0ae47e8e90ffdc2ec7); /* line */ 
        coverage_0x68f19e0e(0xdcf144cb5cb5403eaf47683fc9157d5412041c7ca5eb9725a8c5ac414f9ac580); /* statement */ 
uint256 numWei = OASIS_ETH_AMOUNT;
coverage_0x68f19e0e(0xc9fc1c6be0cedf915a9a0f9fddf8d51fa3497c8c9b46a18cf5f89da85c57e565); /* line */ 
        coverage_0x68f19e0e(0x741caf3ba349895c0f106b599fcfd2cda6800107248adaf85068c5336a4847d9); /* statement */ 
address dai = address(DAI);
coverage_0x68f19e0e(0xbf41353651caa1e61babf0ae8b5a88bbaa7cc962752f4743433aae3697c143a8); /* line */ 
        coverage_0x68f19e0e(0x4060b857263caa1c5727dd051bd367f6a02f9698eb55221a666827a4654aa081); /* statement */ 
address weth = address(WETH);

        // Assumes at least `numWei` of depth on both sides of the book if the exchange is active.
        // Will revert if not enough depth.
coverage_0x68f19e0e(0x4f4f510b87a5ce38c76558e243d514ae5d8f7178c98cf0f387e626c085d99987); /* line */ 
        coverage_0x68f19e0e(0x5b447cd543ea5772a18e3fe28f0cd169b52d324048b2f30a8c4bba40bb449eaf); /* statement */ 
uint256 daiAmt1 = oasis.getBuyAmount(dai, weth, numWei);
coverage_0x68f19e0e(0x0e85b4efc2363ad77bc52b870edb25ca81a634e075e313b4d4f198945100f0fb); /* line */ 
        coverage_0x68f19e0e(0x657492e1f2c5c252ad1ab4389497117e96892ea72625a46a31cf28b3233c8dcc); /* statement */ 
uint256 daiAmt2 = oasis.getPayAmount(dai, weth, numWei);

coverage_0x68f19e0e(0x076bde6b521d8e2b50aa3e7e90fd015061682416d6686c4daa8bf82cd4f801b5); /* line */ 
        coverage_0x68f19e0e(0x2e505d2bb8b6fc534b2640fdca291e5ae4d1be6cef46304916aeea43e4333f69); /* statement */ 
uint256 num = numWei.mul(daiAmt2).add(numWei.mul(daiAmt1));
coverage_0x68f19e0e(0xc0d814f074dae96b563c40b1d63e5e94c31b1e6628375f5d8584114b96656faf); /* line */ 
        coverage_0x68f19e0e(0xdf769357be8b3622204b169589a8799dba4cd632a7c892b2ffefdf3c0b00749f); /* statement */ 
uint256 den = daiAmt1.mul(daiAmt2).mul(2);
coverage_0x68f19e0e(0x00901149d4f8d143b03e9e3f72a1f10c9ca783ae9cb5fd1150d1035c5e3d0bee); /* line */ 
        coverage_0x68f19e0e(0xf0933d7b6a1fc721e07a4a593b7726c9f5339897bdf28e070d70bf09e7c1cc65); /* statement */ 
uint256 oasisPrice = Math.getPartial(ethUsd.value, num, den);

coverage_0x68f19e0e(0x99303c43073d74a836c96a30f8298439865e29c784f000d2fe008416aa357794); /* line */ 
        coverage_0x68f19e0e(0xa23aee6311b6217f4c8a6db0431392a2a259f8f2c3dd77775c8fd8902aefb06d); /* statement */ 
return Monetary.Price({
            value: oasisPrice
        });
    }

    /**
     * Get the USD price of DAI according to Uniswap given the USD price of ETH.
     */
    function getUniswapPrice(
        Monetary.Price memory ethUsd
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x68f19e0e(0xb0cfe9f27288c567ac3ccdf03e4e6116a8b57cf885dc07999f1e712a98f99672); /* function */ 

coverage_0x68f19e0e(0x4951723a016856f461c045221e06e96a2baf9d072a34581b25b968ad05ca7037); /* line */ 
        coverage_0x68f19e0e(0x3731f39bdb52b261074cd8cb65acbf0a4410b68ac2da7d738cdf454b5262ad88); /* statement */ 
address uniswap = address(UNISWAP);
coverage_0x68f19e0e(0x3a44e85aad24c0d870fbd9cc28e9e02d572fe004a419a10a19df418f6cbcf71b); /* line */ 
        coverage_0x68f19e0e(0x58615becb49d08777b5cb3e96d5b340d46cebc95307446799b14a2018a5e291d); /* statement */ 
uint256 ethAmt = uniswap.balance;
coverage_0x68f19e0e(0x5d4c0f4e852260ce0ea07c7857001b99b2483cab37456fcd3bb7be1fe73a0c0e); /* line */ 
        coverage_0x68f19e0e(0x35485f48f267cf4260b55a659a931c2d13ff0c7948ff9727f0042226a8f76559); /* statement */ 
uint256 daiAmt = DAI.balanceOf(uniswap);
coverage_0x68f19e0e(0x10bde876d5358e0852ca87e8b988db76c38f5b02549e4fc7a414c3c02eea8776); /* line */ 
        coverage_0x68f19e0e(0x496c33dea9dc2eb1b32e344f8e89f1ac7c40fc430e1c161fffee31b3de8d4e06); /* statement */ 
uint256 uniswapPrice = Math.getPartial(ethUsd.value, ethAmt, daiAmt);

coverage_0x68f19e0e(0x33e78dd56fa3f265cc1376cd3f0df2782d5979e880687837f99971b978b127a1); /* line */ 
        coverage_0x68f19e0e(0x37d4967af604ca8eab03bd7714eb5c6056736e2d46131b3798506d11fae21ac7); /* statement */ 
return Monetary.Price({
            value: uniswapPrice
        });
    }

    // ============ Helper Functions ============

    function getPriceBounds(
        uint256 oldPrice,
        uint256 timeDelta
    )
        private
        view
        returns (uint256, uint256)
    {coverage_0x68f19e0e(0x579b983a143018dc03977827d7cfabb4044237846cc59d11a9fe08dcabb96896); /* function */ 

coverage_0x68f19e0e(0xbc33c11ecfc2c8ec3f4c13a449effeb01b37d79d4044a7d414bb88b47116c0a5); /* line */ 
        coverage_0x68f19e0e(0x997af3081991d5d5f6e4d4c9856eb0231e9e72735ed6037303b38e4bd6bb3a93); /* statement */ 
DeviationParams memory deviation = DEVIATION_PARAMS;

coverage_0x68f19e0e(0xaf3b4930b49f43c81de44d436175df1cb6fb360e09e33527c620821d78b63761); /* line */ 
        coverage_0x68f19e0e(0xd8cb72f304da3705115ac683272489eaed181f09de03a7c90fbd7bdc0a32346f); /* statement */ 
uint256 maxDeviation = Math.getPartial(
            oldPrice,
            Math.min(deviation.maximumAbsolute, timeDelta.mul(deviation.maximumPerSecond)),
            deviation.denominator
        );

coverage_0x68f19e0e(0x569637ddf8503e8bebded1f204f8762a4a21bc32644e29c24b50e9fec2a13ea1); /* line */ 
        coverage_0x68f19e0e(0x2be95441b1632dd91791fa110a355579605b71106e192c1d66e4fa66e377ad46); /* statement */ 
return (
            oldPrice.sub(maxDeviation),
            oldPrice.add(maxDeviation)
        );
    }

    function getMidValue(
        uint256 valueA,
        uint256 valueB,
        uint256 valueC
    )
        private
        pure
        returns (uint256)
    {coverage_0x68f19e0e(0x09b2be1c5bfbf6ba4ac5602fc1e94e910d9d90d57e42eee39d002f721a8c254a); /* function */ 

coverage_0x68f19e0e(0x4370f407f3c13d8211e1acb371df15e65ef027f5c381891fda1cda903ce66914); /* line */ 
        coverage_0x68f19e0e(0xd12f74e17d4c96141204488111287024b8f7b72c2cc035cd9c6e831addc56dc2); /* statement */ 
uint256 maximum = Math.max(valueA, Math.max(valueB, valueC));
coverage_0x68f19e0e(0xc512a286910303e9a693a04befdda9ab7ff26c6413bb754c2406f79108bc323d); /* line */ 
        coverage_0x68f19e0e(0x120e2bf735a5a9b839c24b47a0a637c060fc74535fdfbc1871f849cbf8cd9ab5); /* statement */ 
if (maximum == valueA) {coverage_0x68f19e0e(0xcecd0dc9ce6713fe3ebef2d9486a1b1f5528796733efe00b1fe51ebd87280c5a); /* branch */ 

coverage_0x68f19e0e(0xe77ecf530d763e5e7b647cd05cf0f5294d0478fd072e5025052bf9a2d27ff5bf); /* line */ 
            coverage_0x68f19e0e(0x05f03341eda772fb632976d77feb6d07fc977efb53e55e2a9233f5f53e4edbf9); /* statement */ 
return Math.max(valueB, valueC);
        }else { coverage_0x68f19e0e(0xd81d4ef4cb68c386b3664c50f0f30c5aff3836d800712777a92ccb76759c2a1a); /* branch */ 
}
coverage_0x68f19e0e(0xe0cf469812ac2b93241f2719bc96ba81c79a4a41bb482517f4ffcb3226fdf698); /* line */ 
        coverage_0x68f19e0e(0x4f0e0c8839dd6bb98367dc916fe8ed5339f4987ea05c63db34ed9a36c7f2fe32); /* statement */ 
if (maximum == valueB) {coverage_0x68f19e0e(0xf01111f46b8339698dc244ba79fc17cbf6244cf7076cb34ce2aa16a2dc6f6d36); /* branch */ 

coverage_0x68f19e0e(0x5c291688259a21cd1c50dce02f4bae11e5d3da4f10904aba298bdf889491fe89); /* line */ 
            coverage_0x68f19e0e(0x782910cb9c0a4036c53a0b0b57c62b65d4af4eb87d55ed160bd58196454f668d); /* statement */ 
return Math.max(valueA, valueC);
        }else { coverage_0x68f19e0e(0x987a241066308344c3bdb3bc6002c9a25000a6d5f421f1c134bcfc2add64583b); /* branch */ 
}
coverage_0x68f19e0e(0xc8131855858d7da97397d513cc53b806fde5bb2d946be7c0863211cd6190b939); /* line */ 
        coverage_0x68f19e0e(0xe60f73e87e2af43b098359e33800501d0a40fd103ad032cd7cc1b584992d686c); /* statement */ 
return Math.max(valueA, valueB);
    }

    function boundValue(
        uint256 value,
        uint256 minimum,
        uint256 maximum
    )
        private
        pure
        returns (uint256)
    {coverage_0x68f19e0e(0x2d1ef1a0cf426e6bd73e3c614cecb4700a57778d321e54f6014c86e3f1d952ca); /* function */ 

coverage_0x68f19e0e(0xcacb9277f79f8ea07d1b4be310e53abed064c932696c3d06c6a4beb4447f3186); /* line */ 
        coverage_0x68f19e0e(0xe889f1b50db704fa516d7f8eec942d15b749f6bb4b74175a45156457b7faaa5b); /* assertPre */ 
coverage_0x68f19e0e(0x80de41be14108391ec3fe1a27aeb75be4d45179492298e2c724774da82a41d1d); /* statement */ 
assert(minimum <= maximum);coverage_0x68f19e0e(0x77911b3d5d702ef64749674d0326ff8761a545cb6aa97436e32eda0eb81c56e5); /* assertPost */ 

coverage_0x68f19e0e(0x64051a291c71e6e77860892b71c56f2dd47c4c9e080eb075c00b3fc23bbcca3d); /* line */ 
        coverage_0x68f19e0e(0xe7520d34fdb174274f5312b52435a413ed4c1d7c3e7f4097dfebf4ffb6005361); /* statement */ 
return Math.max(minimum, Math.min(maximum, value));
    }
}
