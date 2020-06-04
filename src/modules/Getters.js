"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Getters = void 0;
var bignumber_js_1 = require("bignumber.js");
var types_1 = require("../types");
var Helpers_1 = require("../lib/Helpers");
var Getters = /** @class */ (function () {
    function Getters(contracts) {
        this.contracts = contracts;
    }
    // ============ Getters for Risk ============
    Getters.prototype.getMarginRatio = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarginRatio(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(result.value)];
                }
            });
        });
    };
    Getters.prototype.getLiquidationSpread = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getLiquidationSpread(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(result.value)];
                }
            });
        });
    };
    Getters.prototype.getEarningsRate = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getEarningsRate(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(result.value)];
                }
            });
        });
    };
    Getters.prototype.getMinBorrowedValue = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMinBorrowedValue(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.BigNumber(result.value)];
                }
            });
        });
    };
    Getters.prototype.getRiskParams = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getRiskParams(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                marginRatio: Helpers_1.stringToDecimal(result[0].value),
                                liquidationSpread: Helpers_1.stringToDecimal(result[1].value),
                                earningsRate: Helpers_1.stringToDecimal(result[2].value),
                                minBorrowedValue: new bignumber_js_1.BigNumber(result[3].value),
                            }];
                }
            });
        });
    };
    Getters.prototype.getRiskLimits = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getRiskLimits(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                marginRatioMax: Helpers_1.stringToDecimal(result[0]),
                                liquidationSpreadMax: Helpers_1.stringToDecimal(result[1]),
                                earningsRateMax: Helpers_1.stringToDecimal(result[2]),
                                marginPremiumMax: Helpers_1.stringToDecimal(result[3]),
                                spreadPremiumMax: Helpers_1.stringToDecimal(result[4]),
                                minBorrowedValueMax: new bignumber_js_1.BigNumber(result[5]),
                            }];
                }
            });
        });
    };
    // ============ Getters for Markets ============
    Getters.prototype.getNumMarkets = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getNumMarkets(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.BigNumber(result)];
                }
            });
        });
    };
    Getters.prototype.getMarketTokenAddress = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketTokenAddress(marketId.toFixed(0)), options)];
            });
        });
    };
    Getters.prototype.getMarketTotalPar = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketTotalPar(marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                borrow: new bignumber_js_1.BigNumber(result[0]),
                                supply: new bignumber_js_1.BigNumber(result[1]),
                            }];
                }
            });
        });
    };
    Getters.prototype.getMarketCachedIndex = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketCachedIndex(marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.parseIndex(result)];
                }
            });
        });
    };
    Getters.prototype.getMarketCurrentIndex = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketCurrentIndex(marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.parseIndex(result)];
                }
            });
        });
    };
    Getters.prototype.getMarketPriceOracle = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketPriceOracle(marketId.toFixed(0)), options)];
            });
        });
    };
    Getters.prototype.getMarketInterestSetter = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketInterestSetter(marketId.toFixed(0)), options)];
            });
        });
    };
    Getters.prototype.getMarketMarginPremium = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var marginPremium;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketMarginPremium(marketId.toFixed(0)), options)];
                    case 1:
                        marginPremium = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(marginPremium.value)];
                }
            });
        });
    };
    Getters.prototype.getMarketSpreadPremium = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spreadPremium;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketSpreadPremium(marketId.toFixed(0)), options)];
                    case 1:
                        spreadPremium = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(spreadPremium.value)];
                }
            });
        });
    };
    Getters.prototype.getMarketIsClosing = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketIsClosing(marketId.toFixed(0)), options)];
            });
        });
    };
    Getters.prototype.getMarketPrice = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketPrice(marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.BigNumber(result.value)];
                }
            });
        });
    };
    Getters.prototype.getMarketUtilization = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var market, totalSupply, totalBorrow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMarket(marketId, options)];
                    case 1:
                        market = _a.sent();
                        totalSupply = market.totalPar.supply.times(market.index.supply);
                        totalBorrow = market.totalPar.borrow.times(market.index.borrow);
                        return [2 /*return*/, totalBorrow.div(totalSupply)];
                }
            });
        });
    };
    Getters.prototype.getMarketInterestRate = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketInterestRate(marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(result.value)];
                }
            });
        });
    };
    Getters.prototype.getMarketSupplyInterestRate = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, earningsRate, borrowInterestRate, utilization;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getEarningsRate(options),
                            this.getMarketInterestRate(marketId, options),
                            this.getMarketUtilization(marketId, options),
                        ])];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 3]), earningsRate = _a[0], borrowInterestRate = _a[1], utilization = _a[2];
                        return [2 /*return*/, borrowInterestRate.times(earningsRate).times(utilization)];
                }
            });
        });
    };
    Getters.prototype.getLiquidationSpreadForPair = function (heldMarketId, owedMarketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spread;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getLiquidationSpreadForPair(heldMarketId.toFixed(0), owedMarketId.toFixed(0)), options)];
                    case 1:
                        spread = _a.sent();
                        return [2 /*return*/, Helpers_1.stringToDecimal(spread.value)];
                }
            });
        });
    };
    Getters.prototype.getMarket = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var market;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarket(marketId.toFixed(0)), options)];
                    case 1:
                        market = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, market), { totalPar: this.parseTotalPar(market.totalPar), index: this.parseIndex(market.index), marginPremium: Helpers_1.stringToDecimal(market.marginPremium.value), spreadPremium: Helpers_1.stringToDecimal(market.spreadPremium.value) })];
                }
            });
        });
    };
    Getters.prototype.getMarketWithInfo = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var marketWithInfo, market, currentIndex, currentPrice, currentInterestRate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getMarketWithInfo(marketId.toFixed(0)), options)];
                    case 1:
                        marketWithInfo = _a.sent();
                        market = marketWithInfo[0];
                        currentIndex = marketWithInfo[1];
                        currentPrice = marketWithInfo[2];
                        currentInterestRate = marketWithInfo[3];
                        return [2 /*return*/, {
                                market: __assign(__assign({}, market), { totalPar: this.parseTotalPar(market.totalPar), index: this.parseIndex(market.index), marginPremium: Helpers_1.stringToDecimal(market.marginPremium.value), spreadPremium: Helpers_1.stringToDecimal(market.spreadPremium.value) }),
                                currentIndex: this.parseIndex(currentIndex),
                                currentPrice: new bignumber_js_1.BigNumber(currentPrice.value),
                                currentInterestRate: Helpers_1.stringToDecimal(currentInterestRate.value),
                            }];
                }
            });
        });
    };
    Getters.prototype.getNumExcessTokens = function (marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var numExcessTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getNumExcessTokens(marketId.toFixed(0)), options)];
                    case 1:
                        numExcessTokens = _a.sent();
                        return [2 /*return*/, Helpers_1.valueToInteger(numExcessTokens)];
                }
            });
        });
    };
    // ============ Getters for Accounts ============
    Getters.prototype.getAccountPar = function (accountOwner, accountNumber, marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAccountPar({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }, marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.valueToInteger(result)];
                }
            });
        });
    };
    Getters.prototype.getAccountWei = function (accountOwner, accountNumber, marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAccountWei({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }, marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, Helpers_1.valueToInteger(result)];
                }
            });
        });
    };
    Getters.prototype.getAccountStatus = function (accountOwner, accountNumber, options) {
        return __awaiter(this, void 0, void 0, function () {
            var rawStatus;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAccountStatus({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }), options)];
                    case 1:
                        rawStatus = _a.sent();
                        switch (rawStatus) {
                            case '0':
                                return [2 /*return*/, types_1.AccountStatus.Normal];
                            case '1':
                                return [2 /*return*/, types_1.AccountStatus.Liquidating];
                            case '2':
                                return [2 /*return*/, types_1.AccountStatus.Vaporizing];
                            default:
                                throw new Error('invalid account status ${rawStatus}');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Getters.prototype.getAccountValues = function (accountOwner, accountNumber, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAccountValues({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                supply: new bignumber_js_1.BigNumber(result[0].value),
                                borrow: new bignumber_js_1.BigNumber(result[1].value),
                            }];
                }
            });
        });
    };
    Getters.prototype.getAdjustedAccountValues = function (accountOwner, accountNumber, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAdjustedAccountValues({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                supply: new bignumber_js_1.BigNumber(result[0].value),
                                borrow: new bignumber_js_1.BigNumber(result[1].value),
                            }];
                }
            });
        });
    };
    Getters.prototype.getAccountBalances = function (accountOwner, accountNumber, options) {
        return __awaiter(this, void 0, void 0, function () {
            var balances, tokens, pars, weis, result, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getAccountBalances({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }), options)];
                    case 1:
                        balances = _a.sent();
                        tokens = balances[0];
                        pars = balances[1];
                        weis = balances[2];
                        result = [];
                        for (i = 0; i < tokens.length; i += 1) {
                            result.push({
                                tokenAddress: tokens[i],
                                par: Helpers_1.valueToInteger(pars[i]),
                                wei: Helpers_1.valueToInteger(weis[i]),
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Getters.prototype.isAccountLiquidatable = function (liquidOwner, liquidNumber, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, accountStatus, marginRatio, accountValues, marginRequirement;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getAccountStatus(liquidOwner, liquidNumber),
                            this.getMarginRatio(options),
                            this.getAdjustedAccountValues(liquidOwner, liquidNumber, options),
                        ])];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 3]), accountStatus = _a[0], marginRatio = _a[1], accountValues = _a[2];
                        // return true if account has been partially liquidated
                        if (accountValues.borrow.gt(0) &&
                            accountValues.supply.gt(0) &&
                            accountStatus === types_1.AccountStatus.Liquidating) {
                            return [2 /*return*/, true];
                        }
                        // return false if account is vaporizable
                        if (accountValues.supply.isZero()) {
                            return [2 /*return*/, false];
                        }
                        marginRequirement = accountValues.borrow.times(marginRatio);
                        return [2 /*return*/, accountValues.supply.lt(accountValues.borrow.plus(marginRequirement))];
                }
            });
        });
    };
    // ============ Getters for Permissions ============
    Getters.prototype.getIsLocalOperator = function (owner, operator, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getIsLocalOperator(owner, operator), options)];
            });
        });
    };
    Getters.prototype.getIsGlobalOperator = function (operator, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.getIsGlobalOperator(operator), options)];
            });
        });
    };
    // ============ Getters for Admin ============
    Getters.prototype.getAdmin = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.soloMargin.methods.owner(), options)];
            });
        });
    };
    // ============ Getters for Expiry ============
    Getters.prototype.getExpiryAdmin = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.expiry.methods.owner(), options)];
            });
        });
    };
    Getters.prototype.getExpiry = function (accountOwner, accountNumber, marketId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.expiry.methods.getExpiry({
                            owner: accountOwner,
                            number: accountNumber.toFixed(0),
                        }, marketId.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.BigNumber(result)];
                }
            });
        });
    };
    Getters.prototype.getExpiryPrices = function (heldMarketId, owedMarketId, expiryTimestamp, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.expiry.methods.getSpreadAdjustedPrices(heldMarketId.toFixed(0), owedMarketId.toFixed(0), expiryTimestamp.toFixed(0)), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                heldPrice: new bignumber_js_1.BigNumber(result[0].value),
                                owedPrice: new bignumber_js_1.BigNumber(result[1].value),
                            }];
                }
            });
        });
    };
    Getters.prototype.getExpiryRampTime = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.expiry.methods.g_expiryRampTime(), options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.BigNumber(result)];
                }
            });
        });
    };
    // ============ Helper Functions ============
    Getters.prototype.parseIndex = function (_a) {
        var borrow = _a.borrow, supply = _a.supply, lastUpdate = _a.lastUpdate;
        return {
            borrow: Helpers_1.stringToDecimal(borrow),
            supply: Helpers_1.stringToDecimal(supply),
            lastUpdate: new bignumber_js_1.BigNumber(lastUpdate),
        };
    };
    Getters.prototype.parseTotalPar = function (_a) {
        var supply = _a.supply, borrow = _a.borrow;
        return {
            borrow: new bignumber_js_1.BigNumber(borrow),
            supply: new bignumber_js_1.BigNumber(supply),
        };
    };
    return Getters;
}());
exports.Getters = Getters;
//# sourceMappingURL=Getters.js.map