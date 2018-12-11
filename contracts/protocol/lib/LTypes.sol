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

    // ============ Nominal ============

    struct Nominal {
        uint128 value;
    }

    function sub(
        Nominal memory a,
        Nominal memory b
    )
        internal
        pure
        returns (Nominal memory result)
    {
        result.value = a.value.sub(b.value).to128();
    }

    function add(
        Nominal memory a,
        Nominal memory b
    )
        internal
        pure
        returns (Nominal memory result)
    {
        result.value = a.value.add(b.value).to128();
    }

    // ============ Signed Nominal ============

    struct SignedNominal {
        bool sign;
        Nominal nominal;
    }

    function sub(
        SignedNominal memory a,
        SignedNominal memory b
    )
        internal
        pure
        returns (SignedNominal memory)
    {
        SignedNominal memory negativeB = b;
        negativeB.sign = !b.sign;
        return add(a, b);
    }

    function add(
        SignedNominal memory a,
        SignedNominal memory b
    )
        internal
        pure
        returns (SignedNominal memory result)
    {
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.nominal = add(a.nominal, b.nominal);
        } else {
            if (a.nominal.value >= b.nominal.value) {
                result.sign = a.sign;
                result.nominal = sub(a.nominal, b.nominal);
            } else {
                result.sign = b.sign;
                result.nominal = sub(b.nominal, a.nominal);
            }
        }
    }

    // ============ Accrued ============

    struct Accrued {
        uint256 value;
    }

    function sub(
        Accrued memory a,
        Accrued memory b
    )
        internal
        pure
        returns (Accrued memory result)
    {
        result.value = a.value.sub(b.value);
    }

    function add(
        Accrued memory a,
        Accrued memory b
    )
        internal
        pure
        returns (Accrued memory result)
    {
        result.value = a.value.add(b.value);
    }

    // ============ Signed Accrued ============

    struct SignedAccrued {
        bool sign;
        Accrued accrued;
    }

    function sub(
        SignedAccrued memory a,
        SignedAccrued memory b
    )
        internal
        pure
        returns (SignedAccrued memory)
    {
        SignedAccrued memory negativeB = b;
        negativeB.sign = !b.sign;
        return add(a, b);
    }

    function add(
        SignedAccrued memory a,
        SignedAccrued memory b
    )
        internal
        pure
        returns (SignedAccrued memory result)
    {
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.accrued = add(a.accrued, b.accrued);
        } else {
            result.sign = (a.accrued.value >= b.accrued.value);
            if (a.accrued.value > b.accrued.value) {
                result.sign = a.sign;
                result.accrued = sub(a.accrued, b.accrued);
            } else {
                result.sign = b.sign;
                result.accrued = sub(b.accrued, a.accrued);
            }
        }
    }
}
