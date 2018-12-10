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
    using LDecimal for LDecimal.D256;
    using LTypes for LTypes.Principal;
    using LInterest for Accrued;

    uint64 constant public BASE = 10**18;


    // ============ Structs ============

    struct TotalPrincipal {
        LTypes.Principal lent;
        LTypes.Principal borrowed;
    }

    struct Index {
        Accrued borrower;
        Accrued lender;
    }

    struct Rate {
        uint128 value;
    }

    struct Accrued {
        uint128 value;
    }

    // ============ Public Functions ============

    function getUpdatedIndex(
        Index memory index,
        Rate memory rate,
        LTime.Time memory timeDelta,
        TotalPrincipal memory totalPrincipal,
        LDecimal.D256 memory earningsRate
    )
        internal
        pure
        returns (Index memory result)
    {
        Accrued memory borrowerInterest = _getAccruedInterest(rate, timeDelta);

        uint256 lenderInterestRaw = LMath.getPartial(
            totalPrincipal.borrowed.value,
            totalPrincipal.lent.value,
            borrowerInterest.value.sub(BASE)
        );
        Accrued memory lenderInterest;
        lenderInterest.value = earningsRate.mul(lenderInterestRaw).add(BASE).to128();

        result.borrower = mul(index.borrower, borrowerInterest);
        result.lender = mul(index.lender, lenderInterest);
    }

    function signedPrincipalToTokenAmount(
        LTypes.SignedPrincipal memory signedPrincipal,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedTokenAmount memory result)
    {
        result.sign = signedPrincipal.sign;
        Accrued memory accrued = result.sign ? index.lender : index.borrower;
        result.tokenAmount.value = LMath.getPartial(
            accrued.value,
            BASE,
            signedPrincipal.principal.value
        );
    }

    function signedTokenAmountToPrincipal(
        LTypes.SignedTokenAmount memory signedTokenAmount,
        Index memory index
    )
        internal
        pure
        returns (LTypes.SignedPrincipal memory result)
    {
        result.sign = signedTokenAmount.sign;
        Accrued memory accrued = result.sign ? index.lender : index.borrower;
        result.principal.value = LMath.getPartial(
            BASE,
            accrued.value,
            signedTokenAmount.tokenAmount.value
        ).to128();
    }

    function newIndex()
        internal
        pure
        returns (Index memory)
    {
        return Index({
            borrower: Accrued({ value: BASE }),
            lender: Accrued({ value: BASE })
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
        Accrued memory a,
        Rate memory r
    )
        private
        pure
        returns (Accrued memory result)
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
        Accrued memory a,
        Accrued memory b
    )
        private
        pure
        returns (Accrued memory result)
    {
        result.value = (uint256(a.value) * uint256(b.value) / BASE).to128();
    }

    // ============ Private Functions ============

    function _getAccruedInterest(
        Rate memory rate,
        LTime.Time memory timeDelta
    )
        private
        pure
        returns (Accrued memory result)
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
