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
import { IAutoTrader } from "../interfaces/IAutoTrader.sol";
import { ICallee } from "../interfaces/ICallee.sol";
import { Account } from "../lib/Account.sol";
import { Actions } from "../lib/Actions.sol";
import { Cache } from "../lib/Cache.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Events } from "../lib/Events.sol";
import { Exchange } from "../lib/Exchange.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title OperationImpl
 * @author dYdX
 *
 * Logic for processing actions
 */
library OperationImpl {
function coverage_0x14d995d8(bytes32 c__0x14d995d8) public pure {}

    using Cache for Cache.MarketCache;
    using SafeMath for uint256;
    using Storage for Storage.State;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "OperationImpl";

    // ============ Public Functions ============

    function operate(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        public
    {coverage_0x14d995d8(0x4852f20dd112cfb3f35ab995dc859396256fafc768063d306d168257332abec2); /* function */ 

coverage_0x14d995d8(0x90d1a7b6e7b9354b2a8d69c8ca0873b4313c3969b34aa9752a40fe5e92d90f94); /* line */ 
        coverage_0x14d995d8(0x03621cb13bec4ce7edab0d9362e4a7b8554a2fafc86409005f4574ec3002963f); /* statement */ 
Events.logOperation();

coverage_0x14d995d8(0x5d06d560e2b794455f1311bcfb744f85d341e46fd6779d7aefc1cd32a2c80141); /* line */ 
        coverage_0x14d995d8(0xd30cb99ff226fed1843215a5773bbf04c9249dc824e02091f2fcb0312576fb33); /* statement */ 
_verifyInputs(accounts, actions);

coverage_0x14d995d8(0x35e79ee557f95738f56bf10a7fb3e40f70785ee356d3b6641db332a762727015); /* line */ 
        coverage_0x14d995d8(0x9cb9b4611a2924e08a19b9aab41c98c52082de88349a613257cf385a89f0cbb6); /* statement */ 
(
            bool[] memory primaryAccounts,
            Cache.MarketCache memory cache
        ) = _runPreprocessing(
            state,
            accounts,
            actions
        );

coverage_0x14d995d8(0x3b688e3a13f254192c50be1df349e274755ef9bf54484d1a87fe9dcb1e432b6b); /* line */ 
        coverage_0x14d995d8(0xcb8edd3f99c22f35208e115c24f58fe9dfb1b6864a5f8677e9ec629f02dd3a55); /* statement */ 
_runActions(
            state,
            accounts,
            actions,
            cache
        );

coverage_0x14d995d8(0x5407be0effcafffbd5723d9654851db574ef44601963bc78e147dd13f4425c3b); /* line */ 
        coverage_0x14d995d8(0x4fc892318aa55f9ce9e7451dcc4bb6eaf3aecc9ba32c43e3143fea24cf89b50b); /* statement */ 
_verifyFinalState(
            state,
            accounts,
            primaryAccounts,
            cache
        );
    }

    // ============ Helper Functions ============

    function _verifyInputs(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        private
        pure
    {coverage_0x14d995d8(0x1120c3f16c9eaf6b27bf441622ee5c1c1905355f1184ff86fde45b332bd314ab); /* function */ 

coverage_0x14d995d8(0x3800c01de9f442a12e495413e906ae27230718d85311d388db632ea210e1570c); /* line */ 
        coverage_0x14d995d8(0x2ab3c9d5c999c7d2dfeea2033439c3ab17c7c9a54dea12e47f6e6484ed9f9618); /* statement */ 
Require.that(
            actions.length != 0,
            FILE,
            "Cannot have zero actions"
        );

coverage_0x14d995d8(0x6192b8040d37432492c0da5d6ef8d5947df0cf09153663b58bd441d5f95d4443); /* line */ 
        coverage_0x14d995d8(0x77c681d43ccea70554b9c773f15c937feb6c6e2cdb6674e8f44a643f5f05cda6); /* statement */ 
Require.that(
            accounts.length != 0,
            FILE,
            "Cannot have zero accounts"
        );

coverage_0x14d995d8(0x622d21bb43fdd6b9b707ea2c1c47d2fb74b7d75266b0d0b3c06a43e7727b80e2); /* line */ 
        coverage_0x14d995d8(0xb861867fe1224d6143464b33685d807464f5561064fee7136d5d13f2430e1102); /* statement */ 
for (uint256 a = 0; a < accounts.length; a++) {
coverage_0x14d995d8(0x73bb82d445df604eb367231db9eaacec71a9eb02d3f1fb114fdc2ff8c73621d9); /* line */ 
            coverage_0x14d995d8(0x8e0a1432a4088e699d22bde4b026a27bdbb6ba3c0ff28d277e68547ea54ecb96); /* statement */ 
for (uint256 b = a + 1; b < accounts.length; b++) {
coverage_0x14d995d8(0x90dd253c4932ad0c7f6548a489a12d0b0829b6d5baed434706c264c4bf00739c); /* line */ 
                coverage_0x14d995d8(0xb5ff64148a58dfca92ff4ddc571973bff56e2da0e3fd4f2cad4d4f469a010aa1); /* statement */ 
Require.that(
                    !Account.equals(accounts[a], accounts[b]),
                    FILE,
                    "Cannot duplicate accounts",
                    a,
                    b
                );
            }
        }
    }

    function _runPreprocessing(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions
    )
        private
        returns (
            bool[] memory,
            Cache.MarketCache memory
        )
    {coverage_0x14d995d8(0x0247796acbee95b9fec17ac68dc2ceaf9534976182641217681f201d289dde5d); /* function */ 

coverage_0x14d995d8(0xdf2790cd98821da8ba9f3c765e36be1ad14de46f843690bfcb6624833297e250); /* line */ 
        coverage_0x14d995d8(0xee61222f47c898f4504454b1ceb4e29e66ff133147b6298102ecc80df02b4888); /* statement */ 
uint256 numMarkets = state.numMarkets;
coverage_0x14d995d8(0x82b4351d8368322daf0999ee3dee1a0ac7e4486b41dd3c17d32fc44f6d3e7143); /* line */ 
        coverage_0x14d995d8(0x79b9790d4eabf882696594ed03defea0257d5ac2d7ea11844ee442aa49a6f0db); /* statement */ 
bool[] memory primaryAccounts = new bool[](accounts.length);
coverage_0x14d995d8(0xe02bcfd45535d4af07181fe80f89de9d2c22e9009ba1b2b120e789fa1b57b380); /* line */ 
        coverage_0x14d995d8(0x35a7a32e4154137f81e2e7ddf040247be7c49e539006dbc20a775face59ac57d); /* statement */ 
Cache.MarketCache memory cache = Cache.create(numMarkets);

        // keep track of primary accounts and indexes that need updating
coverage_0x14d995d8(0xbb80477eb06f7e523487d4e2f8284e8969f0c87031a785718df29c5ee5b5b56e); /* line */ 
        coverage_0x14d995d8(0x4ab47d98fe82ca1be43135172a2ca32f3457c91a22f0f3c5b3927b7434f7f74b); /* statement */ 
for (uint256 i = 0; i < actions.length; i++) {
coverage_0x14d995d8(0x0b249948e8038da09abe364f7cbea789ee0120d161333ef9ed6028b14f66e6e5); /* line */ 
            coverage_0x14d995d8(0x5b7d0ef4cf0d18bd02b4d5af4413e073013782aa55b183a6952eb9bd1faffe84); /* statement */ 
Actions.ActionArgs memory arg = actions[i];
coverage_0x14d995d8(0xeabc9e08763e10fa30dda6d1cb0683e36d391525ed41cc7d545c866a8ecd8d7d); /* line */ 
            coverage_0x14d995d8(0x2163ed731af7062d79499d64256614c1a3b044167d678db5133cf2b8782a389d); /* statement */ 
Actions.ActionType actionType = arg.actionType;
coverage_0x14d995d8(0x71e8275b1f52a110955a4349b930d02d921b14f3e9198860e1b32cd249a5a24f); /* line */ 
            coverage_0x14d995d8(0x2de3fa7fed2b0adb60a9e3984bc504b34a5240cb1271aae408f38261975eb485); /* statement */ 
Actions.MarketLayout marketLayout = Actions.getMarketLayout(actionType);
coverage_0x14d995d8(0x7c71daa8f9e0cd3593cc071769ec295a6f69a367d678665e8ef76b7484acd2d8); /* line */ 
            coverage_0x14d995d8(0x859fd82aef164a8fdf5340d503e50c151b389bfd4ac4a0b184653385fdfaf8c6); /* statement */ 
Actions.AccountLayout accountLayout = Actions.getAccountLayout(actionType);

            // parse out primary accounts
coverage_0x14d995d8(0xa57c3ba6a3317fa9b0554a4539fa25f3ae87b87ccedcbd0594dfd2ba23a49824); /* line */ 
            coverage_0x14d995d8(0x97db684a6a0facda04c94af2f8e42541d777d1536251f077ef2f9e160b3d8275); /* statement */ 
if (accountLayout != Actions.AccountLayout.OnePrimary) {coverage_0x14d995d8(0x7f6e9b4bb455e0fe954b68348c02feeffea5e9295fceb971219591f763353bca); /* branch */ 

coverage_0x14d995d8(0x7d615e6e05580648d840d13f4506727ce5ce6364e9346354a67466c97812ddbf); /* line */ 
                coverage_0x14d995d8(0x6907775f14e64fcfe778c8fbf445acdbbc62d5f1ef43c9209ee14304e8916fe7); /* statement */ 
Require.that(
                    arg.accountId != arg.otherAccountId,
                    FILE,
                    "Duplicate accounts in action",
                    i
                );
coverage_0x14d995d8(0xe01cce924103f436a1a4ca87a5786543c26b21a9164582cf6a9e6dfbda44e758); /* line */ 
                coverage_0x14d995d8(0x05e4fbe374e8cd7705496bbb0637674e6f84179fed8c65f92c5638d095c7c5ae); /* statement */ 
if (accountLayout == Actions.AccountLayout.TwoPrimary) {coverage_0x14d995d8(0x46fce14e99d88a36e6014b8bb28738899077265b5ebfd12f0611fc0065939dc2); /* branch */ 

coverage_0x14d995d8(0x104da409707efa880224ec6eced643f2ca55a38e755655f5b7720a80b176b6db); /* line */ 
                    coverage_0x14d995d8(0xf2be31abbdd225765411ce4c20be14167e35be90def5b027f8101ee6a000a67f); /* statement */ 
primaryAccounts[arg.otherAccountId] = true;
                } else {coverage_0x14d995d8(0xab65eef112fcc1008fd9557cd1aff97babbf274f61a7a5bfbb2fb05baaa2e291); /* branch */ 

coverage_0x14d995d8(0x167ac52b9415817dfe79f6d54e455b61b2b084600321c773ddd1a4d03866d76b); /* line */ 
                    coverage_0x14d995d8(0x85a9b630be2ea45f26202c9c908fa918019e58d9a57599a0bfb396b68760b8c6); /* assertPre */ 
coverage_0x14d995d8(0x341cde33531cfe5d2c6dc3e51838f80e77db7a7012047760c24a6c8ff293f97e); /* statement */ 
assert(accountLayout == Actions.AccountLayout.PrimaryAndSecondary);coverage_0x14d995d8(0x4f335707a80d92683f9fb1accf1a9cd2303ceebc5b87e4baed9e7ae860fa730c); /* assertPost */ 

coverage_0x14d995d8(0xb9b335002698a79872ff8f8f37166ea139df08417a4b10703bf2668d30bdd863); /* line */ 
                    coverage_0x14d995d8(0x70d0606488ef8ae5eda60a94cea6a4dee7c86c2b2eada07a9ab2f73605e57957); /* statement */ 
Require.that(
                        !primaryAccounts[arg.otherAccountId],
                        FILE,
                        "Requires non-primary account",
                        arg.otherAccountId
                    );
                }
            }else { coverage_0x14d995d8(0xe7292d057e41faf205bcdd43887546cc2379f246fcf70b2d771aa40f481d5e9f); /* branch */ 
}
coverage_0x14d995d8(0x9a62b4100c59e00c6173b2a71b2d39ba92c11a7b7191dff8ab01f95884eafe2a); /* line */ 
            coverage_0x14d995d8(0x8a8cf0a38b3ef60807c41b107bca61520f14b1b865ce59ae4fe5244cf1ccb903); /* statement */ 
primaryAccounts[arg.accountId] = true;

            // keep track of indexes to update
coverage_0x14d995d8(0x58ba8f885bf419156aca450e583302d6c8e58a62e9cf16800158ec94a9770169); /* line */ 
            coverage_0x14d995d8(0x5f23c82cb70b0c216f76320de4e6e9777b90744760f3fd4982b34b5e9b00d745); /* statement */ 
if (marketLayout == Actions.MarketLayout.OneMarket) {coverage_0x14d995d8(0x1261eff9119a83d6cd9c1b31a3559211c11bc53b8a2ca8482e429890d35f9d66); /* branch */ 

coverage_0x14d995d8(0x731e73260f4e64c77771a13870f07da1123c315db151f94f6deb635bea1a52e2); /* line */ 
                coverage_0x14d995d8(0x14722df0fd93c72c17db363009fb3baa3d4ffa56c3d2f6365d2aa9b59e588d4e); /* statement */ 
_updateMarket(state, cache, arg.primaryMarketId);
            } else {coverage_0x14d995d8(0x823b04bd4aa9d275a3e345c74d465feff5f371c1e07ee996183b00d8df446051); /* statement */ 
coverage_0x14d995d8(0x6037e4b257a4e6b79ced35de92d208e98eb8aa5cdd323becaa66352d005def56); /* branch */ 
if (marketLayout == Actions.MarketLayout.TwoMarkets) {coverage_0x14d995d8(0xde33d06c5355724bb601f41b6b86b9b22bce1e612b522cc204a89b8f1051337a); /* branch */ 

coverage_0x14d995d8(0x2d36130d0fb6438619d89f3569786bbf34a3837d760561a9de40fe0577b9f8d7); /* line */ 
                coverage_0x14d995d8(0x89869af2f754018dfe7d6a3e7219177b0a03522a29694a0e986ebf73a58b01e6); /* statement */ 
Require.that(
                    arg.primaryMarketId != arg.secondaryMarketId,
                    FILE,
                    "Duplicate markets in action",
                    i
                );
coverage_0x14d995d8(0x89cc4b4e39d47601f3ef0e1710f784e9a5e284c4c21e22da2526b676a691ec55); /* line */ 
                coverage_0x14d995d8(0x5c8c9a9616284a5424885f1165984b77ee21596c02acc03a7e7c5d0cdc49242c); /* statement */ 
_updateMarket(state, cache, arg.primaryMarketId);
coverage_0x14d995d8(0xce80084ac67a270f758a3321c921a74805d92e582d002969abfcdfd1a00af8aa); /* line */ 
                coverage_0x14d995d8(0xcd71373ebc7018a56c7e2bcd0bc0ca82a97a40cada979bf218d0629fd3e7eca1); /* statement */ 
_updateMarket(state, cache, arg.secondaryMarketId);
            } else {coverage_0x14d995d8(0x8b0102fd828224108ec1e284bd339c822d4caf5ab741dcf60542aa5e5c27db97); /* branch */ 

coverage_0x14d995d8(0x7e5aeda77535fdec14cb38696323bd88449ec91922ddfba3df3f2bf0a4b49bf6); /* line */ 
                coverage_0x14d995d8(0xa990232f0598fae5d5d0bdba31bf08e368b0a5355a1a36faabb6768782b33226); /* assertPre */ 
coverage_0x14d995d8(0x0a398f89c04201501d32c9719f6fa43f6033750718db91073609cf0239367457); /* statement */ 
assert(marketLayout == Actions.MarketLayout.ZeroMarkets);coverage_0x14d995d8(0xec933c4d65157e4b422d41870a9a43c02080c7fc9a872efa1c617fd521a34f10); /* assertPost */ 

            }}
        }

        // get any other markets for which an account has a balance
coverage_0x14d995d8(0xc156f452adf826f1bc62e54629c1d7f8793c88e49ce331085630249810934a59); /* line */ 
        coverage_0x14d995d8(0x23aada3c920b1249f6f9de435c0e4049a12448485d229d4da618cf461c035d3f); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x14d995d8(0x195ad43bd12385dae34cb27cc224bc2155b6c0e4673b7c1e4ada3a6bf2e95e7c); /* line */ 
            coverage_0x14d995d8(0x84500e4fcd9a496bd9ab453819d14f8ddb9ffab13622971b3b704c4c565353de); /* statement */ 
if (cache.hasMarket(m)) {coverage_0x14d995d8(0x4c858736317b8bbdb283f9aca61903ba2c42f548174a2b583e7dad4698ca50d1); /* branch */ 

coverage_0x14d995d8(0xb7dc031b43d7f70f2949beb6f3fea2f84a0444f768b4ba8189701a9ddfe8451b); /* line */ 
                continue;
            }else { coverage_0x14d995d8(0x5dc46159dc044138878cf4a84b108af0a364f6e202dccd34e02464ed04a08e66); /* branch */ 
}
coverage_0x14d995d8(0x235e4838d179fd5a0f6076dca423dc0da34f8f77a87a8a617ddfd268879e4d6d); /* line */ 
            coverage_0x14d995d8(0xdeb15d575bd13abe857f874046de53d1bca52cc49cb479321366c2f709507665); /* statement */ 
for (uint256 a = 0; a < accounts.length; a++) {
coverage_0x14d995d8(0x34d2c25779371c0127a3ce982591c5ec03d94b0802794a76458c6581a54e9b56); /* line */ 
                coverage_0x14d995d8(0xec10cf4ac3b56cfc5a5be784687defb38b96b6a288e8eb92cacc9290a3a05aaa); /* statement */ 
if (!state.getPar(accounts[a], m).isZero()) {coverage_0x14d995d8(0x579db368fa073ba1c5470782beaf709655ae9b0ada6d783b576fdaca5be33c91); /* branch */ 

coverage_0x14d995d8(0xee1888a513f17c76878b44b63896fc067341648dcfca593b4e3b170498454f5b); /* line */ 
                    coverage_0x14d995d8(0xa4b24d2e8d3f39df8b736ab4a02ccf0b51a9821e503886d33c7957d60e16ffc7); /* statement */ 
_updateMarket(state, cache, m);
coverage_0x14d995d8(0x20a2dba4e3d8560c24d79585cea55fa0f2e6f8e6dcfceff0f7ab6979f53985f8); /* line */ 
                    break;
                }else { coverage_0x14d995d8(0x38207b25eb58ae36de971eead47024f93568275daa6ad4c72700e421ed5ebbb9); /* branch */ 
}
            }
        }

coverage_0x14d995d8(0xe4a6bbdf89149da072918f3abc8b51fb9b047f5b4ed27176af1fbb449956d520); /* line */ 
        coverage_0x14d995d8(0xf963e04a8ffa198c2b8bbc0e115d44f4f29316b2424c96d534b3b8f9d476a22e); /* statement */ 
return (primaryAccounts, cache);
    }

    function _updateMarket(
        Storage.State storage state,
        Cache.MarketCache memory cache,
        uint256 marketId
    )
        private
    {coverage_0x14d995d8(0x454fd8975c4b82f3d7ab71ab17508a820554cc6c2b65cace6713141260194de0); /* function */ 

coverage_0x14d995d8(0xf99112ebc9710a39dd5f8fbad6e4b80fe5a5a26ef30b4f5639c3192c4a2405d5); /* line */ 
        coverage_0x14d995d8(0xe6af24a9ed2823180572a0719016c8e2b4b8ed7ebd1ec2158f5f356aa7c988bd); /* statement */ 
bool updated = cache.addMarket(state, marketId);
coverage_0x14d995d8(0x652363461484b30a4f1a79fbd9758e6698e86ea8e568817a078fa786b2683f90); /* line */ 
        coverage_0x14d995d8(0xcf1a88379757454b8f4e11039571a4fa77493ebb7aaefcd0fe87d8d7715e2918); /* statement */ 
if (updated) {coverage_0x14d995d8(0xd8a2ff2d7cb6043cc00d223e512b3323795a431b77d07c0599c76d46a2230dc3); /* branch */ 

coverage_0x14d995d8(0x8e5ad93f7f7bdffd076ede20da16aafcacd5f3eac910147ce5e6446a4b8e3546); /* line */ 
            coverage_0x14d995d8(0xd1e2c01ccfa783f35ab43fe2de4238f5532deb9360544b1f1b16c15436b82f51); /* statement */ 
Events.logIndexUpdate(marketId, state.updateIndex(marketId));
        }else { coverage_0x14d995d8(0xf7be5885594d72e7b767d15ccf4e8d362784bcde25ea9f2131393a7f8e1cedba); /* branch */ 
}
    }

    function _runActions(
        Storage.State storage state,
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Cache.MarketCache memory cache
    )
        private
    {coverage_0x14d995d8(0x96ca0643088f7201c34f0c3d495af136ea3dbb63c974b4d7c29d12e201053c9e); /* function */ 

coverage_0x14d995d8(0x2778b4308ee01e31aea05517528135ac0ec5cd03d46b275e8cfbdbf0da52b621); /* line */ 
        coverage_0x14d995d8(0x87a6df1402520c60dd32d4722d6f4341e988a02cdcfa5e675a40ed491410b6de); /* statement */ 
for (uint256 i = 0; i < actions.length; i++) {
coverage_0x14d995d8(0x66bf20673fa6c27faa553e6115a5f1f7ecdbeac017954f9f71050fa8f746bfab); /* line */ 
            coverage_0x14d995d8(0x3d4ebf89a02630d849336b551ff30edf4539c0abbb7e806bec299296a5ba97fe); /* statement */ 
Actions.ActionArgs memory action = actions[i];
coverage_0x14d995d8(0x3a0ed81f05eb3e154a8a2b873c02c89776a4f8c7558c291531505ceaa4bbe16f); /* line */ 
            coverage_0x14d995d8(0xb734bc55b38dce71e37a9154ef6b33a5d65f9f9061c338a666ceac53bfc36071); /* statement */ 
Actions.ActionType actionType = action.actionType;

coverage_0x14d995d8(0x301f282a732091eddddf4521fe5a835e17600bd2c83084b7184340b573bbfbfe); /* line */ 
            coverage_0x14d995d8(0xefb319419b19d39ff7011eef358b41024c86adb4c3b277efa21299120de10257); /* statement */ 
if (actionType == Actions.ActionType.Deposit) {coverage_0x14d995d8(0xd9a040c7960b2939ea783b643971957075403b0fa1f8a03892cbce4b30c9bd1e); /* branch */ 

coverage_0x14d995d8(0x941ba44793fef1ab41f0e0a2528076e7f326d6e1a1a272cc273ed1697c89a3d5); /* line */ 
                coverage_0x14d995d8(0xde511e817335b13939ba5ddef6ac82408e51fad4e7802df5f5bf15d4ba0ead63); /* statement */ 
_deposit(state, Actions.parseDepositArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0xd3f144bdcc89ee07e37daf90725f262118a7c0be46ea449756419333f186dfd0); /* statement */ 
coverage_0x14d995d8(0x4a92829f9012e683e4e919626b6eb153a947652de71af61d7229a75253790bc0); /* branch */ 
if (actionType == Actions.ActionType.Withdraw) {coverage_0x14d995d8(0x259fcfad87d63874ee5889aacc46cd6bebfc65a53b1c9bfea72dd96cb7e591a5); /* branch */ 

coverage_0x14d995d8(0xd7d7463816e147dca2c976be34093e17af804c613f3e07ca85024687d5af5802); /* line */ 
                coverage_0x14d995d8(0xd249103013518edef8d878aee7157282d8e01b82576e36a9c5ca9f948aab8356); /* statement */ 
_withdraw(state, Actions.parseWithdrawArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0x0a5f725337d9b4b77b9c4342a9e7c2f8f74d7d4b88a9d871026d9505d37ea0ef); /* statement */ 
coverage_0x14d995d8(0x02a20504de2145a8841b002e2b681650b6673659693f162f939acfc43bd22143); /* branch */ 
if (actionType == Actions.ActionType.Transfer) {coverage_0x14d995d8(0x6e3af61ef4c806109e1ea2f88d836be6179dd9819cf72e814cccba5c2d78411d); /* branch */ 

coverage_0x14d995d8(0xfa0521e696bbe64f621a41ee8e8151a7faaa14c27720e596bbd9b27f2023adfc); /* line */ 
                coverage_0x14d995d8(0x4a7244ad4e2ed92bdfadefbacea19a1daa96238045bc21baf4635716f847e930); /* statement */ 
_transfer(state, Actions.parseTransferArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0xd38e4f4fcda0071a932a75b476617cad30e486f7eda3be5a07ed5f9de77f61ab); /* statement */ 
coverage_0x14d995d8(0xc8ba61803aabebcfc9a3b185c34bfd4ddd8c5cd4800da697c5d040a70b2ea02b); /* branch */ 
if (actionType == Actions.ActionType.Buy) {coverage_0x14d995d8(0x64ea8603e86453feab85628028fab70b3500cda1edaf43bd298a34f455acea14); /* branch */ 

coverage_0x14d995d8(0x87fc8bb72cebc068b89b1cca714c5c2a4bde06db07ec32d8a52b4241aee540db); /* line */ 
                coverage_0x14d995d8(0x2c6caf8dfd357ca520666936e2014b6f1996824c28461f8207d4aa34026ac6ff); /* statement */ 
_buy(state, Actions.parseBuyArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0x4148338a45219b66b99ff93537d3b0f15944e9f6e147f53e86ba10e11d6b1fc8); /* statement */ 
coverage_0x14d995d8(0xfbbc25097af9265b10dd2b549fc9bb75f7661ffe59145272b2c1ae805dd74272); /* branch */ 
if (actionType == Actions.ActionType.Sell) {coverage_0x14d995d8(0xc7d7d271f1f5949e85768b63be385c5afe61d2a40e5e9a427f6c35086a0d7023); /* branch */ 

coverage_0x14d995d8(0x835153f824557507dca77ff06b417f667689d26916663134f4208c0cba363b25); /* line */ 
                coverage_0x14d995d8(0x2903ea3f805f955466d47ee65513a4eb839318ef33775071f6df9da68fd8b63e); /* statement */ 
_sell(state, Actions.parseSellArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0x1b0460028584db5cfc6dad2c9494b39b6514e1906fffcbcac76f327e4d8ad061); /* statement */ 
coverage_0x14d995d8(0xd0865f213904614f2ef3031cbf94dc37c56529a88e51985a3d90af072da5199b); /* branch */ 
if (actionType == Actions.ActionType.Trade) {coverage_0x14d995d8(0x7cc6ab73df05a8d4a2a04364418c416394cc04c232d274f29a88986c5ec0a5ba); /* branch */ 

coverage_0x14d995d8(0xc730b1288946e8c13b052911265a85624745b0ba5b44d9083e4c89c679e4a042); /* line */ 
                coverage_0x14d995d8(0x82d071a214f79a24feca4cef8f544df90786686d4a87bdada6854999a80377c3); /* statement */ 
_trade(state, Actions.parseTradeArgs(accounts, action));
            }
            else {coverage_0x14d995d8(0xe3578ec0ea43860d4c87f868540072ae5315a196d5ee9fbeec69ffff6189b9ee); /* statement */ 
coverage_0x14d995d8(0xb2d15d8d9d59d61c9caaa8b14af912c14350d9660f9d366ef179aecd315afbb9); /* branch */ 
if (actionType == Actions.ActionType.Liquidate) {coverage_0x14d995d8(0x639b8054aaaa8853b92ddf1100b92cccbd217e0a1d29a250481c56cb27ac4ee2); /* branch */ 

coverage_0x14d995d8(0xd70d97f5303f0966814a9f8914e550661953b568b41bb31be6fcf06965a920d2); /* line */ 
                coverage_0x14d995d8(0xf3e69a5915121f82532e662b595f780b35dc8e66b285faca43a22dcdc7db8e72); /* statement */ 
_liquidate(state, Actions.parseLiquidateArgs(accounts, action), cache);
            }
            else {coverage_0x14d995d8(0x76778564a058a107b1e61c039f3decaf6c2da4a7a18f758c2387e9daf5fda689); /* statement */ 
coverage_0x14d995d8(0x541ebe856e9a03ced8d68cb2ee821c191c84b31f71724382e825a1701b364fc6); /* branch */ 
if (actionType == Actions.ActionType.Vaporize) {coverage_0x14d995d8(0xc8ee8f9ff442a4d2039be53b565ea0a4356c5ea49028cb37f13c90ffad60bb04); /* branch */ 

coverage_0x14d995d8(0x9489b7755cd57ab013d3da4d9f544cb68f18119fc3c03209979af57ac8146527); /* line */ 
                coverage_0x14d995d8(0x528deb12b3cb8aecd1035d95a74c5572bc6d7b05dcbb3c900c1f0aa5bf654b6e); /* statement */ 
_vaporize(state, Actions.parseVaporizeArgs(accounts, action), cache);
            }
            else  {coverage_0x14d995d8(0x694b96da240b11fbdb82e840aaba959270dedf06a50c2d857975723c8695c258); /* branch */ 

coverage_0x14d995d8(0x400b8092a255d99ebed43272ce349db660e0753bdba89c7f99cb35c2b951a38d); /* line */ 
                coverage_0x14d995d8(0x340bc798748a3e012ce709544d60446db2b152c2c26c5785cacf2647df3ede39); /* assertPre */ 
coverage_0x14d995d8(0x9153d12c2ae40ade2673c6a7833310a8e1ff37393f37f5755474fb13b91c82fe); /* statement */ 
assert(actionType == Actions.ActionType.Call);coverage_0x14d995d8(0x40c22b95227c5333419d605b3fc967988c66f6b46ed94fc63d099808065432a8); /* assertPost */ 

coverage_0x14d995d8(0x83cbe81b110bcbe00c769603c7e826171670a67ada8f4eaa8ff595206fcb5c4f); /* line */ 
                coverage_0x14d995d8(0xd01e62380190ee77d041892a5b439d993221b2a261f54cd0fcd1bb212a01eebb); /* statement */ 
_call(state, Actions.parseCallArgs(accounts, action));
            }}}}}}}}
        }
    }

    function _verifyFinalState(
        Storage.State storage state,
        Account.Info[] memory accounts,
        bool[] memory primaryAccounts,
        Cache.MarketCache memory cache
    )
        private
    {coverage_0x14d995d8(0xf0c61a9913acf31e69174c6668710eaa8c420cc622f808d0d8782f5eedb4b4e0); /* function */ 

        // verify no increase in borrowPar for closing markets
coverage_0x14d995d8(0x5d75a2bcd3bc48ba30abdc4cd11b2b0d04dfb6a5766a8e3155e6c1f20b73382a); /* line */ 
        coverage_0x14d995d8(0xdec3d3818eafa3196bb99f67e6f8a6052d835c32546ca141dd1598ee43e9aa8c); /* statement */ 
uint256 numMarkets = cache.getNumMarkets();
coverage_0x14d995d8(0x938b074816e44b92a0f69a9bcac3f5bdf37422f412382257f8d36dffaec57a60); /* line */ 
        coverage_0x14d995d8(0xc4bf23fe70b640366af838f9be80834a13d8c9d129198b8684c1f0b882ea3c20); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x14d995d8(0xbfe8a2b6ef0bc2b4d971b623c857e0c133ee1c446853bf139337363e87df2dab); /* line */ 
            coverage_0x14d995d8(0x21a5fc326e921f69acb9bb22e320b668fe3ebd3361ce84583f9ce514317d4f87); /* statement */ 
if (cache.getIsClosing(m)) {coverage_0x14d995d8(0x907dcefa0d1db6501bed9b25677258fb7de373a9e48e9c7d98794779022b35d5); /* branch */ 

coverage_0x14d995d8(0x9c9ad78c4a8ddad77ef7afa675086f5f88f193addf100dfd58222057e5671c46); /* line */ 
                coverage_0x14d995d8(0x003b0efbee98bd0a0c225fb4fd47fcea977fc787da13139736de2dd8fcef2761); /* statement */ 
Require.that(
                    state.getTotalPar(m).borrow <= cache.getBorrowPar(m),
                    FILE,
                    "Market is closing",
                    m
                );
            }else { coverage_0x14d995d8(0x0c15b16236b2b85c30618edbb3cb9acc5536bbb18ec06370a3d6be737ff01684); /* branch */ 
}
        }

        // verify account collateralization
coverage_0x14d995d8(0x74c42c3a65dbc09c55a9e6382b8ca4166353bdb029aab138b53152fa2ed56b08); /* line */ 
        coverage_0x14d995d8(0x1d4b25f89329e90c186c27e515cc03d9f993a1d13d07518d365569a1d2ed82a6); /* statement */ 
for (uint256 a = 0; a < accounts.length; a++) {
coverage_0x14d995d8(0x41937169eb061f23d49262f0c622e275bc5ff40f0e410cacd896ff364bc65370); /* line */ 
            coverage_0x14d995d8(0x51cd386b8172b0f1ed97b09e587ff11a6e307587e89df48ae6ad2a6533d9d76c); /* statement */ 
Account.Info memory account = accounts[a];

            // don't check collateralization for non-primary accounts
coverage_0x14d995d8(0xa4156d14a1632e7321d6eb6a5c15a41fca8be282b2f4e61e318316e640665e24); /* line */ 
            coverage_0x14d995d8(0xee6af34ef15656bbd8920b7609ff4753b070bd8d02788d67ccad402ac4908951); /* statement */ 
if (!primaryAccounts[a]) {coverage_0x14d995d8(0x1ad60d7004279a1975a49eedae2123c2f6ba21090a0ff8a72c62720b010b2b67); /* branch */ 

coverage_0x14d995d8(0xc70c0c8a64b79ae0ff8f9366fc877acdd3db7cd2fae0b5bb898bb621a92b2200); /* line */ 
                continue;
            }else { coverage_0x14d995d8(0x14442921dec1e3a7a25b873e74d337c164222f2c93d6e6d170331ca5e9dea7e2); /* branch */ 
}

            // validate minBorrowedValue
coverage_0x14d995d8(0xe4c7586f9dba987754170db28872c350db5fbe747e47af060d95b4a7e02d6383); /* line */ 
            coverage_0x14d995d8(0x228d51e600613021810a9bd6e4230f3eb97a3853222d45fcbd5e06d6d3e3e5cf); /* statement */ 
bool collateralized = state.isCollateralized(account, cache, true);

            // check collateralization for primary accounts
coverage_0x14d995d8(0xaafa357be3ef3965e0b421c3ceea1a50d74c4e77d2ef56b368e626e071c989b6); /* line */ 
            coverage_0x14d995d8(0x7f52f4e82bc2d076dfb779cefa73c3849412da20afe6c49c9e338ea5bdb6bd0a); /* statement */ 
Require.that(
                collateralized,
                FILE,
                "Undercollateralized account",
                account.owner,
                account.number
            );

            // ensure status is normal for primary accounts
coverage_0x14d995d8(0xd2c528d1f9c7dfde6aaac4e20ba2eb586ad2d9534576f0a205c6801fc44e281e); /* line */ 
            coverage_0x14d995d8(0x883b030671ae8d0656da0810755006e11d19506a43e54ceef4784bf3408e9461); /* statement */ 
if (state.getStatus(account) != Account.Status.Normal) {coverage_0x14d995d8(0x7f1ecf4ab6c2b85c006ebc5cb4b3910c34baef7f470912177faa0151a1b72565); /* branch */ 

coverage_0x14d995d8(0xd28d84a9dbadf4497116f331e29d3f0a7608f2ac99320e90a27e9fa6c02771ce); /* line */ 
                coverage_0x14d995d8(0xf8edda6c745dbd57234b7d896a305443e7f8440106a9446d46828c0268281444); /* statement */ 
state.setStatus(account, Account.Status.Normal);
            }else { coverage_0x14d995d8(0x85f6d5d39651283521f919d28818c1d769554eb14ae9c847d2b4968a0911f64a); /* branch */ 
}
        }
    }

    // ============ Action Functions ============

    function _deposit(
        Storage.State storage state,
        Actions.DepositArgs memory args
    )
        private
    {coverage_0x14d995d8(0xba42ee866ed8158b718ab1f78a06e954aa746e0ce12f3c5f4c8956c42919a2c7); /* function */ 

coverage_0x14d995d8(0xa6e5a4f1d986bd316f5013b676eaa34df79517ecee9fb803f6483d14cb988d62); /* line */ 
        coverage_0x14d995d8(0x208f0804a204a25ef6f11022941c8e4ef70de5c73c81700a5e297ce7207bfd33); /* statement */ 
state.requireIsOperator(args.account, msg.sender);

coverage_0x14d995d8(0x8a803f7121c3dc3c61d2b33747ad8d08d835e364d4b852cae8e31265cc598916); /* line */ 
        coverage_0x14d995d8(0xdb3e7915f88850c458baffcd324fabe3b7f711ada71797bf22e572cb08d4674d); /* statement */ 
Require.that(
            args.from == msg.sender || args.from == args.account.owner,
            FILE,
            "Invalid deposit source",
            args.from
        );

coverage_0x14d995d8(0x8107910b7b0de562290e3f59e5dbab7092c6224700cce326e82cb9cb6752658d); /* line */ 
        coverage_0x14d995d8(0x06ce47377561472c9e47ae49d9756690919c756877549a79f855b8326d669047); /* statement */ 
(
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.market,
            args.amount
        );

coverage_0x14d995d8(0x79ec949b927248296e4468c6e8826be8e074c862f8fcd0be033b1ee7e9b0fdf0); /* line */ 
        coverage_0x14d995d8(0xfee955b0ec75a71be024acf38fa577089fa00d6af5e4bcbb353190d3aa5a592a); /* statement */ 
state.setPar(
            args.account,
            args.market,
            newPar
        );

        // requires a positive deltaWei
coverage_0x14d995d8(0xbe4b26201edd8fd53790b14fc47b41454d4015e7cfa3804815c80a02f8c445f4); /* line */ 
        coverage_0x14d995d8(0x43edae008c0abc5901487363b0b4362f48a6a637eeec40449cf0346bc72a76ac); /* statement */ 
Exchange.transferIn(
            state.getToken(args.market),
            args.from,
            deltaWei
        );

coverage_0x14d995d8(0xec086474481f58474000c759fa5492772b2063920ef4b4073a18885491b5475a); /* line */ 
        coverage_0x14d995d8(0xb0058b34dbb1c3a36fbb8929c7466916f88478bb2278b2900310a454dad2e4d1); /* statement */ 
Events.logDeposit(
            state,
            args,
            deltaWei
        );
    }

    function _withdraw(
        Storage.State storage state,
        Actions.WithdrawArgs memory args
    )
        private
    {coverage_0x14d995d8(0x299482990b9422a8b24ce7480d061c60211fb40e64e5e54091f21c35bc28ce11); /* function */ 

coverage_0x14d995d8(0x961952dcd38f1141832c95c5484973164fc0799a488edcb0be9728f0569355c1); /* line */ 
        coverage_0x14d995d8(0xdba3bb48978413ce1df75e52f8225764fe240446c7847e283ef9037f6efbbb01); /* statement */ 
state.requireIsOperator(args.account, msg.sender);

coverage_0x14d995d8(0x15fe7be2843874abb8d00d7b50b78de0a61530a1bda05f0564a5112c26cd2bbd); /* line */ 
        coverage_0x14d995d8(0x96432399497b9478e3e5fcabe5df92a486bfba6bf390ad3f24aeee23b372e99f); /* statement */ 
(
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.market,
            args.amount
        );

coverage_0x14d995d8(0xe67cff49650eb5398d2ca1fa440f1cdce88453be330c14db6cf9298771f66018); /* line */ 
        coverage_0x14d995d8(0x21fff21074b40235d1c3a120905b8320c0d35c8c3f91cdbb223e2c0f9129ae2b); /* statement */ 
state.setPar(
            args.account,
            args.market,
            newPar
        );

        // requires a negative deltaWei
coverage_0x14d995d8(0x7cd7d957cb2a5f2ec1ca22275285b7a1a00f450c90f78c9905a88cb99990b0be); /* line */ 
        coverage_0x14d995d8(0x125cbb9487522df41fe54d53d5db700390a923b4f8e5bbfa6af72baebfccb2f0); /* statement */ 
Exchange.transferOut(
            state.getToken(args.market),
            args.to,
            deltaWei
        );

coverage_0x14d995d8(0x4fabfa26f02b6982cd933f8c26124a35e1272bb4cf77c4fdd01651d910c395e8); /* line */ 
        coverage_0x14d995d8(0x97820353fbf82a1e02c03acb3681fda016fcadb1f4f18d53694ce9c516efbb23); /* statement */ 
Events.logWithdraw(
            state,
            args,
            deltaWei
        );
    }

    function _transfer(
        Storage.State storage state,
        Actions.TransferArgs memory args
    )
        private
    {coverage_0x14d995d8(0x04d54905089d8a0262e9b13c601d8326eec629b3799cd2e739e0fca35d96c70e); /* function */ 

coverage_0x14d995d8(0x1c582cb45e84875ec7716b521639bf610139799becfd92ab31cc20f2aa7df52c); /* line */ 
        coverage_0x14d995d8(0x4bf7bc2e942a381abd6991f875e3943a3dd56cf3108da7ffe8210ef2464053c1); /* statement */ 
state.requireIsOperator(args.accountOne, msg.sender);
coverage_0x14d995d8(0xbe97b5e353cc84d48b139a594470cdac892935ccb6213cc595a93f064bc3b7b7); /* line */ 
        coverage_0x14d995d8(0x9658d17d50677369a49865c62c4c48fd44c5e8f38b3918ac366236739fd49e66); /* statement */ 
state.requireIsOperator(args.accountTwo, msg.sender);

coverage_0x14d995d8(0x438a98e7b28beeb99e1219dfb637f5f6eafa669c7e962e98f11ef8b084fda361); /* line */ 
        coverage_0x14d995d8(0x1c31b8650869c61286c638ea4f038788182f34c2ecc2945a2965d789403cdbb4); /* statement */ 
(
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            args.accountOne,
            args.market,
            args.amount
        );

coverage_0x14d995d8(0x57313a36ea498f3c111b9747946f164dffc87c261c5de6c6cb61a983169b690e); /* line */ 
        coverage_0x14d995d8(0xaf73679dab6a7299fda17e52c01d3814a5d8f34bb78f6574ab20e3e5aa77a048); /* statement */ 
state.setPar(
            args.accountOne,
            args.market,
            newPar
        );

coverage_0x14d995d8(0x2f9b184ca72fe198abe51218dad7cf3ae0a91ea1bceea396548fdc0a842407ae); /* line */ 
        coverage_0x14d995d8(0xc667f6e03071450ce8bd67ba88aa858fa07515f61b75f505d2472d1d853dbb15); /* statement */ 
state.setParFromDeltaWei(
            args.accountTwo,
            args.market,
            deltaWei.negative()
        );

coverage_0x14d995d8(0x3d858f81614eed0b6e01ead0d8aeafe3157e56784412fada76825d5627d9cdf9); /* line */ 
        coverage_0x14d995d8(0x1ffc0f796827d0f6dcc71ed4dfe8e2c998240d2d321e03458c1c2a6ac2e910ad); /* statement */ 
Events.logTransfer(
            state,
            args,
            deltaWei
        );
    }

    function _buy(
        Storage.State storage state,
        Actions.BuyArgs memory args
    )
        private
    {coverage_0x14d995d8(0xa3925feb5580b7bb14de8bc989040f45303b6571da1008e222f1518467e95b21); /* function */ 

coverage_0x14d995d8(0x31d9ae0e252a5d4ddc49c7e5d0dfcd428ba97b69432d05ab07e2a78562a2b46a); /* line */ 
        coverage_0x14d995d8(0xf86b325b6846466c30b47952d27faaedfa2f10816c83a0d8c3d068507ae4c40f); /* statement */ 
state.requireIsOperator(args.account, msg.sender);

coverage_0x14d995d8(0x9ddb119bf0bfd559ec843e70741e380237027318a404f80dd5f87d098c685a4a); /* line */ 
        coverage_0x14d995d8(0xcd70b6dff8f9ee6b80fc791335999e45294460319649327cb64bfa353072d36f); /* statement */ 
address takerToken = state.getToken(args.takerMarket);
coverage_0x14d995d8(0xb12f326a9fbf043e018b42788a7cfa1249f22c55589f0a1538955550dbeee355); /* line */ 
        coverage_0x14d995d8(0x8f633e3ad2e1c1e1b926e07b7e41dbd5d12f60af36a4e81af6741beb37f417d6); /* statement */ 
address makerToken = state.getToken(args.makerMarket);

coverage_0x14d995d8(0x38a6260620fcec03e6adad1b042b89d9322be853aa1481670dd33ab3b259cfba); /* line */ 
        coverage_0x14d995d8(0x8c399fcb64c0b00500c57807db7438e26b336e25153d529b153af209ef3abc7d); /* statement */ 
(
            Types.Par memory makerPar,
            Types.Wei memory makerWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.makerMarket,
            args.amount
        );

coverage_0x14d995d8(0x57ede1fa23ac06f762dd8e9a83d3582267e08c71c6de908f04b7fbe8ba537ab9); /* line */ 
        coverage_0x14d995d8(0x23cdf8e98012de1391274fd68d6aa4cba14d7353bd791353d56ee941189e5f74); /* statement */ 
Types.Wei memory takerWei = Exchange.getCost(
            args.exchangeWrapper,
            makerToken,
            takerToken,
            makerWei,
            args.orderData
        );

coverage_0x14d995d8(0xf8add6317a7ce83aa1c35cebf5c09c982b56b2c620e893b75eb57154424aab44); /* line */ 
        coverage_0x14d995d8(0x303a81f54092631274fba6c2291d27f1cadaeff4d4101537874e82c4a445b555); /* statement */ 
Types.Wei memory tokensReceived = Exchange.exchange(
            args.exchangeWrapper,
            args.account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

coverage_0x14d995d8(0x8dce1313979921a2ebecddd569592c11f2902d41e23205ba5fa972355a6c80be); /* line */ 
        coverage_0x14d995d8(0xd36dacdc21153c1666a6d59991c43d70b975c79778b0e48640402d3872796334); /* statement */ 
Require.that(
            tokensReceived.value >= makerWei.value,
            FILE,
            "Buy amount less than promised",
            tokensReceived.value,
            makerWei.value
        );

coverage_0x14d995d8(0x0400eb1ee10ae697d46d4c63e632926bba312f55e6e11886228fafc9fe267702); /* line */ 
        coverage_0x14d995d8(0x2d8aacafad388baed5f42f0696fd109185b2dad2cf85156a5b8bdb11b6b4b4d2); /* statement */ 
state.setPar(
            args.account,
            args.makerMarket,
            makerPar
        );

coverage_0x14d995d8(0x455211bbd1da895831f80a924ace0c2b2f6ee7946f003cd91bc03d452a2a6387); /* line */ 
        coverage_0x14d995d8(0x059b2c1f9b3af5cace3d3a9b1cf5dc220a0046437200b9cb3fa90e5e9f21135d); /* statement */ 
state.setParFromDeltaWei(
            args.account,
            args.takerMarket,
            takerWei
        );

coverage_0x14d995d8(0x212295d6aace4616ee9834239151c2c4a21c33d6e47efb246b3bd68aa8d54278); /* line */ 
        coverage_0x14d995d8(0x0dd54855b4e60a6066e430ad6701667db8bdc93f02a73faf57d4086ef829666f); /* statement */ 
Events.logBuy(
            state,
            args,
            takerWei,
            makerWei
        );
    }

    function _sell(
        Storage.State storage state,
        Actions.SellArgs memory args
    )
        private
    {coverage_0x14d995d8(0xa5ad3d7c52965879a37763a6fd11e33dfd05381347534c5ce27ece1cba4239bf); /* function */ 

coverage_0x14d995d8(0xb492baf8161ccfd10725084fec9cd5c58a5f11e153af8e1448ce25d4cc3cbb7d); /* line */ 
        coverage_0x14d995d8(0x7af76194d28bad5bb3a8b1a2ac4cf10c1be7f79da1b1b069bda087912b150ffc); /* statement */ 
state.requireIsOperator(args.account, msg.sender);

coverage_0x14d995d8(0xc81049bf1bcd790e227c3b9e58f52bddc3f79ee9d3b45337c5e53f4c0628815b); /* line */ 
        coverage_0x14d995d8(0xe5e4253e7af19bb03fd0943f4f165f27ad028a744aedc3f6e1c096f9b3e540a7); /* statement */ 
address takerToken = state.getToken(args.takerMarket);
coverage_0x14d995d8(0xc71cb87c4145aae8839dcd55dd02150d17e1de949ac0f1e155d1a24914e2de0c); /* line */ 
        coverage_0x14d995d8(0xba208c46453cfbdfd114db5aacba6c4e697545a3310f2c57e518c4d955ab4b39); /* statement */ 
address makerToken = state.getToken(args.makerMarket);

coverage_0x14d995d8(0x8a35e0f6dbd491867b51a6da5e2062956ef247973f10195aa8005a54a6ff6bd1); /* line */ 
        coverage_0x14d995d8(0x5c49028c96d78bc0d7b5aab4463dd561d74d8104cf44cd9f23ec2e6cfaa63ea3); /* statement */ 
(
            Types.Par memory takerPar,
            Types.Wei memory takerWei
        ) = state.getNewParAndDeltaWei(
            args.account,
            args.takerMarket,
            args.amount
        );

coverage_0x14d995d8(0x3820580035fdba6f002b60cd5fa9c0f0c4b4642d2c227de9ddc64eb815c4fac3); /* line */ 
        coverage_0x14d995d8(0x1d2d3a921b8e5051230cda03dd24cddafbbb9a9c7083c0f9fea8025004dde635); /* statement */ 
Types.Wei memory makerWei = Exchange.exchange(
            args.exchangeWrapper,
            args.account.owner,
            makerToken,
            takerToken,
            takerWei,
            args.orderData
        );

coverage_0x14d995d8(0x72c367d5761e47f926d79d5eb906848407bb848f990e8ceab20541dd665c83dc); /* line */ 
        coverage_0x14d995d8(0x94e7c9e31f2a9566bcf96c7e85d5bd5b87000ac7d3c088a7e95a500eb5741e41); /* statement */ 
state.setPar(
            args.account,
            args.takerMarket,
            takerPar
        );

coverage_0x14d995d8(0x9378e53c8a7c7550ce2968f9990fe94e579fbb8f34e9402a13422f6fe17c7a7b); /* line */ 
        coverage_0x14d995d8(0x30a2a0b6374beef84c8aa9b61e4b921cb36444ce59d4397fe9c008d03a98548c); /* statement */ 
state.setParFromDeltaWei(
            args.account,
            args.makerMarket,
            makerWei
        );

coverage_0x14d995d8(0x23b458ae53a476b8bca91057bf250335546acae4ac9108d7134eeb6a176818a5); /* line */ 
        coverage_0x14d995d8(0xa4f09ec5c0b1224db4fff537ec6ef14d8fc8b0a229c4d1f2b4991caec6221c67); /* statement */ 
Events.logSell(
            state,
            args,
            takerWei,
            makerWei
        );
    }

    function _trade(
        Storage.State storage state,
        Actions.TradeArgs memory args
    )
        private
    {coverage_0x14d995d8(0xf6f3f7c043d7fa91e35d6ccf72953733d81fe612b167fdef0be5cb1f88dbd5cc); /* function */ 

coverage_0x14d995d8(0x5fcf9455955fd8a4acb07fac5f1cf3579707f14803a68687d4d2990639664da8); /* line */ 
        coverage_0x14d995d8(0xf44fbf0824107035cfd4bb8a33b4c73ed19687b0513e6c8e1023e26d9b52e659); /* statement */ 
state.requireIsOperator(args.takerAccount, msg.sender);
coverage_0x14d995d8(0x24dbc053797eddeefbb6e28fed6ba8ff9852ca229bb4119f6a918a573199869c); /* line */ 
        coverage_0x14d995d8(0x72408ac9fe166f161dda5358509319027a664759b160ba343fd566e569ba0e3b); /* statement */ 
state.requireIsOperator(args.makerAccount, args.autoTrader);

coverage_0x14d995d8(0x12a8d2e2a3773e03f553d63f03e356b338fa61cef89006caa223e1f083745158); /* line */ 
        coverage_0x14d995d8(0x45803842fb3a476a3f350b99a26b5fc657dbcfc4a38e061f31c2526228687d95); /* statement */ 
Types.Par memory oldInputPar = state.getPar(
            args.makerAccount,
            args.inputMarket
        );
coverage_0x14d995d8(0x7de1dcac9b65af10f95878fad399d45a4d8e66df597fb741b1d853bad6d083f4); /* line */ 
        coverage_0x14d995d8(0x9a7becf46db825c302f68a9c9417087d7ae660072defac69c066e3bc9d8a4091); /* statement */ 
(
            Types.Par memory newInputPar,
            Types.Wei memory inputWei
        ) = state.getNewParAndDeltaWei(
            args.makerAccount,
            args.inputMarket,
            args.amount
        );

coverage_0x14d995d8(0x7609054c009859dd40deca38b7c17f42aed006aa8908195bf557a87812338ba4); /* line */ 
        coverage_0x14d995d8(0x90fa5c986ae810a67a70a97eb8f4e9d2be646310ff29fd4c556edfd42ab70d4e); /* statement */ 
Types.AssetAmount memory outputAmount = IAutoTrader(args.autoTrader).getTradeCost(
            args.inputMarket,
            args.outputMarket,
            args.makerAccount,
            args.takerAccount,
            oldInputPar,
            newInputPar,
            inputWei,
            args.tradeData
        );

coverage_0x14d995d8(0x63ef15780d9d580b7990390e9df6b859b121fdae019310040e35a7d02bcc36dc); /* line */ 
        coverage_0x14d995d8(0xf7a3f690aeb8d8065aa9ca619d6e1547c9c9d5dedb5b40e56598940de7284966); /* statement */ 
(
            Types.Par memory newOutputPar,
            Types.Wei memory outputWei
        ) = state.getNewParAndDeltaWei(
            args.makerAccount,
            args.outputMarket,
            outputAmount
        );

coverage_0x14d995d8(0x832f43096e9c78d2ef670800dced82fb2bbd452378ed21c847c6530fc733f04f); /* line */ 
        coverage_0x14d995d8(0x4a06b62dd85423398f25d3d8742fd5921e047788bb3b93158fb60e7cd5163776); /* statement */ 
Require.that(
            outputWei.isZero() || inputWei.isZero() || outputWei.sign != inputWei.sign,
            FILE,
            "Trades cannot be one-sided"
        );

        // set the balance for the maker
coverage_0x14d995d8(0x4545cbcc20e4804b00c59fdf2b08bf08c4bddf68895b4d75f9d482211091ecd9); /* line */ 
        coverage_0x14d995d8(0xe0d37b9c859f2826a29d768fd785a83b46f7ffbba9fe581a2583473419dad366); /* statement */ 
state.setPar(
            args.makerAccount,
            args.inputMarket,
            newInputPar
        );
coverage_0x14d995d8(0x2d13f7f648b3c0b33832f2fec0a83ac08dede6fc55408f6f5b5097e0d3990b73); /* line */ 
        coverage_0x14d995d8(0x5c5791e378a539639d566229d832973a978ae0df41a1303ba262466c00ba3383); /* statement */ 
state.setPar(
            args.makerAccount,
            args.outputMarket,
            newOutputPar
        );

        // set the balance for the taker
coverage_0x14d995d8(0xca5ff11bc557f93b70ca64f1875ddce849ed6bb50f89995354dcdcb935170210); /* line */ 
        coverage_0x14d995d8(0x98110d21b421af9b18137692ee1d8a5585c4c1f7aa8e9da19521136b769b1193); /* statement */ 
state.setParFromDeltaWei(
            args.takerAccount,
            args.inputMarket,
            inputWei.negative()
        );
coverage_0x14d995d8(0xe2022ebe3cb3f575ebe55b842cb4df2ba0d3f144e2d58ec04925b57377b66118); /* line */ 
        coverage_0x14d995d8(0x1d09c0bdfb2a87b90a7dd5065f61142f8e497a69c9281a6ff27125f2ab2b9dd8); /* statement */ 
state.setParFromDeltaWei(
            args.takerAccount,
            args.outputMarket,
            outputWei.negative()
        );

coverage_0x14d995d8(0x2ed47c8a326af73874f26af93dae52355309303b818ee3532fe55bd8553e5acb); /* line */ 
        coverage_0x14d995d8(0x1d8b17e0acf554e4e972efae294958c2b5b6610a9d516f3db8bf475a3c1acc87); /* statement */ 
Events.logTrade(
            state,
            args,
            inputWei,
            outputWei
        );
    }

    function _liquidate(
        Storage.State storage state,
        Actions.LiquidateArgs memory args,
        Cache.MarketCache memory cache
    )
        private
    {coverage_0x14d995d8(0xaf133c7a725f6dc5f5976561f315475b30d75bbdccdf19131793bf372af7fe20); /* function */ 

coverage_0x14d995d8(0x6b8205add7876118ee8842057708fd8ea116e7f22640ce25c1466412e038116e); /* line */ 
        coverage_0x14d995d8(0xd5f29e6773231d02a46883680210801a2cd646e7c9587e88d99b343f8faf7fc3); /* statement */ 
state.requireIsGlobalOperator(msg.sender);

        // verify liquidatable
coverage_0x14d995d8(0x04361abe09fe7fb254a750f84849ea36487801f3578e9f3d2f7086168af02504); /* line */ 
        coverage_0x14d995d8(0x670e20f1503adeeb213bb2d0f6947d8c6876e228361c83ff70690ea6465c6001); /* statement */ 
if (Account.Status.Liquid != state.getStatus(args.liquidAccount)) {coverage_0x14d995d8(0x35b0d2fba647176b97f7340832f6df38fbe0bb9373ae7e5c35b5db2121c5313a); /* branch */ 

coverage_0x14d995d8(0xee6a392d26385f8963c4aa01080a202393657a745a17759b982a82a577058b2c); /* line */ 
            coverage_0x14d995d8(0x6b4e046b9f07e5aa9ffe5dbf56972d9ff8695bcbf69490018a1a63948ae6b9fa); /* statement */ 
Require.that(
                !state.isCollateralized(args.liquidAccount, cache, /* requireMinBorrow = */ false),
                FILE,
                "Unliquidatable account",
                args.liquidAccount.owner,
                args.liquidAccount.number
            );
coverage_0x14d995d8(0x7712ec8a53494203447d04a232a123e8d9f2f8642768ae32cd641f82fe4e4b4d); /* line */ 
            coverage_0x14d995d8(0xf5029a088d91e2fdfa00b9cf4ef29a0aad11a201970476aa8c888d57ef0b963a); /* statement */ 
state.setStatus(args.liquidAccount, Account.Status.Liquid);
        }else { coverage_0x14d995d8(0xe5a24ba9b55012278fad93598d081b27c66ec98da55d25032fb0df10e11dc5a5); /* branch */ 
}

coverage_0x14d995d8(0x77994ec1cd34405943e5a55fc8f4f8ce744d8254c4792c13a08a94fdc55cace4); /* line */ 
        coverage_0x14d995d8(0xcae0dcdf8c432f6c76c12ee64154460b6f952dced0e52b2b0a88c1f886b0b3e4); /* statement */ 
Types.Wei memory maxHeldWei = state.getWei(
            args.liquidAccount,
            args.heldMarket
        );

coverage_0x14d995d8(0x7785233d179c20322056cec3f4b930573baa07f44f503ef85a9f2a810a29230d); /* line */ 
        coverage_0x14d995d8(0x1be8f78005bb09187eb39f5e8c6b13a5c5ac557e2aab44e2107f562a68b33c47); /* statement */ 
Require.that(
            !maxHeldWei.isNegative(),
            FILE,
            "Collateral cannot be negative",
            args.liquidAccount.owner,
            args.liquidAccount.number,
            args.heldMarket
        );

coverage_0x14d995d8(0x302e106fbe05ee5221ee6636decc18e78c4da9631535dd9f2f2930c5cc8b419b); /* line */ 
        coverage_0x14d995d8(0x279b1f39a6163686e86cbdbc188a8c6828ba07cf2afd9a31787681a362484419); /* statement */ 
(
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.liquidAccount,
            args.owedMarket,
            args.amount
        );

coverage_0x14d995d8(0xc923eb53118cb6f0b3142d1775ddf8f149de4630aa7e02981f94a1eca02dae2e); /* line */ 
        coverage_0x14d995d8(0x5574a035b40b32875a0c79ac36a599ff80b74657974cf8876880caafbacce212); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPriceAdj
        ) = _getLiquidationPrices(
            state,
            cache,
            args.heldMarket,
            args.owedMarket
        );

coverage_0x14d995d8(0x266ac1b89ee6a770150b63cc34383658db1d67527a9cba059a2e657b73a01109); /* line */ 
        coverage_0x14d995d8(0x146bf61dde07e1adfa0180aa6849a84318a43e52030406c01adcdf9eb82b3430); /* statement */ 
Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPriceAdj);

        // if attempting to over-borrow the held asset, bound it by the maximum
coverage_0x14d995d8(0xab77c7050f2434126c874f0da88c2636f51b5008de075bdd2c3132ab95ee658d); /* line */ 
        coverage_0x14d995d8(0x525f2488125c2a21729b6ef97d70bf0042c09406175bf4527c60bc537c2e70be); /* statement */ 
if (heldWei.value > maxHeldWei.value) {coverage_0x14d995d8(0x7082d033750e4b7134fb331507e70b88d238c88ee149ee464e3c1ac39b2745da); /* branch */ 

coverage_0x14d995d8(0x627a87f346372e02365fea4684c4ee1114bc9e8528ce7f47bd6c2feec8365c2b); /* line */ 
            coverage_0x14d995d8(0xc6e457a907e83eaab1f2e7920e061dfe569e7247bdcd1c1d9c33cb9d4626cb65); /* statement */ 
heldWei = maxHeldWei.negative();
coverage_0x14d995d8(0x127a6575694632ab0ae46c5862750a290d9e7799879a3b87653e2e33fc327a78); /* line */ 
            coverage_0x14d995d8(0xf85b171abad74d32cfb041c42eb9f4d0d96635496f2f5db23681f2bb1b1f67f0); /* statement */ 
owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPriceAdj);

coverage_0x14d995d8(0xae3d431371533230fffedef1efa49966beec9aee509db9fb10c70dc4d7f16733); /* line */ 
            coverage_0x14d995d8(0xe9fab3d91d99d7a9e38a62a00713acab53faa0415e71db819696fb4f455a70a8); /* statement */ 
state.setPar(
                args.liquidAccount,
                args.heldMarket,
                Types.zeroPar()
            );
coverage_0x14d995d8(0x3e6efda14eab16509ed98c1294b165e42651d75b4ac7066d5bb2a4fb2e90691c); /* line */ 
            coverage_0x14d995d8(0x67cc132a61400db41cc5e3fbfed2e1370e6d7562d519ee8b755350b70a4deb76); /* statement */ 
state.setParFromDeltaWei(
                args.liquidAccount,
                args.owedMarket,
                owedWei
            );
        } else {coverage_0x14d995d8(0xd02aac0b6c5f48f48872a212cc0bb6c8897cf0d6833adcef02a4be173c1be218); /* branch */ 

coverage_0x14d995d8(0x4b622a30aeb90667adf5930c31196d4071e2962a3374798b2dc39af9491504df); /* line */ 
            coverage_0x14d995d8(0x60565a322c79ba3d22360852599f749b00a3692a565ff78808a00ff62ee01dd3); /* statement */ 
state.setPar(
                args.liquidAccount,
                args.owedMarket,
                owedPar
            );
coverage_0x14d995d8(0xeb92c4e5e1741c8fc9c384a450c7caf5a81daaad3216f714cfa64a244fb2d7e5); /* line */ 
            coverage_0x14d995d8(0xb741c45e6eafbb026e6228094f46661636467ddb47c5857b8a500b894196df88); /* statement */ 
state.setParFromDeltaWei(
                args.liquidAccount,
                args.heldMarket,
                heldWei
            );
        }

        // set the balances for the solid account
