import { Contracts } from '../lib/Contracts';
import { address } from '../types';

export class DolomiteAmmFactory {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async getPairInitCodeHash(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.getPairInitCodeHash()
    );
  }

  public async getPair(
    tokenA: address,
    tokenB: address,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.getPair(tokenA, tokenB)
    );
  }

  public async feeTo(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.feeTo()
    );
  }

  public async feeToSetter(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.feeToSetter()
    );
  }

}
