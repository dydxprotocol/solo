import { TestContracts } from './TestContracts';
import { SendOptions, TxResult, address, Decimal } from '../../src/types';
import { decimalToString } from '../../src/lib/Helpers';

export class TestInterestSetter {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testInterestSetter.options.address;
  }

  public async setInterestRate(
    token: address,
    interestRate: Decimal,
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testInterestSetter.methods.setInterestRate(
        token,
        { value: decimalToString(interestRate) },
      ),
      options,
    );
  }
}
