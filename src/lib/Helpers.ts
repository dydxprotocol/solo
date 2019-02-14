import { BigNumber } from 'bignumber.js';
import { INTEGERS } from './Constants';
import { Decimal } from '../types';

export function stringToDecimal(s: string) {
  return new BigNumber(s).div(INTEGERS.INTEREST_RATE_BASE);
}

export function decimalToString(d: Decimal) {
  return d.times(INTEGERS.INTEREST_RATE_BASE).toFixed(0);
}
