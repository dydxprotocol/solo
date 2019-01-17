import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
import { AccountTransaction } from './AccountTransaction';

export class Transaction {
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

  public initiate(): AccountTransaction {
    return new AccountTransaction(
      this.contracts,
      this.orderMapper,
    );
  }
}
