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

    // ============ Signed Nominal ============

    struct SignedNominal {
        bool sign;
        uint128 nominal;
    }

    function sub(
        SignedNominal memory a,
        SignedNominal memory b
    )
        internal
        pure
        returns (SignedNominal memory)
    {
        return add(a, negative(b));
    }

    function add(
        SignedNominal memory a,
        SignedNominal memory b
    )
        internal
        pure
        returns (SignedNominal memory)
    {
        SignedNominal memory result;
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.nominal = a.nominal.add(b.nominal).to128();
        } else {
            if (a.nominal >= b.nominal) {
                result.sign = a.sign;
                result.nominal = a.nominal.sub(b.nominal).to128();
            } else {
                result.sign = b.sign;
                result.nominal = b.nominal.sub(a.nominal).to128();
            }
        }
        return result;
    }

    function equals(
        SignedNominal memory a,
        SignedNominal memory b
    )
        internal
        pure
        returns (bool)
    {
        if (a.nominal == 0 && b.nominal == 0) {
            return true;
        }
        return (a.nominal == b.nominal) && (a.sign == b.sign);
    }

    function negative(
        SignedNominal memory a
    )
        internal
        pure
        returns (SignedNominal memory)
    {
        return SignedNominal({
            sign: !a.sign,
            nominal: a.nominal
        });
    }

    // ============ Signed Accrued ============

    struct SignedAccrued {
        bool sign;
        uint256 accrued;
    }

    function sub(
        SignedAccrued memory a,
        SignedAccrued memory b
    )
        internal
        pure
        returns (SignedAccrued memory)
    {
        return add(a, negative(b));
    }

    function add(
        SignedAccrued memory a,
        SignedAccrued memory b
    )
        internal
        pure
        returns (SignedAccrued memory)
    {
        SignedAccrued memory result;
        if (a.sign == b.sign) {
            result.sign = a.sign;
            result.accrued = a.accrued.add(b.accrued);
        } else {
            result.sign = (a.accrued >= b.accrued);
            if (a.accrued > b.accrued) {
                result.sign = a.sign;
                result.accrued = a.accrued.sub(b.accrued);
            } else {
                result.sign = b.sign;
                result.accrued = b.accrued.sub(a.accrued);
            }
        }
        return result;
    }

    function negative(
        SignedAccrued memory a
    )
        internal
        pure
        returns (SignedAccrued memory)
    {
        return SignedAccrued({
            sign: !a.sign,
            accrued: a.accrued
        });
    }
}
