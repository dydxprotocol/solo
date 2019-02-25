import { BigNumber } from 'bignumber.js';
import { INTEGERS } from './Constants';
import { Decimal, Integer } from '../types';

export function stringToDecimal(s: string) {
  return new BigNumber(s).div(INTEGERS.INTEREST_RATE_BASE);
}

export function decimalToString(d: Decimal) {
  return d.times(INTEGERS.INTEREST_RATE_BASE).toFixed(0);
}

export function integerToValue(i: Integer) {
  return {
    sign: i.isGreaterThan(0),
    value: i.abs(),
  };
}

export function valueToInteger({ value, sign }: { value: string, sign: boolean }) {
  let result = new BigNumber(value);
  if (!result.isZero() && !sign) {
    result = result.times(-1);
  }
  return result;
}
