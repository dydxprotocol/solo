import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { soliditySha3, bytesToHex, hexToBytes } from 'web3-utils';
import { promisify } from 'es6-promisify';
import { Contracts } from '../lib/Contracts';
import {
  addressToBytes32,
  argToBytes,
  stringToBytes32,
  stripHexPrefix,
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
  Integer,
  LimitOrder,
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

  // ============ Sender Contract Methods ============

  public async approveOrder(
    order: LimitOrder,
    options?: ContractCallOptions,
  ): Promise<any> {
    const orderHash = this.getOrderHash(order);
    return await this.contracts.callContractFunction(
      this.contracts.limitOrders.methods.approveOrder(orderHash),
      options,
    );
  }

  public async cancelOrder(
    order: LimitOrder,
    options?: ContractCallOptions,
  ): Promise<any> {
    const orderHash = this.getOrderHash(order);
    return await this.contracts.callContractFunction(
      this.contracts.limitOrders.methods.cancelOrder(orderHash),
      options,
    );
  }

  // ============ Getter Contract Methods ============

  public async getOrderStatus(
    order: LimitOrder,
    options?: ContractConstantCallOptions,
  ): Promise<{status: number, makerFilledAmount: Integer}> {
    const orderHash = this.getOrderHash(order);

    const [
      status,
      makerFilledAmount,
    ] = await Promise.all([
      this.contracts.callConstantContractFunction(
        this.contracts.limitOrders.methods.g_status(
          order.makerAccountOwner,
          orderHash,
        ),
        options,
      ),
      this.contracts.callConstantContractFunction(
        this.contracts.limitOrders.methods.g_filled(
          orderHash,
        ),
        options,
      ),
    ]);

    return {
      status: parseInt(status, 10),
      makerFilledAmount: new BigNumber(makerFilledAmount),
    };
  }

  // ============ Signing Methods ============

  public async ethSignTypedOrderV3(
    order: LimitOrder,
  ): Promise<string> {
    return this.ethSignTypedOrderInternal(
      order,
      'eth_signTypedData_v3',
    );
  }

  public async ethSignTypedOrder(
    order: LimitOrder,
  ): Promise<string> {
    return this.ethSignTypedOrderInternal(
      order,
      'eth_signTypedData',
    );
  }

  public async ethSignOrder(
    order: LimitOrder,
  ): Promise<string> {
    const hash = this.getOrderHash(order);
    const signature = await this.web3.eth.sign(hash, order.makerAccountOwner);
    return createTypedSignature(signature, SIGNATURE_TYPES.NO_PREPEND);
  }

  public async ethSignCancelOrder(
    order: LimitOrder,
  ): Promise<string> {
    return this.ethSignCancelOrderByHash(
      this.getOrderHash(order),
      order.makerAccountOwner,
    );
  }

  public async ethSignCancelOrderByHash(
    orderHash: string,
    signer: address,
  ): Promise<string> {
    const cancelHash = this.orderHashToCancelOrderHash(orderHash);
    const signature = await this.web3.eth.sign(cancelHash, signer);
    return createTypedSignature(signature, SIGNATURE_TYPES.NO_PREPEND);
  }

  // ============ Signature Verification ============

  public async orderHasValidSignature(
    order: LimitOrder,
  ): Promise<boolean> {
    if (!order.signature) {
      return false;
    }
    return this.orderByHashHasValidSignature(
      this.getOrderHash(order),
      order.signature,
      order.makerAccountOwner,
    );
  }

  public async orderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): Promise<boolean> {
    const signer = await ecRecoverTypedSignature(orderHash, typedSignature);
    return stripHexPrefix(signer).toLowerCase() === stripHexPrefix(expectedSigner).toLowerCase();
  }

  public async cancelOrderHasValidSignature(
    order: LimitOrder,
    typedSignature: string,
  ): Promise<boolean> {
    return this.cancelOrderByHashHasValidSignature(
      this.getOrderHash(order),
      typedSignature,
      order.makerAccountOwner,
    );
  }

  public async cancelOrderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): Promise<boolean> {
    const cancelHash = this.orderHashToCancelOrderHash(orderHash);
    const signer = await ecRecoverTypedSignature(cancelHash, typedSignature);
    return stripHexPrefix(signer).toLowerCase() === stripHexPrefix(expectedSigner).toLowerCase();
  }

  // ============ Hashing Functions ============

  public getOrderHash(
    order: LimitOrder,
  ): string {
    const structHash = soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_ORDER_STRUCT_STRING) },
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

    const domainHash = this.getDomainHash();

    const retVal = soliditySha3(
      { t: 'bytes2', v: '0x1901' },
      { t: 'bytes32', v: domainHash },
      { t: 'bytes32', v: structHash },
    );

    return retVal;
  }

  public getDomainHash(): string {
    return soliditySha3(
      { t: 'bytes32', v: stringToBytes32(EIP712_DOMAIN_STRING) },
      { t: 'bytes32', v: stringToBytes32('LimitOrders') },
      { t: 'bytes32', v: stringToBytes32('1.0') },
      { t: 'uint256', v: this.networkId },
      { t: 'bytes32', v: addressToBytes32(this.contracts.limitOrders.options.address) },
    );
  }

  public orderToBytes(
    order: LimitOrder,
    includeSignature: boolean = true,
  ): string {
    let byteArray = []
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
    if (includeSignature && order.signature) {
      byteArray = byteArray.concat(hexToBytes(order.signature));
    }
    return bytesToHex(byteArray);
  }

  // ============ Private Helper Functions ============

  private orderHashToCancelOrderHash(
    orderHash: string,
  ): string {
    return soliditySha3(
      { t: 'string', v: 'cancel' },
      { t: 'bytes32', v: orderHash },
    );
  }

  private async ethSignTypedOrderInternal(
    order: LimitOrder,
    rpcMethod: string,
  ): Promise<string> {
    const domainData = {
      name: 'LimitOrders',
      version: '1.0',
      chainId: this.networkId,
      verifyingContract: this.contracts.limitOrders.options.address,
    };
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
      domain: domainData,
      primaryType: 'LimitOrder',
      message: orderData,
    };
    const sendAsync = promisify(this.web3.currentProvider.send).bind(this.web3.currentProvider);
    const response = await sendAsync({
      method: rpcMethod,
      params: [order.makerAccountOwner, data],
      jsonrpc: '2.0',
      id: new Date().getTime(),
    });
    if (response.error) {
      throw new Error(response.error.message);
    }
    return `0x${stripHexPrefix(response.result)}0${SIGNATURE_TYPES.NO_PREPEND}`;
  }
}
