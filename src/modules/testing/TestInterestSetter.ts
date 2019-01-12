import BigNumber from 'bignumber.js';
import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, address } from '../../types';
import { BIG_NUMBERS } from '../../lib/Constants';

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
    interestRate: BigNumber,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testInterestSetter.methods.setInterestRate(
        token,
        {
          value: interestRate.times(BIG_NUMBERS.INTEREST_RATE_BASE).floor().toFixed(),
        },
      ),
      options,
    );
  }
}
