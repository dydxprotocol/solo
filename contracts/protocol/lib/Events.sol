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

import { Account } from "./Account.sol";
import { Actions } from "./Actions.sol";
import { Interest } from "./Interest.sol";
import { Storage } from "./Storage.sol";
import { Types } from "./Types.sol";


/**
 * @title Events
 * @author dYdX
 *
 * TODO
 */
library Events {
    using Types for Types.Wei;
    using Storage for Storage.State;

    // ============ Events ============

    event LogIndexUpdate(
        uint256 indexed market,
        Interest.Index index
    );

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

    function logIndexUpdate(
        uint256 marketId,
        Interest.Index memory index
    )
        internal
    {
        emit LogIndexUpdate(
            marketId,
            index
        );
    }

    function logTransaction()
        internal
    {
        emit LogTransaction(msg.sender);
    }

    function logDeposit(
        Storage.State storage state,
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
                state,
                args.account,
                args.mkt,
                deltaWei
            ),
            args.from
        );
    }

    function logWithdraw(
        Storage.State storage state,
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
                state,
                args.account,
                args.mkt,
                deltaWei
            ),
            args.to
        );
    }

    function logTransfer(
        Storage.State storage state,
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
                state,
                args.accountOne,
                args.mkt,
                deltaWei
            ),
            getBalanceUpdate(
                state,
                args.accountTwo,
                args.mkt,
                deltaWei.negative()
            )
        );
    }

    function logBuy(
        Storage.State storage state,
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
                state,
                args.account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                state,
                args.account,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logSell(
        Storage.State storage state,
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
                state,
                args.account,
                args.takerMkt,
                takerWei
            ),
            getBalanceUpdate(
                state,
                args.account,
                args.makerMkt,
                makerWei
            ),
            args.exchangeWrapper
        );
    }

    function logTrade(
        Storage.State storage state,
        Actions.TradeArgs memory args,
        Types.Wei memory inputWei,
        Types.Wei memory outputWei
    )
        internal
    {
        BalanceUpdate[4] memory updates = [
            getBalanceUpdate(
                state,
                args.takerAccount,
                args.inputMkt,
                inputWei.negative()
            ),
            getBalanceUpdate(
                state,
                args.takerAccount,
                args.outputMkt,
                outputWei.negative()
            ),
            getBalanceUpdate(
                state,
                args.makerAccount,
                args.inputMkt,
                inputWei
            ),
            getBalanceUpdate(
                state,
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
        Storage.State storage state,
        Actions.LiquidateArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory liquidHeldUpdate = getBalanceUpdate(
            state,
            args.liquidAccount,
            args.heldMkt,
            heldWei
        );
        BalanceUpdate memory liquidOwedUpdate = getBalanceUpdate(
            state,
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
        Storage.State storage state,
        Actions.VaporizeArgs memory args,
        Types.Wei memory heldWei,
        Types.Wei memory owedWei
    )
        internal
    {
        BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.heldMkt,
            heldWei.negative()
        );
        BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.owedMkt,
            owedWei.negative()
        );
        BalanceUpdate memory vaporOwedUpdate = getBalanceUpdate(
            state,
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
        Storage.State storage state,
        Account.Info memory account,
        uint256 mkt,
        Types.Wei memory deltaWei
    )
        private
        view
        returns (BalanceUpdate memory)
    {
        return BalanceUpdate({
            deltaWei: deltaWei,
            newPar: state.getPar(account, mkt)
        });
    }
}
