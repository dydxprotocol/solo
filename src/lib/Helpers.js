"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterestPerSecondForDoubleExponent = exports.getInterestPerSecondForPolynomial = exports.getInterestPerSecond = exports.toNumber = exports.coefficientsToString = exports.valueToInteger = exports.integerToValue = exports.toString = exports.decimalToString = exports.stringToDecimal = void 0;
var bignumber_js_1 = require("bignumber.js");
var Constants_1 = require("./Constants");
function stringToDecimal(s) {
    return new bignumber_js_1.BigNumber(s).div(Constants_1.INTEGERS.INTEREST_RATE_BASE);
}
exports.stringToDecimal = stringToDecimal;
function decimalToString(d) {
    return new bignumber_js_1.BigNumber(d).times(Constants_1.INTEGERS.INTEREST_RATE_BASE).toFixed(0);
}
exports.decimalToString = decimalToString;
function toString(input) {
    return new bignumber_js_1.BigNumber(input).toFixed(0);
}
exports.toString = toString;
function integerToValue(i) {
    return {
        sign: i.isGreaterThan(0),
        value: i.abs().toFixed(0),
    };
}
exports.integerToValue = integerToValue;
function valueToInteger(_a) {
    var value = _a.value, sign = _a.sign;
    var result = new bignumber_js_1.BigNumber(value);
    if (!result.isZero() && !sign) {
        result = result.times(-1);
    }
    return result;
}
exports.valueToInteger = valueToInteger;
function coefficientsToString(coefficients) {
    var m = new bignumber_js_1.BigNumber(1);
    var result = new bignumber_js_1.BigNumber(0);
    for (var i = 0; i < coefficients.length; i += 1) {
        result = result.plus(m.times(coefficients[i]));
        m = m.times(256);
    }
    return result.toFixed(0);
}
exports.coefficientsToString = coefficientsToString;
function toNumber(input) {
    return new bignumber_js_1.BigNumber(input).toNumber();
}
exports.toNumber = toNumber;
function getInterestPerSecond(maxAPR, coefficients, totals) {
    return getInterestPerSecondForDoubleExponent(maxAPR, coefficients, totals);
}
exports.getInterestPerSecond = getInterestPerSecond;
function getInterestPerSecondForPolynomial(maxAPR, coefficients, totals) {
    if (totals.totalBorrowed.isZero()) {
        return new bignumber_js_1.BigNumber(0);
    }
    var PERCENT = new bignumber_js_1.BigNumber('100');
    var BASE = new bignumber_js_1.BigNumber('1e18');
    var result = new bignumber_js_1.BigNumber(0);
    if (totals.totalBorrowed.gt(totals.totalSupply)) {
        result = BASE.times(PERCENT);
    }
    else {
        var polynomial = BASE;
        for (var i = 0; i < coefficients.length; i += 1) {
            var coefficient = new bignumber_js_1.BigNumber(coefficients[i]);
            var term = polynomial.times(coefficient);
            result = result.plus(term);
            polynomial = partial(polynomial, totals.totalBorrowed, totals.totalSupply);
        }
    }
    return result
        .times(maxAPR)
        .div(Constants_1.INTEGERS.ONE_YEAR_IN_SECONDS)
        .div(PERCENT)
        .integerValue(bignumber_js_1.BigNumber.ROUND_DOWN)
        .div(BASE);
}
exports.getInterestPerSecondForPolynomial = getInterestPerSecondForPolynomial;
function getInterestPerSecondForDoubleExponent(maxAPR, coefficients, totals) {
    if (totals.totalBorrowed.isZero()) {
        return new bignumber_js_1.BigNumber(0);
    }
    var PERCENT = new bignumber_js_1.BigNumber('100');
    var BASE = new bignumber_js_1.BigNumber('1e18');
    var result = new bignumber_js_1.BigNumber(0);
    if (totals.totalBorrowed.gt(totals.totalSupply)) {
        result = BASE.times(PERCENT);
    }
    else {
        result = BASE.times(coefficients[0]);
        var polynomial = partial(BASE, totals.totalBorrowed, totals.totalSupply);
        for (var i = 1; i < coefficients.length; i += 1) {
            var coefficient = new bignumber_js_1.BigNumber(coefficients[i]);
            var term = polynomial.times(coefficient);
            result = result.plus(term);
            polynomial = partial(polynomial, polynomial, BASE);
        }
    }
    return result
        .times(maxAPR)
        .div(Constants_1.INTEGERS.ONE_YEAR_IN_SECONDS)
        .div(PERCENT)
        .integerValue(bignumber_js_1.BigNumber.ROUND_DOWN)
        .div(BASE);
}
exports.getInterestPerSecondForDoubleExponent = getInterestPerSecondForDoubleExponent;
function partial(target, numerator, denominator) {
    return target.times(numerator).div(denominator).integerValue(bignumber_js_1.BigNumber.ROUND_DOWN);
}
//# sourceMappingURL=Helpers.js.map