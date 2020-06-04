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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSigner = void 0;
var Signer_1 = require("./Signer");
var BytesHelper_1 = require("../lib/BytesHelper");
var SignatureHelper_1 = require("../lib/SignatureHelper");
var types_1 = require("../../src/types");
var OrderSigner = /** @class */ (function (_super) {
    __extends(OrderSigner, _super);
    // ============ Constructor ============
    function OrderSigner(web3, contracts) {
        var _this = _super.call(this, web3) || this;
        _this.contracts = contracts;
        return _this;
    }
    // ============ Getter Contract Methods ============
    /**
     * Returns true if the contract can process orders.
     */
    OrderSigner.prototype.isOperational = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.getContract().methods.g_isOperational(), options)];
            });
        });
    };
    // ============ On-Chain Approve / On-Chain Cancel ============
    /**
     * Sends an transaction to pre-approve an order on-chain (so that no signature is required when
     * filling the order).
     */
    OrderSigner.prototype.approveOrder = function (order, options) {
        return __awaiter(this, void 0, void 0, function () {
            var stringifiedOrder;
            return __generator(this, function (_a) {
                stringifiedOrder = this.stringifyOrder(order);
                return [2 /*return*/, this.contracts.callContractFunction(this.getContract().methods.approveOrder(stringifiedOrder), options)];
            });
        });
    };
    /**
     * Sends an transaction to cancel an order on-chain.
     */
    OrderSigner.prototype.cancelOrder = function (order, options) {
        return __awaiter(this, void 0, void 0, function () {
            var stringifiedOrder;
            return __generator(this, function (_a) {
                stringifiedOrder = this.stringifyOrder(order);
                return [2 /*return*/, this.contracts.callContractFunction(this.getContract().methods.cancelOrder(stringifiedOrder), options)];
            });
        });
    };
    // ============ Signing Methods ============
    /**
     * Sends order to current provider for signing. Can sign locally if the signing account is
     * loaded into web3 and SigningMethod.Hash is used.
     */
    OrderSigner.prototype.signOrder = function (order, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, orderHash, rawSignature, hashSig, unsafeHashSig;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = signingMethod;
                        switch (_a) {
                            case types_1.SigningMethod.Hash: return [3 /*break*/, 1];
                            case types_1.SigningMethod.UnsafeHash: return [3 /*break*/, 1];
                            case types_1.SigningMethod.Compatibility: return [3 /*break*/, 1];
                            case types_1.SigningMethod.TypedData: return [3 /*break*/, 3];
                            case types_1.SigningMethod.MetaMask: return [3 /*break*/, 3];
                            case types_1.SigningMethod.MetaMaskLatest: return [3 /*break*/, 3];
                            case types_1.SigningMethod.CoinbaseWallet: return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 4];
                    case 1:
                        orderHash = this.getOrderHash(order);
                        return [4 /*yield*/, this.web3.eth.sign(orderHash, order.makerAccountOwner)];
                    case 2:
                        rawSignature = _b.sent();
                        hashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.DECIMAL);
                        if (signingMethod === types_1.SigningMethod.Hash) {
                            return [2 /*return*/, hashSig];
                        }
                        unsafeHashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.NO_PREPEND);
                        if (signingMethod === types_1.SigningMethod.UnsafeHash) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        if (this.orderByHashHasValidSignature(orderHash, unsafeHashSig, order.makerAccountOwner)) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        return [2 /*return*/, hashSig];
                    case 3: return [2 /*return*/, this.ethSignTypedOrderInternal(order, signingMethod)];
                    case 4: throw new Error("Invalid signing method " + signingMethod);
                }
            });
        });
    };
    /**
     * Sends order to current provider for signing of a cancel message. Can sign locally if the
     * signing account is loaded into web3 and SigningMethod.Hash is used.
     */
    OrderSigner.prototype.signCancelOrder = function (order, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.signCancelOrderByHash(this.getOrderHash(order), order.makerAccountOwner, signingMethod)];
            });
        });
    };
    /**
     * Sends orderHash to current provider for signing of a cancel message. Can sign locally if
     * the signing account is loaded into web3 and SigningMethod.Hash is used.
     */
    OrderSigner.prototype.signCancelOrderByHash = function (orderHash, signer, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, cancelHash, rawSignature, hashSig, unsafeHashSig;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = signingMethod;
                        switch (_a) {
                            case types_1.SigningMethod.Hash: return [3 /*break*/, 1];
                            case types_1.SigningMethod.UnsafeHash: return [3 /*break*/, 1];
                            case types_1.SigningMethod.Compatibility: return [3 /*break*/, 1];
                            case types_1.SigningMethod.TypedData: return [3 /*break*/, 3];
                            case types_1.SigningMethod.MetaMask: return [3 /*break*/, 3];
                            case types_1.SigningMethod.MetaMaskLatest: return [3 /*break*/, 3];
                            case types_1.SigningMethod.CoinbaseWallet: return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 4];
                    case 1:
                        cancelHash = this.orderHashToCancelOrderHash(orderHash);
                        return [4 /*yield*/, this.web3.eth.sign(cancelHash, signer)];
                    case 2:
                        rawSignature = _b.sent();
                        hashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.DECIMAL);
                        if (signingMethod === types_1.SigningMethod.Hash) {
                            return [2 /*return*/, hashSig];
                        }
                        unsafeHashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.NO_PREPEND);
                        if (signingMethod === types_1.SigningMethod.UnsafeHash) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        if (this.cancelOrderByHashHasValidSignature(orderHash, unsafeHashSig, signer)) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        return [2 /*return*/, hashSig];
                    case 3: return [2 /*return*/, this.ethSignTypedCancelOrderInternal(orderHash, signer, signingMethod)];
                    case 4: throw new Error("Invalid signing method " + signingMethod);
                }
            });
        });
    };
    // ============ Signature Verification ============
    /**
     * Returns true if the order object has a non-null valid signature from the maker of the order.
     */
    OrderSigner.prototype.orderHasValidSignature = function (order) {
        return this.orderByHashHasValidSignature(this.getOrderHash(order), order.typedSignature, order.makerAccountOwner);
    };
    /**
     * Returns true if the order hash has a non-null valid signature from a particular signer.
     */
    OrderSigner.prototype.orderByHashHasValidSignature = function (orderHash, typedSignature, expectedSigner) {
        var signer = SignatureHelper_1.ecRecoverTypedSignature(orderHash, typedSignature);
        return BytesHelper_1.addressesAreEqual(signer, expectedSigner);
    };
    /**
     * Returns true if the cancel order message has a valid signature.
     */
    OrderSigner.prototype.cancelOrderHasValidSignature = function (order, typedSignature) {
        return this.cancelOrderByHashHasValidSignature(this.getOrderHash(order), typedSignature, order.makerAccountOwner);
    };
    /**
     * Returns true if the cancel order message has a valid signature.
     */
    OrderSigner.prototype.cancelOrderByHashHasValidSignature = function (orderHash, typedSignature, expectedSigner) {
        var cancelHash = this.orderHashToCancelOrderHash(orderHash);
        var signer = SignatureHelper_1.ecRecoverTypedSignature(cancelHash, typedSignature);
        return BytesHelper_1.addressesAreEqual(signer, expectedSigner);
    };
    return OrderSigner;
}(Signer_1.Signer));
exports.OrderSigner = OrderSigner;
//# sourceMappingURL=OrderSigner.js.map