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
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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
 * @title ExpiryV2
 * @author dYdX
 *
 * Expiry contract that also allows approved senders to set expiry to be 28 days in the future.
 */
contract ExpiryV2 is
    Ownable,
    OnlySolo,
    ICallee,
    IAutoTrader
{
    using Math for uint256;
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "ExpiryV2";

    // ============ Enums ============

    enum CallFunctionType {
        SetExpiry,
        SetApproval
    }

    // ============ Structs ============

    struct SetExpiryArg {
        Account.Info account;
        uint256 marketId;
        uint32 timeDelta;
        bool forceUpdate;
    }

    struct SetApprovalArg {
        address sender;
        uint32 minTimeDelta;
    }

    // ============ Events ============

    event ExpirySet(
        address owner,
        uint256 number,
        uint256 marketId,
        uint32 time
    );

    event LogExpiryRampTimeSet(
        uint256 expiryRampTime
    );

    event LogSenderApproved(
        address approver,
        address sender,
        uint32 minTimeDelta
    );

    // ============ Storage ============

    // owner => number => market => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // owner => sender => minimum time delta
    mapping (address => mapping (address => uint32)) public g_approvedSender;

    // time over which the liquidation ratio goes from zero to maximum
    uint256 public g_expiryRampTime;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 expiryRampTime
    )
        public
        OnlySolo(soloMargin)
    {
        g_expiryRampTime = expiryRampTime;
    }

    // ============ Admin Functions ============

    function ownerSetExpiryRampTime(
        uint256 newExpiryRampTime
    )
        external
        onlyOwner
    {
        emit LogExpiryRampTimeSet(newExpiryRampTime);
        g_expiryRampTime = newExpiryRampTime;
    }

    // ============ Approval Functions ============

    function approveSender(
        address sender,
        uint32 minTimeDelta
    )
        external
    {
        setApproval(msg.sender, sender, minTimeDelta);
    }

    // ============ Only-Solo Functions ============

    function callFunction(
        address /* sender */,
        Account.Info memory account,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {
        CallFunctionType callType = abi.decode(data, (CallFunctionType));
        if (callType == CallFunctionType.SetExpiry) {
            callFunctionSetExpiry(account.owner, data);
        } else {
            callFunctionSetApproval(account.owner, data);
        }
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory /* takerAccount */,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {
        // return zero if input amount is zero
        if (inputWei.isZero()) {
            return Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: 0
            });
        }

        (uint256 owedMarketId, uint32 maxExpiry) = abi.decode(data, (uint256, uint32));

        uint32 expiry = getExpiry(makerAccount, owedMarketId);

        // validate expiry
        Require.that(
            expiry != 0,
            FILE,
            "Expiry not set",
            makerAccount.owner,
            makerAccount.number,
            owedMarketId
        );
        Require.that(
            expiry <= Time.currentTime(),
            FILE,
            "Borrow not yet expired",
            expiry
        );
        Require.that(
            expiry <= maxExpiry,
            FILE,
            "Expiry past maxExpiry",
            expiry
        );

        return getTradeCostInternal(
            inputMarketId,
            outputMarketId,
            makerAccount,
            oldInputPar,
            newInputPar,
            inputWei,
            owedMarketId,
            expiry
        );
    }

    // ============ Getters ============

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

    function getSpreadAdjustedPrices(
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
    )
        public
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {
        Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

        uint256 expiryAge = Time.currentTime().sub(expiry);

        if (expiryAge < g_expiryRampTime) {
            spread.value = Math.getPartial(spread.value, expiryAge, g_expiryRampTime);
        }

        Monetary.Price memory heldPrice = SOLO_MARGIN.getMarketPrice(heldMarketId);
        Monetary.Price memory owedPrice = SOLO_MARGIN.getMarketPrice(owedMarketId);
        owedPrice.value = owedPrice.value.add(Decimal.mul(owedPrice.value, spread));

        return (heldPrice, owedPrice);
    }

    // ============ Private Functions ============

    function callFunctionSetExpiry(
        address sender,
        bytes memory data
    )
        private
    {
        (
            CallFunctionType callType,
            SetExpiryArg[] memory expiries
        ) = abi.decode(data, (CallFunctionType, SetExpiryArg[]));

        assert(callType == CallFunctionType.SetExpiry);

        for (uint256 i = 0; i < expiries.length; i++) {
            SetExpiryArg memory exp = expiries[i];
            if (exp.account.owner != sender) {
                // don't do anything if sender is not approved for this action
                uint32 minApprovedTimeDelta = g_approvedSender[exp.account.owner][sender];
                if (minApprovedTimeDelta == 0 || exp.timeDelta < minApprovedTimeDelta) {
                    continue;
                }
            }

            // if timeDelta is zero, interpret it as unset expiry
            if (
                exp.timeDelta != 0 &&
                SOLO_MARGIN.getAccountPar(exp.account, exp.marketId).isNegative()
            ) {
                // only change non-zero values if forceUpdate is true
                if (exp.forceUpdate || getExpiry(exp.account, exp.marketId) == 0) {
                    uint32 newExpiryTime = Time.currentTime().add(exp.timeDelta).to32();
                    setExpiry(exp.account, exp.marketId, newExpiryTime);
                }
            } else {
                // timeDelta is zero or account has non-negative balance
                setExpiry(exp.account, exp.marketId, 0);
            }
        }
    }

    function callFunctionSetApproval(
        address sender,
        bytes memory data
    )
        private
    {
        (
            CallFunctionType callType,
            SetApprovalArg memory approvalArg
        ) = abi.decode(data, (CallFunctionType, SetApprovalArg));
        assert(callType == CallFunctionType.SetApproval);
        setApproval(sender, approvalArg.sender, approvalArg.minTimeDelta);
    }

    function getTradeCostInternal(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        uint256 owedMarketId,
        uint32 expiry
    )
        private
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
                inputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
            if (newInputPar.isZero()) {
                setExpiry(makerAccount, owedMarketId, 0);
            }
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
                outputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
            if (output.value == maxOutputWei.value) {
                setExpiry(makerAccount, owedMarketId, 0);
            }
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

    function setApproval(
        address approver,
        address sender,
        uint32 minTimeDelta
    )
        private
    {
        g_approvedSender[approver][sender] = minTimeDelta;
        emit LogSenderApproved(approver, sender, minTimeDelta);
    }

    function heldWeiToOwedWei(
        Types.Wei memory heldWei,
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
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
            expiry
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
        uint256 owedMarketId,
        uint32 expiry
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
            expiry
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
