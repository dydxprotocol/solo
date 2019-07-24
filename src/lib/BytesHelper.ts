import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Integer, address } from '../types';

export function hexStringToBytes(hex: string): number[][] {
  return Web3.utils.hexToBytes(hex).map(x => [x]);
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

  return Web3.utils.hexToBytes(
    Web3.utils.padLeft(Web3.utils.toHex(v), 64, '0'),
  );
}

export function addressToBytes32(input: address) {
  return `0x000000000000000000000000${ stripHexPrefix(input) }`;
}

export function stringToBytes32(input: string) {
  return Web3.utils.soliditySha3({ t: 'string', v: input });
}

export function bytesToBytes32(input: string) {
  return Web3.utils.soliditySha3({ t: 'bytes', v: input });
}

export function stripHexPrefix(input: string) {
  if (input.indexOf('0x') === 0) {
    return input.substr(2);
  }
  return input;
}
