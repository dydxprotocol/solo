import Web3 from 'web3';
import { promisify } from 'es6-promisify';
import {
  stripHexPrefix,
} from '../lib/BytesHelper';
import {
  SIGNATURE_TYPES,
} from '../lib/SignatureHelper';
import {
  SigningMethod,
} from '../../src/types';

export abstract class Signer {
  protected web3: Web3;

  // ============ Constructor ============

  constructor(
    web3: Web3,
  ) {
    this.web3 = web3;
  }

  // ============ Functions ============

  /**
   * Returns a signable EIP712 Hash of a struct
   */
  public getEIP712Hash(
    structHash: string,
  ): string {
    return Web3.utils.soliditySha3(
      { t: 'bytes2', v: '0x1901' },
      { t: 'bytes32', v: this.getDomainHash() },
      { t: 'bytes32', v: structHash },
    );
  }

  /**
   * Returns the EIP712 domain separator hash.
   */
  public abstract getDomainHash(): string;

  protected async ethSignTypedDataInternal(
    signer: string,
    data: any,
    signingMethod: SigningMethod,
  ): Promise<string> {
    let sendMethod: string;
    let rpcMethod: string;
    let rpcData: any;

    switch (signingMethod) {
      case SigningMethod.TypedData:
        sendMethod = 'send';
        rpcMethod = 'eth_signTypedData';
        rpcData = data;
        break;
      case SigningMethod.MetaMask:
        sendMethod = 'sendAsync';
        rpcMethod = 'eth_signTypedData_v3';
        rpcData = JSON.stringify(data);
        break;
      case SigningMethod.MetaMaskLatest:
        sendMethod = 'sendAsync';
        rpcMethod = 'eth_signTypedData_v4';
        rpcData = JSON.stringify(data);
        break;
      case SigningMethod.CoinbaseWallet:
        sendMethod = 'sendAsync';
        rpcMethod = 'eth_signTypedData';
        rpcData = data;
        break;
      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }

    const provider = this.web3.currentProvider;
    const sendAsync = promisify(provider[sendMethod]).bind(provider);
    const response = await sendAsync({
      method: rpcMethod,
      params: [signer, rpcData],
      jsonrpc: '2.0',
      id: new Date().getTime(),
    });
    if (response.error) {
      throw new Error(response.error.message);
    }
    return `0x${stripHexPrefix(response.result)}0${SIGNATURE_TYPES.NO_PREPEND}`;
  }
}
