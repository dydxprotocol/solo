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
import { Math } from "./Math.sol";


/**
 * @title Types
 * @author dYdX
 *
 * Library for interacting with the basic structs used in Solo
 */
library Types {
function coverage_0x879d5d0f(bytes32 c__0x879d5d0f) public pure {}

    using Math for uint256;

    // ============ AssetAmount ============

    enum AssetDenomination {
        Wei, // the amount is denominated in wei
        Par  // the amount is denominated in par
    }

    enum AssetReference {
        Delta, // the amount is given as a delta from the current value
        Target // the amount is given as an exact number to end up at
    }

    struct AssetAmount {
        bool sign; // true if positive
        AssetDenomination denomination;
        AssetReference ref;
        uint256 value;
    }

    // ============ Par (Principal Amount) ============

    // Total borrow and supply values for a market
    struct TotalPar {
        uint128 borrow;
        uint128 supply;
    }

    // Individual principal amount for an account
    struct Par {
        bool sign; // true if positive
        uint128 value;
    }

    function zeroPar()
        internal
        pure
        returns (Par memory)
    {coverage_0x879d5d0f(0x8311ae7c6db6ab8f7fe272e49a9dc335fed85f5e7126c62ab9ca543c42923493); /* function */ 

coverage_0x879d5d0f(0xf5e4f5e1e53d7d2b87cbd942837dcf369c1f4078313e2ed69034aaaae87deeb9); /* line */ 
        coverage_0x879d5d0f(0xc5ec63bbd7f6ceee9a196391e17c19a0ca2d9b39390dc79478c51d4b1c47fe4a); /* statement */ 
return Par({
            sign: false,
            value: 0
        });
    }

    function sub(
        Par memory a,
        Par memory b
    )
        internal
        pure
        returns (Par memory)
    {coverage_0x879d5d0f(0xa81c80a0032e4987647c2baad09a7a1f0fe3e7ba511609dba26bf441958dab86); /* function */ 

coverage_0x879d5d0f(0xc079d1a1903c584c2e2f64c4992f9e23891d3b53e1c763398711e2ac71337273); /* line */ 
        coverage_0x879d5d0f(0x44b523ebc090afb4da45dec938beb9d85042760be06efa3b95c826d8633fe68a); /* statement */ 
return add(a, negative(b));
    }

    function add(
        Par memory a,
        Par memory b
    )
        internal
        pure
        returns (Par memory)
    {coverage_0x879d5d0f(0xf50aabbadb5322b38fc881e709064cb1ecee08d8787f11a71418f6d5b2a72731); /* function */ 

coverage_0x879d5d0f(0xef882c12ec15f36093b8ea3d89a5b243e9cdd887e4b1bc0df4c53b1c09a61cd7); /* line */ 
        coverage_0x879d5d0f(0x848cc81eb87b64d5693b168f08c49bae032816a82905a0ac1634ecd10ba582e1); /* statement */ 
Par memory result;
coverage_0x879d5d0f(0xd21cd88675436a8ab1e159878b66b36de9e5d325f5335261f9b72748ba8d3977); /* line */ 
        coverage_0x879d5d0f(0x400b6608219f22d90d2fe4f2b8cf43d88870bcc84a57cbcb833e74bc552f8a18); /* statement */ 
if (a.sign == b.sign) {coverage_0x879d5d0f(0x208d2b153ff391d77597d0776ebe22e8ebea6ef5dcf34582792d1ca7d6ffed6b); /* branch */ 

coverage_0x879d5d0f(0xc2af3857afb18057fde0dec92f72d0c599f89e738ab58a9283a8fb62d53affd4); /* line */ 
            coverage_0x879d5d0f(0x30cfa683f23b5abdd1c8b176cd4c309ec79bbef93777264ed1523bddf88f1639); /* statement */ 
result.sign = a.sign;
coverage_0x879d5d0f(0xe6a482e6d51699025b4b099038929be30addc0f3e66bf9c354827ca1c0b00bc5); /* line */ 
            coverage_0x879d5d0f(0xeef092e337deee262b5dd145ee279cdb7a734702386f625e52dc9ef9924fb782); /* statement */ 
result.value = SafeMath.add(a.value, b.value).to128();
        } else {coverage_0x879d5d0f(0xdd375c8b2edd0698a554b486dce5eb9655f817df0b8cf5d5c350dfa6414a51ed); /* branch */ 

coverage_0x879d5d0f(0xd3c9c9d4e93fb34d46770314370ccd2c4de496473629955145f74ef5dfc2b2f0); /* line */ 
            coverage_0x879d5d0f(0x71bd8ecb57dad1fa2fb6eb75578630a64ec722e8df37a12fc8fe121245580a60); /* statement */ 
if (a.value >= b.value) {coverage_0x879d5d0f(0xdda32c526d776bea26da0e8ef5ee1713d57adfdfd283e327104b3b2f2fb734c3); /* branch */ 

coverage_0x879d5d0f(0xef5872136805c249091733806047c5cef8c4924c4ae3722486d2b90a268b271d); /* line */ 
                coverage_0x879d5d0f(0x5ca78fe26b989bf86a14f3baa91e63208814c262e08fa11a123b8f4fc693eec1); /* statement */ 
result.sign = a.sign;
coverage_0x879d5d0f(0xf153879bc130cf628ee8ffffe15087d4dd8d6eb5fd99ee0c15e70afa0d37e526); /* line */ 
                coverage_0x879d5d0f(0x384f8f289bca5a4a684c75119cea913edf0634707ba487275c9fc0ec6a70f773); /* statement */ 
result.value = SafeMath.sub(a.value, b.value).to128();
            } else {coverage_0x879d5d0f(0x0c287c04d2cc2eedd41ad3be2a8ea27e0255ab1886754fcde2bb6e905ddf86cf); /* branch */ 

coverage_0x879d5d0f(0x08e30aefc6062eaf3b8169acdb6210fca4f8938b51d8faab6edb60cdcced7746); /* line */ 
                coverage_0x879d5d0f(0x53115bc9858766b22f3e88f25d2ff6cb58f89440e1dbb8788ab5637632bbe1dc); /* statement */ 
result.sign = b.sign;
coverage_0x879d5d0f(0xdc29beedb083e9620507107654c9728c03281039f8a789e2c4b59d0cb14ec49f); /* line */ 
                coverage_0x879d5d0f(0xb3954ef9a4d56e18afa38b08ef1c1357803976fc24bd1774e217f184a62bb03d); /* statement */ 
result.value = SafeMath.sub(b.value, a.value).to128();
            }
        }
coverage_0x879d5d0f(0xed82a7748b40381c489478fcbb9c5d136c0dfb1f107ee7ed595adb0b3c38b4dc); /* line */ 
        coverage_0x879d5d0f(0x295ef7e5d1db8403e03ba029af5d3b6860766db3f78ecb5ed9839ad0da805622); /* statement */ 
return result;
    }

    function equals(
        Par memory a,
        Par memory b
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x6ee00b676662a2f9af9acd7c155dd90bee9c3bfd27388850620ca11d6f273d3f); /* function */ 

coverage_0x879d5d0f(0x4c81ad929aa706fb62b936c5c77a235bc6c73ab6f220ffa66e2f8809817cc506); /* line */ 
        coverage_0x879d5d0f(0xf7805a0d8446be0b91d0301dbe3cd98e3badf6b37a06dd002fc402909d85de11); /* statement */ 
if (a.value == b.value) {coverage_0x879d5d0f(0x86f05c161f5f2babf8ef43022b294c444da0ae1f674075d3adaad42a3c98fdfa); /* branch */ 

coverage_0x879d5d0f(0xbbd7dd1a1376249aea02f26269eab76b7d1ad4241ddee2a6322d75192c3c22b4); /* line */ 
            coverage_0x879d5d0f(0x9edf1292773b832def0d17b0b5d1b96bf24abd52ecc9cd797cceb5dbd2314e61); /* statement */ 
if (a.value == 0) {coverage_0x879d5d0f(0x7d92468339f4ec9ebc7c5901174af2dfbc035e9542fb6357868dd5366c000e05); /* branch */ 

coverage_0x879d5d0f(0xd6fdc1b433e053ce8396de3a31dd7bb63e6a44f917aa8d78968888d2677c1ee5); /* line */ 
                coverage_0x879d5d0f(0x84f43f1bdde63eff10f5dbc1e0db635ff5ca5eff74af9d8a63311552d30cea4e); /* statement */ 
return true;
            }else { coverage_0x879d5d0f(0x9763ac18497fa45c1b3490ab9fa3493064112076e7c731aae47bb153607746be); /* branch */ 
}
coverage_0x879d5d0f(0xe027de85500c4ebc39b2c1c1bb31ae5a8eda8d0446e263247af3ae1c657befa2); /* line */ 
            coverage_0x879d5d0f(0x8e7723e2b9ca83950d85431f5521818cad329ae45f85a3335bd495f4ff437209); /* statement */ 
return a.sign == b.sign;
        }else { coverage_0x879d5d0f(0x888333885ab05b96d3eadbdf8ad4e02ecaf43a925cfa8fc3de4c00de199800ca); /* branch */ 
}
coverage_0x879d5d0f(0xf48cffad4063f3bba22e659d4dee52d459e7b8bbe1ae9e683444d41b0b39f556); /* line */ 
        coverage_0x879d5d0f(0x2be39f68274fbec179db95a1d6cd7248fa3e25aed548375902602480a537841b); /* statement */ 
return false;
    }

    function negative(
        Par memory a
    )
        internal
        pure
        returns (Par memory)
    {coverage_0x879d5d0f(0x1903ddaa6736254ae87d606104268adc5c861797c3d8da64a0baf1d4165cd00f); /* function */ 

coverage_0x879d5d0f(0x61512779722cedc4d2795e5bb88cbda406bd1197a91be00c27c55752f75c814b); /* line */ 
        coverage_0x879d5d0f(0x9a7c2e521740fccb4cd67cb00767978c0657ef01047e42788f7c07aa607ebe02); /* statement */ 
return Par({
            sign: !a.sign,
            value: a.value
        });
    }

    function isNegative(
        Par memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x9de4e67196aef29908f9aaf501ba8edb189ddd574ecaa82fa841e32a2eb5e8c2); /* function */ 

