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
import { LDecimal } from "./LDecimal.sol";
import { LMath } from "./LMath.sol";
import { LTime } from "./LTime.sol";
import { LTypes } from "./LTypes.sol";


library LInterest {
    using LMath for uint256;
    using SafeMath for uint256;
    using SafeMath for uint128;
    using LTime for LTime.Time;
    using LDecimal for LDecimal.Decimal;

    // ============ Constants ============

    uint64 constant public BASE = 10**18;

    // ============ Structs ============

    struct TotalNominal {
        LTypes.Nominal supply;
        LTypes.Nominal borrow;
    }

    struct Index {
        Compounded borrow;
        Compounded supply;
    }

    struct Rate {
        uint128 value;
    }

    struct Compounded {
        uint128 value;
    }

    // ============ Public Functions ============

    function getUpdatedIndex(
        Index memory index,
        Rate memory rate,
        LTime.Time memory timeDelta,
        TotalNominal memory totalNominal,
        LDecimal.Decimal memory earningsRate
    )
        internal
        pure
        returns (Index memory result)
    {
        Compounded memory borrowInterest = _getCompoundedInterest(rate, timeDelta);

        uint256 supplyInterestRaw = LMath.getPartial(
            totalNominal.borrow.value,
            totalNominal.supply.value,
            borrowInterest.value.sub(BASE)
        );
        Compounded memory supplyInterest;
        supplyInterest.value = earningsRate.mul(supplyInterestRaw).add(BASE).to128();

        result.borrow = mul(index.borrow, borrowInterest);
        result.supply = mul(index.supply, supplyInterest);
    }

    function nominalToAccrued(
        LTypes.SignedNominal memory signedNominal,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedAccrued memory result)
    {
        result.sign = signedNominal.sign;
        Compounded memory interest = result.sign ? index.supply : index.borrow;
        result.accrued.value = LMath.getPartial(
            interest.value,
            BASE,
            signedNominal.nominal.value
        );
    }

    function accruedToNominal(
        LTypes.SignedAccrued memory accrued,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedNominal memory result)
    {
        result.sign = accrued.sign;
        Compounded memory interest = result.sign ? index.supply : index.borrow;
        result.nominal.value = LMath.getPartial(
            BASE,
            interest.value,
            accrued.accrued.value
        ).to128();
    }

    function newIndex()
        internal
        pure
        returns (Index memory)
    {
        return Index({
            borrow: Compounded({ value: BASE }),
            supply: Compounded({ value: BASE })
        });
    }

    function isValidRate(
        Rate memory rate
    )
        internal
        pure
        returns (bool)
    {
        return rate.value >= BASE;
    }

    function mul(
        Compounded memory a,
        Rate memory r
    )
        private
        pure
        returns (Compounded memory result)
    {
        result.value = (uint256(a.value) * uint256(r.value) / BASE).to128();
    }

    function mul(
        Rate memory a,
        Rate memory b
    )
        private
        pure
        returns (Rate memory result)
    {
        result.value = (uint256(a.value) * uint256(b.value) / BASE).to128();
    }

    function mul(
        Compounded memory a,
        Compounded memory b
    )
        private
        pure
        returns (Compounded memory result)
    {
        result.value = (uint256(a.value) * uint256(b.value) / BASE).to128();
    }

    // ============ Private Functions ============

    function _getCompoundedInterest(
        Rate memory rate,
        LTime.Time memory timeDelta
    )
        private
        pure
        returns (Compounded memory result)
    {
        result.value = BASE;

        // localRate is rate^(2^rounds)
        Rate memory localRate = Rate({ value: rate.value });
        uint256 localTime = uint256(timeDelta.value);

        while (localTime != 0) {

            if (localTime & 1 != 0) {
                result = mul(result, localRate);
            }

            localTime = localTime >> 1;
            localRate = mul(localRate, localRate);
        }
    }
}
