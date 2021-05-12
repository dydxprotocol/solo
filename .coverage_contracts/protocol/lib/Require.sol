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


/**
 * @title Require
 * @author dYdX
 *
 * Stringifies parameters to pretty-print revert messages. Costs more gas than regular require()
 */
library Require {
function coverage_0x8f7aed20(bytes32 c__0x8f7aed20) public pure {}


    // ============ Constants ============

    uint256 constant ASCII_ZERO = 48; // '0'
    uint256 constant ASCII_RELATIVE_ZERO = 87; // 'a' - 10
    uint256 constant ASCII_LOWER_EX = 120; // 'x'
    bytes2 constant COLON = 0x3a20; // ': '
    bytes2 constant COMMA = 0x2c20; // ', '
    bytes2 constant LPAREN = 0x203c; // ' <'
    byte constant RPAREN = 0x3e; // '>'
    uint256 constant FOUR_BIT_MASK = 0xf;

    // ============ Library Functions ============

    function that(
        bool must,
        bytes32 file,
        bytes32 reason
    )
        internal
        pure
    {coverage_0x8f7aed20(0x3732fce3129f8bc1b4c513bf99f5c9ff37b0fe113152ff4acc8b2becbd994fc6); /* function */ 

coverage_0x8f7aed20(0xefc44d7816a45157cd58d815d2a9cfd8d020c7b08084f5337d5e9448f249fcdb); /* line */ 
        coverage_0x8f7aed20(0xf5755598eabd2f277344a1fa50853e387eff52e37c290e89712aebe40beee59c); /* statement */ 
if (!must) {coverage_0x8f7aed20(0x8a920faada01d24623ab43df6fd26778240f2212abb3d3a68f1b61ca1cf591ee); /* branch */ 

coverage_0x8f7aed20(0xfbc2469460d05a8652ba8d8bfcbad9c3d0a48e611e3516d3f6406d8bdd7b2bf3); /* line */ 
            coverage_0x8f7aed20(0x6128a5e2cd521445d55ce611238f77f548d4374c14a2d97d10ea7a7e788bf7b0); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason)
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x4dc9a9f1d31e48909ff6b0934347c52742c35a14041bfa5415fa6ff563e0bc0a); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        uint256 payloadA
    )
        internal
        pure
    {coverage_0x8f7aed20(0x1714cf7144703bf3141fa8823c48af86e340fa9dc7d1ec71344f63714c93310d); /* function */ 

coverage_0x8f7aed20(0xe5e5b499ac1d2962dd257fcc2c4ac30b63710b4fb1ad419753c1bf3157161460); /* line */ 
        coverage_0x8f7aed20(0xcf555e0e12ad3fbd5e2bc2bd8e569f2a63089056f17f7802bf5f779a7f7bfa49); /* statement */ 
if (!must) {coverage_0x8f7aed20(0xc59e7b28a4e6b2c6423f81a7297d436f228918ef5236bb44354568a93db0a60e); /* branch */ 

coverage_0x8f7aed20(0x5103419eb9cee3759ec8381449661682c41db21e66df2efa4142eaee044e203a); /* line */ 
            coverage_0x8f7aed20(0x3c8284f438b4055c19dcf9e86176332fc4bd9c8e60f157ebe35b44c7e7035489); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x0392da6d111f6c6afbb9b3a3b2873f239290f3281b30f531305b36c35409e97a); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        uint256 payloadA,
        uint256 payloadB
    )
        internal
        pure
    {coverage_0x8f7aed20(0x342d05c813f3e1feed11e5355b23fb0ca8f9580332b27cf9da83f071a89a22f0); /* function */ 

coverage_0x8f7aed20(0xb994b4718dea4e308f44e47a0bacfed439fd538ac443c7957ed8355c5e00fc8c); /* line */ 
        coverage_0x8f7aed20(0xf5e31be3143ef33e459c5f15635af7fd24a3db1a02d8d48c312dc97a5562f924); /* statement */ 
if (!must) {coverage_0x8f7aed20(0xe1ae206ff10f9ff15d47e5246fe977aafd70bfd70587fce6bea3492bf5d626bf); /* branch */ 

coverage_0x8f7aed20(0x03f4e4c90ccafad3c265388835bdb8298ea9ff84b66d06e02ec7cc037ab0e902); /* line */ 
            coverage_0x8f7aed20(0x96741d3346f7ecda1711c9456ff82a1905bc0c1ccda849b009e7bf93b6e6faa9); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        COMMA,
                        stringify(payloadB),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x1012cec2005ac99c6e00b860b664180c1bef95f5df2f46215519630a1b99a8a2); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        address payloadA
    )
        internal
        pure
    {coverage_0x8f7aed20(0xb0930a0032550fba99a80c0ac68757d61530c71d7bb7d802c2d234f16b5a403f); /* function */ 

coverage_0x8f7aed20(0x12a348e86785cd1fa06af84d2ad31401f117d8f37a3dac0bac78c8d210afaf28); /* line */ 
        coverage_0x8f7aed20(0x506bca8a16773fd9193fbad72bd32afeb23937b3e754ef2ef07ae27974e20972); /* statement */ 
if (!must) {coverage_0x8f7aed20(0x0bf902bf4e2ed77957fa4a96ae237f9389056ea6118ffe77e111814269595f9c); /* branch */ 

coverage_0x8f7aed20(0x3bd6a9aef589c035d01c02195667bb9edd8829286ff435b67692ee0075c5c6bf); /* line */ 
            coverage_0x8f7aed20(0x5b5d056842a741b8298583904e5ca901469a844a6935bac6893a6f7922d1a44e); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x2dcd45b9d754907a78e7ee03c24b908309f416f51882975eb2c1865766ca808b); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        address payloadA,
        uint256 payloadB
    )
        internal
        pure
    {coverage_0x8f7aed20(0x8e400dbd9861396071b79d8fdf00baddbd744b408ce3b11644d552e9dcbc9e88); /* function */ 

coverage_0x8f7aed20(0x6c2301c21e9ecbd4d956b79b4874a4f37da2abc282a310f629ff0803e5d2dc52); /* line */ 
        coverage_0x8f7aed20(0xcc947d2182b53d85e40d4e509b3dc6261588aa860e9787658d82cbb954013aa7); /* statement */ 
if (!must) {coverage_0x8f7aed20(0x65cab92683bd477a377b5d518da92584e92d4229ad66ac84faa812c03083f5fe); /* branch */ 

coverage_0x8f7aed20(0x26296a1a04ad77b04d83db062b3f954b09d09f166871c5cf3efb8f742eea3ac0); /* line */ 
            coverage_0x8f7aed20(0xcad9d6aa8c8326aca4be43dabdc6c9e7f5e117c4d05dadeb4e9128ef7ebfd2ec); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        COMMA,
                        stringify(payloadB),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x10825314a7d977c304f9233751af05ae9ab936f2c677c0d81c8423b689514ef8); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        address payloadA,
        uint256 payloadB,
        uint256 payloadC
    )
        internal
        pure
    {coverage_0x8f7aed20(0x3d303f9bd6a343e8479ded3e8c3aecc07a7a78930335686a10ef6700fb3c17f8); /* function */ 

coverage_0x8f7aed20(0x89051fc7e84f038de0f5bfa3b08f4154f552d0d947393948abbae9bcc995f430); /* line */ 
        coverage_0x8f7aed20(0x85dd5ac5fcf421d92cb4e5b0dacb908a398042680804afdcee5b63dc89b206cf); /* statement */ 
if (!must) {coverage_0x8f7aed20(0xe34d35b4824fec70d4125ab7ef1beadf5b265ac505090891d5f088fa5b58c780); /* branch */ 

coverage_0x8f7aed20(0xd73fc27decf77ae58ff2bef17f56392b06aef1ea4b566b1f55e530ea529a62c7); /* line */ 
            coverage_0x8f7aed20(0x3c68ba8a52f8e6128a5f4dadfa540d370e60f0cc0b44f0564c77d0eb29aa9e1a); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        COMMA,
                        stringify(payloadB),
                        COMMA,
                        stringify(payloadC),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0xe43b4e0153cebf7259e420d9bb49750e37546a67520a563749714a50bf4531d3); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        bytes32 payloadA
    )
        internal
        pure
    {coverage_0x8f7aed20(0x023f5ad42d610dd92dfe09e2b38e299684b88b9c81419ca17b2e39a83047f2f1); /* function */ 

coverage_0x8f7aed20(0xd92181f4c7a9aa89bcb6b93d81b010e331a1de1577fea7ee8c94d23162951ffd); /* line */ 
        coverage_0x8f7aed20(0xe0fb61d78cafcd911a5ca9fcf96fd21485eccd67b1c182584da1f22fd18f3d8f); /* statement */ 
if (!must) {coverage_0x8f7aed20(0x4ef263e6ccc67b2c662735ebcf1060fd1613cf793a9a8afcbc2d4f27687c9ad2); /* branch */ 

coverage_0x8f7aed20(0x996b894c4ce5f043d2d9c2141d165b21f25716449c1f706a4bb49a6d40a5c3f6); /* line */ 
            coverage_0x8f7aed20(0x8e157c2261ca66a070e720ebbdf9d60a4b45bfa94c23ab8eb77e954c9d6f3c26); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x2bbb2528833b0eeccb2da55c835e6de72763193af287630f273b97e05a7c117a); /* branch */ 
}
    }

    function that(
        bool must,
        bytes32 file,
        bytes32 reason,
        bytes32 payloadA,
        uint256 payloadB,
        uint256 payloadC
    )
        internal
        pure
    {coverage_0x8f7aed20(0xf406ef3bcb3bf23c37c4e4abc013a0228f8d8275dca078b30874ec2cffaa8b0a); /* function */ 

coverage_0x8f7aed20(0xce62440ef44ae5cc07aae1b4e7ae9ec837ea43af972478d202c134b09442c7b9); /* line */ 
        coverage_0x8f7aed20(0x83accb2c72f3dadc8978014c7e36a3bfc9266c3c42ce8b0a299e3ad2f65958ae); /* statement */ 
if (!must) {coverage_0x8f7aed20(0x4f792000054a264693a8a2649eed559202cab08846fc9b2f26573a18314c7a0a); /* branch */ 

coverage_0x8f7aed20(0xb054edb3951b9e97542a946a8a088cc19e5198dc0eb4aac87c8d7e8fb5c969f2); /* line */ 
            coverage_0x8f7aed20(0xb5a044992100d604b3461b84f5481b455d75d0f5c65b067860ddda126b7ddea7); /* statement */ 
revert(
                string(
                    abi.encodePacked(
                        stringifyTruncated(file),
                        COLON,
                        stringifyTruncated(reason),
                        LPAREN,
                        stringify(payloadA),
                        COMMA,
                        stringify(payloadB),
                        COMMA,
                        stringify(payloadC),
                        RPAREN
                    )
                )
            );
        }else { coverage_0x8f7aed20(0x4dd92f1422baf15187c543b7cb9317a3f55341ede2100dd658be4c44387abfaa); /* branch */ 
}
    }

    // ============ Private Functions ============

    function stringifyTruncated(
        bytes32 input
    )
        private
        pure
        returns (bytes memory)
    {coverage_0x8f7aed20(0x9e84fc65464668fdddc5ef37ec0640767a086ba07e206b53eff9110f91ad8386); /* function */ 

        // put the input bytes into the result
coverage_0x8f7aed20(0x7b89215ffb100fab144bc3047e58f86bea5c1e51c58cc3e6676d8010aafdb493); /* line */ 
        coverage_0x8f7aed20(0x0a5df36b6b2465be361aefbaa1f313a05fda8a91282940b74feb5bf3b2707450); /* statement */ 
bytes memory result = abi.encodePacked(input);

        // determine the length of the input by finding the location of the last non-zero byte
coverage_0x8f7aed20(0x40d443ffee5c0e1230fe32fa0bcfda3e8b849fc9f260b1e85c6c45c85804f712); /* line */ 
        coverage_0x8f7aed20(0xb45f87b71143914bbec37bbb564bce5bc9a71f5a4015a963f1322f7dd7c611aa); /* statement */ 
for (uint256 i = 32; i > 0; ) {
            // reverse-for-loops with unsigned integer
            /* solium-disable-next-line security/no-modify-for-iter-var */
coverage_0x8f7aed20(0xb44640589c9dc1b0c4952134292a213b9e79f0da8dfbf72a01bb9c12511bf0f1); /* line */ 
            i--;

            // find the last non-zero byte in order to determine the length
coverage_0x8f7aed20(0x64fa3062206bbac05d674bbc6143eed11246c00b3288ad07b99feabf8b0640ce); /* line */ 
            coverage_0x8f7aed20(0xc76d723297ff409c095093e8ef559ba59689af378253bd9cfaba1174d73b186e); /* statement */ 
if (result[i] != 0) {coverage_0x8f7aed20(0x48f1752c0477576ba3cb3266d9fd35682bfa8890b398ad1791d9b18ea152dec5); /* branch */ 

coverage_0x8f7aed20(0xf1831431f38f8fa189d3e11eca7260a67de286af3ff78d51eb53a530fa9e0178); /* line */ 
                coverage_0x8f7aed20(0x7cdb157ca15099a0a5d6a184fc9a83be12abfdcd011346a72c4a4652518d3c74); /* statement */ 
uint256 length = i + 1;

                /* solium-disable-next-line security/no-inline-assembly */
coverage_0x8f7aed20(0x02b09d13534c99e8b994fa7d771f9da0b81c9bdb30d329c37379a68662384c69); /* line */ 
                assembly {
                    mstore(result, length) // r.length = length;
                }

coverage_0x8f7aed20(0x63768415d70bab0b6b337ee35bac5a5eac64a36ca794ffb7f325d9384a41e813); /* line */ 
                coverage_0x8f7aed20(0x6715c788e95cc9ca9c3087156923a562d2817a183859ac4ae8203d618803f939); /* statement */ 
return result;
            }else { coverage_0x8f7aed20(0x4c478ec69eee0e3b72e1a2dad5eff67b23b48b2bae73e7baa69da96ee021e194); /* branch */ 
}
        }

        // all bytes are zero
coverage_0x8f7aed20(0x1c65abe9f462bad556b8c62600e4953cd9b85922c27c44bc96c361af6459eb1d); /* line */ 
        coverage_0x8f7aed20(0x939236f84027f34f0402c22a35359abc3afe867b18b631dde20c5332243402a4); /* statement */ 
return new bytes(0);
    }

    function stringify(
        uint256 input
    )
        private
        pure
        returns (bytes memory)
    {coverage_0x8f7aed20(0xa1b98afaca01b06aeaf0f5d8a7a6632f228007abb647d51be264585c83f38b4c); /* function */ 

coverage_0x8f7aed20(0xf3888612b248958a2061194079bb73d79b5e3b42c6924b76833ba57cb6f797ba); /* line */ 
        coverage_0x8f7aed20(0x0a75cf7edf14d5026434f0b20c26a18c852e7df816b396537216ebb1c906c7f1); /* statement */ 
if (input == 0) {coverage_0x8f7aed20(0x68393ffbbc01c47ac77c2e1c2a8fa7913c054b2a742d685e2239c7755a4fe893); /* branch */ 

coverage_0x8f7aed20(0xfd42d5ed3fb98fdf149bb6ec45b25b2328b820b69958e99eec403ae99af5a15a); /* line */ 
            coverage_0x8f7aed20(0xbf97b0d5d8f57478f39f70c91ba32e1ed39eca64420a200c9ec98364b94bfda2); /* statement */ 
return "0";
        }else { coverage_0x8f7aed20(0x8218497cf82aaa723134555aff64269d33cf68841e2b79db7548d052f3347e37); /* branch */ 
}

        // get the final string length
coverage_0x8f7aed20(0x2662a2dfa9c6faad56163aeac97f06319f328e2b92ab1913dec02b82092470e2); /* line */ 
        coverage_0x8f7aed20(0x1e02bd633addcad1bb9ec357c5b07792c9e9357fcdafb6452e14b055d48dcc9b); /* statement */ 
uint256 j = input;
coverage_0x8f7aed20(0xb97dd0ec2f83e5426ec3f85e9649fd6f73fbd26604b1efd0014016ade160d235); /* line */ 
        coverage_0x8f7aed20(0xd808273891c2a646bbfca96d33bd68e74af3eddf327cbf4300c76fd464dbf9f8); /* statement */ 
uint256 length;
coverage_0x8f7aed20(0xaccb7951c7b91cfcbdb2bebf0a1eaf5ffb81944689d27e0e77fb5c736b9c2152); /* line */ 
        coverage_0x8f7aed20(0xb941edc0683a3183e070504b7941d88f3adf9b88407c84f4c1c0d3a0683baa71); /* statement */ 
while (j != 0) {
coverage_0x8f7aed20(0x754dc710759943769100ad6709cf3710c5da9547530f9429be49c43089516855); /* line */ 
            length++;
coverage_0x8f7aed20(0x240ef9d73c93676ad051054c58c83a53c131c323513670e5656ef467eb6af782); /* line */ 
            coverage_0x8f7aed20(0xf73eb1d51f8546966608c03392c9eeb3c6bf8dddea813b18956777eb0b47969e); /* statement */ 
j /= 10;
        }

        // allocate the string
coverage_0x8f7aed20(0x90a4bc8a3e378aa08468cd88a52a9c5ec654d58a223c149e5406cd03d330086d); /* line */ 
        coverage_0x8f7aed20(0x218d654cc37af1ad86d8d2a4dabb87d77af2cc0f0f8ff74219a3f3c4cc5502b6); /* statement */ 
bytes memory bstr = new bytes(length);

        // populate the string starting with the least-significant character
coverage_0x8f7aed20(0x6e05e15be38a8c6ca99abe89c209a29cd3d3c44c8330725d4c787f83c11cdd84); /* line */ 
        coverage_0x8f7aed20(0xbd52084f996b4ccf12b61718875d7280049e2aa98f41491754a3516580c33da5); /* statement */ 
j = input;
coverage_0x8f7aed20(0x19be8f64ddc486d1233892ef087831081305d33982610218dc5b5321fe52f97f); /* line */ 
        coverage_0x8f7aed20(0x882b19c1b691f345b9ace0b8ce233221a82153b786f99ffb7d63fc22387c7e2d); /* statement */ 
for (uint256 i = length; i > 0; ) {
            // reverse-for-loops with unsigned integer
            /* solium-disable-next-line security/no-modify-for-iter-var */
coverage_0x8f7aed20(0x022b1b782bb5ab428c6f6ef990a987a0c8fc34072a1b1b89dca562015c415a52); /* line */ 
            i--;

            // take last decimal digit
coverage_0x8f7aed20(0x223d492a75ac2ab93e29e5b6f5ae19b0c137d7005be34eb816d60832486d773f); /* line */ 
            coverage_0x8f7aed20(0xcb27a6393eb1049dd8f3bb497cc17f92f36d31581df4c5665032092b5e7a95da); /* statement */ 
bstr[i] = byte(uint8(ASCII_ZERO + (j % 10)));

            // remove the last decimal digit
coverage_0x8f7aed20(0xd21fc0ef8fb9f713c35eedd77764c35a63f747fdec3aad50385f15ff88d84032); /* line */ 
            coverage_0x8f7aed20(0x49a2108ce45497b03d758e1926e8d3a77da3f79331de3065e7802834bed1708c); /* statement */ 
j /= 10;
        }

coverage_0x8f7aed20(0xd1891ba09a1c20147e41aa44e5df5592304b6d71ffb19194c6b4c40170895c5f); /* line */ 
        coverage_0x8f7aed20(0x2439f4baf6c5d4f18ecc035899e8a4b39c91c184baba5d77130cc252b039c1ab); /* statement */ 
return bstr;
    }

    function stringify(
        address input
    )
        private
        pure
        returns (bytes memory)
    {coverage_0x8f7aed20(0x41232121fd43cda3181f85cd18c841ef1fcc8c797fd68939a9551b44793a5871); /* function */ 

coverage_0x8f7aed20(0x11a48a949c9845f715be771303322c8fad968d5bb0164207a8b6300bceae0b18); /* line */ 
        coverage_0x8f7aed20(0x4df829081df7a3c93073430d91abd4ae638cb8939aac59b08075f25fefca344e); /* statement */ 
uint256 z = uint256(input);

        // addresses are "0x" followed by 20 bytes of data which take up 2 characters each
coverage_0x8f7aed20(0x97d15f5c0c62c747583a10efc7dcb2eb7644e23d95ce0f16f2a2f26388cfd294); /* line */ 
        coverage_0x8f7aed20(0x53355fc2e08dcf31458528d28cebe0e1a5608041bdbfc095d7a877462d413797); /* statement */ 
bytes memory result = new bytes(42);

        // populate the result with "0x"
coverage_0x8f7aed20(0x9d0f7b63f15fe126786cf0b4647f4b1c4bad16178c85b35eece6747a7bbd560d); /* line */ 
        coverage_0x8f7aed20(0xb32bf20e07a0a03f561b03e732d8d0f4faa6d33e3f8f5c8f9cb02936bbaa2c09); /* statement */ 
result[0] = byte(uint8(ASCII_ZERO));
coverage_0x8f7aed20(0xa08ed30e43f2f3206466f795932f4f40e34f4a4f5bd058af457690d34fd83a83); /* line */ 
        coverage_0x8f7aed20(0xa6a5619827a536a4f5ce17f0b51612835aa446e5e2eae4d2afae1339b0000802); /* statement */ 
result[1] = byte(uint8(ASCII_LOWER_EX));

        // for each byte (starting from the lowest byte), populate the result with two characters
coverage_0x8f7aed20(0xed8088195b732bed4c50a86002b25dab3b642a926661feb2bae114047d5d0273); /* line */ 
        coverage_0x8f7aed20(0x9715553b67710050fb080cea56a78a336e52f016d1821e8353c4e5f61fcc9d57); /* statement */ 
for (uint256 i = 0; i < 20; i++) {
            // each byte takes two characters
coverage_0x8f7aed20(0xde926886886f76998b5c5023dd0b8a87b3bf4d3a8269ea499ec3089248e71811); /* line */ 
            coverage_0x8f7aed20(0x4988564a422fd34e0b1b5401d74a596ab724b4596ca3c24191b582debce6e0b2); /* statement */ 
uint256 shift = i * 2;

            // populate the least-significant character
coverage_0x8f7aed20(0xb58afae0e3ac2feb2028a5048c4fabdf617f96220e7c3062bbfbb746dfb7fbe6); /* line */ 
            coverage_0x8f7aed20(0x82455083d9f44418a6be927c988f610ca2e9da8b9e827a76270803f12517494d); /* statement */ 
result[41 - shift] = char(z & FOUR_BIT_MASK);
coverage_0x8f7aed20(0xb48719df51a15cae0aec4f72dfbe24add5666097d1863d8891e7ba8e6fca161b); /* line */ 
            coverage_0x8f7aed20(0x244e5343db4fbe64cd47b9b705dc744c1647fe702d86903466d1e32b534d16ca); /* statement */ 
z = z >> 4;

            // populate the most-significant character
coverage_0x8f7aed20(0xaadee2c7c93a4b7f954a6fe3c5d2076bd13177bcdb813b5fba2ba06b8100b21f); /* line */ 
            coverage_0x8f7aed20(0x94fbddf9be98651844652e3d4e7fb4da0fcd530070d01a75311ff5070fe307ef); /* statement */ 
result[40 - shift] = char(z & FOUR_BIT_MASK);
coverage_0x8f7aed20(0x1537993314d57e23fa807ca31a6df3b4af6e355f998080338f054311c9c8b4ca); /* line */ 
            coverage_0x8f7aed20(0x62c0c2ae094852c6c58bf11d4bdcbe29eae2c70181891b40732810954ff2f8b6); /* statement */ 
z = z >> 4;
        }

coverage_0x8f7aed20(0x1a690a81f824f3ee65f01a74b2290c2a30415d7db092dfc402d93965734bdeb2); /* line */ 
        coverage_0x8f7aed20(0x7179cf938387d8a7445f63f5d4d7732679a85b1a14ff3a1e457f7389744a6a04); /* statement */ 
return result;
    }

    function stringify(
        bytes32 input
    )
        private
        pure
        returns (bytes memory)
    {coverage_0x8f7aed20(0x7e92b05c05475b192a370a6e7981262fc89c57741ae47e1f985d37d62e39f87e); /* function */ 

coverage_0x8f7aed20(0xe3179c39337f6bf8b73da65468c89cfee6c774a4fe41cd426ca6f6c8e328f210); /* line */ 
        coverage_0x8f7aed20(0xdc215f0e52b4661c96348d04d36f4d1745410a9cb2ee13eebf138e42d5a46d8f); /* statement */ 
uint256 z = uint256(input);

        // bytes32 are "0x" followed by 32 bytes of data which take up 2 characters each
coverage_0x8f7aed20(0xd53ce2d9f6a2072d105fd253f74bfec73433c97cb2fc3df19ea6d869a0b57275); /* line */ 
        coverage_0x8f7aed20(0x703104410333657bcd8219ba9b1bff8772339eacb6eb3caa2aad032eedd05c9a); /* statement */ 
bytes memory result = new bytes(66);

        // populate the result with "0x"
coverage_0x8f7aed20(0x3536da006ed4e2520df88b540f14ad511243d08dfe5bd438e593a23953685849); /* line */ 
        coverage_0x8f7aed20(0x45d8baad234251aa745ff8062cc4e7091b36a0df067629d0e08cc04eb0631ffc); /* statement */ 
result[0] = byte(uint8(ASCII_ZERO));
coverage_0x8f7aed20(0x355b36845f949410656461da4f9d74351253dc9a6188b178c68f9a124403adff); /* line */ 
        coverage_0x8f7aed20(0x42d78c7412a3a6562a073873f486942151f77792fa0b25fd01bbeef001f039b6); /* statement */ 
result[1] = byte(uint8(ASCII_LOWER_EX));

        // for each byte (starting from the lowest byte), populate the result with two characters
coverage_0x8f7aed20(0x3fb2384051b16ecfcbbf8a49fc459d2455b90829b84f9f8212478dfb9c393730); /* line */ 
        coverage_0x8f7aed20(0xc3e115e3c7a84a46762be05cab03b8cc7bc69ce020aeabf60529cc7cca42541e); /* statement */ 
for (uint256 i = 0; i < 32; i++) {
            // each byte takes two characters
coverage_0x8f7aed20(0xd26265a38c8c97e30b52c0c1cda1330f1247da721fb0e79b92c05cc6d2a532a0); /* line */ 
            coverage_0x8f7aed20(0x4195579dbc9868b09c775e65cc0150ae93ef6cb72fe4e1c3cc77e04cf3b7433b); /* statement */ 
uint256 shift = i * 2;

            // populate the least-significant character
coverage_0x8f7aed20(0xdaf6f71b43a709e7e7542610b168d124f4e7721b3cf561b5a5c22c6b7289104d); /* line */ 
            coverage_0x8f7aed20(0xe09de0b1c2f391ddb958c79597543a67ce2506a537670be288ae950c9b1395a6); /* statement */ 
result[65 - shift] = char(z & FOUR_BIT_MASK);
coverage_0x8f7aed20(0x05103a16aeeb921b2ceedf6b86aff715c820c02c2e2b919171a15b07b43d5a34); /* line */ 
            coverage_0x8f7aed20(0x85d4edb149cd8fa9ece95cdf4e358994cba762af5c80951fbcf6e6ba6679b6f3); /* statement */ 
z = z >> 4;

            // populate the most-significant character
coverage_0x8f7aed20(0x61a2cea87cbca52e48d47111897e6044e9a9e05b8b34eaa625338b65f48cfd9a); /* line */ 
            coverage_0x8f7aed20(0x78fb52805444ffd99bf4ebb3b07ed0eda15871caaf5074f1a85685af0fd4ed93); /* statement */ 
result[64 - shift] = char(z & FOUR_BIT_MASK);
coverage_0x8f7aed20(0xeb3d1f6eb703b589e225d919123593f4b3cab727143f71efae7505901ff2c7d5); /* line */ 
            coverage_0x8f7aed20(0x808de9ea477e42636f48037997cac5e196007140ead4d8c2fa7fa94a53ee891a); /* statement */ 
z = z >> 4;
        }

coverage_0x8f7aed20(0x10189558685b1adc862893bee9a05f7cc2bac602e047fda48f182152ab6707bc); /* line */ 
        coverage_0x8f7aed20(0xe0c694cee92b1b685d99156686b3bda254d96b76c117f735d78a0f9b7590091b); /* statement */ 
return result;
    }

    function char(
        uint256 input
    )
        private
        pure
        returns (byte)
    {coverage_0x8f7aed20(0x7aa3701409548ff33fe9940e4375db4360b938133f3a0bc0962cd715dbf3af72); /* function */ 

        // return ASCII digit (0-9)
coverage_0x8f7aed20(0xe9cc21a00986a855f480fa910020b2a8ebb20ce284100287ca36805145a2d861); /* line */ 
        coverage_0x8f7aed20(0x71896ff24b3ff29370f4521ba3bbeb93119f3035308403eea914287dc4a046bf); /* statement */ 
if (input < 10) {coverage_0x8f7aed20(0xfc2943a45cfa9ed187ec74aea04f9a17f4eaf650c26b215368d147ac0c5e0dcc); /* branch */ 

coverage_0x8f7aed20(0xa8aa131bed7c99233062596aeb7858f1e1fd0723ad7c0d0075e3ca332774beb2); /* line */ 
            coverage_0x8f7aed20(0xa4f5d63ac306cd39522d873dcf4b86177c2d72e6570680e730cd54fbc9999092); /* statement */ 
return byte(uint8(input + ASCII_ZERO));
        }else { coverage_0x8f7aed20(0x9105ef94f475bdd4141181700f1837bac70eee63c28c2d82c7b682e9ca69f03f); /* branch */ 
}

        // return ASCII letter (a-f)
coverage_0x8f7aed20(0xaee66003b4bc7330692ef95516d6ec3affa0f5b8f9207882782062723f634696); /* line */ 
        coverage_0x8f7aed20(0x53d804a277059f9a2d91299cd917fab5853121ed4b22ab104d18fa8b8dc6d34b); /* statement */ 
return byte(uint8(input + ASCII_RELATIVE_ZERO));
    }
}
