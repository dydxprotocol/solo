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

import { Manager } from "./Manager.sol";
import { Acct } from "../lib/Acct.sol";
import { Actions } from "../lib/Actions.sol";
import { Types } from "../lib/Types.sol";


/**
 * @title Events
 * @author dYdX
 *
 * TODO
 */
contract Events is
    Manager
{
    // ============ Events ============

    event LogTransaction(
        address sender
    );

    event LogDeposit(
        address indexed owner,
        uint256 number,
        uint256 mkt,
        BalanceUpdate update
    );

    event LogWithdraw(
        address indexed owner,
        uint256 number,
        uint256 mkt,
        BalanceUpdate update
    );

    event LogTransfer(
        address indexed ownerOne,
        uint256 numberOne,
        address indexed ownerTwo,
        uint256 numberTwo,
        uint256 mkt,
        BalanceUpdate updateOne,
        BalanceUpdate updateTwo
    );

    event LogBuy(
        address indexed owner,
        uint256 number,
        uint256 takerMkt,
        uint256 makerMkt,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogSell(
        address indexed owner,
        uint256 number,
        uint256 takerMkt,
        uint256 makerMkt,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogTrade(
        address indexed takerOwner,
        uint256 takerNumber,
        address indexed traderOwner,
        uint256 traderNumber,
        uint256 inputMkt,
        uint256 outputMkt,
        BalanceUpdate takerInputUpdate,
        BalanceUpdate takerOutputUpdate,
        BalanceUpdate traderInputUpdate,
        BalanceUpdate traderOutputUpdate,
        address autoTrader
    );

    event LogCall(
        address indexed owner,
        uint256 number,
        address callee
    );

    event LogLiquidate(
        address indexed solidOwner,
        uint256 solidNumber,
        address indexed liquidOwner,
        uint256 liquidNumber,
        uint256 heldMkt,
        uint256 owedMkt,
        BalanceUpdate solidHeldUpdate,
        BalanceUpdate solidOwedUpdate,
        BalanceUpdate liquidHeldUpdate,
        BalanceUpdate liquidOwedUpdate
    );

    event LogVaporize(
        address indexed solidOwner,
        uint256 solidNumber,
        address indexed vaporOwner,
        uint256 vaporNumber,
        uint256 heldMkt,
        uint256 owedMkt,
        BalanceUpdate solidHeldUpdate,
        BalanceUpdate solidOwedUpdate,
        BalanceUpdate vaporOwedUpdate
    );

    // ============ Structs ============

    struct BalanceUpdate {
        Types.Wei deltaWei;
        Types.Par newPar;
    }

    // ============ Internal Functions ============

    function logTransaction()
        internal
    {
        emit LogTransaction(msg.sender);
    }

    function logDeposit(
        Cache memory cache,
        Actions.DepositArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        emit LogDeposit(
            account.owner,
            account.number,
            args.mkt,
            getBalanceUpdate(
                cache,
                args.acct,
                args.mkt,
                deltaWei
            )
        );
    }

    function logWithdraw(
        Cache memory cache,
        Actions.WithdrawArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        emit LogWithdraw(
            account.owner,
            account.number,
            args.mkt,
            getBalanceUpdate(
                cache,
                args.acct,
                args.mkt,
                deltaWei
            )
        );
    }

    function logTransfer(
        Cache memory cache,
        Actions.TransferArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        Acct.Info memory accountOne = cacheGetAcctInfo(cache, args.acctOne);
        Acct.Info memory accountTwo = cacheGetAcctInfo(cache, args.acctTwo);

        emit LogTransfer(
            accountOne.owner,
            accountOne.number,
            accountTwo.owner,
            accountTwo.number,
            args.mkt,
            getBalanceUpdate(
                cache,
                args.acctOne,
                args.mkt,
                deltaWei
            ),
            getBalanceUpdate(
                cache,
                args.acctTwo,
                args.mkt,
                deltaWei.negative()
            )
        );
    }

    function logBuy(
        Cache memory cache,
        Actions.BuyArgs memory args,
        Types.Wei memory takerWei,
        Types.Wei memory makerWei
    )
        internal
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        emit LogBuy(
            account.owner,
            account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                cache,
                args.acct,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                cache,
                args.acct,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logSell(
        Cache memory cache,
        Actions.SellArgs memory args,
        Types.Wei memory takerWei,
        Types.Wei memory makerWei
    )
        internal
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        emit LogSell(
            account.owner,
            account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                cache,
                args.acct,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                cache,
                args.acct,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logTrade(
        Cache memory cache,
        Actions.TradeArgs memory args,
        Types.Wei memory inputWei,
        Types.Wei memory outputWei
    )
        internal
    {
        Acct.Info[2] memory accounts = [
            cacheGetAcctInfo(cache, args.takerAcct),
            cacheGetAcctInfo(cache, args.makerAcct)
        ];

        BalanceUpdate[4] memory updates = [
            getBalanceUpdate(
                cache,
                args.takerAcct,
                args.inputMkt,
                inputWei.negative()
            ),
            getBalanceUpdate(
                cache,
                args.takerAcct,
                args.outputMkt,
                outputWei.negative()
            ),
            getBalanceUpdate(
                cache,
                args.makerAcct,
                args.inputMkt,
                inputWei
            ),
            getBalanceUpdate(
                cache,
                args.makerAcct,
                args.outputMkt,
                outputWei
            )
        ];

        emit LogTrade(
            accounts[0].owner,
            accounts[0].number,
            accounts[1].owner,
            accounts[1].number,
            args.inputMkt,
            args.outputMkt,
            updates[0],
            updates[1],
            updates[2],
            updates[3],
            args.autoTrader
        );
    }

    function logCall(
        Cache memory cache,
        Actions.CallArgs memory args
    )
        internal
    {
        Acct.Info memory account = cacheGetAcctInfo(cache, args.acct);

        emit LogCall(
            account.owner,
            account.number,
            args.callee
        );
    }

    function logLiquidate(
        Cache memory cache,
        Actions.LiquidateArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        Acct.Info memory solidAccount = cacheGetAcctInfo(cache, args.solidAcct);
        Acct.Info memory liquidAccount = cacheGetAcctInfo(cache, args.liquidAcct);

        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            cache,
            args.solidAcct,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            cache,
            args.solidAcct,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory liquidHeldUpdate = getBalanceUpdate(
            cache,
            args.liquidAcct,
            args.heldMkt,
            heldWei
        );
        BalanceUpdate memory liquidOwedUpdate = getBalanceUpdate(
            cache,
            args.liquidAcct,
            args.owedMkt,
            owedWei
        );

        emit LogLiquidate(
            solidAccount.owner,
            solidAccount.number,
            liquidAccount.owner,
            liquidAccount.number,
            args.heldMkt,
            args.owedMkt,
            solidHeldUpdate,
            solidOwedUpdate,
            liquidHeldUpdate,
            liquidOwedUpdate
        );
    }

    function logVaporize(
        Cache memory cache,
        Actions.VaporizeArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        Acct.Info memory solidAccount = cacheGetAcctInfo(cache, args.solidAcct);
        Acct.Info memory vaporAccount = cacheGetAcctInfo(cache, args.vaporAcct);

        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            cache,
            args.solidAcct,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            cache,
            args.solidAcct,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory vaporOwedUpdate = getBalanceUpdate(
            cache,
            args.vaporAcct,
            args.owedMkt,
            owedWei
        );

        emit LogVaporize(
            solidAccount.owner,
            solidAccount.number,
            vaporAccount.owner,
            vaporAccount.number,
            args.heldMkt,
            args.owedMkt,
            solidHeldUpdate,
            solidOwedUpdate,
            vaporOwedUpdate
        );
    }

    // ============ Private Functions ============

    function getBalanceUpdate(
        Cache memory cache,
        uint256 acct,
        uint256 mkt,
        Types.Wei memory deltaWei
    )
        private
        pure
        returns (BalanceUpdate memory)
    {
        return BalanceUpdate({
            deltaWei: deltaWei,
            newPar: cacheGetPar(cache, acct, mkt)
        });
    }
}
