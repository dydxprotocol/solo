import { ethers } from 'ethers';
import Web3 from 'web3';
import { stripHexPrefix } from './BytesHelper';
import { address } from '../../src/types';

export enum SIGNATURE_TYPES {
  NO_PREPEND = 0,
  DECIMAL = 1,
  HEXADECIMAL = 2,
}

export const PREPEND_DEC: string =
  '\x19Ethereum Signed Message:\n32';

export const PREPEND_HEX: string =
  '\x19Ethereum Signed Message:\n\x20';

export const EIP712_DOMAIN_STRING: string =
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';

export const EIP712_DOMAIN_STRUCT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export const EIP712_DOMAIN_STRING_NO_CONTRACT: string =
  'EIP712Domain(string name,string version,uint256 chainId)';

export const EIP712_DOMAIN_STRUCT_NO_CONTRACT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
];

export function isValidSigType(
  sigType: number,
): boolean {
  switch (sigType) {
    case SIGNATURE_TYPES.NO_PREPEND:
    case SIGNATURE_TYPES.DECIMAL:
    case SIGNATURE_TYPES.HEXADECIMAL:
      return true;
    default:
      return false;
  }
}

export function ecRecoverTypedSignature(
  hash: string,
  typedSignature: string,
): address {
  if (stripHexPrefix(typedSignature).length !== 66 * 2) {
    throw new Error(`Unable to ecrecover signature: ${typedSignature}`);
  }

  const sigType = parseInt(typedSignature.slice(-2), 16);

  let prependedHash: string;
  switch (sigType) {
    case SIGNATURE_TYPES.NO_PREPEND:
      prependedHash = hash;
      break;
    case SIGNATURE_TYPES.DECIMAL:
      prependedHash = Web3.utils.soliditySha3(
        { t: 'string', v: PREPEND_DEC },
        { t: 'bytes32', v: hash },
      );
      break;
    case SIGNATURE_TYPES.HEXADECIMAL:
      prependedHash = Web3.utils.soliditySha3(
        { t: 'string', v: PREPEND_HEX },
        { t: 'bytes32', v: hash },
      );
      break;
    default:
      throw new Error(`Invalid signature type: ${sigType}`);
  }

  const signature = typedSignature.slice(0, -2);

  return ethers.utils.recoverAddress(ethers.utils.arrayify(prependedHash), signature);
}

export function createTypedSignature(
  signature: string,
  sigType: number,
): string {
  if (!isValidSigType(sigType)) {
    throw new Error(`Invalid signature type: ${sigType}`);
  }
  return `${fixRawSignature(signature)}0${sigType}`;
}

/**
 * Fixes any signatures that don't have a 'v' value of 27 or 28
 */
export function fixRawSignature(
  signature: string,
): string {
  const stripped = stripHexPrefix(signature);

  if (stripped.length !== 130) {
    throw new Error(`Invalid raw signature: ${signature}`);
  }

  const rs = stripped.substr(0, 128);
  const v = stripped.substr(128, 2);

  switch (v) {
    case '00':
      return `0x${rs}1b`;
    case '01':
      return `0x${rs}1c`;
    case '1b':
    case '1c':
      return `0x${stripped}`;
    default:
      throw new Error(`Invalid v value: ${v}`);
  }
}
