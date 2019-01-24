import { Contracts } from '../../lib/Contracts';

export class TestExchangeWrapper {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testExchangeWrapper.options.address;
  }
}