coverage_0x879d5d0f(0xa7ea7ef39406eb4e14479f98e510f8dfea0099173a6bdc096cc8983520980939); /* line */ 
        coverage_0x879d5d0f(0xc6476f1191905252ce094edd948b25310a594e5b1b1d5294c07b598fd59a9b9e); /* statement */ 
return !a.sign && a.value > 0;
    }

    function isPositive(
        Par memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x2e16b65f9573fc0c9433b5f1627c79f1509a02a0626d3aec892cb788c42ca8de); /* function */ 

coverage_0x879d5d0f(0xdddc26680b61f6dd4a18312b294be235381d99b7a7aa098dc8651948e02fa8d1); /* line */ 
        coverage_0x879d5d0f(0x42145bcf947dce374c154300d79e523a93bb26912dde1be5a8a701f9c865e69a); /* statement */ 
return a.sign && a.value > 0;
    }

    function isZero(
        Par memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0xaca29308128d2bfb141f09ef8f90bda383c1252f431087c1fde55371e758e917); /* function */ 

coverage_0x879d5d0f(0xfe3b33cec857b2d625d64cee4680407744c17d70feca54e67b7f025e81576305); /* line */ 
        coverage_0x879d5d0f(0xf0dcced0d360ddb1f3ef808e67b139b6446d3ea43fe278f2686cd556394e9247); /* statement */ 
