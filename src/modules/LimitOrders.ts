import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { soliditySha3, bytesToHex, hexToBytes } from 'web3-utils';
import { promisify } from 'es6-promisify';
import { Contracts } from '../lib/Contracts';
import {
  addressToBytes32,
  argToBytes,
  hashString,
  stripHexPrefix,
  addressesAreEqual,
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
  ContractCallOptions,
  ContractConstantCallOptions,
  Decimal,
  Integer,
  LimitOrder,
  SignedLimitOrder,
  LimitOrderState,
  SigningMethod,
} from '../../src/types';

const EIP712_ORDER_STRUCT = [
  { type: 'uint256', name: 'makerMarket' },
  { type: 'uint256', name: 'takerMarket' },
  { type: 'uint256', name: 'makerAmount' },
  { type: 'uint256', name: 'takerAmount' },
  { type: 'address', name: 'makerAccountOwner' },
  { type: 'uint256', name: 'makerAccountNumber' },
  { type: 'address', name: 'takerAccountOwner' },
  { type: 'uint256', name: 'takerAccountNumber' },
  { type: 'uint256', name: 'expiration' },
  { type: 'uint256', name: 'salt' },
];

const EIP712_ORDER_STRUCT_STRING =
  'LimitOrder(' +
  'uint256 makerMarket,' +
  'uint256 takerMarket,' +
  'uint256 makerAmount,' +
  'uint256 takerAmount,' +
  'address makerAccountOwner,' +
  'uint256 makerAccountNumber,' +
  'address takerAccountOwner,' +
  'uint256 takerAccountNumber,' +
  'uint256 expiration,' +
  'uint256 salt' +
  ')';

const EIP712_CANCEL_ORDER_STRUCT = [
  { type: 'bytes32', name: 'orderHash' },
];

const EIP712_CANCEL_ORDER_STRUCT_STRING =
  'CancelLimitOrder(' +
  'bytes32 orderHash' +
  ')';

export class LimitOrders {
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

  // ============ On-Chain Approve / On-Chain Cancel ============

  /**
   * Sends an transaction to pre-approve an order on-chain (so that no signature is required when
   * filling the order).
   */
  public async approveOrder(
    order: LimitOrder,
    options?: ContractCallOptions,
  ): Promise<any> {
    const orderHash = this.getOrderHash(order);
    return this.contracts.callContractFunction(
      this.contracts.limitOrders.methods.approveOrder(orderHash),
      options,
    );
  }

  /**
   * Sends an transaction to cancel an order on-chain.
   */
  public async cancelOrder(
    order: LimitOrder,
    options?: ContractCallOptions,
  ): Promise<any> {
    const orderHash = this.getOrderHash(order);
    return this.contracts.callContractFunction(
      this.contracts.limitOrders.methods.cancelOrder(orderHash),
      options,
    );
  }

  // ============ Getter Contract Methods ============

