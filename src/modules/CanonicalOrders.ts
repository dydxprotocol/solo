import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { OrderSigner } from './OrderSigner';
import { Contracts } from '../lib/Contracts';
import { toString } from '../lib/Helpers';
import {
  addressToBytes32,
  argToBytes,
  bytesToHexString,
  hashString,
  toBytes,
  stripHexPrefix,
} from '../lib/BytesHelper';
import {
  EIP712_DOMAIN_STRING,
  EIP712_DOMAIN_STRUCT,
} from '../lib/SignatureHelper';
import {
  address,
  ContractCallOptions,
  ContractConstantCallOptions,
  CanonicalOrder,
  SignedCanonicalOrder,
  CanonicalOrderState,
  SigningMethod,
  Integer,
} from '../../src/types';

const EIP712_ORDER_STRUCT = [
  { type: 'bytes32', name: 'flags' },
  { type: 'uint256', name: 'baseMarket' },
  { type: 'uint256', name: 'quoteMarket' },
  { type: 'uint256', name: 'amount' },
  { type: 'uint256', name: 'limitPrice' },
  { type: 'uint256', name: 'triggerPrice' },
  { type: 'uint256', name: 'limitFee' },
  { type: 'address', name: 'makerAccountOwner' },
  { type: 'uint256', name: 'makerAccountNumber' },
  { type: 'uint256', name: 'expiration' },
];

const EIP712_ORDER_STRUCT_STRING =
  'CanonicalOrder(' +
  'bytes32 flags,' +
  'uint256 baseMarket,' +
  'uint256 quoteMarket,' +
  'uint256 amount,' +
  'uint256 limitPrice,' +
  'uint256 triggerPrice,' +
  'uint256 limitFee,' +
  'address makerAccountOwner,' +
  'uint256 makerAccountNumber,' +
  'uint256 expiration' +
  ')';

const EIP712_CANCEL_ORDER_STRUCT = [
  { type: 'string', name: 'action' },
  { type: 'bytes32[]', name: 'orderHashes' },
];

const EIP712_CANCEL_ORDER_STRUCT_STRING =
  'CancelLimitOrder(' +
  'string action,' +
  'bytes32[] orderHashes' +
  ')';

export class CanonicalOrders extends OrderSigner {
  private networkId: number;

  // ============ Constructor ============

  constructor(
    contracts: Contracts,
    web3: Web3,
    networkId: number,
  ) {
    super(web3, contracts);
    this.networkId = networkId;
  }

  protected stringifyOrder(
    order: CanonicalOrder,
  ): any {
    const stringifiedOrder = {
      ...order,
      flags: this.getCanonicalOrderFlags(order),
    };
    for (const [key, value] of Object.entries(order)) {
      if (typeof value !== 'string' && typeof value !== 'boolean') {
        stringifiedOrder[key] = toString(value);
      }
    }
    return stringifiedOrder;
  }

  // ============ Getter Contract Methods ============

  /**
   * Gets the status and the current filled amount (in makerAmount) of all given orders.
   */
  public async getOrderStates(
    orders: CanonicalOrder[],
    options?: ContractConstantCallOptions,
  ): Promise<CanonicalOrderState[]> {
    const orderHashes = orders.map(order => this.getOrderHash(order));
    const states: any[] = await this.contracts.callConstantContractFunction(
      this.contracts.canonicalOrders.methods.getOrderStates(orderHashes),
      options,
    );

    return states.map((state) => {
      return {
        status: parseInt(state[0], 10),
        totalFilledAmount: new BigNumber(state[1]),
      };
    });
  }

