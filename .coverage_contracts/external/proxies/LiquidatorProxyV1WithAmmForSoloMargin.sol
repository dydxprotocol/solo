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

import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import {ReentrancyGuard} from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import {SoloMargin} from "../../protocol/SoloMargin.sol";
import {Account} from "../../protocol/lib/Account.sol";
import {Actions} from "../../protocol/lib/Actions.sol";
import {Decimal} from "../../protocol/lib/Decimal.sol";
import {Interest} from "../../protocol/lib/Interest.sol";
import {Math} from "../../protocol/lib/Math.sol";
import {Monetary} from "../../protocol/lib/Monetary.sol";
import {Require} from "../../protocol/lib/Require.sol";
import {Types} from "../../protocol/lib/Types.sol";
import {OnlySolo} from "../helpers/OnlySolo.sol";
import {DolomiteAmmRouterProxy} from "./DolomiteAmmRouterProxy.sol";


/**
 * @title LiquidatorProxyV1ForSoloMargin
 * @author dYdX
 *
 * Contract for liquidating other accounts in Solo. Does not take marginPremium into account.
 */
contract LiquidatorProxyV1WithAmmForSoloMargin is
OnlySolo,
ReentrancyGuard
{
function coverage_0xfa3b8a1e(bytes32 c__0xfa3b8a1e) public pure {}

    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidatorV1WithAmmForSoloMargin";

    // ============ Structs ============

    struct Constants {
        Account.Info solidAccount;
        Account.Info liquidAccount;
        MarketInfo[] markets;
    }

    struct MarketInfo {
        Monetary.Price price;
        Interest.Index index;
    }

    struct LiquidatorWithAmmCache {
        // mutable
        uint256 toLiquidate;
        // The amount of heldMarket the solidAccount will receive. Includes the liquidation reward.
        uint256 solidHeldUpdateWithReward;
        Types.Wei solidHeldWei;
        Types.Wei liquidHeldWei;
        Types.Wei liquidOwedWei;

        // immutable
        Decimal.D256 spread;
        uint256 heldMarket;
        uint256 owedMarket;
        uint256 heldPrice;
        uint256 owedPrice;
        uint256 owedPriceAdj;
    }

    // ============ Storage ============

    DolomiteAmmRouterProxy ROUTER_PROXY;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address dolomiteAmmRouterProxy
    )
    public
    OnlySolo(soloMargin)
    {coverage_0xfa3b8a1e(0xcce17cf1a0862d8f3393bde000eb15536d434dd058dc89d94c3521fbd4a91eb8); /* function */ 

coverage_0xfa3b8a1e(0xb80a60ae19e8f3340d617a0d2fe11c25967696f2b80af475478bb380e9ac64d5); /* line */ 
        coverage_0xfa3b8a1e(0x74f5ce0150e1a5fd9d32263f9d436b12673b368b4c1cf0c5709c1afc3725e080); /* statement */ 
ROUTER_PROXY = DolomiteAmmRouterProxy(dolomiteAmmRouterProxy);
    }

    // ============ Public Functions ============

    /**
     * Liquidate liquidAccount using solidAccount. This contract and the msg.sender to this contract
     * must both be operators for the solidAccount.
     *
     * @param  solidAccount                 The account that will do the liquidating
     * @param  liquidAccount                The account that will be liquidated
     * @param  owedMarket                   The owed market whose borrowed value will be added to `toLiquidate`
     * @param  heldMarket                   The held market whose collateral will be recovered to take on the debt of
     *                                      `owedMarket`
     * @param  tokenPath                    The path through which the trade will be routed to recover the collateral
     * @param  revertOnFailToSellCollateral True to revert the transaction completely if all collateral from the
     *                                      liquidation cannot repay the owed debt. False to swallow the error and sell
     *                                      whatever is possible.
     */
    function liquidate(
        Account.Info memory solidAccount,
        Account.Info memory liquidAccount,
        uint256 owedMarket,
        uint256 heldMarket,
        address[] memory tokenPath,
        bool revertOnFailToSellCollateral
    )
    public
    nonReentrant
    {coverage_0xfa3b8a1e(0x91d3d80d4a19e8532da7c45bf062940a693c81ca32ac639b6e790a099bb8af00); /* function */ 

coverage_0xfa3b8a1e(0xe7e2bb9ec9646cb10319ac9ad1f2b5c55af2b899fd5011abb4d8087cb899de94); /* line */ 
        coverage_0xfa3b8a1e(0x529f6d86bb21753a8b79238890f716f14d81963698566bed1eaf7b18934cf656); /* statement */ 
Require.that(
            owedMarket != heldMarket,
            FILE,
            "owedMarket equals heldMarket",
            owedMarket,
            heldMarket
        );

coverage_0xfa3b8a1e(0x9d6fd9fa2a9bb29e9849260d100f80d239a8e2d8f9294c7be7f2572dec7461e8); /* line */ 
        coverage_0xfa3b8a1e(0x0eddead3a37735a28a671c3d52e361138d660ae6a669764866fc43a9ef4ad4a3); /* statement */ 
Require.that(
            !SOLO_MARGIN.getAccountPar(liquidAccount, owedMarket).isPositive(),
            FILE,
            "owed market cannot be positive",
            owedMarket
        );

coverage_0xfa3b8a1e(0x82de6246acc5001fa9aa9a2b7cdc7b51fc0b85fd42597e03aee3c6bf0276b13a); /* line */ 
        coverage_0xfa3b8a1e(0x3a046d24f21768b9d96747321074bf939e2f91cb87b823e40119c4e6ccf4108e); /* statement */ 
Require.that(
            SOLO_MARGIN.getAccountPar(liquidAccount, heldMarket).isPositive(),
            FILE,
            "held market cannot be negative",
            heldMarket
        );

coverage_0xfa3b8a1e(0x8e37d29af2dd1fbed233edbe8fbd25635ea75af9dd152c6609461e9cb2a93062); /* line */ 
        coverage_0xfa3b8a1e(0x472db559d410d276261a025c7814fe2e55545ea0d3da7dd076de47c857a8ee5c); /* statement */ 
Require.that(
            SOLO_MARGIN.getMarketIdByTokenAddress(tokenPath[0]) == heldMarket,
            FILE,
            "0-index token path incorrect",
            tokenPath[0]
        );

coverage_0xfa3b8a1e(0xd350e717248566e2c26cd3a02f6b2feae07e0d779faf0ebb00ddf77642db2213); /* line */ 
        coverage_0xfa3b8a1e(0x1abedf68fba0908b594d39017b838c37354fa35c4956c4d89800de42349b86ee); /* statement */ 
Require.that(
            SOLO_MARGIN.getMarketIdByTokenAddress(tokenPath[tokenPath.length - 1]) == owedMarket,
            FILE,
            "last-index token path incorrect",
            tokenPath[tokenPath.length - 1]
        );

        // put all values that will not change into a single struct
coverage_0xfa3b8a1e(0xc3688c2de6232cc5fa1f3c7e40124511b971cc98a830be347eabd06f50cb3ff9); /* line */ 
        coverage_0xfa3b8a1e(0x5bde83a63d3b4e3fc5186a65482189e4ab0f6a3a0eb66e452ca1b723eaca2c6d); /* statement */ 
Constants memory constants = Constants({
        solidAccount : solidAccount,
        liquidAccount : liquidAccount,
        markets : getMarketsInfo()
        });

coverage_0xfa3b8a1e(0xf71169d54b457420a62c8697bb6ca01d802e4573a637a594ae29e7e41b67b1de); /* line */ 
        coverage_0xfa3b8a1e(0x96b5d784b8cff69ff37f64f9f3789c9622f1d77ba9d9764f75764cf6d14dd32f); /* statement */ 
LiquidatorWithAmmCache memory cache = initializeCache(
            constants,
            heldMarket,
            owedMarket
        );

        // validate the msg.sender and that the liquidAccount can be liquidated
coverage_0xfa3b8a1e(0x313d8e9cd3428cc21c5fbf7e0e977cda4693b44e40a67e7994af43d5704da156); /* line */ 
        coverage_0xfa3b8a1e(0x2dce38a84aac9813761502a30542bfbdf35fc4e4fd10e6fc04dc7ebe23a04514); /* statement */ 
checkRequirements(constants, cache);

        // get the max liquidation amount
coverage_0xfa3b8a1e(0x81d63ac86a3822514c293e89f835cef4c1b64bf4574fd3ce374c480271ed3eb7); /* line */ 
        coverage_0xfa3b8a1e(0x479e3e683ede1729fe8f4c9379874e12236262080c33e085b60ebd72a0796a2d); /* statement */ 
calculateMaxLiquidationAmount(cache);

        // if nothing to liquidate, do nothing
coverage_0xfa3b8a1e(0x55219bd3051077b912407fa01458c3b8004f2cea9d52c2951c98b6f719cee166); /* line */ 
        coverage_0xfa3b8a1e(0xea0d2dfc4baad08ab31a7393de868cec2bc6912118c759268d1ecf4a8811e56c); /* statement */ 
Require.that(
            cache.toLiquidate != 0,
            FILE,
            "nothing to liquidate"
        );

coverage_0xfa3b8a1e(0xb7e89a31c0cf1e02b8c97a57e2ca35a1580b7616f49423f47a40bb52a76bbfce); /* line */ 
        coverage_0xfa3b8a1e(0x12d77b99f6e355a28b35506e38ee75e7569e92421debeadcd0f1feb0484e31fe); /* statement */ 
uint totalSolidHeldWei = cache.solidHeldUpdateWithReward;
coverage_0xfa3b8a1e(0xc651016689a97af2ca767f2cde6c3721038e35c9800b711322bb46fc4fcdc0cd); /* line */ 
        coverage_0xfa3b8a1e(0x9dd3d308161c78d05fbddfb30ff9797e6e5c13340c3443e43025aa0d1cd73a2f); /* statement */ 
if (cache.solidHeldWei.sign) {coverage_0xfa3b8a1e(0xb281f755747ac7a7ecff05d615f835c49d60bc489db3d315d5bd90b0c59030f5); /* branch */ 

coverage_0xfa3b8a1e(0xc61271fc7ecbb95b71cb87aa1ef4a7280175bf6036ab5dfc43033c5ed06f7999); /* line */ 
            coverage_0xfa3b8a1e(0x7a98822578d6f9e93662b84e4175690cc79390c0fef5f33b043165f3db08cc51); /* statement */ 
totalSolidHeldWei = totalSolidHeldWei.add(cache.solidHeldWei.value);
        }else { coverage_0xfa3b8a1e(0x69c658fc5791eca168581865742b5245d71c3d4d5736398e8b29ff6b290b7436); /* branch */ 
}

coverage_0xfa3b8a1e(0x5bdce1e767bc2081cc2acabc5067eb0d7ee4dceb459624fb9cfd7c70e24af74d); /* line */ 
        coverage_0xfa3b8a1e(0x54e156885ffc9faced9db4a2d789fc11630c445b320988f9da757d1c1363b667); /* statement */ 
(Account.Info[] memory accounts, Actions.ActionArgs[] memory actions) =
        ROUTER_PROXY.getParamsForSwapTokensForExactTokens(
            constants.solidAccount.owner,
            constants.solidAccount.number,
            uint(- 1), // maxInputWei
            cache.toLiquidate, // the amount of owedMarket that needs to be repaid. Exact output amount
            tokenPath
        );
coverage_0xfa3b8a1e(0x3a7f154c8e7de20631dc7116206184b84ade6415b62450b750e922c5a937ec25); /* line */ 
        coverage_0xfa3b8a1e(0xa9fd194712d85aff515628fd5ce15942f1066507d3e66537038233e8d9d70a8e); /* statement */ 
if (revertOnFailToSellCollateral) {coverage_0xfa3b8a1e(0x380ee932dcb86b277812638242b300bcc20cfbf68cef7916778c498095abfa68); /* branch */ 

coverage_0xfa3b8a1e(0x99b4f4625b3c849e180cac2832e56997d93522d6504dcdcdc4a7b3135b7cd832); /* line */ 
            coverage_0xfa3b8a1e(0x5b571bd2f4945d7b36c4cfbc7223fadd73b2aace3d6a1daae7a6b75c4d946ab2); /* statement */ 
Require.that(
                totalSolidHeldWei >= actions[0].amount.value,
                FILE,
                "totalSolidHeldWei is too small",
                totalSolidHeldWei,
                actions[0].amount.value
            );
        } else {coverage_0xfa3b8a1e(0x6388638b7fac564ff3041240cb68d868a5313d23cb8a776805a94f4a93119199); /* statement */ 
coverage_0xfa3b8a1e(0x1ffd1d0747d661819bcc402dc7bf967270cf08da8d6d5f8db371cd8619ac3bbf); /* branch */ 
if (totalSolidHeldWei < actions[0].amount.value) {coverage_0xfa3b8a1e(0x08b765a6587d1bce9f2c3a3e0fda28b97e8b4ff3af68c899c6f68b657a7b4aa3); /* branch */ 

coverage_0xfa3b8a1e(0x7282dd8f89db91c496453a1ba4d987867e3c348dd9b852c7a6934964a2ee3581); /* line */ 
            coverage_0xfa3b8a1e(0x8b252fcac42689aca0561d2816858683342b512afed36eae0b9a30a5707e376b); /* statement */ 
(accounts, actions) = ROUTER_PROXY.getParamsForSwapExactTokensForTokens(
                constants.solidAccount.owner,
                constants.solidAccount.number,
                totalSolidHeldWei, // inputWei
                1, // minOutputAmount; we will sell whatever collateral we can
                tokenPath
            );
        }else { coverage_0xfa3b8a1e(0xa0a63d31e17824fb3b864d23eabd40c58856b4d016f321303c0e372fb3bb7f96); /* branch */ 
}}

coverage_0xfa3b8a1e(0xfe81ecd9a34fd1b5ba41e279f715c6a0b09efea36995d50b42574ff0f17313e0); /* line */ 
        coverage_0xfa3b8a1e(0xdadd84433880a84f4e97d771779182b059422475de6ab10975a3e17838428c54); /* statement */ 
accounts = constructAccountsArray(constants, accounts);

        // execute the liquidations
coverage_0xfa3b8a1e(0x085e5a970550f417dcf334f1023f3cc881c8d064795548a488ccf1a0b9e68100); /* line */ 
        coverage_0xfa3b8a1e(0xedfbcbf9ae0ba1b6f1c43e5dacacc9d9ef78c42bd88f61bca5c4e19cb471f764); /* statement */ 
SOLO_MARGIN.operate(
            accounts,
            constructActionsArray(cache, accounts, actions)
        );
    }

    // ============ Calculation Functions ============

    /**
     * Calculate the additional owedAmount that can be liquidated until the collateralization of the
     * liquidator account reaches the minLiquidatorRatio. By this point, the cache will be set such
     * that the amount of owedMarket is non-positive and the amount of heldMarket is non-negative.
     */
    function calculateMaxLiquidationAmount(
        LiquidatorWithAmmCache memory cache
    )
    private
    pure
    {coverage_0xfa3b8a1e(0x79794548d4afe54885f7fac6f3b66d84162fc1d843c68be232630081c2ed9868); /* function */ 

coverage_0xfa3b8a1e(0xa771c768bf282e360c5c15ff9325b2382a3f02b3e7365faa45d3f1ac76cbd772); /* line */ 
        coverage_0xfa3b8a1e(0xbbc5a3624c7f0f5a05909129a890921ed692c34d8ddea528fe6520d718f4ec55); /* statement */ 
uint liquidHeldValue = cache.heldPrice.mul(cache.liquidHeldWei.value);
coverage_0xfa3b8a1e(0xca2f1f5668769bf58a689abde81426ded6788c81bf476bd581d855914c9c94cb); /* line */ 
        coverage_0xfa3b8a1e(0x6b758e8abf2dc3c5f43f8374c8bd29b08b4419a05fe6750e8841cc174524af6e); /* statement */ 
uint liquidOwedValue = cache.owedPriceAdj.mul(cache.liquidOwedWei.value);
coverage_0xfa3b8a1e(0x91f0857e853dfb726ae5b53e9722f470a14c6a88fc2d15826781cf3e0b93184a); /* line */ 
        coverage_0xfa3b8a1e(0x43b1b1f19bcbb611a2dcea6aac8e5f9880eb1fdf7aa76f712c2caa8fdb6658c6); /* statement */ 
if (liquidHeldValue <= liquidOwedValue) {coverage_0xfa3b8a1e(0xa88bfacf5035ac88f09c2d98a311c842c930e11a777da58f09457207a323a186); /* branch */ 

            // The user is under-collateralized; there is no reward left to give
coverage_0xfa3b8a1e(0x5cc3122139cafcad9393441f2ff962bbf9da5fb85b04358a91c55338e49d556e); /* line */ 
            coverage_0xfa3b8a1e(0x05b6206515b179bbd977afe33f23435035d1fb99edd362c63af91d44b8403f7d); /* statement */ 
cache.solidHeldUpdateWithReward = cache.liquidHeldWei.value;
coverage_0xfa3b8a1e(0xd95626533781dfa1618a66d60fc56fd9a9338ce75325909311a3716406ca0496); /* line */ 
            coverage_0xfa3b8a1e(0xfd10d2ea22bf57be138bb7b55eecbcf801efe8d575a2fb44d56fa9c126b2b400); /* statement */ 
cache.toLiquidate = Math.getPartialRoundUp(cache.liquidHeldWei.value, cache.heldPrice, cache.owedPriceAdj);
        } else {coverage_0xfa3b8a1e(0xef48c34958b152817a1ed6e5e66c197b9e6192c094a220440e46034e7917bb05); /* branch */ 

coverage_0xfa3b8a1e(0x8c5195e0a0b71e7fd207e2b0ad1d49610176b29da267b79323185bda0601c2db); /* line */ 
            coverage_0xfa3b8a1e(0x6c2b16927c6090c5a104a6fb6139de8312caf14a816a3ccfc1b1eb8bd18d814a); /* statement */ 
cache.solidHeldUpdateWithReward = Math.getPartial(cache.liquidOwedWei.value, cache.owedPriceAdj, cache.heldPrice);
coverage_0xfa3b8a1e(0x20fbd12e888ca968e77d5f17f3db63e7036b345f3358b90cb9cd707303bdf846); /* line */ 
            coverage_0xfa3b8a1e(0x457b547c236f9c7c38f1b534786acfa2de3303c9316448dbc86294550b782df4); /* statement */ 
cache.toLiquidate = cache.liquidOwedWei.value;
        }
    }

    // ============ Helper Functions ============

    /**
     * Make some basic checks before attempting to liquidate an account.
     *  - Require that the msg.sender is permissioned to use the liquidator account
     *  - Require that the liquid account is liquidatable
     */
    function checkRequirements(
        Constants memory constants,
        LiquidatorWithAmmCache memory cache
    )
    private
    view
    {coverage_0xfa3b8a1e(0xac7f16b6d5240d633d9445edf60cc188658cf0b23033353c3cd0bcb561cafc4f); /* function */ 

        // check credentials for msg.sender
coverage_0xfa3b8a1e(0x77a3d94d83caf31b2def151220d5996678eb9b51abc58bd1b063e231ce15d725); /* line */ 
        coverage_0xfa3b8a1e(0x4edca4642028c3b8f95b0ee32267ca9fec4031b6c0739a162dedd0b286b3af09); /* statement */ 
Require.that(
            constants.solidAccount.owner == msg.sender
            || SOLO_MARGIN.getIsLocalOperator(constants.solidAccount.owner, msg.sender),
            FILE,
            "Sender not operator",
            constants.solidAccount.owner
        );

        // require that the liquidAccount is liquidatable
coverage_0xfa3b8a1e(0x1301d519a3a37935671d3a988b6cb3cc62a88643a204b24409955a0ba5017bed); /* line */ 
        coverage_0xfa3b8a1e(0xf42bdd0aa721d52e08c85c1a4f04b7babfd7a67ad8ea4d2beef53bda7ede6ef2); /* statement */ 
(
        Monetary.Value memory liquidSupplyValue,
        Monetary.Value memory liquidBorrowValue
        ) = getCurrentAccountValues(constants, constants.liquidAccount);
coverage_0xfa3b8a1e(0xb7d410d412387db0c1bbbc414452d747e2b719efb6b7d760220d01cf78f11aba); /* line */ 
        coverage_0xfa3b8a1e(0x82b198702e353433e3bb94ff9d439c05e2f54d32a143755db6e725b10a849b7b); /* statement */ 
Require.that(
            liquidSupplyValue.value != 0,
            FILE,
            "Liquid account no supply"
        );
coverage_0xfa3b8a1e(0xa55a4559fbc463fbadf1eb19e7d31daecfeb0a6df2da0528073e39eed142298b); /* line */ 
        coverage_0xfa3b8a1e(0x7276ba3d299fd25f563807690a919ec903537b06a9ffda6758aaf41ab623b095); /* statement */ 
Require.that(
            SOLO_MARGIN.getAccountStatus(constants.liquidAccount) == Account.Status.Liquid ||
            !isCollateralized(liquidSupplyValue.value, liquidBorrowValue.value, SOLO_MARGIN.getMarginRatio()),
            FILE,
            "Liquid account not liquidatable"
        );
    }

    /**
     * Returns true if the supplyValue over-collateralizes the borrowValue by the ratio.
     */
    function isCollateralized(
        uint256 supplyValue,
        uint256 borrowValue,
        Decimal.D256 memory ratio
    )
    private
    pure
    returns (bool)
    {coverage_0xfa3b8a1e(0xd6e02a388e4bab348e9715a9a21c56a4bc4936ddc6759f50dd7afb63973fe3db); /* function */ 

coverage_0xfa3b8a1e(0xfd3ac6d0384a0fd11104ff903895bb74ccd47c6826949c525397d18bf712367f); /* line */ 
        coverage_0xfa3b8a1e(0x1a5ade1f5d2b125ace93911552987b2a0d9ad1026f368e7cb816abbc6f1b93ba); /* statement */ 
uint256 requiredMargin = Decimal.mul(borrowValue, ratio);
coverage_0xfa3b8a1e(0xf75876de37a2f2220d8e5a35cac67ca7eff3d83b7fdb1db11a14ba550d17acbd); /* line */ 
        coverage_0xfa3b8a1e(0xb6610996fdd630e461eb0ced664e7e34620af472ef05d694f10823a4afde992f); /* statement */ 
return supplyValue >= borrowValue.add(requiredMargin);
    }

    // ============ Getter Functions ============

    /**
     * Gets the current total supplyValue and borrowValue for some account. Takes into account what
     * the current index will be once updated.
     */
    function getCurrentAccountValues(
        Constants memory constants,
        Account.Info memory account
    )
    private
    view
    returns (
        Monetary.Value memory,
        Monetary.Value memory
    )
    {coverage_0xfa3b8a1e(0xf15ae78f51eeedde2142ff625e099db2fb4a6430d9746de57a53ece0e19bfa49); /* function */ 

coverage_0xfa3b8a1e(0xa4580449ed4b19d5c90d92ee0ea384e0472f680424e0304e47827c848481be12); /* line */ 
        coverage_0xfa3b8a1e(0xec1baf29f1b6deb9257c33d5f620e2ec44d6b7125fff6ebf03b0032a18680d1a); /* statement */ 
Monetary.Value memory supplyValue;
coverage_0xfa3b8a1e(0x5b22a3d6a143895ecc46e0ca5ece3e75264117ed646a992be454a8d3c68c31f8); /* line */ 
        coverage_0xfa3b8a1e(0x8f2c4f8cdfade14211f2a8957d42bc9f7a57ec978e7e78beda43d2cc42fb66b4); /* statement */ 
Monetary.Value memory borrowValue;

coverage_0xfa3b8a1e(0x086a7f205f8095869abd89b6b2a4f4218539d8e54357195753b83a330474f875); /* line */ 
        coverage_0xfa3b8a1e(0x35c24813502b1fe8da93bf65c9f6538f1755088d7232a34687276a721e222e40); /* statement */ 
for (uint256 m = 0; m < constants.markets.length; m++) {
coverage_0xfa3b8a1e(0xfd977f57f69922ab551093cbe755c6455108f20cdd59f9f849bc26ec4a2a63ed); /* line */ 
            coverage_0xfa3b8a1e(0xdbe0131deca3fa355f9d949d7dcf860bf1606c8bb2d29366303dc9c44c82f5bd); /* statement */ 
Types.Par memory par = SOLO_MARGIN.getAccountPar(account, m);
coverage_0xfa3b8a1e(0xf4f9e8b4cf84f32058cae29592dca62f73164895a175ce2af15380d54b2af377); /* line */ 
            coverage_0xfa3b8a1e(0x4c8cbaf32327f771862eb9794eda00995c59cd207418294445e7a7d7d5d5e0e1); /* statement */ 
if (par.isZero()) {coverage_0xfa3b8a1e(0xc0ba7b730901d03767c1801dab6fb0a41d2bec193243bef6c570846536475e8a); /* branch */ 

coverage_0xfa3b8a1e(0x8185d4b3ae7e52409be6ff0a9bd40c7422d1fd1420b279a25c958c896a85539a); /* line */ 
                continue;
            }else { coverage_0xfa3b8a1e(0xf2c82a9132611d9dbb5b71fa093e0bd206225b44e0d5a8052e9a1207b69bdacb); /* branch */ 
}
coverage_0xfa3b8a1e(0x9dab945ac3123d9f423b497e1d154fc5ac4c1e6e0238e0421ad6b1b513a43a92); /* line */ 
            coverage_0xfa3b8a1e(0x7657cd8cf2fc78d9104dda657bd98d3c8ded84911d2fe0f69809099b9bd0a591); /* statement */ 
Types.Wei memory userWei = Interest.parToWei(par, constants.markets[m].index);
coverage_0xfa3b8a1e(0x9b761876e2990245ff8c46fc8b9d501da84790b764ff162c928858383c671135); /* line */ 
            coverage_0xfa3b8a1e(0x491db24545dbd3b1cc1227fa6f888ff2522eab71062c7e0ec154ffb072df66cf); /* statement */ 
uint256 assetValue = userWei.value.mul(constants.markets[m].price.value);
coverage_0xfa3b8a1e(0xdca943d00d503690be92dd947666b8c60be6755d631dfa6ee2d740befaf5423a); /* line */ 
            coverage_0xfa3b8a1e(0x84e3f8cc9b6c8a07432efcfacc9905b805644a19378054b2976bb59dcd2cf1d1); /* statement */ 
if (userWei.sign) {coverage_0xfa3b8a1e(0x88f039cc8d62dd03ebd8f7c24310552e329bd339614bff9342d3d750ccd803be); /* branch */ 

coverage_0xfa3b8a1e(0xfe1e6bed4a9fdaf987074f88b50a94259464db290f61ea6b162aa8f9f995e594); /* line */ 
                coverage_0xfa3b8a1e(0xc21a9c1f1ec035d2c97890bd8171a7e324454545305545cc0b6967d4fb0f76ec); /* statement */ 
supplyValue.value = supplyValue.value.add(assetValue);
            } else {coverage_0xfa3b8a1e(0xdc6e4f22312745bc094c7fd8ccbb118be48e6c20d2353f296a9b6aa30e412af1); /* branch */ 

coverage_0xfa3b8a1e(0x17e4d6b147731c6046bda274e2cf88eefa0eddb92691299b37e66d2715a5a537); /* line */ 
                coverage_0xfa3b8a1e(0xa821d1c80bbcc6d7521bd63de93fffbb2ec0e86037144e7d0c0ded528e3cd856); /* statement */ 
borrowValue.value = borrowValue.value.add(assetValue);
            }
        }

coverage_0xfa3b8a1e(0xdbec1823d8f83d98baf655c63bbff9fe7e868e4622178dd2b309bc802fb42306); /* line */ 
        coverage_0xfa3b8a1e(0xb38bcdbb1c58290b32b6b31c4f09dff247e702fdf7d4080cec6e17edf3bf4b29); /* statement */ 
return (supplyValue, borrowValue);
    }

    /**
     * Get the updated index and price for every market.
     */
    function getMarketsInfo()
    private
    view
    returns (MarketInfo[] memory)
    {coverage_0xfa3b8a1e(0xc572c6a7a6f10e3ec54fd9e7f5b26347331356922ca3c74b7f3dd4c12cf5d0c2); /* function */ 

coverage_0xfa3b8a1e(0x00f58a73bc581c6dfae8c0b81aebb960085501ef0d613fd458d316af3829e4ba); /* line */ 
        coverage_0xfa3b8a1e(0xbd5fcba4fa7bc2a1fae1f5f528c55591556d435d24facbff4bef54f2143a340a); /* statement */ 
uint256 numMarkets = SOLO_MARGIN.getNumMarkets();
coverage_0xfa3b8a1e(0xb5bb60661c50b822bc105dbcee268bee0ee2791ba4cd9ee241977282c97205fb); /* line */ 
        coverage_0xfa3b8a1e(0x5b872e3e2cc55673b84e2cce8a64a5abfd5be3962b9f8d3263440d868e6fb43a); /* statement */ 
MarketInfo[] memory markets = new MarketInfo[](numMarkets);
coverage_0xfa3b8a1e(0x86b85c0a5a622bcb556c08ec123323ae6fcc8dd216df2c2447e98f80489d523e); /* line */ 
        coverage_0xfa3b8a1e(0x332c7d4890869d1a87f9eebd78addbb68750e1ca63a6db7b3b972d3d90f71bd5); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0xfa3b8a1e(0xb3f07720100010939f69bc17e1cb7b7aaec86cf502517805b06c53fe2ff2427d); /* line */ 
            coverage_0xfa3b8a1e(0x8d9b1e7a0a6ef89a35682bb5c3aadf6baee6b9d1ec3c407621b9f246a8153910); /* statement */ 
markets[m] = MarketInfo({
            price : SOLO_MARGIN.getMarketPrice(m),
            index : SOLO_MARGIN.getMarketCurrentIndex(m)
            });
        }
