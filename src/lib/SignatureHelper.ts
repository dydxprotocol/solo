import { soliditySha3 } from 'web3-utils';
import { stripHexPrefix } from './BytesHelper';
import { address } from '../../src/types';

export const SIGNATURE_TYPES = {
  INVALID: 0,
  NO_PREPEND: 1,
  DECIMAL: 2,
  HEXADECIMAL: 3,
  UNSUPPORTED: 4,
};

export const PREPEND_DEC = '\x19Ethereum Signed Message:\n32';

export const PREPEND_HEX = '\x19Ethereum Signed Message:\n\x20';

export const EIP712_DOMAIN_STRING =
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';

export const EIP712_DOMAIN_STRUCT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export function isValidSigType(
  sigType: number,
): boolean {
  return (sigType > SIGNATURE_TYPES.INVALID && sigType < SIGNATURE_TYPES.UNSUPPORTED);
}

export async function ecRecoverTypedSignature(
  hash: string,
  typedSignature: string,
): Promise<address> {
  if (stripHexPrefix(typedSignature).length !== 66 * 2) {
    throw new Error(`Unable to ecrecover signature: ${typedSignature}`);
  }

  const sigType = parseInt(typedSignature.slice(-2), 16);
  if (!isValidSigType(sigType)) {
    throw new Error(`Invalid signature type: ${sigType}`);
  }

  let prependedHash: string;
  switch (sigType) {
    case SIGNATURE_TYPES.NO_PREPEND:
      prependedHash = hash;
      break;
    case SIGNATURE_TYPES.DECIMAL:
      prependedHash = soliditySha3(
        { t: 'string', v: PREPEND_DEC },
        { t: 'bytes32', v: hash },
      );
      break;
    case SIGNATURE_TYPES.HEXADECIMAL:
      prependedHash = soliditySha3(
        { t: 'string', v: PREPEND_HEX },
        { t: 'bytes32', v: hash },
      );
      break;
    default:
      throw new Error(`Invalid signature type: ${sigType}`);
  }

  const signature = typedSignature.slice(0, -2);

  return this.web3.eth.accounts.recover(prependedHash, signature);
}

export function createTypedSignature(
  signature: string,
  sigType: number,
): string {
  if (!isValidSigType(sigType)) {
    throw new Error(`Invalid signature type: ${sigType}`);
  }
  return `0x${stripHexPrefix(signature)}0${sigType}`;
}
