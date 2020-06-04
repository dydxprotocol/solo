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
exports.SignedOperations = void 0;
var web3_1 = __importDefault(require("web3"));
var Signer_1 = require("./Signer");
var Constants_1 = require("../lib/Constants");
var Helpers_1 = require("../lib/Helpers");
var BytesHelper_1 = require("../lib/BytesHelper");
var SignatureHelper_1 = require("../lib/SignatureHelper");
var types_1 = require("../../src/types");
var EIP712_OPERATION_STRUCT = [
    { type: 'Action[]', name: 'actions' },
    { type: 'uint256', name: 'expiration' },
    { type: 'uint256', name: 'salt' },
    { type: 'address', name: 'sender' },
    { type: 'address', name: 'signer' },
];
var EIP712_ACTION_STRUCT = [
    { type: 'uint8', name: 'actionType' },
    { type: 'address', name: 'accountOwner' },
    { type: 'uint256', name: 'accountNumber' },
    { type: 'AssetAmount', name: 'assetAmount' },
    { type: 'uint256', name: 'primaryMarketId' },
    { type: 'uint256', name: 'secondaryMarketId' },
    { type: 'address', name: 'otherAddress' },
    { type: 'address', name: 'otherAccountOwner' },
    { type: 'uint256', name: 'otherAccountNumber' },
    { type: 'bytes', name: 'data' },
];
var EIP712_ASSET_AMOUNT_STRUCT = [
    { type: 'bool', name: 'sign' },
    { type: 'uint8', name: 'denomination' },
    { type: 'uint8', name: 'ref' },
    { type: 'uint256', name: 'value' },
];
var EIP712_ASSET_AMOUNT_STRING = 'AssetAmount(' +
    'bool sign,' +
    'uint8 denomination,' +
    'uint8 ref,' +
    'uint256 value' +
    ')';
var EIP712_ACTION_STRING = 'Action(' + // tslint:disable-line
    'uint8 actionType,' +
    'address accountOwner,' +
    'uint256 accountNumber,' +
    'AssetAmount assetAmount,' +
    'uint256 primaryMarketId,' +
    'uint256 secondaryMarketId,' +
    'address otherAddress,' +
    'address otherAccountOwner,' +
    'uint256 otherAccountNumber,' +
    'bytes data' +
    ')' +
    EIP712_ASSET_AMOUNT_STRING;
var EIP712_OPERATION_STRING = 'Operation(' + // tslint:disable-line
    'Action[] actions,' +
    'uint256 expiration,' +
    'uint256 salt,' +
    'address sender,' +
    'address signer' +
    ')' +
    EIP712_ACTION_STRING;
var EIP712_CANCEL_OPERATION_STRUCT = [
    { type: 'string', name: 'action' },
    { type: 'bytes32[]', name: 'operationHashes' },
];
var EIP712_CANCEL_OPERATION_STRUCT_STRING = 'CancelOperation(' +
    'string action,' +
    'bytes32[] operationHashes' +
    ')';
