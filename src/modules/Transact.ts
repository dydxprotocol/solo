import BN from 'bn.js';
import { Contracts } from '../lib/Contracts';
import { AccountTransaction } from './AccountTransaction';
import { ContractCallOptions } from '../types';

export class Transact {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public initiate(
    trader: string,
    account: BN | number | string,
    options: ContractCallOptions = {},
  ): AccountTransaction {
    return new AccountTransaction(this.contracts, trader, new BN(account), options);
  }
}
