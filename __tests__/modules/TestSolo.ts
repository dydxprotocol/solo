import { Provider } from 'web3/providers';
import Web3 from 'web3';

import { Solo } from '../../src/Solo';
import { TestContracts } from './TestContracts';
import { Testing } from './Testing';
import { SoloOptions } from '../../src/types';

export class TestSolo extends Solo {
  public contracts: TestContracts;
  public testing: Testing;

  constructor(
    provider: Provider,
    networkId: number,
    options: SoloOptions = {},
  ) {
    super(provider, networkId, options);
    this.testing = new Testing(provider, this.contracts, this.token);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    super.setProvider(provider, networkId);
    this.testing.setProvider(provider);
  }

  protected createContractsModule(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ): any {
    return new TestContracts(provider, networkId, web3, options);
  }
}
