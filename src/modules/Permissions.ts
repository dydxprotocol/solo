import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, TxResult } from '../types';

export class Permissions {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  public async setOperators(
    operatorArgs: ({ operator: address; trusted: boolean })[],
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.setOperators(operatorArgs),
      options,
    );
  }

  public async approveOperator(
    operator: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    if (!operator) {
      console.error('cannot find operator!');
    }
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.setOperators([
        {
          operator,
          trusted: true,
        },
      ]),
      options,
    );
  }

  public async disapproveOperator(
    operator: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.setOperators([
        {
          operator,
          trusted: false,
        },
      ]),
      options,
    );
  }
}
