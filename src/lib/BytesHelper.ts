import { ethers } from 'ethers';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Integer, address } from '../types';

export function hexStringToBytes(hex: string): number[][] {
  if (!hex || hex === '0x') {
    return [];
  }
  return Web3.utils.hexToBytes(hex).map(x => [x]);
}

export function bytesToHexString(input: (number[] | string)[]): string {
  return ethers.utils.hexlify(input.map(x => new BigNumber(x[0]).toNumber()));
}

export function toBytes(...args: (string | number | Integer | boolean)[]): number[][] {
  const result = args.reduce(
    (
      acc: number[],
      val: string | number | Integer | boolean,
    ): number[] => acc.concat(argToBytes(val)),
    [],
  );
  return result.map((a :number): number[] => [a]);
}

export function argToBytes(
  val: string | number | Integer | boolean,
): number[] {
  let v: any = val;
  if (typeof(val) === 'boolean') {
    v = val ? '1' : '0';
  }
  if (typeof(val) === 'number') {
    v = val.toString();
  }
  if (val instanceof BigNumber) {
    v = val.toFixed(0);
  }

  return Web3.utils.hexToBytes(
    Web3.utils.padLeft(Web3.utils.toHex(v), 64, '0'),
  );
}

export function addressToBytes32(input: address) {
  return `0x000000000000000000000000${ stripHexPrefix(input) }`;
}

export function hashString(input: string) {
  return Web3.utils.soliditySha3({ t: 'string', v: input });
}

export function hashBytes(input: string) {
  // javascript soliditySha3 has a problem with empty bytes arrays, so manually return the same
  // value that solidity does for keccak256 of an empty bytes array
  if (!stripHexPrefix(input)) {
    return '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
  }
  return Web3.utils.soliditySha3({ t: 'bytes', v: `0x${ stripHexPrefix(input) }` });
}

export function stripHexPrefix(input: string) {
  if (input.indexOf('0x') === 0) {
    return input.substr(2);
  }
  return input;
}

export function addressesAreEqual(
  addressOne: string,
  addressTwo: string,
): boolean {
  return addressOne && addressTwo &&
    (stripHexPrefix(addressOne).toLowerCase() === stripHexPrefix(addressTwo).toLowerCase());
}
