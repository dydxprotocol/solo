import { Order } from '../types';
import { Contracts } from '../lib/Contracts';

export class OrderMapper {
  protected contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  public mapOrder(order: Order): { bytes: number[], exchangeWrapperAddress: string } {
    throw new Error(`Cannot map order of type ${order.type}`);
  }

}
