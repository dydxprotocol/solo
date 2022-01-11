import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Order, OrderType } from '../../src';

export enum TestOrderType {
  Test = 'Test',
}

export interface TestOrder extends Order {
  type: OrderType | TestOrderType;
  exchangeWrapperAddress: string;
}

export interface TestExchangeWrapperOrder extends TestOrder {
  originator: string;
  makerToken: string;
  takerToken: string;
  makerAmount: BigNumber | BN;
  takerAmount: BigNumber | BN;
  allegedTakerAmount: BigNumber | BN;
  desiredMakerAmount: BigNumber | BN;
}