  public async getTakerAddress(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.canonicalOrders.methods.g_taker(),
      options,
    );
  }

  // ============ Setter Contract Methods ============

  public async setTakerAddress(
    taker: address,
    options?: ContractCallOptions,
  ): Promise<any> {
    return this.contracts.callContractFunction(
      this.contracts.canonicalOrders.methods.setTakerAddress(taker),
      options,
    );
  }

  // ============ Hashing Functions ============

  /**
   * Returns the final signable EIP712 hash for approving an order.
   */
  public getOrderHash(
    order: CanonicalOrder,
  ): string {
    const structHash = Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_ORDER_STRUCT_STRING) },
      { t: 'bytes32', v: this.getCanonicalOrderFlags(order) },
      { t: 'uint256', v: toString(order.baseMarket) },
      { t: 'uint256', v: toString(order.quoteMarket) },
      { t: 'uint256', v: toString(order.amount) },
      { t: 'uint256', v: toString(order.limitPrice) },
      { t: 'uint256', v: toString(order.triggerPrice) },
      { t: 'uint256', v: toString(order.limitFee) },
      { t: 'bytes32', v: addressToBytes32(order.makerAccountOwner) },
      { t: 'uint256', v: toString(order.makerAccountNumber) },
      { t: 'uint256', v: toString(order.expiration) },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Given some order hash, returns the hash of a cancel-order message.
   */
  public orderHashToCancelOrderHash(
    orderHash: string,
  ): string {
    const structHash = Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_CANCEL_ORDER_STRUCT_STRING) },
      { t: 'bytes32', v: hashString('Cancel Orders') },
      { t: 'bytes32', v: Web3.utils.soliditySha3({ t: 'bytes32', v: orderHash }) },
    );
    return this.getEIP712Hash(structHash);
  }

  /**
   * Returns the EIP712 domain separator hash.
   */
  public getDomainHash(): string {
    return Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_DOMAIN_STRING) },
      { t: 'bytes32', v: hashString('CanonicalOrders') },
      { t: 'bytes32', v: hashString('1.0') },
      { t: 'uint256', v: toString(this.networkId) },
      { t: 'bytes32', v: addressToBytes32(this.contracts.canonicalOrders.options.address) },
    );
  }

  // ============ To-Bytes Functions ============

  public orderToBytes(
    order: CanonicalOrder | SignedCanonicalOrder,
    price?: Integer,
    fee?: Integer,
  ): string {
    let orderBytes = []
      .concat(argToBytes(this.getCanonicalOrderFlags(order)))
      .concat(argToBytes(order.baseMarket))
      .concat(argToBytes(order.quoteMarket))
      .concat(argToBytes(order.amount))
      .concat(argToBytes(order.limitPrice))
      .concat(argToBytes(order.triggerPrice))
      .concat(argToBytes(order.limitFee))
      .concat(argToBytes(order.makerAccountOwner))
      .concat(argToBytes(order.makerAccountNumber))
      .concat(argToBytes(order.expiration));

    if (price && fee) {
      orderBytes = orderBytes
        .concat(argToBytes(price))
        .concat(argToBytes(fee.abs()))
        .concat(argToBytes(fee.isNegative()));
    }

    const orderAndTradeHex = Web3.utils.bytesToHex(orderBytes);

    return !!((order as SignedCanonicalOrder).typedSignature)
      ? `${orderAndTradeHex}${stripHexPrefix((order as SignedCanonicalOrder).typedSignature)}`
      : orderAndTradeHex;
  }

  // ============ Private Helper Functions ============

  private getDomainData() {
    return {
      name: 'CanonicalOrders',
      version: '1.0',
      chainId: this.networkId,
      verifyingContract: this.contracts.canonicalOrders.options.address,
    };
  }

  protected async ethSignTypedOrderInternal(
    order: CanonicalOrder,
    signingMethod: SigningMethod,
  ): Promise<string> {
    const orderData = {
      flags: this.getCanonicalOrderFlags(order),
      baseMarket: order.baseMarket.toFixed(0),
      quoteMarket: order.quoteMarket.toFixed(0),
      amount: order.amount.toFixed(0),
      limitPrice: order.limitPrice.toFixed(0),
      triggerPrice: order.triggerPrice.toFixed(0),
      limitFee: order.limitFee.toFixed(0),
      makerAccountOwner: order.makerAccountOwner,
      makerAccountNumber: order.makerAccountNumber.toFixed(0),
      expiration: order.expiration.toFixed(0),
    };
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        CanonicalOrder: EIP712_ORDER_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'CanonicalOrder',
      message: orderData,
    };
    return this.ethSignTypedDataInternal(
      order.makerAccountOwner,
      data,
      signingMethod,
    );
  }

  protected async ethSignTypedCancelOrderInternal(
    orderHash: string,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        CancelLimitOrder: EIP712_CANCEL_ORDER_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'CancelLimitOrder',
      message: {
        action: 'Cancel Orders',
        orderHashes: [orderHash],
      },
    };
    return this.ethSignTypedDataInternal(
      signer,
      data,
      signingMethod,
    );
  }

  private getCanonicalOrderFlags(
    order: CanonicalOrder,
  ): string {
    let booleanFlags = 0;
    booleanFlags += order.isNegativeLimitFee ? 4 : 0;
    booleanFlags += order.isDecreaseOnly ? 2 : 0;
    booleanFlags += order.isBuy ? 1 : 0;
    return `0x${bytesToHexString(toBytes(order.salt)).slice(-63)}${booleanFlags}`;
  }

  protected getContract() {
    return this.contracts.canonicalOrders;
  }
}
