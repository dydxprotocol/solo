import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { OrderSigner } from './OrderSigner';
import { Contracts } from '../lib/Contracts';
import { toString } from '../lib/Helpers';
import {
  addressToBytes32,
  argToBytes,
  hashString,
} from '../lib/BytesHelper';
import {
  EIP712_DOMAIN_STRING,
  EIP712_DOMAIN_STRUCT,
} from '../lib/SignatureHelper';
import {
  CallOptions,
  Decimal,
  Integer,
  StopLimitOrder,
  SignedStopLimitOrder,
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
  { type: 'uint256', name: 'triggerPrice' },
  { type: 'bool',    name: 'decreaseOnly' },
  { type: 'uint256', name: 'expiration' },
  { type: 'uint256', name: 'salt' },
];

const EIP712_ORDER_STRUCT_STRING =
  'StopLimitOrder(' +
  'uint256 makerMarket,' +
  'uint256 takerMarket,' +
  'uint256 makerAmount,' +
  'uint256 takerAmount,' +
  'address makerAccountOwner,' +
  'uint256 makerAccountNumber,' +
  'address takerAccountOwner,' +
  'uint256 takerAccountNumber,' +
  'uint256 triggerPrice,' +
  'bool decreaseOnly,' +
  'uint256 expiration,' +
  'uint256 salt' +
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

export class StopLimitOrders extends OrderSigner {
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

  // ============ Getter Contract Methods ============

  /**
   * Gets the status and the current filled amount (in makerAmount) of all given orders.
   */
  public async getOrderStates(
    orders: StopLimitOrder[],
    options?: CallOptions,
  ): Promise<LimitOrderState[]> {
    const orderHashes = orders.map(order => this.getOrderHash(order));
    const states: any[] = await this.contracts.call(
      this.contracts.stopLimitOrders.methods.getOrderStates(orderHashes),
      options,
    );

    return states.map((state) => {
      return {
        status: parseInt(state[0], 10),
        totalMakerFilledAmount: new BigNumber(state[1]),
      };
    });
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
    orders: StopLimitOrder[],
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
    order: StopLimitOrder,
  ): string {
    const structHash = Web3.utils.soliditySha3(
      { t: 'bytes32', v: hashString(EIP712_ORDER_STRUCT_STRING) },
      { t: 'uint256', v: toString(order.makerMarket) },
      { t: 'uint256', v: toString(order.takerMarket) },
      { t: 'uint256', v: toString(order.makerAmount) },
      { t: 'uint256', v: toString(order.takerAmount) },
      { t: 'bytes32', v: addressToBytes32(order.makerAccountOwner) },
      { t: 'uint256', v: toString(order.makerAccountNumber) },
      { t: 'bytes32', v: addressToBytes32(order.takerAccountOwner) },
      { t: 'uint256', v: toString(order.takerAccountNumber) },
      { t: 'uint256', v: toString(order.triggerPrice) },
      { t: 'uint256', v: order.decreaseOnly ? '1' : '0' },
      { t: 'uint256', v: toString(order.expiration) },
      { t: 'uint256', v: toString(order.salt) },
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
      { t: 'bytes32', v: hashString('StopLimitOrders') },
      { t: 'bytes32', v: hashString('1.1') },
      { t: 'uint256', v: toString(this.networkId) },
      { t: 'bytes32', v: addressToBytes32(this.contracts.stopLimitOrders.options.address) },
    );
  }

  // ============ To-Bytes Functions ============

  public unsignedOrderToBytes(
    order: StopLimitOrder,
  ): string {
    return Web3.utils.bytesToHex(this.orderToByteArray(order));
  }

  public signedOrderToBytes(
    order: SignedStopLimitOrder,
  ): string {
    const signatureBytes = Web3.utils.hexToBytes(order.typedSignature);
    const byteArray = this.orderToByteArray(order).concat(signatureBytes);
    return Web3.utils.bytesToHex(byteArray);
  }

  // ============ Private Helper Functions ============

  private orderToByteArray(
    order: StopLimitOrder,
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
      .concat(argToBytes(order.triggerPrice))
      .concat(argToBytes(order.decreaseOnly))
      .concat(argToBytes(order.expiration))
      .concat(argToBytes(order.salt));
  }

  private getDomainData() {
    return {
      name: 'StopLimitOrders',
      version: '1.1',
      chainId: this.networkId,
      verifyingContract: this.contracts.stopLimitOrders.options.address,
    };
  }

  protected async ethSignTypedOrderInternal(
    order: StopLimitOrder,
    signingMethod: SigningMethod,
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
      triggerPrice: order.triggerPrice.toFixed(0),
      decreaseOnly: order.decreaseOnly,
      expiration: order.expiration.toFixed(0),
      salt: order.salt.toFixed(0),
    };
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        StopLimitOrder: EIP712_ORDER_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: 'StopLimitOrder',
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

  protected stringifyOrder(
    order: StopLimitOrder,
  ): any {
    const stringifiedOrder = { ... order };
    for (const [key, value] of Object.entries(order)) {
      if (typeof value !== 'string' && typeof value !== 'boolean') {
        stringifiedOrder[key] = toString(value);
      }
    }
    return stringifiedOrder;
  }

  protected getContract() {
    return this.contracts.stopLimitOrders;
  }
}
