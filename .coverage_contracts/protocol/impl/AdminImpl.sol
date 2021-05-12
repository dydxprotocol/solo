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

import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Decimal } from "../lib/Decimal.sol";
import { Interest } from "../lib/Interest.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Storage } from "../lib/Storage.sol";
import { Token } from "../lib/Token.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title AdminImpl
 * @author dYdX
 *
 * Administrative functions to keep the protocol updated
 */
library AdminImpl {
function coverage_0xc4529909(bytes32 c__0xc4529909) public pure {}

    using Storage for Storage.State;
    using Token for address;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "AdminImpl";

    // ============ Events ============

    event LogWithdrawExcessTokens(
        address token,
        uint256 amount
    );

    event LogAddMarket(
        uint256 marketId,
        address token
    );

    event LogSetIsClosing(
        uint256 marketId,
        bool isClosing
    );

    event LogSetPriceOracle(
        uint256 marketId,
        address priceOracle
    );

    event LogSetInterestSetter(
        uint256 marketId,
        address interestSetter
    );

    event LogSetMarginPremium(
        uint256 marketId,
        Decimal.D256 marginPremium
    );

    event LogSetSpreadPremium(
        uint256 marketId,
        Decimal.D256 spreadPremium
    );

    event LogSetMarginRatio(
        Decimal.D256 marginRatio
    );

    event LogSetLiquidationSpread(
        Decimal.D256 liquidationSpread
    );

    event LogSetEarningsRate(
        Decimal.D256 earningsRate
    );

    event LogSetMinBorrowedValue(
        Monetary.Value minBorrowedValue
    );

    event LogSetGlobalOperator(
        address operator,
        bool approved
    );

    // ============ Token Functions ============

    function ownerWithdrawExcessTokens(
        Storage.State storage state,
        uint256 marketId,
        address recipient
    )
    public
    returns (uint256)
    {coverage_0xc4529909(0x29dc10423b7cb5cc2bf6dd22cd1e5e2a062b0fbc052c031ad054220346e2d329); /* function */ 

coverage_0xc4529909(0xe7b68567ee80dadd757ba11f28a6cfa5b19833432743883832141370409fcbaf); /* line */ 
        coverage_0xc4529909(0x9524756928a2c54993d143b9f877fcc0e11b520c5a14ed2597e1c5549bc8f205); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0x0fd8719b6d720e41edbfc9ea2fdc783c99f1618c7983c0a7ddb0eb55ffa5b37a); /* line */ 
        coverage_0xc4529909(0x4f6ba7534eeaab1a0519ebd2b2baf7b9550f28326e810f7f9eef48578303375c); /* statement */ 
Types.Wei memory excessWei = state.getNumExcessTokens(marketId);

coverage_0xc4529909(0x8df3d85a3c0bd203acd050aed5ff0c08e96a26c6f6703f97411fa077a69f6fe4); /* line */ 
        coverage_0xc4529909(0x66d2c78bc1f7e8992052e97f870235885d42ffc8d757bca470a28963a7a476da); /* statement */ 
Require.that(
            !excessWei.isNegative(),
            FILE,
            "Negative excess"
        );

coverage_0xc4529909(0x225d4c7019be7c188cae17c5209e0308f382ff42f30b3a16bed1f8a238974e2e); /* line */ 
        coverage_0xc4529909(0x38b09eee481f921e657499716730fc999f1bf4f69a1ac7c99d70c57549609ad1); /* statement */ 
address token = state.getToken(marketId);

coverage_0xc4529909(0x594f049d3691b1bf73837776fb83bc23dfe425cdaa247fc6e218273d60640a86); /* line */ 
        coverage_0xc4529909(0xe574b4db2a60c5973f4ca1a1045afa5ddec05009b4f0f481d2a809aeadc6f5ef); /* statement */ 
uint256 actualBalance = token.balanceOf(address(this));
coverage_0xc4529909(0x35e5a501f5df427f284d1f073bb2c40f27d12f561b4a4a9b7bd883a8e783a755); /* line */ 
        coverage_0xc4529909(0x22d520458c83493210bcbf8ab270fc162982a91da4a373e498a520c41489f27b); /* statement */ 
if (excessWei.value > actualBalance) {coverage_0xc4529909(0xffd9bd5a6a702f0d3846725e91b564cff8d92f48d5f6134c1db3c9297c8cfd1c); /* branch */ 

coverage_0xc4529909(0x1fe2da61c9e0b9e88fe27ecd7d6c5cc02f09ff7b14be71abfb5e6972bd2a92bb); /* line */ 
            coverage_0xc4529909(0xf6536a1d20bb80a453ed200f6663435dd55c8559ac9511b74b320b6f0e006f6d); /* statement */ 
excessWei.value = actualBalance;
        }else { coverage_0xc4529909(0xcf34cbf662b606b641eb6bc5b948f5fd73fae4eb076243f2dbf077bfc6108534); /* branch */ 
}

coverage_0xc4529909(0x7993ff2aab2ffd28bd848a2fbb42de2ecaa8dc656cb9c1dfc1f2f40a92e7239e); /* line */ 
        coverage_0xc4529909(0x82b6080efaf7a2d4a1d096cfb3ccfbab6b2cc9349878b1e3de28a9ad8b92c266); /* statement */ 
token.transfer(recipient, excessWei.value);

coverage_0xc4529909(0xb602dc9b5bbfc45b6da753fb6ba21146f02586b018797428fbb7b487551781b3); /* line */ 
        coverage_0xc4529909(0x996fb9b3d0aa09d1e5554ecafed2d77cf39c5503ab3b2371191184f1a7e0c15e); /* statement */ 
emit LogWithdrawExcessTokens(token, excessWei.value);

coverage_0xc4529909(0xcb6fc208ffc3debb6b2bda4128ca2543bf33f0a5398850f8a807b307baa7f08d); /* line */ 
        coverage_0xc4529909(0x7d90bdcdaa0e8481bb601a0e28da3c6fec7b4d9887a095aee6c45b13ea7e3126); /* statement */ 
return excessWei.value;
    }

    function ownerWithdrawUnsupportedTokens(
        Storage.State storage state,
        address token,
        address recipient
    )
    public
    returns (uint256)
    {coverage_0xc4529909(0x6037ec16a72d91abfeb4a780b5071112d67ee5a7c7e175a6cb36d8d0be1e53bf); /* function */ 

coverage_0xc4529909(0xd9df375c7bf7f8680bad2f9c0623bdf9862df24c70e0e56ec257695200111ca5); /* line */ 
        coverage_0xc4529909(0x81fea4ec548cfda0664accbcde9159507d623f30f57878c4bc13fade28e89543); /* statement */ 
_requireNoMarket(state, token);

coverage_0xc4529909(0x3b3a5b50743657bc1698380f8efbe621b65e37d48b75bfd7acdbd12b09bffc84); /* line */ 
        coverage_0xc4529909(0xe06f30398ac5d7644a3c1182d6185a091d543d6cebceafa48d5cf050797cedfc); /* statement */ 
uint256 balance = token.balanceOf(address(this));
coverage_0xc4529909(0x9856a0be5a628ca8fac04f6eb66faddfdee3f094b5c8fc027593cc53637cdf63); /* line */ 
        coverage_0xc4529909(0xd057512ec3b0b45543b7209a520999d8dd4c5acc1a691b8f65709f4c71482e13); /* statement */ 
token.transfer(recipient, balance);

coverage_0xc4529909(0xf325cb90f5362a0ae6d2bc1e06db25c5adf74140ddff30af9449678e241f822b); /* line */ 
        coverage_0xc4529909(0xa3d743f181564f3475bb994388e9136b1e4d968eb4b4125fab2025a3764dc28b); /* statement */ 
emit LogWithdrawExcessTokens(token, balance);

coverage_0xc4529909(0xbdfefdf5b54269f2701f6be7761d23a65591ce4050052f599a2e4d3670e0b726); /* line */ 
        coverage_0xc4529909(0x896cd6678ed23773d392c68446096227fd7e42cb714766961e3d3eb7e3719676); /* statement */ 
return balance;
    }

    // ============ Market Functions ============

    function ownerAddMarket(
        Storage.State storage state,
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter,
        Decimal.D256 memory marginPremium,
        Decimal.D256 memory spreadPremium,
        bool isClosing
    )
    public
    {coverage_0xc4529909(0x903348bd3e69b77b48b6ed02b9313309d5c82f75bcdf5b139b9d0a9e0c6d0834); /* function */ 

coverage_0xc4529909(0x71d6c6e953189b727c2cbc7658ecb07e8da3694ab625564b644f487533a5ec16); /* line */ 
        coverage_0xc4529909(0xb35f07becfa6597d3513f7dfe030684b5d2724de1243cec7db49473f1dff7065); /* statement */ 
_requireNoMarket(state, token);

coverage_0xc4529909(0x1de5695fc4cedb8c5fcf028c378f0e44a07d82301f50600c110b70eb0b650a65); /* line */ 
        coverage_0xc4529909(0x862510c1cec521c6f55e084a5eaa890f1d1da20d1db72c9463881713e297565d); /* statement */ 
uint256 marketId = state.numMarkets;

coverage_0xc4529909(0x28c89fb7fd0021ebb3c2bbce1d5119620a56e95802fb80cfab871a707d186b67); /* line */ 
        state.numMarkets++;
coverage_0xc4529909(0xf3a5ad3fa44942409a2da8463068a8c0dbfcc5f5ea88cd58b8c4a1d1139166ab); /* line */ 
        coverage_0xc4529909(0x53fe05b1ef0f061f188f4ebe8096a9612c2bcd85fe1d307beda0b7d143a64ab0); /* statement */ 
state.markets[marketId].token = token;
coverage_0xc4529909(0x4f19abc773c3f889b095cdf2ff7416347c5ad303345befe85f43d56652e793ca); /* line */ 
        coverage_0xc4529909(0x29b0a2cae02d9839663ff380c636444e9a6677755529de6128fac4e71704bf61); /* statement */ 
state.markets[marketId].index = Interest.newIndex();
coverage_0xc4529909(0x98756ba9c75b27bac6f6faccc938f8751e74ceceb874c995c4af6a0bb59dc5fe); /* line */ 
        coverage_0xc4529909(0xe5dfc6442f6f749d137371f5c96dae4d4fd9d6766263c5efc2d34cc6c8c6eecc); /* statement */ 
state.markets[marketId].isClosing = isClosing;
coverage_0xc4529909(0x592cd9a4dbcd201bcf451b0776149a3d903ef4bc626095ffd16af8ec4f3dc0fb); /* line */ 
        coverage_0xc4529909(0x72fdf2f8574f33b3ef7cc51039a87987aa35c0d9776123cd11b529de2572a3d0); /* statement */ 
state.tokenToMarketId[token] = marketId;

coverage_0xc4529909(0x590c5e4ee2a2506f1c41931c04303183b5b25303cc166ae44f2df765adae6e39); /* line */ 
        coverage_0xc4529909(0xff117f553814c582e177c79ada3157e450f7ba3119666fde943c68fbfd34484d); /* statement */ 
emit LogAddMarket(marketId, token);
coverage_0xc4529909(0xddd6ce8a40f961cb2600767787168994919a5e98691e67136d89bddad9bd7c68); /* line */ 
        coverage_0xc4529909(0x94a9c98675975c109d70cc9187505f1f2d2cf6641c2257b634556fae1a20fb1a); /* statement */ 
if (isClosing) {coverage_0xc4529909(0x92b70de417a19027349b3f851f82be259091995061bdf1cdb3a99c0e2fd2446d); /* branch */ 

coverage_0xc4529909(0xc13ea74c253469a74e0e945f0b6b8f5ab6449803dd273d16c3d52daf66af3fe6); /* line */ 
            coverage_0xc4529909(0x562a27bebf59f64eceeba53e9130b54fef3e1db79df67c40151b7b8e69ea5ca9); /* statement */ 
emit LogSetIsClosing(marketId, isClosing);
        }else { coverage_0xc4529909(0x4476e5107e8b49eb02723544c7744b827a007bf8f777c0f30a7721b9faaf5a43); /* branch */ 
}

coverage_0xc4529909(0xa062d2fd284fbc77591eb1c0a1599d87fec1aae4dface503ceb3fad82c38b85d); /* line */ 
        coverage_0xc4529909(0x7461c436eb555fda59fba5ea6487383c2bfa2433954dfece2b0e3a039228c25e); /* statement */ 
_setPriceOracle(state, marketId, priceOracle);
coverage_0xc4529909(0x2bc02f1542529515ccb529c1f6d31ea951662a64310afa3e25c9ad46efbbc09c); /* line */ 
        coverage_0xc4529909(0xef7b87a080fc7939fa43194211ea4c0cac625c8b5f20ec3be22c5fbb48f4fde2); /* statement */ 
_setInterestSetter(state, marketId, interestSetter);
coverage_0xc4529909(0x3663a5ad3ed1d7730de9a2030fba40f9d3cdff098c5cd8dbe300484417df4502); /* line */ 
        coverage_0xc4529909(0xdd466dc1fb183bae9d5223f7265cdbb0a9081470e016673581da22d45906df00); /* statement */ 
_setMarginPremium(state, marketId, marginPremium);
coverage_0xc4529909(0x20eca0e092a85d8895c5217a22140bfcaeaa5b1ab251b483b1cbe35d4fd59673); /* line */ 
        coverage_0xc4529909(0x8a6428c32f8d40a12e6ee1033d855c57b99a96073e9a960fb005e5cddef983a7); /* statement */ 
_setSpreadPremium(state, marketId, spreadPremium);
    }

    function ownerSetIsClosing(
        Storage.State storage state,
        uint256 marketId,
        bool isClosing
    )
    public
    {coverage_0xc4529909(0xe2b32f9c7d4d9a5850df1cbad34861146d4d7735363bf7c0264ff4536cd6eb70); /* function */ 

coverage_0xc4529909(0x8b6c9a3f0ea515f0e7218e7e498f54a1d2069c05629c7f98342af6f718b6f697); /* line */ 
        coverage_0xc4529909(0xe48ca746036356bec62562fd331c517ce815b3bc5c1e5fc6ae0a91a06e27325f); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0xeb1e62e5a94d79019f873e1dae5be3a6efbe16749ee387f7d6cbf3af7a4b3188); /* line */ 
        coverage_0xc4529909(0x3c58eed215fe4ec63739d01381bfc14cf18a5bb56d6a0cbea50476c51afc8db9); /* statement */ 
