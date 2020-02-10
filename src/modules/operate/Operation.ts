import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
import { AccountOperation } from './AccountOperation';
import { AccountOperationOptions } from '../../types';
import { LimitOrders } from '../LimitOrders';
import { StopLimitOrders } from '../StopLimitOrders';
import { CanonicalOrders } from '../CanonicalOrders';

export class Operation {
  private contracts: Contracts;
  private orderMapper: OrderMapper;
  private limitOrders: LimitOrders;
  private stopLimitOrders: StopLimitOrders;
  private canonicalOrders: CanonicalOrders;
  private networkId: number;

  constructor(
    contracts: Contracts,
    limitOrders: LimitOrders,
    stopLimitOrders: StopLimitOrders,
    canonicalOrders: CanonicalOrders,
    networkId: number,
  ) {
    this.contracts = contracts;
    this.orderMapper = new OrderMapper(networkId);
    this.limitOrders = limitOrders;
    this.stopLimitOrders = stopLimitOrders;
    this.canonicalOrders = canonicalOrders;
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
      this.canonicalOrders,
      this.networkId,
      options || {},
    );
  }
}
