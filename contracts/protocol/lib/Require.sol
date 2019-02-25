/*

    Copyright 2018 dYdX Trading Inc.

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

pragma solidity 0.5.4;


/**
 * @title Require
 * @author dYdX
 *
 * Stringifies parameters to pretty-print revert messages. Costs more gas than regular require()
 */
library Require {

    // ============ Constants ============

    uint256 constant ASCII_ZERO = 48; // '0'
    uint256 constant ASCII_RELATIVE_ZERO = 87; // 'a' - 10
    uint256 constant ASCII_LOWER_EX = 120; // 'x'
    bytes2 constant COLON = 0x3a20; // ': '
    bytes2 constant COMMA = 0x2c20; // ', '
    bytes2 constant LPAREN = 0x203c; // ' <'
    byte constant RPAREN = 0x3e; // '>'

    // ============ Library Functions ============

    function that(
        bool must,
        bytes32 file,
        bytes32 reason
    )
        internal
        pure
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        stringify(file),
                        COLON,
                        stringify(reason)
                    )
                )
            );
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
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        stringify(file),
                        COLON,
                        stringify(reason),
                        LPAREN,
                        stringify(payloadA),
                        RPAREN
                    )
                )
            );
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
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        stringify(file),
                        COLON,
                        stringify(reason),
                        LPAREN,
                        stringify(payloadA),
                        COMMA,
                        stringify(payloadB),
                        RPAREN
                    )
                )
            );
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
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        stringify(file),
                        COLON,
                        stringify(reason),
                        LPAREN,
                        stringify(payloadA),
                        RPAREN
                    )
                )
            );
        }
    }

    // ============ Private Functions ============

    function stringify(
        bytes32 b
    )
        private
        pure
        returns (bytes memory)
    {
        bytes memory r = abi.encodePacked(b);
        for (uint256 i = 0; i < 32; i++) {
            if (r[i] == 0) {
                /* solium-disable-next-line security/no-inline-assembly */
                assembly {
                    mstore(r, i) // r.length = i;
                }
                return r;
            }
        }
        return r;
    }

    function stringify(
        uint256 i
    )
        private
        pure
        returns (bytes memory)
    {
        if (i == 0) {
            return "0";
        }

        // get length
        uint256 j = i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }

        // get string
        j = i;
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        while (j != 0) {
            bstr[k--] = byte(uint8(ASCII_ZERO + (j % 10)));
            j /= 10;
        }

        return bstr;
    }

    function stringify(
        address a
    )
        private
        pure
        returns (bytes memory)
    {
        uint256 z = uint256(a);

        bytes memory result = new bytes(42);
        result[0] = byte(uint8(ASCII_ZERO));
        result[1] = byte(uint8(ASCII_LOWER_EX));

        for (uint256 i = 0; i < 20; i++) {
            uint256 shift = i * 2;
            result[41 - shift] = char(z & 0xf);
            z = z >> 4;
            result[40 - shift] = char(z & 0xf);
            z = z >> 4;
        }

        return result;
    }

    function char(
        uint256 b
    )
        private
        pure
        returns (byte)
    {
        if (b < 10) {
            return byte(uint8(b + ASCII_ZERO));
        }
        return byte(uint8(b + ASCII_RELATIVE_ZERO));
    }
}
