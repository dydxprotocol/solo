import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, address, Decimal } from '../../types';
import { decimalToString } from '../../lib/Helpers';

export class TestInterestSetter {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
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
