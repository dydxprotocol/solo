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

pragma solidity ^0.5.0;


/**
 * @title Require
 * @author dYdX
 *
 * TODO
 */
library Require {

    // ============ Constants ============

    uint256 constant ASCII_ZERO = 48; // '0'
    uint256 constant ASCII_RELATIVE_ZERO = 87; // 'a' - 10
    uint256 constant ASCII_LOWER_EX = 120; // 'x'

    // ============ Library Functions ============

    function that(
        bool must,
        string memory file,
        string memory reason
    )
        internal
        pure
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        file,
                        ": ",
                        reason
                    )
                )
            );
        }
    }

    function that(
        bool must,
        string memory file,
        string memory reason,
        uint256 payloadA
    )
        internal
        pure
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        file,
                        ": ",
                        reason,
                        " <",
                        stringify(payloadA),
                        ">"
                    )
                )
            );
        }
    }

    function that(
        bool must,
        string memory file,
        string memory reason,
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
                        file,
                        ": ",
                        reason,
                        " <",
                        stringify(payloadA),
                        ", ",
                        stringify(payloadB),
                        ">"
                    )
                )
            );
        }
    }

    function that(
        bool must,
        string memory file,
        string memory reason,
        uint256 payloadA,
        uint256 payloadB,
        uint256 payloadC
    )
        internal
        pure
    {
        if (!must) {
            revert(
                string(
                    abi.encodePacked(
                        file,
                        ": ",
                        reason,
                        " <",
                        stringify(payloadA),
                        ", ",
                        stringify(payloadB),
                        ", ",
                        stringify(payloadC),
                        ">"
                    )
                )
            );
        }
    }

    // ============ Private Functions ============

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
        returns (byte[42] memory)
    {
        uint256 z = uint256(a);

        byte[42] memory result;
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
