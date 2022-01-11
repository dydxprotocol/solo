import { Contracts } from '../../lib/Contracts';
import { AccountOperationOptions } from '../../types';
import { OrderMapper } from '../OrderMapper';
import { AccountOperation } from './AccountOperation';

export class Operation {
  private contracts: Contracts;
  private orderMapper: OrderMapper;
  private networkId: number;

  constructor(
    contracts: Contracts,
    orderMapper: OrderMapper,
    networkId: number,
  ) {
    this.contracts = contracts;
    this.orderMapper = orderMapper;
    this.networkId = networkId;
  }

  public initiate(options?: AccountOperationOptions): AccountOperation {
    return new AccountOperation(
      this.contracts,
      this.orderMapper,
      this.networkId,
      options || {},
    );
  }
}
