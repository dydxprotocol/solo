"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerStablecoinPriceOracle = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Constants_1 = require("../../lib/Constants");
var MakerStablecoinPriceOracle = /** @class */ (function () {
    function MakerStablecoinPriceOracle(contracts, oracleContract) {
        this.contracts = contracts;
        this.oracleContract = oracleContract;
    }
    // ============ Admin ============
    MakerStablecoinPriceOracle.prototype.setPokerAddress = function (newPoker, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callContractFunction(this.oracleContract.methods.ownerSetPokerAddress(newPoker), options)];
            });
        });
    };
    // ============ Setters ============
    MakerStablecoinPriceOracle.prototype.updatePrice = function (minimum, maximum, options) {
        return __awaiter(this, void 0, void 0, function () {
            var minimumArg, maximumArg;
            return __generator(this, function (_a) {
                minimumArg = minimum ? minimum : Constants_1.INTEGERS.ZERO;
                maximumArg = maximum ? maximum : Constants_1.INTEGERS.ONES_255;
                return [2 /*return*/, this.contracts.callContractFunction(this.oracleContract.methods.updatePrice({ value: minimumArg.toFixed(0) }, { value: maximumArg.toFixed(0) }), options)];
            });
        });
    };
    // ============ Getters ============
    MakerStablecoinPriceOracle.prototype.getOwner = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.owner(), options)];
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getPoker = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var poker;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.g_poker(), options)];
                    case 1:
                        poker = _a.sent();
                        return [2 /*return*/, poker];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getPrice = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getPrice(Constants_1.ADDRESSES.ZERO), options)];
                    case 1:
                        price = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getPriceInfo = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var priceInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.g_priceInfo(), options)];
                    case 1:
                        priceInfo = _a.sent();
                        return [2 /*return*/, {
                                price: new bignumber_js_1.default(priceInfo.price),
                                lastUpdate: new bignumber_js_1.default(priceInfo.lastUpdate),
                            }];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getBoundedTargetPrice = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getBoundedTargetPrice(), options)];
                    case 1:
                        price = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getTargetPrice = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getTargetPrice(), options)];
                    case 1:
                        price = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getMedianizerPrice = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getMedianizerPrice(), options)];
                    case 1:
                        price = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getOasisPrice = function (ethUsdPrice, options) {
        return __awaiter(this, void 0, void 0, function () {
            var queryPrice, _a, price;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!ethUsdPrice) return [3 /*break*/, 1];
                        _a = ethUsdPrice;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getMedianizerPrice()];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        queryPrice = _a;
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getOasisPrice({ value: queryPrice.toFixed(0) }), options)];
                    case 4:
                        price = _b.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getUniswapPrice = function (ethUsdPrice, options) {
        return __awaiter(this, void 0, void 0, function () {
            var queryPrice, _a, price;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!ethUsdPrice) return [3 /*break*/, 1];
                        _a = ethUsdPrice;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getMedianizerPrice()];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        queryPrice = _a;
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.getUniswapPrice({ value: queryPrice.toFixed(0) }), options)];
                    case 4:
                        price = _b.sent();
                        return [2 /*return*/, new bignumber_js_1.default(price.value)];
                }
            });
        });
    };
    MakerStablecoinPriceOracle.prototype.getDeviationParams = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.callConstantContractFunction(this.oracleContract.methods.DEVIATION_PARAMS(), options)];
                    case 1:
                        params = _a.sent();
                        return [2 /*return*/, {
                                maximumPerSecond: new bignumber_js_1.default(params.maximumPerSecond).div(params.denominator),
                                maximumAbsolute: new bignumber_js_1.default(params.maximumAbsolute).div(params.denominator),
                            }];
                }
            });
        });
    };
    return MakerStablecoinPriceOracle;
}());
exports.MakerStablecoinPriceOracle = MakerStablecoinPriceOracle;
//# sourceMappingURL=MakerStablecoinPriceOracle.js.map