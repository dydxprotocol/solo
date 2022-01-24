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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { ICallee } from "../../protocol/interfaces/ICallee.sol";
import { IDolomiteMargin } from "../../protocol/interfaces/IDolomiteMargin.sol";
import { ILiquidationCallback } from "../../protocol/interfaces/ILiquidationCallback.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlyDolomiteMargin } from "../helpers/OnlyDolomiteMargin.sol";
import { IExpiry } from "../interfaces/IExpiry.sol";


/**
 * @title Expiry
 * @author dYdX
 *
 * Expiry contract that also allows approved senders to set expiry to be 28 days in the future.
 */
contract Expiry is
    Ownable,
    OnlyDolomiteMargin,
    IExpiry,
    ICallee,
    IAutoTrader
{
    using Address for address;
    using Math for uint256;
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

    event LogExpiryRampTimeSet(
        uint256 expiryRampTime
    );

    event LogSenderApproved(
        address approver,
        address sender,
        uint32 minTimeDelta
    );

    event LogLiquidationCallbackSuccess(address indexed liquidAccountOwner, uint liquidAccountNumber);

    event LogLiquidationCallbackFailure(address indexed liquidAccountOwner, uint liquidAccountNumber, string reason);

    // ============ Storage ============

    // owner => number => market => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // owner => sender => minimum time delta
    mapping (address => mapping (address => uint32)) public g_approvedSender;

    // time over which the liquidation ratio goes from zero to maximum
    uint256 public g_expiryRampTime;

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        uint256 expiryRampTime
    )
        public
        OnlyDolomiteMargin(dolomiteMargin)
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
        _setApproval(msg.sender, sender, minTimeDelta);
    }

    // ============ Only-DolomiteMargin Functions ============

    function callFunction(
        address /* sender */,
        Account.Info memory account,
        bytes memory data
    )
        public
        onlyDolomiteMargin(msg.sender)
    {
        CallFunctionType callType = abi.decode(data, (CallFunctionType));
        if (callType == CallFunctionType.SetExpiry) {
            _callFunctionSetExpiry(account.owner, data);
        } else {
            _callFunctionSetApproval(account.owner, data);
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
        onlyDolomiteMargin(msg.sender)
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

        return _getTradeCostInternal(
            DOLOMITE_MARGIN,
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
        return _getSpreadAdjustedPrices(
            DOLOMITE_MARGIN,
            heldMarketId,
            owedMarketId,
            expiry
        );
    }

    // ============ Private Functions ============

    function _getSpreadAdjustedPrices(
        IDolomiteMargin dolomiteMargin,
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
    )
        private
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {
        Decimal.D256 memory spread = dolomiteMargin.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

        uint256 expiryAge = Time.currentTime().sub(expiry);

        if (expiryAge < g_expiryRampTime) {
            spread.value = Math.getPartial(spread.value, expiryAge, g_expiryRampTime);
        }

        Monetary.Price memory heldPrice = dolomiteMargin.getMarketPrice(heldMarketId);
        Monetary.Price memory owedPrice = dolomiteMargin.getMarketPrice(owedMarketId);
        owedPrice.value = owedPrice.value.add(Decimal.mul(owedPrice.value, spread));

        return (heldPrice, owedPrice);
    }

    function _callFunctionSetExpiry(
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
                DOLOMITE_MARGIN.getAccountPar(exp.account, exp.marketId).isNegative()
            ) {
                // only change non-zero values if forceUpdate is true
                if (exp.forceUpdate || getExpiry(exp.account, exp.marketId) == 0) {
                    uint32 newExpiryTime = Time.currentTime().add(exp.timeDelta).to32();
                    _setExpiry(exp.account, exp.marketId, newExpiryTime);
                }
            } else {
                // timeDelta is zero or account has non-negative balance
                _setExpiry(exp.account, exp.marketId, 0);
            }
        }
    }

    function _callFunctionSetApproval(
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
        _setApproval(sender, approvalArg.sender, approvalArg.minTimeDelta);
    }

    function _getTradeCostInternal(
        IDolomiteMargin dolomiteMargin,
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
        Types.Wei memory maxOutputWei = dolomiteMargin.getAccountWei(makerAccount, outputMarketId);

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
            output = _owedWeiToHeldWei(
                dolomiteMargin,
                inputWei,
                outputMarketId,
                inputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
            if (newInputPar.isZero()) {
                _setExpiry(makerAccount, owedMarketId, 0);
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
            output = _heldWeiToOwedWei(
                dolomiteMargin,
                inputWei,
                inputMarketId,
                outputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
            if (output.value == maxOutputWei.value) {
                _setExpiry(makerAccount, owedMarketId, 0);
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

        _callLiquidateCallbackIfNecessary(
            makerAccount,
            owedMarketId == inputMarketId ? outputMarketId : inputMarketId,
            owedMarketId == inputMarketId ? Types.Wei(output.sign, output.value) : inputWei,
            owedMarketId,
            owedMarketId == inputMarketId ? inputWei : Types.Wei(output.sign, output.value)
        );

        return output;
    }

    function _setExpiry(
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

    function _setApproval(
        address approver,
        address sender,
        uint32 minTimeDelta
    )
        private
    {
        g_approvedSender[approver][sender] = minTimeDelta;
        emit LogSenderApproved(approver, sender, minTimeDelta);
    }

    function _heldWeiToOwedWei(
        IDolomiteMargin dolomiteMargin,
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
        ) = _getSpreadAdjustedPrices(
            dolomiteMargin,
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

    function _owedWeiToHeldWei(
        IDolomiteMargin dolomiteMargin,
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
        ) = _getSpreadAdjustedPrices(
            dolomiteMargin,
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

    function _callLiquidateCallbackIfNecessary(
        Account.Info memory liquidAccount,
        uint heldMarket,
        Types.Wei memory heldDeltaWei,
        uint owedMarket,
        Types.Wei memory owedDeltaWei
    ) private {
        if (liquidAccount.owner.isContract()) {
            // solium-disable-next-line security/no-low-level-calls
            (bool isCallSuccessful, bytes memory result) = liquidAccount.owner.call(
                abi.encodeWithSelector(
                    ILiquidationCallback(liquidAccount.owner).onLiquidate.selector,
                    liquidAccount.number,
                    heldMarket,
                    heldDeltaWei,
                    owedMarket,
                    owedDeltaWei
                )
            );

            if (isCallSuccessful) {
                emit LogLiquidationCallbackSuccess(liquidAccount.owner, liquidAccount.number);
            } else {
                if (result.length < 68) {
                    result = bytes("");
                } else {
                    // solium-disable-next-line security/no-inline-assembly
                    assembly {
                        result := add(result, 0x04)
                    }
                    result = bytes(abi.decode(result, (string)));
                }
                emit LogLiquidationCallbackFailure(
                    liquidAccount.owner,
                    liquidAccount.number,
                    string(result)
                );
            }
        }
    }
}
