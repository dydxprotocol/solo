import { Contracts } from '../../src/lib/Contracts';
import { OrderMapper } from '../../src/modules/OrderMapper';
import {
  TestExchangeWrapperOrder,
  TestOrder,
  TestOrderType,
} from '../helpers/types';
import { TestContracts } from './TestContracts';
import { TestExchangeWrapper } from './TestExchangeWrapper';

export class TestOrderMapper extends OrderMapper {
  public testExchangeWrapper: TestExchangeWrapper;
  protected contracts: TestContracts;

  constructor(contracts: TestContracts) {
    super(contracts as Contracts);
    this.testExchangeWrapper = new TestExchangeWrapper(contracts);
  }

  public mapOrder(order: TestOrder): { bytes: number[], exchangeWrapperAddress: string } {
    const { type, ...orderData } = order;

    if (type === TestOrderType.Test) {
      return {
        bytes: this.testExchangeWrapper.orderToBytes(orderData as TestExchangeWrapperOrder),
        exchangeWrapperAddress: order.exchangeWrapperAddress || this.testExchangeWrapper.address,
      };
    }

    return super.mapOrder(order);
  }

}
