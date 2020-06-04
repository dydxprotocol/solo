"use strict";
/*

    Copyright 2019 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interest = void 0;
var bignumber_js_1 = require("bignumber.js");
var Helpers_1 = require("./Helpers");
var interest_constants_json_1 = __importDefault(require("./interest-constants.json"));
var Interest = /** @class */ (function () {
    function Interest(networkId) {
        this.setNetworkId(networkId);
    }
    Interest.prototype.setNetworkId = function (networkId) {
        this.networkId = networkId;
    };
    Interest.prototype.getEarningsRate = function () {
        var networkConstants = this.getNetworkConstants();
        var earningsRate = new bignumber_js_1.BigNumber(networkConstants.earningsRate);
        if (!earningsRate) {
            throw new Error("No earnings rate for network: " + this.networkId);
        }
        return new bignumber_js_1.BigNumber(earningsRate);
    };
    Interest.prototype.getInterestPerSecondByMarket = function (marketId, totals) {
        var earningsRate = this.getEarningsRate();
        var constants = this.getMarketConstants(marketId);
        // determine the borrow interest rate (capped at 18 decimal places)
        var borrowInterestRate = Helpers_1.getInterestPerSecond(new bignumber_js_1.BigNumber(constants.maxAPR), constants.coefficients, totals);
        // determine the supply interest rate (uncapped decimal places)
        var supplyInterestRate = borrowInterestRate.times(earningsRate);
        if (totals.totalBorrowed.lt(totals.totalSupply)) {
            supplyInterestRate = supplyInterestRate.times(totals.totalBorrowed).div(totals.totalSupply);
        }
        return {
            borrowInterestRate: borrowInterestRate,
            supplyInterestRate: supplyInterestRate,
        };
    };
    // ============ Private Helper Functions ============
    Interest.prototype.getNetworkConstants = function () {
        var networkConstants = interest_constants_json_1.default[this.networkId];
        if (!networkConstants) {
            throw new Error("No interest constants for network: " + this.networkId);
        }
        return networkConstants;
    };
    Interest.prototype.getMarketConstants = function (marketId) {
        var networkConstants = this.getNetworkConstants();
        var constants = networkConstants[marketId.toFixed(0)];
        if (!constants) {
            throw new Error("No interest constants for marketId: " + marketId.toFixed(0));
        }
        return constants;
    };
    return Interest;
}());
exports.Interest = Interest;
//# sourceMappingURL=Interest.js.map