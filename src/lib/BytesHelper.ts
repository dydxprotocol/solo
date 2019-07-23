import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { Integer, address } from '../types';
import { hexToBytes, padLeft, toHex, soliditySha3 } from 'web3-utils';

export function hexStringToBytes(hex: string): number[][] {
  return hexToBytes(hex);
}

export function bytesToHexString(input: (number[] | string)[]): string {
  return ethers.utils.hexlify(input.map(x => new BigNumber(x[0]).toNumber()));
}

export function toBytes(...args: (string | number | Integer)[]): number[][] {
  return args.reduce(
    (acc: number[], val: string | number | Integer): number[] => acc.concat(argToBytes(val)), [],
  ).map(
    (a :number): number[] => [a],
  );
}

export function argToBytes(
  val: string | number | Integer,
): number[] {
  let v: any = val;
  if (typeof(val) === 'number') {
    v = val.toString();
  }
  if (val instanceof BigNumber) {
    v = val.toFixed();
  }

  return hexToBytes(
    padLeft(toHex(v), 64, '0'),
  );
}

export function addressToBytes32(input: address) {
  return `0x000000000000000000000000${ stripHexPrefix(input) }`;
}

export function stringToBytes32(input: string) {
  return soliditySha3({ t: 'string', v: input });
}

export function bytesToBytes32(input: string) {
  if (!input || input === '0x') {
    return '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
  }
  return soliditySha3({ t: 'bytes', v: input });
}

export function stripHexPrefix(input: string) {
  if (input.indexOf('0x') === 0) {
    return input.substr(2);
  }
  return input;
}