return a.value == 0;
    }

    // ============ Wei (Token Amount) ============

    // Individual token amount for an account
    struct Wei {
        bool sign; // true if positive
        uint256 value;
    }

    function zeroWei()
        internal
        pure
        returns (Wei memory)
    {coverage_0x879d5d0f(0x083c1f7969b2a39f19b92bae8323d3968872b608e6f53f37ccc9fdcc895388b9); /* function */ 

coverage_0x879d5d0f(0xf21ae57b11a12dfc0668ac0a89903d0a2a75209f6f9ab7d52c0cc98b76edca5d); /* line */ 
        coverage_0x879d5d0f(0xd664bc35f68a06dc6867b0ab78b18e4140b9799c065cd9a70e71dfed92991ec9); /* statement */ 
return Wei({
            sign: false,
            value: 0
        });
    }

    function sub(
        Wei memory a,
        Wei memory b
    )
        internal
        pure
        returns (Wei memory)
    {coverage_0x879d5d0f(0x921dfb821e6eae0fafb5d03c73ff261a839abfbc53484b861fbe135635ff495e); /* function */ 

coverage_0x879d5d0f(0x8e8b7e59b8ddafaa1c40af018b8d897c6cbd1a1cbb4333f459b8c8aa842fd7e8); /* line */ 
        coverage_0x879d5d0f(0xd7a1a289dbf7c93d2d0fd08bcb24ec3cb3e656e45036dc7ef67df51a7b2cec5e); /* statement */ 
return add(a, negative(b));
    }

    function add(
        Wei memory a,
        Wei memory b
    )
        internal
        pure
        returns (Wei memory)
    {coverage_0x879d5d0f(0xe56fa9bf91520266b25bcfe44bc6adc41ef04790b82c2e351224b57145ba9887); /* function */ 

coverage_0x879d5d0f(0x7425a0a424f840b1ae8063b795548004b1a45a495e99921a4fe98fdf4f329eff); /* line */ 
        coverage_0x879d5d0f(0xda8e71b3202a6ac745db7a327d41377ead553c498ccd10ef18f178a239a9a6e4); /* statement */ 
Wei memory result;
coverage_0x879d5d0f(0x66c1fabba1d84f9f3d35dfd138b5ac1d259f56a64ce4d7c27f1aebda5ebffee9); /* line */ 
        coverage_0x879d5d0f(0xd1f535f36778ab5dbd945f54dbd14cc775bae2539c0865871f403a718b785ef3); /* statement */ 
if (a.sign == b.sign) {coverage_0x879d5d0f(0x2d6a650805aaa6278b34dcdebb2561958ed863cb5fdb9a744f4e3f630fb5b66a); /* branch */ 

coverage_0x879d5d0f(0xf86d3dad565ceb3313a11d5546205ae957a1f56d7b34a0805d11a1972bcfbee3); /* line */ 
            coverage_0x879d5d0f(0x6eb19cfda3de3afbb746398ef21ce554d4d0d4cb4fc4cb2a7a17f1f819a6c97f); /* statement */ 
result.sign = a.sign;
coverage_0x879d5d0f(0x22662580479c107ff8b47540fe6fb08d7b16b628d7f424188222c1ea27eedd6e); /* line */ 
            coverage_0x879d5d0f(0xf59221c81a8efd4cd8a9a4a2df3c0887c703d16292c62c0c480c362ec7175ea7); /* statement */ 
result.value = SafeMath.add(a.value, b.value);
        } else {coverage_0x879d5d0f(0x69677458878d79bff3cad62630958e1f12bc95c739a3aeb9f782213d6c7b443c); /* branch */ 

coverage_0x879d5d0f(0xd060edba86fcc24633ec29bada1bae5d2221460eb976aea34063832cc9999ff8); /* line */ 
            coverage_0x879d5d0f(0x103c5501a27452fc71f4af255f2d01a809cb43d37a6ad97099bdc477060e409c); /* statement */ 
if (a.value >= b.value) {coverage_0x879d5d0f(0xf64392cc98c72911a1822b918e4963ea90f868d5e6203592e8c24b15599161ea); /* branch */ 

coverage_0x879d5d0f(0x844f907ba32b1729d86a7faeb3a10072aed2a4a2ffa77cb397a0b1738f87f14c); /* line */ 
                coverage_0x879d5d0f(0x7c50edb8e88bfdd735e72da73b0473654f84a4610080a792ebf46dfaabd00963); /* statement */ 
result.sign = a.sign;
coverage_0x879d5d0f(0x79a5d6380e26447ada66252b96f483b88190972332b7c5aa28405846c5b25e3f); /* line */ 
                coverage_0x879d5d0f(0x53cb5bcd9aa3c50210134632ca0879e3b947adb106ae556b1a6b425be26b900f); /* statement */ 
result.value = SafeMath.sub(a.value, b.value);
            } else {coverage_0x879d5d0f(0xa0b37019c83e83fa940a7a08d4064d754520d7f3471c3f36413b21ace2324af8); /* branch */ 

coverage_0x879d5d0f(0x27ecb6add80eba3bb5c584bcb40672753f1884e7f852cb907dcc52687c3bb6d6); /* line */ 
                coverage_0x879d5d0f(0x56504984e04796337e2bff9c8286e832e12d41d341a93f664fc44594574d7fb0); /* statement */ 
result.sign = b.sign;
coverage_0x879d5d0f(0x8bc4adc4a64d3d1cb044140cfd0717aba8ccdad3cded2844f36846b5c2204f03); /* line */ 
                coverage_0x879d5d0f(0x4b9812eabe48ec8fbfca79f3bb7f2e118b49aecf7b9b1ce748ebfe6374888ab5); /* statement */ 
result.value = SafeMath.sub(b.value, a.value);
            }
        }
coverage_0x879d5d0f(0x001e0f610ccff8e0881412024cb4a24cabf78665d349d8a464411ff5da99ad22); /* line */ 
        coverage_0x879d5d0f(0x551527b8668d0d3710ef9f5f11bb13396f30700c708e43c6398320de7238c25d); /* statement */ 
return result;
    }

    function equals(
        Wei memory a,
        Wei memory b
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x701a28b2d9d80fc483fd2314a9e6a4ffc9dbbf09ed8669d946078691a231f6c3); /* function */ 

