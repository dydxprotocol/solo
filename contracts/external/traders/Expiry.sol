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
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";
import { ICallee } from "../../protocol/interfaces/ICallee.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Acct } from "../../protocol/lib/Acct.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";


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
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Events ============

    event ExpirySet(
        address owner,
        uint256 number,
        uint256 marketId,
        uint32 time
    );

    // ============ Storage ============

    // owner => number => mkt => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
        public
        OnlySolo(soloMargin)
    {}

    // ============ Public Functions ============

    function callFunction(
        address /* sender */,
        Acct.Info memory account,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {
        (
            uint256 marketId,
            uint32 expiryTime
        ) = parseCallArgs(data);

        setExpiry(account, marketId, expiryTime);
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Acct.Info memory makerAccount,
        Acct.Info memory /* takerAccount */,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        // view
        returns (Types.Wei memory)
    {
        // input validation
        require(
            oldInputPar.isNegative(),
            "Expiry#getTradeCost: only negative balances can be expired"
        );
        require(
            newInputPar.isPositive(),
            "Expiry#getTradeCost: balances cannot be overpaid"
        );
        require(
            inputWei.isPositive(),
            "Expiry#getTradeCost: loans must be decreased"
        );

        // expiry time validation
        require(
            Time.hasHappened(getExpiry(makerAccount, inputMarketId)),
            "Expiry#getTradeCost: market not yet expired for account"
        );

        // clear expiry if loan is fully repaid
        if (newInputPar.value == 0) {
            setExpiry(makerAccount, inputMarketId, 0);
        }

        // get maximum acceptable return value
        Types.Wei memory maxOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);
        require(
            maxOutputWei.isPositive(),
            "Expiry#getTradeCost: only positive balances can be used as collateral"
        );

        // get return value
        Types.Wei memory outputWei = inputWeiToOutputWei(
            inputWei,
            inputMarketId,
            outputMarketId
        );
        require(
            outputWei.value <= maxOutputWei.value,
            "Expiry#getTradeCost: collateral balance cannot be made negative"
        );

        return outputWei;
    }

    // ============ Private Functions ============

    function getExpiry(
        Acct.Info memory account,
        uint256 marketId
    )
        private
        view
        returns (uint32)
    {
        return g_expiries[account.owner][account.number][marketId];
    }

    function setExpiry(
        Acct.Info memory account,
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

    function inputWeiToOutputWei(
        Types.Wei memory inputWei,
        uint256 inputMarketId,
        uint256 outputMarketId
    )
        private
        view
        returns (Types.Wei memory)
    {
        Decimal.D256 memory onePlusSpread = Decimal.add(
            Decimal.one(),
            SOLO_MARGIN.getLiquidationSpread()
        );
        uint256 nonSpreadValue = Math.getPartial(
            inputWei.value,
            SOLO_MARGIN.getMarketPrice(inputMarketId).value,
            SOLO_MARGIN.getMarketPrice(outputMarketId).value
        );
        return Types.Wei({
            sign: false,
            value: Decimal.mul(nonSpreadValue, onePlusSpread)
        });
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
        require(
            data.length == 64,
            "Expiry:#parseCallArgs: data is not the right length"
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
