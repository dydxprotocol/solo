import { Contracts } from '../../lib/Contracts';

export class TestSimpleCallee {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testSimpleCallee.options.address;
  }
}
