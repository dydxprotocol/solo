import { TestContracts } from './TestContracts';
import { ContractCallOptions, Integer, TxResult } from '../../src';

export class TestPolynomialInterestSetter {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  public get address(): string {
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