  /**
   * Returns true if the contract can process orders.
   */
  public async isOperational(
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.limitOrders.methods.g_isOperational(),
      options,
    );
  }

  /**
   * Gets the status and the current filled amount (in makerAmount) of all given orders.
   */
  public async getOrderStates(
    orders: LimitOrder[],
    options?: ContractConstantCallOptions,
  ): Promise<LimitOrderState[]> {
    const inputQuery = orders.map((order) => {
      return {
        orderHash: this.getOrderHash(order),
        orderMaker: order.makerAccountOwner,
      };
    });
    const states: any[] = await this.contracts.callConstantContractFunction(
      this.contracts.limitOrders.methods.getOrderStates(inputQuery),
      options,
    );

    return states.map((state) => {
      return {
        status: parseInt(state[0], 10),
        totalMakerFilledAmount: new BigNumber(state[1]),
      };
    });
  }

  // ============ Signing Methods ============

  /**
   * Sends order to current provider for signing. Can sign locally if the signing account is
   * loaded into web3 and SigningMethod.Hash is used.
   */
  public async signOrder(
    order: LimitOrder,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
        const hash = this.getOrderHash(order);
        const signature = await this.web3.eth.sign(hash, order.makerAccountOwner);
        return createTypedSignature(signature, SIGNATURE_TYPES.DECIMAL);

      case SigningMethod.TypedData:
        return this.ethSignTypedOrderInternal(
          order,
          'eth_signTypedData',
        );

      case SigningMethod.MetaMask:
        return this.ethSignTypedOrderInternal(
          order,
          'eth_signTypedData_v3',
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  /**
   * Sends order to current provider for signing of a cancel message. Can sign locally if the
   * signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOrder(
    order: LimitOrder,
    signingMethod: SigningMethod,
  ): Promise<string> {
    return this.signCancelOrderByHash(
      this.getOrderHash(order),
      order.makerAccountOwner,
      signingMethod,
    );
  }

  /**
   * Sends orderHash to current provider for signing of a cancel message. Can sign locally if
   * the signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOrderByHash(
    orderHash: string,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
        const cancelHash = this.orderHashToCancelOrderHash(orderHash);
        const signature = await this.web3.eth.sign(cancelHash, signer);
        return createTypedSignature(signature, SIGNATURE_TYPES.DECIMAL);

      case SigningMethod.TypedData:
        return this.ethSignTypedCancelOrderInternal(
          orderHash,
          signer,
          'eth_signTypedData',
        );

      case SigningMethod.MetaMask:
        return this.ethSignTypedCancelOrderInternal(
          orderHash,
          signer,
          'eth_signTypedData_v3',
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  // ============ Signature Verification ============

  /**
   * Returns true if the order object has a non-null valid signature from the maker of the order.
   */
  public orderHasValidSignature(
    order: SignedLimitOrder,
  ): boolean {
    return this.orderByHashHasValidSignature(
      this.getOrderHash(order),
      order.typedSignature,
      order.makerAccountOwner,
    );
  }

  /**
   * Returns true if the order hash has a non-null valid signature from a particular signer.
   */
  public orderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const signer = ecRecoverTypedSignature(orderHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  /**
   * Returns true if the cancel order message has a valid signature.
   */
  public cancelOrderHasValidSignature(
    order: LimitOrder,
    typedSignature: string,
  ): boolean {
    return this.cancelOrderByHashHasValidSignature(
      this.getOrderHash(order),
      typedSignature,
      order.makerAccountOwner,
    );
  }

  /**
   * Returns true if the cancel order message has a valid signature.
   */
  public cancelOrderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const cancelHash = this.orderHashToCancelOrderHash(orderHash);
    const signer = ecRecoverTypedSignature(cancelHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  // ============ Off-Chain Collateralization Calculation Methods ============

  /**
   * Returns the estimated account collateralization after making each of the orders provided.
   * The makerAccount of each order should be associated with the same account.
   * This function does not make any on-chain calls and so all information must be passed in
   * (including asset prices and remaining amounts on the orders).
   * - 150% collateralization will be returned as BigNumber(1.5).
   * - Accounts with zero borrow will be returned as BigNumber(infinity) regardless of supply.
   */
  public getAccountCollateralizationAfterMakingOrders(
    weis: Integer[],
    prices: Integer[],
    orders: LimitOrder[],
    remainingMakerAmounts: Integer[],
  ): Decimal {
    const runningWeis = weis.map(x => new BigNumber(x));

    // for each order, modify the wei value of the account
    for (let i = 0; i < orders.length; i += 1) {
      const order = orders[i];

      // calculate maker and taker amounts
      const makerAmount = remainingMakerAmounts[i];
      const takerAmount = order.takerAmount.times(makerAmount).div(order.makerAmount)
        .integerValue(BigNumber.ROUND_UP);

      // update running weis
      const makerMarket = order.makerMarket.toNumber();
      const takerMarket = order.takerMarket.toNumber();
      runningWeis[makerMarket] = runningWeis[makerMarket].minus(makerAmount);
      runningWeis[takerMarket] = runningWeis[takerMarket].plus(takerAmount);
    }

    // calculate the final collateralization
    let supplyValue = new BigNumber(0);
    let borrowValue = new BigNumber(0);
    for (let i = 0; i < runningWeis.length; i += 1) {
      const value = runningWeis[i].times(prices[i]);
      if (value.gt(0)) {
        supplyValue = supplyValue.plus(value.abs());
      } else if (value.lt(0)) {
        borrowValue = borrowValue.plus(value.abs());
      }
    }

    // return infinity if borrow amount is zero (even if supply is also zero)
    if (borrowValue.isZero()) {
      return new BigNumber(Infinity);
    }

    return supplyValue.div(borrowValue);
  }

  // ============ Hashing Functions ============

  /**
   * Returns the final signable EIP712 hash for approving an order.
   */
  public getOrderHash(
    order: LimitOrder,
  ): string {
    const structHash = soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_ORDER_STRUCT_STRING) },
      { t: 'uint256', v: order.makerMarket },
      { t: 'uint256', v: order.takerMarket },
      { t: 'uint256', v: order.makerAmount },
      { t: 'uint256', v: order.takerAmount },
      { t: 'bytes32', v: addressToBytes32(order.makerAccountOwner) },
      { t: 'uint256', v: order.makerAccountNumber },
      { t: 'bytes32', v: addressToBytes32(order.takerAccountOwner) },
      { t: 'uint256', v: order.takerAccountNumber },
      { t: 'uint256', v: order.expiration },
      { t: 'uint256', v: order.salt },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Given some order hash, returns the hash of a cancel-order message.
   */
  public orderHashToCancelOrderHash(
    orderHash: string,
  ): string {
    const structHash = soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_CANCEL_ORDER_STRUCT_STRING) },
      { t: 'bytes32', v: orderHash },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Returns the EIP712 domain separator hash.
   */
  public getDomainHash(): string {
    return soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_DOMAIN_STRING) },
      { t: 'bytes32', v: hashString('LimitOrders') },
      { t: 'bytes32', v: hashString('1.0') },
      { t: 'uint256', v: this.networkId },
      { t: 'bytes32', v: addressToBytes32(this.contracts.limitOrders.options.address) },
    );
  }

  /**
   * Returns a signable EIP712 Hash of a struct
   */
  public getEIP712Hash(
    structHash: string,
  ): string {
    return soliditySha3(
      { t: 'bytes2', v: '0x1901' },
      { t: 'bytes32', v: this.getDomainHash() },
      { t: 'bytes32', v: structHash },
    );
  }

  // ============ To-Bytes Functions ============

  public unsignedOrderToBytes(
    order: LimitOrder,
  ): string {
    return bytesToHex(this.orderToByteArray(order));
  }

  public signedOrderToBytes(
    order: SignedLimitOrder,
  ): string {
    const byteArray = this.orderToByteArray(order).concat(hexToBytes(order.typedSignature));
    return bytesToHex(byteArray);
  }

  // ============ Private Helper Functions ============

  private orderToByteArray(
    order: LimitOrder,
  ): number[] {
    return []
      .concat(argToBytes(order.makerMarket))
      .concat(argToBytes(order.takerMarket))
      .concat(argToBytes(order.makerAmount))
      .concat(argToBytes(order.takerAmount))
      .concat(argToBytes(order.makerAccountOwner))
      .concat(argToBytes(order.makerAccountNumber))
      .concat(argToBytes(order.takerAccountOwner))
      .concat(argToBytes(order.takerAccountNumber))
      .concat(argToBytes(order.expiration))
      .concat(argToBytes(order.salt));
  }

  private getDomainData() {
    return {
      name: 'LimitOrders',
      version: '1.0',
      chainId: this.networkId,
      verifyingContract: this.contracts.limitOrders.options.address,
    };
  }

  private async ethSignTypedOrderInternal(
    order: LimitOrder,
    rpcMethod: string,
  ): Promise<string> {
    const orderData = {
      makerMarket: order.makerMarket.toFixed(0),
      takerMarket: order.takerMarket.toFixed(0),
      makerAmount: order.makerAmount.toFixed(0),
      takerAmount: order.takerAmount.toFixed(0),
      makerAccountOwner: order.makerAccountOwner,
      makerAccountNumber: order.makerAccountNumber.toFixed(0),
      takerAccountOwner: order.takerAccountOwner,
      takerAccountNumber: order.takerAccountNumber.toFixed(0),
      expiration: order.expiration.toFixed(0),
      salt: order.salt.toFixed(0),
    };
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        LimitOrder: EIP712_ORDER_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'LimitOrder',
      message: orderData,
    };
    return this.ethSignTypedDataInternal(
      order.makerAccountOwner,
      data,
      rpcMethod,
    );
  }

  private async ethSignTypedCancelOrderInternal(
    orderHash: string,
    signer: string,
    rpcMethod: string,
  ): Promise<string> {
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        CancelLimitOrder: EIP712_CANCEL_ORDER_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'CancelLimitOrder',
      message: { orderHash },
    };
    return this.ethSignTypedDataInternal(
      signer,
      data,
      rpcMethod,
    );
  }

  private async ethSignTypedDataInternal(
    signer: string,
    data: any,
    rpcMethod: string,
  ): Promise<string> {
    const sendAsync = promisify(this.web3.currentProvider.send).bind(this.web3.currentProvider);
    const response = await sendAsync({
      method: rpcMethod,
      params: [signer, data],
      jsonrpc: '2.0',
      id: new Date().getTime(),
    });
    if (response.error) {
      throw new Error(response.error.message);
    }
    return `0x${stripHexPrefix(response.result)}0${SIGNATURE_TYPES.NO_PREPEND}`;
  }
}
