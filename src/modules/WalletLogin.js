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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletLogin = void 0;
var web3_1 = __importDefault(require("web3"));
var Signer_1 = require("./Signer");
var types_1 = require("../../src/types");
var Helpers_1 = require("../lib/Helpers");
var BytesHelper_1 = require("../lib/BytesHelper");
var SignatureHelper_1 = require("../lib/SignatureHelper");
var EIP712_WALLET_LOGIN_STRUCT = [
    { type: 'string', name: 'action' },
    { type: 'string', name: 'expiration' },
];
var WalletLogin = /** @class */ (function (_super) {
    __extends(WalletLogin, _super);
    function WalletLogin(web3, networkId, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.domain, domain = _c === void 0 ? 'dYdX' : _c, _d = _b.version, version = _d === void 0 ? '1.0' : _d;
        var _this = _super.call(this, web3) || this;
        _this.domain = domain;
        _this.networkId = networkId;
        _this.version = version;
        _this.EIP712_WALLET_LOGIN_STRUCT_STRING = 'dYdX(' +
            'string action,' +
            'string expiration' +
            ')';
        return _this;
    }
    WalletLogin.prototype.signLogin = function (expiration, signer, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, hash, rawSignature, hashSig, unsafeHashSig, data;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
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
                        hash = this.getWalletLoginHash(expiration);
                        return [4 /*yield*/, this.web3.eth.sign(hash, signer)];
                    case 2:
                        rawSignature = _c.sent();
                        hashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.DECIMAL);
                        if (signingMethod === types_1.SigningMethod.Hash) {
                            return [2 /*return*/, hashSig];
                        }
                        unsafeHashSig = SignatureHelper_1.createTypedSignature(rawSignature, SignatureHelper_1.SIGNATURE_TYPES.NO_PREPEND);
                        if (signingMethod === types_1.SigningMethod.UnsafeHash) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        if (this.walletLoginIsValid(expiration, unsafeHashSig, signer)) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        return [2 /*return*/, hashSig];
                    case 3:
                        {
                            data = {
                                types: (_b = {
                                        EIP712Domain: SignatureHelper_1.EIP712_DOMAIN_STRUCT_NO_CONTRACT
                                    },
                                    _b[this.domain] = EIP712_WALLET_LOGIN_STRUCT,
                                    _b),
                                domain: this.getDomainData(),
                                primaryType: this.domain,
                                message: {
                                    action: 'Login',
                                    expiration: expiration.toUTCString(),
                                },
                            };
                            return [2 /*return*/, this.ethSignTypedDataInternal(signer, data, signingMethod)];
                        }
                        _c.label = 4;
                    case 4: throw new Error("Invalid signing method " + signingMethod);
                }
            });
        });
    };
    WalletLogin.prototype.walletLoginIsValid = function (expiration, typedSignature, expectedSigner) {
        var hash = this.getWalletLoginHash(expiration);
        var signer = SignatureHelper_1.ecRecoverTypedSignature(hash, typedSignature);
        return (BytesHelper_1.addressesAreEqual(signer, expectedSigner) && expiration > new Date());
    };
    WalletLogin.prototype.getDomainHash = function () {
        return web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(SignatureHelper_1.EIP712_DOMAIN_STRING_NO_CONTRACT) }, { t: 'bytes32', v: BytesHelper_1.hashString(this.domain) }, { t: 'bytes32', v: BytesHelper_1.hashString(this.version) }, { t: 'uint256', v: Helpers_1.toString(this.networkId) });
    };
    WalletLogin.prototype.getWalletLoginHash = function (expiration) {
        var structHash = web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(this.EIP712_WALLET_LOGIN_STRUCT_STRING) }, { t: 'bytes32', v: BytesHelper_1.hashString('Login') }, { t: 'bytes32', v: BytesHelper_1.hashString(expiration.toUTCString()) });
        return this.getEIP712Hash(structHash);
    };
    WalletLogin.prototype.getDomainData = function () {
        return {
            name: this.domain,
            version: this.version,
            chainId: this.networkId,
        };
    };
    return WalletLogin;
}(Signer_1.Signer));
exports.WalletLogin = WalletLogin;
//# sourceMappingURL=WalletLogin.js.map