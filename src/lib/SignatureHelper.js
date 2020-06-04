"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixRawSignature = exports.createTypedSignature = exports.ecRecoverTypedSignature = exports.isValidSigType = exports.EIP712_DOMAIN_STRUCT_NO_CONTRACT = exports.EIP712_DOMAIN_STRING_NO_CONTRACT = exports.EIP712_DOMAIN_STRUCT = exports.EIP712_DOMAIN_STRING = exports.PREPEND_HEX = exports.PREPEND_DEC = exports.SIGNATURE_TYPES = void 0;
var ethers_1 = require("ethers");
var web3_1 = __importDefault(require("web3"));
var BytesHelper_1 = require("./BytesHelper");
var SIGNATURE_TYPES;
(function (SIGNATURE_TYPES) {
    SIGNATURE_TYPES[SIGNATURE_TYPES["NO_PREPEND"] = 0] = "NO_PREPEND";
    SIGNATURE_TYPES[SIGNATURE_TYPES["DECIMAL"] = 1] = "DECIMAL";
    SIGNATURE_TYPES[SIGNATURE_TYPES["HEXADECIMAL"] = 2] = "HEXADECIMAL";
})(SIGNATURE_TYPES = exports.SIGNATURE_TYPES || (exports.SIGNATURE_TYPES = {}));
exports.PREPEND_DEC = '\x19Ethereum Signed Message:\n32';
exports.PREPEND_HEX = '\x19Ethereum Signed Message:\n\x20';
exports.EIP712_DOMAIN_STRING = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
exports.EIP712_DOMAIN_STRUCT = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];
exports.EIP712_DOMAIN_STRING_NO_CONTRACT = 'EIP712Domain(string name,string version,uint256 chainId)';
exports.EIP712_DOMAIN_STRUCT_NO_CONTRACT = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
];
function isValidSigType(sigType) {
    switch (sigType) {
        case SIGNATURE_TYPES.NO_PREPEND:
        case SIGNATURE_TYPES.DECIMAL:
        case SIGNATURE_TYPES.HEXADECIMAL:
            return true;
        default:
            return false;
    }
}
exports.isValidSigType = isValidSigType;
function ecRecoverTypedSignature(hash, typedSignature) {
    if (BytesHelper_1.stripHexPrefix(typedSignature).length !== 66 * 2) {
        throw new Error("Unable to ecrecover signature: " + typedSignature);
    }
    var sigType = parseInt(typedSignature.slice(-2), 16);
    var prependedHash;
    switch (sigType) {
        case SIGNATURE_TYPES.NO_PREPEND:
            prependedHash = hash;
            break;
        case SIGNATURE_TYPES.DECIMAL:
            prependedHash = web3_1.default.utils.soliditySha3({ t: 'string', v: exports.PREPEND_DEC }, { t: 'bytes32', v: hash });
            break;
        case SIGNATURE_TYPES.HEXADECIMAL:
            prependedHash = web3_1.default.utils.soliditySha3({ t: 'string', v: exports.PREPEND_HEX }, { t: 'bytes32', v: hash });
            break;
        default:
            throw new Error("Invalid signature type: " + sigType);
    }
    var signature = typedSignature.slice(0, -2);
    return ethers_1.ethers.utils.recoverAddress(ethers_1.ethers.utils.arrayify(prependedHash), signature);
}
exports.ecRecoverTypedSignature = ecRecoverTypedSignature;
function createTypedSignature(signature, sigType) {
    if (!isValidSigType(sigType)) {
        throw new Error("Invalid signature type: " + sigType);
    }
    return fixRawSignature(signature) + "0" + sigType;
}
exports.createTypedSignature = createTypedSignature;
/**
 * Fixes any signatures that don't have a 'v' value of 27 or 28
 */
function fixRawSignature(signature) {
    var stripped = BytesHelper_1.stripHexPrefix(signature);
    if (stripped.length !== 130) {
        throw new Error("Invalid raw signature: " + signature);
    }
    var rs = stripped.substr(0, 128);
    var v = stripped.substr(128, 2);
    switch (v) {
        case '00':
            return "0x" + rs + "1b";
        case '01':
            return "0x" + rs + "1c";
        case '1b':
        case '1c':
            return "0x" + stripped;
        default:
            throw new Error("Invalid v value: " + v);
    }
}
exports.fixRawSignature = fixRawSignature;
//# sourceMappingURL=SignatureHelper.js.map