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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logs = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Helpers_1 = require("../lib/Helpers");
var Events_json_1 = require("../../build/published_contracts/Events.json");
var AdminImpl_json_1 = require("../../build/published_contracts/AdminImpl.json");
var Permission_json_1 = require("../../build/published_contracts/Permission.json");
var ExpiryV2_json_1 = require("../../build/published_contracts/ExpiryV2.json");
var Refunder_json_1 = require("../../build/published_contracts/Refunder.json");
var LimitOrders_json_1 = require("../../build/published_contracts/LimitOrders.json");
var StopLimitOrders_json_1 = require("../../build/published_contracts/StopLimitOrders.json");
var CanonicalOrders_json_1 = require("../../build/published_contracts/CanonicalOrders.json");
var SignedOperationProxy_json_1 = require("../../build/published_contracts/SignedOperationProxy.json");
var Logs = /** @class */ (function () {
    function Logs(contracts, web3) {
        this.contracts = contracts;
        this.web3 = web3;
    }
    Logs.prototype.parseLogs = function (receipt, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var logs = this.parseAllLogs(receipt);
        if (options.skipAdminLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, AdminImpl_json_1.abi); });
        }
        if (options.skipOperationLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, Events_json_1.abi); });
        }
        if (options.skipPermissionLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, Permission_json_1.abi); });
        }
        if (options.skipExpiryLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, ExpiryV2_json_1.abi); });
        }
        if (options.skipRefunderLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, Refunder_json_1.abi); });
        }
        if (options.skipLimitOrdersLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, LimitOrders_json_1.abi); });
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, StopLimitOrders_json_1.abi); });
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, CanonicalOrders_json_1.abi); });
        }
        if (options.skipSignedOperationProxyLogs) {
            logs = logs.filter(function (log) { return !_this.logIsFrom(log, SignedOperationProxy_json_1.abi); });
        }
        return logs;
    };
    Logs.prototype.logIsFrom = function (log, abi) {
        return abi.filter(function (e) { return e.name === log.name; }).length !== 0;
    };
    Logs.prototype.parseAllLogs = function (receipt) {
        var _this = this;
        var events;
        if (receipt.logs) {
            events = JSON.parse(JSON.stringify(receipt.logs));
            return events.map(function (e) { return _this.parseLog(e); }).filter(function (l) { return !!l; });
        }
        if (receipt.events) {
            var tempEvents = JSON.parse(JSON.stringify(receipt.events));
            events = [];
            Object.values(tempEvents).forEach(function (e) {
                if (Array.isArray(e)) {
                    e.forEach(function (ev) { return events.push(ev); });
                }
                else {
                    events.push(e);
                }
            });
            events.sort(function (a, b) { return a.logIndex - b.logIndex; });
            return events.map(function (e) { return _this.parseEvent(e); }).filter(function (l) { return !!l; });
        }
        throw new Error('Receipt has no logs');
    };
    Logs.prototype.parseEvent = function (event) {
        return this.parseLog({
            address: event.address,
            data: event.raw.data,
            topics: event.raw.topics,
            logIndex: event.logIndex,
            transactionHash: event.transactionHash,
            transactionIndex: event.transactionIndex,
            blockHash: event.blockHash,
            blockNumber: event.blockNumber,
        });
    };
    Logs.prototype.parseLog = function (log) {
        switch (log.address.toLowerCase()) {
            case this.contracts.soloMargin.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.soloMargin, log);
            }
            case this.contracts.expiryV2.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.expiryV2, log);
            }
            case this.contracts.refunder.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.refunder, log);
            }
            case this.contracts.limitOrders.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.limitOrders, log);
            }
            case this.contracts.stopLimitOrders.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.stopLimitOrders, log);
            }
            case this.contracts.canonicalOrders.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.canonicalOrders, log);
            }
            case this.contracts.signedOperationProxy.options.address.toLowerCase(): {
                return this.parseLogWithContract(this.contracts.signedOperationProxy, log);
            }
        }
        return null;
    };
    Logs.prototype.parseLogWithContract = function (contract, log) {
        var events = contract.options.jsonInterface.filter(function (e) { return e.type === 'event'; });
        var eventJson = events.find(function (e) { return e.signature.toLowerCase() === log.topics[0].toLowerCase(); });
        if (!eventJson) {
            throw new Error('Event type not found');
        }
        var eventArgs = this.web3.eth.abi.decodeLog(eventJson.inputs, log.data, log.topics.slice(1));
        return __assign(__assign({}, log), { name: eventJson.name, args: this.parseArgs(eventJson, eventArgs) });
    };
    Logs.prototype.parseArgs = function (eventJson, eventArgs) {
        var _this = this;
        var parsed = {};
        eventJson.inputs.forEach(function (input) {
            var val;
            if (input.type === 'address') {
                val = eventArgs[input.name];
            }
            else if (input.type === 'bool') {
                val = eventArgs[input.name];
            }
            else if (input.type.match(/^bytes[0-9]*$/)) {
                val = eventArgs[input.name];
            }
            else if (input.type.match(/^uint[0-9]*$/)) {
                val = new bignumber_js_1.default(eventArgs[input.name]);
            }
            else if (input.type === 'tuple') {
                val = _this.parseTuple(input, eventArgs);
            }
            else {
                throw new Error("Unknown evnt arg type " + input.type);
            }
            parsed[input.name] = val;
            if (input.name === 'orderFlags') {
                var parsedOrderFlags = _this.parseOrderFlags(eventArgs[input.name]);
                parsed.isBuy = parsedOrderFlags.isBuy;
                parsed.isDecreaseOnly = parsedOrderFlags.isDecreaseOnly;
                parsed.isNegativeLimitFee = parsedOrderFlags.isNegativeLimitFee;
            }
        });
        return parsed;
    };
    Logs.prototype.parseOrderFlags = function (flags) {
        var flag = new bignumber_js_1.default(flags.charAt(flags.length - 1)).toNumber();
        return {
            isBuy: (flag & 1) !== 0,
            isDecreaseOnly: (flag & 2) !== 0,
            isNegativeLimitFee: (flag & 4) !== 0,
        };
    };
    Logs.prototype.parseTuple = function (input, eventArgs) {
        if (Array.isArray(input.components)
            && input.components.length === 2
            && input.components[0].name === 'owner'
            && input.components[1].name === 'number') {
            return this.parseAccountInfo(eventArgs[input.name]);
        }
        if (Array.isArray(input.components)
            && input.components.length === 2
            && input.components[0].name === 'deltaWei'
            && input.components[1].name === 'newPar') {
            return this.parseBalanceUpdate(eventArgs[input.name]);
        }
        if (Array.isArray(input.components)
            && input.components.length === 3
            && input.components[0].name === 'borrow'
            && input.components[1].name === 'supply'
            && input.components[2].name === 'lastUpdate') {
            return this.parseIndex(eventArgs[input.name]);
        }
        if (Array.isArray(input.components)
            && input.components.length === 1
            && input.components[0].name === 'value') {
            if (input.name.toLowerCase().includes('spread')
                || input.name.toLowerCase().includes('ratio')
                || input.name.toLowerCase().includes('rate')
                || input.name.toLowerCase().includes('premium')) {
                return this.parseDecimalValue(eventArgs[input.name]);
            }
            return this.parseIntegerValue(eventArgs[input.name]);
        }
        if (Array.isArray(input.components)
            && input.components.length === 3
            && input.components[0].name === 'price'
            && input.components[1].name === 'fee'
            && input.components[2].name === 'isNegativeFee') {
            return this.parseFillData(eventArgs[input.name]);
        }
        throw new Error('Unknown tuple type in event');
    };
    Logs.prototype.parseAccountInfo = function (accountInfo) {
        return {
            owner: accountInfo.owner,
            number: new bignumber_js_1.default(accountInfo.number),
        };
    };
    Logs.prototype.parseIndex = function (index) {
        return {
            borrow: Helpers_1.stringToDecimal(index.borrow),
            supply: Helpers_1.stringToDecimal(index.supply),
            lastUpdate: new bignumber_js_1.default(index.lastUpdate),
        };
    };
    Logs.prototype.parseBalanceUpdate = function (update) {
        return {
            deltaWei: Helpers_1.valueToInteger(update.deltaWei),
            newPar: Helpers_1.valueToInteger(update.newPar),
        };
    };
    Logs.prototype.parseDecimalValue = function (value) {
        return Helpers_1.stringToDecimal(value.value);
    };
    Logs.prototype.parseIntegerValue = function (value) {
        return new bignumber_js_1.default(value.value);
    };
    Logs.prototype.parseFillData = function (fillData) {
        return {
            price: Helpers_1.stringToDecimal(fillData.price),
            fee: Helpers_1.stringToDecimal(fillData.fee),
            isNegativeFee: fillData.isNegativeFee,
        };
    };
    return Logs;
}());
exports.Logs = Logs;
//# sourceMappingURL=Logs.js.map