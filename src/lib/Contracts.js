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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contracts = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
// JSON
var SoloMargin_json_1 = __importDefault(require("../../build/published_contracts/SoloMargin.json"));
var IERC20_json_1 = __importDefault(require("../../build/published_contracts/IERC20.json"));
var IInterestSetter_json_1 = __importDefault(require("../../build/published_contracts/IInterestSetter.json"));
var IPriceOracle_json_1 = __importDefault(require("../../build/published_contracts/IPriceOracle.json"));
var Expiry_json_1 = __importDefault(require("../../build/published_contracts/Expiry.json"));
var ExpiryV2_json_1 = __importDefault(require("../../build/published_contracts/ExpiryV2.json"));
var Refunder_json_1 = __importDefault(require("../../build/published_contracts/Refunder.json"));
var DaiMigrator_json_1 = __importDefault(require("../../build/published_contracts/DaiMigrator.json"));
var LimitOrders_json_1 = __importDefault(require("../../build/published_contracts/LimitOrders.json"));
var StopLimitOrders_json_1 = __importDefault(require("../../build/published_contracts/StopLimitOrders.json"));
var CanonicalOrders_json_1 = __importDefault(require("../../build/published_contracts/CanonicalOrders.json"));
var PayableProxyForSoloMargin_json_1 = __importDefault(require("../../build/published_contracts/PayableProxyForSoloMargin.json"));
var SignedOperationProxy_json_1 = __importDefault(require("../../build/published_contracts/SignedOperationProxy.json"));
var LiquidatorProxyV1ForSoloMargin_json_1 = __importDefault(require("../../build/published_contracts/LiquidatorProxyV1ForSoloMargin.json"));
var PolynomialInterestSetter_json_1 = __importDefault(require("../../build/published_contracts/PolynomialInterestSetter.json"));
var DoubleExponentInterestSetter_json_1 = __importDefault(require("../../build/published_contracts/DoubleExponentInterestSetter.json"));
var WethPriceOracle_json_1 = __importDefault(require("../../build/published_contracts/WethPriceOracle.json"));
var DaiPriceOracle_json_1 = __importDefault(require("../../build/published_contracts/DaiPriceOracle.json"));
var UsdcPriceOracle_json_1 = __importDefault(require("../../build/published_contracts/UsdcPriceOracle.json"));
var ChainlinkPriceOracleV1_json_1 = __importDefault(require("../../build/published_contracts/ChainlinkPriceOracleV1.json"));
var Weth_json_1 = __importDefault(require("../../build/published_contracts/Weth.json"));
var Constants_1 = require("./Constants");
var types_1 = require("../types");
var Contracts = /** @class */ (function () {
    function Contracts(provider, networkId, web3, options) {
        this.web3 = web3;
        this.defaultConfirmations = options.defaultConfirmations;
        this.autoGasMultiplier = options.autoGasMultiplier || 1.5;
        this.confirmationType = options.confirmationType || types_1.ConfirmationType.Confirmed;
        this.defaultGas = options.defaultGas;
        this.defaultGasPrice = options.defaultGasPrice;
        this.blockGasLimit = options.blockGasLimit;
        // Contracts
        this.soloMargin = new this.web3.eth.Contract(SoloMargin_json_1.default.abi);
        this.erc20 = new this.web3.eth.Contract(IERC20_json_1.default.abi);
        this.interestSetter = new this.web3.eth.Contract(IInterestSetter_json_1.default.abi);
        this.priceOracle = new this.web3.eth.Contract(IPriceOracle_json_1.default.abi);
        this.expiry = new this.web3.eth.Contract(Expiry_json_1.default.abi);
        this.expiryV2 = new this.web3.eth.Contract(ExpiryV2_json_1.default.abi);
        this.refunder = new this.web3.eth.Contract(Refunder_json_1.default.abi);
        this.daiMigrator = new this.web3.eth.Contract(DaiMigrator_json_1.default.abi);
        this.limitOrders = new this.web3.eth.Contract(LimitOrders_json_1.default.abi);
        this.stopLimitOrders = new this.web3.eth.Contract(StopLimitOrders_json_1.default.abi);
        this.canonicalOrders = new this.web3.eth.Contract(CanonicalOrders_json_1.default.abi);
        this.payableProxy = new this.web3.eth.Contract(PayableProxyForSoloMargin_json_1.default.abi);
        this.signedOperationProxy = new this.web3.eth.Contract(SignedOperationProxy_json_1.default.abi);
        this.liquidatorProxyV1 = new this.web3.eth.Contract(LiquidatorProxyV1ForSoloMargin_json_1.default.abi);
        this.polynomialInterestSetter = new this.web3.eth.Contract(PolynomialInterestSetter_json_1.default.abi);
        this.doubleExponentInterestSetter = new this.web3.eth.Contract(DoubleExponentInterestSetter_json_1.default.abi);
        this.wethPriceOracle = new this.web3.eth.Contract(WethPriceOracle_json_1.default.abi);
        this.daiPriceOracle = new this.web3.eth.Contract(DaiPriceOracle_json_1.default.abi);
        this.saiPriceOracle = new this.web3.eth.Contract(DaiPriceOracle_json_1.default.abi);
        this.usdcPriceOracle = new this.web3.eth.Contract(UsdcPriceOracle_json_1.default.abi);
        this.chainlinkPriceOracleV1 = new this.web3.eth.Contract(ChainlinkPriceOracleV1_json_1.default.abi);
        this.weth = new this.web3.eth.Contract(Weth_json_1.default.abi);
        this.setProvider(provider, networkId);
        this.setDefaultAccount(this.web3.eth.defaultAccount);
    }
    Contracts.prototype.setProvider = function (provider, networkId) {
        var _this = this;
        this.soloMargin.setProvider(provider);
        var contracts = [
            // contracts
            { contract: this.soloMargin, json: SoloMargin_json_1.default },
            { contract: this.erc20, json: IERC20_json_1.default },
            { contract: this.interestSetter, json: IInterestSetter_json_1.default },
            { contract: this.priceOracle, json: IPriceOracle_json_1.default },
            { contract: this.expiry, json: Expiry_json_1.default },
            { contract: this.expiryV2, json: ExpiryV2_json_1.default },
            { contract: this.refunder, json: Refunder_json_1.default },
            { contract: this.daiMigrator, json: DaiMigrator_json_1.default },
            { contract: this.limitOrders, json: LimitOrders_json_1.default },
            { contract: this.stopLimitOrders, json: StopLimitOrders_json_1.default },
            { contract: this.canonicalOrders, json: CanonicalOrders_json_1.default },
            { contract: this.payableProxy, json: PayableProxyForSoloMargin_json_1.default },
            { contract: this.signedOperationProxy, json: SignedOperationProxy_json_1.default },
            { contract: this.liquidatorProxyV1, json: LiquidatorProxyV1ForSoloMargin_json_1.default },
            { contract: this.polynomialInterestSetter, json: PolynomialInterestSetter_json_1.default },
            { contract: this.doubleExponentInterestSetter, json: DoubleExponentInterestSetter_json_1.default },
            { contract: this.wethPriceOracle, json: WethPriceOracle_json_1.default },
            { contract: this.daiPriceOracle, json: DaiPriceOracle_json_1.default },
            { contract: this.saiPriceOracle, json: DaiPriceOracle_json_1.default, overrides: {
                    1: '0x787F552BDC17332c98aA360748884513e3cB401a',
                    42: '0x8a6629fEba4196E0A61B8E8C94D4905e525bc055',
                    1001: Constants_1.ADDRESSES.TEST_SAI_PRICE_ORACLE,
                    1002: Constants_1.ADDRESSES.TEST_SAI_PRICE_ORACLE,
                } },
            { contract: this.usdcPriceOracle, json: UsdcPriceOracle_json_1.default },
            { contract: this.chainlinkPriceOracleV1, json: ChainlinkPriceOracleV1_json_1.default },
            { contract: this.weth, json: Weth_json_1.default },
        ];
        contracts.forEach(function (contract) { return _this.setContractProvider(contract.contract, contract.json, provider, networkId, contract.overrides); });
    };
    Contracts.prototype.setDefaultAccount = function (account) {
        // Contracts
        this.soloMargin.options.from = account;
        this.erc20.options.from = account;
        this.interestSetter.options.from = account;
        this.priceOracle.options.from = account;
        this.expiry.options.from = account;
        this.expiryV2.options.from = account;
        this.refunder.options.from = account;
        this.daiMigrator.options.from = account;
        this.limitOrders.options.from = account;
        this.stopLimitOrders.options.from = account;
        this.canonicalOrders.options.from = account;
        this.payableProxy.options.from = account;
        this.signedOperationProxy.options.from = account;
        this.liquidatorProxyV1.options.from = account;
        this.polynomialInterestSetter.options.from = account;
        this.doubleExponentInterestSetter.options.from = account;
        this.wethPriceOracle.options.from = account;
        this.daiPriceOracle.options.from = account;
        this.saiPriceOracle.options.from = account;
        this.usdcPriceOracle.options.from = account;
        this.chainlinkPriceOracleV1.options.from = account;
        this.weth.options.from = account;
    };
    Contracts.prototype.callContractFunction = function (method, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var confirmations, confirmationType, autoGasMultiplier, txOptions, gasEstimate, error_1, data, from, value, to, multiplier, totalGas, promi, OUTCOMES, hashOutcome, confirmationOutcome, t, hashPromise, confirmationPromise, transactionHash_1, transactionHash;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        confirmations = options.confirmations, confirmationType = options.confirmationType, autoGasMultiplier = options.autoGasMultiplier, txOptions = __rest(options, ["confirmations", "confirmationType", "autoGasMultiplier"]);
                        if (!!this.blockGasLimit) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.setGasLimit()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!txOptions.gasPrice && this.defaultGasPrice) {
                            txOptions.gasPrice = this.defaultGasPrice;
                        }
                        if (!(confirmationType === types_1.ConfirmationType.Simulate || !options.gas)) return [3 /*break*/, 8];
                        gasEstimate = void 0;
                        if (!(this.defaultGas && confirmationType !== types_1.ConfirmationType.Simulate)) return [3 /*break*/, 3];
                        txOptions.gas = this.defaultGas;
                        return [3 /*break*/, 7];
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, method.estimateGas(txOptions)];
                    case 4:
                        gasEstimate = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        data = method.encodeABI();
                        from = options.from, value = options.value;
                        to = method._parent._address;
                        error_1.transactionData = { from: from, value: value, data: data, to: to };
                        throw error_1;
                    case 6:
                        multiplier = autoGasMultiplier || this.autoGasMultiplier;
                        totalGas = Math.floor(gasEstimate * multiplier);
                        txOptions.gas = totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
                        _a.label = 7;
                    case 7:
                        if (confirmationType === types_1.ConfirmationType.Simulate) {
                            return [2 /*return*/, { gasEstimate: gasEstimate, gas: Number(txOptions.gas) }];
                        }
                        _a.label = 8;
                    case 8:
                        if (txOptions.value) {
                            txOptions.value = new bignumber_js_1.default(txOptions.value).toFixed(0);
                        }
                        else {
                            txOptions.value = '0';
                        }
                        promi = method.send(txOptions);
                        OUTCOMES = {
                            INITIAL: 0,
                            RESOLVED: 1,
                            REJECTED: 2,
                        };
                        hashOutcome = OUTCOMES.INITIAL;
                        confirmationOutcome = OUTCOMES.INITIAL;
                        t = confirmationType !== undefined ? confirmationType : this.confirmationType;
                        if (!Object.values(types_1.ConfirmationType).includes(t)) {
                            throw new Error("Invalid confirmation type: " + t);
                        }
                        if (t === types_1.ConfirmationType.Hash || t === types_1.ConfirmationType.Both) {
                            hashPromise = new Promise(function (resolve, reject) {
                                promi.on('error', function (error) {
                                    if (hashOutcome === OUTCOMES.INITIAL) {
                                        hashOutcome = OUTCOMES.REJECTED;
                                        reject(error);
                                        var anyPromi = promi;
                                        anyPromi.off();
                                    }
                                });
                                promi.on('transactionHash', function (txHash) {
                                    if (hashOutcome === OUTCOMES.INITIAL) {
                                        hashOutcome = OUTCOMES.RESOLVED;
                                        resolve(txHash);
                                        if (t !== types_1.ConfirmationType.Both) {
                                            var anyPromi = promi;
                                            anyPromi.off();
                                        }
                                    }
                                });
                            });
                        }
                        if (t === types_1.ConfirmationType.Confirmed || t === types_1.ConfirmationType.Both) {
                            confirmationPromise = new Promise(function (resolve, reject) {
                                promi.on('error', function (error) {
                                    if ((t === types_1.ConfirmationType.Confirmed || hashOutcome === OUTCOMES.RESOLVED)
                                        && confirmationOutcome === OUTCOMES.INITIAL) {
                                        confirmationOutcome = OUTCOMES.REJECTED;
                                        reject(error);
                                        var anyPromi = promi;
                                        anyPromi.off();
                                    }
                                });
                                var desiredConf = confirmations || _this.defaultConfirmations;
                                if (desiredConf) {
                                    promi.on('confirmation', function (confNumber, receipt) {
                                        if (confNumber >= desiredConf) {
                                            if (confirmationOutcome === OUTCOMES.INITIAL) {
                                                confirmationOutcome = OUTCOMES.RESOLVED;
                                                resolve(receipt);
                                                var anyPromi = promi;
                                                anyPromi.off();
                                            }
                                        }
                                    });
                                }
                                else {
                                    promi.on('receipt', function (receipt) {
                                        confirmationOutcome = OUTCOMES.RESOLVED;
                                        resolve(receipt);
                                        var anyPromi = promi;
                                        anyPromi.off();
                                    });
                                }
                            });
                        }
                        if (!(t === types_1.ConfirmationType.Hash)) return [3 /*break*/, 10];
                        return [4 /*yield*/, hashPromise];
                    case 9:
                        transactionHash_1 = _a.sent();
                        return [2 /*return*/, { transactionHash: transactionHash_1 }];
                    case 10:
                        if (t === types_1.ConfirmationType.Confirmed) {
                            return [2 /*return*/, confirmationPromise];
                        }
                        return [4 /*yield*/, hashPromise];
                    case 11:
                        transactionHash = _a.sent();
                        return [2 /*return*/, {
                                transactionHash: transactionHash,
                                confirmation: confirmationPromise,
                            }];
                }
            });
        });
    };
    Contracts.prototype.callConstantContractFunction = function (method, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var m2, blockNumber, txOptions;
            return __generator(this, function (_a) {
                m2 = method;
                blockNumber = options.blockNumber, txOptions = __rest(options, ["blockNumber"]);
                return [2 /*return*/, m2.call(txOptions, blockNumber)];
            });
        });
    };
    Contracts.prototype.setGasLimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var block;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.web3.eth.getBlock('latest')];
                    case 1:
                        block = _a.sent();
                        this.blockGasLimit = block.gasLimit - Constants_1.SUBTRACT_GAS_LIMIT;
                        return [2 /*return*/];
                }
            });
        });
    };
    Contracts.prototype.setContractProvider = function (contract, contractJson, provider, networkId, overrides) {
        contract.setProvider(provider);
        var contractAddress = contractJson.networks[networkId]
            && contractJson.networks[networkId].address;
        var overrideAddress = overrides && overrides[networkId];
        contract.options.address = overrideAddress || contractAddress;
    };
    return Contracts;
}());
exports.Contracts = Contracts;
//# sourceMappingURL=Contracts.js.map