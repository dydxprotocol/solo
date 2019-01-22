import { Contracts } from '../../lib/Contracts';

export class TestAutoTrader {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testPriceOracle.options.address;
  }
}
