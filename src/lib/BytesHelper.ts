import Web3 from 'web3';
import BN from 'bn.js';

const web3 = new Web3();

export function toBytes(...args: BN[]): number[] {
  return args.reduce((acc: number[], val: BN): number[] => acc.concat(argToBytes(val)), []);
}

function argToBytes(val: string | BN) {
  return web3.utils.hexToBytes(
    web3.utils.padLeft(web3.utils.toHex(val), 64, '0'),
  );
}
