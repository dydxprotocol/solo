"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Oracle = void 0;
var MakerStablecoinPriceOracle_1 = require("./oracles/MakerStablecoinPriceOracle");
var Oracle = /** @class */ (function () {
    function Oracle(contracts) {
        this.contracts = contracts;
        this.daiPriceOracle = new MakerStablecoinPriceOracle_1.MakerStablecoinPriceOracle(this.contracts, this.contracts.daiPriceOracle);
        this.saiPriceOracle = new MakerStablecoinPriceOracle_1.MakerStablecoinPriceOracle(this.contracts, this.contracts.saiPriceOracle);
    }
    return Oracle;
}());
exports.Oracle = Oracle;
//# sourceMappingURL=Oracle.js.map