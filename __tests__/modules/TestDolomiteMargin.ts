import Web3 from 'web3';
import { Provider } from 'web3/providers';

import {
  DolomiteMargin,
  DolomiteMarginOptions,
} from '../../src';
import { Contracts } from '../../src/lib/Contracts';
import { Operation } from '../../src/modules/operate/Operation';
import { TestContracts } from './TestContracts';
import { Testing } from './Testing';
import { TestOrderMapper } from './TestOrderMapper';

export class TestDolomiteMargin extends DolomiteMargin {
  public contracts: TestContracts;
  public testing: Testing;

  constructor(
    provider: Provider,
    networkId: number,
    options: DolomiteMarginOptions = {},
  ) {
    super(provider, networkId, options);
    this.testing = new Testing(provider, this.contracts, this.token);
    this.operation = new Operation(this.contracts as Contracts, new TestOrderMapper(this.contracts), networkId);
  }

  public setProvider(provider: Provider, networkId: number): void {
    super.setProvider(provider, networkId);
    this.testing.setProvider(provider);
  }

  protected createContractsModule(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: DolomiteMarginOptions,
  ): any {
    return new TestContracts(provider, networkId, web3, options);
  }
}
