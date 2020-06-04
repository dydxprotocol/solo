"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressesAreEqual = exports.stripHexPrefix = exports.hashBytes = exports.hashString = exports.addressToBytes32 = exports.argToBytes = exports.toBytes = exports.bytesToHexString = exports.hexStringToBytes = void 0;
var ethers_1 = require("ethers");
var web3_1 = __importDefault(require("web3"));
var bignumber_js_1 = __importDefault(require("bignumber.js"));
function hexStringToBytes(hex) {
    if (!hex || hex === '0x') {
        return [];
    }
    return web3_1.default.utils.hexToBytes(hex).map(function (x) { return [x]; });
}
exports.hexStringToBytes = hexStringToBytes;
function bytesToHexString(input) {
    return ethers_1.ethers.utils.hexlify(input.map(function (x) { return new bignumber_js_1.default(x[0]).toNumber(); }));
}
exports.bytesToHexString = bytesToHexString;
function toBytes() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var result = args.reduce(function (acc, val) { return acc.concat(argToBytes(val)); }, []);
    return result.map(function (a) { return [a]; });
}
exports.toBytes = toBytes;
function argToBytes(val) {
    var v = val;
    if (typeof (val) === 'boolean') {
        v = val ? '1' : '0';
    }
    if (typeof (val) === 'number') {
        v = val.toString();
    }
    if (val instanceof bignumber_js_1.default) {
        v = val.toFixed(0);
    }
    return web3_1.default.utils.hexToBytes(web3_1.default.utils.padLeft(web3_1.default.utils.toHex(v), 64, '0'));
}
exports.argToBytes = argToBytes;
function addressToBytes32(input) {
    return "0x000000000000000000000000" + stripHexPrefix(input);
}
exports.addressToBytes32 = addressToBytes32;
function hashString(input) {
    return web3_1.default.utils.soliditySha3({ t: 'string', v: input });
}
exports.hashString = hashString;
function hashBytes(input) {
    // javascript soliditySha3 has a problem with empty bytes arrays, so manually return the same
    // value that solidity does for keccak256 of an empty bytes array
    if (!stripHexPrefix(input)) {
        return '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
    }
    return web3_1.default.utils.soliditySha3({ t: 'bytes', v: "0x" + stripHexPrefix(input) });
}
exports.hashBytes = hashBytes;
function stripHexPrefix(input) {
    if (input.indexOf('0x') === 0) {
        return input.substr(2);
    }
    return input;
}
exports.stripHexPrefix = stripHexPrefix;
function addressesAreEqual(addressOne, addressTwo) {
    return addressOne && addressTwo &&
        (stripHexPrefix(addressOne).toLowerCase() === stripHexPrefix(addressTwo).toLowerCase());
}
exports.addressesAreEqual = addressesAreEqual;
//# sourceMappingURL=BytesHelper.js.map