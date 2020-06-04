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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weth = void 0;
var Weth = /** @class */ (function () {
    function Weth(contracts, token) {
        this.contracts = contracts;
        this.token = token;
        this.weth = contracts.weth;
    }
    Weth.prototype.getAddress = function () {
        return this.weth.options.address;
    };
    Weth.prototype.wrap = function (ownerAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callContractFunction(this.weth.methods.deposit(), __assign(__assign({}, options), { from: ownerAddress, value: amount.toFixed(0) }))];
            });
        });
    };
    Weth.prototype.unwrap = function (ownerAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contracts.callContractFunction(this.weth.methods.withdraw(amount.toFixed(0)), __assign(__assign({}, options), { from: ownerAddress }))];
            });
        });
    };
    Weth.prototype.getAllowance = function (ownerAddress, spenderAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getAllowance(this.weth.options.address, ownerAddress, spenderAddress, options)];
            });
        });
    };
    Weth.prototype.getBalance = function (ownerAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getBalance(this.weth.options.address, ownerAddress, options)];
            });
        });
    };
    Weth.prototype.getTotalSupply = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getTotalSupply(this.weth.options.address, options)];
            });
        });
    };
    Weth.prototype.getName = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getName(this.weth.options.address, options)];
            });
        });
    };
    Weth.prototype.getSymbol = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getSymbol(this.weth.options.address, options)];
            });
        });
    };
    Weth.prototype.getDecimals = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getDecimals(this.weth.options.address, options)];
            });
        });
    };
    Weth.prototype.getSoloAllowance = function (ownerAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.getSoloAllowance(this.weth.options.address, ownerAddress, options)];
            });
        });
    };
    Weth.prototype.setAllowance = function (ownerAddress, spenderAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.setAllowance(this.weth.options.address, ownerAddress, spenderAddress, amount, options)];
            });
        });
    };
    Weth.prototype.setSolollowance = function (ownerAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.setSolollowance(this.weth.options.address, ownerAddress, amount, options)];
            });
        });
    };
    Weth.prototype.setMaximumAllowance = function (ownerAddress, spenderAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.setMaximumAllowance(this.weth.options.address, ownerAddress, spenderAddress, options)];
            });
        });
    };
    Weth.prototype.setMaximumSoloAllowance = function (ownerAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.setMaximumSoloAllowance(this.weth.options.address, ownerAddress, options)];
            });
        });
    };
    Weth.prototype.unsetSoloAllowance = function (ownerAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.unsetSoloAllowance(this.weth.options.address, ownerAddress, options)];
            });
        });
    };
    Weth.prototype.transfer = function (fromAddress, toAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.transfer(this.weth.options.address, fromAddress, toAddress, amount, options)];
            });
        });
    };
    Weth.prototype.transferFrom = function (fromAddress, toAddress, senderAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.token.transferFrom(this.weth.options.address, fromAddress, toAddress, senderAddress, amount, options)];
            });
        });
    };
    return Weth;
}());
exports.Weth = Weth;
//# sourceMappingURL=Weth.js.map