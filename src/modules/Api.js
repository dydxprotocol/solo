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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
var axios_1 = __importDefault(require("axios"));
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var query_string_1 = __importDefault(require("query-string"));
var types_1 = require("../types");
var FOUR_WEEKS_IN_SECONDS = 60 * 60 * 24 * 28;
var DEFAULT_API_ENDPOINT = 'https://api.dydx.exchange';
var DEFAULT_API_TIMEOUT = 10000;
var Api = /** @class */ (function () {
    function Api(canonicalOrders, endpoint, timeout) {
        if (endpoint === void 0) { endpoint = DEFAULT_API_ENDPOINT; }
        if (timeout === void 0) { timeout = DEFAULT_API_TIMEOUT; }
        this.endpoint = endpoint;
        this.canonicalOrders = canonicalOrders;
        this.timeout = timeout;
    }
    Api.prototype.placeCanonicalOrder = function (_a) {
        var _b = _a.order, side = _b.side, market = _b.market, amount = _b.amount, price = _b.price, makerAccountOwner = _b.makerAccountOwner, _c = _b.expiration, expiration = _c === void 0 ? new bignumber_js_1.default(FOUR_WEEKS_IN_SECONDS) : _c, limitFee = _b.limitFee, fillOrKill = _a.fillOrKill, postOnly = _a.postOnly, clientId = _a.clientId, cancelId = _a.cancelId, cancelAmountOnRevert = _a.cancelAmountOnRevert;
        return __awaiter(this, void 0, void 0, function () {
            var order;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.createCanonicalOrder({
                            side: side,
                            market: market,
                            amount: amount,
                            price: price,
                            makerAccountOwner: makerAccountOwner,
                            expiration: expiration,
                            limitFee: limitFee,
                            postOnly: postOnly,
                        })];
                    case 1:
                        order = _d.sent();
                        return [2 /*return*/, this.submitCanonicalOrder({
                                order: order,
                                fillOrKill: fillOrKill,
                                postOnly: postOnly,
                                cancelId: cancelId,
                                clientId: clientId,
                                cancelAmountOnRevert: cancelAmountOnRevert,
                            })];
                }
            });
        });
    };
    /**
     * Creates but does not place a signed canonicalOrder
     */
    Api.prototype.createCanonicalOrder = function (_a) {
        var side = _a.side, market = _a.market, amount = _a.amount, price = _a.price, makerAccountOwner = _a.makerAccountOwner, expiration = _a.expiration, limitFee = _a.limitFee, postOnly = _a.postOnly;
        return __awaiter(this, void 0, void 0, function () {
            var amountNumber, isTaker, markets, baseMarket, limitFeeNumber, realExpiration, order, typedSignature;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!Object.values(types_1.ApiSide).includes(side)) {
                            throw new Error("side: " + side + " is invalid");
                        }
                        if (!Object.values(types_1.ApiMarketName).includes(market)) {
                            throw new Error("market: " + market + " is invalid");
                        }
                        amountNumber = new bignumber_js_1.default(amount);
                        isTaker = !postOnly;
                        markets = market.split('-');
                        baseMarket = types_1.MarketId[markets[0]];
                        limitFeeNumber = limitFee
                            ? new bignumber_js_1.default(limitFee)
                            : this.canonicalOrders.getFeeForOrder(baseMarket, amountNumber, isTaker);
                        realExpiration = getRealExpiration(expiration);
                        order = {
                            baseMarket: baseMarket,
                            makerAccountOwner: makerAccountOwner,
                            quoteMarket: types_1.MarketId[markets[1]],
                            isBuy: side === types_1.ApiSide.BUY,
                            isDecreaseOnly: false,
                            amount: amountNumber,
                            limitPrice: new bignumber_js_1.default(price),
                            triggerPrice: new bignumber_js_1.default('0'),
                            limitFee: limitFeeNumber,
                            makerAccountNumber: new bignumber_js_1.default('0'),
                            expiration: realExpiration,
                            salt: generatePseudoRandom256BitNumber(),
                        };
                        return [4 /*yield*/, this.canonicalOrders.signOrder(order, types_1.SigningMethod.Hash)];
                    case 1:
                        typedSignature = _b.sent();
                        return [2 /*return*/, __assign(__assign({}, order), { typedSignature: typedSignature })];
                }
            });
        });
    };
    /**
     * Submits an already signed canonicalOrder
     */
    Api.prototype.submitCanonicalOrder = function (_a) {
        var order = _a.order, _b = _a.fillOrKill, fillOrKill = _b === void 0 ? false : _b, _c = _a.postOnly, postOnly = _c === void 0 ? false : _c, cancelId = _a.cancelId, clientId = _a.clientId, cancelAmountOnRevert = _a.cancelAmountOnRevert;
        return __awaiter(this, void 0, void 0, function () {
            var jsonOrder, data, response;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        jsonOrder = jsonifyCanonicalOrder(order);
                        data = {
                            fillOrKill: fillOrKill,
                            postOnly: postOnly,
                            clientId: clientId,
                            cancelId: cancelId,
                            cancelAmountOnRevert: cancelAmountOnRevert,
                            order: jsonOrder,
                        };
                        return [4 /*yield*/, axios_1.default({
                                data: data,
                                method: 'post',
                                url: this.endpoint + "/v2/orders",
                                timeout: this.timeout,
                            })];
                    case 1:
                        response = _d.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.cancelOrderV2 = function (_a) {
        var orderId = _a.orderId, makerAccountOwner = _a.makerAccountOwner;
        return __awaiter(this, void 0, void 0, function () {
            var signature, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.canonicalOrders.signCancelOrderByHash(orderId, makerAccountOwner, types_1.SigningMethod.Hash)];
                    case 1:
                        signature = _b.sent();
                        return [4 /*yield*/, axios_1.default({
                                url: this.endpoint + "/v2/orders/" + orderId,
                                method: 'delete',
                                headers: {
                                    authorization: "Bearer " + signature,
                                },
                                timeout: this.timeout,
                            })];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getOrdersV2 = function (_a) {
        var accountOwner = _a.accountOwner, accountNumber = _a.accountNumber, side = _a.side, status = _a.status, orderType = _a.orderType, market = _a.market, limit = _a.limit, startingBefore = _a.startingBefore;
        return __awaiter(this, void 0, void 0, function () {
            var queryObj, query, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryObj = {
                            side: side,
                            orderType: orderType,
                            limit: limit,
                            market: market,
                            status: status,
                            accountOwner: accountOwner,
                            accountNumber: accountNumber && new bignumber_js_1.default(accountNumber).toFixed(0),
                            startingBefore: startingBefore && startingBefore.toISOString(),
                        };
                        query = query_string_1.default.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });
                        return [4 /*yield*/, axios_1.default({
                                url: this.endpoint + "/v2/orders?" + query,
                                method: 'get',
                                timeout: this.timeout,
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getOrderV2 = function (_a) {
        var id = _a.id;
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1.default({
                            url: this.endpoint + "/v2/orders/" + id,
                            method: 'get',
                            timeout: this.timeout,
                        })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getMarketV2 = function (_a) {
        var market = _a.market;
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1.default({
                            url: this.endpoint + "/v2/markets/" + market,
                            method: 'get',
                            timeout: this.timeout,
                        })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getMarketsV2 = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default({
                            url: this.endpoint + "/v2/markets",
                            method: 'get',
                            timeout: this.timeout,
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getFillsV2 = function (_a) {
        var orderId = _a.orderId, side = _a.side, market = _a.market, transactionHash = _a.transactionHash, accountOwner = _a.accountOwner, accountNumber = _a.accountNumber, startingBefore = _a.startingBefore, limit = _a.limit;
        return __awaiter(this, void 0, void 0, function () {
            var queryObj, query, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryObj = {
                            orderId: orderId,
                            side: side,
                            limit: limit,
                            market: market,
                            transactionHash: transactionHash,
                            accountOwner: accountOwner,
                            accountNumber: accountNumber && new bignumber_js_1.default(accountNumber).toFixed(0),
                            startingBefore: startingBefore && startingBefore.toISOString(),
                        };
                        query = query_string_1.default.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });
                        return [4 /*yield*/, axios_1.default({
                                url: this.endpoint + "/v2/fills?" + query,
                                method: 'get',
                                timeout: this.timeout,
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getTradesV2 = function (_a) {
        var orderId = _a.orderId, side = _a.side, market = _a.market, transactionHash = _a.transactionHash, accountOwner = _a.accountOwner, accountNumber = _a.accountNumber, startingBefore = _a.startingBefore, limit = _a.limit;
        return __awaiter(this, void 0, void 0, function () {
            var queryObj, query, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryObj = {
                            orderId: orderId,
                            side: side,
                            limit: limit,
                            market: market,
                            transactionHash: transactionHash,
                            accountOwner: accountOwner,
                            accountNumber: accountNumber && new bignumber_js_1.default(accountNumber).toFixed(0),
                            startingBefore: startingBefore && startingBefore.toISOString(),
                        };
                        query = query_string_1.default.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });
                        return [4 /*yield*/, axios_1.default({
                                url: this.endpoint + "/v2/trades?" + query,
                                method: 'get',
                                timeout: this.timeout,
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getAccountBalances = function (_a) {
        var accountOwner = _a.accountOwner, _b = _a.accountNumber, accountNumber = _b === void 0 ? new bignumber_js_1.default(0) : _b;
        return __awaiter(this, void 0, void 0, function () {
            var numberStr, response;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        numberStr = new bignumber_js_1.default(accountNumber).toFixed(0);
                        return [4 /*yield*/, axios_1.default({
                                url: this.endpoint + "/v1/accounts/" + accountOwner + "?number=" + numberStr,
                                method: 'get',
                                timeout: this.timeout,
                            })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getOrderbookV2 = function (_a) {
        var market = _a.market;
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1.default({
                            url: this.endpoint + "/v1/orderbook/" + market,
                            method: 'get',
                            timeout: this.timeout,
                        })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    Api.prototype.getMarkets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default({
                            url: this.endpoint + "/v1/markets",
                            method: 'get',
                            timeout: this.timeout,
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    return Api;
}());
exports.Api = Api;
function generatePseudoRandom256BitNumber() {
    var MAX_DIGITS_IN_UNSIGNED_256_INT = 78;
    // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of
    // decimal places.
    // Source: https://mikemcl.github.io/bignumber.js/#random
    var randomNumber = bignumber_js_1.default.random(MAX_DIGITS_IN_UNSIGNED_256_INT);
    var factor = new bignumber_js_1.default(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
    var randomNumberScaledTo256Bits = randomNumber.times(factor).integerValue();
    return randomNumberScaledTo256Bits;
}
function jsonifyCanonicalOrder(order) {
    return {
        isBuy: order.isBuy,
        isDecreaseOnly: order.isDecreaseOnly,
        baseMarket: order.baseMarket.toFixed(0),
        quoteMarket: order.quoteMarket.toFixed(0),
        amount: order.amount.toFixed(0),
        limitPrice: order.limitPrice.toString(),
        triggerPrice: order.triggerPrice.toString(),
        limitFee: order.limitFee.toString(),
        makerAccountNumber: order.makerAccountNumber.toFixed(0),
        makerAccountOwner: order.makerAccountOwner,
        expiration: order.expiration.toFixed(0),
        typedSignature: order.typedSignature,
        salt: order.salt.toFixed(0),
    };
}
function getRealExpiration(expiration) {
    return new bignumber_js_1.default(expiration).eq(0) ?
        new bignumber_js_1.default(0)
        : new bignumber_js_1.default(Math.round(new Date().getTime() / 1000)).plus(new bignumber_js_1.default(expiration));
}
//# sourceMappingURL=Api.js.map