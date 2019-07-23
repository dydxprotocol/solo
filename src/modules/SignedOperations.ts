import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { soliditySha3 } from 'web3-utils';
import { promisify } from 'es6-promisify';
import { Contracts } from '../lib/Contracts';
import {
  addressToBytes32,
  bytesToBytes32,
  stringToBytes32,
  stripHexPrefix,
} from '../lib/BytesHelper';
import {
  address,
  Action,
  AssetAmount,
  Operation,
  SignedOperation,
  ContractCallOptions,
} from '../../src/types';
import {
  SIGNATURE_TYPES,
  EIP712_DOMAIN_STRING,
  EIP712_DOMAIN_STRUCT,
  createTypedSignature,
  ecRecoverTypedSignature,
} from '../lib/SignatureHelper';

const EIP712_OPERATION_STRUCT = [
  { type: 'Action[]', name: 'actions' },
  { type: 'uint256', name: 'expiration' },
  { type: 'uint256', name: 'salt' },
  { type: 'address', name: 'sender' },
];

const EIP712_ACTION_STRUCT = [
  { type: 'uint8', name: 'actionType' },
  { type: 'address', name: 'accountOwner' },
  { type: 'uint256', name: 'accountNumber' },
  { type: 'AssetAmount', name: 'assetAmount' },
  { type: 'uint256', name: 'primaryMarketId' },
  { type: 'uint256', name: 'secondaryMarketId' },
  { type: 'address', name: 'otherAddress' },
  { type: 'address', name: 'otherAccountOwner' },
  { type: 'uint256', name: 'otherAccountNumber' },
  { type: 'bytes', name: 'data' },
];

const EIP712_ASSET_AMOUNT_STRUCT = [
  { type: 'bool', name: 'sign' },
  { type: 'uint8', name: 'denomination' },
  { type: 'uint8', name: 'ref' },
  { type: 'uint256', name: 'value' },
];

const EIP712_ASSET_AMOUNT_STRING =
  'AssetAmount(' +
  'bool sign,' +
  'uint8 denomination,' +
  'uint8 ref,' +
  'uint256 value' +
  ')';

const EIP712_ACTION_STRING =
  'Action(' + // tslint:disable-line:prefer-template
  'uint8 actionType,' +
  'address accountOwner,' +
  'uint256 accountNumber,' +
  'AssetAmount assetAmount,' +
  'uint256 primaryMarketId,' +
  'uint256 secondaryMarketId,' +
  'address otherAddress,' +
  'address otherAccountOwner,' +
  'uint256 otherAccountNumber,' +
  'bytes data' +
  ')' +
  EIP712_ASSET_AMOUNT_STRING;

const EIP712_OPERATION_STRING =
  'Operation(' + // tslint:disable-line:prefer-template
  'Action[] actions,' +
  'uint256 expiration,' +
  'uint256 salt,' +
  'address sender' +
  ')' +
  EIP712_ACTION_STRING;

export class SignedOperations {
  private contracts: Contracts;
  private web3: Web3;
  private networkId: number;

  // ============ Constructor ============

  constructor(
    contracts: Contracts,
    web3: Web3,
    networkId: number,
  ) {
    this.contracts = contracts;
    this.web3 = web3;
    this.networkId = networkId;
  }

  // ============ On-Chain Cancel ============

  /**
   * Sends an transaction to cancel an operation on-chain.
   */
  public async cancelOperation(
    operation: Operation,
    options?: ContractCallOptions,
  ): Promise<any> {
    const operationHash = this.getOperationHash(operation);
    return this.contracts.callContractFunction(
      this.contracts.signedOperationProxy.methods.cancel(operationHash),
      options,
    );
  }

  // ============ Getter Contract Methods ============

  // TODO

  // ============ Signing Methods ============

  /**
   * Sends operation to current provider for signing. Uses the 'eth_signTypedData_v3' rpc call which
   * is compatible only with Metamask.
   */
  public async ethSignTypedOperationWithMetamask(
    operation: Operation,
  ): Promise<string> {
    return this.ethSignTypedOperationInternal(
      operation,
      'eth_signTypedData_v3',
    );
  }

