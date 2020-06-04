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
exports.Token = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Constants_1 = require("../lib/Constants");
var Token = /** @class */ (function () {
    function Token(contracts) {
        this.contracts = contracts;
        this.tokens = {};
    }
    Token.prototype.getAllowance = function (tokenAddress, ownerAddress, spenderAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token, allowStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = this.getToken(tokenAddress);
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(token.methods.allowance(ownerAddress, spenderAddress), options)];
                    case 1:
                        allowStr = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(allowStr)];
                }
            });
        });
    };
    Token.prototype.getBalance = function (tokenAddress, ownerAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token, balStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = this.getToken(tokenAddress);
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(token.methods.balanceOf(ownerAddress), options)];
                    case 1:
                        balStr = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(balStr)];
                }
            });
        });
    };
    Token.prototype.getTotalSupply = function (tokenAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token, supplyStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = this.getToken(tokenAddress);
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(token.methods.totalSupply(), options)];
                    case 1:
                        supplyStr = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(supplyStr)];
                }
            });
        });
    };
    Token.prototype.getName = function (tokenAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.getToken(tokenAddress);
                return [2 /*return*/, this.contracts.callConstantContractFunction(token.methods.name(), options)];
            });
        });
    };
    Token.prototype.getSymbol = function (tokenAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.getToken(tokenAddress);
                return [2 /*return*/, this.contracts.callConstantContractFunction(token.methods.symbol(), options)];
            });
        });
    };
    Token.prototype.getDecimals = function (tokenAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            var token, decStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = this.getToken(tokenAddress);
                        return [4 /*yield*/, this.contracts.callConstantContractFunction(token.methods.decimals(), options)];
                    case 1:
                        decStr = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(decStr)];
                }
            });
        });
    };
    Token.prototype.getSoloAllowance = function (tokenAddress, ownerAddress, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAllowance(tokenAddress, ownerAddress, this.contracts.soloMargin.options.address, options)];
            });
        });
    };
    Token.prototype.setAllowance = function (tokenAddress, ownerAddress, spenderAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.getToken(tokenAddress);
                return [2 /*return*/, this.contracts.callContractFunction(token.methods.approve(spenderAddress, amount.toFixed(0)), __assign(__assign({}, options), { from: ownerAddress }))];
            });
        });
    };
    Token.prototype.setSolollowance = function (tokenAddress, ownerAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setAllowance(tokenAddress, ownerAddress, this.contracts.soloMargin.options.address, amount, options)];
            });
        });
    };
    Token.prototype.setMaximumAllowance = function (tokenAddress, ownerAddress, spenderAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setAllowance(tokenAddress, ownerAddress, spenderAddress, Constants_1.INTEGERS.ONES_255, options)];
            });
        });
    };
    Token.prototype.setMaximumSoloAllowance = function (tokenAddress, ownerAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setAllowance(tokenAddress, ownerAddress, this.contracts.soloMargin.options.address, Constants_1.INTEGERS.ONES_255, options)];
            });
        });
    };
    Token.prototype.unsetSoloAllowance = function (tokenAddress, ownerAddress, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setAllowance(tokenAddress, ownerAddress, this.contracts.soloMargin.options.address, Constants_1.INTEGERS.ZERO, options)];
            });
        });
    };
    Token.prototype.transfer = function (tokenAddress, fromAddress, toAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.getToken(tokenAddress);
                return [2 /*return*/, this.contracts.callContractFunction(token.methods.transfer(toAddress, amount.toFixed(0)), __assign(__assign({}, options), { from: fromAddress }))];
            });
        });
    };
    Token.prototype.transferFrom = function (tokenAddress, fromAddress, toAddress, senderAddress, amount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.getToken(tokenAddress);
                return [2 /*return*/, this.contracts.callContractFunction(token.methods.transferFrom(fromAddress, toAddress, amount.toFixed(0)), __assign(__assign({}, options), { from: senderAddress }))];
            });
        });
    };
    Token.prototype.subscribeToTransfers = function (tokenAddress, _a) {
        var _b = _a === void 0 ? {} : _a, from = _b.from, to = _b.to, fromBlock = _b.fromBlock;
        var token = this.getToken(tokenAddress);
        var filter = {};
        if (from) {
            filter.from = from;
        }
        if (to) {
            filter.to = to;
        }
        return token.events.Transfer({
            filter: filter,
            fromBlock: fromBlock,
        });
    };
    Token.prototype.subscribeToApprovals = function (tokenAddress, _a) {
        var _b = _a === void 0 ? {} : _a, owner = _b.owner, spender = _b.spender, fromBlock = _b.fromBlock;
        var token = this.getToken(tokenAddress);
        var filter = {};
        if (owner) {
            filter.owner = owner;
        }
        if (spender) {
            filter.spender = spender;
        }
        return token.events.Approval({
            filter: filter,
            fromBlock: fromBlock,
        });
    };
    Token.prototype.getToken = function (tokenAddress) {
        if (this.tokens[tokenAddress]) {
            return this.tokens[tokenAddress];
        }
        var token = this.contracts.erc20;
        var contract = token.clone();
        contract.options.address = tokenAddress;
        this.tokens[tokenAddress] = contract;
        return contract;
    };
    return Token;
}());
exports.Token = Token;
//# sourceMappingURL=Token.js.map