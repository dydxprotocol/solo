"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitOrders = void 0;
var web3_1 = __importDefault(require("web3"));
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var OrderSigner_1 = require("./OrderSigner");
var Helpers_1 = require("../lib/Helpers");
var BytesHelper_1 = require("../lib/BytesHelper");
var SignatureHelper_1 = require("../lib/SignatureHelper");
var EIP712_ORDER_STRUCT = [
    { type: 'uint256', name: 'makerMarket' },
    { type: 'uint256', name: 'takerMarket' },
    { type: 'uint256', name: 'makerAmount' },
    { type: 'uint256', name: 'takerAmount' },
    { type: 'address', name: 'makerAccountOwner' },
    { type: 'uint256', name: 'makerAccountNumber' },
    { type: 'address', name: 'takerAccountOwner' },
    { type: 'uint256', name: 'takerAccountNumber' },
    { type: 'uint256', name: 'expiration' },
    { type: 'uint256', name: 'salt' },
];
var EIP712_ORDER_STRUCT_STRING = 'LimitOrder(' +
    'uint256 makerMarket,' +
    'uint256 takerMarket,' +
    'uint256 makerAmount,' +
    'uint256 takerAmount,' +
    'address makerAccountOwner,' +
    'uint256 makerAccountNumber,' +
    'address takerAccountOwner,' +
    'uint256 takerAccountNumber,' +
    'uint256 expiration,' +
    'uint256 salt' +
    ')';
var EIP712_CANCEL_ORDER_STRUCT = [
    { type: 'string', name: 'action' },
    { type: 'bytes32[]', name: 'orderHashes' },
];
var EIP712_CANCEL_ORDER_STRUCT_STRING = 'CancelLimitOrder(' +
    'string action,' +
    'bytes32[] orderHashes' +
    ')';
