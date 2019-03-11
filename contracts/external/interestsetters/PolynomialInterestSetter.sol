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

pragma solidity 0.5.5;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { IInterestSetter } from "../../protocol/interfaces/IInterestSetter.sol";
import { Interest } from "../../protocol/lib/Interest.sol";
import { Math } from "../../protocol/lib/Math.sol";


/**
 * @title PolynomialInterestSetter
 * @author dYdX
 *
 * Interest setter that sets interest based on a polynomial of the usage percentage of the market.
 */
contract PolynomialInterestSetter is
    IInterestSetter
{
    using Math for uint256;
    using SafeMath for uint256;

    // ============ Constants ============

    uint256 constant PERCENT = 100;

    uint256 constant BASE = 10 ** 18;

    uint256 constant SECONDS_IN_A_YEAR = 60 * 60 * 24 * 365;

    uint256 constant BYTE = 8;

    // ============ Structs ============

    struct PolyStorage {
        uint128 maxAPR;
        uint128 coefficients;
    }

    // ============ Storage ============

    PolyStorage state;

    // ============ Constructor ============

    constructor(
        PolyStorage memory params
    )
        public
    {
        // verify that all coefficients add up to 100%
        uint256 sumOfCoefficients = 0;
        for (uint256 coefficients = params.coefficients; coefficients != 0; coefficients >>= BYTE) {
            sumOfCoefficients += coefficients % 256;
        }
        require(
            sumOfCoefficients == PERCENT,
            "Coefficients must sum to 100"
        );

        // store the params
        state = params;
    }

    // ============ Public Functions ============

    /**
     * Get the interest rate given some borrowed and supplied amounts. The interest function is a
     * polynomial function of the utilization (borrowWei / supplyWei) of the market.
     *
     *   - If borrowWei > supplyWei then the utilization is considered to be equal to 1.
     *   - If both are zero, then the utilization is considered to be equal to 0.
     *
     * @return The interest rate per second (times 10 ** 18)
     */
    function getInterestRate(
        address /* token */,
        uint256 borrowWei,
        uint256 supplyWei
    )
        external
        view
        returns (Interest.Rate memory)
    {
        if (borrowWei == 0) {
            return Interest.Rate({
                value: 0
            });
        }

        PolyStorage memory s = state;
        uint256 maxAPR = s.maxAPR;

        if (borrowWei >= supplyWei) {
            return Interest.Rate({
                value: maxAPR / SECONDS_IN_A_YEAR
            });
        }

        uint256 result = 0;
        uint256 polynomial = BASE;

        // for each non-zero coefficient...
        for (uint256 coefficients = s.coefficients; coefficients != 0; coefficients >>= BYTE) {
            // gets the lowest-order byte
            uint256 coefficient = coefficients % 256;

            // increase the order of the polynomial term
            // no safeDiv since supplyWei must be stricly larger than borrowWei
            polynomial = polynomial.mul(borrowWei) / supplyWei;

            // if non-zero, add to result
            if (coefficient != 0) {
                // no safeAdd since there are at most 16 coefficients
                // no safeMul since (coefficient < 256 && polynomial < 10**18)
                result += coefficient * polynomial;
            }
        }

        // normalize the result
        // no safeMul since result fits within 72 bits and maxAPR fits within 128 bits
        // no safeDiv since the divisor is a non-zero constant
        return Interest.Rate({
            value: result * maxAPR / (SECONDS_IN_A_YEAR * BASE * PERCENT)
        });
    }

    /**
     * Returns the maximum APR that this interestSetter will return. The actual APY may be higher
     * depending on how often the interest is compounded.
     *
     * @return The maximum APR
     */
    function getMaxAPR()
        external
        view
        returns (uint256)
    {
        return state.maxAPR;
    }

    /**
     * Returns all of the coefficients of the interest calculation, starting from the coefficent for
     * the first-order utilization variable.
     *
     * @return The coefficents
     */
    function getCoefficients()
        external
        view
        returns (uint256[] memory)
    {
        // allocate new array with maximum of 16 coefficients
        uint256[] memory result = new uint256[](16);

        // add the coefficents to the array
        uint256 numCoefficients = 0;
        for (uint256 coefficients = state.coefficients; coefficients != 0; coefficients >>= BYTE) {
            result[numCoefficients] = coefficients % 256;
            numCoefficients++;
        }

        // modify result.length to match numCoefficients
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            mstore(result, numCoefficients)
        }

        return result;
    }
}
