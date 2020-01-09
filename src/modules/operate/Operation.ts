import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
import { AccountOperation } from './AccountOperation';
import { AccountOperationOptions } from '../../types';
import { LimitOrders } from '../LimitOrders';
import { StopLimitOrders } from '../StopLimitOrders';

export class Operation {
  private contracts: Contracts;
  private orderMapper: OrderMapper;
  private limitOrders: LimitOrders;
  private stopLimitOrders: StopLimitOrders;
  private networkId: number;

  constructor(
    contracts: Contracts,
    limitOrders: LimitOrders,
    stopLimitOrders: StopLimitOrders,
    networkId: number,
  ) {
    this.contracts = contracts;
    this.orderMapper = new OrderMapper(networkId);
    this.limitOrders = limitOrders;
    this.stopLimitOrders = stopLimitOrders;
    this.networkId = networkId;
  }

  public setNetworkId(networkId: number): void {
    this.orderMapper.setNetworkId(networkId);
  }

  public initiate(options?: AccountOperationOptions): AccountOperation {
    return new AccountOperation(
      this.contracts,
      this.orderMapper,
      this.limitOrders,
      this.stopLimitOrders,
      this.networkId,
      options || {},
    );
  }
}
