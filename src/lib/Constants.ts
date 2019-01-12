import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export const SUBTRACT_GAS_LIMIT: number = 100000;

export const BNS = {
  ZERO: new BN(0),
  ONE_DAY_IN_SECONDS: new BN(60 * 60 * 24),
  ONE_YEAR_IN_SECONDS: new BN(60 * 60 * 24 * 365),
  ONES_31: new BN('4294967295'), // 2**32-1
  ONES_127: new BN('340282366920938463463374607431768211455'), // 2**128-1
  ONES_255: new BN(
    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
  ), // 2**256-1
};

export const BIG_NUMBERS = {
  INTEREST_RATE_BASE: new BigNumber('1e18'),
};
