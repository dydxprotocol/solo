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

import { Account } from "./Account.sol";
import { Actions } from "./Actions.sol";
import { Interest } from "./Interest.sol";
import { Storage } from "./Storage.sol";
import { Types } from "./Types.sol";


/**
 * @title Events
 * @author dYdX
 *
 * Library to parse and emit logs from which the state of all accounts and indexes can be followed
 */
library Events {
function coverage_0x6a08acbf(bytes32 c__0x6a08acbf) public pure {}

    using Types for Types.Wei;
    using Storage for Storage.State;

    // ============ Events ============

    event LogIndexUpdate(
        uint256 indexed market,
        Interest.Index index
    );

    event LogOperation(
        address sender
    );

    event LogDeposit(
        address indexed accountOwner,
        uint256 accountNumber,
        uint256 market,
        BalanceUpdate update,
        address from
    );

    event LogWithdraw(
        address indexed accountOwner,
        uint256 accountNumber,
        uint256 market,
        BalanceUpdate update,
        address to
    );

    event LogTransfer(
        address indexed accountOneOwner,
        uint256 accountOneNumber,
        address indexed accountTwoOwner,
        uint256 accountTwoNumber,
        uint256 market,
        BalanceUpdate updateOne,
        BalanceUpdate updateTwo
    );

    event LogBuy(
        address indexed accountOwner,
        uint256 accountNumber,
        uint256 takerMarket,
        uint256 makerMarket,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogSell(
        address indexed accountOwner,
        uint256 accountNumber,
        uint256 takerMarket,
        uint256 makerMarket,
        BalanceUpdate takerUpdate,
        BalanceUpdate makerUpdate,
        address exchangeWrapper
    );

    event LogTrade(
        address indexed takerAccountOwner,
        uint256 takerAccountNumber,
        address indexed makerAccountOwner,
        uint256 makerAccountNumber,
        uint256 inputMarket,
        uint256 outputMarket,
        BalanceUpdate takerInputUpdate,
        BalanceUpdate takerOutputUpdate,
        BalanceUpdate makerInputUpdate,
        BalanceUpdate makerOutputUpdate,
        address autoTrader
    );

    event LogCall(
        address indexed accountOwner,
        uint256 accountNumber,
        address callee
    );

    event LogLiquidate(
        address indexed solidAccountOwner,
        uint256 solidAccountNumber,
        address indexed liquidAccountOwner,
        uint256 liquidAccountNumber,
        uint256 heldMarket,
        uint256 owedMarket,
        BalanceUpdate solidHeldUpdate,
        BalanceUpdate solidOwedUpdate,
        BalanceUpdate liquidHeldUpdate,
        BalanceUpdate liquidOwedUpdate
    );

    event LogVaporize(
        address indexed solidAccountOwner,
        uint256 solidAccountNumber,
        address indexed vaporAccountOwner,
        uint256 vaporAccountNumber,
        uint256 heldMarket,
        uint256 owedMarket,
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
    {coverage_0x6a08acbf(0x0b4d12bea3cf64b1379a9812c7fc3ea64ecf404387b2818db53d4fe0ca29c0f8); /* function */ 

coverage_0x6a08acbf(0x95096fa6f6a766af348c5af7b080f9fa5c966c32a90bfc1f94519d404b3f2780); /* line */ 
        coverage_0x6a08acbf(0x5b6576afe15a254bc799ff75d7439de57a09599a354ff591c42ec0cffb251830); /* statement */ 
emit LogIndexUpdate(
            marketId,
            index
        );
    }

    function logOperation()
        internal
    {coverage_0x6a08acbf(0x65e31944fe1789922a08586cc087f89ae1f59919bb9cabe2d991c2817c424b0b); /* function */ 

coverage_0x6a08acbf(0x9b5d9977e8cf3775cb46097d77a5749648808f5384e9af18d840dd9b0fd174e7); /* line */ 
        coverage_0x6a08acbf(0x6577e4f64761dac8e629d45bdc1ea353f65e9254263773eb3763ee19894488f9); /* statement */ 
emit LogOperation(msg.sender);
    }

    function logDeposit(
        Storage.State storage state,
        Actions.DepositArgs memory args,
        Types.Wei memory deltaWei
    )
        internal
    {coverage_0x6a08acbf(0x7fb0c544c43bc7ebdc81226099db1fb0f088c380f203d255d1fb13461888d589); /* function */ 

coverage_0x6a08acbf(0x2e72fcefe2330a32cf228c2b0309bf860f9fcbe3821331adfd5579968ff1a2aa); /* line */ 
        coverage_0x6a08acbf(0xf8d423cfaede18fcdfde09b0766a7826494ad0122bdf5cfff098b87454bc790e); /* statement */ 
emit LogDeposit(
            args.account.owner,
            args.account.number,
            args.market,
            getBalanceUpdate(
                state,
                args.account,
                args.market,
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
    {coverage_0x6a08acbf(0x9a03133ff2eecb5a7be8c9ea5c6f256c0d07500a84aa1fe97d12c9c7b1f270f3); /* function */ 

coverage_0x6a08acbf(0x7e2334fb05ea03ff58d6a3240b416c506849828fd9d1933ee9338113816468af); /* line */ 
        coverage_0x6a08acbf(0xf7d77eef4bc62c48d6fc503005831a44f97adced839bb49828ae777eb5172daa); /* statement */ 
emit LogWithdraw(
            args.account.owner,
            args.account.number,
            args.market,
            getBalanceUpdate(
                state,
                args.account,
                args.market,
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
    {coverage_0x6a08acbf(0xa07e093c3b172a3c07357d811025985be55ec1a2d075b8e89cbe2cf713febc09); /* function */ 

coverage_0x6a08acbf(0x5bd1c70985a1743882fca614a28f0c9b8cf91bce7406a46b136d0e8b0b4454a3); /* line */ 
        coverage_0x6a08acbf(0x4cd9b806969de92af74c73efe656b044e9728274a25bd19fddfaa10f06031b7b); /* statement */ 
emit LogTransfer(
            args.accountOne.owner,
            args.accountOne.number,
            args.accountTwo.owner,
            args.accountTwo.number,
            args.market,
            getBalanceUpdate(
                state,
                args.accountOne,
                args.market,
                deltaWei
            ),
            getBalanceUpdate(
                state,
                args.accountTwo,
                args.market,
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
    {coverage_0x6a08acbf(0x142f784f593cd158b81f14fa925c70d01139ddf5f8b014d24648d2f92d0ef4e5); /* function */ 

coverage_0x6a08acbf(0xc06de24e94604af80123d12d02e5eb60af329cde94329fe4b972b47e14408378); /* line */ 
        coverage_0x6a08acbf(0x5fed60d97c38ee71c595d019a2d4b5a6ad396b2b01c84cbcd590d24462ae5822); /* statement */ 
emit LogBuy(
            args.account.owner,
            args.account.number,
            args.takerMarket,
            args.makerMarket,
            getBalanceUpdate(
                state,
                args.account,
                args.takerMarket,
                takerWei
            ),
            getBalanceUpdate(
                state,
                args.account,
                args.makerMarket,
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
    {coverage_0x6a08acbf(0x0d97684120d66937a1d9b1c79aeceb4a23b690d3a9fc37b3ca5d883acf4f36f9); /* function */ 

coverage_0x6a08acbf(0x01811a65042a19626b8bfc207fe991994773d100ba693a7bf13999d5f9e3d23b); /* line */ 
        coverage_0x6a08acbf(0xd27607db2edf60c623c34f0ccc38411475465adb222f7ce718dee71771ea40e4); /* statement */ 
emit LogSell(
            args.account.owner,
            args.account.number,
            args.takerMarket,
            args.makerMarket,
            getBalanceUpdate(
                state,
                args.account,
                args.takerMarket,
                takerWei
            ),
            getBalanceUpdate(
                state,
                args.account,
                args.makerMarket,
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
    {coverage_0x6a08acbf(0x258e987f4ef1b03a81351925a4a5d70bd1fe2d599448f399c7fd4c74a91cdfa9); /* function */ 

coverage_0x6a08acbf(0xb811aa24c26c223518dfbdd27c4f7147bc8afff1fa0cae589d8c83e66b811ba5); /* line */ 
        coverage_0x6a08acbf(0x30fb6c7ed7ad8b5c9e18b2699713449c4d92636a95bece4771249571effc9bda); /* statement */ 
BalanceUpdate[4] memory updates = [
            getBalanceUpdate(
                state,
                args.takerAccount,
                args.inputMarket,
                inputWei.negative()
            ),
            getBalanceUpdate(
                state,
                args.takerAccount,
                args.outputMarket,
                outputWei.negative()
            ),
            getBalanceUpdate(
                state,
                args.makerAccount,
                args.inputMarket,
                inputWei
            ),
            getBalanceUpdate(
                state,
                args.makerAccount,
                args.outputMarket,
                outputWei
            )
        ];

coverage_0x6a08acbf(0x68b7b04805fa87b8447830c6c2b63656bf8596deb7555d83cab79c1ddc2eae88); /* line */ 
        coverage_0x6a08acbf(0x2b54180a30f7859c33a8f6573a29b382ea58b69429ecbb7d4c696cfbafe821c8); /* statement */ 
emit          LogTrade(
            args.takerAccount.owner,
            args.takerAccount.number,
            args.makerAccount.owner,
            args.makerAccount.number,
            args.inputMarket,
            args.outputMarket,
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
    {coverage_0x6a08acbf(0x38374ffa815eec34eb91ed5a128847dd33a34a37ffedd85faf3c1aeff8e87330); /* function */ 

coverage_0x6a08acbf(0xba97c908d29a32e5e1a7292338629b7414ba015744f9662ac94ae8d067e075f2); /* line */ 
        coverage_0x6a08acbf(0x407794ef9ad04dac2112749a1d8e650000fefc4c394b794818aa83fbc73761e2); /* statement */ 
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
    {coverage_0x6a08acbf(0x085b7129d93469871106e201bde0b978bffbe06bd91c34641c7b9c87b1f02305); /* function */ 

coverage_0x6a08acbf(0x86ae7bc5551009b7db9036c816598a354c0ce6c88681ea1c875e4bc3c0de6d82); /* line */ 
        coverage_0x6a08acbf(0x5c0f93c772dccb0c42fa4aaf95875205c20851c21aaa2272f7a6b1376def860c); /* statement */ 
BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.heldMarket,
            heldWei.negative()
        );
coverage_0x6a08acbf(0xd122005ac7fd23ba24503794c57df398e39821a9ca34eeb57423bc8852ea6d47); /* line */ 
        coverage_0x6a08acbf(0x4093e98c3b74e5a8ef4e242d685f53744cbeecbb71c801f5170498d5a551edd1); /* statement */ 
BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.owedMarket,
            owedWei.negative()
        );
coverage_0x6a08acbf(0xac6569ea63e21562c4f7008b6a5043a700a59bdd109029821fdf8c11c3a723a2); /* line */ 
        coverage_0x6a08acbf(0x13638d4da0c278aad14f416619f596c6da0000d83b4666e590f25a5f4aaa46eb); /* statement */ 
BalanceUpdate memory liquidHeldUpdate = getBalanceUpdate(
            state,
            args.liquidAccount,
            args.heldMarket,
            heldWei
        );
coverage_0x6a08acbf(0x221486f472765f32d32989a66f956f029bb225ece533199c7514e25251180f0a); /* line */ 
        coverage_0x6a08acbf(0xbd7dffc862de72870814a912a7d1aa96a0f840d202667059bd86446d4c756faa); /* statement */ 
BalanceUpdate memory liquidOwedUpdate = getBalanceUpdate(
            state,
            args.liquidAccount,
            args.owedMarket,
            owedWei
        );

coverage_0x6a08acbf(0x1a0dd7dba6aa786d6aa4f5bee8b7d0426eed305edb20bf6254ad42d9c6f5bb3b); /* line */ 
        coverage_0x6a08acbf(0x69f81013b762fb4e2e5309d5399feadb34c684e5b0c2520fbb55a81938f2abd4); /* statement */ 
emit LogLiquidate(
            args.solidAccount.owner,
            args.solidAccount.number,
            args.liquidAccount.owner,
            args.liquidAccount.number,
            args.heldMarket,
            args.owedMarket,
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
        Types.Wei memory owedWei,
        Types.Wei memory excessWei
    )
        internal
    {coverage_0x6a08acbf(0x862458b28170c21a5b816523318a16706477002220ebb90e733eb02b4d27f6c6); /* function */ 

coverage_0x6a08acbf(0xeb76b77b4b3d2e6ed3bf8d730075d39242dbf4cc2de30a26f32b98224e13f0d0); /* line */ 
        coverage_0x6a08acbf(0x7414155e78976a43e6f8c1fdb72ac34cb4dfe5d1b8d63cb8322d7e99ccb6c786); /* statement */ 
BalanceUpdate memory solidHeldUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.heldMarket,
            heldWei.negative()
        );
coverage_0x6a08acbf(0xe9bade11aa3cf14d4c98aa68530e59822780ddc179e0512bf967f7d18dc72f77); /* line */ 
        coverage_0x6a08acbf(0x33142ce71ad5008819b90aa51bf8d27f947cc867cf54204360dcdbb767747308); /* statement */ 
BalanceUpdate memory solidOwedUpdate = getBalanceUpdate(
            state,
            args.solidAccount,
            args.owedMarket,
            owedWei.negative()
        );
coverage_0x6a08acbf(0xde900259b7ee88be935baa9c3a946b6857448fd5c5704c798bfc61b56e141a99); /* line */ 
        coverage_0x6a08acbf(0xfe4d9f05c4dd936a291e1d44f1d053fc9aa48ee82837d69b97f6a815b3da0183); /* statement */ 
BalanceUpdate memory vaporOwedUpdate = getBalanceUpdate(
            state,
            args.vaporAccount,
            args.owedMarket,
            owedWei.add(excessWei)
        );

coverage_0x6a08acbf(0xf6f02467b85b68709fdcb02f83299a22953ed1e51de587faf8487da9867664fc); /* line */ 
        coverage_0x6a08acbf(0xfa25af8ccf169f6b551f90bde5db3ef8cfb5b0fde28b73139e3f90188d0f6315); /* statement */ 
emit LogVaporize(
            args.solidAccount.owner,
            args.solidAccount.number,
            args.vaporAccount.owner,
            args.vaporAccount.number,
            args.heldMarket,
            args.owedMarket,
            solidHeldUpdate,
            solidOwedUpdate,
            vaporOwedUpdate
        );
    }

    // ============ Private Functions ============

    function getBalanceUpdate(
        Storage.State storage state,
        Account.Info memory account,
        uint256 market,
        Types.Wei memory deltaWei
    )
        private
        view
        returns (BalanceUpdate memory)
    {coverage_0x6a08acbf(0x222015c424553825886ed8be5c24bb312d4fab95fe3be4d46c3724723b0a04a8); /* function */ 

coverage_0x6a08acbf(0x502918d16cf9667e03551f048487185b5a1da9a8041cec6139ace6efdbdf110d); /* line */ 
        coverage_0x6a08acbf(0x9b81f56d52ec79025a1aac02f126c04c727a67a65dc9b0fea8bc5cd09e65e527); /* statement */ 
return BalanceUpdate({
            deltaWei: deltaWei,
            newPar: state.getPar(account, market)
        });
    }
}