coverage_0x879d5d0f(0x61981752db26f1f86cba62ee4b971990f76175f4ad445a906d7336a9b6c4c5dc); /* line */ 
        coverage_0x879d5d0f(0x3e38afd1102899b11a6dcad738431bdf73603df0107a7345618a9acc3ee3b494); /* statement */ 
if (a.value == b.value) {coverage_0x879d5d0f(0x62bc8a7dcfc52bc7903daa73f7a12f3a5d25b3bc7fd65639e4014f5040c74774); /* branch */ 

coverage_0x879d5d0f(0xc8314713eb7e5a3e0220fc01721f0d355f5ae09b6b607a252f0190bb78edcb0a); /* line */ 
            coverage_0x879d5d0f(0x193d3deda774d5c4b43af481960e0056f683fae587ae85f65f7344df4e38ad4f); /* statement */ 
if (a.value == 0) {coverage_0x879d5d0f(0x08d5976bf4353fb48299198b296f9eea3e164709a7372fb5c69682cc9d2e1444); /* branch */ 

coverage_0x879d5d0f(0x1f3db55e27498da3e61461685544ee69ec761c700cd52c67519a1aa406076f04); /* line */ 
                coverage_0x879d5d0f(0xbf270ad6876f7323b8623c2640d47abd3f86de47ae1f40cc75ba57c2c10fd557); /* statement */ 
return true;
            }else { coverage_0x879d5d0f(0x722049fa2849feabcd7865a4774c02c5cda5a7bc9c3ceadefadfa37ef98a004e); /* branch */ 
}
coverage_0x879d5d0f(0xb1f0abbc61e64e354edf08dd4cc44ab77e206df3f84f428d98c9ff0369d9680a); /* line */ 
            coverage_0x879d5d0f(0xa14991e7e5bb652f7ed19db5638fd063b3290979811a046aaa28844991120af4); /* statement */ 
return a.sign == b.sign;
        }else { coverage_0x879d5d0f(0x831e49da6b65eea92ad16b532af59ff6ce6d6354e34545c65c02157c28f093db); /* branch */ 
}
coverage_0x879d5d0f(0xb159b2f18d23d833b73c42ead84d1626988aa86f1cdfe00482fa9134096b33d4); /* line */ 
        coverage_0x879d5d0f(0x79a7fdab5caf8ea5ff8b2cb0795544bd32e0c189133cd4c10b1f3dcae4fc5de2); /* statement */ 
