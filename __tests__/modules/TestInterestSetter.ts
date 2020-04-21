import { TestContracts } from './TestContracts';
import { ContractCallOptions, TxResult, address, Decimal } from '../../src/types';
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
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testInterestSetter.methods.setInterestRate(
        token,
        { value: decimalToString(interestRate) },
      ),
      options,
    );
  }
}
