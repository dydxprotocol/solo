import BigNumber from 'bignumber.js';
import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, address, Decimal } from '../../types';
import { INTEGERS } from '../../lib/Constants';

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
        {
          value: interestRate
            .times(INTEGERS.INTEREST_RATE_BASE)
            .integerValue(BigNumber.ROUND_DOWN)
            .toFixed(),
        },
      ),
      options,
    );
  }
}
