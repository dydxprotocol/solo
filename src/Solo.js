"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Solo = void 0;
var web3_1 = __importDefault(require("web3"));
var Contracts_1 = require("./lib/Contracts");
var Interest_1 = require("./lib/Interest");
var Operation_1 = require("./modules/operate/Operation");
var Token_1 = require("./modules/Token");
var ExpiryV2_1 = require("./modules/ExpiryV2");
var Oracle_1 = require("./modules/Oracle");
var Weth_1 = require("./modules/Weth");
var Admin_1 = require("./modules/Admin");
var Getters_1 = require("./modules/Getters");
var LimitOrders_1 = require("./modules/LimitOrders");
var StopLimitOrders_1 = require("./modules/StopLimitOrders");
var CanonicalOrders_1 = require("./modules/CanonicalOrders");
var LiquidatorProxy_1 = require("./modules/LiquidatorProxy");
var Logs_1 = require("./modules/Logs");
var SignedOperations_1 = require("./modules/SignedOperations");
var Permissions_1 = require("./modules/Permissions");
var Api_1 = require("./modules/Api");
var Websocket_1 = require("./modules/Websocket");
var StandardActions_1 = require("./modules/StandardActions");
var WalletLogin_1 = require("./modules/WalletLogin");
var types_1 = require("./types");
var Solo = /** @class */ (function () {
    function Solo(provider, networkId, options) {
        var _this = this;
        if (networkId === void 0) { networkId = types_1.Networks.MAINNET; }
        if (options === void 0) { options = {}; }
        var realProvider;
        if (typeof provider === 'string') {
            realProvider = new web3_1.default.providers.HttpProvider(provider, options.ethereumNodeTimeout || 10000);
        }
        else {
            realProvider = provider;
        }
        this.web3 = new web3_1.default(realProvider);
        if (options.defaultAccount) {
            this.web3.eth.defaultAccount = options.defaultAccount;
        }
        this.contracts = this.createContractsModule(realProvider, networkId, this.web3, options);
        this.interest = new Interest_1.Interest(networkId);
        this.token = new Token_1.Token(this.contracts);
        this.expiryV2 = new ExpiryV2_1.ExpiryV2(this.contracts);
        this.oracle = new Oracle_1.Oracle(this.contracts);
        this.weth = new Weth_1.Weth(this.contracts, this.token);
        this.admin = new Admin_1.Admin(this.contracts);
        this.getters = new Getters_1.Getters(this.contracts);
        this.limitOrders = new LimitOrders_1.LimitOrders(this.contracts, this.web3, networkId);
        this.stopLimitOrders = new StopLimitOrders_1.StopLimitOrders(this.contracts, this.web3, networkId);
        this.canonicalOrders = new CanonicalOrders_1.CanonicalOrders(this.contracts, this.web3, networkId);
        this.signedOperations = new SignedOperations_1.SignedOperations(this.contracts, this.web3, networkId);
        this.liquidatorProxy = new LiquidatorProxy_1.LiquidatorProxy(this.contracts);
        this.permissions = new Permissions_1.Permissions(this.contracts);
        this.logs = new Logs_1.Logs(this.contracts, this.web3);
        this.operation = new Operation_1.Operation(this.contracts, this.limitOrders, this.stopLimitOrders, this.canonicalOrders, networkId);
        this.api = new Api_1.Api(this.canonicalOrders, options.apiEndpoint, options.apiTimeout);
        this.websocket = new Websocket_1.Websocket(options.wsTimeout, options.wsEndpoint, options.wsOrigin);
        this.standardActions = new StandardActions_1.StandardActions(this.operation, this.contracts);
        this.walletLogin = new WalletLogin_1.WalletLogin(this.web3, networkId);
        if (options.accounts) {
            options.accounts.forEach(function (a) { return _this.loadAccount(a); });
        }
    }
    Solo.prototype.setProvider = function (provider, networkId) {
        this.web3.setProvider(provider);
        this.contracts.setProvider(provider, networkId);
        this.interest.setNetworkId(networkId);
        this.operation.setNetworkId(networkId);
    };
    Solo.prototype.setDefaultAccount = function (account) {
        this.web3.eth.defaultAccount = account;
        this.contracts.setDefaultAccount(account);
    };
    Solo.prototype.getDefaultAccount = function () {
        return this.web3.eth.defaultAccount;
    };
    Solo.prototype.loadAccount = function (account) {
        var newAccount = this.web3.eth.accounts.wallet.add(account.privateKey);
        if (!newAccount
            || (account.address
                && account.address.toLowerCase() !== newAccount.address.toLowerCase())) {
            throw new Error("Loaded account address mismatch.\n        Expected " + account.address + ", got " + (newAccount ? newAccount.address : null));
        }
    };
    // ============ Helper Functions ============
    Solo.prototype.createContractsModule = function (provider, networkId, web3, options) {
        return new Contracts_1.Contracts(provider, networkId, web3, options);
    };
    return Solo;
}());
exports.Solo = Solo;
//# sourceMappingURL=Solo.js.map