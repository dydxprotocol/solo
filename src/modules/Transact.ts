import BN from 'bn.js';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../lib/Contracts';
import { AccountTransaction } from './AccountTransaction';
import { ContractCallOptions } from '../types';

export class Transact {
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

  public initiate(
    trader: string,
    account: BN | number | string,
    options: ContractCallOptions = {},
  ): AccountTransaction {
    return new AccountTransaction(
      this.contracts,
      trader,
      new BN(account),
      options,
      this.orderMapper,
    );
  }
}
