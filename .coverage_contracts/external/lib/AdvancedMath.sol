pragma solidity =0.5.16;

// a library for performing various math operations

library AdvancedMath {
function coverage_0x1d38d7ce(bytes32 c__0x1d38d7ce) public pure {}

    function min(uint x, uint y) internal pure returns (uint z) {coverage_0x1d38d7ce(0x9c8aa80e127aee9d887838151e846244fa918005498be545dd02f460a063c06e); /* function */ 

coverage_0x1d38d7ce(0x8ca59f26500becc517e20f92fd7bb275adf2cba00b74ba581d964211ab559cd9); /* line */ 
        coverage_0x1d38d7ce(0xf3170bf31cd77ab7b6a287304d17a748b4f6ac1badf29ad038481ffb55ef147d); /* statement */ 
z = x < y ? x : y;
    }

    // babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
    function sqrt(uint y) internal pure returns (uint z) {coverage_0x1d38d7ce(0x78fd86b8fb9955c3fde5532d820f2edc7099f3adb25673351d9f6a70351b7bfe); /* function */ 

coverage_0x1d38d7ce(0x2e92513bc663c86eb0ee6882d3d42a3d3749433bb51d0a7cb59eb9eb955ddcdb); /* line */ 
        coverage_0x1d38d7ce(0x4f1ef41bed92c22dedc79dbad341a2a598cdb4fb19cc7d9b082c3d03a796a4c2); /* statement */ 
if (y > 3) {coverage_0x1d38d7ce(0xc5c5f138f7a513338c94e7e08a5d166c4d24dae27ceaa903b19f37b2bd4b1a92); /* branch */ 

coverage_0x1d38d7ce(0x7f9c3a4e20dfda55d9418339396e534b4826ce2441fde728a26b3a0da37a349d); /* line */ 
            coverage_0x1d38d7ce(0x841ba38810dff1848ffe1682ec7b17fd6d6b22846de81f10db77c0508ea0b773); /* statement */ 
z = y;
coverage_0x1d38d7ce(0xd490bf31015291b088bfba78d92f93419dd515b7f3ac6f2efe56ea95b264eeaa); /* line */ 
            coverage_0x1d38d7ce(0xd9f8730a9f14da5a2171a926efd925171410c2c8472836ad27f5ded02f9fbf02); /* statement */ 
uint x = y / 2 + 1;
coverage_0x1d38d7ce(0x0ac475c70a00e93f2d783475c8ddbbf111d55fb91b09962ee9e9573ade9abd0e); /* line */ 
            coverage_0x1d38d7ce(0x8d075e0adebf21fbb65c233234427205433860d78cd416c4784c6d13a44013b9); /* statement */ 
while (x < z) {
coverage_0x1d38d7ce(0xf5727ed678e59934bf0704c4ca359d99b9f4cfa3faae8e3d0825771ed88aa783); /* line */ 
                coverage_0x1d38d7ce(0x455e980ef5a531fd6c845ff3964230c5b6c98e768d625e678b8012d65bdae5a4); /* statement */ 
z = x;
coverage_0x1d38d7ce(0x57b34f0d490c541177e89c93d04924d3ec5d47687b9d888888d8f33bf13d70ca); /* line */ 
                coverage_0x1d38d7ce(0xbe37b2a1733a9969eb56f36a7caaf06c2b81e9daeddcde81b3c45679b5a16323); /* statement */ 
x = (y / x + x) / 2;
            }
        } else {coverage_0x1d38d7ce(0x3df79ea5189b8e9d240abffe6594f54112aac0707f82ae05a31ccc2d86cfe31b); /* statement */ 
coverage_0x1d38d7ce(0x6c00540962cd354911fc9a1386ecace5713c90c8dc3ae8f7fbeb0cd6279335f1); /* branch */ 
if (y != 0) {coverage_0x1d38d7ce(0x0148348cfd3b597aa8ae903cd6f649bb7f62ee49a1853f91eec55cb3c3e3829c); /* branch */ 

coverage_0x1d38d7ce(0xae3fd09659863e2eef64f1ec831b3e5f11c617cec699c376b1ca4817e0a9a1ce); /* line */ 
            coverage_0x1d38d7ce(0xacda76cbebe7b023f81a38fe38d38dc761777bdf8f3841e3eea857a5ef16b3aa); /* statement */ 
z = 1;
        }else { coverage_0x1d38d7ce(0x691bb307f6f7205f8bb1d681d378951202ff84cd829ccb524c3e09c026a2c816); /* branch */ 
}}
    }
}
