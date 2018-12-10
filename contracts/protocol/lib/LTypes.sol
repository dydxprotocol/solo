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

pragma solidity 0.5.1;

import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";
import { LMath } from "./LMath.sol";

library LTypes {
    using SafeMath for uint256;
    using SafeMath for uint128;
    using LMath for uint256;

    // ============ Principal ============

    struct Principal {
        uint128 value;
    }

    function sub(
        Principal memory a,
        Principal memory b
    )
        internal
        pure
        returns (Principal memory result)
    {
        result.value = a.value.sub(b.value).to128();
    }

    function add(
        Principal memory a,
        Principal memory b
    )
        internal
        pure
        returns (Principal memory result)
    {
        result.value = a.value.add(b.value).to128();
    }

    // ============ Signed Principal ============

    struct SignedPrincipal {
        bool sign;
        Principal principal;
    }

    function sub(
        SignedPrincipal memory a,
        SignedPrincipal memory b
    )
        internal
        pure
        returns (SignedPrincipal memory)
    {
        SignedPrincipal memory negativeB = b;
        negativeB.sign = !b.sign;
        return add(a, b);
    }

    function add(
        SignedPrincipal memory a,
        SignedPrincipal memory b
    )
        internal
        pure
        returns (SignedPrincipal memory result)
    {
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.principal = add(a.principal, b.principal);
        } else {
            result.sign = (a.principal.value >= b.principal.value);
            if (a.principal.value > b.principal.value) {
                result.sign = a.sign;
                result.principal = sub(a.principal, b.principal);
            } else {
                result.sign = b.sign;
                result.principal = sub(b.principal, a.principal);
            }
        }
    }

    // ============ TokenAmount ============

    struct TokenAmount {
        uint256 value;
    }

    function sub(
        TokenAmount memory a,
        TokenAmount memory b
    )
        internal
        pure
        returns (TokenAmount memory result)
    {
        result.value = a.value.sub(b.value);
    }

    function add(
        TokenAmount memory a,
        TokenAmount memory b
    )
        internal
        pure
        returns (TokenAmount memory result)
    {
        result.value = a.value.add(b.value);
    }

    // ============ Signed TokenAmount ============

    struct SignedTokenAmount {
        bool sign;
        TokenAmount tokenAmount;
    }

    function sub(
        SignedTokenAmount memory a,
        SignedTokenAmount memory b
    )
        internal
        pure
        returns (SignedTokenAmount memory)
    {
        SignedTokenAmount memory negativeB = b;
        negativeB.sign = !b.sign;
        return add(a, b);
    }

    function add(
        SignedTokenAmount memory a,
        SignedTokenAmount memory b
    )
        internal
        pure
        returns (SignedTokenAmount memory result)
    {
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.tokenAmount = add(a.tokenAmount, b.tokenAmount);
        } else {
            result.sign = (a.tokenAmount.value >= b.tokenAmount.value);
            if (a.tokenAmount.value > b.tokenAmount.value) {
                result.sign = a.sign;
                result.tokenAmount = sub(a.tokenAmount, b.tokenAmount);
            } else {
                result.sign = b.sign;
                result.tokenAmount = sub(b.tokenAmount, a.tokenAmount);
            }
        }
    }
}
