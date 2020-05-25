import Web3 from 'web3';
import { Signer } from './Signer';
import { Contracts } from '../lib/Contracts';
import { ADDRESSES } from '../lib/Constants';
import { toString } from '../lib/Helpers';
import {
  addressToBytes32,
  hashBytes,
  hashString,
  stripHexPrefix,
  addressesAreEqual,
  hexStringToBytes,
} from '../lib/BytesHelper';
import {
  SIGNATURE_TYPES,
  EIP712_DOMAIN_STRING,
  EIP712_DOMAIN_STRUCT,
  createTypedSignature,
  ecRecoverTypedSignature,
} from '../lib/SignatureHelper';
import {
  address,
  Action,
  AssetAmount,
  Operation,
  SignedOperation,
  SendOptions,
  CallOptions,
  SigningMethod,
  AccountInfo,
  Integer,
} from '../../src/types';

const EIP712_OPERATION_STRUCT = [
  { type: 'Action[]', name: 'actions' },
  { type: 'uint256', name: 'expiration' },
  { type: 'uint256', name: 'salt' },
  { type: 'address', name: 'sender' },
  { type: 'address', name: 'signer' },
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
  'Action(' + // tslint:disable-line
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
  'Operation(' + // tslint:disable-line
  'Action[] actions,' +
  'uint256 expiration,' +
  'uint256 salt,' +
  'address sender,' +
  'address signer' +
  ')' +
  EIP712_ACTION_STRING;

const EIP712_CANCEL_OPERATION_STRUCT = [
  { type: 'string', name: 'action' },
  { type: 'bytes32[]', name: 'operationHashes' },
];

const EIP712_CANCEL_OPERATION_STRUCT_STRING =
  'CancelOperation(' +
  'string action,' +
  'bytes32[] operationHashes' +
  ')';

export class SignedOperations extends Signer {
  private contracts: Contracts;
  private networkId: number;

  // ============ Constructor ============

  constructor(
    contracts: Contracts,
    web3: Web3,
    networkId: number,
  ) {
    super(web3);
    this.contracts = contracts;
    this.networkId = networkId;
  }

  // ============ On-Chain Cancel ============

  /**
   * Sends an transaction to cancel an operation on-chain.
   */
  public async cancelOperation(
    operation: Operation,
    options?: SendOptions,
  ): Promise<any> {
    const accounts = [];
    const actions = [];

    const getAccountId = function (accountOwner: string, accountNumber: Integer): number {
      if (accountOwner === ADDRESSES.ZERO) {
        return 0;
      }
      const accountInfo: AccountInfo = {
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      };

      const index = accounts.indexOf(accountInfo);

      if (index >= 0) {
        return index;
      }

      accounts.push(accountInfo);
      return accounts.length - 1;
    };

    for (let i = 0; i < operation.actions.length; i += 1) {
      const action = operation.actions[i];
      actions.push({
        accountId: getAccountId(action.primaryAccountOwner, action.primaryAccountNumber),
        actionType: action.actionType,
        primaryMarketId: toString(action.primaryMarketId),
        secondaryMarketId: toString(action.secondaryMarketId),
        otherAddress: action.otherAddress,
        otherAccountId: getAccountId(action.secondaryAccountOwner, action.secondaryAccountNumber),
        data: hexStringToBytes(action.data),
        amount: {
          sign: action.amount.sign,
          ref: toString(action.amount.ref),
          denomination: toString(action.amount.denomination),
          value: toString(action.amount.value),
        },
      });
    }

    return this.contracts.send(
      this.contracts.signedOperationProxy.methods.cancel(
        accounts,
        actions,
        {
          numActions: operation.actions.length.toString(),
          header: {
            expiration: operation.expiration.toFixed(0),
            salt: operation.salt.toFixed(0),
            sender: operation.sender,
            signer: operation.signer,
          },
          signature: [],
        },
      ),
      options || { from: operation.signer },
    );
  }

  // ============ Getter Contract Methods ============

  /**
   * Returns true if the contract can process operations.
   */
  public async isOperational(
    options?: CallOptions,
  ): Promise<boolean> {
    return this.contracts.call(
      this.contracts.signedOperationProxy.methods.g_isOperational(),
      options,
    );
  }

  /**
   * Gets the status and the current filled amount (in makerAmount) of all given orders.
   */
  public async getOperationsAreInvalid(
    operations: Operation[],
    options?: CallOptions,
  ): Promise<boolean[]> {
    const hashes = operations.map(operation => this.getOperationHash(operation));
    return this.contracts.call(
      this.contracts.signedOperationProxy.methods.getOperationsAreInvalid(hashes),
      options,
    );
  }

  // ============ Signing Methods ============

  /**
   * Sends operation to current provider for signing. Can sign locally if the signing account is
   * loaded into web3 and SigningMethod.Hash is used.
   */
  public async signOperation(
    operation: Operation,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility:
        const hash = this.getOperationHash(operation);
        const rawSignature = await this.web3.eth.sign(hash, operation.signer);
        const hashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.DECIMAL);
        if (signingMethod === SigningMethod.Hash) {
          return hashSig;
        }
        const unsafeHashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.NO_PREPEND);
        if (signingMethod === SigningMethod.UnsafeHash) {
          return unsafeHashSig;
        }
        if (this.operationByHashHasValidSignature(hash, unsafeHashSig, operation.signer)) {
          return unsafeHashSig;
        }
        return hashSig;

      case SigningMethod.TypedData:
      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet:
        return this.ethSignTypedOperationInternal(
          operation,
          signingMethod,
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  /**
   * Sends operation to current provider for signing of a cancel message. Can sign locally if the
   * signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOperation(
    operation: Operation,
    signingMethod: SigningMethod,
  ): Promise<string> {
    return this.signCancelOperationByHash(
      this.getOperationHash(operation),
      operation.signer,
      signingMethod,
    );
  }

  /**
   * Sends operationHash to current provider for signing of a cancel message. Can sign locally if
   * the signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOperationByHash(
    operationHash: string,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility:
        const cancelHash = this.operationHashToCancelOperationHash(operationHash);
        const rawSignature = await this.web3.eth.sign(cancelHash, signer);
        const hashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.DECIMAL);
        if (signingMethod === SigningMethod.Hash) {
          return hashSig;
        }
        const unsafeHashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.NO_PREPEND);
        if (signingMethod === SigningMethod.UnsafeHash) {
          return unsafeHashSig;
        }
        if (this.cancelOperationByHashHasValidSignature(operationHash, unsafeHashSig, signer)) {
          return unsafeHashSig;
        }
        return hashSig;

      case SigningMethod.TypedData:
      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet:
        return this.ethSignTypedCancelOperationInternal(
          operationHash,
          signer,
          signingMethod,
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  // ============ Signing Cancel Operation Methods ============

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
  public operationHasValidSignature(
    signedOperation: SignedOperation,
  ): boolean {
    return this.operationByHashHasValidSignature(
      this.getOperationHash(signedOperation),
      signedOperation.typedSignature,
      signedOperation.signer,
    );
  }

  /**
   * Returns true if the operation hash has a non-null valid signature from a particular signer.
   */
  public operationByHashHasValidSignature(
    operationHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const signer = ecRecoverTypedSignature(operationHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  /**
   * Returns true if the cancel operation message has a valid signature.
   */
  public cancelOperationHasValidSignature(
    operation: Operation,
    typedSignature: string,
  ): boolean {
    return this.cancelOperationByHashHasValidSignature(
      this.getOperationHash(operation),
      typedSignature,
      operation.signer,
    );
  }

  /**
   * Returns true if the cancel operation message has a valid signature.
   */
  public cancelOperationByHashHasValidSignature(
    operationHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const cancelHash = this.operationHashToCancelOperationHash(operationHash);
    const signer = ecRecoverTypedSignature(cancelHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  // ============ Hashing Functions ============

  /**
   * Returns the final signable EIP712 hash for approving an operation.
   */
  public getOperationHash(operation: Operation): string {
    const structHash = Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_OPERATION_STRING) },
      { t: 'bytes32', v: this.getActionsHash(operation.actions) },
      { t: 'uint256', v: toString(operation.expiration) },
      { t: 'uint256', v: toString(operation.salt) },
      { t: 'bytes32', v: addressToBytes32(operation.sender) },
      { t: 'bytes32', v: addressToBytes32(operation.signer) },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Returns the EIP712 hash of the actions array.
   */
  public getActionsHash(
    actions: Action[],
  ): string {
    const actionsAsHashes = actions.length
      ? actions.map(
        action => stripHexPrefix(this.getActionHash(action)),
      ).join('')
      : '';
    return hashBytes(actionsAsHashes);
  }

  /**
   * Returns the EIP712 hash of a single Action struct.
   */
  public getActionHash(
    action: Action,
  ): string {
    return Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_ACTION_STRING) },
      { t: 'uint256', v: toString(action.actionType) },
      { t: 'bytes32', v: addressToBytes32(action.primaryAccountOwner) },
      { t: 'uint256', v: toString(action.primaryAccountNumber) },
      { t: 'bytes32', v: this.getAssetAmountHash(action.amount) },
      { t: 'uint256', v: toString(action.primaryMarketId) },
      { t: 'uint256', v: toString(action.secondaryMarketId) },
      { t: 'bytes32', v: addressToBytes32(action.otherAddress) },
      { t: 'bytes32', v: addressToBytes32(action.secondaryAccountOwner) },
      { t: 'uint256', v: toString(action.secondaryAccountNumber) },
      { t: 'bytes32', v: hashBytes(action.data) },
    );
  }

  /**
   * Returns the EIP712 hash of an AssetAmount struct.
   */
  public getAssetAmountHash(
    amount: AssetAmount,
  ): string {
    return Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_ASSET_AMOUNT_STRING) },
      { t: 'uint256', v: toString(amount.sign ? 1 : 0) },
      { t: 'uint256', v: toString(amount.denomination) },
      { t: 'uint256', v: toString(amount.ref) },
      { t: 'uint256', v: toString(amount.value) },
    );
  }

  /**
   * Given some operation hash, returns the hash of a cancel-operation message.
   */
  public operationHashToCancelOperationHash(
    operationHash: string,
  ): string {
    const structHash = Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_CANCEL_OPERATION_STRUCT_STRING) },
      { t: 'bytes32', v: hashString('Cancel Operations') },
      { t: 'bytes32', v: Web3.utils.soliditySha3({ t: 'bytes32', v: operationHash }) },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Returns the EIP712 domain separator hash.
   */
  public getDomainHash(): string {
    return Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_DOMAIN_STRING) },
      { t: 'bytes32', v: hashString('SignedOperationProxy') },
      { t: 'bytes32', v: hashString('1.1') },
      { t: 'uint256', v: toString(this.networkId) },
      { t: 'bytes32', v: addressToBytes32(this.contracts.signedOperationProxy.options.address) },
    );
  }

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

  // ============ Private Helper Functions ============

  private getDomainData() {
    return {
      name: 'SignedOperationProxy',
      version: '1.1',
      chainId: this.networkId,
      verifyingContract: this.contracts.signedOperationProxy.options.address,
    };
  }

  private async ethSignTypedOperationInternal(
    operation: Operation,
    signingMethod: SigningMethod,
  ): Promise<string> {
    const actionsData = operation.actions.map((action) => {
      return {
        actionType: toString(action.actionType),
        accountOwner: action.primaryAccountOwner,
        accountNumber: toString(action.primaryAccountNumber),
        assetAmount: {
          sign: action.amount.sign,
          denomination: toString(action.amount.denomination),
          ref: toString(action.amount.ref),
          value: toString(action.amount.value),
        },
        primaryMarketId: toString(action.primaryMarketId),
        secondaryMarketId: toString(action.secondaryMarketId),
        otherAddress: action.otherAddress,
        otherAccountOwner: action.secondaryAccountOwner,
        otherAccountNumber: toString(action.secondaryAccountNumber),
        data: action.data,
      };
    });
    const operationData = {
      actions: actionsData,
      expiration: operation.expiration.toFixed(0),
      salt: operation.salt.toFixed(0),
      sender: operation.sender,
      signer: operation.signer,
    };
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        Operation: EIP712_OPERATION_STRUCT,
        Action: EIP712_ACTION_STRUCT,
        AssetAmount: EIP712_ASSET_AMOUNT_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'Operation',
      message: operationData,
    };
    return this.ethSignTypedDataInternal(
      operation.signer,
      data,
      signingMethod,
    );
  }

  private async ethSignTypedCancelOperationInternal(
    operationHash: string,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        CancelOperation: EIP712_CANCEL_OPERATION_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'CancelOperation',
      message: {
        action: 'Cancel Operations',
        operationHashes: [operationHash],
      },
    };
    return this.ethSignTypedDataInternal(
      signer,
      data,
      signingMethod,
    );
  }
}