state.markets[marketId].isClosing = isClosing;
coverage_0xc4529909(0xacbda4cf9a536932cd9f290c9c24c12a8f22ef7c039d1987e080ee29c6902f99); /* line */ 
        coverage_0xc4529909(0x703d6e606b1e8ca768aa22aa01ada2217cc3d9ecf4bc15953485436fa3f3139a); /* statement */ 
emit LogSetIsClosing(marketId, isClosing);
    }

    function ownerSetPriceOracle(
        Storage.State storage state,
        uint256 marketId,
        IPriceOracle priceOracle
    )
    public
    {coverage_0xc4529909(0x310de09efde2d7ddbadcbb3d6842461c0c8956e3440b7b8cd1d03b6bb6575427); /* function */ 

coverage_0xc4529909(0xacaa6f47e9f9cd7c88bf70cca00e6e97dd767b950642ad8c565e725b73ab1844); /* line */ 
        coverage_0xc4529909(0x90f5c875b27005ed5125ba6d97120827c7bc92caad15ce6b2310dd469f7dae67); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0xd7f52a58af4033ec866064b3d4509ea25fefb513124fb6c6c055aa0bf324e4eb); /* line */ 
        coverage_0xc4529909(0x63e5df3944df5ce51105f0644aced4f187c742f84d8a85e7a593cc5ccc8743a1); /* statement */ 
