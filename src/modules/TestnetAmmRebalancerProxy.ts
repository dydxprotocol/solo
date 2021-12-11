import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer, TxResult, } from '../types';

export class TestnetAmmRebalancerProxy {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async performRebalance(
    tokenA: address,
    tokenB: address,
    truePriceTokenA: Integer,
    truePriceTokenB: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testnetAmmRebalancerProxy.methods.performRebalance(
        tokenA,
        tokenB,
        truePriceTokenA.toFixed(0),
        truePriceTokenB.toFixed(0)
      ),
      options,
    );
  }
}
