pragma solidity ^0.5.16;

// a library for handling binary fixed point numbers (https://en.wikipedia.org/wiki/Q_(number_format))

// range: [0, 2**112 - 1]
// resolution: 1 / 2**112

library UQ112x112 {
function coverage_0x8f2fec31(bytes32 c__0x8f2fec31) public pure {}

    uint224 constant Q112 = 2 ** 112;

    // encode a uint112 as a UQ112x112
    function encode(uint112 y) internal pure returns (uint224 z) {coverage_0x8f2fec31(0x588565868742978c2fc2c76ec4cafc827f1afcad3bc519dd9bcf0e90c3fecac7); /* function */ 

        // never overflows
coverage_0x8f2fec31(0x80203d1a4e05c4625093e353649a91c43799d05db28090bc57d1e1419c49b556); /* line */ 
        coverage_0x8f2fec31(0x631668c263905512893ae8112554ac0e9ed3932504345067565b63cd5a125219); /* statement */ 
z = uint224(y) * Q112;
    }

    // divide a UQ112x112 by a uint112, returning a UQ112x112
    function uqdiv(uint224 x, uint112 y) internal pure returns (uint224 z) {coverage_0x8f2fec31(0x787bd1285d9c9e2e3837297f3dbb877983a35bd8d1d1b746d618cea3702b3f78); /* function */ 

coverage_0x8f2fec31(0xacb428a76a2cfef15502eba25977b7a658780efa544be4362c43d67f04ec4e57); /* line */ 
        coverage_0x8f2fec31(0xaf56e47b6ba94fd29b9ce1fb79ae8689057059419c27c6085918335ede052ae2); /* statement */ 
z = x / uint224(y);
    }
}