coverage_0x14d995d8(0xe177fe3011a33fc4a1cef5ebcc2b6e47985df6f9451dfb32e0e72e32b550eaf1); /* line */ 
        coverage_0x14d995d8(0xeb6c48fb17160c78142316c6401583f2f818e1d1f452dde9318b5353bb636d08); /* statement */ 
state.setParFromDeltaWei(
            args.solidAccount,
            args.owedMarket,
            owedWei.negative()
        );
coverage_0x14d995d8(0xd8a542296484093c4e637ddad358e2ae4e1ff9b0da946a7c662cd15275cf1954); /* line */ 
        coverage_0x14d995d8(0xd5751eb29fd1834826a6368a751162d75bc46f8f9d2c2f474454a3453ba510f9); /* statement */ 
state.setParFromDeltaWei(
            args.solidAccount,
            args.heldMarket,
            heldWei.negative()
        );

coverage_0x14d995d8(0x2a036d3afe7ded03d67f3ec844669e9700cea7098c46aa732d86db405efe3e1b); /* line */ 
        coverage_0x14d995d8(0x42f7593fbe8fe6018f45e6f805a8ecfd16170c9ba473bb5b3fcb546a026cfd09); /* statement */ 
Events.logLiquidate(
            state,
            args,
            heldWei,
            owedWei
        );
    }

    function _vaporize(
        Storage.State storage state,
        Actions.VaporizeArgs memory args,
        Cache.MarketCache memory cache
    )
        private
    {coverage_0x14d995d8(0x23a63b17f2e1670a0906719681974275360cee1d6d968887452624aef6f09a6e); /* function */ 

coverage_0x14d995d8(0xddc37bba2c2f78feafe4655fd0cc18ca41cba1cf04d997d1dce882971b28d636); /* line */ 
        coverage_0x14d995d8(0x54bbdbf150d04388ea282e90f873b0b657eb2931d26479c8bb6f683c1fffe648); /* statement */ 
state.requireIsOperator(args.solidAccount, msg.sender);

        // verify vaporizable
coverage_0x14d995d8(0x33d25e313308373f148f0e530e1846f84f9887e5e795a13b3490446c701008bf); /* line */ 
        coverage_0x14d995d8(0x5a1b76a59fd61bd06d880d2a0b8dd05c2629348eeea415f6e7d893ff5ab53398); /* statement */ 
if (Account.Status.Vapor != state.getStatus(args.vaporAccount)) {coverage_0x14d995d8(0xbad04b17a889a2216e1995270d2e9278ea8dc589e7d9ee6bc4da6e60516596c2); /* branch */ 

coverage_0x14d995d8(0x83d93a9adda543d9d130353e03f9001642797ede04a64c95bdf6187a38596f6b); /* line */ 
            coverage_0x14d995d8(0xd6ffeb8bfa070b7f0807dc14cee42925e1e676f9621f84e9c7fcd6b27a7d5791); /* statement */ 
Require.that(
                state.isVaporizable(args.vaporAccount, cache),
                FILE,
                "Unvaporizable account",
                args.vaporAccount.owner,
                args.vaporAccount.number
            );
coverage_0x14d995d8(0x048ec7756453fa06caa285246ef3e32ba98040d79f9f782706923794a023e58f); /* line */ 
            coverage_0x14d995d8(0x7ec121d11f56d376a7c01ba8a51540371ed809d0e2473732dc66f49c14b3fc7c); /* statement */ 
state.setStatus(args.vaporAccount, Account.Status.Vapor);
        }else { coverage_0x14d995d8(0xf5864729eb5865c686b6411f72d143f2152c71f2711a3d842fd3af9c970cf606); /* branch */ 
}

        // First, attempt to refund using the same token
coverage_0x14d995d8(0x18d0a313ebc712c438a334a7cff02d5db14f81e3a31a2cc43c78472b9b41d3b4); /* line */ 
        coverage_0x14d995d8(0xb0fc274b6a3e09dd1d65a1155df037d3427378cdd752bed9f29266f83a98ff85); /* statement */ 
(
            bool fullyRepaid,
            Types.Wei memory excessWei
        ) = _vaporizeUsingExcess(state, args);
coverage_0x14d995d8(0x0e8d4763f481ac6bf6b203aa41ca971c0739722bf8d2e932d7e4c3faa55b7ce7); /* line */ 
        coverage_0x14d995d8(0xf111ee006ade266c597bc44f9994ef1ee0697246b3fc5c1b232527a20cb1f812); /* statement */ 
if (fullyRepaid) {coverage_0x14d995d8(0x8c03e9f863ff0b4d988f956f1e21702f893dc8eee179693226519e91cec775a3); /* branch */ 

coverage_0x14d995d8(0x4888ab653b19c547db8f0df9dbb820e988349c090e7d69f9d1076871a410ab0c); /* line */ 
            coverage_0x14d995d8(0xc81d6ba7c26f03666238a34d16d338acd4813fc2c2cc2668c8c7c07c53ce9f58); /* statement */ 
Events.logVaporize(
                state,
                args,
                Types.zeroWei(),
                Types.zeroWei(),
                excessWei
            );
coverage_0x14d995d8(0x488a4ccfc94bc44bc7cd64286444c98b318c44bee8b4e5d28812d462b530a03d); /* line */ 
            coverage_0x14d995d8(0x0ac09334a0362d0d8f6b3bf8844a11c20a9def734f6e80a9d57656d8ab1c6fbb); /* statement */ 
return;
        }else { coverage_0x14d995d8(0x68a759548a432be699b2683cbaa773ae47ab8df3bfebb1d5fccf4798681ff7ca); /* branch */ 
}

coverage_0x14d995d8(0xa980c0435709abe611f23fc1e1bd2a52b9b682cdcdfd06a4dcb31844b7ee8afd); /* line */ 
        coverage_0x14d995d8(0x8eee843e83a4baf6318bf7f4b6d96992feb94659285ddbe2631fbde00c4da6f3); /* statement */ 
Types.Wei memory maxHeldWei = state.getNumExcessTokens(args.heldMarket);

coverage_0x14d995d8(0x45ebac743af9bdf80b5fc6a9417dbb226baf8c4411e056a9321ccd9a4163d008); /* line */ 
        coverage_0x14d995d8(0x340f062f547fab2ad6f56be1fc4ea9a0f05ca84889fd6c3d66b41b01911990f9); /* statement */ 
Require.that(
            !maxHeldWei.isNegative(),
            FILE,
            "Excess cannot be negative",
            args.heldMarket
        );

coverage_0x14d995d8(0x4020e7882ce27299930b30df973c416837e92964febdaf9f9a077bbc108ebd94); /* line */ 
        coverage_0x14d995d8(0x9f0ebffacf69e97174102ea226e635aab759a35c38f3a9310d39a1286aed41e3); /* statement */ 
(
            Types.Par memory owedPar,
            Types.Wei memory owedWei
        ) = state.getNewParAndDeltaWeiForLiquidation(
            args.vaporAccount,
            args.owedMarket,
            args.amount
        );

coverage_0x14d995d8(0xdad9665368ec9133c3a295ba5b8dfbdb05a04dcea68413b6221bb7f984330d8f); /* line */ 
        coverage_0x14d995d8(0x4ad1c0c0d62857eb526a77e1c97991eb2023cdad047937d8fe53dc23492da4fa); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = _getLiquidationPrices(
            state,
            cache,
            args.heldMarket,
            args.owedMarket
        );

coverage_0x14d995d8(0xdf9927ad15da0f8a25bac0e137ec5eb7e48d6a63025a3d2d70057f7740d32081); /* line */ 
        coverage_0x14d995d8(0x30ee50a0e0c60e7ca2e2c62928210ec557a15d5d90cb8eff4badc5e47e3abf41); /* statement */ 
Types.Wei memory heldWei = _owedWeiToHeldWei(owedWei, heldPrice, owedPrice);

        // if attempting to over-borrow the held asset, bound it by the maximum
coverage_0x14d995d8(0xb0cbe56c09dd9eb7d8486a0b14abf678afe2b8a40afbaff330221a1fff2de5d5); /* line */ 
        coverage_0x14d995d8(0x39e402ca8fd4b85d79fc45fd29ae26d28dbc7f9d33ceda332efe409652b9e861); /* statement */ 
if (heldWei.value > maxHeldWei.value) {coverage_0x14d995d8(0xcf3d17f6ab6d86a9773499329747785850be3a2f2bcf724591fbfd4fd469a0bc); /* branch */ 

coverage_0x14d995d8(0xde7c6d068431ba898056b60c2341498aa4e61d46b88cb9153099e64fd4bfed03); /* line */ 
            coverage_0x14d995d8(0x6b52cfdd395c9a3390257f407088201ccafcec6c66c09ec036e83cecaf18d07a); /* statement */ 
heldWei = maxHeldWei.negative();
coverage_0x14d995d8(0x9f5fbd6bf2b83a1dac561a454c83c6be7225bcf3ec5f5e6ad29d1260bfbe6559); /* line */ 
            coverage_0x14d995d8(0x1a9139884dd373bdd8828413f45caafdd2acc250ba17855ed17b7bc9c2f45bf3); /* statement */ 
owedWei = _heldWeiToOwedWei(heldWei, heldPrice, owedPrice);

coverage_0x14d995d8(0xb1115a80085a5f8b69c799a0dd420fa9d96d019d2ae7588fa50bb03388e25e9c); /* line */ 
            coverage_0x14d995d8(0x36f15da97a1807faaba97c8217e0573b8f558a67b425ae187e5897598fd53baa); /* statement */ 
state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMarket,
                owedWei
            );
        } else {coverage_0x14d995d8(0x701070e646d7226a0088065e4818d3d09be0f31d9c7105fd26d270b5085cb382); /* branch */ 

coverage_0x14d995d8(0xbeb867e0937cf9243d104634d28a63b7869f59844787890ca60cade3dc34a25c); /* line */ 
            coverage_0x14d995d8(0x1830b5c8e1b3e8db0ef73e6df10d4f1c07589e4a60486f6e73d0fe7c184145dd); /* statement */ 
state.setPar(
                args.vaporAccount,
                args.owedMarket,
                owedPar
            );
        }

        // set the balances for the solid account
