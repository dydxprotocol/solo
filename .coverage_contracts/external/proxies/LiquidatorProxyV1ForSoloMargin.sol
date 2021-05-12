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
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { SoloMargin } from "../../protocol/SoloMargin.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Interest } from "../../protocol/lib/Interest.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title LiquidatorProxyV1ForSoloMargin
 * @author dYdX
 *
 * Contract for liquidating other accounts in Solo. Does not take marginPremium into account.
 */
contract LiquidatorProxyV1ForSoloMargin is
    OnlySolo,
    ReentrancyGuard
{
function coverage_0x366d2569(bytes32 c__0x366d2569) public pure {}

    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "LiquidatorProxyV1ForSoloMargin";

    // ============ Structs ============

    struct Constants {
        Account.Info solidAccount;
        Account.Info liquidAccount;
        Decimal.D256 minLiquidatorRatio;
        MarketInfo[] markets;
    }

    struct MarketInfo {
        Monetary.Price price;
        Interest.Index index;
    }

    struct Cache {
        // mutable
        uint256 toLiquidate;
        Types.Wei heldWei;
        Types.Wei owedWei;
        uint256 supplyValue;
        uint256 borrowValue;

        // immutable
        Decimal.D256 spread;
        uint256 heldMarket;
        uint256 owedMarket;
        uint256 heldPrice;
        uint256 owedPrice;
        uint256 owedPriceAdj;
    }

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
        public
        OnlySolo(soloMargin)
    {coverage_0x366d2569(0xebcfb27bed53359110866cab0ab4d0593724090170ec39f6d370de3b319f7e7b); /* function */ 
} /* solium-disable-line no-empty-blocks */

    // ============ Public Functions ============

    /**
     * Liquidate liquidAccount using solidAccount. This contract and the msg.sender to this contract
     * must both be operators for the solidAccount.
     *
     * @param  solidAccount         The account that will do the liquidating
     * @param  liquidAccount       The account that will be liquidated
     * @param  minLiquidatorRatio  The minimum collateralization ratio to leave the solidAccount at
     * @param  owedPreferences     Ordered list of markets to repay first
     * @param  heldPreferences     Ordered list of markets to recieve payout for first
     */
    function liquidate(
        Account.Info memory solidAccount,
        Account.Info memory liquidAccount,
        Decimal.D256 memory minLiquidatorRatio,
        uint256 minValueLiquidated,
        uint256[] memory owedPreferences,
        uint256[] memory heldPreferences
    )
        public
        nonReentrant
    {coverage_0x366d2569(0xbd98ab09a891e87241058ddbbd9e1f79daa4037d5906eb4e2bca4ba84811ce0f); /* function */ 

        // put all values that will not change into a single struct
coverage_0x366d2569(0x3e482a9308bd21b4d2b4a36ca1fca05fa44a660f58c08600add814010d9dc9c7); /* line */ 
        coverage_0x366d2569(0x878e6469643e437b0dde41e84959c2a19b2e472f2635d2baa94b764577a3773a); /* statement */ 
Constants memory constants = Constants({
            solidAccount: solidAccount,
            liquidAccount: liquidAccount,
            minLiquidatorRatio: minLiquidatorRatio,
            markets: getMarketsInfo()
        });

        // validate the msg.sender and that the liquidAccount can be liquidated
coverage_0x366d2569(0x7a3fff0da3af3e2d53d5b3b3b412df20826fe2df539aef421d9f0156f2eea57e); /* line */ 
        coverage_0x366d2569(0xe6e33214687a9324782f6dc071f5b13667f1ee05cc79f5ed2f3df52135fe1e81); /* statement */ 
checkRequirements(constants);

        // keep a running tally of how much value will be attempted to be liquidated
coverage_0x366d2569(0x34a122e3192e57de8683618d7a32f0cada27559836d01ff0d50e426bab6d5252); /* line */ 
        coverage_0x366d2569(0xd76ff254542335a22642037baa127e3d5c08056e6fd44a39f19c9718ac3f3e83); /* statement */ 
uint256 totalValueLiquidated = 0;

        // for each owedMarket
coverage_0x366d2569(0x0d0c18c20ec3e37fcdcae879cfcb98a8fb36980a25827dee652e9f89f9f1e1f8); /* line */ 
        coverage_0x366d2569(0x64fd7077aa6a8e1b5f52e994515149c3d5bfd190e4aadd42231e8cd110f30caf); /* statement */ 
for (uint256 owedIndex = 0; owedIndex < owedPreferences.length; owedIndex++) {
coverage_0x366d2569(0x7e59ad5d46bbdbd8263eb4bc50b91e8d9489a3ee107997b229f9338ae4d3faaf); /* line */ 
            coverage_0x366d2569(0xc24e0a1861d75bb60f17092a81c97c9fe9450217011ad3170e15b85d6a1c3c7e); /* statement */ 
uint256 owedMarket = owedPreferences[owedIndex];

            // for each heldMarket
coverage_0x366d2569(0xe6ae6ae510ae010c1b7c1ae90f6b29161699d3674fee32fb4e4d1cab97c72938); /* line */ 
            coverage_0x366d2569(0xdff228c9148199cd1b6ed1d8882a1950eecbc423a07a99bafe2a089054589ca4); /* statement */ 
for (uint256 heldIndex = 0; heldIndex < heldPreferences.length; heldIndex++) {
coverage_0x366d2569(0x72485056eed347be06f024691413ba2641902b653aff1cf84fe8cd491e4bd892); /* line */ 
                coverage_0x366d2569(0x02bd86c871bb667483043e6af32bcc6a1439b1fd6c492d6b176197ca84259557); /* statement */ 
uint256 heldMarket = heldPreferences[heldIndex];

                // cannot use the same market
coverage_0x366d2569(0xfc9cc6063dfe25c4865ed94de87c8fa7cc8e6e9aea9d4ffa70a3e8ba8f2d84c4); /* line */ 
                coverage_0x366d2569(0x4a0f88bc715f2b2f83b6051c5bea5174ad5e4707a79a0778dd49da994d54c9c5); /* statement */ 
if (heldMarket == owedMarket) {coverage_0x366d2569(0x3668c73f16154e4142df8eedd34d73c8774b6c5c8921ba03cc3bfe173ab35c32); /* branch */ 

coverage_0x366d2569(0xc73a46ff9f75903cc84fd49606e033736559020359687c8ce7d013920532cb9f); /* line */ 
                    continue;
                }else { coverage_0x366d2569(0x9fc4c150d72da9f6b326ce89cfd323d1940a66e73bc7a7e4f408705dea2f152e); /* branch */ 
}

                // cannot liquidate non-negative markets
coverage_0x366d2569(0x5bd11b5e59948b4a206216e856a1a59352cbe7dd525dd7f6c527567f5a4aa9a2); /* line */ 
                coverage_0x366d2569(0x580d39b4623a190a9beef38aed8b108a787774ddf49be2d4997511501a31e462); /* statement */ 
if (!SOLO_MARGIN.getAccountPar(liquidAccount, owedMarket).isNegative()) {coverage_0x366d2569(0x246910416e91cafc12308da7654af33f5425389d909bb52c8be2819c5cd60d85); /* branch */ 

coverage_0x366d2569(0x546cb25d958980d0a57272b16fdee5cda82512c4a5fd994b8feb011b59cc40be); /* line */ 
                    break;
                }else { coverage_0x366d2569(0xab255c207e3ce332516c3409d1d5e13a1d44abde3c088cdd42324476d672e2f3); /* branch */ 
}

                // cannot use non-positive markets as collateral
coverage_0x366d2569(0x2ececb6390b22a9c751ef857d4e5823de7961c3992079d28e907f845d46dfc00); /* line */ 
                coverage_0x366d2569(0x86c68cfbddb4a9857b0ef37a80e870ed74503b93336c2ccd91aeb05f63d23565); /* statement */ 
if (!SOLO_MARGIN.getAccountPar(liquidAccount, heldMarket).isPositive()) {coverage_0x366d2569(0xa2be06c4280372135197862ee52754d0d190f737bde55cca8d5cb44c6b7c62f6); /* branch */ 

coverage_0x366d2569(0xda0583b8b1425809799c1fd23021d5da15a6fa1d5e438d9709e2bded533c85ea); /* line */ 
                    continue;
                }else { coverage_0x366d2569(0xbb6f490eb93bb0801679d70f5dca490751dc0e75919aa73596907661c7225bdb); /* branch */ 
}

                // get all relevant values
coverage_0x366d2569(0x7d6dae87c9652d4e51c90295f9f9cda5de3bc73a682be84ded0d34f413e041c6); /* line */ 
                coverage_0x366d2569(0x931bad7f7df5bef200819ff10fb5787a58271fc7fc56efee053f94f3a1915136); /* statement */ 
Cache memory cache = initializeCache(
                    constants,
                    heldMarket,
                    owedMarket
                );

                // get the liquidation amount (before liquidator decreases in collateralization)
coverage_0x366d2569(0xfa8a81024c28253ee6f99f2c1686ad69c7daae5cddafa3f1ff3f0b24b74c6837); /* line */ 
                coverage_0x366d2569(0xad1ea3bd2bec201ccbc45b44444c9cbd847a0893ba671a45bb61171624afe7f0); /* statement */ 
calculateSafeLiquidationAmount(cache);

                // get the max liquidation amount (before liquidator reaches minLiquidatorRatio)
coverage_0x366d2569(0xde0a019dd5916c83397149c53d4da23e5100f31f1316d220126b1b5381b17986); /* line */ 
                coverage_0x366d2569(0xf68c17d26bb6b31198af9dea734f470e6000081fd797f712be0841a3e2e5e742); /* statement */ 
calculateMaxLiquidationAmount(constants, cache);

                // if nothing to liquidate, do nothing
coverage_0x366d2569(0xc7532d634385006471badd98c69608a24b51d7e0e551abea3ac62d615d47ebac); /* line */ 
                coverage_0x366d2569(0x2ee0f8be69997d6e867a0a9b3388646617fdbe33cf3da112f2b805c0b4ee7341); /* statement */ 
if (cache.toLiquidate == 0) {coverage_0x366d2569(0xc4f99258a61f5a4b8c81442b82d004875778f8fd88b15bfc0e0b489d25f681f2); /* branch */ 

coverage_0x366d2569(0x74044866e57f67ad536413f86aa39512abbb7a9b6c22cbe2461f67686618e8ac); /* line */ 
                    continue;
                }else { coverage_0x366d2569(0xa790a517d31f7f2e3e7ea027dfbd9b1672cd13e6f9a249a126af81cdac96405f); /* branch */ 
}

                // execute the liquidations
coverage_0x366d2569(0x75e308d4f91cf1f479e96f1b2a6a2d87cbdf835966a762b49156f4b91f104ee3); /* line */ 
                coverage_0x366d2569(0x4c9610d8e306f17d870ed3c82bc46d770ee8ce454fce2d3bf13954b96d8ebb89); /* statement */ 
SOLO_MARGIN.operate(
                    constructAccountsArray(constants),
                    constructActionsArray(cache)
                );

                // increment the total value liquidated
coverage_0x366d2569(0x8da0032a8d504932aecd989a68eefca23bd908941ea367da27db2e5389be0d38); /* line */ 
                coverage_0x366d2569(0x2d4d62b3fcffa61fac327062c074a7e26380e9d61a22f6e8dd4795f26685cd80); /* statement */ 
totalValueLiquidated =
                    totalValueLiquidated.add(cache.toLiquidate.mul(cache.owedPrice));
            }
        }

        // revert if liquidator account does not have a lot of overhead to liquidate these pairs
coverage_0x366d2569(0x9ecbdcce10536a4e8b99fd435115b542b5b5e2db664ea77671bfc5e82f6d9139); /* line */ 
        coverage_0x366d2569(0x6f8a4109d8a3d00623d529cad629ec10304697994f859a84f9ffecc857b7b71b); /* statement */ 
Require.that(
            totalValueLiquidated >= minValueLiquidated,
            FILE,
            "Not enough liquidatable value",
            totalValueLiquidated,
            minValueLiquidated
        );
    }

    // ============ Calculation Functions ============

    /**
     * Calculate the owedAmount that can be liquidated until the liquidator account will be left
     * with BOTH a non-negative balance of heldMarket AND a non-positive balance of owedMarket.
     * This is the amount that can be liquidated until the collateralization of the liquidator
     * account will begin to decrease.
     */
    function calculateSafeLiquidationAmount(
        Cache memory cache
    )
        private
        pure
    {coverage_0x366d2569(0x5f53de8b94f45fe288d1052c43d19d47e8d021608c89e15416da15e2ba6b9a5b); /* function */ 

coverage_0x366d2569(0xb7204a3e62ca38f5b1666b8a9b1508b8faa57d8d7aef583c7cbd7f96b5fa9ac7); /* line */ 
        coverage_0x366d2569(0xbe2fdb2cddd02d1324c2fbbced496059c4e0bc74e5f63fc383305c07bf38ca93); /* statement */ 
bool negOwed = !cache.owedWei.isPositive();
coverage_0x366d2569(0x9cfee9429c55ebfe0e3c95d4163abf6ae30d08c1fd07e9df0943c9d001239c4d); /* line */ 
        coverage_0x366d2569(0xb5eb3bb7ef3684158176278d0048d11ee7d5526484192b32de1fc3fef2950ddb); /* statement */ 
bool posHeld = !cache.heldWei.isNegative();

        // owedWei is already negative and heldWei is already positive
coverage_0x366d2569(0xf1e444368801db3550900f7711e9cef7e2aacec7ac774e22e48b0b71601aadac); /* line */ 
        coverage_0x366d2569(0xd09e860f910f4778c55e40515913b56bbbaa55e3064d21039787892f61743312); /* statement */ 
if (negOwed && posHeld) {coverage_0x366d2569(0xc40bc7103a90cdd96a8fd12d7af26192e270b137945a935721b2b8130b598f48); /* branch */ 

coverage_0x366d2569(0xb25f934ff0b40b89de6cd3b3faa11e3993cfc333809faa253685ca49a294fb27); /* line */ 
            coverage_0x366d2569(0x8a1c55e1b64c5f6cf76645d2bbfb518ebbda22381dc2f216d778b3afd920adae); /* statement */ 
return;
        }else { coverage_0x366d2569(0xe3260f4b8058cfccf8e7439375e3c16aec990dec50211d7093099c043c172723); /* branch */ 
}

        // true if it takes longer for the liquidator owed balance to become negative than it takes
        // the liquidator held balance to become positive.
coverage_0x366d2569(0x64794c9bbf266cbdfa5942c20b49467fc35134a85b68f311a19730564a01c585); /* line */ 
        coverage_0x366d2569(0xb64e67e4aad7fa87958b9e9307aa3278a1e6e4b74ecf65d95f195696d010d87e); /* statement */ 
bool owedGoesToZeroLast;
coverage_0x366d2569(0xcf6f85cdf55f79431bd6a7f34d8af0b99e878f9e5377ef505a2615f4b13c206d); /* line */ 
        coverage_0x366d2569(0xfdef44e3b25712e06491dfe437a1d4c043ad85a656149e37055809606d06a02c); /* statement */ 
if (negOwed) {coverage_0x366d2569(0x3acd85ce6840ff7b64ad033f37527030d528ff4b15219ece586ce66b05955a08); /* branch */ 

coverage_0x366d2569(0x749a5f1d19388e314dc0c9dba2b340e8a7a34d8f6f6c444eb5f2e25be6c73928); /* line */ 
            coverage_0x366d2569(0x7b228736ca08a571a9a78c75ab519e0dce2c956f5a55e33baf634e15b9dff1c9); /* statement */ 
owedGoesToZeroLast = false;
        } else {coverage_0x366d2569(0x2646a6a806608d5419d830a957c616e412a6e93d16cc4d9a021970f6fdb1a936); /* statement */ 
coverage_0x366d2569(0x1983792bd3657fd3757cec31d998eb31b23a652ec135ea15d8b9745f494d435a); /* branch */ 
if (posHeld) {coverage_0x366d2569(0xddedab1006a0e83c7decd28387ef851f4acf7c2e3bed50d2f5601637bc3ba2ce); /* branch */ 

coverage_0x366d2569(0xcb892d90b9a0c2d1cce460b3878bb8e1fcbee9c59c677e95fd8f16d5113ef63a); /* line */ 
            coverage_0x366d2569(0xaa48c7ca16b6db6fbc97ae940f4a112b2baf52bc77f8fb7db15438cf41387e89); /* statement */ 
owedGoesToZeroLast = true;
        } else {coverage_0x366d2569(0x976a2c1cad0af09f5251d99f7028646e92f0c2bae66be6f3541907779a1891cf); /* branch */ 

            // owed is still positive and held is still negative
coverage_0x366d2569(0x89ab81a513bb0092e7ddaab57bd6c7df2729a1f9b97466ac73e01c0dde928b55); /* line */ 
            coverage_0x366d2569(0x7dc052a1c6ecfd96de62b0ddaf3ecde7174ea5cc7ba6aaa9abeac6be5c7512a2); /* statement */ 
owedGoesToZeroLast =
                cache.owedWei.value.mul(cache.owedPriceAdj) >
                cache.heldWei.value.mul(cache.heldPrice);
        }}

coverage_0x366d2569(0x8531e88ed71b978afc55cc0d327a879b95818a1936b68fb3f00f7a02f1d33ded); /* line */ 
        coverage_0x366d2569(0xe4fe0d4ced5b0f3a9eb12926ef99368c9a3c50b93ef778ed61b2a82012ca85ef); /* statement */ 
if (owedGoesToZeroLast) {coverage_0x366d2569(0xf451451d40ce607a4c63fa9c61e009d07a87c800b2c665bbca395ac7f81d83fd); /* branch */ 

            // calculate the change in heldWei to get owedWei to zero
coverage_0x366d2569(0x93a05f2902e5753e4ef164172965de2762c796525f5e7c4f05236ed60caebd2a); /* line */ 
            coverage_0x366d2569(0xc5f166f9c547cf901c7c0ec9059a98ee86a356f4d26b1142bb5da1a14eeb1b04); /* statement */ 
Types.Wei memory heldWeiDelta = Types.Wei({
                sign: cache.owedWei.sign,
                value: cache.owedWei.value.getPartial(cache.owedPriceAdj, cache.heldPrice)
            });
coverage_0x366d2569(0xfee6232de09198bc37e7af8da6bb694cb69c3ab60db880ff6831ccf5f799d6ec); /* line */ 
            coverage_0x366d2569(0x481aa0311b2bad7e42c737a6c306ce0ac7eaa654f3058fd41019460b2c2bfb22); /* statement */ 
setCacheWeiValues(
                cache,
                cache.heldWei.add(heldWeiDelta),
                Types.zeroWei()
            );
        } else {coverage_0x366d2569(0xcdad1cae63ed8c94fd182034565b6eaaa284dc91cd505658617410d4ab9f6e50); /* branch */ 

            // calculate the change in owedWei to get heldWei to zero
coverage_0x366d2569(0x6bf131915c9a66a26b5fdda31a31e87e6c7bf8c7d3e494de4db3f88f83ee1852); /* line */ 
            coverage_0x366d2569(0xd0342aed365083a4e823c6bb009775c1c868607c5cbee7171d07eef4659e4181); /* statement */ 
Types.Wei memory owedWeiDelta = Types.Wei({
                sign: cache.heldWei.sign,
                value: cache.heldWei.value.getPartial(cache.heldPrice, cache.owedPriceAdj)
            });
coverage_0x366d2569(0xee996454520c8e20455e6f40099b28fd0143a2074d95ad35b75ab092c12a0bc1); /* line */ 
            coverage_0x366d2569(0xda2baed305fc5b19c43106850975918f2dfc1d3113e8a23012b6c19845d19cec); /* statement */ 
setCacheWeiValues(
                cache,
                Types.zeroWei(),
                cache.owedWei.add(owedWeiDelta)
            );
        }
    }

    /**
     * Calculate the additional owedAmount that can be liquidated until the collateralization of the
     * liquidator account reaches the minLiquidatorRatio. By this point, the cache will be set such
     * that the amount of owedMarket is non-positive and the amount of heldMarket is non-negative.
     */
    function calculateMaxLiquidationAmount(
        Constants memory constants,
        Cache memory cache
    )
        private
        pure
    {coverage_0x366d2569(0x5762e2987b09f56cc55ce21cbe8e3d50e84d0d1fb07187161ade253a5168229e); /* function */ 

coverage_0x366d2569(0xaf1d079a376c41c0f67fd0dcc72d72d205adb89d508ceebe5dca613e8bc20555); /* line */ 
        coverage_0x366d2569(0xdee57a7cdd35dcb819ab929dc5c058f99701e12fea8b8d96de842dd76372d8cf); /* assertPre */ 
coverage_0x366d2569(0x1e47b40a61f8564183c67fc884bbd4ef056fea2cf793ee80facbb83fff16824f); /* statement */ 
assert(!cache.heldWei.isNegative());coverage_0x366d2569(0xa591a854c24192f3bca398b5623f74d1f70bd065b1ebcf9f9ab0e8e804a60356); /* assertPost */ 

coverage_0x366d2569(0xffd02ac046f52e80c04469f07ce2bd1c034f2f4cb4675e7e2271680d9a6398d5); /* line */ 
        coverage_0x366d2569(0xf87cb988c9a331a679e4d5c79bffbc00da86ef0a464583cb978defe647f2ed9e); /* assertPre */ 
coverage_0x366d2569(0xe33e9fd1ebbb05394c51ecac92deb02958061de3bc72094afd6262c56d13ca46); /* statement */ 
assert(!cache.owedWei.isPositive());coverage_0x366d2569(0x1c461af2652c2dffcbce2e3e3e3d2bcfc207da4a0409bd2c4bcfa1a9dd3d3149); /* assertPost */ 


        // if the liquidator account is already not above the collateralization requirement, return
coverage_0x366d2569(0xc6dd70adc8b33c31f45b849fc0232acab85a1aec9e451b54c5a29e3ebeaa936d); /* line */ 
        coverage_0x366d2569(0x895cbea177661ba2e06877c60ef3529031b2d0bce27fdecbf0c391beda29661f); /* statement */ 
bool liquidatorAboveCollateralization = isCollateralized(
            cache.supplyValue,
            cache.borrowValue,
            constants.minLiquidatorRatio
        );
coverage_0x366d2569(0xe24af922c29936f31fcd08b0dfb97f3a8fccedf875cc50949fc8365ac50d5758); /* line */ 
        coverage_0x366d2569(0xfe7ba71a5d8bbbc23188a20156ab3668a5c676336a0ac1cbfa74ea0f34792445); /* statement */ 
if (!liquidatorAboveCollateralization) {coverage_0x366d2569(0xf296d52bcef5b6eb57e7c6b8dc3311b1870cf362a6cdf7be60a9802836e5006f); /* branch */ 

coverage_0x366d2569(0x3bfb107400dae72caa2c0702a835abaa3bbb3abb2a6c12e9ec89904fca2b2b0f); /* line */ 
            coverage_0x366d2569(0x79c3384360a31e1c5d6b6511eabaab08838506536e0c65c4ed1afda42bad6b2d); /* statement */ 
cache.toLiquidate = 0;
coverage_0x366d2569(0x6541fe750ae23fb8924721f1f9a3aaba13437a89516b75d07dcec35df6a81d70); /* line */ 
            coverage_0x366d2569(0xf6156b60568fb1720e84fa28da61895c6d9e8069fb00107a2b59cc43e8f837e1); /* statement */ 
return;
        }else { coverage_0x366d2569(0xf3096cdb7e14ac52da47d865bf44d023cf5084ea072239af731da40561abe736); /* branch */ 
}

        // find the value difference between the current margin and the margin at minLiquidatorRatio
coverage_0x366d2569(0x49ffd3fe88f40ccebeb9fe0e3aae6c9b66f9c27a00bd9a8dde89f8533d12b70a); /* line */ 
        coverage_0x366d2569(0x3581ca85426cd4970b10f7b1470b853755cd6aee4ebad414f900d6a01d98de2c); /* statement */ 
uint256 requiredOverhead = Decimal.mul(cache.borrowValue, constants.minLiquidatorRatio);
coverage_0x366d2569(0x50825733bdd1616557d46925348fafd73b5d5265fbac0749dc7fed08861ad2f2); /* line */ 
        coverage_0x366d2569(0xcb42b0ab3f2a8f65799b61bf55e6de892de1b78434068786e595b39e8c7337ec); /* statement */ 
uint256 requiredSupplyValue = cache.borrowValue.add(requiredOverhead);
coverage_0x366d2569(0x54475468098829b3c20e627da8f5734c1a92d4f787b6360801091afe36747e01); /* line */ 
        coverage_0x366d2569(0xf0a8218e2c5a7421fca08a7545a0049f09ca825b6678b9429f9f5dece108ae09); /* statement */ 
uint256 remainingValueBuffer = cache.supplyValue.sub(requiredSupplyValue);

        // get the absolute difference between the minLiquidatorRatio and the liquidation spread
coverage_0x366d2569(0x2d040d25b83bc4c09947bf49319755ad408a44e763204eb757cc256852775643); /* line */ 
        coverage_0x366d2569(0xa9c19d3bd582bb087f5819a24e81c73e1051119ff1e11d92a4137ba7314657d2); /* statement */ 
Decimal.D256 memory spreadMarginDiff = Decimal.D256({
            value: constants.minLiquidatorRatio.value.sub(cache.spread.value)
        });

        // get the additional value of owedToken I can borrow to liquidate this position
coverage_0x366d2569(0x71bdfbc20a0373b92ac8c1c13f2af676a440c0c900277bc354d3f391d2a1bf5f); /* line */ 
        coverage_0x366d2569(0x37e42f8ae6761b1e8a8d90483b9adb7554bc7b9877967aaff2496714f6ca50b6); /* statement */ 
uint256 owedValueToTakeOn = Decimal.div(remainingValueBuffer, spreadMarginDiff);

        // get the additional amount of owedWei to liquidate
coverage_0x366d2569(0xeaa39642c3cfbc901b1bf876696429cefe1b134dc0f0db5def263048817ec591); /* line */ 
        coverage_0x366d2569(0x6c02e414108734fef31be948d9daed2325c3a1e573bfb815f205bcea6bc6d613); /* statement */ 
uint256 owedWeiToLiquidate = owedValueToTakeOn.div(cache.owedPrice);

        // store the additional amount in the cache
coverage_0x366d2569(0x05c8218567f407b16623e82589fba51279cb8b3150bf59ade5a84592852eb08a); /* line */ 
        coverage_0x366d2569(0x6240dcfbf7ce4813755b31bfebec0bd5f9ef7b93cff193c25538dbb492e444ee); /* statement */ 
cache.toLiquidate = cache.toLiquidate.add(owedWeiToLiquidate);
    }

    // ============ Helper Functions ============

    /**
     * Make some basic checks before attempting to liquidate an account.
     *  - Require that the msg.sender is permissioned to use the liquidator account
     *  - Require that the liquid account is liquidatable
     */
    function checkRequirements(
        Constants memory constants
    )
        private
        view
    {coverage_0x366d2569(0x757c05c0f3fce59318144323920622c6fefa84925defc0d9405dcf382fac33ee); /* function */ 

        // check credentials for msg.sender
coverage_0x366d2569(0xf99908cb2677b1bd7afa4d6e4de75ba108e3125526e340b49232d461a1c42849); /* line */ 
        coverage_0x366d2569(0x197b21c21835477a6b56c4032e385610a0e2275c0e4df4c1346ce7204309f0eb); /* statement */ 
Require.that(
            constants.solidAccount.owner == msg.sender
            || SOLO_MARGIN.getIsLocalOperator(constants.solidAccount.owner, msg.sender),
            FILE,
            "Sender not operator",
            constants.solidAccount.owner
        );

        // require that the liquidAccount is liquidatable
coverage_0x366d2569(0x6d2dfc301990c895cb14aea873fcee5c2ffeaa20b79ff38043ed70ed57feab8d); /* line */ 
        coverage_0x366d2569(0x3124f6b301eb18bad44ea8e0969d4a7fdf895990620b1a816e33521b0a7e5d71); /* statement */ 
(
            Monetary.Value memory liquidSupplyValue,
            Monetary.Value memory liquidBorrowValue
        ) = getCurrentAccountValues(constants, constants.liquidAccount);
coverage_0x366d2569(0xdbd2b747693d8fc9ff67cb9816db823ba7736d1f1408d1d206cd49852914c7f1); /* line */ 
        coverage_0x366d2569(0x970b052e5ab12fc196317bab23a94a87410974cb88dce893cfeda482dd73f520); /* statement */ 
Require.that(
            liquidSupplyValue.value != 0,
            FILE,
            "Liquid account no supply"
        );
coverage_0x366d2569(0xcb562f5ecdccd90a55e87cd51bf264afcee2bee6a9e9a63d63cde34a096ef97c); /* line */ 
        coverage_0x366d2569(0x4a1c01212062d815b730c01df4c4af2fddcd9259437183490d5b5201ba5f6989); /* statement */ 
Require.that(
            SOLO_MARGIN.getAccountStatus(constants.liquidAccount) == Account.Status.Liquid
            || !isCollateralized(
                liquidSupplyValue.value,
                liquidBorrowValue.value,
                SOLO_MARGIN.getMarginRatio()
            ),
            FILE,
            "Liquid account not liquidatable",
            liquidSupplyValue.value,
            liquidBorrowValue.value
        );
    }

    /**
     * Changes the cache values to reflect changing the heldWei and owedWei of the liquidator
     * account. Changes toLiquidate, heldWei, owedWei, supplyValue, and borrowValue.
     */
    function setCacheWeiValues(
        Cache memory cache,
        Types.Wei memory newHeldWei,
        Types.Wei memory newOwedWei
    )
        private
        pure
    {coverage_0x366d2569(0x1fc52e3c1d6facabd5e59804c664841d133f70ed451d239ed56319e32d54b968); /* function */ 

        // roll-back the old held value
coverage_0x366d2569(0x50db644fe8f4f5edc276859bc4a2af25c75d0e9271c7e59989e74df9c9483e9c); /* line */ 
        coverage_0x366d2569(0x1f1b6e68a858f89b89a396e7f2be8429aaae2438a24e5e36e82f70b714e1f6be); /* statement */ 
uint256 oldHeldValue = cache.heldWei.value.mul(cache.heldPrice);
coverage_0x366d2569(0xca0b8d7bc8c8a2cd527dd1a4a644cdd7467e9c66688e1aa1054f53ae24ae1328); /* line */ 
        coverage_0x366d2569(0x07c316c09b26030c7dc71a846142105bb27e55ba272cc2e4f545c47157877b9f); /* statement */ 
if (cache.heldWei.sign) {coverage_0x366d2569(0x985dca02decf975a58e0b427dee3afa858f36185e92783018f5fac5a7515847e); /* branch */ 

coverage_0x366d2569(0xa30dbe5e3e4f5d96b561ae8ecb83d75f0266353b950080264e66309b703a33d4); /* line */ 
            coverage_0x366d2569(0xb4c82248e7ab04505c3cff235417a8df9846a79ba9fc28116dbf5977e7749f64); /* statement */ 
cache.supplyValue = cache.supplyValue.sub(oldHeldValue);
        } else {coverage_0x366d2569(0xee6ee8844acff05a73069e32a6b2e73a5b567d16baca37f24429f75dad6dce74); /* branch */ 

coverage_0x366d2569(0x641d41532c3a531772c8a809ff3888ed91111d5550bda025dd85fb5fbc27ca93); /* line */ 
            coverage_0x366d2569(0xaca622769c239a801280b2cd80a6522ca0d13d28174800b60f99e6da1183b573); /* statement */ 
cache.borrowValue = cache.borrowValue.sub(oldHeldValue);
        }

        // add the new held value
coverage_0x366d2569(0xbd63cb5152d233d7ab344e164d1b3bc8ee5a824048a29571983868ffd2c8db22); /* line */ 
        coverage_0x366d2569(0xa44fc8d5c08be1d285d70a78c17e225d12199a8a86e9f39ebc7cb218aaaf5917); /* statement */ 
uint256 newHeldValue = newHeldWei.value.mul(cache.heldPrice);
coverage_0x366d2569(0x191508ea05cae627e3a77ea4126a582c4108f89a2d880890ca86eab66e9747bf); /* line */ 
        coverage_0x366d2569(0x98bba5d9996a3f5c27df0a84104243113c38abafd23240f7b38c8acc5e6dc2fc); /* statement */ 
if (newHeldWei.sign) {coverage_0x366d2569(0xe220ec2f7e27e2ddd67ee05eac7bef57581f6dea4ec1129c25032404da97a0e4); /* branch */ 

coverage_0x366d2569(0x6839d6d11a0a0c2064e71289818deaca9317df1f3a6b921ab151be8f1a438ef8); /* line */ 
            coverage_0x366d2569(0x68179c61071dd319b79e993900860b9a33d4164aa88f8195c64372310767e4ad); /* statement */ 
cache.supplyValue = cache.supplyValue.add(newHeldValue);
        } else {coverage_0x366d2569(0xb0cdcfcac1b0dcd24f3a43fdd277dc125c2a52171eeb60dc895f33196d93615c); /* branch */ 

coverage_0x366d2569(0x4066621b9c397230ff0f36cf53c472f8b280a2858e2705268d1b0781ca3b148b); /* line */ 
            coverage_0x366d2569(0x2d8d53d84059f7404f6c1194831383eb77e6045a392d1f6459daec5e098f5289); /* statement */ 
cache.borrowValue = cache.borrowValue.add(newHeldValue);
        }

        // roll-back the old owed value
coverage_0x366d2569(0xbc146fa4365498b40d43a20eb25fc8ceb9b5a6d19dea596f9e0206acd2aa98da); /* line */ 
        coverage_0x366d2569(0x2687ffaa18eef07886a1b01d3b78e839d2b02b3256b454aeb838c0b624ddd210); /* statement */ 
uint256 oldOwedValue = cache.owedWei.value.mul(cache.owedPrice);
coverage_0x366d2569(0x804237cd2cffd4ebe6989ca5248684e120a7fd75b8d9fb596a6687336d76eae1); /* line */ 
        coverage_0x366d2569(0x5af6cfb91437f6c78c1b53a62ce399f8d473ad1169fd21490b8c2aee476f14c5); /* statement */ 
if (cache.owedWei.sign) {coverage_0x366d2569(0x5a55dbc62b191181013de2d36d5f51090a3879fa52eb4478f4784b359b89106c); /* branch */ 

coverage_0x366d2569(0xdf255ba5340aa650465dea163f293641ce1cbf37b939866e20b2c88e4e948568); /* line */ 
            coverage_0x366d2569(0x873647e72e60756411b9f5038cd986b74d53cb9a3cf9e2a3eea3fe689af8af21); /* statement */ 
cache.supplyValue = cache.supplyValue.sub(oldOwedValue);
        } else {coverage_0x366d2569(0x0ad1cd59e0ba564ff962e4ad2d801f31663caa82826828923e5fdf7f6c323234); /* branch */ 

coverage_0x366d2569(0xd6febe4e1e6d35600434d49132d50f76045ec1e66707a268ae12fc93cd27ff8b); /* line */ 
            coverage_0x366d2569(0x86cc9706a16754a922c29537880ee2fceea2ec58562daa278d3e6b1dd6d9be2a); /* statement */ 
cache.borrowValue = cache.borrowValue.sub(oldOwedValue);
        }

        // add the new owed value
coverage_0x366d2569(0x81997bafd5067f1d72dedc80e2512b02897309ec7d0ec33b515a45af6615b811); /* line */ 
        coverage_0x366d2569(0x9a6d3f07ba6ed22d5cd5c63056e8c8f3cc1d33cd61a2fc532f33fa79d4bf3ef3); /* statement */ 
uint256 newOwedValue = newOwedWei.value.mul(cache.owedPrice);
coverage_0x366d2569(0x1773b2a2cd96c6ae6e6bca67791afe1fe894a8537bdf616b5068d706c3eda165); /* line */ 
        coverage_0x366d2569(0x10d46fbb620ab72fc5fc689913d7268fe489b18634d7182c1d5257e087315ea8); /* statement */ 
if (newOwedWei.sign) {coverage_0x366d2569(0x2dc242b9d916aebe69a7e450ebe350e6d4155588f5b06923ecd177e011e3442d); /* branch */ 

coverage_0x366d2569(0x294d49b2a0f888f2052bc1293e5c9315af3eeac4fb87cf56244b2741853ed255); /* line */ 
            coverage_0x366d2569(0x8ff75a8556809d5ff957b4c2e80a7aa44956c37b224200b56f9ff450deca0b66); /* statement */ 
cache.supplyValue = cache.supplyValue.add(newOwedValue);
        } else {coverage_0x366d2569(0x2b9991f2da319751af6926f122b8b89c79445d537b582f6138a9ae453014a0ce); /* branch */ 

coverage_0x366d2569(0x676e4cc71cb4b61430b20f3f79cf5a3f28025532346450eec758a8dbf9dc4324); /* line */ 
            coverage_0x366d2569(0x17c68e6c0c1498727164beda1d8dea1193f0636c2fcffc28c011c36fa96e27d9); /* statement */ 
cache.borrowValue = cache.borrowValue.add(newOwedValue);
        }

        // update toLiquidate, heldWei, and owedWei
coverage_0x366d2569(0x5a71a13936f1478f8959e89e8c9c46a18aa3b09d0b98737b8db83fbb2a9ba0ed); /* line */ 
        coverage_0x366d2569(0xddaf8ac7e9229eb0bce9614bbff668ac977fc61fd615722c2ad4c7d443b59adb); /* statement */ 
Types.Wei memory delta = cache.owedWei.sub(newOwedWei);
coverage_0x366d2569(0x1c865da97bbfdbfe4ce7fb95dcd80cf1b0c6cd097f24e69a784250f1eb38fb21); /* line */ 
        coverage_0x366d2569(0x95b706f0c706f0db3616353786fce9820473968f5fb079f14358e524a23df0d8); /* assertPre */ 
coverage_0x366d2569(0xe1e2d80b59eb72501ec8d4650e737647fe5d655541c30f35937a11faf3b1bd28); /* statement */ 
assert(!delta.isNegative());coverage_0x366d2569(0x9f3b1d7aeed0e641879c3c5aa93bbc151d7cdda4dafd2523f9a755e09625af25); /* assertPost */ 

coverage_0x366d2569(0xef053320610277337960d68997467a878343492c4bb9a3bd9c78ae7204470478); /* line */ 
        coverage_0x366d2569(0x3c915c5517d122c4163c2c6c09224bc82e519d3eecb5261f5692f98c81a829a1); /* statement */ 
cache.toLiquidate = cache.toLiquidate.add(delta.value);
coverage_0x366d2569(0x679e0639b0106cdfc3788362fafc680e2f4a8ecc4da90d6c8591de70ff50c5a5); /* line */ 
        coverage_0x366d2569(0xc91004cd97ae4047eea80b1afc8440acea1a5e1809d440adff991562732bf98e); /* statement */ 
cache.heldWei = newHeldWei;
coverage_0x366d2569(0xaeb95cd6e7ab0443ad61b3973b8b4264b18f8507f73e0bbd833dd2eefdf8ee8d); /* line */ 
        coverage_0x366d2569(0x377174e722cae0a81fe05d305a0837717c7f7ea74d2f4b55b02a1463f0c6dc08); /* statement */ 
cache.owedWei = newOwedWei;
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
        returns(bool)
    {coverage_0x366d2569(0x42fa80a1b3a99efad29a9cef3dea7046baa519a34a932262ca123ee5d244b6ba); /* function */ 

coverage_0x366d2569(0x9027142f0c49442fca1a6b320fadae71531bb9d3542d99e9720248a954fb4423); /* line */ 
        coverage_0x366d2569(0x447c9778aeafa0a991f2fa4109bc0de89fdfd34a2849882d5296faf15fd004ab); /* statement */ 
uint256 requiredMargin = Decimal.mul(borrowValue, ratio);
coverage_0x366d2569(0x0cb775f2f91f48da16a7e8c511f9d01e4c5b2f1276cb16e3c249803aa9dafa9f); /* line */ 
        coverage_0x366d2569(0x0b5a019e2425ef36114ac7f593ba7d47b0725b35b097159b323ddc1e27dcbb19); /* statement */ 
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
    {coverage_0x366d2569(0x2f6919b18b492e2a96738766a160f7ddfbc28d48ca9d34264b4b5e0bd6ff13b6); /* function */ 

coverage_0x366d2569(0x7b26e93bba4671223a337e95430574583c936dc8f163ae066864c61b4d868bbb); /* line */ 
        coverage_0x366d2569(0x80255ee82e971b8af56f263472f58db8be8ae19d734af3871e3a64d9ee235ae2); /* statement */ 
Monetary.Value memory supplyValue;
coverage_0x366d2569(0xf7ca2be8ba576fb086badd590db41f0da498a7706a34ae502b56b1cbc9569890); /* line */ 
        coverage_0x366d2569(0x7da460f0faaadf3ad67dd0b68a70d25b5b181ed2d34feec160768ae2e1db7cac); /* statement */ 
Monetary.Value memory borrowValue;

coverage_0x366d2569(0x58df4364493c42b244a23bfbcff69176f75816fc8394900253c2c9a11b0606b6); /* line */ 
        coverage_0x366d2569(0xb906fe0e9bef568280206cbd8a838eb1d7a1803de89348e39dec381fae396718); /* statement */ 
for (uint256 m = 0; m < constants.markets.length; m++) {
coverage_0x366d2569(0x8c016b29c1f7b91b662ebb2d41d5d7495c8614f527b4c84e9b32346a40a3fff8); /* line */ 
            coverage_0x366d2569(0xc3233d479f7d4e0b2a80112efd4f1d0ad1331bb412abc279ac52e07714b1ca4b); /* statement */ 
Types.Par memory par = SOLO_MARGIN.getAccountPar(account, m);
coverage_0x366d2569(0xb780d7bb607760da10344c1808f4969a06cba204869408472c17e46b5f504382); /* line */ 
            coverage_0x366d2569(0xe12d7389b9c601e92c84322ffe5b7f7539ecc6816434307f5b29383d697f4c68); /* statement */ 
if (par.isZero()) {coverage_0x366d2569(0xb47d4d1be12765d482cf5c06133ebe454f2780db4affc89fdddf433283cf668c); /* branch */ 

coverage_0x366d2569(0xe9646c72705413acd37f6798909c33d3a144e99d8cdf4de7290e9151aca65da3); /* line */ 
                continue;
            }else { coverage_0x366d2569(0x7dfa7f8626946b10ff69ee900c546488d14c791dd7dbf3bc6a782656e17c93ed); /* branch */ 
}
coverage_0x366d2569(0xa7df10096c5e473ef36ca03a9a39e12ae7fecbfe63f66b86e9848c33a5e9a063); /* line */ 
            coverage_0x366d2569(0x5ae1982d1dd33edae3c07da54aeba2bb6c3bff6ef98af41ef64e6f7c4534e877); /* statement */ 
Types.Wei memory userWei = Interest.parToWei(par, constants.markets[m].index);
coverage_0x366d2569(0x39694f481c4b451d7b0657251ec22c67a525354f37b317be81099955219dd0a1); /* line */ 
            coverage_0x366d2569(0x558b925d186fff3bd580283e0a0bb3e85e5382871ed4b61f66aefa1570fae4a4); /* statement */ 
uint256 assetValue = userWei.value.mul(constants.markets[m].price.value);
coverage_0x366d2569(0x9a504072c5f29c9a8c44e9128bbdc4d037ad16d1d46802358229eb7b58a5c7ec); /* line */ 
            coverage_0x366d2569(0x3a9b5921bc4e4bc387532a90079b03eab2726bdc162a0162209f112092aa63d7); /* statement */ 
if (userWei.sign) {coverage_0x366d2569(0xb33c41a43676c30d364c4a6240e5219125fe1571bd2531228f7101fd4ac0cc7e); /* branch */ 

coverage_0x366d2569(0xfb0af6d47b5fe361476abc636f9dea6a77fa5092a773aebd644bc1558397561a); /* line */ 
                coverage_0x366d2569(0x33838ca074d0f525bb6a4d0857dd2f9b0e856dc8e5215e712844ebb40b61b4e0); /* statement */ 
supplyValue.value = supplyValue.value.add(assetValue);
            } else {coverage_0x366d2569(0x69550c3ea7041fd095807872c11309be8d043029befa4a71c25c6d3741089333); /* branch */ 

coverage_0x366d2569(0x912ee55282d1a820a6eb2fdc125406f5cfc250abcc7b1cbf98304cd51d367f24); /* line */ 
                coverage_0x366d2569(0x927f30371d7e13099488b085923ec045ddf77fbade323d6517c391c8d5453dcb); /* statement */ 
borrowValue.value = borrowValue.value.add(assetValue);
            }
        }

coverage_0x366d2569(0x51e943dac5f3acf57be5af7c739c4e9e1045cdd7f68f2a596db4786a321285e9); /* line */ 
        coverage_0x366d2569(0x88babd1983d609e73ebe54338ccf5d0d24ec5742300b65817b9be62f59bb23ba); /* statement */ 
return (supplyValue, borrowValue);
    }

    /**
     * Get the updated index and price for every market.
     */
    function getMarketsInfo()
        private
        view
        returns (MarketInfo[] memory)
    {coverage_0x366d2569(0xb8a1feb3e5d242e1ebff087079c5c2f6b7a820d7cd393540c1854e402fed443c); /* function */ 

coverage_0x366d2569(0x834c09fa211bd1c44a05cadba0cc766dcb25c6573c554519e7099e289302dab7); /* line */ 
        coverage_0x366d2569(0x692e8f23d4eec790d1262908fed5c30681c6ba0809c410eb7b64494e1edca195); /* statement */ 
uint256 numMarkets = SOLO_MARGIN.getNumMarkets();
coverage_0x366d2569(0x6625246a08974f738872033354cd42f3479c9bae90fe5d202b68a0391a5e94b9); /* line */ 
        coverage_0x366d2569(0xac3b77b17048fce0054f17affecc041e3f2e31eb8e95aaa4269567595b1c582b); /* statement */ 
MarketInfo[] memory markets = new MarketInfo[](numMarkets);
coverage_0x366d2569(0x7216488c5c395845f6a48e76e0b66b4a17f069146f333e64d4b1d31783abe96f); /* line */ 
        coverage_0x366d2569(0xd504e7db222e2a40212b37409758ce80417032c79623a7bdb66ca10cb4d3c841); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x366d2569(0x3939184a048d2358bc8cc41494d7780e2f80044a3bca93d64b90f7af030bd74f); /* line */ 
            coverage_0x366d2569(0x4ccc04b1de80bb702a439d585392290508f80ea421218661615e322c15987af9); /* statement */ 
markets[m] = MarketInfo({
                price: SOLO_MARGIN.getMarketPrice(m),
                index: SOLO_MARGIN.getMarketCurrentIndex(m)
            });
        }
coverage_0x366d2569(0x3804e002998e9dde36980f46517daaec1cd946a474a15166d2dfdc538400bcd9); /* line */ 
        coverage_0x366d2569(0xe809679c3df00a1ca666922ca338ae05973cbd3bb8b2100bd707ba9be57595a2); /* statement */ 
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
        returns (Cache memory)
    {coverage_0x366d2569(0xa06a1b1c10a4dfc472a2ec627d4bcbdf9573897516eec3d27bc0e08afe4d44b3); /* function */ 

coverage_0x366d2569(0x2c041ad83142fb1b7db87c0c6929f819020b5464006bba454c8420811a1a7178); /* line */ 
        coverage_0x366d2569(0xf419ce4d3d7f874b531cb093bd77d5ec1deb591c5e3460fe27c4cda7db8dbd77); /* statement */ 
(
            Monetary.Value memory supplyValue,
            Monetary.Value memory borrowValue
        ) = getCurrentAccountValues(constants, constants.solidAccount);

coverage_0x366d2569(0xf1323ee2742af950c95e5388256dbf2bac195eaca9956551a713cc1f953122f8); /* line */ 
        coverage_0x366d2569(0x5a42c3b2415a7ba2ee32a0bc6152e8814cdfb37d6a31dbba129bf2516a0b34ef); /* statement */ 
uint256 heldPrice = constants.markets[heldMarket].price.value;
coverage_0x366d2569(0x24d82d3e1f787251294d54542ea0f928551d05a72192b4cbe10db5e90bee3823); /* line */ 
        coverage_0x366d2569(0x0900a7c61803a42755dbee7861dbdbca393ffe7940b178e808f5c8bfed8d2179); /* statement */ 
uint256 owedPrice = constants.markets[owedMarket].price.value;
coverage_0x366d2569(0xea68a0498a60349f27a44dbe3d1fafde8e771c88e567fd95ca6a93afdab6fc02); /* line */ 
        coverage_0x366d2569(0xfb85bc657ff9a25d4c4fb8cda08958faffc27211fdd10470657f6e85e3d36859); /* statement */ 
Decimal.D256 memory spread =
            SOLO_MARGIN.getLiquidationSpreadForPair(heldMarket, owedMarket);

coverage_0x366d2569(0x86dbdbbf8e9d8a049067c71195f992b9c2f072fb8bc92eb742b6728290e1f0cc); /* line */ 
        coverage_0x366d2569(0xa85470b33bdad8817e4bcb51fef98d0135e753cdbc86a45c43d02fa42a639209); /* statement */ 
return Cache({
            heldWei: Interest.parToWei(
                SOLO_MARGIN.getAccountPar(constants.solidAccount, heldMarket),
                constants.markets[heldMarket].index
            ),
            owedWei: Interest.parToWei(
                SOLO_MARGIN.getAccountPar(constants.solidAccount, owedMarket),
                constants.markets[owedMarket].index
            ),
            toLiquidate: 0,
            supplyValue: supplyValue.value,
            borrowValue: borrowValue.value,
            heldMarket: heldMarket,
            owedMarket: owedMarket,
            spread: spread,
            heldPrice: heldPrice,
            owedPrice: owedPrice,
            owedPriceAdj: Decimal.mul(owedPrice, Decimal.onePlus(spread))
        });
    }

    // ============ Operation-Construction Functions ============

    function constructAccountsArray(
        Constants memory constants
    )
        private
        pure
        returns (Account.Info[] memory)
    {coverage_0x366d2569(0x5f958187adc2309eaa5c6a985349bd1c4fec529e1f9c94d45919d83d0bfaae3b); /* function */ 

coverage_0x366d2569(0xea664fe20270016537761fc9dec530d2d65321272dfe826f2aa9d8b8970af367); /* line */ 
        coverage_0x366d2569(0x1db85f71c63c3dea20b02c054bd6cf5a6bc48ef452da6108344362a7150f4a2c); /* statement */ 
Account.Info[] memory accounts = new Account.Info[](2);
coverage_0x366d2569(0xb76f14d507d8b59fa7a1b0b33fa027427931fb35247ca9d2edfb19f1d4c554d9); /* line */ 
        coverage_0x366d2569(0x92669f83afe924945ea44ecae3c6f8a54f2c53795d44b9d85e212fb034309463); /* statement */ 
accounts[0] = constants.solidAccount;
coverage_0x366d2569(0xe61f7ec613650746fd17e571a0ff9652c79612171c2800b12a308725a1757385); /* line */ 
        coverage_0x366d2569(0xe4ccf47efa7c32753fa3eb185c8dbe733447856074a9fed9c9fd19a3cef6ceaa); /* statement */ 
accounts[1] = constants.liquidAccount;
coverage_0x366d2569(0xe464a2a3254997ad0645dd3f670ab9c1b70fcc11f5df33c52d338d5936504608); /* line */ 
        coverage_0x366d2569(0xb82018984f072b4cecee78251c986d15c6e65161a0004d9a61dc09b4f6aa0420); /* statement */ 
return accounts;
    }

    function constructActionsArray(
        Cache memory cache
    )
        private
        pure
        returns (Actions.ActionArgs[] memory)
    {coverage_0x366d2569(0x15f562d0cd01c1626f544e8d83c8ceffca0e521f399081f8fdf26ae9dc4f7da3); /* function */ 

coverage_0x366d2569(0x3e99118ad528b2c82d84cde8cd260aeec8045f9b7470d17f647bff2c4ac367fa); /* line */ 
        coverage_0x366d2569(0x89d62adc3dd2b833b868b465b895526adb55a9640c5a156edbe6253bfb426d2e); /* statement */ 
Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
coverage_0x366d2569(0x0d2eec8b1fcd535d9c83ceba97243dc3612f9046e590c8a0da6108c2f80ee846); /* line */ 
        coverage_0x366d2569(0x7531378f025f0d575ec0f0c75f8a02c84c46140de7e1e698a3a34f252d64eb75); /* statement */ 
actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Liquidate,
            accountId: 0,
            amount: Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: cache.toLiquidate
            }),
            primaryMarketId: cache.owedMarket,
            secondaryMarketId: cache.heldMarket,
            otherAddress: address(0),
            otherAccountId: 1,
            data: new bytes(0)
        });
coverage_0x366d2569(0x9f351ee6aadcfc5743623a763a93a7a0ddfc603dde4737bb3ee2c8c0d7367be8); /* line */ 
        coverage_0x366d2569(0x345e9fe5dadb36b4698019f7ce65494af6ac1d634282508353a9520f4de26f95); /* statement */ 
return actions;
    }
}
