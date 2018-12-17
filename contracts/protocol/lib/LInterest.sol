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
    using SafeMath for uint96;
    using SafeMath for uint32;
    using LDecimal for LDecimal.Decimal;

    // ============ Constants ============

    uint64 constant public BASE = 10**18;

    // ============ Structs ============

    struct TotalNominal {
        uint128 borrow;
        uint128 supply;
    }

    struct Index {
        uint96 borrow;
        uint96 supply;
        uint32 lastUpdate;
    }

    struct Rate {
        uint128 value;
    }

    // ============ Public Functions ============

    function getUpdatedIndex(
        Index memory index,
        Rate memory rate,
        TotalNominal memory totalNominal,
        LDecimal.Decimal memory earningsTax
    )
        internal
        view
        returns (Index memory)
    {
        uint32 timeDelta = LTime.currentTime().sub(index.lastUpdate).to32();
        uint96 borrowInterest = _getCompoundedInterest(rate, timeDelta);

        uint256 supplyInterestRaw = LMath.getPartial(
            borrowInterest.sub(BASE),
            totalNominal.borrow,
            totalNominal.supply
        );
        LDecimal.Decimal memory earningsRate = LDecimal.one().sub(earningsTax);
        uint96 supplyInterest = earningsRate.mul(supplyInterestRaw).add(BASE).to96();

        return Index({
            borrow: LMath.getPartial(index.borrow, borrowInterest, BASE).to96(),
            supply: LMath.getPartial(index.supply, supplyInterest, BASE).to96(),
            lastUpdate: LTime.currentTime()
        });
    }

    function nominalToAccrued(
        LTypes.SignedNominal memory signedNominal,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedAccrued memory)
    {
        LTypes.SignedAccrued memory result;
        result.sign = signedNominal.sign;
        result.accrued = LMath.getPartial(
            signedNominal.nominal,
            result.sign ? index.supply : index.borrow,
            BASE
        );
        return result;
    }

    function accruedToNominal(
        LTypes.SignedAccrued memory accrued,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedNominal memory)
    {
        LTypes.SignedNominal memory result;
        result.sign = accrued.sign;
        result.nominal = LMath.getPartial(
            accrued.accrued,
            BASE,
            result.sign ? index.supply : index.borrow
        ).to128();
        return result;
    }

    function newIndex()
        internal
        view
        returns (Index memory)
    {
        return Index({
            borrow: BASE,
            supply: BASE,
            lastUpdate: LTime.currentTime()
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

    // ============ Private Functions ============

    function _getCompoundedInterest(
        Rate memory rate,
        uint32 timeDelta
    )
        private
        pure
        returns (uint96)
    {
        uint96 result = BASE;

        // localRate is rate^(2^rounds)
        Rate memory localRate = Rate({ value: rate.value });
        uint256 localTime = uint256(timeDelta);

        while (localTime != 0) {

            if (localTime & 1 != 0) {
                result = LMath.getPartial(result, localRate.value, BASE).to96();
            }

            localTime = localTime >> 1;
            localRate.value = LMath.getPartial(localRate.value, localRate.value, BASE).to128();
        }

        return result;
    }
}
