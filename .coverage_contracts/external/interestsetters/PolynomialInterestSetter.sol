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
import { IInterestSetter } from "../../protocol/interfaces/IInterestSetter.sol";
import { Interest } from "../../protocol/lib/Interest.sol";
import { Math } from "../../protocol/lib/Math.sol";


/**
 * @title PolynomialInterestSetter
 * @author dYdX
 *
 * Interest setter that sets interest based on a polynomial of the usage percentage of the market.
 */
contract PolynomialInterestSetter is
    IInterestSetter
{
function coverage_0xb638064a(bytes32 c__0xb638064a) public pure {}

    using Math for uint256;
    using SafeMath for uint256;

    // ============ Constants ============

    uint256 constant PERCENT = 100;

    uint256 constant BASE = 10 ** 18;

    uint256 constant SECONDS_IN_A_YEAR = 60 * 60 * 24 * 365;

    uint256 constant BYTE = 8;

    // ============ Structs ============

    struct PolyStorage {
        uint128 maxAPR;
        uint128 coefficients;
    }

    // ============ Storage ============

    PolyStorage g_storage;

    // ============ Constructor ============

    constructor(
        PolyStorage memory params
    )
        public
    {coverage_0xb638064a(0xad76b855aaea6193ba74c20c7a0006288d8617650dc8135771263b316f1b9965); /* function */ 

        // verify that all coefficients add up to 100%
coverage_0xb638064a(0xa6fe7d0428e11b12b794411d781691c582a25f738620265db55bcab3fece16dd); /* line */ 
        coverage_0xb638064a(0xf08e147c1b4a7455e5045dd12fefa91ba11badffdbe25f6193d0a14ba4652142); /* statement */ 
uint256 sumOfCoefficients = 0;
coverage_0xb638064a(0x1ea45dc6df02fc112398c82b337be84a236f6dedf5bf504e672546e8b9404760); /* line */ 
        coverage_0xb638064a(0xf9fbd6bf4ad6922c728b69f9ad5219346922e8c25a4ca53ad40f6fed5ee48e2b); /* statement */ 
for (
            uint256 coefficients = params.coefficients;
            coefficients != 0;
            coefficients >>= BYTE
        ) {
coverage_0xb638064a(0x733b5d79dbb78e1df9c1d025ceb82e667de09cae176acf63b2ac7972e0adb47c); /* line */ 
            coverage_0xb638064a(0x0173de98ee45b74729c1a6b873ed67a515b5e8a4f238655ef8df644e470c2d33); /* statement */ 
sumOfCoefficients += coefficients % 256;
        }
coverage_0xb638064a(0x18c328349b2a12f4bf86a34f0605af1b0c637898a0aad7461fbf2dc3f627908c); /* line */ 
        coverage_0xb638064a(0xe865a7694b00af3b9726b08787377fe15f602666aa2f7b706387599a857ef8fb); /* assertPre */ 
coverage_0xb638064a(0x83f0126bff07d99e97164bf650c5a35750819510e52dbb0ea04f27d99f14cf93); /* statement */ 
require(
            sumOfCoefficients == PERCENT,
            "Coefficients must sum to 100"
        );coverage_0xb638064a(0x31db0e7db4ff2a11a29ae65fb0d94c4ca64be76fb7e3d56d289405b5419187a6); /* assertPost */ 


        // store the params
coverage_0xb638064a(0x78959b786c34fb7b0e0d89cd9bb0e63e09f73b5dc2c284875ba5f3195955b876); /* line */ 
        coverage_0xb638064a(0x6ecc1fd63631c635db966b148fc1ed4e7506133ee03873d148630b6b57933954); /* statement */ 
g_storage = params;
    }

    // ============ Public Functions ============

    /**
     * Get the interest rate given some borrowed and supplied amounts. The interest function is a
     * polynomial function of the utilization (borrowWei / supplyWei) of the market.
     *
     *   - If borrowWei > supplyWei then the utilization is considered to be equal to 1.
     *   - If both are zero, then the utilization is considered to be equal to 0.
     *
     * @return The interest rate per second (times 10 ** 18)
     */
    function getInterestRate(
        address /* token */,
        uint256 borrowWei,
        uint256 supplyWei
    )
        external
        view
        returns (Interest.Rate memory)
    {coverage_0xb638064a(0x460407b5d772099b48f1a370cf8186875999a3938f11d03f7f23318404e419dc); /* function */ 

coverage_0xb638064a(0x5a50e003fab6b10c7853669eec00287db2de107583e2fc3ede5fb68c6bc664e0); /* line */ 
        coverage_0xb638064a(0xa7b0a5bfd38351f5c114a362eba489466a928401deb97253bc972aa8010f6e09); /* statement */ 
if (borrowWei == 0) {coverage_0xb638064a(0x28756c9d9bdf3f6820a9cca90e7f4a49533ec1218a9aa34c3a293c74d555edf6); /* branch */ 

coverage_0xb638064a(0xe27816e53cd5f20eeb9fc2d8fe8f351e8bc6bed45c89ba696a54ee59f7941b21); /* line */ 
            coverage_0xb638064a(0x5055b7d790c3a241779201dd9fbd70e46fbe70047a9263fe8bfb6b718cb53801); /* statement */ 
return Interest.Rate({
                value: 0
            });
        }else { coverage_0xb638064a(0xf342d68bd2aab47bb0d1a25b7226388441d374d0c2473010af46a1ef91632678); /* branch */ 
}

coverage_0xb638064a(0xe662d108b7ca1dbbe32c6643880927af26a1040b603091a7b282568a02fcf6f3); /* line */ 
        coverage_0xb638064a(0x25bed70d6c5854555044e0e2d384e08c064eb2c318a1f32e79d82711ca0e4382); /* statement */ 
PolyStorage memory s = g_storage;
coverage_0xb638064a(0x5d73a9fb4221d06cb4424a1dc6ef8738ce7ec72fd3e21aa7362b7b79886c295f); /* line */ 
        coverage_0xb638064a(0x0559ca64ed17e419792a3855be06135dbd9652a8d26f4c5ba5f313f57038faa1); /* statement */ 
uint256 maxAPR = s.maxAPR;

coverage_0xb638064a(0x939306eaf358aa2b285537c56efc3b4c64d1ea1779cc1b9e15d34bb8c5f0a500); /* line */ 
        coverage_0xb638064a(0x050023c15eff0b4850243ffc0d53cb4eb778f939c8d0d34d1d8899897e2e4a53); /* statement */ 
if (borrowWei >= supplyWei) {coverage_0xb638064a(0x3f93991ee95837a231e4b7c82febcbb77a0558996ea43649f686ad827f13d562); /* branch */ 

coverage_0xb638064a(0x1e5f623af9507d008778b7187dace2b0193f92bcdee3c1265a89139325b3ea51); /* line */ 
            coverage_0xb638064a(0xd82ad0a17ba3b6b30cbe76322f35c77c08f6ee696b1606dc3ef111447e6e7a67); /* statement */ 
return Interest.Rate({
                value: maxAPR / SECONDS_IN_A_YEAR
            });
        }else { coverage_0xb638064a(0xd7420a15d9cbdfb1375fa7914f1b7cf5b87effb9f0d914cbbeccf7e9f49ecaf4); /* branch */ 
}

coverage_0xb638064a(0x779ff1bd8128605299967fdafc1f10220a2d95471677c6613d319514cf691a96); /* line */ 
        coverage_0xb638064a(0x0d4efbdfb9a25c9160eb21196a4eae66e65c20ebfd5227e997de539aeae45b0d); /* statement */ 
uint256 result = 0;
coverage_0xb638064a(0xf436d3e1dc2f1f73fb5a0550212e5cfe770138076bacd041ddc3756276abc839); /* line */ 
        coverage_0xb638064a(0x5e78a81f650fb0f9123fae6310efd7b4587473ef18b093b4fab92e194fe26a95); /* statement */ 
uint256 polynomial = BASE;

        // for each non-zero coefficient...
coverage_0xb638064a(0x59de75193e4100405a4967ac66243b91e1d215785d5e125cc0f2eeb35ac4ec19); /* line */ 
        coverage_0xb638064a(0x9ad28eebc90d887bdaf89ad5882726326f9aac189a0b8c334d50fcc89df10ad2); /* statement */ 
uint256 coefficients = s.coefficients;
coverage_0xb638064a(0xc98bbd052b000438f024878a4eb942634dd2bdd998cff87f96f578e5f0d20e4c); /* line */ 
        coverage_0xb638064a(0x0e6d6106c58f22abea759fbbf5276cd9846f0efc5ea4d6bf562327bd61e41c6b); /* statement */ 
while (true) {
            // gets the lowest-order byte
coverage_0xb638064a(0x4af4a51f50e6e4b12c16d22b56078bf70ab3df0a3619ad48116c363f07085d6c); /* line */ 
            coverage_0xb638064a(0x767b873c883c361a6d6f192b713fc809a5394519123a53e5b4a8c69bd8c05385); /* statement */ 
uint256 coefficient = coefficients % 256;

            // if non-zero, add to result
coverage_0xb638064a(0xabc4f42984c80a469e34454391bb452a5f57aef6c35b49ff2f049fc8c5d35d10); /* line */ 
            coverage_0xb638064a(0xcc600414058ffb834af415900bcf344df139c39d70f9fd264025df524cba55e4); /* statement */ 
if (coefficient != 0) {coverage_0xb638064a(0x6404ef9a37755ede4592e4b03c86fbeee18161ed38db2c05972b7c01e53f49fb); /* branch */ 

                // no safeAdd since there are at most 16 coefficients
                // no safeMul since (coefficient < 256 && polynomial <= 10**18)
coverage_0xb638064a(0x9c34db06326e460df7f7de91e0219497e531e82941d43a451a45f677b2eaf5ef); /* line */ 
                coverage_0xb638064a(0x4831cb00f8a8277b944e948d267015805443f156ab674d0810c35eb63a488ccb); /* statement */ 
result += coefficient * polynomial;

                // break if this is the last non-zero coefficient
coverage_0xb638064a(0x9222408a73184f6ca01ee623aedce139071b20e6ec7d8a5af4d1cd0ffbb048a5); /* line */ 
                coverage_0xb638064a(0x88a7948b773fe3f981cf40972bed51b0b38629fd3243edce2d0f3e1744ea2351); /* statement */ 
if (coefficient == coefficients) {coverage_0xb638064a(0xc75b7e1785d7221ef153344bcf415c80473d8912d845a65e822a5543f6d7bdc5); /* branch */ 

coverage_0xb638064a(0xf2ad0584a1ae2fd762225b082636f20927e134de9035cfe566e5d7050f8a8fcc); /* line */ 
                    break;
                }else { coverage_0xb638064a(0x6bddfc8cd6e65e6eecdaa650efbf4d768569a3893479f1ccad0389a778d4ba92); /* branch */ 
}
            }else { coverage_0xb638064a(0x1424c709fc1343a8f7250e04fd48692ac271664a60eea6512a69b8a98624d274); /* branch */ 
}

            // increase the order of the polynomial term
            // no safeDiv since supplyWei must be strictly larger than borrowWei
coverage_0xb638064a(0x814ea439abb88b26b51d716f8a86cc09c36a4a0f644b6ad65bb370593b2002c9); /* line */ 
            coverage_0xb638064a(0x8a8f274811a1551fa2ccb911fce06d42ce5719cb055fba8a7ced2e77ac86142c); /* statement */ 
polynomial = polynomial.mul(borrowWei) / supplyWei;

            // move to next coefficient
coverage_0xb638064a(0x273293f486b8c0c74c4221678b919bc6052457bd0cf2ca46235137f74cfc65e9); /* line */ 
            coverage_0xb638064a(0x22016eac02c5ab69834d355a5b2bb198f8de74dde31da251bc110ee116294ddf); /* statement */ 
coefficients >>= BYTE;
        }

        // normalize the result
        // no safeMul since result fits within 72 bits and maxAPR fits within 128 bits
        // no safeDiv since the divisor is a non-zero constant
coverage_0xb638064a(0x08991ac9943f833724e92fc48721b84d0c1e8932d8676c14fa0d17fb1e9328fd); /* line */ 
        coverage_0xb638064a(0xbd702f763a43ede99e6b301cac0d415863ffedebf6f6bc618ec4455a4779d1c1); /* statement */ 
return Interest.Rate({
            value: result * maxAPR / (SECONDS_IN_A_YEAR * BASE * PERCENT)
        });
    }

    /**
     * Get the maximum APR that this interestSetter will return. The actual APY may be higher
     * depending on how often the interest is compounded.
     *
     * @return The maximum APR
     */
    function getMaxAPR()
        external
        view
        returns (uint256)
    {coverage_0xb638064a(0x46ddbe9cfb31024b72afbf19738311b3e29c34f030c31b745e7f49abe87ffa3d); /* function */ 

coverage_0xb638064a(0xb52d4929ed1bbf302f4405b42d9e5c504bacba4ee413b9fb332c961f271233a7); /* line */ 
        coverage_0xb638064a(0x5c648798953f6fad5cf3eff8d04a27543e6101d602da3dec2ed7435059754bb3); /* statement */ 
return g_storage.maxAPR;
    }

    /**
     * Get all of the coefficients of the interest calculation, starting from the coefficient for
     * the first-order utilization variable.
     *
     * @return The coefficients
     */
    function getCoefficients()
        external
        view
        returns (uint256[] memory)
    {coverage_0xb638064a(0x17f7dbc4fc6f750fa140cdce0a7e6e881c372bc825cfa933bc2bcc7d1abd44e4); /* function */ 

        // allocate new array with maximum of 16 coefficients
coverage_0xb638064a(0x1589719cece9230aa8c8ab4c676b238829fcb1f1c6348ec06115073856e3023e); /* line */ 
        coverage_0xb638064a(0x077aaddd095f0812185d8525b52a673d11efc4ed9ff847c716bfeca00f41a310); /* statement */ 
uint256[] memory result = new uint256[](16);

        // add the coefficients to the array
coverage_0xb638064a(0x3e3c54dc5fa592fa14168a41efbe30d4944f3e4a449171fd3406bdb0fc63fe15); /* line */ 
        coverage_0xb638064a(0x783db5a776c8645973e85cfbaaf84c85943f4712b0be955b70fdd8a9bad780c6); /* statement */ 
uint256 numCoefficients = 0;
coverage_0xb638064a(0x7b84667c65b640d4b842148d2c2d417464dea2f096a7fc8943866c790de054a8); /* line */ 
        coverage_0xb638064a(0x5bf034ea909c9aad2ecc257609e30483e7ae753a2b4d3299ad156300f96edd97); /* statement */ 
for (
            uint256 coefficients = g_storage.coefficients;
            coefficients != 0;
            coefficients >>= BYTE
        ) {
coverage_0xb638064a(0xafdf74dd8c200f96270e7fdd02d5ca5130e9fe679b7b23c65447ff5f78ace771); /* line */ 
            coverage_0xb638064a(0xe0cfccd85c9087d83acfc0bd7d6119b815b923ef4bbc9967847e97996448daa2); /* statement */ 
result[numCoefficients] = coefficients % 256;
coverage_0xb638064a(0xd8fa81aed6241fd8434b2c3dbd542443f204bbc836eb16e04b56945f644e7232); /* line */ 
            numCoefficients++;
        }

        // modify result.length to match numCoefficients
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0xb638064a(0x703fcdad1eb9b90ed96aec8c07509e06ec7855a15160559eb3fa1a6bb42036b5); /* line */ 
        assembly {
            mstore(result, numCoefficients)
        }

coverage_0xb638064a(0xb6108531ea9defddf093ba62ebb5b05ea96330f9936b6d3a234129224bee3c5d); /* line */ 
        coverage_0xb638064a(0x5e928f53c42a8cf7d15f91fde4f3e2ce5d80a2b315d79c062390ffc7fa2e7204); /* statement */ 
return result;
    }
}
