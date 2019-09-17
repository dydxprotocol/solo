import BigNumber from 'bignumber.js';
import { Contracts } from '../../lib/Contracts';
import { ADDRESSES } from '../../lib/Constants';
import {
  ContractConstantCallOptions,
  ContractCallOptions,
  TxResult,
  Integer,
} from '../../types';

export class TestDoubleExponentInterestSetter {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testDoubleExponentInterestSetter.options.address;
  }

  public async getInterestRate(
    borrowWei: Integer,
    supplyWei: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.testDoubleExponentInterestSetter.methods.getInterestRate(
        ADDRESSES.ZERO,
        borrowWei.toFixed(0),
        supplyWei.toFixed(0),
      ),
      options,
    );
    return new BigNumber(result.value);
  }

  public async setParameters(
    maxAPR: Integer,
    coefficients: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testDoubleExponentInterestSetter.methods.setParameters({
        maxAPR: maxAPR.toFixed(0),
        coefficients: coefficients.toFixed(0),
      }),
      options,
    );
  }
}
