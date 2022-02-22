import BN from 'bn.js';
import {
  TestExchangeWrapperOrder,
} from '../helpers/types';
import BigNumber from 'bignumber.js';
import web3Utils from 'web3-utils';
import { TestContracts } from './TestContracts';

export class TestExchangeWrapper {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  public get address(): string {
    return this.contracts.testExchangeWrapper.options.address;
  }

  public get exchangeAddress(): string {
    return '0x0000000000000000000000000000000000000001';
  }

  public orderToBytes(order: TestExchangeWrapperOrder): number[] {
    return []
      .concat(TestExchangeWrapper.toBytes(order.originator))
      .concat(TestExchangeWrapper.toBytes(order.makerToken))
      .concat(TestExchangeWrapper.toBytes(order.takerToken))
      .concat(TestExchangeWrapper.toBytes(order.makerAmount))
      .concat(TestExchangeWrapper.toBytes(order.takerAmount))
      .concat(TestExchangeWrapper.toBytes(order.allegedTakerAmount))
      .concat(TestExchangeWrapper.toBytes(order.desiredMakerAmount));
  }

  private static toBytes(val: string | BN | BigNumber): number[] {
    let paddedBytes: string;
    if (val instanceof BigNumber) {
      paddedBytes = web3Utils.padLeft(web3Utils.toHex(val.toFixed()), 64, '0');
    } else if (typeof val === 'string') {
      paddedBytes = web3Utils.padLeft(web3Utils.toHex(val), 64, '0');
    } else {
      // val instanceof BN
      paddedBytes = web3Utils.padLeft(web3Utils.toHex(val.toString()), 64, '0');
    }

    return web3Utils.hexToBytes(paddedBytes);
  }
}