var SignedOperations = /** @class */ (function (_super) {
    __extends(SignedOperations, _super);
    // ============ Constructor ============
    function SignedOperations(contracts, web3, networkId) {
        var _this = _super.call(this, web3) || this;
        _this.contracts = contracts;
        _this.networkId = networkId;
        return _this;
    }
    // ============ On-Chain Cancel ============
    /**
     * Sends an transaction to cancel an operation on-chain.
     */
    SignedOperations.prototype.cancelOperation = function (operation, options) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, actions, getAccountId, i, action;
            return __generator(this, function (_a) {
                accounts = [];
                actions = [];
                getAccountId = function (accountOwner, accountNumber) {
                    if (accountOwner === Constants_1.ADDRESSES.ZERO) {
                        return 0;
                    }
                    var accountInfo = {
                        owner: accountOwner,
                        number: accountNumber.toFixed(0),
                    };
                    var index = accounts.indexOf(accountInfo);
                    if (index >= 0) {
                        return index;
                    }
                    accounts.push(accountInfo);
                    return accounts.length - 1;
                };
                for (i = 0; i < operation.actions.length; i += 1) {
                    action = operation.actions[i];
                    actions.push({
                        accountId: getAccountId(action.primaryAccountOwner, action.primaryAccountNumber),
                        actionType: action.actionType,
                        primaryMarketId: Helpers_1.toString(action.primaryMarketId),
                        secondaryMarketId: Helpers_1.toString(action.secondaryMarketId),
                        otherAddress: action.otherAddress,
                        otherAccountId: getAccountId(action.secondaryAccountOwner, action.secondaryAccountNumber),
                        data: BytesHelper_1.hexStringToBytes(action.data),
                        amount: {
                            sign: action.amount.sign,
                            ref: Helpers_1.toString(action.amount.ref),
                            denomination: Helpers_1.toString(action.amount.denomination),
                            value: Helpers_1.toString(action.amount.value),
                        },
                    });
                }
                return [2 /*return*/, this.contracts.callContractFunction(this.contracts.signedOperationProxy.methods.cancel(accounts, actions, {
                        numActions: operation.actions.length.toString(),
                        header: {
                            expiration: operation.expiration.toFixed(0),
                            salt: operation.salt.toFixed(0),
                            sender: operation.sender,
                            signer: operation.signer,
                        },
                        signature: [],
                    }), options || { from: operation.signer })];
            });
        });
    };
    // ============ Getter Contract Methods ============
    /**
     * Returns true if the contract can process operations.
     */
    SignedOperations.prototype.isOperational = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.signedOperationProxy.methods.g_isOperational(), options)];
            });
        });
    };
    /**
     * Gets the status and the current filled amount (in makerAmount) of all given orders.
     */
    SignedOperations.prototype.getOperationsAreInvalid = function (operations, options) {
        return __awaiter(this, void 0, void 0, function () {
            var hashes;
            var _this = this;
            return __generator(this, function (_a) {
                hashes = operations.map(function (operation) { return _this.getOperationHash(operation); });
                return [2 /*return*/, this.contracts.callConstantContractFunction(this.contracts.signedOperationProxy.methods.getOperationsAreInvalid(hashes), options)];
            });
        });
    };
    // ============ Signing Methods ============
    /**
     * Sends operation to current provider for signing. Can sign locally if the signing account is
     * loaded into web3 and SigningMethod.Hash is used.
     */
    SignedOperations.prototype.signOperation = function (operation, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, hash, rawSignature, hashSig, unsafeHashSig;
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
                        hash = this.getOperationHash(operation);
                        return [4 /*yield*/, this.web3.eth.sign(hash, operation.signer)];
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
                        if (this.operationByHashHasValidSignature(hash, unsafeHashSig, operation.signer)) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        return [2 /*return*/, hashSig];
                    case 3: return [2 /*return*/, this.ethSignTypedOperationInternal(operation, signingMethod)];
                    case 4: throw new Error("Invalid signing method " + signingMethod);
                }
            });
        });
    };
    /**
     * Sends operation to current provider for signing of a cancel message. Can sign locally if the
     * signing account is loaded into web3 and SigningMethod.Hash is used.
     */
    SignedOperations.prototype.signCancelOperation = function (operation, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.signCancelOperationByHash(this.getOperationHash(operation), operation.signer, signingMethod)];
            });
        });
    };
    /**
     * Sends operationHash to current provider for signing of a cancel message. Can sign locally if
     * the signing account is loaded into web3 and SigningMethod.Hash is used.
     */
    SignedOperations.prototype.signCancelOperationByHash = function (operationHash, signer, signingMethod) {
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
                        cancelHash = this.operationHashToCancelOperationHash(operationHash);
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
                        if (this.cancelOperationByHashHasValidSignature(operationHash, unsafeHashSig, signer)) {
                            return [2 /*return*/, unsafeHashSig];
                        }
                        return [2 /*return*/, hashSig];
                    case 3: return [2 /*return*/, this.ethSignTypedCancelOperationInternal(operationHash, signer, signingMethod)];
                    case 4: throw new Error("Invalid signing method " + signingMethod);
                }
            });
        });
    };
    // ============ Signing Cancel Operation Methods ============
    /**
     * Uses web3.eth.sign to sign a cancel message for an operation. This signature is not used
     * on-chain,but allows dYdX backend services to verify that the cancel operation api call is from
     * the original maker of the operation.
     */
    SignedOperations.prototype.ethSignCancelOperation = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.ethSignCancelOperationByHash(this.getOperationHash(operation), operation.signer)];
            });
        });
    };
    /**
     * Uses web3.eth.sign to sign a cancel message for an operation hash. This signature is not used
     * on-chain, but allows dYdX backend services to verify that the cancel operation api call is from
     * the original maker of the operation.
     */
    SignedOperations.prototype.ethSignCancelOperationByHash = function (operationHash, signer) {
        return __awaiter(this, void 0, void 0, function () {
            var cancelHash, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cancelHash = this.operationHashToCancelOperationHash(operationHash);
                        return [4 /*yield*/, this.web3.eth.sign(cancelHash, signer)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, SignatureHelper_1.createTypedSignature(signature, SignatureHelper_1.SIGNATURE_TYPES.DECIMAL)];
                }
            });
        });
    };
    // ============ Signature Verification ============
    /**
     * Returns true if the operation object has a non-null valid signature from the maker of the
     * operation.
     */
    SignedOperations.prototype.operationHasValidSignature = function (signedOperation) {
        return this.operationByHashHasValidSignature(this.getOperationHash(signedOperation), signedOperation.typedSignature, signedOperation.signer);
    };
    /**
     * Returns true if the operation hash has a non-null valid signature from a particular signer.
     */
    SignedOperations.prototype.operationByHashHasValidSignature = function (operationHash, typedSignature, expectedSigner) {
        var signer = SignatureHelper_1.ecRecoverTypedSignature(operationHash, typedSignature);
        return BytesHelper_1.addressesAreEqual(signer, expectedSigner);
    };
    /**
     * Returns true if the cancel operation message has a valid signature.
     */
    SignedOperations.prototype.cancelOperationHasValidSignature = function (operation, typedSignature) {
        return this.cancelOperationByHashHasValidSignature(this.getOperationHash(operation), typedSignature, operation.signer);
    };
    /**
     * Returns true if the cancel operation message has a valid signature.
     */
    SignedOperations.prototype.cancelOperationByHashHasValidSignature = function (operationHash, typedSignature, expectedSigner) {
        var cancelHash = this.operationHashToCancelOperationHash(operationHash);
        var signer = SignatureHelper_1.ecRecoverTypedSignature(cancelHash, typedSignature);
        return BytesHelper_1.addressesAreEqual(signer, expectedSigner);
    };
    // ============ Hashing Functions ============
    /**
     * Returns the final signable EIP712 hash for approving an operation.
     */
    SignedOperations.prototype.getOperationHash = function (operation) {
        var structHash = web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_OPERATION_STRING) }, { t: 'bytes32', v: this.getActionsHash(operation.actions) }, { t: 'uint256', v: Helpers_1.toString(operation.expiration) }, { t: 'uint256', v: Helpers_1.toString(operation.salt) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(operation.sender) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(operation.signer) });
        return this.getEIP712Hash(structHash);
    };
    /**
     * Returns the EIP712 hash of the actions array.
     */
    SignedOperations.prototype.getActionsHash = function (actions) {
        var _this = this;
        var actionsAsHashes = actions.length
            ? actions.map(function (action) { return BytesHelper_1.stripHexPrefix(_this.getActionHash(action)); }).join('')
            : '';
        return BytesHelper_1.hashBytes(actionsAsHashes);
    };
    /**
     * Returns the EIP712 hash of a single Action struct.
     */
    SignedOperations.prototype.getActionHash = function (action) {
        return web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_ACTION_STRING) }, { t: 'uint256', v: Helpers_1.toString(action.actionType) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(action.primaryAccountOwner) }, { t: 'uint256', v: Helpers_1.toString(action.primaryAccountNumber) }, { t: 'bytes32', v: this.getAssetAmountHash(action.amount) }, { t: 'uint256', v: Helpers_1.toString(action.primaryMarketId) }, { t: 'uint256', v: Helpers_1.toString(action.secondaryMarketId) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(action.otherAddress) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(action.secondaryAccountOwner) }, { t: 'uint256', v: Helpers_1.toString(action.secondaryAccountNumber) }, { t: 'bytes32', v: BytesHelper_1.hashBytes(action.data) });
    };
    /**
     * Returns the EIP712 hash of an AssetAmount struct.
     */
    SignedOperations.prototype.getAssetAmountHash = function (amount) {
        return web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_ASSET_AMOUNT_STRING) }, { t: 'uint256', v: Helpers_1.toString(amount.sign ? 1 : 0) }, { t: 'uint256', v: Helpers_1.toString(amount.denomination) }, { t: 'uint256', v: Helpers_1.toString(amount.ref) }, { t: 'uint256', v: Helpers_1.toString(amount.value) });
    };
    /**
     * Given some operation hash, returns the hash of a cancel-operation message.
     */
    SignedOperations.prototype.operationHashToCancelOperationHash = function (operationHash) {
        var structHash = web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(EIP712_CANCEL_OPERATION_STRUCT_STRING) }, { t: 'bytes32', v: BytesHelper_1.hashString('Cancel Operations') }, { t: 'bytes32', v: web3_1.default.utils.soliditySha3({ t: 'bytes32', v: operationHash }) });
        return this.getEIP712Hash(structHash);
    };
    /**
     * Returns the EIP712 domain separator hash.
     */
    SignedOperations.prototype.getDomainHash = function () {
        return web3_1.default.utils.soliditySha3({ t: 'bytes32', v: BytesHelper_1.hashString(SignatureHelper_1.EIP712_DOMAIN_STRING) }, { t: 'bytes32', v: BytesHelper_1.hashString('SignedOperationProxy') }, { t: 'bytes32', v: BytesHelper_1.hashString('1.1') }, { t: 'uint256', v: Helpers_1.toString(this.networkId) }, { t: 'bytes32', v: BytesHelper_1.addressToBytes32(this.contracts.signedOperationProxy.options.address) });
    };
    /**
     * Returns a signable EIP712 Hash of a struct
     */
    SignedOperations.prototype.getEIP712Hash = function (structHash) {
        return web3_1.default.utils.soliditySha3({ t: 'bytes2', v: '0x1901' }, { t: 'bytes32', v: this.getDomainHash() }, { t: 'bytes32', v: structHash });
    };
    // ============ Private Helper Functions ============
    SignedOperations.prototype.getDomainData = function () {
        return {
            name: 'SignedOperationProxy',
            version: '1.1',
            chainId: this.networkId,
            verifyingContract: this.contracts.signedOperationProxy.options.address,
        };
    };
    SignedOperations.prototype.ethSignTypedOperationInternal = function (operation, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var actionsData, operationData, data;
            return __generator(this, function (_a) {
                actionsData = operation.actions.map(function (action) {
                    return {
                        actionType: Helpers_1.toString(action.actionType),
                        accountOwner: action.primaryAccountOwner,
                        accountNumber: Helpers_1.toString(action.primaryAccountNumber),
                        assetAmount: {
                            sign: action.amount.sign,
                            denomination: Helpers_1.toString(action.amount.denomination),
                            ref: Helpers_1.toString(action.amount.ref),
                            value: Helpers_1.toString(action.amount.value),
                        },
                        primaryMarketId: Helpers_1.toString(action.primaryMarketId),
                        secondaryMarketId: Helpers_1.toString(action.secondaryMarketId),
                        otherAddress: action.otherAddress,
                        otherAccountOwner: action.secondaryAccountOwner,
                        otherAccountNumber: Helpers_1.toString(action.secondaryAccountNumber),
                        data: action.data,
                    };
                });
                operationData = {
                    actions: actionsData,
                    expiration: operation.expiration.toFixed(0),
                    salt: operation.salt.toFixed(0),
                    sender: operation.sender,
                    signer: operation.signer,
                };
                data = {
                    types: {
                        EIP712Domain: SignatureHelper_1.EIP712_DOMAIN_STRUCT,
                        Operation: EIP712_OPERATION_STRUCT,
                        Action: EIP712_ACTION_STRUCT,
                        AssetAmount: EIP712_ASSET_AMOUNT_STRUCT,
                    },
                    domain: this.getDomainData(),
                    primaryType: 'Operation',
                    message: operationData,
                };
                return [2 /*return*/, this.ethSignTypedDataInternal(operation.signer, data, signingMethod)];
            });
        });
    };
    SignedOperations.prototype.ethSignTypedCancelOperationInternal = function (operationHash, signer, signingMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = {
                    types: {
                        EIP712Domain: SignatureHelper_1.EIP712_DOMAIN_STRUCT,
                        CancelOperation: EIP712_CANCEL_OPERATION_STRUCT,
                    },
                    domain: this.getDomainData(),
                    primaryType: 'CancelOperation',
                    message: {
                        action: 'Cancel Operations',
                        operationHashes: [operationHash],
                    },
                };
                return [2 /*return*/, this.ethSignTypedDataInternal(signer, data, signingMethod)];
            });
        });
    };
    return SignedOperations;
}(Signer_1.Signer));
exports.SignedOperations = SignedOperations;
//# sourceMappingURL=SignedOperations.js.map