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
import { Decimal } from "./Decimal.sol";
import { Math } from "./Math.sol";
import { Time } from "./Time.sol";
import { Types } from "./Types.sol";


/**
 * @title Interest
 * @author dYdX
 *
 * Library for managing the interest rate and interest indexes of Solo
 */
library Interest {
function coverage_0xf99aeba9(bytes32 c__0xf99aeba9) public pure {}

    using Math for uint256;
    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "Interest";
    uint64 constant BASE = 10**18;

    // ============ Structs ============

    struct Rate {
        uint256 value;
    }

    struct Index {
        uint96 borrow;
        uint96 supply;
        uint32 lastUpdate;
    }

    // ============ Library Functions ============

    /**
     * Get a new market Index based on the old index and market interest rate.
     * Calculate interest for borrowers by using the formula rate * time. Approximates
     * continuously-compounded interest when called frequently, but is much more
     * gas-efficient to calculate. For suppliers, the interest rate is adjusted by the earningsRate,
     * then prorated the across all suppliers.
     *
     * @param  index         The old index for a market
     * @param  rate          The current interest rate of the market
     * @param  totalPar      The total supply and borrow par values of the market
     * @param  earningsRate  The portion of the interest that is forwarded to the suppliers
     * @return               The updated index for a market
     */
    function calculateNewIndex(
        Index memory index,
        Rate memory rate,
        Types.TotalPar memory totalPar,
        Decimal.D256 memory earningsRate
    )
        internal
        view
        returns (Index memory)
    {coverage_0xf99aeba9(0xcc102f4cf26b0984b0b4d2ea1a603b1bdf1b26c8dbdc492eb7afe90c0d685046); /* function */ 

coverage_0xf99aeba9(0x3a18826d745e696dd8e4f45369bfa758fc44bbb8dd61fcc4c289c89ec93fe39a); /* line */ 
        coverage_0xf99aeba9(0xe2c29c1da3d309514ea560e19d3ef641452551364825138ce1c6990cd8d471a4); /* statement */ 
(
            Types.Wei memory supplyWei,
            Types.Wei memory borrowWei
        ) = totalParToWei(totalPar, index);

        // get interest increase for borrowers
coverage_0xf99aeba9(0xd1b89445f3ba9c38186069154fc55706c80183ce73428ea4dc1f3f395b5d0c57); /* line */ 
        coverage_0xf99aeba9(0x1cd4d10087fb106d4d4baf23dfd9096633920bcfba48bebd090b23fa91958080); /* statement */ 
uint32 currentTime = Time.currentTime();
coverage_0xf99aeba9(0x26596c0205aca7f33db36047f89a7264f0c4c7be26c209a4e2c8982446f15abb); /* line */ 
        coverage_0xf99aeba9(0x830c8e6ea499452da9384dc6a16f0a363b03daaedb2131a11f0c8f49957f64b1); /* statement */ 
uint256 borrowInterest = rate.value.mul(uint256(currentTime).sub(index.lastUpdate));

        // get interest increase for suppliers
coverage_0xf99aeba9(0x32936ed973c0217ad95a7027ec840d907a92fc2829806a6bef9aac2b89eb8816); /* line */ 
        coverage_0xf99aeba9(0x7430fd979ae2c732bc8b2983631c3634fa5a10adbad7c63f22543511c631a6db); /* statement */ 
uint256 supplyInterest;
coverage_0xf99aeba9(0xa0ef16547b5308b79af3038da76956f715ac35df8c47263ca8b082784b709ccb); /* line */ 
        coverage_0xf99aeba9(0xffaedb2f8fa0ca36a9d35113ff74ea22eb8bf4b31b68490719cfb93955890dc4); /* statement */ 
if (Types.isZero(supplyWei)) {coverage_0xf99aeba9(0x1d759b5bed7e4d2eb9ab55c265c0f46909ccd6a8c1e7fb36ecf0c88715413029); /* branch */ 

coverage_0xf99aeba9(0xfda4f507e9a2943987d612a673ad0a9d75a840b9b80cf106a4adb170c34421fa); /* line */ 
            coverage_0xf99aeba9(0xf182e74b18a675577217601d3244fe3fb3adb906ea08c7122d1403446f1e14e6); /* statement */ 
supplyInterest = 0;
        } else {coverage_0xf99aeba9(0xef333a600019d839b4cc172cb90be629bd5aa29490199da4821fc7cf2562ff78); /* branch */ 

coverage_0xf99aeba9(0x5fb20c0a74aea313ce5d6a15001f9fb16c65eeaaa550a7566f03e5447e58bd0f); /* line */ 
            coverage_0xf99aeba9(0x90bccd62db9e18c0e34c6d604db765e2c29a7279257f19cd6830d15546d92e34); /* statement */ 
supplyInterest = Decimal.mul(borrowInterest, earningsRate);
coverage_0xf99aeba9(0x7be3950ddf6b902d7abdc1b8b77e4834c482834dcf261558dc40a375b7ca212b); /* line */ 
            coverage_0xf99aeba9(0x8d23331860685ebc09b4221ad63bb132978a22324ec2c00de298b02fad51bf3d); /* statement */ 
if (borrowWei.value < supplyWei.value) {coverage_0xf99aeba9(0x5c191e1e5ea7dc21eb7875ad3b2b63b055c7ec8d3e6e8bb6481aeaf8a5678e19); /* branch */ 

coverage_0xf99aeba9(0xb590d9c1a0b6db6de8202eb54c019f37f29955a8aa8f8de868595b3415903c78); /* line */ 
                coverage_0xf99aeba9(0x6c517d16ef86d253ae280c07012884bb9ecffda1be8501d70075e50d52aa623b); /* statement */ 
supplyInterest = Math.getPartial(supplyInterest, borrowWei.value, supplyWei.value);
            }else { coverage_0xf99aeba9(0x8aabb4cdbf15df93e96d3069d4861f9799dc0fd0e83814fbd35dec8c74145fec); /* branch */ 
}
        }
coverage_0xf99aeba9(0xaee834c66eb7aadbcd6d7c2d91e2546795b4840543a32043c51d2fa18c767a0d); /* line */ 
        coverage_0xf99aeba9(0x270c860848f5dd0f882e24765baa0f69ee1e686483606f392866eb93a4579881); /* assertPre */ 
coverage_0xf99aeba9(0x8860344bb9086f99ff2b9ba41f008e4f27a3d8645b00bc2588a4ac6ffaed7e5b); /* statement */ 
assert(supplyInterest <= borrowInterest);coverage_0xf99aeba9(0x4a95b82d12f0b1d71943032caff562b1a06c6137e0eea95f58e96235607b5751); /* assertPost */ 


coverage_0xf99aeba9(0x080f025a49b71e1fbf172fd62130b193a0891d3e5bdeda339bfab9c26f1a8235); /* line */ 
        coverage_0xf99aeba9(0xb0972d17d94dfaa05e265ddfbb912cfcd0cfdecf734341a21fe6ab01a2a50530); /* statement */ 
return Index({
            borrow: Math.getPartial(index.borrow, borrowInterest, BASE).add(index.borrow).to96(),
            supply: Math.getPartial(index.supply, supplyInterest, BASE).add(index.supply).to96(),
            lastUpdate: currentTime
        });
    }

    function newIndex()
        internal
        view
        returns (Index memory)
    {coverage_0xf99aeba9(0x3064bd935a8c6c894a9560b1b2e9d5b80d7b44a70a4bbc37d2616e99d5187e3b); /* function */ 

coverage_0xf99aeba9(0xd478939eaa64a8ca2f8253fcf7b2623faf56bc22880714957fbab542b3c00d60); /* line */ 
        coverage_0xf99aeba9(0x84357524a5fd915df7ffbad4e20f8948406c8fff584c64a0b701aded773bcc51); /* statement */ 
return Index({
            borrow: BASE,
            supply: BASE,
            lastUpdate: Time.currentTime()
        });
    }

    /*
     * Convert a principal amount to a token amount given an index.
     */
    function parToWei(
        Types.Par memory input,
        Index memory index
    )
        internal
        pure
        returns (Types.Wei memory)
    {coverage_0xf99aeba9(0xa196feef5aa877534efc68471cecad0b9421a05a95e812a712c3a24b317ed480); /* function */ 

coverage_0xf99aeba9(0x5f62f4a38e090116c805ee096c56d29e4480cc7333ae2f0647c07e5cd515be87); /* line */ 
        coverage_0xf99aeba9(0x651229a364a8a06c334b0550567d547ff09ccdb2187e8833b7068476d10ec4ad); /* statement */ 
uint256 inputValue = uint256(input.value);
coverage_0xf99aeba9(0xad8d37605c79e1b6fbf61fe6867002e1505fe568c17fde8359d9f36cf0d5b5d3); /* line */ 
        coverage_0xf99aeba9(0xd77a8d6e3092bff3aa627a6110684830495512d76603b5a55b7c33acbb95d730); /* statement */ 
if (input.sign) {coverage_0xf99aeba9(0xe7c9d0eb52192e2de63dac4a21c4adf4c516d91f85ef1f4d87b2063ef19414e2); /* branch */ 

coverage_0xf99aeba9(0xc03649c2220e15880f69f068f6db28c41c275851d5498c64c701de04ffbe3061); /* line */ 
            coverage_0xf99aeba9(0xb23aa045531cc433702b5f85464600a9536bacfa83336a13126ae6acd90fbe51); /* statement */ 
return Types.Wei({
                sign: true,
                value: inputValue.getPartial(index.supply, BASE)
            });
        } else {coverage_0xf99aeba9(0x8f9458340259815f6c8902e85f6e78b067f30a6b0b2393826a73e318a21ec9b5); /* branch */ 

coverage_0xf99aeba9(0x32e934262ded42ef0c8f4f70c48622288f4e1a63d756c5a7ed56558b705c58bf); /* line */ 
            coverage_0xf99aeba9(0x112dae0bb87e2b2a1873bd65b58a34dbf1e620f7df318ccc862005ef46a9c8af); /* statement */ 
return Types.Wei({
                sign: false,
                value: inputValue.getPartialRoundUp(index.borrow, BASE)
            });
        }
    }

    /*
     * Convert a token amount to a principal amount given an index.
     */
    function weiToPar(
        Types.Wei memory input,
        Index memory index
    )
        internal
        pure
        returns (Types.Par memory)
    {coverage_0xf99aeba9(0x4e768a060759041ff194327c89689008082580afb145f5834be334ce9f4a4dc7); /* function */ 

coverage_0xf99aeba9(0x1714046467cf1f21531ebb09aa1ae9e8c1f0b80ca33e59f2d2e546f0f412205b); /* line */ 
        coverage_0xf99aeba9(0x08e0e75b7ea8c1003211eb060491dc84c50bd39cd685913c055d03002f589ceb); /* statement */ 
if (input.sign) {coverage_0xf99aeba9(0x2c784f387b3418e140f873d6f896d54bc081676569138cf5519dbbf06433767d); /* branch */ 

coverage_0xf99aeba9(0x4229131c4a60f64ef78711b5eb029fab52c2cd72519c9b82833ae3f5509581dc); /* line */ 
            coverage_0xf99aeba9(0x90191c0c1bb4cf24e5d9288926e61ce5fae580b31861a7a2d1d9e5935caf557d); /* statement */ 
return Types.Par({
                sign: true,
                value: input.value.getPartial(BASE, index.supply).to128()
            });
        } else {coverage_0xf99aeba9(0x55c58ba9a2575e41101e7098b563d091d248f42defcabc6af5519c0a356c486f); /* branch */ 

coverage_0xf99aeba9(0x9a97d836e41da593965210c9f9b0c22696cb133792ab7f6a207e8b6edf25ea52); /* line */ 
            coverage_0xf99aeba9(0xb97338c411db40ef173506e97b247fd733a8224f86aa9b6e43ee4fe67b0c167d); /* statement */ 
return Types.Par({
                sign: false,
                value: input.value.getPartialRoundUp(BASE, index.borrow).to128()
            });
        }
    }

    /*
     * Convert the total supply and borrow principal amounts of a market to total supply and borrow
     * token amounts.
     */
    function totalParToWei(
        Types.TotalPar memory totalPar,
        Index memory index
    )
        internal
        pure
        returns (Types.Wei memory, Types.Wei memory)
    {coverage_0xf99aeba9(0xd923f7086c7b7594bbebd84bab1245c6f08c82aed787a1ba6286a11ec44351b2); /* function */ 

coverage_0xf99aeba9(0x20c0fcfa98aabc45f6882c24afd3d00410907a2a707fc40e653040b836143650); /* line */ 
        coverage_0xf99aeba9(0x02dc4228d909f0b3d70f2d6a70149b1cf7612ba70df6b2f2747fe770d9a38c02); /* statement */ 
Types.Par memory supplyPar = Types.Par({
            sign: true,
            value: totalPar.supply
        });
coverage_0xf99aeba9(0xcfd1d5c94deb2968c6d6d527cfadc6382a5fb3f6b7b8143229365afd69ae7eff); /* line */ 
        coverage_0xf99aeba9(0xe712ed709000ef69212d65c40d935ec9feb0ad1b0afb743c59921395f6d5b1f4); /* statement */ 
Types.Par memory borrowPar = Types.Par({
            sign: false,
            value: totalPar.borrow
        });
coverage_0xf99aeba9(0xcc3d1d4e31a91e737b4aa2dfac54190ef9a6dd6297382273436e79d8a6a36a70); /* line */ 
        coverage_0xf99aeba9(0x9b5439af340063813b5012d01d9578fee95981b274b847e8f23472e96b80af67); /* statement */ 
Types.Wei memory supplyWei = parToWei(supplyPar, index);
coverage_0xf99aeba9(0xb1e5e74140c6867aff1cc9797a40e3c509127da5bc329fb668fcd9338faf1883); /* line */ 
        coverage_0xf99aeba9(0xf634a106474ed5046e4287e2546039fe9d921590f7c86c17e43ad9a88c259fe4); /* statement */ 
Types.Wei memory borrowWei = parToWei(borrowPar, index);
coverage_0xf99aeba9(0x8de58b3b3299b44256452117fa69e7284215ad4a49f1e0a07828f8fe79263ac8); /* line */ 
        coverage_0xf99aeba9(0x323a409c66519947bdc59c3385558154d81c7dbcb6eb1279b128e809e6f0a88b); /* statement */ 
return (supplyWei, borrowWei);
    }
}
