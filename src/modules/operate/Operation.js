"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = void 0;
var exchange_wrappers_1 = require("@dydxprotocol/exchange-wrappers");
var AccountOperation_1 = require("./AccountOperation");
var Operation = /** @class */ (function () {
    function Operation(contracts, limitOrders, stopLimitOrders, canonicalOrders, networkId) {
        this.contracts = contracts;
        this.orderMapper = new exchange_wrappers_1.OrderMapper(networkId);
        this.limitOrders = limitOrders;
        this.stopLimitOrders = stopLimitOrders;
        this.canonicalOrders = canonicalOrders;
        this.networkId = networkId;
    }
    Operation.prototype.setNetworkId = function (networkId) {
        this.orderMapper.setNetworkId(networkId);
    };
    Operation.prototype.initiate = function (options) {
        return new AccountOperation_1.AccountOperation(this.contracts, this.orderMapper, this.limitOrders, this.stopLimitOrders, this.canonicalOrders, this.networkId, options || {});
    };
    return Operation;
}());
exports.Operation = Operation;
//# sourceMappingURL=Operation.js.map