var LimitOrders = /** @class */ (function (_super) {
    __extends(LimitOrders, _super);
    // ============ Constructor ============
    function LimitOrders(contracts, web3, networkId) {
        var _this = _super.call(this, web3, contracts) || this;
        _this.networkId = networkId;
        return _this;
    }
    // ============ Getter Contract Methods ============
    /**
     * Gets the status and the current filled amount (in makerAmount) of all given orders.
     */
    LimitOrders.prototype.getOrderStates = function (orders, options) {
        return __awaiter(this, void 0, void 0, function () {
            var orderHashes, states;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderHashes = orders.map(function (order) { return _this.getOrderHash(order); });
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(this.contracts.limitOrders.methods.getOrderStates(orderHashes), options)];
                    case 1:
                        states = _a.sent();
                        return [2 /*return*/, states.map(function (state) {
                                return {
                                    status: parseInt(state[0], 10),
                                    totalMakerFilledAmount: new bignumber_js_1.default(state[1]),
                                };
                            })];
                }
            });
        });
    };
    // ============ Off-Chain Collateralization Calculation Methods ============
    /**
     * Returns the estimated account collateralization after making each of the orders provided.
     * The makerAccount of each order should be associated with the same account.
     * This function does not make any on-chain calls and so all information must be passed in
     * (including asset prices and remaining amounts on the orders).
     * - 150% collateralization will be returned as BigNumber(1.5).
     * - Accounts with zero borrow will be returned as BigNumber(infinity) regardless of supply.
     */
    LimitOrders.prototype.getAccountCollateralizationAfterMakingOrders = function (weis, prices, orders, remainingMakerAmounts) {
        var runningWeis = weis.map(function (x) { return new bignumber_js_1.default(x); });
        // for each order, modify the wei value of the account
        for (var i = 0; i < orders.length; i += 1) {
            var order = orders[i];
            // calculate maker and taker amounts
            var makerAmount = remainingMakerAmounts[i];
            var takerAmount = order.takerAmount.times(makerAmount).div(order.makerAmount)
                .integerValue(bignumber_js_1.default.ROUND_UP);
            // update running weis
            var makerMarket = order.makerMarket.toNumber();
            var takerMarket = order.takerMarket.toNumber();
            runningWeis[makerMarket] = runningWeis[makerMarket].minus(makerAmount);
            runningWeis[takerMarket] = runningWeis[takerMarket].plus(takerAmount);
        }
        // calculate the final collateralization
        var supplyValue = new bignumber_js_1.default(0);
        var borrowValue = new bignumber_js_1.default(0);
        for (var i = 0; i < runningWeis.length; i += 1) {
            var value = runningWeis[i].times(prices[i]);
            if (value.gt(0)) {
                supplyValue = supplyValue.plus(value.abs());
            }
            else if (value.lt(0)) {
                borrowValue = borrowValue.plus(value.abs());
            }
        }
        // return infinity if borrow amount is zero (even if supply is also zero)
        if (borrowValue.isZero()) {
            return new bignumber_js_1.default(Infinity);
        }
        return supplyValue.div(borrowValue);
    };
    // ============ Hashing Functions ============
    /**
     * Returns the final signable EIP712 hash for approving an order.
     */
    LimitOrders.prototype.getOrderHash = function (order) {
        var structHash = web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_ORDER_STRUCT_STRING) }, { t: 'uint256', v: Helpers_1.toString(order.makerMarket) }, { t: 'uint256', v: Helpers_1.toString(order.takerMarket) }, { t: 'uint256', v: Helpers_1.toString(order.makerAmount) }, { t: 'uint256', v: Helpers_1.toString(order.takerAmount) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(order.makerAccountOwner) }, { t: 'uint256', v: Helpers_1.toString(order.makerAccountNumber) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(order.takerAccountOwner) }, { t: 'uint256', v: Helpers_1.toString(order.takerAccountNumber) }, { t: 'uint256', v: Helpers_1.toString(order.expiration) }, { t: 'uint256', v: Helpers_1.toString(order.salt) });
        return this.getEIP712Hash(structHash);
    };
    /**
     * Given some order hash, returns the hash of a cancel-order message.
     */
    LimitOrders.prototype.orderHashToCancelOrderHash = function (orderHash) {
        var structHash = web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_CANCEL_ORDER_STRUCT_STRING) }, { t: 'bytes32', v: BytesHelper_1.hashString('Cancel Orders') }, { t: 'bytes32', v: web3_1.default.utils.soliditySha3({ t: 'bytes32', v: orderHash }) });
        return this.getEIP712Hash(structHash);
    };
    /**
     * Returns the EIP712 domain separator hash.
     */
    LimitOrders.prototype.getDomainHash = function () {
        return web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(SignatureHelper_1.EIP712_DOMAIN_STRING) }, { t: 'bytes32', v: BytesHelper_1.hashString('LimitOrders') }, { t: 'bytes32', v: BytesHelper_1.hashString('1.1') }, { t: 'uint256', v: Helpers_1.toString(this.networkId) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(this.contracts.limitOrders.options.address) });
    };
    // ============ To-Bytes Functions ============
    LimitOrders.prototype.unsignedOrderToBytes = function (order) {
        return web3_1.default.utils.bytesToHex(this.orderToByteArray(order));
    };
    LimitOrders.prototype.signedOrderToBytes = function (order) {
        var signatureBytes = web3_1.default.utils.hexToBytes(order.typedSignature);
        var byteArray = this.orderToByteArray(order).concat(signatureBytes);
        return web3_1.default.utils.bytesToHex(byteArray);
    };
    // ============ Private Helper Functions ============
    LimitOrders.prototype.orderToByteArray = function (order) {
        return []
            .concat(BytesHelper_1.argToBytes(order.makerMarket))
            .concat(BytesHelper_1.argToBytes(order.takerMarket))
            .concat(BytesHelper_1.argToBytes(order.makerAmount))
            .concat(BytesHelper_1.argToBytes(order.takerAmount))
            .concat(BytesHelper_1.argToBytes(order.makerAccountOwner))
            .concat(BytesHelper_1.argToBytes(order.makerAccountNumber))
            .concat(BytesHelper_1.argToBytes(order.takerAccountOwner))
            .concat(BytesHelper_1.argToBytes(order.takerAccountNumber))
            .concat(BytesHelper_1.argToBytes(order.expiration))
            .concat(BytesHelper_1.argToBytes(order.salt));
    };
    LimitOrders.prototype.getDomainData = function () {
        return {
            name: 'LimitOrders',
            version: '1.1',
            chainId: this.networkId,
            verifyingContract: this.contracts.limitOrders.options.address,
        };
    };
    LimitOrders.prototype.ethSignTypedOrderInternal = function (order, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var orderData, data;
            return __generator(this, function (_a) {
                orderData = {
                    makerMarket: order.makerMarket.toFixed(0),
                    takerMarket: order.takerMarket.toFixed(0),
                    makerAmount: order.makerAmount.toFixed(0),
                    takerAmount: order.takerAmount.toFixed(0),
                    makerAccountOwner: order.makerAccountOwner,
                    makerAccountNumber: order.makerAccountNumber.toFixed(0),
                    takerAccountOwner: order.takerAccountOwner,
                    takerAccountNumber: order.takerAccountNumber.toFixed(0),
                    expiration: order.expiration.toFixed(0),
                    salt: order.salt.toFixed(0),
                };
                data = {
                    types: {
                        EIP712Domain: SignatureHelper_1.EIP712_DOMAIN_STRUCT,
                        LimitOrder: EIP712_ORDER_STRUCT,
                    },
                    domain: this.getDomainData(),
                    primaryType: 'LimitOrder',
                    message: orderData,
                };
                return [2 /*return*/, this.ethSignTypedDataInternal(order.makerAccountOwner, data, signingMethod)];
            });
        });
    };
    LimitOrders.prototype.ethSignTypedCancelOrderInternal = function (orderHash, signer, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = {
                    types: {
                        EIP712Domain: SignatureHelper_1.EIP712_DOMAIN_STRUCT,
                        CancelLimitOrder: EIP712_CANCEL_ORDER_STRUCT,
                    },
                    domain: this.getDomainData(),
                    primaryType: 'CancelLimitOrder',
                    message: {
                        action: 'Cancel Orders',
                        orderHashes: [orderHash],
                    },
                };
                return [2 /*return*/, this.ethSignTypedDataInternal(signer, data, signingMethod)];
            });
        });
    };
    LimitOrders.prototype.stringifyOrder = function (order) {
        var e_1, _a;
        var stringifiedOrder = __assign({}, order);
        try {
            for (var _b = __values(Object.entries(order)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (typeof value !== 'string') {
                    stringifiedOrder[key] = Helpers_1.toString(value);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return stringifiedOrder;
    };
    LimitOrders.prototype.getContract = function () {
        return this.contracts.limitOrders;
    };
    return LimitOrders;
}(OrderSigner_1.OrderSigner));
exports.LimitOrders = LimitOrders;
//# sourceMappingURL=LimitOrders.js.map