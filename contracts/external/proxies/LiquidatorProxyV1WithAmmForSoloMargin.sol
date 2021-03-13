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

import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import {ReentrancyGuard} from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import {SoloMargin} from "../../protocol/SoloMargin.sol";
import {Account} from "../../protocol/lib/Account.sol";
import {Actions} from "../../protocol/lib/Actions.sol";
import {Decimal} from "../../protocol/lib/Decimal.sol";
import {Interest} from "../../protocol/lib/Interest.sol";
import {Math} from "../../protocol/lib/Math.sol";
import {Monetary} from "../../protocol/lib/Monetary.sol";
import {Require} from "../../protocol/lib/Require.sol";
import {Types} from "../../protocol/lib/Types.sol";
import {OnlySolo} from "../helpers/OnlySolo.sol";


/**
 * @title LiquidatorProxyV1WithAmmForSoloMargin
 * @author Dolomite
 *
 * Contract for liquidating other accounts in Solo and rebalances using Dolomite AMM.
 */
contract LiquidatorProxyV1WithAmmForSoloMargin {

    //            return LiquidateArgs({
    //            amount: args.amount,
    //            solidAccount: accounts[args.accountId],
    //            liquidAccount: accounts[args.otherAccountId],
    //            owedMarket: args.primaryMarketId,
    //            heldMarket: args.secondaryMarketId
    //        })

    function liquidate(
        Account.Info memory fromAccount,
        Account.Info memory liquidAccount,
        uint owedMarketId,
        uint heldMarketId
    ) external {

    }

    function _createActions() internal pure returns (Actions.ActionArgs memory)     {
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
        actionType : Actions.ActionType.Liquidate,
        accountId : 0,
        amount : Types.AssetAmount({
        sign : true,
        denomination : Types.AssetDenomination.Wei,
        ref : Types.AssetReference.Delta,
        value : cache.toLiquidate
        }),
        primaryMarketId : cache.owedMarket,
        secondaryMarketId : cache.heldMarket,
        otherAddress : address(0),
        otherAccountId : 1,
        data : new bytes(0)
        });
        return actions;
    }


}