return false;
    }

    function negative(
        Wei memory a
    )
        internal
        pure
        returns (Wei memory)
    {coverage_0x879d5d0f(0x99092f88411b22517d67cdcff4c56a715f83b30c7ec67c5229a59453336b8f5d); /* function */ 

coverage_0x879d5d0f(0x4f8f44de24f904ed381483d8a24aba25ec6af8c3f5e07cfbe12fb3c346ebfd55); /* line */ 
        coverage_0x879d5d0f(0xf625197a4c864f2a88d86062c15ea4ca91834647a5df2604c8cc6cb0936ac7bc); /* statement */ 
return Wei({
            sign: !a.sign,
            value: a.value
        });
    }

    function isNegative(
        Wei memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x6786856a7495a5cde782564cd78b511491ebda717592e0b09e0ea59c4f5eef55); /* function */ 

coverage_0x879d5d0f(0xdb8e3e08a49b04b9d9042214bf25829e4f014e9f0a378b2f4bd31b17b0e22fcf); /* line */ 
        coverage_0x879d5d0f(0x937943dea23cee633f55acebd122405aa26df12289fd7e07118db09a8b7d9325); /* statement */ 
return !a.sign && a.value > 0;
    }

    function isPositive(
        Wei memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0x20e3d06bc5502e2d581c9ce2150dfba99d4e8e54476f36e355b0e20b2dd7996d); /* function */ 

coverage_0x879d5d0f(0xcd5bfcb04e43a8b78f93547b180dec6c797b7b8a88523a0152ea245fc7e9f597); /* line */ 
        coverage_0x879d5d0f(0x1693602d3505619b4a4392f031b3b3b434912309b2566dfd469cc492e1bb790f); /* statement */ 
return a.sign && a.value > 0;
    }

    function isZero(
        Wei memory a
    )
        internal
        pure
        returns (bool)
    {coverage_0x879d5d0f(0xba2bb3f6ed2300196002b1d6a9648155694c04a421938d371ff62010dd22a8bc); /* function */ 

coverage_0x879d5d0f(0x5a2d7b96fb016da9114c81c7ffb8dc704cc2b4ae52c70196e15464dff3e594c3); /* line */ 
        coverage_0x879d5d0f(0xdce84c9db72aa824be066c69405538b403d74b5691f56a469235d4fc42b05639); /* statement */ 
return a.value == 0;
    }
}