_setPriceOracle(state, marketId, priceOracle);
    }

    function ownerSetInterestSetter(
        Storage.State storage state,
        uint256 marketId,
        IInterestSetter interestSetter
    )
    public
    {coverage_0xc4529909(0x40c7b1ecc7e8ebdc21afd6d61e208d4205532b998c53b625d6a2ea9bb4a41854); /* function */ 

coverage_0xc4529909(0x9b5e5ef338e3fd8a5c46acec8a2eb506d4c88be88de6ce5c490cada0d9d97640); /* line */ 
        coverage_0xc4529909(0x3a55fb250f1c3193b88f298786bb42501e0b9350278fde80231d90bf883dba4b); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0x68e6ac1a3e9efa0e5192a40b3b18825448e43f59eb598d22603f23f38b5f1e0b); /* line */ 
        coverage_0xc4529909(0xf8a72ab1f5cf05a8ce9e9d13b1756464ac119c72ac945d0f50a1288c31dfbc6c); /* statement */ 
_setInterestSetter(state, marketId, interestSetter);
    }

    function ownerSetMarginPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
    public
    {coverage_0xc4529909(0x5c2e29cbb93e03d3c2100892e4422a6086f4b3d9d5eb6d830013b56688f9f59f); /* function */ 

coverage_0xc4529909(0x9330fb32174eca3b59b6615cf93d18ab4f0f7cb17777ec1ef0bc3414267ba6de); /* line */ 
        coverage_0xc4529909(0xf397ccf5bf250215fe9419563cf2ef1207e340ae1d55c276bbb8c75e812e9027); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0xd1d0f391d95252ee5b047d6925260cc63659c0d353a8775f64f6bec8f33ac6f0); /* line */ 
        coverage_0xc4529909(0x8e0bb385a8d8d716ac43ca56859894ea51b83ba0a9a269ceed9c90879a5ff7ac); /* statement */ 
