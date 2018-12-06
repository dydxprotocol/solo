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

    uint64 constant public BASE = 10**18;

    struct Index {
        LDecimal.D128 accrued; // current interest of the token. starts at BASE and is monotonically increasing
        LTime.Time time; // last updated timestamp of the index
        LDecimal.D64 rate; // current interest rate per second (times BASE)
    }

    // ============ Public Functions ============

    function getUpdatedIndex(
        Index memory index
    )
        internal
        view
        returns (Index memory)
    {
        LTime.Time memory currentTime = LTime.currentTime();
        LDecimal.D128 memory accrued = _getAccrued(
            index.accrued,
            index.rate,
            currentTime.sub(index.time)
        );
        return Index({
            accrued: accrued,
            time: currentTime,
            rate: index.rate
        });
    }

    function principalToActual(
        LTypes.Principal memory principal,
        LDecimal.D128 memory interest
    )
        internal
        pure
        returns (LTypes.TokenAmount memory)
    {
        return LTypes.TokenAmount({ value: principal.value.mul(interest.value).div(BASE) });
    }

    function actualToPrincipal(
        LTypes.TokenAmount memory tokenAmount,
        LDecimal.D128 memory interest
    )
        internal
        pure
        returns (LTypes.Principal memory)
    {
        return LTypes.Principal({ value: tokenAmount.value.mul(BASE).div(interest.value).to128() });
    }

    function newIndex()
        internal
        view
        returns (Index memory)
    {
        return Index({
            accrued: LDecimal.one128(),
            time: LTime.currentTime(),
            rate: LDecimal.zero64()
        });
    }

    // ============ Private Functions ============

    function _getAccrued(
        LDecimal.D128 memory accrued,
        LDecimal.D64 memory rate,
        LTime.Time memory timeDelta
    )
        internal
        pure
        returns (LDecimal.D128 memory)
    {
        // aggregate is the result of the caulculation
        uint128 aggregate = BASE;

        // localRate is rate^(2^rounds)
        uint128 localRate = uint128(rate.value);
        uint256 localTime = uint256(timeDelta.value);

        while (localTime != 0) {

            if (localTime & 1 != 0) {
                aggregate = _multiply(aggregate, localRate);
            }

            localTime = localTime >> 1;
            localRate = _multiply(localRate, localRate);
        }

        return LDecimal.D128({ value: _multiply(accrued.value, aggregate) });
    }

    function _multiply(
        uint128 x,
        uint128 y
    )
        private
        pure
        returns (uint128)
    {
        uint256 val = uint256(x) * uint256(y) / BASE;
        assert(uint256(uint128(val)) == val);
        return uint128(val);
    }
}
