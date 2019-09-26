import { BigNumber } from 'bignumber.js';
import { INTEGERS } from './Constants';
import { Decimal, Integer } from '../types';

export function stringToDecimal(s: string): Decimal {
  return new BigNumber(s).div(INTEGERS.INTEREST_RATE_BASE);
}

export function decimalToString(d: Decimal | string): string {
  return new BigNumber(d).times(INTEGERS.INTEREST_RATE_BASE).toFixed(0);
}

export function toString(input: number | string | BigNumber) {
  return new BigNumber(input).toFixed(0);
}

export function integerToValue(i: Integer) {
  return {
    sign: i.isGreaterThan(0),
    value: i.abs().toFixed(0),
  };
}

export function valueToInteger(
  { value, sign }: { value: string, sign: boolean },
) {
  let result = new BigNumber(value);
  if (!result.isZero() && !sign) {
    result = result.times(-1);
  }
  return result;
}

export function coefficientsToString(
  coefficients: (number | string | Integer)[],
): string {
  let m = new BigNumber(1);
  let result = new BigNumber(0);
  for (let i = 0; i < coefficients.length; i += 1) {
    result = result.plus(m.times(coefficients[i]));
    m = m.times(256);
  }
  return result.toFixed(0);
}

export function toNumber(input: string | number | BigNumber): number {
  return new BigNumber(input).toNumber();
}

export function getInterestPerSecond(
  maxAPR: Decimal,
  coefficients: number[],
  totals: { totalBorrowed: Integer, totalSupply: Integer },
): Decimal {
  return getInterestPerSecondForDoubleExponent(
    maxAPR,
    coefficients,
    totals,
  );
}

export function getInterestPerSecondForPolynomial(
  maxAPR: Decimal,
  coefficients: number[],
  totals: { totalBorrowed: Integer, totalSupply: Integer },
): Decimal {
  if (totals.totalBorrowed.isZero()) {
    return new BigNumber(0);
  }

  const PERCENT = new BigNumber('100');
  const BASE = new BigNumber('1e18');
  let result = new BigNumber(0);

  if (totals.totalBorrowed.gt(totals.totalSupply)) {
    result = BASE.times(PERCENT);
  } else {
    let polynomial = BASE;
    for (let i = 0; i < coefficients.length; i += 1) {
      const coefficient = new BigNumber(coefficients[i]);
      const term = polynomial.times(coefficient);
      result = result.plus(term);
      polynomial = partial(polynomial, totals.totalBorrowed, totals.totalSupply);
    }
  }

  return result
    .times(maxAPR)
    .div(INTEGERS.ONE_YEAR_IN_SECONDS)
    .div(PERCENT)
    .integerValue(BigNumber.ROUND_DOWN)
    .div(BASE);
}

export function getInterestPerSecondForDoubleExponent(
  maxAPR: Decimal,
  coefficients: number[],
  totals: { totalBorrowed: Integer, totalSupply: Integer },
): Decimal {
  if (totals.totalBorrowed.isZero()) {
    return new BigNumber(0);
  }

  const PERCENT = new BigNumber('100');
  const BASE = new BigNumber('1e18');
  let result = new BigNumber(0);

  if (totals.totalBorrowed.gt(totals.totalSupply)) {
    result = BASE.times(PERCENT);
  } else {
    result = BASE.times(coefficients[0]);
    let polynomial = partial(BASE, totals.totalBorrowed, totals.totalSupply);
    for (let i = 1; i < coefficients.length; i += 1) {
      const coefficient = new BigNumber(coefficients[i]);
      const term = polynomial.times(coefficient);
      result = result.plus(term);
      polynomial = partial(polynomial, polynomial, BASE);
    }
  }

  return result
    .times(maxAPR)
    .div(INTEGERS.ONE_YEAR_IN_SECONDS)
    .div(PERCENT)
    .integerValue(BigNumber.ROUND_DOWN)
    .div(BASE);
}

function partial(
  target: BigNumber,
  numerator: BigNumber,
  denominator: BigNumber,
): BigNumber {
  return target.times(numerator).div(denominator).integerValue(BigNumber.ROUND_DOWN);
}