_setMarginPremium(state, marketId, marginPremium);
    }

    function ownerSetSpreadPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
    public
    {coverage_0xc4529909(0x1f001d42de591497b76975d1f96f92d1ee62dcad0159d04f11bef9acbafa7dec); /* function */ 

coverage_0xc4529909(0xba80ac60848d15a1035c769e05ed084313264eec058b7b8f35f13b9421d84db1); /* line */ 
        coverage_0xc4529909(0x15c0a2b22c676204ddf38feded5abb67df431d05b3a58bc699e61b6d9fcda34a); /* statement */ 
_validateMarketId(state, marketId);
coverage_0xc4529909(0xd8ca88fb0cfc767df872804463a4be4abf4d5866da7131b419e298c6282f6e3d); /* line */ 
        coverage_0xc4529909(0x267e77cd52090784c053b0e98911b717afcc99cde685831526bf05f64a913b20); /* statement */ 
_setSpreadPremium(state, marketId, spreadPremium);
    }

    // ============ Risk Functions ============

    function ownerSetMarginRatio(
        Storage.State storage state,
        Decimal.D256 memory ratio
    )
    public
    {coverage_0xc4529909(0xce7a5ecaa16d25120ac335e483e511ffc5fe85d7b68fbd63ffdc0e2f7aac896b); /* function */ 

coverage_0xc4529909(0x1497641f62ec588363437e6f1f2a9d86e19fb7dcac9d5585dab30075f2569310); /* line */ 
        coverage_0xc4529909(0x7cff237a77389445191468345c9835d40859cbfde658650ef4bcfad4b9dc83a2); /* statement */ 
Require.that(
            ratio.value <= state.riskLimits.marginRatioMax,
            FILE,
            "Ratio too high"
        );
coverage_0xc4529909(0x264b141411317d5d6262bb3e63cf452afa5270e48bb5530c1942a80f0f2d446b); /* line */ 
        coverage_0xc4529909(0x36bdb2b94051c7dbe4e27b3a6a417e5c1d25cf6c39e2a66e2d0e9e28f9e9d116); /* statement */ 
Require.that(
            ratio.value > state.riskParams.liquidationSpread.value,
            FILE,
            "Ratio cannot be <= spread"
        );
coverage_0xc4529909(0x9119fd02be2ad0fd79241bdfacd716a73f6b4f24e85cb91711df40e6d885b5fa); /* line */ 
        coverage_0xc4529909(0xd2733d211119d4b4255e4477f8686c83aa329ef020de324d5ede1b2fbf28a82b); /* statement */ 
state.riskParams.marginRatio = ratio;
coverage_0xc4529909(0x70a98a851408c9bab844b22ca084b579dcb67c7edfc820017f24f856e6e58c9c); /* line */ 
        coverage_0xc4529909(0x23c28c535e2f60cd964c5167a57b1cd7d49a5e90ac2ce92b3121390223210b10); /* statement */ 
emit LogSetMarginRatio(ratio);
    }

    function ownerSetLiquidationSpread(
        Storage.State storage state,
        Decimal.D256 memory spread
    )
    public
    {coverage_0xc4529909(0x12d33a3bf3419ad7635120ecd388bd3aa3e88c15933085155cb56e4a3a980942); /* function */ 

coverage_0xc4529909(0x3a74519d6d95e43b1c6389bbe42b20a03ba166ac0ba5be21d3b7c83bd15c1125); /* line */ 
        coverage_0xc4529909(0xd1be44466b8cd0132c1e4ecaf523afdb69f474e50c6937e1419aac401a9bffd2); /* statement */ 
Require.that(
            spread.value <= state.riskLimits.liquidationSpreadMax,
            FILE,
            "Spread too high"
        );
coverage_0xc4529909(0x4afebf1ffd565c1d55f9687678af197463da12142be7b50f5200450d2b9666d8); /* line */ 
        coverage_0xc4529909(0xa13d7ddce42a1b85cc9b16deda38bbf8c6d876e0f28434d462695501770267c8); /* statement */ 
Require.that(
            spread.value < state.riskParams.marginRatio.value,
            FILE,
            "Spread cannot be >= ratio"
        );
coverage_0xc4529909(0xd311fa32ceec56eaf18d371a5c3d6b056b79618c9a3f36162cd89824ad39a51c); /* line */ 
        coverage_0xc4529909(0x92d9be6b66120c258ce635e179620b5d698a99da814e57dc035d997169cfcfd3); /* statement */ 
state.riskParams.liquidationSpread = spread;
coverage_0xc4529909(0x8bd42fa54d9fdde5ade7136ed21bdd7b9a187d75a7446f37bbb79356df93f31c); /* line */ 
        coverage_0xc4529909(0x77a7a12ce05fcd8aa366891fd3680df3afba513536d62d6b4ec0bf0eb12440e4); /* statement */ 
emit LogSetLiquidationSpread(spread);
    }

    function ownerSetEarningsRate(
        Storage.State storage state,
        Decimal.D256 memory earningsRate
    )
    public
    {coverage_0xc4529909(0xeec7c513e939370565f2ea04b5488e07d409bb7bf586e24d9ad9aa9ce31e2f95); /* function */ 

coverage_0xc4529909(0x737b355e6bc6807d1f17cbe68e9bd1d4216b74c4335567ed35c2192c9f14e737); /* line */ 
        coverage_0xc4529909(0xe109e6c04d2600a9b2d587fc2abade40099b6074dd31c479a7008eb47ee73642); /* statement */ 
Require.that(
            earningsRate.value <= state.riskLimits.earningsRateMax,
            FILE,
            "Rate too high"
        );
coverage_0xc4529909(0x34b97bd7128f25d7549bc0c852bc98d30f39a9d40b93f797721d6b4be4499c22); /* line */ 
        coverage_0xc4529909(0x83c4b3ac443113f08e9e559aee5064dcbdfb2702623b8b5149f445a79478f9e4); /* statement */ 
state.riskParams.earningsRate = earningsRate;
coverage_0xc4529909(0xd3538db102e126acf1c3242be24b02b90d5e9d12bc84d95867c96ba5f358d896); /* line */ 
        coverage_0xc4529909(0xa489dc3153a247544410812a64fb3280c1ae0d761da71aeab21fe7368e25ab0e); /* statement */ 
emit LogSetEarningsRate(earningsRate);
    }

    function ownerSetMinBorrowedValue(
        Storage.State storage state,
        Monetary.Value memory minBorrowedValue
    )
    public
    {coverage_0xc4529909(0xd6796e1b92792df06fa71b90d942e992580148087f8559dca6e1f2af12a880d1); /* function */ 

coverage_0xc4529909(0xb5a9f9b59840b024b26e74795c487740dc7e822685cb5d1548cea55133f2c7fb); /* line */ 
        coverage_0xc4529909(0xb16120ee7997f1789db7af16e0fb9e231ad554e251c396dee00674f05efc63c2); /* statement */ 
Require.that(
            minBorrowedValue.value <= state.riskLimits.minBorrowedValueMax,
            FILE,
            "Value too high"
        );
coverage_0xc4529909(0xa818817179885fb081b288aef4d96543a585e04a77683a5701044cf445ded13b); /* line */ 
        coverage_0xc4529909(0x58a9ca35d16f439d0e9d0acd1fd5bd73d8f07cab9f9b079f8a14bbc81550f661); /* statement */ 
state.riskParams.minBorrowedValue = minBorrowedValue;
coverage_0xc4529909(0x7bb9113d29564ba0dbf4379c7976ef36b805d62b4c88fa42368ee80646527b02); /* line */ 
        coverage_0xc4529909(0xd7049a70d0815b2f6e8dfb3f758ca439d6ebcde4f9f3772e1a5034166400902f); /* statement */ 
emit LogSetMinBorrowedValue(minBorrowedValue);
    }

    // ============ Global Operator Functions ============

    function ownerSetGlobalOperator(
        Storage.State storage state,
        address operator,
        bool approved
    )
    public
    {coverage_0xc4529909(0x531d9ef7b86638d7c0d0eb9b11e387f75056ab5740163c08911f928b3ead2999); /* function */ 

coverage_0xc4529909(0x4af002ddc482c7152b876856ff1086faf33be1d2d2c647b55740587ceb353b89); /* line */ 
        coverage_0xc4529909(0x2a9f40b2bff4c302d41e88f6b9544a0eb54a37ec7d3eaa7add3699a05649393c); /* statement */ 
state.globalOperators[operator] = approved;

coverage_0xc4529909(0x63dc8a3ca27dfb7a870c5ec3f5ce779205750facb6f986c63624a6ae275bc00d); /* line */ 
        coverage_0xc4529909(0x1732673b8765557ab8efd7ea2909aaef911a87f047c9dd71770ac8727a07fe6f); /* statement */ 
emit LogSetGlobalOperator(operator, approved);
    }

    // ============ Private Functions ============

    function _setPriceOracle(
        Storage.State storage state,
        uint256 marketId,
        IPriceOracle priceOracle
    )
    private
    {coverage_0xc4529909(0x23f80fb14ebc8995365233b9ac5b1940e7811c68a7ccacdc7d67c2d6124f8272); /* function */ 

        // require oracle can return non-zero price
coverage_0xc4529909(0x3764ec66c7ddf9a2dcf9358799d72361176e231c999e9ac8049759cbfac4f881); /* line */ 
        coverage_0xc4529909(0x9e4a166277047291cbe31e39f7682bc952c2961e48583386d4e134fbeb17979c); /* statement */ 
address token = state.markets[marketId].token;

coverage_0xc4529909(0xb896597170eda604d8ce40d1cd1bebf784444a9a4555d59582e72f0db80d04ef); /* line */ 
        coverage_0xc4529909(0x618d73394e1db5c1276250d07585ea155f4e2c2ea3435c573a54398a2187f321); /* statement */ 
Require.that(
            priceOracle.getPrice(token).value != 0,
            FILE,
            "Invalid oracle price"
        );

coverage_0xc4529909(0x385ca6b2e610720423be73634671bdf3889eb263e82386e89dc7e350adc900ee); /* line */ 
        coverage_0xc4529909(0x9013381a4b54425cbad8bf3e812fbb67fe40e031894f22b269196ddcee3bafbc); /* statement */ 
state.markets[marketId].priceOracle = priceOracle;

coverage_0xc4529909(0xb92412d18412bc6b673f5ec9ca272b09765ce17a5606b1ab15f22ed8bedaf95b); /* line */ 
        coverage_0xc4529909(0xe9884fdf7867dc1035c3bd9b45f5cff417c96d34b0748cd69d9e30ca7d450bc5); /* statement */ 
emit LogSetPriceOracle(marketId, address(priceOracle));
    }

    function _setInterestSetter(
        Storage.State storage state,
        uint256 marketId,
        IInterestSetter interestSetter
    )
    private
    {coverage_0xc4529909(0x806b7b0960e85aa9568e7d02cb6a63be84d8c9a7d1e66341cae7155f4dc43dca); /* function */ 

        // ensure interestSetter can return a value without reverting
coverage_0xc4529909(0x2589ffe36ae596ef49bebd167082aa43f725e05f5c0cccab4421f5e659fc57b7); /* line */ 
        coverage_0xc4529909(0xe95c4c9e7e4bd5df43533b6efba8327919245358d7977b34028b89f26a046af5); /* statement */ 
address token = state.markets[marketId].token;
coverage_0xc4529909(0x765846227f7864ebbc4ab568b07d34a76be87bf0c18cd135e4c880e93d57f7e9); /* line */ 
        coverage_0xc4529909(0x75f7384ea3a28b589932c61cd4d8e996baa3a81a36bb2af1239e5d2e45c0c2db); /* statement */ 
interestSetter.getInterestRate(token, 0, 0);

coverage_0xc4529909(0x8a6a0bb195fcbb3f46778f5102141291b3359d411ee9f721089f34bbaa94ebb7); /* line */ 
        coverage_0xc4529909(0x0265ca9619be529823127bd6b9d7ee6cf390e675ec5e1735f1bbfbc0d27f6010); /* statement */ 
state.markets[marketId].interestSetter = interestSetter;

coverage_0xc4529909(0xc2f43e419cb542ffc386270809605f9cb8a0a5640c1b718d81780013d20312ca); /* line */ 
        coverage_0xc4529909(0x3d27a35ed73e60f7cef13635fee2526c9fe0de0523638ee68feedb2a10867471); /* statement */ 
emit LogSetInterestSetter(marketId, address(interestSetter));
    }

    function _setMarginPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
    private
    {coverage_0xc4529909(0xd84dc536564c6ba40abfcfe7044c78ab4708aab57c9f789a338c4a83f1e5e291); /* function */ 

coverage_0xc4529909(0x12a28e368386b208e87004004fe19cc257655f9241ee3a7ad9966e1d75e8855f); /* line */ 
        coverage_0xc4529909(0x138a1a1bac68b597b1bd1fca85569556eeae403d4af82d8173b4fcc54de107f6); /* statement */ 
Require.that(
            marginPremium.value <= state.riskLimits.marginPremiumMax,
            FILE,
            "Margin premium too high"
        );
coverage_0xc4529909(0xfb37c942087fafd991305deb40560aaa8e9bf44453b5682432014ee3ff649c1b); /* line */ 
        coverage_0xc4529909(0xd5cc26f5e36466b13c6ad57085975e1650512b2f83027c6912c414d405199b9e); /* statement */ 
state.markets[marketId].marginPremium = marginPremium;

coverage_0xc4529909(0x112de24dc4d00842bca6617e0f37063beb3de823782bb0cc62a1a2ab7155ef55); /* line */ 
        coverage_0xc4529909(0x0e1aa6b1fe6af935818ff5a4c8ceb9c4552ba60dd57a8e9d4b57ef1e8ed1f644); /* statement */ 
emit LogSetMarginPremium(marketId, marginPremium);
    }

    function _setSpreadPremium(
        Storage.State storage state,
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
    private
    {coverage_0xc4529909(0x7efc21316356b2bd46db85f77bb73d45b4b350de177da98951508b233402a3aa); /* function */ 

coverage_0xc4529909(0xea39a838a6c34069cd014514cbcb0840f332bb471989f7bfd3fea3d3fd0f9ecc); /* line */ 
        coverage_0xc4529909(0x4e0df02e6e61d82460d4d9339425e462e3f107e98a2e4e7b3ac692f961fd2530); /* statement */ 
Require.that(
            spreadPremium.value <= state.riskLimits.spreadPremiumMax,
            FILE,
            "Spread premium too high"
        );
coverage_0xc4529909(0x0210c0f59bc51848ca9c7889ed421cccc3c781fa422393214245e50c0c35cafb); /* line */ 
        coverage_0xc4529909(0x5207b1a018648c71d9edaeb842c5f2e27d0f49088a46be2e0fa68700af0105f9); /* statement */ 
state.markets[marketId].spreadPremium = spreadPremium;

coverage_0xc4529909(0x06e1e6af9f75cd7f8f5512e6323c91e98b9849386d989eaf5381803123ac1715); /* line */ 
        coverage_0xc4529909(0x4d4c792c7710f2a41d80c4215f78a1f0c2fb857d02102708e75e5b0b26f2efba); /* statement */ 
emit LogSetSpreadPremium(marketId, spreadPremium);
    }

    function _requireNoMarket(
        Storage.State storage state,
        address token
    )
    private
    view
    {coverage_0xc4529909(0x7d11e2c693ad6fcbc508624881201069c8d3fe195095822db3177f8e99e64fa3); /* function */ 

        // not-found case is marketId of 0. 0 is a valid market ID so we need to check market ID 0's token equality.
coverage_0xc4529909(0x1647421d33a1ab1e3b5c33ab68bdb87c9a795b340940b986ed0afe65300067e5); /* line */ 
        coverage_0xc4529909(0x703d5283855297828e444313f02b2fc955abbc9d32609644e266f1f431392ba0); /* statement */ 
uint marketId = state.tokenToMarketId[token];
coverage_0xc4529909(0xad87498123eb6be78107d75aae704a76c329195f11ad3a055ed708d90b875567); /* line */ 
        coverage_0xc4529909(0xdad2bb004fdb9817705d583c9d84aeaa68dc50a174ce8034cc45deaf7f3fd7a5); /* statement */ 
bool marketExists = token == state.markets[marketId].token;

coverage_0xc4529909(0x30bbcb0b09892753cda63378cebbd9863bdaae2f9646dc13a2f0988943abd760); /* line */ 
        coverage_0xc4529909(0x526fb335cfadbaf23666a11dedd9b93152cc7dc062f26d775bb5cfcea4104c96); /* statement */ 
Require.that(
            !marketExists,
            FILE,
            "Market exists"
        );
    }

    function _validateMarketId(
        Storage.State storage state,
        uint256 marketId
    )
    private
    view
    {coverage_0xc4529909(0x47c9908714c52b6c68d7c48c7b7bebdc94c70006c405290d05ff2815956df532); /* function */ 

coverage_0xc4529909(0xe90edf1f0ea55d9200d820f439369eee5afe6c17f11a9e546d65f4ef9953e03c); /* line */ 
        coverage_0xc4529909(0xc2351b60acbbcaf44aa1c516bdbbc13f8685605477c85944c9531b46c322c714); /* statement */ 
Require.that(
            marketId < state.numMarkets,
            FILE,
            "Market OOB",
            marketId
        );
    }
}