coverage_0xfa3b8a1e(0xe185fc4016b5e94598ecd78ea350c385b44dbf0e4bf7766fa473d43cd6c5dd40); /* line */ 
        coverage_0xfa3b8a1e(0xb9d3b65ffe21585d3f261386bfd77ba69b12a310feb3515ae93463f065964b76); /* statement */ 
return markets;
    }

    /**
     * Pre-populates cache values for some pair of markets.
     */
    function initializeCache(
        Constants memory constants,
        uint256 heldMarket,
        uint256 owedMarket
    )
    private
    view
    returns (LiquidatorWithAmmCache memory)
    {coverage_0xfa3b8a1e(0x16506404962f2719dd03d3822538b2abbc3eff99c397adeafe01590ad92aa2fa); /* function */ 

coverage_0xfa3b8a1e(0xb64209aeb4b54fc9b610953dc01c276b7505fdc3a210014267afbee46eda3c87); /* line */ 
        coverage_0xfa3b8a1e(0x76d97a02b08f2c89a8c8fef1ab0df244665d7e6f0cb7f09563a4ebcce1162063); /* statement */ 
uint256 heldPrice = constants.markets[heldMarket].price.value;
coverage_0xfa3b8a1e(0xa7d0f36cddbd182fb7019523452490b5e3bd2b991147405ac65c3d09da273e67); /* line */ 
        coverage_0xfa3b8a1e(0x6f2badbb9d141f4c894efdbca097c9c1a6d43572ab2ea12d828d1b4d97d29385); /* statement */ 
uint256 owedPrice = constants.markets[owedMarket].price.value;
coverage_0xfa3b8a1e(0x7dfa232625cc74b5ad4f072711b91a207c0c8b7d39ff6ce79dfcff508af44e78); /* line */ 
        coverage_0xfa3b8a1e(0xbec3e0c6bf76bb70436f1e176641c33df3296a2ed2681f31fb480dcd14599d71); /* statement */ 
Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(heldMarket, owedMarket);

coverage_0xfa3b8a1e(0xefcc3bf35be35be9298b34f7456bf3255b014c4c1423809e78c69bb777530cdf); /* line */ 
        coverage_0xfa3b8a1e(0xe60bbf7206c8d9c0d5a30c08a1a5fb428a34a20af84ccd2a08c5c212b4ab574f); /* statement */ 
return LiquidatorWithAmmCache({
        toLiquidate : 0,
        solidHeldUpdateWithReward : 0,
        solidHeldWei : Interest.parToWei(
                SOLO_MARGIN.getAccountPar(constants.solidAccount, heldMarket),
                constants.markets[heldMarket].index
            ),
        liquidHeldWei : Interest.parToWei(
                SOLO_MARGIN.getAccountPar(constants.liquidAccount, heldMarket),
                constants.markets[heldMarket].index
            ),
        liquidOwedWei : Interest.parToWei(
                SOLO_MARGIN.getAccountPar(constants.liquidAccount, owedMarket),
                constants.markets[owedMarket].index
            ),
        spread : spread,
        heldMarket : heldMarket,
        owedMarket : owedMarket,
        heldPrice : heldPrice,
        owedPrice : owedPrice,
        owedPriceAdj : Decimal.mul(owedPrice, Decimal.onePlus(spread))
        });
    }

    // ============ Operation-Construction Functions ============

    function constructAccountsArray(
        Constants memory constants,
        Account.Info[] memory accountsForTrade
    )
    private
    pure
    returns (Account.Info[] memory)
    {coverage_0xfa3b8a1e(0xb28c85e874d06fce66e6d46123cca0ef822e94cdba7391a629be6879627b2a20); /* function */ 

coverage_0xfa3b8a1e(0x0ddd2db34fc365e99ec2bd2f2bf739fbcf0ae3d10e0c456f23c7c5dacafe35d5); /* line */ 
        coverage_0xfa3b8a1e(0xe2c5a99ba38bda5a55cb664262b1b06a1d366d6668da21a066261228c2ea111a); /* statement */ 
Account.Info[] memory accounts = new Account.Info[](accountsForTrade.length + 1);
coverage_0xfa3b8a1e(0x71759a18310c418167a05442ad39505510fb5a6266d4cde98325b65272301456); /* line */ 
        coverage_0xfa3b8a1e(0xaad32a9410aa2c8d5b2ad5c4d118d0bbf597f3dca7042df3e8c8680b7d0eb210); /* statement */ 
for (uint i = 0; i < accountsForTrade.length; i++) {
coverage_0xfa3b8a1e(0x7fe5d12e5eea4231433b1580507a1da6a6d91fc4bf5a370d52a8d98ac613560f); /* line */ 
            coverage_0xfa3b8a1e(0x820bf7f35a84b5ad62a7aafcac2047248fc479e2e5baa12a6c2eaaf0574f339d); /* statement */ 
accounts[i] = accountsForTrade[i];
        }
coverage_0xfa3b8a1e(0x394c9d2bf24b9e4e7a562866d8ae2fc0c0b9abbba70b07d918f7290065918708); /* line */ 
        coverage_0xfa3b8a1e(0x425f953202503a00642f06cc4804a983b6a2acdab631d04de416219091d85f05); /* assertPre */ 
coverage_0xfa3b8a1e(0x809617ffcb8078923b15eb00b414cee7a038ee55530ebe47ba0967ae7ac7ec65); /* statement */ 
assert(
            accounts[0].owner == constants.solidAccount.owner &&
            accounts[0].number == constants.solidAccount.number
        );coverage_0xfa3b8a1e(0x9056f88adac56fe4c274151e4de0e9e9b5406f4409a552c9c76d2ff317206374); /* assertPost */ 


coverage_0xfa3b8a1e(0x797173bc1343aa10b45ea83bafb78a2a83b74dcb7c0c7825e8314183ec2c66e1); /* line */ 
        coverage_0xfa3b8a1e(0x00d6a59804241141499268d507b9d549327e500e647b21004a7d25b212755c20); /* statement */ 
accounts[accounts.length - 1] = constants.liquidAccount;
coverage_0xfa3b8a1e(0x8756f4c1252b326b2d2e856717e9e644d9f4ea701781803dd86e21221c169f66); /* line */ 
        coverage_0xfa3b8a1e(0x9450219c8e7baa3b727d9085a854f715d50ed68bff1a382b8d18c1feb3868a49); /* statement */ 
return accounts;
    }

    function constructActionsArray(
        LiquidatorWithAmmCache memory cache,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actionsForTrade
    )
    private
    pure
    returns (Actions.ActionArgs[] memory)
    {coverage_0xfa3b8a1e(0xe59cec0903b386d5adfc8fb6e8a4d9a100c330b6527b0900c6ae64992bcf8bb2); /* function */ 

coverage_0xfa3b8a1e(0x0c410c0daa620b97d2176a2c8f5a92d47015d12cc4a53b389cd02985136504b4); /* line */ 
        coverage_0xfa3b8a1e(0x5f77f5445ab51e5adf7bd80e3168a20b26e646d14625ad4fc8449caa18913563); /* statement */ 
Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](actionsForTrade.length + 1);

