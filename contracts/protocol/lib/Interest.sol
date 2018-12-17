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

import { Decimal } from "./Decimal.sol";
import { Math } from "./Math.sol";
import { Time } from "./Time.sol";
import { Types } from "./Types.sol";
import { SafeMath } from "../../tempzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Interest
 * @author dYdX
 *
 * TODO
 */
library Interest {
    using Math for uint256;
    using SafeMath for uint256;
    using SafeMath for uint96;
    using SafeMath for uint32;

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
        Decimal.Decimal memory earningsTax
    )
        internal
        view
        returns (Index memory)
    {
        uint32 timeDelta = Time.currentTime().sub(index.lastUpdate).to32();
        uint96 borrowInterest = _getCompoundedInterest(rate, timeDelta);

        uint256 supplyInterestRaw = Math.getPartial(
            borrowInterest.sub(BASE),
            totalNominal.borrow,
            totalNominal.supply
        );
        Decimal.Decimal memory earningsRate = Decimal.sub(Decimal.one(), earningsTax);
        uint96 supplyInterest = Decimal.mul(earningsRate, supplyInterestRaw).add(BASE).to96();

        return Index({
            borrow: Math.getPartial(index.borrow, borrowInterest, BASE).to96(),
            supply: Math.getPartial(index.supply, supplyInterest, BASE).to96(),
            lastUpdate: Time.currentTime()
        });
    }

    function parToWei(
        Types.Par memory input,
        Index memory index
    )
        internal
        pure
        returns (Types.Wei memory)
    {
        Types.Wei memory result;
        result.sign = input.sign;
        result.value = Math.getPartial(
            input.value,
            result.sign ? index.supply : index.borrow,
            BASE
        );
        return result;
    }

    function weiToPar(
        Types.Wei memory input,
        Index memory index
    )
        internal
        pure
        returns (Types.Par memory)
    {
        Types.Par memory result;
        result.sign = input.sign;
        result.value = Math.getPartial(
            input.value,
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
            lastUpdate: Time.currentTime()
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
                result = Math.getPartial(result, localRate.value, BASE).to96();
            }

            localTime = localTime >> 1;
            localRate.value = Math.getPartial(localRate.value, localRate.value, BASE).to128();
        }

        return result;
    }
}
