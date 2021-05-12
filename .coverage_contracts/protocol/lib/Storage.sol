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
import { Account } from "./Account.sol";
import { Cache } from "./Cache.sol";
import { Decimal } from "./Decimal.sol";
import { Interest } from "./Interest.sol";
import { Math } from "./Math.sol";
import { Monetary } from "./Monetary.sol";
import { Require } from "./Require.sol";
import { Time } from "./Time.sol";
import { Token } from "./Token.sol";
import { Types } from "./Types.sol";
import { IInterestSetter } from "../interfaces/IInterestSetter.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";


/**
 * @title Storage
 * @author dYdX
 *
 * Functions for reading, writing, and verifying state in Solo
 */
library Storage {
function coverage_0x4669f08e(bytes32 c__0x4669f08e) public pure {}

    using Cache for Cache.MarketCache;
    using Storage for Storage.State;
    using Math for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;
    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "Storage";

    // ============ Structs ============

    // All information necessary for tracking a market
    struct Market {
        // Contract address of the associated ERC20 token
        address token;

        // Total aggregated supply and borrow amount of the entire market
        Types.TotalPar totalPar;

        // Interest index of the market
        Interest.Index index;

        // Contract address of the price oracle for this market
        IPriceOracle priceOracle;

        // Contract address of the interest setter for this market
        IInterestSetter interestSetter;

        // Multiplier on the marginRatio for this market, IE 5%. This number reduces the user's supplied wei by
        // dividing it by:
        // `suppliedWei = suppliedWei + (assetValueForThisMarket / (1 + marginPremium))`
        // This number increases the user's borrowed wei by multiplying it by:
        // `borrowedWei = borrowedWei + (assetValueForThisMarket * (1 + marginPremium))`
        Decimal.D256 marginPremium;

        // Multiplier on the liquidationSpread for this market, IE 20%. This number increases the liquidationSpread
        // using the following formula:
        // `liquidationSpread = liquidationSpread * (1 + spreadPremium)`
        // NOTE: This formula is applied up to two times - one for each market whose spreadPremium is greater than 0.
        Decimal.D256 spreadPremium;

        // Whether additional borrows are allowed for this market
        bool isClosing;
    }

    // The global risk parameters that govern the health and security of the system
    struct RiskParams {
        // Required ratio of over-collateralization
        Decimal.D256 marginRatio;

        // Percentage penalty incurred by liquidated accounts
        Decimal.D256 liquidationSpread;

        // Percentage of the borrower's interest fee that gets passed to the suppliers
        Decimal.D256 earningsRate;

        // The minimum absolute borrow value of an account
        // There must be sufficient incentivize to liquidate undercollateralized accounts
        Monetary.Value minBorrowedValue;
    }

    // The maximum RiskParam values that can be set
    struct RiskLimits {
        // The highest that the ratio can be for liquidating under-water accounts
        uint64 marginRatioMax;
        // The highest that the liquidation rewards can be when a liquidator liquidates an account
        uint64 liquidationSpreadMax;
        // The highest that the supply APR can be for a market, as a proportion of the borrow rate. Meaning, a rate of
        // 100% (1e18) would give suppliers all of the interest that borrowers are paying. A rate of 90% would give
        // suppliers 90% of the interest that borrowers pay.
        uint64 earningsRateMax;
        uint64 marginPremiumMax;
        uint64 spreadPremiumMax;
        uint128 minBorrowedValueMax;
    }

    // The entire storage state of Solo
    struct State {
        // number of markets
        uint256 numMarkets;

        // marketId => Market
        mapping (uint256 => Market) markets;
        mapping (address => uint256) tokenToMarketId;

        // owner => account number => Account
        mapping (address => mapping (uint256 => Account.Storage)) accounts;

        // Addresses that can control other users accounts
        mapping (address => mapping (address => bool)) operators;

        // Addresses that can control all users accounts
        mapping (address => bool) globalOperators;

        // mutable risk parameters of the system
        RiskParams riskParams;

        // immutable risk limits of the system
        RiskLimits riskLimits;
    }

    // ============ Functions ============

    function getToken(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (address)
    {coverage_0x4669f08e(0x8c979c1f7757e0f49cab09a29bac21094136bdae2b24d7ad9411767d8702cffd); /* function */ 

coverage_0x4669f08e(0xe794fae46623c8beb5d2a49d572b9dcf074fd0cb8bb2d83b16501eb537714a83); /* line */ 
        coverage_0x4669f08e(0x7112a6fa7aa68e318bd72ad48f7fec4fd57f1d13d1afd3cd5e7676c3faeffb58); /* statement */ 
return state.markets[marketId].token;
    }

    function getTotalPar(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Types.TotalPar memory)
    {coverage_0x4669f08e(0x50f7bc5d785279c061c58206b00c86bebaba68a8955074bd9b71ac6753526cf6); /* function */ 

coverage_0x4669f08e(0xe484b363c355a577ddabfd6573c293c12aa717cee542aa063d3ab35c3e7f6358); /* line */ 
        coverage_0x4669f08e(0xf8ef80fdb5e16cf9bc7468f5fdbf830034052e8f7d46e4706db63215ca6f911d); /* statement */ 
return state.markets[marketId].totalPar;
    }

    function getIndex(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Interest.Index memory)
    {coverage_0x4669f08e(0x40f391569032799589a6b4bba342eeef727a5aaaf7c1668c4adb030447a6f876); /* function */ 

coverage_0x4669f08e(0x0d659587c96e5de17668af750fc49fb47066f1d2c8ad17ae5420d2743343d46f); /* line */ 
        coverage_0x4669f08e(0xc98c8d428fd48e6a02c3959a8d6db81d82178ce993bf59ad67a4811abbfe2d05); /* statement */ 
return state.markets[marketId].index;
    }

    function getNumExcessTokens(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {coverage_0x4669f08e(0x6abcd988fe7d20380410c37c1f93e9d0dce57a9e3916345a84628b431018839c); /* function */ 

coverage_0x4669f08e(0x1ca79057dc59f5104f170aeaa4257640dbd0864d00ef4fe73755977b39ca8798); /* line */ 
        coverage_0x4669f08e(0x9542ee0ae9523ed4f5b13454eba92061bc906193885ac706bfa234e741d894cd); /* statement */ 
Interest.Index memory index = state.getIndex(marketId);
coverage_0x4669f08e(0xa02f367cf698daf3f34a5cf307790ad330e232df2698bd1b4c92fe83ac75f06a); /* line */ 
        coverage_0x4669f08e(0x8a6f1109be9a17d72bf46716d4f26701b5a76ac2ef377b785a200847c05d960c); /* statement */ 
Types.TotalPar memory totalPar = state.getTotalPar(marketId);

coverage_0x4669f08e(0x41543fe2af0b203c89a79b933b8dc865ddfea2bdff6ec955634f6ab64e1a4cc7); /* line */ 
        coverage_0x4669f08e(0x376dd45bfc45bc05cfa08e9b3511943c1b2a5c821758cb40fc20893f59707c40); /* statement */ 
address token = state.getToken(marketId);

coverage_0x4669f08e(0xf154fa69136697eaa37f72b8218d7ba402a48877821ff35f93da858e13c65339); /* line */ 
        coverage_0x4669f08e(0xf02b9229d89ef047caaa35032a71173da1446095290fa18be088380e930a0a1d); /* statement */ 
Types.Wei memory balanceWei = Types.Wei({
            sign: true,
            value: Token.balanceOf(token, address(this))
        });

coverage_0x4669f08e(0xbf02c5f76c6909d89a2ad396080e92a595545f8ab8434f48c8e15e6d1d4fcb61); /* line */ 
        coverage_0x4669f08e(0x79355beb73e8364d90fad40c70f6256115655d4e4809e06f84f9cf6da6c24a72); /* statement */ 
(
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

        // borrowWei is negative, so subtracting it makes the value more positive
coverage_0x4669f08e(0x51d16c06425b827b611d70fd8046a9a2708d0a99ea9fc03cd582f239f0b7973b); /* line */ 
        coverage_0x4669f08e(0x0459db86669a28e9c9d15d617d64c4e79d593cb8655d20390915f231a24c772e); /* statement */ 
return balanceWei.sub(borrowWei).sub(supplyWei);
    }

    function getStatus(
        Storage.State storage state,
        Account.Info memory account
    )
        internal
        view
        returns (Account.Status)
    {coverage_0x4669f08e(0x611393293518154a11a436d5706fe04109be222a378501fc4a417e2b69be905f); /* function */ 

coverage_0x4669f08e(0x2e86b094566f2b70e779a0cf57632b13d2b9070f04e59db2c8495d62c1b6a9c4); /* line */ 
        coverage_0x4669f08e(0xc25912640418fdfd5761a096b35a80ec9704b13b6f1bca16e78a3f14901eb818); /* statement */ 
return state.accounts[account.owner][account.number].status;
    }

    function getPar(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Par memory)
    {coverage_0x4669f08e(0x067b16cfe27b2d58c47ebbaab9431b643b12649457a2b49b9c1140bcd9f013c2); /* function */ 

coverage_0x4669f08e(0xe02e29e89d58015d4a60ad23d438d0698bee26060ab1909f4f6a3a99cd58c309); /* line */ 
        coverage_0x4669f08e(0xbe82bcda2a8b5b3f157b4dd4cb81407b802250fa88d6d5ebb3e5518f01c9583c); /* statement */ 
return state.accounts[account.owner][account.number].balances[marketId];
    }

    function getWei(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId
    )
        internal
        view
        returns (Types.Wei memory)
    {coverage_0x4669f08e(0x61764d120d2b1a8aaa88ff254ca2485c36ead13a8ff9ecd769fe89caa596bc7a); /* function */ 

coverage_0x4669f08e(0x70f42984842211f31e6e1a93f44318fe02e8fdcfb370559f775185eb67129d9f); /* line */ 
        coverage_0x4669f08e(0x160458219d8b70870c7416f45a5f48a0f5df3c28b78630775ab415cac004b010); /* statement */ 
Types.Par memory par = state.getPar(account, marketId);

coverage_0x4669f08e(0xd093ef7adc5ef91fbab14efe65cc043613208a641f478393b32b18248a3b8421); /* line */ 
        coverage_0x4669f08e(0x7fa8468c05625829c20ec3578cf50baafb1d0f8d17c4b8e5d285d7ee20d476e5); /* statement */ 
if (par.isZero()) {coverage_0x4669f08e(0xf2b7a32a6fee0fd0664bbc166534c5ff5660a1cdacad9c4a340583dbd679e659); /* branch */ 

coverage_0x4669f08e(0x0a775da7d2edb358642a68a902d88b4114e504865f07e1ca4fed7ff8c0482241); /* line */ 
            coverage_0x4669f08e(0x2fd6cacb0759a78d67be247dc4f481ce2f3bedd80c284f8aac4b1df19025a2b2); /* statement */ 
return Types.zeroWei();
        }else { coverage_0x4669f08e(0x7326ec2903d08c07f916a7152594e564240f30e4e8f5ab316fd5059cc910ecb8); /* branch */ 
}

coverage_0x4669f08e(0x8f9841cee747acfc4db4a3af196d678354be5f164db169229f50d60eef50ae3d); /* line */ 
        coverage_0x4669f08e(0xbbd96e45dcc510d94ca5bbfd58bf43cde23e8f842f4a9fdc64246bf7dbdba0c3); /* statement */ 
Interest.Index memory index = state.getIndex(marketId);
coverage_0x4669f08e(0xc4b14ad780e88c8f0b4e98dce4260090984df96c83b5f93d91bbd8c331e7e4df); /* line */ 
        coverage_0x4669f08e(0x4648bf1ac0c5016c95b5afeba308454fa7c9c4de3cd5fd6e8a8bf5b5473c8b7a); /* statement */ 
return Interest.parToWei(par, index);
    }

    function getLiquidationSpreadForPair(
        Storage.State storage state,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        internal
        view
        returns (Decimal.D256 memory)
    {coverage_0x4669f08e(0xed6f22fb3a462dfaf1791f3bc389173e40ba59852be6eca4eabeb980d8d1be4b); /* function */ 

coverage_0x4669f08e(0x4a995bff12080f06092c371b4058110f037a8a520728877e35a7e3833ca10b62); /* line */ 
        coverage_0x4669f08e(0xe4025f7841ea8291d36183171469bd6f6230ba2ce1ce0e344c514c28e189368e); /* statement */ 
uint256 result = state.riskParams.liquidationSpread.value;
coverage_0x4669f08e(0xa527634ba267ab93f8f8c2f6fdd90e85fc4717f4f0a39937d576cf4acdfd7c5a); /* line */ 
        coverage_0x4669f08e(0xa8890c2ef1dc7c1f0a1d908fb64ef76f1e5c6c100a843444247f43ef1e85452d); /* statement */ 
result = Decimal.mul(result, Decimal.onePlus(state.markets[heldMarketId].spreadPremium));
coverage_0x4669f08e(0xb6dd652ee4027d61156fb7f6a664f21fc5c6a76a32fe591d6091b768046acb90); /* line */ 
        coverage_0x4669f08e(0x6d1127591631d8d2a9fad67f24292e09f6fb965e52bb521c036a5ab0a13a739b); /* statement */ 
result = Decimal.mul(result, Decimal.onePlus(state.markets[owedMarketId].spreadPremium));
coverage_0x4669f08e(0x295e12d1dc6243e2f8ee711176b67ef18fe084c567c287c31e26cbbf9e0fd68d); /* line */ 
        coverage_0x4669f08e(0x9f96a0d68f257c5e0f4b6166b5676b7b1ab8f496884e08f0eaa264205d4efc2b); /* statement */ 
return Decimal.D256({
            value: result
        });
    }

    function fetchNewIndex(
        Storage.State storage state,
        uint256 marketId,
        Interest.Index memory index
    )
        internal
        view
        returns (Interest.Index memory)
    {coverage_0x4669f08e(0x8f99df27c251173de6f8b6aba85f5baa0a82b252c3207938af6efc33e62bde6f); /* function */ 

coverage_0x4669f08e(0xb4782eb4ad2c8a7b56d3deced0268192a19218ae27c691f307a9c69f9e66040b); /* line */ 
        coverage_0x4669f08e(0x5d546ca648207056003e7feb7c758b8a2c38fdad482ea0f1666ccf10b78b6ba8); /* statement */ 
Interest.Rate memory rate = state.fetchInterestRate(marketId, index);

coverage_0x4669f08e(0x63dea03f75fca4fad89608ff3a482a84968227d2a69a866788b7e0ab30e04be5); /* line */ 
        coverage_0x4669f08e(0xd859719985590cd87d5df24d4ad92e89e8b9404d454ca0bb6a3ac24da3d95c7a); /* statement */ 
return Interest.calculateNewIndex(
            index,
            rate,
            state.getTotalPar(marketId),
            state.riskParams.earningsRate
        );
    }

    function fetchInterestRate(
        Storage.State storage state,
        uint256 marketId,
        Interest.Index memory index
    )
        internal
        view
        returns (Interest.Rate memory)
    {coverage_0x4669f08e(0xc27cc1a50907f0541abc822ce7f932623304b67d2434a9b537daef343302a4aa); /* function */ 

coverage_0x4669f08e(0x937d19d1125ef64520835257a0616ab90f408f441ef746743aa905d79b79d976); /* line */ 
        coverage_0x4669f08e(0xaf54b7dcff60e98ce6f480fcf6f27b511f4928590f318434bffae97d42961c91); /* statement */ 
Types.TotalPar memory totalPar = state.getTotalPar(marketId);
coverage_0x4669f08e(0x68d32ca86dc666ebc3f379791126aa9a2845eb7f23d6baae527ac6ce47015237); /* line */ 
        coverage_0x4669f08e(0xb3317c11bbaa795d1f0d74b45705d7b976a073bedb3b5e7c0900cfefdc76a38c); /* statement */ 
(
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = Interest.totalParToWei(totalPar, index);

coverage_0x4669f08e(0x8c0db854e8162736bc02d9dcbe6e9dbe681571244a3b614e70a96f4c823f4c2d); /* line */ 
        coverage_0x4669f08e(0x643d8283b5f2b12522315eba8a1dc921decc36bad93e63ba689a837f110f55bb); /* statement */ 
Interest.Rate memory rate = state.markets[marketId].interestSetter.getInterestRate(
            state.getToken(marketId),
            borrowWei.value,
            supplyWei.value
        );

coverage_0x4669f08e(0x027542f0c412f02b96d002bbd8867ef435c6019edd2556679521969a782c6bf1); /* line */ 
        coverage_0x4669f08e(0xd189a759a61657f04acc779be8d2b8713f6e8bb37c556b89f63f9e5c3fb8c6bc); /* statement */ 
return rate;
    }

    function fetchPrice(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        view
        returns (Monetary.Price memory)
    {coverage_0x4669f08e(0x0c660a2662b5d8370b12ef2773bda4bc12998a6e7e340ee6dd6faca4b8b11008); /* function */ 

coverage_0x4669f08e(0x4c549c100f239d308e41b5ead5541541df4aaa954da56719c559fabd0b58636b); /* line */ 
        coverage_0x4669f08e(0xf5de41c99300183a22433fb3e3127aa7d30dfc6c43637b79777f5a89de28a2d2); /* statement */ 
IPriceOracle oracle = IPriceOracle(state.markets[marketId].priceOracle);
coverage_0x4669f08e(0x27880877f62211d65b92ec1e79bbfc2bc4224820a1df37177ce66593abff4d73); /* line */ 
        coverage_0x4669f08e(0x9fbe3764b856806773d93bfef78233b982b2be1e750af6d392a5066795309b13); /* statement */ 
Monetary.Price memory price = oracle.getPrice(state.getToken(marketId));
coverage_0x4669f08e(0x23ce98dedfd60b5349fb1436c5ec3e99446a591c996eb5df7b864a8113971fcf); /* line */ 
        coverage_0x4669f08e(0x78117e413c56309cee90512bf106babe450283cc35d6fd224dd63dd3948ab1c0); /* statement */ 
Require.that(
            price.value != 0,
            FILE,
            "Price cannot be zero",
            marketId
        );
coverage_0x4669f08e(0x8e43dbf0a0d565a7a6b14623b1858f01b523467f534b01db4dda68d3e1826887); /* line */ 
        coverage_0x4669f08e(0x62696f0ae703ca7d8e624b990068e948b64b800695fba0f641d627a3b6af13fa); /* statement */ 
return price;
    }

    function getAccountValues(
        Storage.State storage state,
        Account.Info memory account,
        Cache.MarketCache memory cache,
        bool adjustForLiquidity
    )
        internal
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {coverage_0x4669f08e(0x9acfbe35bd0a327f6dc6a87dfe9901801f0b2160cff6efbc22c460195a8bcd76); /* function */ 

coverage_0x4669f08e(0xcb728013cf4b118a3735274250b1b5dfcf313f0a9fdd19e2b0759c955bcba0a0); /* line */ 
        coverage_0x4669f08e(0x477b066df78464e8a0feec02d7bd1e6eb68e30cd56b28895ccd639bef4cc38eb); /* statement */ 
Monetary.Value memory supplyValue;
coverage_0x4669f08e(0x28b06e638dbad5542133218ab0d7b071e952eff046f088c3faf8c6ed9df7ce95); /* line */ 
        coverage_0x4669f08e(0x657f1dabfb73cda5dbeb7402020568b8ff6fcda4571ca808c1c8c288a1eb2807); /* statement */ 
Monetary.Value memory borrowValue;

coverage_0x4669f08e(0x11828af0618902b648320b462b32f15d6fb7427afe739856144675e5928b8443); /* line */ 
        coverage_0x4669f08e(0xacaee5355d1946c1fc78e2fea10165a434064055b13b83f836aa42f56150a34d); /* statement */ 
uint256 numMarkets = cache.getNumMarkets();
coverage_0x4669f08e(0x65cb06d2fdbec687bd19c9ec7775522f1d2d9358b5d8c07b868b2ed17c1282d0); /* line */ 
        coverage_0x4669f08e(0x3d5da31037b2ee620d55a2fb769104dd051deccfcd5e6af057fa72b37f47d510); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x4669f08e(0x9c0db9da470918fe8ede9db097ddf0103c6fb5b40f05a9877213961d7203ae39); /* line */ 
            coverage_0x4669f08e(0x179342e7608dbebdc65f4d3acdf969d9c7b6fd21762e67d29fecf21d10950db8); /* statement */ 
if (!cache.hasMarket(m)) {coverage_0x4669f08e(0x1182c992f0f991d1a083e3ab0143084c215e5f9e1601d3d7db37f0c479e919ed); /* branch */ 

coverage_0x4669f08e(0xc18eb12c09115ef1b43a214e8fbcb84d0a21a4bdbfbacc1f09fad495aa88d7f5); /* line */ 
                continue;
            }else { coverage_0x4669f08e(0xd988f2a72b679ef441430f2a2cc8a2fe8b07bfcc839c5147a59637103b621eaa); /* branch */ 
}

coverage_0x4669f08e(0x2f4e54a9947d8e388553de0c63a4922f6668ff11348b907fbdb89d8749368da3); /* line */ 
            coverage_0x4669f08e(0x3a8d51647ce77ff371e108682cb5e132c4ede49e77bfd63700a6fc14851c1662); /* statement */ 
Types.Wei memory userWei = state.getWei(account, m);

coverage_0x4669f08e(0x22ecceed6f5bdb712555f8e105a8a52b935de1032712304e77c75a1b1ce69566); /* line */ 
            coverage_0x4669f08e(0x30ff2ecc92a5aa4186464a412a8d6a91fad3910628bdf03beaa8a0d6178fab8f); /* statement */ 
if (userWei.isZero()) {coverage_0x4669f08e(0x92b9dde0291e2032be467c0fc7a2706ce3f5da4f0678143b76316b42579a54fc); /* branch */ 

coverage_0x4669f08e(0x3060d12d14ac6de8fae0c083e9ea9cd5c0e093c800ec3e563d8a113491154330); /* line */ 
                continue;
            }else { coverage_0x4669f08e(0xbd1937eb22b9b032a107553f4270f899501d9fd9600057a21fa1c9f8ab7e4190); /* branch */ 
}

coverage_0x4669f08e(0x305db6f1438704c62de25690b7be528733765d1cef2b1874839a98b06c082f2d); /* line */ 
            coverage_0x4669f08e(0x97d9194b24b94482f9b93f742a307b240f0f723ec635bc8d9d51e583004304e2); /* statement */ 
uint256 assetValue = userWei.value.mul(cache.getPrice(m).value);
coverage_0x4669f08e(0x41cdbac87a4d8574da62f4dd6ea214039b9701358efbc2117c653e9ec64c9c47); /* line */ 
            coverage_0x4669f08e(0x98684a7e933ff36fb4d7ec4b5ad35927fb3e77822f0e1583213be102464d8857); /* statement */ 
Decimal.D256 memory adjust = Decimal.one();
coverage_0x4669f08e(0x5ca092e672bf3ce94a73a7bc6e5ab4d32cb4a530c62b6e19100d521a61adf2b4); /* line */ 
            coverage_0x4669f08e(0x68ed883fdeb93b0030c99d4b14ca6a22a06f0898c3e633e6c054ebb22e15d7e8); /* statement */ 
if (adjustForLiquidity) {coverage_0x4669f08e(0x749e5d844e0a1d8939eddceba6080af0a5ba5d2c72e908b8b5e46ae0e8d12e5d); /* branch */ 

coverage_0x4669f08e(0xc0f8d28766a6fe80cab14c77f49f1823777c9149c3aab096cb21b61c2c22e3a7); /* line */ 
                coverage_0x4669f08e(0x7490d53773f1e832a326f9dd308c66d5a537296a55ac9c81a58eb4d1a725e874); /* statement */ 
adjust = Decimal.onePlus(state.markets[m].marginPremium);
            }else { coverage_0x4669f08e(0xcbe8743eeb0ff20527a7311e101b2048b68c8c44eda8bb9727221fc41cf178cd); /* branch */ 
}

coverage_0x4669f08e(0xfdaeb8083e2048ddf99ccec993263fceebb2a107dd39a3b959937b34a5e5ae8d); /* line */ 
            coverage_0x4669f08e(0x3f2bb4228d40e2201196e581d42434d9c54051c320796e1f07bdb91277eb237b); /* statement */ 
if (userWei.sign) {coverage_0x4669f08e(0xf6786a2d347b9ace8d5e0d6145e7b831021c1e4e33391f6e7f6c43185e57d7c1); /* branch */ 

coverage_0x4669f08e(0x690fb8399f254d561a430ab5b612153b6488d5b52e30b4e3f3d8230cba00f3f8); /* line */ 
                coverage_0x4669f08e(0x6193a5cd24b20e2eb76a38b0f89b76e635757e2b7b2ff120d155c6a8508010a5); /* statement */ 
supplyValue.value = supplyValue.value.add(Decimal.div(assetValue, adjust));
            } else {coverage_0x4669f08e(0x1373c84d30365e1631d4c89e02a3733235e12c72e366d98c4fb5669c36b33637); /* branch */ 

coverage_0x4669f08e(0x27096a4d5069be3208eb787b3710b13380fa6a420becda744723bb3f594c6151); /* line */ 
                coverage_0x4669f08e(0x82a3aef1cb9e30201e9c44c3e88c32f22834517b437c7db5c1c4a5d2bf7d5a38); /* statement */ 
borrowValue.value = borrowValue.value.add(Decimal.mul(assetValue, adjust));
            }
        }

coverage_0x4669f08e(0x0c7b8e34011db6600c34de829dbd4b0cee94c67bd816457d4efa0d839bb8827b); /* line */ 
        coverage_0x4669f08e(0xd74a93286cbac4f5f64e694f5c6dd30119de76a403f17b0e22a12780c214ccc1); /* statement */ 
return (supplyValue, borrowValue);
    }

    function isCollateralized(
        Storage.State storage state,
        Account.Info memory account,
        Cache.MarketCache memory cache,
        bool requireMinBorrow
    )
        internal
        view
        returns (bool)
    {coverage_0x4669f08e(0xcffd540e7d255f529e1724085da16838fff1863d16b446c7788800ed45c0b8bd); /* function */ 

        // get account values (adjusted for liquidity)
coverage_0x4669f08e(0x89cd21bd8267cc450dcefe0fc69938c7e752fc43d4f58552713e8700390f164b); /* line */ 
        coverage_0x4669f08e(0x2018ceabd35aade2197c248793f8daf5f08d336660cf92efd2cfc272a64301b8); /* statement */ 
(
            Monetary.Value memory supplyValue,
            Monetary.Value memory borrowValue
        ) = state.getAccountValues(account, cache, /* adjustForLiquidity = */ true);

coverage_0x4669f08e(0x7390e999132942d423e0439f4c164f6a7e3cfe95de757698eb091c0ae611912b); /* line */ 
        coverage_0x4669f08e(0xa41e29da7d4e95c4a4bb0bf13b6fc092825f6741218c0cedbf85b74578a3ec97); /* statement */ 
if (borrowValue.value == 0) {coverage_0x4669f08e(0xe2ab0c30227958bf64940bc30c1b173235951721c169518917c126772ed5aac6); /* branch */ 

coverage_0x4669f08e(0x04dc5c9919957a3ee8a2fa7e20b90bb7e6c45f063ee88c8ae0e1000db5d52d0f); /* line */ 
            coverage_0x4669f08e(0x2a70c0a4889fc6635f2150d2ad010e79d6d12e2b4a2c82153a7043e1bcb6c136); /* statement */ 
return true;
        }else { coverage_0x4669f08e(0x4aac62ca86dc95785c83671b53fd61f83895cdc5a9ed95e81ccbca142dfaebca); /* branch */ 
}

coverage_0x4669f08e(0x7dcef1ece916e00b6eccd9de338c6baa06aefd03e8f35defd5c8b07289659f37); /* line */ 
        coverage_0x4669f08e(0x5928f2d5b8bf0f1bb51d2f51bc8a9fc90c7632389917d581cdc6cb4d0cf1bdc3); /* statement */ 
if (requireMinBorrow) {coverage_0x4669f08e(0x97ff6e723c04f81e050400a823c08e8123ad5539589c0eba4350af446991e143); /* branch */ 

coverage_0x4669f08e(0x2cc0d09ab8d73e852a52448a0a1e3ee49cc4e4460bfe92e1eb8cef1fcf2cbcbb); /* line */ 
            coverage_0x4669f08e(0xcda9dba4125d158bf0a908b15bbde5b8127e908142ac6fbd56d11451ad0bda67); /* statement */ 
Require.that(
                borrowValue.value >= state.riskParams.minBorrowedValue.value,
                FILE,
                "Borrow value too low",
                account.owner,
                account.number,
                borrowValue.value
            );
        }else { coverage_0x4669f08e(0x31eaf4b1e37a0a882450f7431dbb17c24f287df6e67316f72b3c0c60992a4976); /* branch */ 
}

coverage_0x4669f08e(0xcbd6d52c66e1720e29c29ff6acb3b0078a6f8b37d447e464b4c83d142088485a); /* line */ 
        coverage_0x4669f08e(0x884534fff9708a62081cbb688538e6a08ccdd4934f982ebd3d1953fec8889b3a); /* statement */ 
uint256 requiredMargin = Decimal.mul(borrowValue.value, state.riskParams.marginRatio);

coverage_0x4669f08e(0x20ff701acecc097b8eec7480506b4684a9a921d79f4ef5adc0b0704b3c9681e8); /* line */ 
        coverage_0x4669f08e(0xaa4d380c51abae774c9b27e22085180ba964bb0c38c38e1693181e2a14eab3f2); /* statement */ 
return supplyValue.value >= borrowValue.value.add(requiredMargin);
    }

    function isGlobalOperator(
        Storage.State storage state,
        address operator
    )
        internal
        view
        returns (bool)
    {coverage_0x4669f08e(0x654f168ce67cf30c6fb8c973ee27664b724ad145cffeef1ec41417ebaa3334ad); /* function */ 

coverage_0x4669f08e(0xabc06b1b32da2fbb6243e0fde3f53ad179f443a33be69eacfe42c0c5f9a9a689); /* line */ 
        coverage_0x4669f08e(0x734b05668eefb8729bb0059c61f62b1cc4938a69294e7e9016692bce041c9b93); /* statement */ 
return state.globalOperators[operator];
    }

    function isLocalOperator(
        Storage.State storage state,
        address owner,
        address operator
    )
        internal
        view
        returns (bool)
    {coverage_0x4669f08e(0x1ea6eaa5ea16b05bbd6807b86f8058bd8ce604557db2bdbca8c3eb920787cccb); /* function */ 

coverage_0x4669f08e(0x2efa69ca80feff0cb82afb84128abccfc5fd6b9aa8a26654412babb7eb8ad84c); /* line */ 
        coverage_0x4669f08e(0x1e61b02513d695aac6ee8f5366f75feafee08c7ff59ac17c8d0db394ca7d04ae); /* statement */ 
return state.operators[owner][operator];
    }

    function requireIsGlobalOperator(
        Storage.State storage state,
        address operator
    )
        internal
        view
    {coverage_0x4669f08e(0xf51d071ecf9329236bf4ae378a3b1c6c7db4a1cb30380916a786ef8b6f84c0eb); /* function */ 

coverage_0x4669f08e(0x4f97980fd8a9c1fd4d228892913ef935f3708207035b31c143f65facd60e171c); /* line */ 
        coverage_0x4669f08e(0xfc05074e938711d4dabd85d48d92227d10d579b2941a5411d0f0a79b21aca123); /* statement */ 
bool isValidOperator = state.isGlobalOperator(operator);

coverage_0x4669f08e(0xb307ecd29ff6b266b4f72be6a08b6bfba22854e11f7630ba9d03fe915212e8fa); /* line */ 
        coverage_0x4669f08e(0x0d3aaea697b4c27af356faa8fc69fe1cdcdee2a7db06d7083c96c320d4bb96c0); /* statement */ 
Require.that(
            isValidOperator,
            FILE,
            "Unpermissioned global operator",
            operator
        );
    }

    function requireIsOperator(
        Storage.State storage state,
        Account.Info memory account,
        address operator
    )
        internal
        view
    {coverage_0x4669f08e(0x2e63eb61cba423ef9bb907b662073cb296f367a64e9d7bcfcafdcdc1c523a031); /* function */ 

coverage_0x4669f08e(0x7a748f5d9c4db4d056962b6054ba2b8dce00488520068e984ee512b7d51fd396); /* line */ 
        coverage_0x4669f08e(0xb6b6b0615bbe0a01c5ddf8d9ec0cf6e70376d69b422bd822f22898de4cd17d57); /* statement */ 
bool isValidOperator =
            operator == account.owner
            || state.isGlobalOperator(operator)
            || state.isLocalOperator(account.owner, operator);

coverage_0x4669f08e(0x8d62f4587042814135f6b6fedd24f07e1756b52724e5ce51af993ae384827238); /* line */ 
        coverage_0x4669f08e(0x45670f6da897dc21ee441f99861bff8013e395c1d4364c08ff13fa56e06aac04); /* statement */ 
Require.that(
            isValidOperator,
            FILE,
            "Unpermissioned operator",
            operator
        );
    }

    /**
     * Determine and set an account's balance based on the intended balance change. Return the
     * equivalent amount in wei
     */
    function getNewParAndDeltaWei(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {coverage_0x4669f08e(0x3236d3c5873820a6427a12a982a9157a49919ec8facd14aaa306d892e9b778c0); /* function */ 

coverage_0x4669f08e(0x6c2e84931761e6847bd9d3c7b905f43e3080544ec617033da8550d2d2f38e184); /* line */ 
        coverage_0x4669f08e(0x0441d18d681c362b91eeb73f45e9c5bbbf3fcbd0831ee76b421285982954918a); /* statement */ 
Types.Par memory oldPar = state.getPar(account, marketId);

coverage_0x4669f08e(0xb757c7b7a1276b1054a42d33469d17d60b5775004348a61c73c699e2a9204695); /* line */ 
        coverage_0x4669f08e(0xc8d413835dfd73dd5a57cb8c04b399e9fb31faf8a4f3ddc17df66588edb61ce4); /* statement */ 
if (amount.value == 0 && amount.ref == Types.AssetReference.Delta) {coverage_0x4669f08e(0xd4651bc2554c64777c4712213bcfc4d696acb1df31d5959ffffd349d7353e49b); /* branch */ 

coverage_0x4669f08e(0x7ab58fa78701c5ebd02b0c1f92fb777fc6ce435f45d287eef0cefadd5b025621); /* line */ 
            coverage_0x4669f08e(0xe970335c16052e4f1904b79ae251c072b18e2fa8db0f16daf28b7d88f2e39a18); /* statement */ 
return (oldPar, Types.zeroWei());
        }else { coverage_0x4669f08e(0xfe35f40abed0013759fc1b83e53ce1497cee84e3f460a26bee83b77a3cdac700); /* branch */ 
}

coverage_0x4669f08e(0xa4f37e6a4098effbf0071b68541aebbec09dcc4fc0f636b3068ab316fac89167); /* line */ 
        coverage_0x4669f08e(0xbfd002fcf08693b46552968c351128fb8b25373a007dc78efbc3cd7ca1269a4f); /* statement */ 
Interest.Index memory index = state.getIndex(marketId);
coverage_0x4669f08e(0xd12e8bc13aa2295769dd7f6ac3d33d05f5eb6a2ec942688b03362f2d1e0537ee); /* line */ 
        coverage_0x4669f08e(0xe161e05f34dc0aac931b988036f109cf6b09970ab8743ff108ee67293fa664f3); /* statement */ 
Types.Wei memory oldWei = Interest.parToWei(oldPar, index);
coverage_0x4669f08e(0x45337e12fc694d55a2ee4dddba6a5faaada7485ae9de820592177457e9b5fb91); /* line */ 
        coverage_0x4669f08e(0xe1d8b35b07f2b66b17835755d2d30d97581bf65c7104ab139bb5c4570c5fce01); /* statement */ 
Types.Par memory newPar;
coverage_0x4669f08e(0xcb52ec90756ca362f42eb36f2646a3be657afa53bb86c683ed313642f05dc1b2); /* line */ 
        coverage_0x4669f08e(0x5b847b9d94a5dae60349926ab184be2b77aaa8ff8f3babbcce6a9b601c2deb64); /* statement */ 
Types.Wei memory deltaWei;

coverage_0x4669f08e(0x0730887138f6212e4c24023b3e0a1170e5c4a5885ef1b63a1f0397740809cf4f); /* line */ 
        coverage_0x4669f08e(0xe56b71c3ca83e1b7fb2e5bf535dabfdc6512b258b5948d33093a2e5d701aa68f); /* statement */ 
if (amount.denomination == Types.AssetDenomination.Wei) {coverage_0x4669f08e(0xc4b09709d770eb1c49a7bb6b4f97f624483ed72523f3839a623a9f95ea3822ec); /* branch */ 

coverage_0x4669f08e(0x1cbd835ad6aac7a68380547a659566926502f2bdaf6eeb79de4026a85cc2c383); /* line */ 
            coverage_0x4669f08e(0x57cace71009d9c482e028a2eefd6c9ce2f69adfd249c25e695fec895306e177f); /* statement */ 
deltaWei = Types.Wei({
                sign: amount.sign,
                value: amount.value
            });
coverage_0x4669f08e(0x62dfc1a773c14c5821951e3d16bfd1eb7571cfc101a838c3a4d218147676d291); /* line */ 
            coverage_0x4669f08e(0x1a74a3bd6021e0448de3e2423ecd860d7a69138d41982fb52617461dca02bf9f); /* statement */ 
if (amount.ref == Types.AssetReference.Target) {coverage_0x4669f08e(0x46b56a20d5e18e6aeb6466fe6787810b8ef86acbacce9c5ce9c7c453f6d22348); /* branch */ 

coverage_0x4669f08e(0xb9fc4541668dd53963665fbf466deda9143a9e1aad42da18f6ffb364ea693cc3); /* line */ 
                coverage_0x4669f08e(0x3eae7d3e6e45d72c0bb06cb12e98a4ed3ea39ef0a1d72e5ec754b4bed1e916c3); /* statement */ 
deltaWei = deltaWei.sub(oldWei);
            }else { coverage_0x4669f08e(0x66a48036a3e99c1da893fa83f88c2340d2c973d33adcb106bfbff5387c99c231); /* branch */ 
}
coverage_0x4669f08e(0x69d6e1b19a828de29bcfe3017ac093899d2af630f8905522029cfd2716cbda07); /* line */ 
            coverage_0x4669f08e(0xa4507629d8b7120b00b204d982a4daf0879958eb51cf9c3ab76a77f62f3eb888); /* statement */ 
newPar = Interest.weiToPar(oldWei.add(deltaWei), index);
        } else {coverage_0x4669f08e(0xbbe9640e39698dfa594a057e304a5bb08ad458da8802bfe4a439ee5219d92f2e); /* branch */ 
 // AssetDenomination.Par
coverage_0x4669f08e(0x7f9f09bbffafa8638019811be686bf5fc23f31c8c804ef74a6c3428948c39586); /* line */ 
            coverage_0x4669f08e(0x6a86e97ad433bd8acf490070fae0a95e872b0e1f0ae7bf89d6beadb8549f9876); /* statement */ 
newPar = Types.Par({
                sign: amount.sign,
                value: amount.value.to128()
            });
coverage_0x4669f08e(0xa7965423fc0f39b2a262f0fb450a1f8d2c41bf0a4dce3957986d9b0c9f3312b4); /* line */ 
            coverage_0x4669f08e(0xffa95fd3b3f121b66561419fc5aa93091025344145a568426d26a10c3575938c); /* statement */ 
if (amount.ref == Types.AssetReference.Delta) {coverage_0x4669f08e(0x33d508c2497c97a17a3d0b2703a97bc5a5dbad6a3e2f203d2c0a14e649955e3b); /* branch */ 

coverage_0x4669f08e(0x691d5646574a66997a681044b01f462cea3cfb1ec34fbc2a92d21c1094f82d81); /* line */ 
                coverage_0x4669f08e(0xeb4c0319b08081e1fe7b342ad25b5f3aaa94ac9d9d8ff8ad52fbc341b5626c42); /* statement */ 
newPar = oldPar.add(newPar);
            }else { coverage_0x4669f08e(0x51a1e1e81bf4b7906e2c8711e5212f8b15e24525d99bbe1cad134024c91a67a4); /* branch */ 
}
coverage_0x4669f08e(0xfe13765224518bfaf7aa46ddf659c015b09f34efe1f04bc9c37503da9f0bbf3a); /* line */ 
            coverage_0x4669f08e(0xbe2804ef917ead908e437d8f46d25cdb4602061d1c4298ecb0e41751625e9524); /* statement */ 
deltaWei = Interest.parToWei(newPar, index).sub(oldWei);
        }

coverage_0x4669f08e(0x624d1facad3086f54955cf8fa61342b125bbe138c855637587f7207ecf716ca9); /* line */ 
        coverage_0x4669f08e(0xe6259a021b0c923762dd4ad1c2950a299bb1ddad15ab4d4684b65b4be127c3cb); /* statement */ 
return (newPar, deltaWei);
    }

    function getNewParAndDeltaWeiForLiquidation(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.AssetAmount memory amount
    )
        internal
        view
        returns (Types.Par memory, Types.Wei memory)
    {coverage_0x4669f08e(0x5509c83759140a47bb293eeb53b068c56ea18a0ad99b3aee74bc9d022444a762); /* function */ 

coverage_0x4669f08e(0x04e3583bad9b3f70f826c348dd9406202227793df7e77d1a4b2e99d13fd75bef); /* line */ 
        coverage_0x4669f08e(0x5ff8ae6f7e9b31d207b3410ecc64f022d190061cbbb93f1aabad569f99617234); /* statement */ 
Types.Par memory oldPar = state.getPar(account, marketId);

coverage_0x4669f08e(0x6f06aa5eaa5d61e5ea01fbba1e531092d098d93a796f98835429a9d3aaad9011); /* line */ 
        coverage_0x4669f08e(0xa1f6bb2bcb152bb05f132035fbb97e1181a7b619a80440478601edce353e8601); /* statement */ 
Require.that(
            !oldPar.isPositive(),
            FILE,
            "Owed balance cannot be positive",
            account.owner,
            account.number,
            marketId
        );

coverage_0x4669f08e(0x643882d619c11f914da938af0db7474b617384ef33140046cfad2ecfc9a37a3a); /* line */ 
        coverage_0x4669f08e(0xc5123dd097e526053a3eeebb7be59bffea5380dafaa722b3807cc632a277eb72); /* statement */ 
(
            Types.Par memory newPar,
            Types.Wei memory deltaWei
        ) = state.getNewParAndDeltaWei(
            account,
            marketId,
            amount
        );

        // if attempting to over-repay the owed asset, bound it by the maximum
coverage_0x4669f08e(0xcaba6b630d5f7cf2fe4b8de020fde7aa7cadb819b8eb9abca1c21f942e4e6378); /* line */ 
        coverage_0x4669f08e(0x56c321c996ee83c9bb0fd76b502905a938fa78b1a67a9e9c703ee7e72fb29f63); /* statement */ 
if (newPar.isPositive()) {coverage_0x4669f08e(0xa9b4c03432913b3251df53ff7c5007161e31c646d7f384e4031168e33c8950b8); /* branch */ 

coverage_0x4669f08e(0xf9b093f35b4ac205e1011ca31e53c3b8c4aefe371f875c027fbb2192ddfdb174); /* line */ 
            coverage_0x4669f08e(0x31f8d0ef19045f0ac4d3bfad694505bd7f7fe45c12ad9a578bc118ec2513d959); /* statement */ 
newPar = Types.zeroPar();
coverage_0x4669f08e(0xadb9959ca927779d1e874ea0b991089fbad2c44bd476f8303f2980941987ec64); /* line */ 
            coverage_0x4669f08e(0x304759d23e0bc10a519bec216a4ab883a253b0cb050be8dccfe10c35c0b3ee88); /* statement */ 
deltaWei = state.getWei(account, marketId).negative();
        }else { coverage_0x4669f08e(0x7bccb99c121060906a7fe6b0604e903dfc019852b16a0808327bfcd17c75e83e); /* branch */ 
}

coverage_0x4669f08e(0x08ac60df1d3169defacdd474a6f9d5afb5cf90d68e39cbb3a797e70508605d2b); /* line */ 
        coverage_0x4669f08e(0xd82d1e70abcdd2c2d2a83c1088e3c6bf42d317c1587dd3090dfde2298532ef62); /* statement */ 
Require.that(
            !deltaWei.isNegative() && oldPar.value >= newPar.value,
            FILE,
            "Owed balance cannot increase",
            account.owner,
            account.number,
            marketId
        );

        // if not paying back enough wei to repay any par, then bound wei to zero
coverage_0x4669f08e(0xdcd9ac5334f8dc315719e6651c3ade1ac278fdd08d529313df310d21a409b18a); /* line */ 
        coverage_0x4669f08e(0xc62a7d5b6d2fc3ec0ee267ea46b2b6bf38a5683db3e5612b0d02ca393908f309); /* statement */ 
if (oldPar.equals(newPar)) {coverage_0x4669f08e(0x90983b58be082f951e74631fad61c4443fe8e24b1a2139be16946b2a329b50cf); /* branch */ 

coverage_0x4669f08e(0x30af8f59e6ead8d8faf0096549c5e6cb5fd5531991b7a548e04eadb25c5f0179); /* line */ 
            coverage_0x4669f08e(0x606dc31d2291af8e140154a19b919621987e15378f5932c9afec1e3d3dce4445); /* statement */ 
deltaWei = Types.zeroWei();
        }else { coverage_0x4669f08e(0xa6c4a5fef08d52c7c91b1072c951f97d5ab7301b4004e43269ff50464c48b37b); /* branch */ 
}

coverage_0x4669f08e(0x06d0b67d3541d854dc74e2aa2d8013439d70d585af164cf49292e4311b900f74); /* line */ 
        coverage_0x4669f08e(0x120d952081f540992615eca941be89779b79ce7007fa90806a0e595212401465); /* statement */ 
return (newPar, deltaWei);
    }

    function isVaporizable(
        Storage.State storage state,
        Account.Info memory account,
        Cache.MarketCache memory cache
    )
        internal
        view
        returns (bool)
    {coverage_0x4669f08e(0xc67b6cd6bacf3f0de2475971d4bb8c4c385a890ac2b8ded2018892c4b1777dc0); /* function */ 

coverage_0x4669f08e(0x4b99d694acf0dd0933d2e0d428026088d98b3ddc1df2c67eb196cd3b72cd31a5); /* line */ 
        coverage_0x4669f08e(0x283a71d2d6dc9ded05124c592bad45225fb7dd7a3ae56c6bc91e875c3bb9af3b); /* statement */ 
bool hasNegative = false;
coverage_0x4669f08e(0x9bcad54408975238272920b5e8eaaa4a655c83b2e02b4469edeec24725b32e95); /* line */ 
        coverage_0x4669f08e(0xc8ee16b11d7a06b563018cecf8487bbdf896e70fca0716a8f6d96170ed7c6c33); /* statement */ 
uint256 numMarkets = cache.getNumMarkets();
coverage_0x4669f08e(0xcc5c5393f3b84f8bb2067fb2eb8b84fa472ab39caf053f5dee6f21555b0472eb); /* line */ 
        coverage_0x4669f08e(0xed79c6fe7008e05437ab6c2a898f0c3b16828c386c13cba9eaf4736d881144d6); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x4669f08e(0x1361b83d76332d09d970c21b6a90d1873b05a5edee00c98207d2b035707d20c7); /* line */ 
            coverage_0x4669f08e(0xa3543f4ac55f947f1c6e0d0d8faf618d77fb9b84dea7c9188944868f4bcf71b6); /* statement */ 
if (!cache.hasMarket(m)) {coverage_0x4669f08e(0x2109cf01cadd05e888e28a3bdb621cd8e0e4555fc0b8aa9f14fdd7713130ffea); /* branch */ 

coverage_0x4669f08e(0x22a30aa7b04a1b5bf096d78f591e6072e32cfa13b626103200602fddde5afcc4); /* line */ 
                continue;
            }else { coverage_0x4669f08e(0x279bf4c0948d9dcba9ca53cc022c09170cb69aefcfbdd2c097adc61128949525); /* branch */ 
}
coverage_0x4669f08e(0xf16a74672e9cb81ea2fc4a1a86ee714d0e91da1ca605065e1bc89bf79b54799e); /* line */ 
            coverage_0x4669f08e(0xcada0b2f251d76445c2031cd6ffa77a7ed78e165596aa0e686fc2cf47447bdc3); /* statement */ 
Types.Par memory par = state.getPar(account, m);
coverage_0x4669f08e(0x50477600f163113fe52c73c03496bfa59eec00427a823e02d596c8d636e73cb9); /* line */ 
            coverage_0x4669f08e(0x7b2201e1f9d1601c8106e5c05504e814f72b32d67f9fdeefa9bd11c4e9d6defa); /* statement */ 
if (par.isZero()) {coverage_0x4669f08e(0x4b7751b110c441b4b6e9d8ea6066be3dee5f6a2e28d3287f08fa53cffecd7135); /* branch */ 

coverage_0x4669f08e(0x25d7d1b5cac4de6dccc5c3762a98290651be753cae12b67932fac0a4de0b27f7); /* line */ 
                continue;
            } else {coverage_0x4669f08e(0xf02486849f20083da55b2b0385a0de03617e3b869aaebf7834b7e0a3c0e34918); /* statement */ 
coverage_0x4669f08e(0xd22d3d04334d45714090a80f63891cbb271b99a08448831d9c5953af68636a6a); /* branch */ 
if (par.sign) {coverage_0x4669f08e(0x78066e26449f6bebf9f51b3dba6183b0974c5fcb3eaae6b451f339b64665e44b); /* branch */ 

coverage_0x4669f08e(0xe0bf60eac6783ea198407cdb0aae4424ac1ddcba6f8e270bb748d700cbed8ea1); /* line */ 
                coverage_0x4669f08e(0x7324589468172c1ec27d4f2e34d6f40208a16b5694338453bdf4d46cbf0e6b3b); /* statement */ 
return false;
            } else {coverage_0x4669f08e(0x5a3d1538fcfa5db54e05093f6256aa098ddcbd920b762ee510db6850ac326d9e); /* branch */ 

coverage_0x4669f08e(0x3000f7db66a9af81b6fdee4f97c85a2f10cba7d9308391c8484bd0fdabd77985); /* line */ 
                coverage_0x4669f08e(0xd9b492cb238e6ecffba3f4b48776f8382d04794f334bd81130103373953a8c3f); /* statement */ 
hasNegative = true;
            }}
        }
coverage_0x4669f08e(0x15846f555fdb92c2b086eeb60403a7ed86f94681e5b85bee77937f448ea19911); /* line */ 
        coverage_0x4669f08e(0x40baa698b0add77fe55296ae3f89db76bceadf0ad0ad6449994d8ba4cb3cbcf1); /* statement */ 
return hasNegative;
    }

    // =============== Setter Functions ===============

    function updateIndex(
        Storage.State storage state,
        uint256 marketId
    )
        internal
        returns (Interest.Index memory)
    {coverage_0x4669f08e(0xaadf6514bd59e636cb35180a652967b3e35c4e40f3372d1fc2043be10cad7ed6); /* function */ 

coverage_0x4669f08e(0xad82bd5f3b0eba41e07e54812338873887e17332237e7325871d6a4212ef06d5); /* line */ 
        coverage_0x4669f08e(0xca686237a2586794473d939a6102b12ed93b5931c75f2dbe58ba6b019e32a400); /* statement */ 
Interest.Index memory index = state.getIndex(marketId);
coverage_0x4669f08e(0x93a43b9322f9178fc296d505c1f21b9ecea23be204f43cca69466c7ca0572349); /* line */ 
        coverage_0x4669f08e(0xa781aca89b3835b816652b369f1f8cbd17a3bef3f8d3cff59be06a91b3d59bbe); /* statement */ 
if (index.lastUpdate == Time.currentTime()) {coverage_0x4669f08e(0x3f0cc5192ad8d23e4c10581b7adf48862b0d260117ff0801d74effe5dd5b4b14); /* branch */ 

coverage_0x4669f08e(0xa605427854d0cf07c7816374aee6a7ae8c0ee0ff0629b16a267c3f29e3264a12); /* line */ 
            coverage_0x4669f08e(0x96aed29bcd2010655582128e20c01834db9059535fe0cdd4c53ba9c632b22083); /* statement */ 
return index;
        }else { coverage_0x4669f08e(0x271d10f892316fd7c9043379e705d68e7667ab04243f5bad2ceb3730f671ec42); /* branch */ 
}
coverage_0x4669f08e(0x28a439bb27e1d05ca4213c287ae54319d9172e583ddb8e5482d81d677182c8a2); /* line */ 
        coverage_0x4669f08e(0x827afb437a3eeb18242856e3386ac6984fcacd57cb5095d9a46608aed70f3bd7); /* statement */ 
return state.markets[marketId].index = state.fetchNewIndex(marketId, index);
    }

    function setStatus(
        Storage.State storage state,
        Account.Info memory account,
        Account.Status status
    )
        internal
    {coverage_0x4669f08e(0x0851d3f771103545d3a0d99c67286604df07b3ea434450cefdcfd1e01cb03e94); /* function */ 

coverage_0x4669f08e(0x5226ed89ce60b2fd1b8ed01cd01591a6b7235e85599d35a9d0194f260867eb00); /* line */ 
        coverage_0x4669f08e(0xb486486d7d590e5236b07cb46e4d910ee83b5009ed0fef0348ab6e9213c7d73e); /* statement */ 
state.accounts[account.owner][account.number].status = status;
    }

    function setPar(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.Par memory newPar
    )
        internal
    {coverage_0x4669f08e(0x7a483242511339e0eee24d3531b8e688d3cd8d2d8b536084f374634f30f03e2e); /* function */ 

coverage_0x4669f08e(0xdda4ee806ea428a11acd503a2709cb6e0fe3b1aac32a927a3364163d6d5c147f); /* line */ 
        coverage_0x4669f08e(0xe6408f202374d5e7150f7813ba6f572594d6ce20913c1f1e3816ac106f0e6228); /* statement */ 
Types.Par memory oldPar = state.getPar(account, marketId);

coverage_0x4669f08e(0x79bdc94d0fae2f264e0d1883bacfdaae6b2cd7fe17a6fac80e29702924c90683); /* line */ 
        coverage_0x4669f08e(0x4a99da315651eb0cb65a539e28eda22c580b99a5a355f0b99f730de5f7ac43e2); /* statement */ 
if (Types.equals(oldPar, newPar)) {coverage_0x4669f08e(0xd324d211802d07a27bb17560860a181d70f951399910e51452ff5ede2ec7c45a); /* branch */ 

coverage_0x4669f08e(0x602c0787543c4607e5753e56c16511ce5533114e2db8b35da7f3efc283af1e17); /* line */ 
            coverage_0x4669f08e(0x3af271946577dcf76f6c5bc9fe3d5e21d9d41a89a73de74cf0cde47ba65e01c1); /* statement */ 
return;
        }else { coverage_0x4669f08e(0x259d238b2f7b4ada2cec56c722cfdf7155a6c1c911596f46c2b77a2456a6a309); /* branch */ 
}

        // updateTotalPar
coverage_0x4669f08e(0x37c6777be58dba21494ab00e7a8fba77b4ec7c99d0897e5d668bba9736ae5204); /* line */ 
        coverage_0x4669f08e(0x3bed3cc41b28d97cc1f0b362fb6c7b1e80452544b794bae269e6376b4a83ec8b); /* statement */ 
Types.TotalPar memory totalPar = state.getTotalPar(marketId);

        // roll-back oldPar
coverage_0x4669f08e(0x8fee36871f5264747836dcb071bb8c0af2ae16ade70681743c9bf09acee65e7a); /* line */ 
        coverage_0x4669f08e(0x6195d3fb76fa2c43c4e95b07bd62f816c590529f87a19790c3d2e8cd34bf0e00); /* statement */ 
if (oldPar.sign) {coverage_0x4669f08e(0x994fee763db09196e2dbd29b2c976bb9b7a776450a99e26b1a2b5660529ddd59); /* branch */ 

coverage_0x4669f08e(0x852b69b65baeafba4aa89e2f7b2e5131099af3be2fb5acac82dc08da7beac1d6); /* line */ 
            coverage_0x4669f08e(0x1c7165c28f0c69ee2b5cb5cbbb4302ba4a0d9e24c47fb6960aa91876726243ac); /* statement */ 
totalPar.supply = uint256(totalPar.supply).sub(oldPar.value).to128();
        } else {coverage_0x4669f08e(0x1207274a0add1586a36d6061557cc3e8f12b08747b31ca73d1d949ae32700d2e); /* branch */ 

coverage_0x4669f08e(0x26173b7a61ee2f73dadddee7ac3cf414bd72cec023664bd1d54fa11f401bfbff); /* line */ 
            coverage_0x4669f08e(0x83068e86622329a76452de69da2bea5a6ee9c671aab6584ba1fd5209f15a2e5e); /* statement */ 
totalPar.borrow = uint256(totalPar.borrow).sub(oldPar.value).to128();
        }

        // roll-forward newPar
coverage_0x4669f08e(0x206016c147000963b4cbaa7ed5f51c6ac107bf0589148e79f76a31bc461768b7); /* line */ 
        coverage_0x4669f08e(0x34fe9784749cc4775714db54dbb15107af9b9ca3e024ebf34a4f549e5a910c28); /* statement */ 
if (newPar.sign) {coverage_0x4669f08e(0x0ac6bee4d04b513daef0f434c7c3b7b1df12367d780e8d240ed8dba7cb1b5962); /* branch */ 

coverage_0x4669f08e(0x9b0830462838527715632bcda82c32fb0ddd23a1e1bbf3342bb5f52804e13315); /* line */ 
            coverage_0x4669f08e(0x3ea1d5bd45f6e586c478c195ef2ace03dcff1ed586d08bbbe5b346680ba65263); /* statement */ 
totalPar.supply = uint256(totalPar.supply).add(newPar.value).to128();
        } else {coverage_0x4669f08e(0x776060ca2a736f931eb13f9a1f23f55479598c8844535f2a48bca4be156b96d5); /* branch */ 

coverage_0x4669f08e(0xf8828343e3ca11b931e35a0e3fd5d77829429c3a4af63750326d273266e5603e); /* line */ 
            coverage_0x4669f08e(0x978d67363d393e91c8de9bb8783a2c299b8163ef260edaceb44f74a9cd3f930f); /* statement */ 
totalPar.borrow = uint256(totalPar.borrow).add(newPar.value).to128();
        }

coverage_0x4669f08e(0x1162b21c5caf089c0e6469144889324156a212215f58cd583ddf8163a4590c7d); /* line */ 
        coverage_0x4669f08e(0x845deda777fc099453c67a497e3a3236fccc2ec1b36ccc68b0bcddc12ad8cf7f); /* statement */ 
state.markets[marketId].totalPar = totalPar;
coverage_0x4669f08e(0x8e2b895c0adbfaf471cd78778811067ba131d602cc7f967989071c3f44d5a0db); /* line */ 
        coverage_0x4669f08e(0xc2950d80247d44e8414a994a6c834499abfb8924d202561de73f9f88d7668063); /* statement */ 
state.accounts[account.owner][account.number].balances[marketId] = newPar;
    }

    /**
     * Determine and set an account's balance based on a change in wei
     */
    function setParFromDeltaWei(
        Storage.State storage state,
        Account.Info memory account,
        uint256 marketId,
        Types.Wei memory deltaWei
    )
        internal
    {coverage_0x4669f08e(0xd1b9039e8e55e7c6c97f9dc1126a47a2640896bc5789e4d726635569320e3402); /* function */ 

coverage_0x4669f08e(0x7c88315c76cff034d5299c79e5c41d0b25dbeae9085e93edc657b1f18d015913); /* line */ 
        coverage_0x4669f08e(0xd20c7a6f135c27e3e83960a7e676d797e9dbb12cebe1c4eff2ddc3e4d06b7aa1); /* statement */ 
if (deltaWei.isZero()) {coverage_0x4669f08e(0x33168607657b2855da3e970c7ad9d4c16e8c80c544fa75a41e640a83fd4be178); /* branch */ 

coverage_0x4669f08e(0x66f9d6d28edddc0b5d0948fef154a3a3b7a7d8e323c9bd885ff1782427cf929a); /* line */ 
            coverage_0x4669f08e(0x3e42f6ad6341ba3f62802822355f1c873f793d5d18d28547ac9c1163b9b8cc19); /* statement */ 
return;
        }else { coverage_0x4669f08e(0x14b1b9b08831ef0003f1d540ca30989e9ad578ca9fa0bfda914b552456997420); /* branch */ 
}
coverage_0x4669f08e(0x203ae7a5f74aee0288245fd927e6d0d7d9b0f865f60ae11eee4a8b76e315f175); /* line */ 
        coverage_0x4669f08e(0x6efc036096206c72d3a312538ea51a869a15218ba1f58861d1678afaecb9bbbe); /* statement */ 
Interest.Index memory index = state.getIndex(marketId);
coverage_0x4669f08e(0xfb5812ac5bce0f3e8d840476b1cfb835521f0bafd45fd454654bdc7b0b196b86); /* line */ 
        coverage_0x4669f08e(0xd84f4a9cb30d0fc3b3d18a10aca7f21af14b80577020655b71239e96f7a3da71); /* statement */ 
Types.Wei memory oldWei = state.getWei(account, marketId);
coverage_0x4669f08e(0xb658c51a8d34abdcd9d57874a5d89803e6245e296f7ec64ffa18c5ee1a6ecbff); /* line */ 
        coverage_0x4669f08e(0xc6e12bae2450a43a9b366e94b82909660b0ed190a10428d5ae6fd3f25c1c2e8d); /* statement */ 
Types.Wei memory newWei = oldWei.add(deltaWei);
coverage_0x4669f08e(0xf905ab0bdeb6ff56dcd0fa38589f5bc257524ea076415038e03fe07cf296f205); /* line */ 
        coverage_0x4669f08e(0xf2e8e030180c2fc1ba2e728d77349623b50d558aa2774c9f6c6d307fffac226a); /* statement */ 
Types.Par memory newPar = Interest.weiToPar(newWei, index);
coverage_0x4669f08e(0x2536d16cfd1916111bcbe6fc304e9ae136204b9348e02e663c3cbd10e15f0533); /* line */ 
        coverage_0x4669f08e(0x03ce282d6938ea715ffeb79276c35ca6c1a2d433e6c823584d251840c5d3efef); /* statement */ 
state.setPar(
            account,
            marketId,
            newPar
        );
    }
}
