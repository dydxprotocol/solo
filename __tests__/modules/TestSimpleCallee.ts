import { TestContracts } from './TestContracts';

export class TestSimpleCallee {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  public get address(): string {
    return this.contracts.testSimpleCallee.options.address;
  }
}