  /**
   * Sends operation to current provider for signing. Uses the 'eth_signTypedData' rpc call. This
   * should be used for any provider that is not Metamask.
   */
  public async ethSignTypedOperation(
    operation: Operation,
  ): Promise<string> {
    return this.ethSignTypedOperationInternal(
      operation,
      'eth_signTypedData',
    );
  }

  /**
   * Uses web3.eth.sign to sign the hash of the operation.
   */
  public async ethSignOperation(
    operation: Operation,
  ): Promise<string> {
    const hash = this.getOperationHash(operation);
    const signature = await this.web3.eth.sign(hash, operation.signer);
    return createTypedSignature(signature, SIGNATURE_TYPES.DECIMAL);
  }

  /**
   * Uses web3.eth.sign to sign a cancel message for an operation. This signature is not used
   * on-chain,but allows dYdX backend services to verify that the cancel operation api call is from
   * the original maker of the operation.
   */
  public async ethSignCancelOperation(
    operation: Operation,
  ): Promise<string> {
    return this.ethSignCancelOperationByHash(
      this.getOperationHash(operation),
      operation.signer,
    );
  }

  /**
   * Uses web3.eth.sign to sign a cancel message for an operation hash. This signature is not used
   * on-chain, but allows dYdX backend services to verify that the cancel operation api call is from
   * the original maker of the operation.
   */
  public async ethSignCancelOperationByHash(
    operationHash: string,
    signer: address,
  ): Promise<string> {
    const cancelHash = this.operationHashToCancelOperationHash(operationHash);
    const signature = await this.web3.eth.sign(cancelHash, signer);
    return createTypedSignature(signature, SIGNATURE_TYPES.DECIMAL);
  }

  // ============ Signature Verification ============

  /**
   * Returns true if the operation object has a non-null valid signature from the maker of the
   * operation.
   */
  public async operationHasValidSignature(
    signedOperation: SignedOperation,
  ): Promise<boolean> {
    return this.operationByHashHasValidSignature(
      this.getOperationHash(signedOperation),
      signedOperation.typedSignature,
      signedOperation.signer,
    );
  }

  /**
   * Returns true if the operation hash has a non-null valid signature from a particular signer.
   */
  public async operationByHashHasValidSignature(
    operationHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): Promise<boolean> {
    const signer = await ecRecoverTypedSignature(operationHash, typedSignature);
    return stripHexPrefix(signer).toLowerCase() === stripHexPrefix(expectedSigner).toLowerCase();
  }

  /**
   * Returns true if the cancel operation message has a valid signature.
   */
  public async cancelOperationHasValidSignature(
    operation: Operation,
    typedSignature: string,
  ): Promise<boolean> {
    return this.cancelOperationByHashHasValidSignature(
      this.getOperationHash(operation),
      typedSignature,
      operation.signer,
    );
  }

  /**
   * Returns true if the cancel operation message has a valid signature.
   */
  public async cancelOperationByHashHasValidSignature(
    operationHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): Promise<boolean> {
    const cancelHash = this.operationHashToCancelOperationHash(operationHash);
    const signer = await ecRecoverTypedSignature(cancelHash, typedSignature);
    return stripHexPrefix(signer).toLowerCase() === stripHexPrefix(expectedSigner).toLowerCase();
  }

  // ============ Hashing Functions ============

