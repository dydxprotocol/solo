import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, Integer } from '../../types';

export class TestAutoTrader {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testAutoTrader.options.address;
  }

  public async setData(
    tradeId: Integer,
    numTokens: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testAutoTrader.methods.setData(
        tradeId.toFixed(0),
        numTokens.toFixed(0),
      ),
      options,
    );
  }
}
