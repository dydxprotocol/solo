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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Decimal } from "./Decimal.sol";
import { Math } from "./Math.sol";
import { Require } from "./Require.sol";
import { Time } from "./Time.sol";
import { Types } from "./Types.sol";


/**
 * @title Interest
 * @author dYdX
 *
 * TODO
 */
library Interest {
    using Math for uint256;
    using SafeMath for uint256;

    // ============ Constants ============

    string constant FILE = "Interest";
    uint64 constant BASE = 10**18;
    uint64 constant MAX_INTEREST_RATE = BASE / (60 * 60 * 24 * 365); // Max 100% per year

    // ============ Structs ============

    struct Rate {
        uint256 value;
    }

    struct Index {
        uint96 borrow;
        uint96 supply;
        uint32 lastUpdate;
    }

    // ============ Library Functions ============

    function calculateNewIndex(
        Index memory index,
        Rate memory rate,
        Types.TotalPar memory totalPar,
        Decimal.D256 memory earningsRate
    )
        internal
        view
        returns (Index memory)
    {
        Require.that(
            isValidRate(rate),
            FILE,
            "Invalid rate",
            rate.value
        );

        (
            Types.Wei memory borrowWei,
            Types.Wei memory supplyWei
        ) = totalParToWei(totalPar, index);
        uint32 timeDelta = uint256(Time.currentTime()).sub(index.lastUpdate).to32();

        // calculate the interest accrued by
        uint96 borrowInterest = rate.value.mul(timeDelta).to96();

        // adjust the interest by the earningsRate, then prorate the interest across all suppliers
        uint96 supplyInterest;
        if (Types.isZero(supplyWei)) {
            supplyInterest = 0;
        } else {
            supplyInterest = Math.getPartial(
                Decimal.mul(borrowInterest, earningsRate),
                borrowWei.value,
                supplyWei.value
            ).to96();
        }

        return Index({
            borrow: Math.getPartial(index.borrow, borrowInterest, BASE).add(index.borrow).to96(),
            supply: Math.getPartial(index.supply, supplyInterest, BASE).add(index.supply).to96(),
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
        return rate.value <= MAX_INTEREST_RATE;
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

    function totalParToWei(
        Types.TotalPar memory totalPar,
        Index memory index
    )
        internal
        pure
        returns (Types.Wei memory, Types.Wei memory)
    {
        Types.Par memory borrowPar = Types.Par({
            sign: false,
            value: totalPar.borrow
        });
        Types.Par memory supplyPar = Types.Par({
            sign: true,
            value: totalPar.supply
        });
        Types.Wei memory borrowWei = parToWei(borrowPar, index);
        Types.Wei memory supplyWei = parToWei(supplyPar, index);
        return (borrowWei, supplyWei);
    }
}
