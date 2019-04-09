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
import { ICallee } from "../../protocol/interfaces/ICallee.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title Expiry
 * @author dYdX
 *
 * Sets the negative balance for an account to expire at a certain time. This allows any other
 * account to repay that negative balance after expiry using any positive balance in the same
 * account. The arbitrage incentive is the same as liquidation in the base protocol.
 */
contract Expiry is
    OnlySolo,
    ICallee,
    IAutoTrader
{
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "Expiry";

    // ============ Events ============

    event ExpirySet(
        address owner,
        uint256 number,
        uint256 marketId,
        uint32 time
    );

    // ============ Storage ============

    // owner => number => market => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // time over which the liquidation ratio goes from zero to maximum
    uint256 public EXPIRY_RAMP_TIME;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 expiryRampTime
    )
        public
        OnlySolo(soloMargin)
    {
        EXPIRY_RAMP_TIME = expiryRampTime;
    }

    // ============ Public Functions ============

    function getExpiry(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (uint32)
    {
        return g_expiries[account.owner][account.number][marketId];
    }

    function callFunction(
        address /* sender */,
        Account.Info memory account,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {
        (
            uint256 marketId,
            uint32 expiryTime
        ) = parseCallArgs(data);

        // don't set expiry time for accounts with positive balance
        if (expiryTime != 0 && !SOLO_MARGIN.getAccountPar(account, marketId).isNegative()) {
            return;
        }

        setExpiry(account, marketId, expiryTime);
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory /* takerAccount */,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        // view
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {
        Types.AssetAmount memory result = getTradeCostInternal(
            inputMarketId,
            outputMarketId,
            makerAccount,
            oldInputPar,
            newInputPar,
            inputWei
        );

        // clear expiry if loan is fully repaid
        if (newInputPar.isZero()) {
            setExpiry(makerAccount, inputMarketId, 0);
        }

        return result;
    }

    function getSpreadAdjustedPrices(
        Account.Info memory account,
        uint256 inputMarketId,
        uint256 outputMarketId
    )
        public
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {
        Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(
            outputMarketId,
            inputMarketId
        );

        // adjust liquidationSpread for recently expired positions
        uint256 expiryAge = getExpiryAge(account, inputMarketId);
        if (expiryAge < EXPIRY_RAMP_TIME) {
            spread.value = Math.getPartial(spread.value, expiryAge, EXPIRY_RAMP_TIME);
        }

        Monetary.Price memory inputPrice = SOLO_MARGIN.getMarketPrice(inputMarketId);
        Monetary.Price memory outputPrice = SOLO_MARGIN.getMarketPrice(outputMarketId);
        inputPrice.value = inputPrice.value.add(Decimal.mul(inputPrice.value, spread));

        return (inputPrice, outputPrice);
    }

    // ============ Private Functions ============

    function getTradeCostInternal(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei
    )
        private
        view
        returns (Types.AssetAmount memory)
    {
        // input validation
        Require.that(
            oldInputPar.isNegative(),
            FILE,
            "Balance must be negative"
        );
        Require.that(
            !newInputPar.isPositive(),
            FILE,
            "Loans cannot be overpaid"
        );
        Require.that(
            inputWei.isPositive(),
            FILE,
            "Loans must be decreased"
        );

        // get maximum acceptable return value
        Types.Wei memory maxOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);
        Require.that(
            maxOutputWei.isPositive(),
            FILE,
            "Collateral must be positive"
        );

        // get return value
        Types.AssetAmount memory output = inputWeiToOutput(
            makerAccount,
            inputWei,
            inputMarketId,
            outputMarketId
        );
        Require.that(
            output.value <= maxOutputWei.value,
            FILE,
            "Collateral cannot be overtaken"
        );

        return output;
    }

    function setExpiry(
        Account.Info memory account,
        uint256 marketId,
        uint32 time
    )
        private
    {
        g_expiries[account.owner][account.number][marketId] = time;

        emit ExpirySet(
            account.owner,
            account.number,
            marketId,
            time
        );
    }

    function inputWeiToOutput(
        Account.Info memory account,
        Types.Wei memory inputWei,
        uint256 inputMarketId,
        uint256 outputMarketId
    )
        private
        view
        returns (Types.AssetAmount memory)
    {
        (
            Monetary.Price memory inputPrice,
            Monetary.Price memory outputPrice
        ) = getSpreadAdjustedPrices(account, inputMarketId, outputMarketId);

        uint256 nonSpreadValue = Math.getPartial(
            inputWei.value,
            inputPrice.value,
            outputPrice.value
        );
        return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: nonSpreadValue
        });
    }

    function getExpiryAge(
        Account.Info memory account,
        uint256 marketId
    )
        private
        view
        returns (uint256)
    {
        uint32 expiry = getExpiry(account, marketId);

        Require.that(
            expiry != 0,
            FILE,
            "Expiry not set"
        );

        Require.that(
            expiry <= Time.currentTime(),
            FILE,
            "Loan not yet expired"
        );

        return Time.currentTime().sub(expiry);
    }

    function parseCallArgs(
        bytes memory data
    )
        private
        pure
        returns (
            uint256,
            uint32
        )
    {
        Require.that(
            data.length == 64,
            FILE,
            "Call data invalid length"
        );

        uint256 marketId;
        uint256 rawExpiry;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            marketId := mload(add(data, 32))
            rawExpiry := mload(add(data, 64))
        }

        return (
            marketId,
            Math.to32(rawExpiry)
        );
    }
}