  public getOperationHash(operation: Operation): string {
    const actionsHash = soliditySha3(
      operation.actions.map((action) => {
        return { t: 'bytes32', v: this.getActionHash(action) };
      }),
    );

    const basicHash = soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_OPERATION_STRING) },
      { t: 'bytes32', v: actionsHash },
      { t: 'uint256', v: mustString(operation.expiration) },
      { t: 'uint256', v: mustString(operation.salt) },
      { t: 'bytes32', v: addressToBytes32(operation.sender) },
    );

    const retVal = soliditySha3(
      { t: 'bytes', v: '0x1901' },
      { t: 'bytes32', v: this.getDomainHash() },
      { t: 'bytes32', v: basicHash },
    );

    return retVal;
  }

  public getDomainHash(): string {
    return soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_DOMAIN_STRING) },
      { t: 'bytes32', v: stringToBytes32('SignedOperationProxy') },
      { t: 'bytes32', v: stringToBytes32('1.0') },
      { t: 'uint256', v: this.networkId },
      { t: 'bytes32', v: addressToBytes32(this.contracts.signedOperationProxy.options.address) },
    );
  }

  public getActionHash(
    action: Action,
  ): string {
    return soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_ACTION_STRING) },
      { t: 'uint256', v: mustString(action.actionType) },
      { t: 'bytes32', v: addressToBytes32(action.primaryAccountOwner) },
      { t: 'uint256', v: mustString(action.primaryAccountNumber) },
      { t: 'bytes32', v: this.getAssetAmountHash(action.amount) },
      { t: 'uint256', v: mustString(action.primaryMarketId) },
      { t: 'uint256', v: mustString(action.secondaryMarketId) },
      { t: 'bytes32', v: addressToBytes32(action.otherAddress) },
      { t: 'bytes32', v: addressToBytes32(action.secondaryAccountOwner) },
      { t: 'uint256', v: mustString(action.secondaryAccountNumber) },
      { t: 'bytes32', v: bytesToBytes32(action.data) },
    );
  }

  public getAssetAmountHash(
    amount: AssetAmount,
  ): string {
    return soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_ASSET_AMOUNT_STRING) },
      { t: 'uint256', v: mustString(amount.sign ? 1 : 0) },
      { t: 'uint256', v: mustString(amount.denomination) },
      { t: 'uint256', v: mustString(amount.ref) },
      { t: 'uint256', v: mustString(amount.value) },
    );
  }

  public operationHashToCancelOperationHash(
    operationHash: string,
  ): string {
    return soliditySha3(
      { t: 'string', v: 'cancel' },
      { t: 'bytes32', v: operationHash },
    );
  }

  // ============ Private Helper Functions ============s

  private async ethSignTypedOperationInternal(
    operation: Operation,
    rpcMethod: string,
  ): Promise<string> {
    const domainData = {
      name: 'SignedOperationProxy',
      version: '1.0',
      chainId: this.networkId,
      verifyingContract: this.contracts.signedOperationProxy.options.address,
    };
    const actionsData = operation.actions.map((action) => {
      return {
        actionType: mustString(action.actionType),
        accountOwner: action.primaryAccountOwner,
        accountNumber: mustString(action.primaryAccountNumber),
        assetAmount: {
          sign: action.amount.sign,
          denomination: mustString(action.amount.denomination),
          ref: mustString(action.amount.ref),
          value: mustString(action.amount.value),
        },
        primaryMarketId: mustString(action.primaryMarketId),
        secondaryMarketId: mustString(action.secondaryMarketId),
        otherAddress: mustString(action.otherAddress),
        otherAccountOwner: action.secondaryAccountOwner,
        otherAccountNumber: mustString(action.secondaryAccountNumber),
        data: action.data,
      };
    });
    const operationData = {
      actions: actionsData,
      expiration: operation.expiration.toFixed(0),
      salt: operation.salt.toFixed(0),
      sender: operation.sender,
    };
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        Operation: EIP712_OPERATION_STRUCT,
        Action: EIP712_ACTION_STRUCT,
        AssetAmount: EIP712_ASSET_AMOUNT_STRUCT,
      },
      domain: domainData,
      primaryType: 'Operation',
      message: operationData,
    };
    const sendAsync = promisify(this.web3.currentProvider.send).bind(this.web3.currentProvider);
    const response = await sendAsync({
      method: rpcMethod,
      params: [operation.signer, data],
      jsonrpc: '2.0',
      id: new Date().getTime(),
    });
    if (response.error) {
      throw new Error(response.error.message);
    }
    return `0x${stripHexPrefix(response.result)}0${SIGNATURE_TYPES.NO_PREPEND}`;
  }
}

function mustString(input: number | string | BigNumber) {
  return new BigNumber(input).toFixed(0);
}
