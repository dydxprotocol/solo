import BigNumber from 'bignumber.js';
import { Integer } from '../types';
import { hexToBytes, padLeft, toHex } from 'web3-utils';

export function toBytes(...args: Integer[]): number[][] {
  return args.reduce(
    (acc: number[], val: Integer): number[] => acc.concat(argToBytes(val)), [],
  ).map(
    (a :number): number[] => [a],
  );
}

function argToBytes(val: string | Integer) {
  let v: any = val;
  if (val instanceof BigNumber) {
    v = val.toFixed();
  }

  return hexToBytes(
    padLeft(toHex(v), 64, '0'),
  );
}
