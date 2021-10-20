/*

    Copyright 2019 dYdX Trading Inc.

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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title FinalSettlement
 * @author dYdX
 *
 * FinalSettlement contract that allows closing of all positions on Solo.
 */
contract FinalSettlement is
    OnlySolo,
    IAutoTrader
{
    using Math for uint256;
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "FinalSettlement";

    // ============ Events ============

    event Initialized(
        uint32 time
    );

    event Settlement(
        address indexed makerAddress,
        address indexed takerAddress,
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint256 heldWei,
        uint256 owedWei
    );

    // ============ Storage ============

    // Time over which the liquidation spread goes from zero to maximum.
    uint256 public g_spreadRampTime;

    // Time at which the contract was initialized. Zero if uninitialized.
    uint32 public g_startTime = 0;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 rampTime
    )
        public
        OnlySolo(soloMargin)
    {
        g_spreadRampTime = rampTime;
    }

    // ============ External Functions ============

    function initialize()
        external
    {
        Require.that(
            g_startTime == 0,
            FILE,
            "Already initialized"
        );
        Require.that(
            SOLO_MARGIN.getIsGlobalOperator(address(this)),
            FILE,
            "Not a global operator"
        );

        g_startTime = Time.currentTime();

        emit Initialized(
            g_startTime
        );
    }

    // ============ Getters ============

    function getSpreadAdjustedPrices(
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 timestamp
    )
        public
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {
        // Require timestamp to be at-or-after initialization
        Require.that(
            g_startTime != 0,
            FILE,
            "Not initialized"
        );

        // Get the amount of time passed since deployment, bounded by the maximum ramp time.
        uint256 rampedTime = Math.min(
            timestamp.sub(g_startTime),
            g_spreadRampTime
        );

        // Get the liquidation spread prorated by the ramp time.
        Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );
        spread.value = Math.getPartial(spread.value, rampedTime, g_spreadRampTime);

        Monetary.Price memory heldPrice = SOLO_MARGIN.getMarketPrice(heldMarketId);
        Monetary.Price memory owedPrice = SOLO_MARGIN.getMarketPrice(owedMarketId);
        owedPrice.value = owedPrice.value.add(Decimal.mul(owedPrice.value, spread));

        return (heldPrice, owedPrice);
    }

    // ============ Only-Solo Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {
        // require contract to be initialized
        Require.that(
            g_startTime != 0,
            FILE,
            "Contract must be initialized"
        );

        // return zero if input amount is zero
        if (inputWei.isZero()) {
            return Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: 0
            });
        }

        (uint256 owedMarketId) = abi.decode(data, (uint256));

        Types.AssetAmount memory result = getTradeCostInternal(
            inputMarketId,
            outputMarketId,
            makerAccount,
            oldInputPar,
            newInputPar,
            inputWei,
            owedMarketId
        );

        uint256 heldMarketId = (owedMarketId == inputMarketId)
            ? outputMarketId
            : inputMarketId;
        uint256 heldWei = (owedMarketId == inputMarketId)
            ? result.value
            : inputWei.value;
        uint256 owedWei = (owedMarketId == inputMarketId)
            ? inputWei.value
            : result.value;
        emit Settlement(
            makerAccount.owner,
            takerAccount.owner,
            heldMarketId,
            owedMarketId,
            heldWei,
            owedWei
        );

        return result;
    }

    // ============ Helper Functions ============

    function getTradeCostInternal(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        uint256 owedMarketId
    )
        private
        view
        returns (Types.AssetAmount memory)
    {
        Types.AssetAmount memory output;
        Types.Wei memory maxOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);

        if (inputWei.isPositive()) {
            Require.that(
                inputMarketId == owedMarketId,
                FILE,
                "inputMarket mismatch",
                inputMarketId
            );
            Require.that(
                !newInputPar.isPositive(),
                FILE,
                "Borrows cannot be overpaid",
                newInputPar.value
            );
            assert(oldInputPar.isNegative());
            Require.that(
                maxOutputWei.isPositive(),
                FILE,
                "Collateral must be positive",
                outputMarketId,
                maxOutputWei.value
            );
            output = owedWeiToHeldWei(
                inputWei,
                outputMarketId,
                inputMarketId
            );
        } else {
            Require.that(
                outputMarketId == owedMarketId,
                FILE,
                "outputMarket mismatch",
                outputMarketId
            );
            Require.that(
                !newInputPar.isNegative(),
                FILE,
                "Collateral cannot be overused",
                newInputPar.value
            );
            assert(oldInputPar.isPositive());
            Require.that(
                maxOutputWei.isNegative(),
                FILE,
                "Borrows must be negative",
                outputMarketId,
                maxOutputWei.value
            );
            output = heldWeiToOwedWei(
                inputWei,
                inputMarketId,
                outputMarketId
            );
        }

        Require.that(
            output.value <= maxOutputWei.value,
            FILE,
            "outputMarket too small",
            output.value,
            maxOutputWei.value
        );
        assert(output.sign != maxOutputWei.sign);

        return output;
    }

    function heldWeiToOwedWei(
        Types.Wei memory heldWei,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        private
        view
        returns (Types.AssetAmount memory)
    {
        (
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            Time.currentTime()
        );

        uint256 owedAmount = Math.getPartialRoundUp(
            heldWei.value,
            heldPrice.value,
            owedPrice.value
        );

        return Types.AssetAmount({
            sign: true,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: owedAmount
        });
    }

    function owedWeiToHeldWei(
        Types.Wei memory owedWei,
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        private
        view
        returns (Types.AssetAmount memory)
    {
        (
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            Time.currentTime()
        );

        uint256 heldAmount = Math.getPartial(
            owedWei.value,
            owedPrice.value,
            heldPrice.value
        );

        return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: heldAmount
        });
    }
}
