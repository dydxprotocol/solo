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
        address indexed acctOwner,
        uint256 acctNumber,
        uint256 mkt,
        BalanceUpdate update,
        address from
    );

    event LogWithdraw(
        address indexed acctOwner,
        uint256 acctNumber,
        uint256 mkt,
        BalanceUpdate update,
        address to
    );

    event LogTransfer(
        address indexed acctOneOwner,
        uint256 acctOneNumber,
        address indexed acctTwoOwner,
        uint256 acctTwoNumber,
        uint256 mkt,
        BalanceUpdate updateOne,
        BalanceUpdate updateTwo
    );

    event LogBuy(
        address indexed acctOwner,
        uint256 acctNumber,
        uint256 takerMkt,
        uint256 makerMkt,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogSell(
        address indexed acctOwner,
        uint256 acctNumber,
        uint256 takerMkt,
        uint256 makerMkt,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogTrade(
        address indexed takerAcctOwner,
        uint256 takerAcctNumber,
        address indexed makerAcctOwner,
        uint256 makerAcctNumber,
        uint256 inputMkt,
        uint256 outputMkt,
        BalanceUpdate takerInputUpdate,
        BalanceUpdate takerOutputUpdate,
        BalanceUpdate traderInputUpdate,
        BalanceUpdate traderOutputUpdate,
        address autoTrader
    );

    event LogCall(
        address indexed acctOwner,
        uint256 acctNumber,
        address callee
    );

    event LogLiquidate(
        address indexed solidAcctOwner,
        uint256 solidAcctNumber,
        address indexed liquidAcctOwner,
        uint256 liquidAcctNumber,
        uint256 heldMkt,
        uint256 owedMkt,
        BalanceUpdate solidHeldUpdate,
        BalanceUpdate solidOwedUpdate,
        BalanceUpdate liquidHeldUpdate,
        BalanceUpdate liquidOwedUpdate
    );

    event LogVaporize(
        address indexed solidAcctOwner,
        uint256 solidAcctNumber,
        address indexed vaporAcctOwner,
        uint256 vaporAcctNumber,
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
        Acct.Info memory account = cache.accounts[args.acct];

        emit LogDeposit(
            account.owner,
            account.number,
            args.mkt,
            getBalanceUpdate(
                account,
                args.mkt,
                deltaWei
            ),
            args.from
        );
    }

    function logWithdraw(
        Cache memory cache,
        Actions.WithdrawArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        Acct.Info memory account = cache.accounts[args.acct];

        emit LogWithdraw(
            account.owner,
            account.number,
            args.mkt,
            getBalanceUpdate(
                account,
                args.mkt,
                deltaWei
            ),
            args.to
        );
    }

    function logTransfer(
        Cache memory cache,
        Actions.TransferArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        Acct.Info memory accountOne = cache.accounts[args.acctOne];
        Acct.Info memory accountTwo = cache.accounts[args.acctTwo];

        emit LogTransfer(
            accountOne.owner,
            accountOne.number,
            accountTwo.owner,
            accountTwo.number,
            args.mkt,
            getBalanceUpdate(
                accountOne,
                args.mkt,
                deltaWei
            ),
            getBalanceUpdate(
                accountTwo,
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
        Acct.Info memory account = cache.accounts[args.acct];

        emit LogBuy(
            account.owner,
            account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                account,
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
        Acct.Info memory account = cache.accounts[args.acct];

        emit LogSell(
            account.owner,
            account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                account,
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
            cache.accounts[args.takerAcct],
            cache.accounts[args.makerAcct]
        ];

        BalanceUpdate[4] memory updates = [
            getBalanceUpdate(
                accounts[0],
                args.inputMkt,
                inputWei.negative()
            ),
            getBalanceUpdate(
                accounts[0],
                args.outputMkt,
                outputWei.negative()
            ),
            getBalanceUpdate(
                accounts[1],
                args.inputMkt,
                inputWei
            ),
            getBalanceUpdate(
                accounts[1],
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
        Acct.Info memory account = cache.accounts[args.acct];

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
        Acct.Info memory solidAccount = cache.accounts[args.solidAcct];
        Acct.Info memory liquidAccount = cache.accounts[args.liquidAcct];

        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory liquidHeldUpdate = getBalanceUpdate(
            liquidAccount,
            args.heldMkt,
            heldWei
        );
        BalanceUpdate memory liquidOwedUpdate = getBalanceUpdate(
            liquidAccount,
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
        Acct.Info memory solidAccount = cache.accounts[args.solidAcct];
        Acct.Info memory vaporAccount = cache.accounts[args.vaporAcct];

        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory vaporOwedUpdate = getBalanceUpdate(
            vaporAccount,
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
        Acct.Info memory account,
        uint256 mkt,
        Types.Wei memory deltaWei
    )
        private
        view
        returns (BalanceUpdate memory)
    {
        return BalanceUpdate({
            deltaWei: deltaWei,
            newPar: getPar(account, mkt)
        });
    }
}
