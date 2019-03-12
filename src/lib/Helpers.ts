import { BigNumber } from 'bignumber.js';
import { INTEGERS } from './Constants';
import { Decimal, Integer } from '../types';

export function stringToDecimal(s: string) {
  return new BigNumber(s).div(INTEGERS.INTEREST_RATE_BASE);
}

export function decimalToString(d: Decimal | string) {
  return new BigNumber(d).times(INTEGERS.INTEREST_RATE_BASE).toFixed(0);
}

export function integerToValue(i: Integer) {
  return {
    sign: i.isGreaterThan(0),
    value: i.abs(),
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
