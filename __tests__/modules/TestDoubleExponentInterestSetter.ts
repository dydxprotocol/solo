import BigNumber from 'bignumber.js';
import { TestContracts } from './TestContracts';
import { ADDRESSES } from '../../src/lib/Constants';
import {
  CallOptions,
  SendOptions,
  TxResult,
  Integer,
} from '../../src/types';

export class TestDoubleExponentInterestSetter {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testDoubleExponentInterestSetter.options.address;
  }

  public async getInterestRate(
    borrowWei: Integer,
    supplyWei: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
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
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testDoubleExponentInterestSetter.methods.setParameters({
        maxAPR: maxAPR.toFixed(0),
        coefficients: coefficients.toFixed(0),
      }),
      options,
    );
  }
}
