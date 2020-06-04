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
exports.Signer = void 0;
var web3_1 = __importDefault(require("web3"));
var es6_promisify_1 = require("es6-promisify");
var BytesHelper_1 = require("../lib/BytesHelper");
var SignatureHelper_1 = require("../lib/SignatureHelper");
var types_1 = require("../../src/types");
var Signer = /** @class */ (function () {
    // ============ Constructor ============
    function Signer(web3) {
        this.web3 = web3;
    }
    // ============ Functions ============
    /**
     * Returns a signable EIP712 Hash of a struct
     */
    Signer.prototype.getEIP712Hash = function (structHash) {
        return web3_1.default.utils.soliditySha3({ t: 'bytes2', v: '0x1901' }, { t: 'bytes32', v: this.getDomainHash() }, { t: 'bytes32', v: structHash });
    };
    Signer.prototype.ethSignTypedDataInternal = function (signer, data, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var sendMethod, rpcMethod, rpcData, provider, sendAsync, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        switch (signingMethod) {
                            case types_1.SigningMethod.TypedData:
                                sendMethod = 'send';
                                rpcMethod = 'eth_signTypedData';
                                rpcData = data;
                                break;
                            case types_1.SigningMethod.MetaMask:
                                sendMethod = 'sendAsync';
                                rpcMethod = 'eth_signTypedData_v3';
                                rpcData = JSON.stringify(data);
                                break;
                            case types_1.SigningMethod.MetaMaskLatest:
                                sendMethod = 'sendAsync';
                                rpcMethod = 'eth_signTypedData_v4';
                                rpcData = JSON.stringify(data);
                                break;
                            case types_1.SigningMethod.CoinbaseWallet:
                                sendMethod = 'sendAsync';
                                rpcMethod = 'eth_signTypedData';
                                rpcData = data;
                                break;
                            default:
                                throw new Error("Invalid signing method " + signingMethod);
                        }
                        provider = this.web3.currentProvider;
                        sendAsync = es6_promisify_1.promisify(provider[sendMethod]).bind(provider);
                        return [4 /*yield*/, sendAsync({
                                method: rpcMethod,
                                params: [signer, rpcData],
                                jsonrpc: '2.0',
                                id: new Date().getTime(),
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error.message);
                        }
                        return [2 /*return*/, "0x" + BytesHelper_1.stripHexPrefix(response.result) + "0" + SignatureHelper_1.SIGNATURE_TYPES.NO_PREPEND];
                }
            });
        });
    };
    return Signer;
}());
exports.Signer = Signer;
//# sourceMappingURL=Signer.js.map