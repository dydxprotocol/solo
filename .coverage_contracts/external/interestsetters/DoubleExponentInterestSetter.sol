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
 * @title DoubleExponentInterestSetter
 * @author dYdX
 *
 * Interest setter that sets interest based on a polynomial of the usage percentage of the market.
 * Interest = C_0 + C_1 * U^(2^0) + C_2 * U^(2^1) + C_3 * U^(2^2) ...
 */
contract DoubleExponentInterestSetter is
    IInterestSetter
{
function coverage_0x498a10dc(bytes32 c__0x498a10dc) public pure {}

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
    {coverage_0x498a10dc(0xbea6629e9ae3ca5d499d750ebaddaeb58d06d23a958be2dd73a458bd6e2e80e9); /* function */ 

        // verify that all coefficients add up to 100%
coverage_0x498a10dc(0xc0000f29d21c86223a65ab566ab2deeb4491d766cece6c820c26fb6d3034b21e); /* line */ 
        coverage_0x498a10dc(0x5ffd18c130f16b9eadb2d2b5d68648b3db67607e21ede72fb02c71457d65db05); /* statement */ 
uint256 sumOfCoefficients = 0;
coverage_0x498a10dc(0xb07809f21983da7146f59c967c4116e2ca5a50ce291dffd574328b10275d11d1); /* line */ 
        coverage_0x498a10dc(0x868a9d16ffac777711753afbfa516fbfa7b09e0c57a404b1377439cca32895e3); /* statement */ 
for (
            uint256 coefficients = params.coefficients;
            coefficients != 0;
            coefficients >>= BYTE
        ) {
coverage_0x498a10dc(0x716ee154e0dd772d3c5bcd176f8e3d979dedcb6667397d3ead26a6357450a0f7); /* line */ 
            coverage_0x498a10dc(0xcf0e0664fd8f55e1b22337c3c374c04b4c69dca258527dcd7917a3320ffe48cb); /* statement */ 
sumOfCoefficients += coefficients % 256;
        }
coverage_0x498a10dc(0x3ce78dcb837ec7b40a3d18a6b7489d5f240b177f95cc1f82920c53daf15a97d3); /* line */ 
        coverage_0x498a10dc(0xbe2ee9877599bd1c6e57d9adb8e6b8048b3516b6d0c685c2d4fd86d5617f235a); /* assertPre */ 
coverage_0x498a10dc(0x0ff8b39061dfe42303cf80cd809235d24a0e1bbdda68befbebad24f9727799d3); /* statement */ 
require(
            sumOfCoefficients == PERCENT,
            "Coefficients must sum to 100"
        );coverage_0x498a10dc(0x2a352a38ddb26d4e7bbfaa5fc0501f36a856f868ae21fe42033c347d21c19c27); /* assertPost */ 


        // store the params
coverage_0x498a10dc(0x4232e7a1e85d23afeef60840107cfbd058746c3dcfe4533e9182a7453de6b661); /* line */ 
        coverage_0x498a10dc(0x6f94e1ac85da341a875932cff9bbe271038521272880baea4020cf33c0abfcc1); /* statement */ 
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
    {coverage_0x498a10dc(0x672addafa4535aa8431da994b62dd939404c1cdeb48d3be5cead7008f6940aa8); /* function */ 

coverage_0x498a10dc(0xf83091a562cd35d300e0a4f07d6a1755edf1f0098a8e96e38d3aed984f823d41); /* line */ 
        coverage_0x498a10dc(0xd1052256de3da5f09f4896aec9d23a778a0da367c60b28bbcf17ca31733bf1f5); /* statement */ 
if (borrowWei == 0) {coverage_0x498a10dc(0x57faa9a49e22667eb50b0e1b94d56866a3ae9b9810e3c9e16536114b013a09e2); /* branch */ 

coverage_0x498a10dc(0x084de47093e545ac1704580e700439c3e7a976c7811009e8b38f5ca2209996e4); /* line */ 
            coverage_0x498a10dc(0x66a089ef03011da976fdbfbcc50eea47da8e6c1c0ccaa9ef03c9170359035ddb); /* statement */ 
return Interest.Rate({
                value: 0
            });
        }else { coverage_0x498a10dc(0xa599c62ab595d926cb0fdb78712d23336f67c601a0e53db06f0bf38edea8bcb6); /* branch */ 
}

coverage_0x498a10dc(0x9aa4c0a461810af7359704022f2a29834aec1563b9125c4f179a6d89033bb419); /* line */ 
        coverage_0x498a10dc(0x149ba667e2dde59ad3eeefc1d7276f2927d9b66cd7fa335cb62dc74a4827f78d); /* statement */ 
PolyStorage memory s = g_storage;
coverage_0x498a10dc(0xc1621a77e21f7b94e0a0e3fc6c02fd8fcba862032c6029175068896ec790462d); /* line */ 
        coverage_0x498a10dc(0x78b2bef3905c583e91716bc462558ffe179f5a1a670b95d5baa62707aa55dc95); /* statement */ 
uint256 maxAPR = s.maxAPR;

coverage_0x498a10dc(0xb2ce125c6f0395e08580750f98221bbf03c6330fed1086e5b48e05f554e459cb); /* line */ 
        coverage_0x498a10dc(0x0a3477894bd69dd50ad211fdc1f780a8ffeb99d6b39134e5e8d1361e11693c9e); /* statement */ 
if (borrowWei >= supplyWei) {coverage_0x498a10dc(0x344ed45ba91245521bcd4dad30ed4a0f276b4b0a9f5091e977c161decec313e5); /* branch */ 

coverage_0x498a10dc(0x4993281b797c777d0e70e1d8f1b37473a4baedeef592cb15f8e6658ce6b1345a); /* line */ 
            coverage_0x498a10dc(0x65d3c558da0ef8a515668945737419a47a24b4458847252ac8f4086d04d7a404); /* statement */ 
return Interest.Rate({
                value: maxAPR / SECONDS_IN_A_YEAR
            });
        }else { coverage_0x498a10dc(0xc42dd17fdbfcacd606b857692077e5075e80858ceb33e78f697ad58061c17583); /* branch */ 
}

        // process the first coefficient
coverage_0x498a10dc(0x4f2837b28d16f76d4db2e805232d777604f96712a50bf7c682a8f174afda4f87); /* line */ 
        coverage_0x498a10dc(0xf10027a2fcf9186fdea421d35c1a01fd0b893c54570a9567ea1792bea9116017); /* statement */ 
uint256 coefficients = s.coefficients;
coverage_0x498a10dc(0xdc70118555163cb3e9f0077972d07510971cf0646319bf522a7cff128919c72a); /* line */ 
        coverage_0x498a10dc(0xaedcf37c4c65af93ad1c0413d20786ac230f87ed6eef85fec143e2a7dfbadbdc); /* statement */ 
uint256 result = uint8(coefficients) * BASE;
coverage_0x498a10dc(0x756fba9b97f363f3df06bffffb5b9241b9f4fbc05aa81b37fe0de4a5f549cb40); /* line */ 
        coverage_0x498a10dc(0xf8610dd563f3f765503b764b363160a0f26e5e071ca6d999953698e102b2de80); /* statement */ 
coefficients >>= BYTE;

        // initialize polynomial as the utilization
        // no safeDiv since supplyWei must be non-zero at this point
coverage_0x498a10dc(0x98291e65079d0572054338da705cf82d9c94b8ef67a8b65ffd32208758e48958); /* line */ 
        coverage_0x498a10dc(0xd7e0832a7e68b11d38db931f8b8857c3a905b2dc9f75fbd6c30d56541ef6c38f); /* statement */ 
uint256 polynomial = BASE.mul(borrowWei) / supplyWei;

        // for each non-zero coefficient...
coverage_0x498a10dc(0x4fc1bd274f7f9af91ff87e98d553d75c27382ed0379faf065f84b98eab662e66); /* line */ 
        coverage_0x498a10dc(0x759b77a3318495500e86b9857974e69546631c734c6548854c166d22ff091816); /* statement */ 
while (true) {
            // gets the lowest-order byte
coverage_0x498a10dc(0xc2fa50e9e3e614bb4d4af5322f1d2d2b41c864d55aaf7e9d2490c45c28188577); /* line */ 
            coverage_0x498a10dc(0x6a1944c0473a8fe2b8e67506d3e375d0adb27fe8b88c0172a6549108ca3b9937); /* statement */ 
uint256 coefficient = uint256(uint8(coefficients));

            // if non-zero, add to result
coverage_0x498a10dc(0x8a563c65a88f8d069848a9e5519879eea988fd6d95a4d926a6e764525a439ff5); /* line */ 
            coverage_0x498a10dc(0x6623309197834d9fe37a25da14cb0154f8d0e57f0c3dc1960f1ca265cf6946a4); /* statement */ 
if (coefficient != 0) {coverage_0x498a10dc(0x804b6ed45ba76d2cfe197a6d6b854bbbae6039c8388e30d8466aa82a4e912778); /* branch */ 

                // no safeAdd since there are at most 16 coefficients
                // no safeMul since (coefficient < 256 && polynomial <= 10**18)
coverage_0x498a10dc(0xb78096244088b7d1a146c1a0143160b78089aa0a01a974c377573ee8a942f6b1); /* line */ 
                coverage_0x498a10dc(0xdcd8eb0a8d8134335e79b1162c3a570d9e7b4f9d5c71a24b1dda316d218d6fe2); /* statement */ 
result += coefficient * polynomial;

                // break if this is the last non-zero coefficient
coverage_0x498a10dc(0xefe902cccf2fafa4e7e38c150706e9b73c6afed4256e8be88af6807be790e8b9); /* line */ 
                coverage_0x498a10dc(0x27a2f2d44139a0edb0bf1109d5010f09796388bc21633e668a0c4692f8a08eda); /* statement */ 
if (coefficient == coefficients) {coverage_0x498a10dc(0x48ac68f81ebd98b1a8857130c2b2a27006c4ed277b07f0ae5162e03697b01666); /* branch */ 

coverage_0x498a10dc(0x2b27813fcb8a0b687ad19a69f1e10c3be0761add3b5a28b070f3de4aa19cc1c6); /* line */ 
                    break;
                }else { coverage_0x498a10dc(0xb6dd398c184c9d86ae94e2b3dd0693da2777fd81fe05203ae15b1dc76332b729); /* branch */ 
}
            }else { coverage_0x498a10dc(0xc45b91ae7f51e7b20a476fcf4ac3841a50240dabd2b0d6b746bbe1172ac23c01); /* branch */ 
}

            // double the order of the polynomial term
            // no safeMul since polynomial <= 10^18
            // no safeDiv since the divisor is a non-zero constant
coverage_0x498a10dc(0xfb37b23920f2edd628008816c63a9a9f6fb5f1ac914eef135d361bd4b5c3d62d); /* line */ 
            coverage_0x498a10dc(0x61f519f687a17bdb2b8e49609013bc5795cb82ce940e05188496c6782085ef5b); /* statement */ 
polynomial = polynomial * polynomial / BASE;

            // move to next coefficient
coverage_0x498a10dc(0xbacd9949e3e1d65d5ba870815f240d9c4bad6831bc16e4e910a34e54ad9a30d4); /* line */ 
            coverage_0x498a10dc(0x701679a572e1c0bec58ac98a41ba7c8a8d4912da20cf026b2cedc081004719e5); /* statement */ 
coefficients >>= BYTE;
        }

        // normalize the result
        // no safeMul since result fits within 72 bits and maxAPR fits within 128 bits
        // no safeDiv since the divisor is a non-zero constant
coverage_0x498a10dc(0x99e3c642c521ba40973385158b30c92bbe6365f6dd5b3121ddedb93b935b8e03); /* line */ 
        coverage_0x498a10dc(0x586eaae87a19b4dd9eea5212bda446e76711d80183cc1db51d11ce3718114146); /* statement */ 
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
    {coverage_0x498a10dc(0x45af25ae462be62e7195d3003f82037025d1d6a7a9831e5903d728fb6e916a07); /* function */ 

coverage_0x498a10dc(0x5c1eab51662920d268ed8d51a33d8b7cb8d4cc4e307f582abef63f26be631329); /* line */ 
        coverage_0x498a10dc(0xe6c5af632ef74eedd81761751b419824153ffc992b0dffe1921029988116849c); /* statement */ 
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
    {coverage_0x498a10dc(0x98721e2df0e3b2516f96c57434d4f36d4e266f2977615ff5f451297a37fbc49f); /* function */ 

        // allocate new array with maximum of 16 coefficients
coverage_0x498a10dc(0xad309d7fea70acd1e51f01bc4113e5447f084d81b06a017f18e0f2b725831d05); /* line */ 
        coverage_0x498a10dc(0x7d9e438339e7195e955e88125b60990ae9d924d3a11ac996dfc95c828d8003da); /* statement */ 
uint256[] memory result = new uint256[](16);

        // add the coefficients to the array
coverage_0x498a10dc(0x53dbacef307d720e52ac71af9a27b512c87575c4eac38bf86d4d383bc3d8e91c); /* line */ 
        coverage_0x498a10dc(0xae601442b9e91243140fc7dfbc4599c0c02688d5fe15e5522c1672f05da07c85); /* statement */ 
uint256 numCoefficients = 0;
coverage_0x498a10dc(0x0dc547d9e80d646f338d36a786ba1b8c1f9d4ac32033a664ada87af892db3d33); /* line */ 
        coverage_0x498a10dc(0x341615806fac5b0aa279e1545bb57a9c046a44402e075f0def1654d4803d16e7); /* statement */ 
for (
            uint256 coefficients = g_storage.coefficients;
            coefficients != 0;
            coefficients >>= BYTE
        ) {
coverage_0x498a10dc(0x688ec1d283ae07a62a6ede91f917653c33d47723137b474b29ca5e8c2d98c9d7); /* line */ 
            coverage_0x498a10dc(0x10d0be719423b8f52a8159fdf4b97fc4dc23e905110f2b080de2d965f04fcb98); /* statement */ 
result[numCoefficients] = coefficients % 256;
coverage_0x498a10dc(0x9e210631f9e507d9fe46a6653ca7a706070eef72817e7efaf0d0d5c4a1f19116); /* line */ 
            numCoefficients++;
        }

        // modify result.length to match numCoefficients
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x498a10dc(0x41f3935bc91796dece2cc43981887822edc74803a041fb9084a055bd6e0a4819); /* line */ 
        assembly {
            mstore(result, numCoefficients)
        }

coverage_0x498a10dc(0xd449f473979c841c7455a7d61d72a5398e19dc883a303deedc457790f00c6997); /* line */ 
        coverage_0x498a10dc(0xe1b5ad072d3c6d953132b460fd20a692e81ef4b57070ddc8a135a1e88b08a0b3); /* statement */ 
return result;
    }
}