coverage_0x14d995d8(0x624680507ba157e09682a6c99793572d6c47d689f2f60a5e4435d8c08bc0aae6); /* line */ 
        coverage_0x14d995d8(0xe38d1f025e37105d417a72568d22907b959b7c49d6b48d89e1c441f33c4c0688); /* statement */ 
state.setParFromDeltaWei(
            args.solidAccount,
            args.owedMarket,
            owedWei.negative()
        );
coverage_0x14d995d8(0xef0ab0a8e83b86d0a475627a2d1d8406e79b4428f9c784e0818b9185e1cee25c); /* line */ 
        coverage_0x14d995d8(0x957e28520a915bf51e207797a907173ccff25e33ccc59e61ba5dce8ec6ff1911); /* statement */ 
state.setParFromDeltaWei(
            args.solidAccount,
            args.heldMarket,
            heldWei.negative()
        );

coverage_0x14d995d8(0x00e0c39e56fce34308e0279137ceb2d0acbd23499a69ac426c3a0231a95e3788); /* line */ 
        coverage_0x14d995d8(0xfb08d1871506a2dea90c4677a0d179d8d1616cdb9089fb61bd02f79b8649f878); /* statement */ 
Events.logVaporize(
            state,
            args,
            heldWei,
            owedWei,
            excessWei
        );
    }

    function _call(
        Storage.State storage state,
        Actions.CallArgs memory args
    )
        private
    {coverage_0x14d995d8(0xf208487b7fdef0fdef95c8f51b8abd2d93c161e2319510f4b8cf1ce87ec170e6); /* function */ 

coverage_0x14d995d8(0xacba2e1363a3d328e111235b93413f4fab949390b2af4365c5effad0548e3fd2); /* line */ 
        coverage_0x14d995d8(0x929453c4c39ab7b4e9fe720d0532f75e8ae25954ba44e39f9a0068c98347b446); /* statement */ 
state.requireIsOperator(args.account, msg.sender);

coverage_0x14d995d8(0x96f5c13b14233d7909aefbc04229cebff138a8c6b6aec2b54b521eea7131ec6c); /* line */ 
        coverage_0x14d995d8(0xfa8e5b5373cd82fc9920b26e26465f644dab6b05439b931c31798efe9cdd1666); /* statement */ 
ICallee(args.callee).callFunction(
            msg.sender,
            args.account,
            args.data
        );

coverage_0x14d995d8(0x664db0bfd21ea8efa0ec9f557cebbd1b9b641cfbdf1f62b73a8b66421e5cde84); /* line */ 
        coverage_0x14d995d8(0x0910ca6fad5ab6902a47dbe1d8022467af32814851d3007c074291f288687d6e); /* statement */ 
Events.logCall(args);
    }

    // ============ Private Functions ============

    /**
     * For the purposes of liquidation or vaporization, get the value-equivalent amount of heldWei
     * given owedWei and the (spread-adjusted) prices of each asset.
     */
    function _owedWeiToHeldWei(
        Types.Wei memory owedWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
        private
        pure
        returns (Types.Wei memory)
    {coverage_0x14d995d8(0x630510e008ff1cd4b82cd67178ae2c21173b57d39147812980b1a13eb3bc0083); /* function */ 

coverage_0x14d995d8(0xc9dacc255c86ef8a0f92c8204335513f7763b7417655fbcc6d8c90eea29192d2); /* line */ 
        coverage_0x14d995d8(0xd57571e16c5774f8037e8e4a9ff7f8646a861e66e78af16632d8b1aa4ff2a3a5); /* statement */ 
return Types.Wei({
            sign: false,
            value: Math.getPartial(owedWei.value, owedPrice.value, heldPrice.value)
        });
    }

    /**
     * For the purposes of liquidation or vaporization, get the value-equivalent amount of owedWei
     * given heldWei and the (spread-adjusted) prices of each asset.
     */
    function _heldWeiToOwedWei(
        Types.Wei memory heldWei,
        Monetary.Price memory heldPrice,
        Monetary.Price memory owedPrice
    )
        private
        pure
        returns (Types.Wei memory)
    {coverage_0x14d995d8(0x3ac75ca90326f028ae5e9a774be320d90b7e89e1d48b379e2d9999d6e784a4a6); /* function */ 

coverage_0x14d995d8(0x7979b0f9206d06ad19f2f5aaee4840c3ef4ba56f31b913807649faef27ef9c3c); /* line */ 
        coverage_0x14d995d8(0x3d7917f834b90a0f0cb07a565bcbc0e38074c004c1160cfe0a14a53bd0e4c588); /* statement */ 
return Types.Wei({
            sign: true,
            value: Math.getPartialRoundUp(heldWei.value, heldPrice.value, owedPrice.value)
        });
    }

    /**
     * Attempt to vaporize an account's balance using the excess tokens in the protocol. Return a
     * bool and a wei value. The boolean is true if and only if the balance was fully vaporized. The
     * Wei value is how many excess tokens were used to partially or fully vaporize the account's
     * negative balance.
     */
    function _vaporizeUsingExcess(
        Storage.State storage state,
        Actions.VaporizeArgs memory args
    )
        internal
        returns (bool, Types.Wei memory)
    {coverage_0x14d995d8(0xc1b039824392021de98ca47ceed63de0dde46179f30a463024142a0603d49b01); /* function */ 

coverage_0x14d995d8(0xb49524c75078603b96879b3ff153c136a0620c228c18e8c21f014461ff4c0988); /* line */ 
        coverage_0x14d995d8(0xbb7bdf5f79befeb6c4656c905abd06df795c7afdb2d78364b9206d8239b52825); /* statement */ 
Types.Wei memory excessWei = state.getNumExcessTokens(args.owedMarket);

        // There are no excess funds, return zero
coverage_0x14d995d8(0xa05ad0b22f3e2230791a56820602fb80f25c8e2ea35f79bc497d92a92ee20b04); /* line */ 
        coverage_0x14d995d8(0x8e43bd34636a5cabfaaad20c43c0c0926d6cf9eb388dfee80a067aacdea6857c); /* statement */ 
if (!excessWei.isPositive()) {coverage_0x14d995d8(0x84d6f2869c524e9d2831054eebf75387a72d8df491c64d28eca6eec582407854); /* branch */ 

coverage_0x14d995d8(0xa4af944c72ef3f85d26a57e9c1e0127f08dc89ba3dc899342abee7648da9d633); /* line */ 
            coverage_0x14d995d8(0x0a4bc8eadcb1d1f1efe9f8b036f73d1fceda23a3e0814b369c875e2b123dbef6); /* statement */ 
return (false, Types.zeroWei());
        }else { coverage_0x14d995d8(0xad1c7de779ba546bb5bc1d02203c017d866bc308e97bad23e3e122a12e3d6279); /* branch */ 
}

coverage_0x14d995d8(0x8a7bba10e7cecb701ee426e9445085b35d4398db992d363061d1b78bc90cca69); /* line */ 
        coverage_0x14d995d8(0x2b03613963a0ed3335241cfac099d2556bd2e59a04d5fa6f7e2525f1f8104b97); /* statement */ 
Types.Wei memory maxRefundWei = state.getWei(args.vaporAccount, args.owedMarket);
coverage_0x14d995d8(0x2cc6e19abf1d13fcb446f759ce975723b5862ff6432b5d481205ab88b15fb8ee); /* line */ 
        coverage_0x14d995d8(0x26d5d80e0a00b27aef5d1bc211d39f21fd428227838a4325016b945090b09770); /* statement */ 
maxRefundWei.sign = true;

        // The account is fully vaporizable using excess funds
coverage_0x14d995d8(0x1594f5dfa1ede2ae143e3abc12ed5457c6b01ecee28e3cd01c192e88db966b19); /* line */ 
        coverage_0x14d995d8(0x3e30843f6ff4de7d7eb9a13eea4a57e10972fa5a2a39a51a6cc59192253fd391); /* statement */ 
if (excessWei.value >= maxRefundWei.value) {coverage_0x14d995d8(0xe6b487a56c2c122e80b00cf50caae94d452ed4aaa6b9f9cbf51c789eef5a02be); /* branch */ 

coverage_0x14d995d8(0xed6f48a1ad69d7050bb22aafd57f4d0e10522205dc8b438bb5c35f966221c0ca); /* line */ 
            coverage_0x14d995d8(0x9ecc738ebc6d41f076d96b0b3d417ebb4cc06c9de6e1046279de6621affe955f); /* statement */ 
state.setPar(
                args.vaporAccount,
                args.owedMarket,
                Types.zeroPar()
            );
coverage_0x14d995d8(0x921f1546f32fa4120841518e56b8c00bf59f70807a39808c7c152ff282ed8332); /* line */ 
            coverage_0x14d995d8(0x056330027fa3f26b2707c54edad0ec31b78f275cf82f0c9847a238049200436c); /* statement */ 
return (true, maxRefundWei);
        }

        // The account is only partially vaporizable using excess funds
        else {coverage_0x14d995d8(0xaf210a54edf727d7d0ee47c7df00ddfabeae7b418ff4870fd22cdf5d8d4568c8); /* branch */ 

coverage_0x14d995d8(0xfb71544f7ed61680320acfec2350e8473317203cf89799508e08841098dbdbb3); /* line */ 
            coverage_0x14d995d8(0x075580a9f446e916345fdde353c5b1205aef4041b370d15c947bf52b3a31cca6); /* statement */ 
state.setParFromDeltaWei(
                args.vaporAccount,
                args.owedMarket,
                excessWei
            );
coverage_0x14d995d8(0x8667b5c69b4c6b8cebf01f3206a4230a550cac1e964d002fe760e2702f3873d0); /* line */ 
            coverage_0x14d995d8(0x1fb1e456b52f625aab7eeba9441b309374db005af3de34247f589843c9f322dc); /* statement */ 
return (false, excessWei);
        }
    }

    /**
     * Return the (spread-adjusted) prices of two assets for the purposes of liquidation or
     * vaporization.
     */
    function _getLiquidationPrices(
        Storage.State storage state,
        Cache.MarketCache memory cache,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        internal
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {coverage_0x14d995d8(0x5d2971c1f27278194abae8d47c9e78975ce05917696cc600390ad49b42990eaf); /* function */ 

coverage_0x14d995d8(0x6fa9a151e47874403f5d112a23847f73fbee3139f74655f9637dcfa81091070f); /* line */ 
        coverage_0x14d995d8(0x2e7439bab0af8da79891b3415576b1ad73d8436ede6d5ec5e91f4f9c3ad09913); /* statement */ 
uint256 owedPrice = cache.getPrice(owedMarketId).value;
coverage_0x14d995d8(0x13688d7c144551b4740d6c94fcb4d32ec8304a6531ad81fd069753fdb05ebabb); /* line */ 
        coverage_0x14d995d8(0xfdaec2558828f7960a879c31c4972927cf6d73cbfe450136998dffb445bd7483); /* statement */ 
Decimal.D256 memory spread = state.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

coverage_0x14d995d8(0x185bdbd5e33aa68df3e5c967c37efba43ea5eebe38c28cf8bc1541288e942d3b); /* line */ 
        coverage_0x14d995d8(0x57e94e1359972e28dd22187bafbbdb1bb75e4512fb4e45753551eb495520f326); /* statement */ 
Monetary.Price memory owedPriceAdj = Monetary.Price({
            value: owedPrice.add(Decimal.mul(owedPrice, spread))
        });

coverage_0x14d995d8(0x464181135486bba3b9847ed52d77ee7481c582c3b5b864a6d2e0b736bc5f40ec); /* line */ 
        coverage_0x14d995d8(0x6e526bba3ebcaf5d08be837fba421254b7a72c4fc515e5bff599914c8138291a); /* statement */ 
return (cache.getPrice(heldMarketId), owedPriceAdj);
    }
}
