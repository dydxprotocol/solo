import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
import { AccountOperation } from './AccountOperation';

export class Operation {
  private contracts: Contracts;
  private orderMapper: OrderMapper;

  constructor(
    contracts: Contracts,
    networkId: number,
  ) {
    this.contracts = contracts;
    this.orderMapper = new OrderMapper(networkId);
  }

  public setNetworkId(networkId: number): void {
    this.orderMapper.setNetworkId(networkId);
  }

  public initiate(): AccountOperation {
    return new AccountOperation(
      this.contracts,
      this.orderMapper,
    );
  }
}
