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

import { Require } from "../../protocol/lib/Require.sol";


/**
 * @title TypedSignature
 * @author dYdX
 *
 * Library to unparse typed signatures
 */
library TypedSignature {
function coverage_0x5a05149d(bytes32 c__0x5a05149d) public pure {}


    // ============ Constants ============

    bytes32 constant private FILE = "TypedSignature";

    // prepended message with the length of the signed hash in decimal
    bytes constant private PREPEND_DEC = "\x19Ethereum Signed Message:\n32";

    // prepended message with the length of the signed hash in hexadecimal
    bytes constant private PREPEND_HEX = "\x19Ethereum Signed Message:\n\x20";

    // Number of bytes in a typed signature
    uint256 constant private NUM_SIGNATURE_BYTES = 66;

    // ============ Enums ============

    // Different RPC providers may implement signing methods differently, so we allow different
    // signature types depending on the string prepended to a hash before it was signed.
    enum SignatureType {
        NoPrepend,   // No string was prepended.
        Decimal,     // PREPEND_DEC was prepended.
        Hexadecimal, // PREPEND_HEX was prepended.
        Invalid      // Not a valid type. Used for bound-checking.
    }

    // ============ Functions ============

    /**
     * Gives the address of the signer of a hash. Also allows for the commonly prepended string of
     * '\x19Ethereum Signed Message:\n' + message.length
     *
     * @param  hash               Hash that was signed (does not include prepended message)
     * @param  signatureWithType  Type and ECDSA signature with structure: {32:r}{32:s}{1:v}{1:type}
     * @return                    address of the signer of the hash
     */
    function recover(
        bytes32 hash,
        bytes memory signatureWithType
    )
        internal
        pure
        returns (address)
    {coverage_0x5a05149d(0x9c9c28daf441cca21619fa74a8cf9f881ab632530c98596b48276847a0e1c005); /* function */ 

coverage_0x5a05149d(0x88961a9adbd9a12fc8695f766d802a9d52959120074a8ff3dcd84c3ecb554f12); /* line */ 
        coverage_0x5a05149d(0x905579d8a483b360e0ad20c1dc18efbf126f4ce835f390c4576e92ccb9541231); /* statement */ 
Require.that(
            signatureWithType.length == NUM_SIGNATURE_BYTES,
            FILE,
            "Invalid signature length"
        );

coverage_0x5a05149d(0x6f3a5006e13f03939b610854af5e68d46490c9757a9641dcd3ccb5bf0d96f7bc); /* line */ 
        coverage_0x5a05149d(0x56070f00a93ab839d163ec16449fe15bcf78582e114b2830e3a64838e7cccbe9); /* statement */ 
bytes32 r;
coverage_0x5a05149d(0x67280d936c8a0c9f5816b3931ad206711c01705d5879e5124cb5dd72ae81a229); /* line */ 
        coverage_0x5a05149d(0x834de26f87f50d1d7a083b12493841b73934f23b003046ff5f0ad3fece0904e2); /* statement */ 
bytes32 s;
coverage_0x5a05149d(0x605113131189df7b0a63dab4729de6330b9755858eb041bc42493a1a22590ca0); /* line */ 
        coverage_0x5a05149d(0x505f794553007c591c3842ff6e468ef65003131f1f7e7429bf15419337fd446f); /* statement */ 
uint8 v;
coverage_0x5a05149d(0x6a6aeb60bb818a73af46717671157b2a6457ed62015ba853f6627f2b6c0e0c35); /* line */ 
        coverage_0x5a05149d(0xf254a3a19800e64ef45749521c70edcd54ac0e39f3e2949bbbaacf85862c55eb); /* statement */ 
uint8 rawSigType;

        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x5a05149d(0x9c21b16bc48e1608122390b511a62f79740f4d7c18bd95e8129eadec6681c785); /* line */ 
        assembly {
            r := mload(add(signatureWithType, 0x20))
            s := mload(add(signatureWithType, 0x40))
            let lastSlot := mload(add(signatureWithType, 0x60))
            v := byte(0, lastSlot)
            rawSigType := byte(1, lastSlot)
        }

coverage_0x5a05149d(0x0741cead4759111bf4754c8342536d31a99c0df8e0151c559ee7cdf890316c4b); /* line */ 
        coverage_0x5a05149d(0xfc21127c97f3082f84c1b2d68be946eaf415f2a77a7762ff7df897bdbd204649); /* statement */ 
Require.that(
            rawSigType < uint8(SignatureType.Invalid),
            FILE,
            "Invalid signature type"
        );

coverage_0x5a05149d(0xbfc19dfc88d41f1110b7158fe1a3b63b17487ba62a7d148ca8f031d6020331f8); /* line */ 
        coverage_0x5a05149d(0x8a274e8b7763d8a8b188561921a796fc6956d298f47f50583ca001d638c002a5); /* statement */ 
SignatureType sigType = SignatureType(rawSigType);

coverage_0x5a05149d(0x1fc01517fba2ed0ec4e324629d6e22eaa2b57179740a4713e1dbcce9e19ca792); /* line */ 
        coverage_0x5a05149d(0x670fd38fec0442ff4ca0afdab98ef87039645cd1d2af20f48c9b93d1ba17fb6e); /* statement */ 
bytes32 signedHash;
coverage_0x5a05149d(0x1cfac71b304a2a8223213983dadc87404459a638ed327547747d6a9584bf834a); /* line */ 
        coverage_0x5a05149d(0x9bdc14c5143363a4e024cdac50a112e3da92257dc56f30faa6c1b8886519bd93); /* statement */ 
if (sigType == SignatureType.NoPrepend) {coverage_0x5a05149d(0x9e72a167ff24da997a68dd5e40301ee4950c0fb05a683c4f0d210a2fc64f875d); /* branch */ 

coverage_0x5a05149d(0x1102f5f71bb6c252f61f1da453ad43487c48d03073257821b8a9f838cd347161); /* line */ 
            coverage_0x5a05149d(0xf19f4338dd7d978b9a1df717301e4a2f210cf28e7bebf66553aa7b899783cd88); /* statement */ 
signedHash = hash;
        } else {coverage_0x5a05149d(0xdc4e7bc0369f039fcd6792e15e4c28db7c843199633495f5ac9664023c1f539c); /* statement */ 
coverage_0x5a05149d(0xfbc1b2239be208393d0ad26aa344a66e64eac8bdbc8518b382961ae80c57e079); /* branch */ 
if (sigType == SignatureType.Decimal) {coverage_0x5a05149d(0x03ecc8e996ae25f3ca14143ee554499b6a78c1467111d3d54e1bd67772f36fa9); /* branch */ 

coverage_0x5a05149d(0x46d02426374f0e6ce0db0b9280ef032eed253efa1a54aa8113b985029c37402f); /* line */ 
            coverage_0x5a05149d(0xd576ee62c442271e54e3ecbbcbedad538993ee88200f3e2e6ef235e5e3826a57); /* statement */ 
signedHash = keccak256(abi.encodePacked(PREPEND_DEC, hash));
        } else {coverage_0x5a05149d(0x104477c13fa8e8eef8fa04b03540e3c45cdc7dd7c68d8fe96c8f6324dc70d520); /* branch */ 

coverage_0x5a05149d(0xd313658c3775bce6d1ec933b3d8082c29c16acc84a716afe6635a5afd663a3e0); /* line */ 
            coverage_0x5a05149d(0x7db3aa78cf759796efe9f91ba203a7e8701d37924cf0db0293111be2db999275); /* assertPre */ 
coverage_0x5a05149d(0x6fe46b6b583286ad76ec5dfd33d9383b2704bce3a7d0fef5a3a74e33d562bdbe); /* statement */ 
assert(sigType == SignatureType.Hexadecimal);coverage_0x5a05149d(0xd845cdb6f3c464779f3c764bdeb0cf87cddca9fc4172224be58df2252490b383); /* assertPost */ 

coverage_0x5a05149d(0x48446f357c106dab3d8f17bb8cfe45c33061851842615d4c2d38948f1590e331); /* line */ 
            coverage_0x5a05149d(0x0b77e130913c7b18a350b4b7a9f0a02d4fb0b75e2d597ab7317ab904f07876f1); /* statement */ 
signedHash = keccak256(abi.encodePacked(PREPEND_HEX, hash));
        }}

coverage_0x5a05149d(0x86a6f1c455456cb189724b4d9a23a6f73447ca9f1608a797bacbdd636cfd78d0); /* line */ 
        coverage_0x5a05149d(0x5fba51b1314a600e31adf113f43f8b1537c3032089001c8990805578566a7ee1); /* statement */ 
return ecrecover(
            signedHash,
            v,
            r,
            s
        );
    }
}
