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

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";


/**
 * @title DaiMigrator
 * @author dYdX
 *
 * Allows for moving SAI positions to DAI positions.
 */
contract DaiMigrator is
    Ownable,
    IAutoTrader
{
    using Types for Types.Wei;
    using Types for Types.Par;

    // ============ Constants ============

    bytes32 constant FILE = "DaiMigrator";

    uint256 constant SAI_MARKET = 1;

    uint256 constant DAI_MARKET = 3;

    // ============ Events ============

    event LogMigratorAdded(
        address migrator
    );

    event LogMigratorRemoved(
        address migrator
    );

    // ============ Storage ============

    // the addresses that are able to migrate positions
    mapping (address => bool) public g_migrators;

    // ============ Constructor ============

    constructor (
        address[] memory migrators
    )
        public
    {
        for (uint256 i = 0; i < migrators.length; i++) {
            g_migrators[migrators[i]] = true;
        }
    }

    // ============ Admin Functions ============

    function addMigrator(
        address migrator
    )
        external
        onlyOwner
    {
        emit LogMigratorAdded(migrator);
        g_migrators[migrator] = true;
    }

    function removeMigrator(
        address migrator
    )
        external
        onlyOwner
    {
        emit LogMigratorRemoved(migrator);
        g_migrators[migrator] = false;
    }

    // ============ Only-Solo Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory /* makerAccount */,
        Account.Info memory takerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        /* view */
        returns (Types.AssetAmount memory)
    {
        Require.that(
            g_migrators[takerAccount.owner],
            FILE,
            "Migrator not approved",
            takerAccount.owner
        );

        Require.that(
            inputMarketId == SAI_MARKET && outputMarketId == DAI_MARKET,
            FILE,
            "Invalid markets"
        );

        // require that SAI amount is getting smaller (closer to zero)
        if (oldInputPar.isPositive()) {
            Require.that(
                inputWei.isNegative(),
                FILE,
                "inputWei must be negative"
            );
            Require.that(
                !newInputPar.isNegative(),
                FILE,
                "newInputPar cannot be negative"
            );
        } else if (oldInputPar.isNegative()) {
            Require.that(
                inputWei.isPositive(),
                FILE,
                "inputWei must be positive"
            );
            Require.that(
                !newInputPar.isPositive(),
                FILE,
                "newInputPar cannot be positive"
            );
        } else {
            Require.that(
                inputWei.isZero() && newInputPar.isZero(),
                FILE,
                "inputWei must be zero"
            );
        }

        /* return the exact opposite amount of SAI in DAI */
        return Types.AssetAmount ({
            sign: !inputWei.sign,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: inputWei.value
        });
    }
}
