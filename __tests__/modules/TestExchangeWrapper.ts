import { TestContracts } from './TestContracts';

export class TestExchangeWrapper {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testExchangeWrapper.options.address;
  }

  public getExchangeAddress(): string {
    return '0x0000000000000000000000000000000000000001';
  }
}
