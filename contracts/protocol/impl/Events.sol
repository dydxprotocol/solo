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
        Actions.DepositArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        emit LogDeposit(
            args.account.owner,
            args.account.number,
            args.mkt,
            getBalanceUpdate(
                args.account,
                args.mkt,
                deltaWei
            ),
            args.from
        );
    }

    function logWithdraw(
        Actions.WithdrawArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        emit LogWithdraw(
            args.account.owner,
            args.account.number,
            args.mkt,
            getBalanceUpdate(
                args.account,
                args.mkt,
                deltaWei
            ),
            args.to
        );
    }

    function logTransfer(
        Actions.TransferArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {
        emit LogTransfer(
            args.accountOne.owner,
            args.accountOne.number,
            args.accountTwo.owner,
            args.accountTwo.number,
            args.mkt,
            getBalanceUpdate(
                args.accountOne,
                args.mkt,
                deltaWei
            ),
            getBalanceUpdate(
                args.accountTwo,
                args.mkt,
                deltaWei.negative()
            )
        );
    }

    function logBuy(
        Actions.BuyArgs memory args,
        Types.Wei memory takerWei,
        Types.Wei memory makerWei
    )
        internal
    {
        emit LogBuy(
            args.account.owner,
            args.account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                args.account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                args.account,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logSell(
        Actions.SellArgs memory args,
        Types.Wei memory takerWei,
        Types.Wei memory makerWei
    )
        internal
    {
        emit LogSell(
            args.account.owner,
            args.account.number,
            args.takerMkt,
            args.makerMkt,
            getBalanceUpdate(
                args.account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                args.account,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logTrade(
        Actions.TradeArgs memory args,
        Types.Wei memory inputWei,
        Types.Wei memory outputWei
    )
        internal
    {
        BalanceUpdate[4] memory updates = [
            getBalanceUpdate(
                args.takerAccount,
                args.inputMkt,
                inputWei.negative()
            ),
            getBalanceUpdate(
                args.takerAccount,
                args.outputMkt,
                outputWei.negative()
            ),
            getBalanceUpdate(
                args.makerAccount,
                args.inputMkt,
                inputWei
            ),
            getBalanceUpdate(
                args.makerAccount,
                args.outputMkt,
                outputWei
            )
        ];

        emit LogTrade(
            args.takerAccount.owner,
            args.takerAccount.number,
            args.makerAccount.owner,
            args.makerAccount.number,
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
        Actions.CallArgs memory args
    )
        internal
    {
        emit LogCall(
            args.account.owner,
            args.account.number,
            args.callee
        );
    }

    function logLiquidate(
        Actions.LiquidateArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory liquidHeldUpdate = getBalanceUpdate(
            args.liquidAccount,
            args.heldMkt,
            heldWei
        );
        BalanceUpdate memory liquidOwedUpdate = getBalanceUpdate(
            args.liquidAccount,
            args.owedMkt,
            owedWei
        );

        emit LogLiquidate(
            args.solidAccount.owner,
            args.solidAccount.number,
            args.liquidAccount.owner,
            args.liquidAccount.number,
            args.heldMkt,
            args.owedMkt,
            solidHeldUpdate,
            solidOwedUpdate,
            liquidHeldUpdate,
            liquidOwedUpdate
        );
    }

    function logVaporize(
        Actions.VaporizeArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory vaporOwedUpdate = getBalanceUpdate(
            args.vaporAccount,
            args.owedMkt,
            owedWei
        );

        emit LogVaporize(
            args.solidAccount.owner,
            args.solidAccount.number,
            args.vaporAccount.owner,
            args.vaporAccount.number,
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
