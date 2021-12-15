import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer, TxResult } from '../types';

export class AmmRebalancerProxy {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async performRebalance(
    dolomitePath: address[],
    truePriceTokenA: Integer,
    truePriceTokenB: Integer,
    otherRouter: address,
    otherPath: address[],
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.ammRebalancerProxy.methods.performRebalance({
        dolomitePath,
        otherRouter,
        otherPath,
        truePriceTokenA: truePriceTokenA.toFixed(0),
        truePriceTokenB: truePriceTokenB.toFixed(0),
      }),
      options,
    );
  }
}
