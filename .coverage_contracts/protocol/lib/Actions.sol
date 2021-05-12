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
import { Types } from "./Types.sol";


/**
 * @title Actions
 * @author dYdX
 *
 * Library that defines and parses valid Actions
 */
library Actions {
function coverage_0xf62059a8(bytes32 c__0xf62059a8) public pure {}


    // ============ Constants ============

    bytes32 constant FILE = "Actions";

    // ============ Enums ============

    enum ActionType {
        Deposit,   // supply tokens
        Withdraw,  // borrow tokens
        Transfer,  // transfer balance between accounts
        Buy,       // buy an amount of some token (externally)
        Sell,      // sell an amount of some token (externally)
        Trade,     // trade tokens against another account
        Liquidate, // liquidate an undercollateralized or expiring account
        Vaporize,  // use excess tokens to zero-out a completely negative account
        Call       // send arbitrary data to an address
    }

    enum AccountLayout {
        OnePrimary,
        TwoPrimary,
        PrimaryAndSecondary
    }

    enum MarketLayout {
        ZeroMarkets,
        OneMarket,
        TwoMarkets
    }

    // ============ Structs ============

    /*
     * Arguments that are passed to Solo in an ordered list as part of a single operation.
     * Each ActionArgs has an actionType which specifies which action struct that this data will be
     * parsed into before being processed.
     */
    struct ActionArgs {
        ActionType actionType;
        uint256 accountId;
        Types.AssetAmount amount;
        uint256 primaryMarketId;
        uint256 secondaryMarketId;
        address otherAddress;
        uint256 otherAccountId;
        bytes data;
    }

    // ============ Action Types ============

    /*
     * Moves tokens from an address to Solo. Can either repay a borrow or provide additional supply.
     */
    struct DepositArgs {
        Types.AssetAmount amount;
        Account.Info account;
        uint256 market;
        address from;
    }

    /*
     * Moves tokens from Solo to another address. Can either borrow tokens or reduce the amount
     * previously supplied.
     */
    struct WithdrawArgs {
        Types.AssetAmount amount;
        Account.Info account;
        uint256 market;
        address to;
    }

    /*
     * Transfers balance between two accounts. The msg.sender must be an operator for both accounts.
     * The amount field applies to accountOne.
     * This action does not require any token movement since the trade is done internally to Solo.
     */
    struct TransferArgs {
        Types.AssetAmount amount;
        Account.Info accountOne;
        Account.Info accountTwo;
        uint256 market;
    }

    /*
     * Acquires a certain amount of tokens by spending other tokens. Sends takerMarket tokens to the
     * specified exchangeWrapper contract and expects makerMarket tokens in return. The amount field
     * applies to the makerMarket.
     */
    struct BuyArgs {
        Types.AssetAmount amount;
        Account.Info account;
        uint256 makerMarket;
        uint256 takerMarket;
        address exchangeWrapper;
        bytes orderData;
    }

    /*
     * Spends a certain amount of tokens to acquire other tokens. Sends takerMarket tokens to the
     * specified exchangeWrapper and expects makerMarket tokens in return. The amount field applies
     * to the takerMarket.
     */
    struct SellArgs {
        Types.AssetAmount amount;
        Account.Info account;
        uint256 takerMarket;
        uint256 makerMarket;
        address exchangeWrapper;
        bytes orderData;
    }

    /*
     * Trades balances between two accounts using any external contract that implements the
     * AutoTrader interface. The AutoTrader contract must be an operator for the makerAccount (for
     * which it is trading on-behalf-of). The amount field applies to the makerAccount and the
     * inputMarket. This proposed change to the makerAccount is passed to the AutoTrader which will
     * quote a change for the makerAccount in the outputMarket (or will disallow the trade).
     * This action does not require any token movement since the trade is done internally to Solo.
     */
    struct TradeArgs {
        Types.AssetAmount amount;
        Account.Info takerAccount;
        Account.Info makerAccount;
        uint256 inputMarket;
        uint256 outputMarket;
        address autoTrader;
        bytes tradeData;
    }

    /*
     * Each account must maintain a certain margin-ratio (specified globally). If the account falls
     * below this margin-ratio, it can be liquidated by any other account. This allows anyone else
     * (arbitrageurs) to repay any borrowed asset (owedMarket) of the liquidating account in
     * exchange for any collateral asset (heldMarket) of the liquidAccount. The ratio is determined
     * by the price ratio (given by the oracles) plus a spread (specified globally). Liquidating an
     * account also sets a flag on the account that the account is being liquidated. This allows
     * anyone to continue liquidating the account until there are no more borrows being taken by the
     * liquidating account. Liquidators do not have to liquidate the entire account all at once but
     * can liquidate as much as they choose. The liquidating flag allows liquidators to continue
     * liquidating the account even if it becomes collateralized through partial liquidation or
     * price movement.
     */
    struct LiquidateArgs {
        Types.AssetAmount amount;
        Account.Info solidAccount;
        Account.Info liquidAccount;
        uint256 owedMarket;
        uint256 heldMarket;
    }

    /*
     * Similar to liquidate, but vaporAccounts are accounts that have only negative balances
     * remaining. The arbitrageur pays back the negative asset (owedMarket) of the vaporAccount in
     * exchange for a collateral asset (heldMarket) at a favorable spread. However, since the
     * liquidAccount has no collateral assets, the collateral must come from Solo's excess tokens.
     */
    struct VaporizeArgs {
        Types.AssetAmount amount;
        Account.Info solidAccount;
        Account.Info vaporAccount;
        uint256 owedMarket;
        uint256 heldMarket;
    }

    /*
     * Passes arbitrary bytes of data to an external contract that implements the Callee interface.
     * Does not change any asset amounts. This function may be useful for setting certain variables
     * on layer-two contracts for certain accounts without having to make a separate Ethereum
     * transaction for doing so. Also, the second-layer contracts can ensure that the call is coming
     * from an operator of the particular account.
     */
    struct CallArgs {
        Account.Info account;
        address callee;
        bytes data;
    }

    // ============ Helper Functions ============

    function getMarketLayout(
        ActionType actionType
    )
        internal
        pure
        returns (MarketLayout)
    {coverage_0xf62059a8(0xc160715adba1e91d46319b66d46b7aecb2aa0b18ce38a09265847ca61e26c6ac); /* function */ 

coverage_0xf62059a8(0xc6078be16480eb217ec7597dbcfa4e02662ce64688d3ce697f2a3550bc4bfec7); /* line */ 
        coverage_0xf62059a8(0xa6be87da528e6add7cb1b5a9196f0f46bd4162ac6182e5162b1b9c1a41263833); /* statement */ 
if (
            actionType == Actions.ActionType.Deposit
            || actionType == Actions.ActionType.Withdraw
            || actionType == Actions.ActionType.Transfer
        ) {coverage_0xf62059a8(0xcaa495274035046f505ca4ca27820e3e321597140c8aa6b8ec42e887f6e6fffd); /* branch */ 

coverage_0xf62059a8(0xa8228dedb0afc1e42b51d9c3087057f99767d32dcd12b7922213bbd89d22c70f); /* line */ 
            coverage_0xf62059a8(0x4c9bbae81bbed42d906f1cfc90c8c10ccf04f558b7dcbef149e86f331342ed04); /* statement */ 
return MarketLayout.OneMarket;
        }
        else {coverage_0xf62059a8(0xbae606d38ead1642493ba14498624d6fb5c9e196696a666b7df5afba3707b2c1); /* statement */ 
coverage_0xf62059a8(0x8209dcb492c6979b46c472021f925e82ea12cd5c8c96249478e7eb7f47941760); /* branch */ 
if (actionType == Actions.ActionType.Call) {coverage_0xf62059a8(0xe11d59f817712ecef7344654ae545df8e54fa2af7c50ac675baf15b109204565); /* branch */ 

coverage_0xf62059a8(0x2d0a152b5fdbee2a811f56d29df87721a6f8d2149d514a2f40a3b3cb233b20a7); /* line */ 
            coverage_0xf62059a8(0x9467613b5f6287d0d14e67ffcb93ea9e282d74ee794c541a7ed4a19e9549d403); /* statement */ 
return MarketLayout.ZeroMarkets;
        }else { coverage_0xf62059a8(0x7349d9b892515e5f74438552accebd846202892406838744c81334730cdbc841); /* branch */ 
}}
coverage_0xf62059a8(0xbf363ff024f17704e18e6ae5b15833408fd8c85da6522f37116c903b5bf17db5); /* line */ 
        coverage_0xf62059a8(0x6253e8cb901e85caa40d51e28b0c6e743553cfbf57bc8e7d9f6a8bd41369d8af); /* statement */ 
return MarketLayout.TwoMarkets;
    }

    function getAccountLayout(
        ActionType actionType
    )
        internal
        pure
        returns (AccountLayout)
    {coverage_0xf62059a8(0x6541f3aeca0432225430dce9a2b8773c74b127e048e26f4bb1af60db152b3b5f); /* function */ 

coverage_0xf62059a8(0x0a31862abc39236579507fc62f6b00f52f1bff934c970730c39b40e8262b64a7); /* line */ 
        coverage_0xf62059a8(0xecfe3bb6828a90b05e755de28e18f3439273ddf4bf0dbdaa00d5f8de8b0aa0eb); /* statement */ 
if (
            actionType == Actions.ActionType.Transfer
            || actionType == Actions.ActionType.Trade
        ) {coverage_0xf62059a8(0x3ad78c7218bc9bb13b26b7e6b58b17ec7d80ba4cde2423ad8ae78cbc1b6a8648); /* branch */ 

coverage_0xf62059a8(0x035aaf2f0fd7c1ef273394bdd80a7c3e6b74113861a2589fc78936ca309e906f); /* line */ 
            coverage_0xf62059a8(0x906489464053e6e9d35a86533addf5ce41a2d38b035058e9c4a2ce38567341fe); /* statement */ 
return AccountLayout.TwoPrimary;
        } else {coverage_0xf62059a8(0xf2828ffc983541e2aebcd99529e04be2161eeb3c67ea60bb844294fb49a42748); /* statement */ 
coverage_0xf62059a8(0xc0c3705340be9a53f2061628b9511a8fc973dc30fff00b162bfa26da62ff5cf1); /* branch */ 
if (
            actionType == Actions.ActionType.Liquidate
            || actionType == Actions.ActionType.Vaporize
        ) {coverage_0xf62059a8(0x437265aec3ee2c5c237b0d0bf9334d3510458f2d5a7e9c7bbf89c515051be6ae); /* branch */ 

coverage_0xf62059a8(0x0167c6cc3c338df84bef6e011b35f7ce9b3238cc35e3aaeb50b8855444af6549); /* line */ 
            coverage_0xf62059a8(0x89a1ec4cd3126521e16e6a8e9d6ee7733550f97ec4b6ed1d4b6d004ee5834662); /* statement */ 
return AccountLayout.PrimaryAndSecondary;
        }else { coverage_0xf62059a8(0x66d1ff4b98051bf152f12166a5c8eb0be89d5470ad4c68b3c820afda94bc7b0f); /* branch */ 
}}
coverage_0xf62059a8(0x0775041eba9c9ae30965abc5d864830833a76b159d77f9e286ee2fcc34263c23); /* line */ 
        coverage_0xf62059a8(0xe7eefcd6be7649fd09843da26477211fdb1d355d3b60edccf57e046449dc0020); /* statement */ 
return AccountLayout.OnePrimary;
    }

    // ============ Parsing Functions ============

    function parseDepositArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (DepositArgs memory)
    {coverage_0xf62059a8(0xb4d01ace2db63cb8f3ae0d1edaf4b9677a9f713eb3c5261dec515a9fce97fe21); /* function */ 

coverage_0xf62059a8(0xfc2c5e3dfe375e8f4813c85a0bec94d99b08c18e1c3024aab7acf395996a753a); /* line */ 
        coverage_0xf62059a8(0x1a47e4f49c9d08ba2a71801019e404f028ac7dd5c5ad77c9f8ac12264f39f3f3); /* assertPre */ 
coverage_0xf62059a8(0xa1a2455a9fa27d8d9f12a2600c59ea8015ffb2405f2d454200780eba7a1487ff); /* statement */ 
assert(args.actionType == ActionType.Deposit);coverage_0xf62059a8(0xb8de929bee57a059b4c494a5c3717e1b5f40a0c990cb8d0ed74555d9928f1ab4); /* assertPost */ 

coverage_0xf62059a8(0x020098d4cbfb38ee0bbd10f2afb31a5337b9f69ea3b18100e2279d528b899182); /* line */ 
        coverage_0xf62059a8(0x52171c450426269474713b54086bb5c0fdd3a7a06efba39674e7e197711477fd); /* statement */ 
return DepositArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            market: args.primaryMarketId,
            from: args.otherAddress
        });
    }

    function parseWithdrawArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (WithdrawArgs memory)
    {coverage_0xf62059a8(0xfcff8720de26d0c94cc94a4b871f583202af115b49ca3340f02adcc258070e45); /* function */ 

coverage_0xf62059a8(0x659ae2b44a85fc79b363aebc45db3266233319949ebd5384dbf4f1d0d633a949); /* line */ 
        coverage_0xf62059a8(0xf35413b8b46f5761aa4100f8e58a779a6e82ec4dff7ae3be26b90199ad8fdc10); /* assertPre */ 
coverage_0xf62059a8(0x10eb1d8c88c64a2c691a1db7bb51cc929473fd9a2239c0aca94a69c0fd34bbce); /* statement */ 
assert(args.actionType == ActionType.Withdraw);coverage_0xf62059a8(0x253ac8c84a1267e3e2566995e55ee25520ae563cede32fd9ac632ba96548f20d); /* assertPost */ 

coverage_0xf62059a8(0x28ee1204c942ac3f654dd371fcf7481ac0663b9b1f538b36febbb2834a2fb311); /* line */ 
        coverage_0xf62059a8(0x542b04ae454ce3450ae30a3030905b76d3b25d6cb02ec0b831c945c860e863b4); /* statement */ 
return WithdrawArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            market: args.primaryMarketId,
            to: args.otherAddress
        });
    }

    function parseTransferArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (TransferArgs memory)
    {coverage_0xf62059a8(0x283b58bb48a4cd5607115802719e6fed6731430a1b1d8f747b7bac7fe7ebb93b); /* function */ 

coverage_0xf62059a8(0x4bdc79a437537484629825df1074ff14336b72fa816bf2d634eb0aa6d2c9fb4b); /* line */ 
        coverage_0xf62059a8(0x780274c639dda3cabaf51ab37d9311bdb4142a8c5e4328065f786e86b30cfaa5); /* assertPre */ 
coverage_0xf62059a8(0x3a4032d9f2848c060f80021a19c745e51e600420ce708e50f8e2663e1a6240d9); /* statement */ 
assert(args.actionType == ActionType.Transfer);coverage_0xf62059a8(0xdaa36a31b1bb92e97f5b4772ac95d2e2bce25481e0ca264963ec530d6c64e3bd); /* assertPost */ 

coverage_0xf62059a8(0x57b4f47cd44aaf534a6151a8d58799845de2170992fd8303c602e2ba4d5b1fc6); /* line */ 
        coverage_0xf62059a8(0x66e87eacef2cea8d4b3dfb5119a4fa016c95ac456d30ba6cfa7e7c2e5f27471e); /* statement */ 
return TransferArgs({
            amount: args.amount,
            accountOne: accounts[args.accountId],
            accountTwo: accounts[args.otherAccountId],
            market: args.primaryMarketId
        });
    }

    function parseBuyArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (BuyArgs memory)
    {coverage_0xf62059a8(0x72c801b620930dee94f95fae087d7d22bfb0ef5776b1bc71b004a036e3438776); /* function */ 

coverage_0xf62059a8(0xab8396390c630ceeec57d1efa0385e38dc591cb35647715a77fc5a6f7abe30b1); /* line */ 
        coverage_0xf62059a8(0xed5654c438c5c25f9ed6cd05a9fe89f1112a58282d0d527080d5dbc87084ff60); /* assertPre */ 
coverage_0xf62059a8(0x8247f984979443660e9d21e67a9e9a838caf3fe1b6c478ab1f4a24daf80f9c8f); /* statement */ 
assert(args.actionType == ActionType.Buy);coverage_0xf62059a8(0x48d91b39d13be9ae2f466cb654ebb550870d213f93a3e8a446b3704fb0f19c61); /* assertPost */ 

coverage_0xf62059a8(0x4272ba7a85e7113f15ab2c89445e5b9bf232bd0b5be7af926d1a37e583924aa1); /* line */ 
        coverage_0xf62059a8(0x6f15cc1c2a0e9dbb22ba6aa57f03240ef3e793276931cd7a6d7e60717679adcc); /* statement */ 
return BuyArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            makerMarket: args.primaryMarketId,
            takerMarket: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseSellArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (SellArgs memory)
    {coverage_0xf62059a8(0xb073efaee1aee8316bad349d48a7c1421b7b6b302cb11745eff36fcddae57079); /* function */ 

coverage_0xf62059a8(0x964366095b432824a7d14b91e611da376af515aaa97182d304aa750fe64ccce4); /* line */ 
        coverage_0xf62059a8(0x0974abd3455b858e8444385cb01b2169d35744f14c7fc29807ece3ba933b5bea); /* assertPre */ 
coverage_0xf62059a8(0xfa0f0978632181bde214dfb898dd92b6c2d1109e44f27293d0fc5a1023c2343a); /* statement */ 
assert(args.actionType == ActionType.Sell);coverage_0xf62059a8(0x319dd22a9a9025d6db3fa394de1b579c69463db20af82e88bd5d6bb0555c8936); /* assertPost */ 

coverage_0xf62059a8(0x3ff96067c0f8fead8e9df55cd62b250a4c4de0b9d71f9bf4f3a8e65c7dcd8b78); /* line */ 
        coverage_0xf62059a8(0x0e7e45dee6e7ed2b830f09aed50fed69f5bf9a303e4144beb39c1e07189ffb4f); /* statement */ 
return SellArgs({
            amount: args.amount,
            account: accounts[args.accountId],
            takerMarket: args.primaryMarketId,
            makerMarket: args.secondaryMarketId,
            exchangeWrapper: args.otherAddress,
            orderData: args.data
        });
    }

    function parseTradeArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (TradeArgs memory)
    {coverage_0xf62059a8(0xd237ed079089c97c91431c76ebd66b997667090abe1ef7f981207b8f65f5e20e); /* function */ 

coverage_0xf62059a8(0x1a5b06613adbb2ca284c401c4f8ca42117734a0587c8b9d89a58505b192cb31a); /* line */ 
        coverage_0xf62059a8(0x8740df4285d8ec1b975f1fac7ee40209f2a46c15339e9b53dbb35fab22fb84f3); /* assertPre */ 
coverage_0xf62059a8(0x47208c2f02470b96f8d3a267159f36c7dbf5c691794716bbf5aaa857073690b5); /* statement */ 
assert(args.actionType == ActionType.Trade);coverage_0xf62059a8(0x86625f1ff898f05fb5ddf61102038980df2d4fb9223370979f3e7635ba28f81a); /* assertPost */ 

coverage_0xf62059a8(0x8c0c2be6d16c3e5a188f346553487cf13c67a3bd46f307124abd1a91832261e1); /* line */ 
        coverage_0xf62059a8(0x2c49fa35357f04c1281dd1123e6a2da4654c2c6ea55c3505938caa7f29aa4d09); /* statement */ 
return TradeArgs({
            amount: args.amount,
            takerAccount: accounts[args.accountId],
            makerAccount: accounts[args.otherAccountId],
            inputMarket: args.primaryMarketId,
            outputMarket: args.secondaryMarketId,
            autoTrader: args.otherAddress,
            tradeData: args.data
        });
    }

    function parseLiquidateArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (LiquidateArgs memory)
    {coverage_0xf62059a8(0xd048a428d98df76bbf433db0ee1b3d7109d59813ee920c1621754463631b12a2); /* function */ 

coverage_0xf62059a8(0x69ffe1f39ebd0ba79e2821587acc557d8984362352808d8e6eae965ef4e93934); /* line */ 
        coverage_0xf62059a8(0xf84aac3b8fc31f1bcd78cb822a8d1f6e168d8843976fecd89627316873c138d1); /* assertPre */ 
coverage_0xf62059a8(0x741c3cf7829bcc52f32abbb78dbb1643f382e4252f21d289b931826382478be4); /* statement */ 
assert(args.actionType == ActionType.Liquidate);coverage_0xf62059a8(0x090dd3d18305e2893b705aebf0d961d8cf8bc6df2ee20727c1609536224679d7); /* assertPost */ 

coverage_0xf62059a8(0x4f43dd72f6787e0009b92cdc4bacd714316753b2905e340ec0dd221367305fdc); /* line */ 
        coverage_0xf62059a8(0x79c74e0630949e3c0a40ae270b1f58050d5a12ce9940c25b962e1039d97dc5a9); /* statement */ 
return LiquidateArgs({
            amount: args.amount,
            solidAccount: accounts[args.accountId],
            liquidAccount: accounts[args.otherAccountId],
            owedMarket: args.primaryMarketId,
            heldMarket: args.secondaryMarketId
        });
    }

    function parseVaporizeArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (VaporizeArgs memory)
    {coverage_0xf62059a8(0x96ff688eb939f05341680c416854546665468d9f759a33312dce711cc558a235); /* function */ 

coverage_0xf62059a8(0xa905aa7a49306d8499c82c3db302564ec12f9f2981740ec86eb0fdc6f3814a95); /* line */ 
        coverage_0xf62059a8(0xc61d92c3a7fe011d3c1f2aa08562f79a2ce5c9f215eb9428c36f3b6809b26fcf); /* assertPre */ 
coverage_0xf62059a8(0x91180a7fb06a9cc58e1f58820c1244d3d57147f3d708377d5687470e9015c8c0); /* statement */ 
assert(args.actionType == ActionType.Vaporize);coverage_0xf62059a8(0x61198993e13d43518e64dc7d7d638ff8fe4d481d1c5a354ecb4f921980f8720b); /* assertPost */ 

coverage_0xf62059a8(0xc7b06e038f188e3f2ec8805d3689c483fd981ca27aa162f2565a78eff3c8fd03); /* line */ 
        coverage_0xf62059a8(0xd1571347c0e242883e0341aaae0a3fd6c7e1e4e40afe29782eeeaa77d220fcde); /* statement */ 
return VaporizeArgs({
            amount: args.amount,
            solidAccount: accounts[args.accountId],
            vaporAccount: accounts[args.otherAccountId],
            owedMarket: args.primaryMarketId,
            heldMarket: args.secondaryMarketId
        });
    }

    function parseCallArgs(
        Account.Info[] memory accounts,
        ActionArgs memory args
    )
        internal
        pure
        returns (CallArgs memory)
    {coverage_0xf62059a8(0x12d4ca541e893b0137cefe0503fc28407da4fc737e094894d120992d9f678ae5); /* function */ 

coverage_0xf62059a8(0xb36825c285aa9101984090dbf6887aeb4ca3d39b0bed47c680fe1ea6c5ec3fe3); /* line */ 
        coverage_0xf62059a8(0xa5988fa611d9abac3f516466f97529fd273bf055e6ca81279d8bae63354c8308); /* assertPre */ 
coverage_0xf62059a8(0xf760dc1276c646e9e2b283ab6715eb119d30ad41e3a0226ffcef73639f9122d3); /* statement */ 
assert(args.actionType == ActionType.Call);coverage_0xf62059a8(0xba5b8094b59dcc55ebf46ec0e758dfba06f32f0fcf36fbef830efb89abf1c12e); /* assertPost */ 

coverage_0xf62059a8(0xa85457f652a5298aa994b3c9bb9167134f9cc5d9b96b734ed78d8f46cb12856e); /* line */ 
        coverage_0xf62059a8(0xcca8b34fdba3010c7524554acac518a591bb2fec66bf3b3f3c6ddb292e2b3a9f); /* statement */ 
return CallArgs({
            account: accounts[args.accountId],
            callee: args.otherAddress,
            data: args.data
        });
    }
}
