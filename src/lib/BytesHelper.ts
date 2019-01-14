import Web3 from 'web3';
import { Integer } from '../types';

const web3 = new Web3();

export function toBytes(...args: Integer[]): number[] {
  return args.reduce((acc: number[], val: Integer): number[] => acc.concat(argToBytes(val)), []);
}

function argToBytes(val: string | Integer) {
  return web3.utils.hexToBytes(
    web3.utils.padLeft(web3.utils.toHex(val), 64, '0'),
  );
}