coverage_0xfa3b8a1e(0xb21b6353143e91f8c7e4bd5a16a0a898932a660dfee70e9449d3f426808956fc); /* line */ 
        coverage_0xfa3b8a1e(0x66620cbecac549d816bfedeb114e47019fea68ca062a7a9da261b1e7c4c0cc1b); /* statement */ 
actions[0] = Actions.ActionArgs({
        actionType : Actions.ActionType.Liquidate,
        accountId : 0, // solidAccount
        amount : Types.AssetAmount({
        sign : true,
        denomination : Types.AssetDenomination.Wei,
        ref : Types.AssetReference.Delta,
        value : cache.toLiquidate
        }),
        primaryMarketId : cache.owedMarket,
        secondaryMarketId : cache.heldMarket,
        otherAddress : address(0),
        otherAccountId : accounts.length - 1, // liquidAccount
        data : new bytes(0)
        });

coverage_0xfa3b8a1e(0xe1745e1ed1802c07ec9f4cd618f8667e95358b9b8834ccef1f6eee920ee3a9e8); /* line */ 
        coverage_0xfa3b8a1e(0x3b87d2b3b36fec9f11b86440ce224cf117ef31055f27eac6f7e720d868c7d2b8); /* statement */ 
for (uint i = 0; i < actionsForTrade.length; i++) {
coverage_0xfa3b8a1e(0xd4bc124185678e1a20e7e3426651c0a2dfc7a88ed3de6089aed80987315ab394); /* line */ 
            coverage_0xfa3b8a1e(0x2c403d86c89c1e473214684e962532c5e26c496b51a201ab9161da2aaecbf06d); /* statement */ 
actions[i + 1] = actionsForTrade[i];
        }

coverage_0xfa3b8a1e(0x32c0c1f4fe0f73cdf228ad5774ab7da4ab3b8723717ba1feffd76b6a5406e2aa); /* line */ 
        coverage_0xfa3b8a1e(0x1eb09b6afffb686d1ac8ec653d53bf99c9e029221373c023bb75c925b988c0f0); /* statement */ 
return actions;
    }
}
