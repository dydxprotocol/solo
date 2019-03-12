import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, Integer } from '../../types';

export class TestPolynomialInterestSetter {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testPolynomialInterestSetter.options.address;
  }

  public async setParameters(
    maxAPR: Integer,
    coefficients: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testPolynomialInterestSetter.methods.setParameters({
        maxAPR: maxAPR.toFixed(0),
        coefficients: coefficients.toFixed(0),
      }),
      options,
    );
  }
}
