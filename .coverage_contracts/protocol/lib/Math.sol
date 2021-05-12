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
import { Require } from "./Require.sol";


/**
 * @title Math
 * @author dYdX
 *
 * Library for non-standard Math functions
 */
library Math {
function coverage_0x06326363(bytes32 c__0x06326363) public pure {}

    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "Math";

    // ============ Library Functions ============

    /*
     * Return target * (numerator / denominator).
     */
    function getPartial(
        uint256 target,
        uint256 numerator,
        uint256 denominator
    )
        internal
        pure
        returns (uint256)
    {coverage_0x06326363(0x1c604dc901b2a33a3f720213a9dc5bedbe4fc5f56c5f7c89a0b6f9660d8bc155); /* function */ 

coverage_0x06326363(0x1ab580a31b6c1043058cbde1b06834a083a471558757f04c2a3175bfcfcbc4de); /* line */ 
        coverage_0x06326363(0x5c34916550924551677db7844015ae13d70c0bb069dacc57b3aca2becbc52b6a); /* statement */ 
return target.mul(numerator).div(denominator);
    }

    /*
     * Return target * (numerator / denominator), but rounded up.
     */
    function getPartialRoundUp(
        uint256 target,
        uint256 numerator,
        uint256 denominator
    )
        internal
        pure
        returns (uint256)
    {coverage_0x06326363(0x36b503b9b8870c9003a573d73d5f4e177d50072758edbc38ac8758e2e2477e21); /* function */ 

coverage_0x06326363(0x899519bb0a5575310fc9448d087cb3f1d2bbe0749346fbcab7b3abba8b1ec8a9); /* line */ 
        coverage_0x06326363(0x8ba53c390841a41c27e54a2fb8bc53edc9d4799b229c18ccedfe86dec42a71bc); /* statement */ 
if (target == 0 || numerator == 0) {coverage_0x06326363(0x1926fa3d49b610a75cc8dd81d49733f4e7db5d899634c8c9c6aa14fa9d1a753d); /* branch */ 

            // SafeMath will check for zero denominator
coverage_0x06326363(0xf4ad6ed398d16467b44437681108c56fb13cd89e71fb1e7c8d0fbea806daed3a); /* line */ 
            coverage_0x06326363(0x423422222c93ebfd761300763244cdaecf8575c4a649211ad891f964c94c2581); /* statement */ 
return SafeMath.div(0, denominator);
        }else { coverage_0x06326363(0xd0db127cb4ae6ec021de5a78b795d1148ad1dca2815742c129768e0bbe7a178c); /* branch */ 
}
coverage_0x06326363(0x35bd24ba7eeed30266c7890505191aaa7e72705ae5e6bf2390b30afb861fe951); /* line */ 
        coverage_0x06326363(0xd4e4111a2574ecc3813a15c1f1795d18e786d056dcbbc95d6b6201d7e272e522); /* statement */ 
return target.mul(numerator).sub(1).div(denominator).add(1);
    }

    function to128(
        uint256 number
    )
        internal
        pure
        returns (uint128)
    {coverage_0x06326363(0xc095ad8a14e5b03b58fb18c773ff80852bd0781fb68d21c37354335da65faa14); /* function */ 

coverage_0x06326363(0x87fdeebb0e157d2b73845447a55b03134cdc8c162f41b9a99e1d71d702c389af); /* line */ 
        coverage_0x06326363(0x82f22b26d344e5fffea9d7076a82fae6e6ca9634fbf7f2d968190b6023b30f5b); /* statement */ 
uint128 result = uint128(number);
coverage_0x06326363(0xb6ecfbb9e36ff3c051c30d3f9aee3f5d97c8b391d0a0e529d1e68d17acb81b0f); /* line */ 
        coverage_0x06326363(0x9dbd0281f7d21faf7bd963dd9c12d13ecb3ae6820d20e27db683021d9a09badd); /* statement */ 
Require.that(
            result == number,
            FILE,
            "Unsafe cast to uint128"
        );
coverage_0x06326363(0xa94658d729c92dc9495c1b36f29927bd7a0df52bfad7ad8e5df00b15340de788); /* line */ 
        coverage_0x06326363(0x6e54f5dae22d1f9179f97125ff52492d50d7ed9e2d6146b96a516fece47010a0); /* statement */ 
return result;
    }

    function to96(
        uint256 number
    )
        internal
        pure
        returns (uint96)
    {coverage_0x06326363(0xf8366b70e6b225e9967b3daaef99108bd2e6e1c8a3c0ac41a07a1945b88a3b51); /* function */ 

coverage_0x06326363(0xda83b0d1d8693977fd6a20953db989e5c659ea77dc393c936b991d691bb18eeb); /* line */ 
        coverage_0x06326363(0xd44d012fa0893e9300308138fb55409e69fefa99b25b0e2d64a21169e03a1b43); /* statement */ 
uint96 result = uint96(number);
coverage_0x06326363(0x7b4e6321f196152256e12646f902b8561804fad79d8c73c86f44ad152270c447); /* line */ 
        coverage_0x06326363(0xfe326c6994fdab6b1cdbf70151d43199c1d7e56f1d712863588424f400c1b651); /* statement */ 
Require.that(
            result == number,
            FILE,
            "Unsafe cast to uint96"
        );
coverage_0x06326363(0x0996829099a257648c66dbb742e3b91a9dcbfcacf237f09e891e06736f8326d2); /* line */ 
        coverage_0x06326363(0x12a7b7ed2f2ff066418256331971cbe334cf09bdd2d30efae85a6b834f12c9a5); /* statement */ 
return result;
    }

    function to32(
        uint256 number
    )
        internal
        pure
        returns (uint32)
    {coverage_0x06326363(0xb774708bf10360a6d93d62c734c5001200f2e049851f3fc00290b6e04e769b9b); /* function */ 

coverage_0x06326363(0x00f23a0821868b18450ab32885c120faf51830e1e79d4c693588714dd63087f0); /* line */ 
        coverage_0x06326363(0x4a837292572e6d43e41cb576809d79f4aab8dfb517bc8d792795b9041b44f6f5); /* statement */ 
uint32 result = uint32(number);
coverage_0x06326363(0x9bd6d4c5905f77719020a55304be961320ee1a01ea101fae3bad46126157837a); /* line */ 
        coverage_0x06326363(0x09335bdfda88e6ea0d79ee9eb3921a0b3418d6bdd0143a16c5cdff0833b4ea6b); /* statement */ 
Require.that(
            result == number,
            FILE,
            "Unsafe cast to uint32"
        );
coverage_0x06326363(0xfbb907764d38b4b106a71865864a1ce0db2d4d0e68fd67c56b3256abd8b839f9); /* line */ 
        coverage_0x06326363(0x6cf41ab1cd95682460159a648a00b1c5506c12967392febc050b487032764c48); /* statement */ 
return result;
    }

    function min(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {coverage_0x06326363(0x277252e372414ab214fc3c44943927845488e104af6f63f2e654749aa7200d27); /* function */ 

coverage_0x06326363(0xe4c04617466c33eb16580c56465a8b340a6bb0b984c33d0f18aa196864b64d4d); /* line */ 
        coverage_0x06326363(0x1020bb9fa8e00ea5fed78b0539bb29d6940531d2f4d467a35cb878b029928a46); /* statement */ 
return a < b ? a : b;
    }

    function max(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {coverage_0x06326363(0xc74fd858ae3d40ec10e7d77738325251f51e3340d09c7b91f678ab787bb5374b); /* function */ 

coverage_0x06326363(0x1a9b5bc7f6ef9dac84aef9478a741c91104db68c967cf38f07ff253c3527eb28); /* line */ 
        coverage_0x06326363(0x859254ea5d016c990118e9069ade3965888eb4ce49b34b84d7bc320a430fa59d); /* statement */ 
return a > b ? a : b;
    }
}
