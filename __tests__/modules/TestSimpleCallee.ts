import { TestContracts } from './TestContracts';

export class TestSimpleCallee {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testSimpleCallee.options.address;
  }
}
