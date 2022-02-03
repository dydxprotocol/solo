import { Contracts } from '../lib/Contracts';
import { toBytesNoPadding } from '../lib/BytesHelper';
import { address, ContractCallOptions, Integer, TxResult } from '../types';

export class AmmRebalancerProxyV1 {
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
      this.contracts.ammRebalancerProxyV1.methods.performRebalance({
        otherRouter,
        dolomitePath: toBytesNoPadding(...dolomitePath),
        otherPath: toBytesNoPadding(...otherPath),
        truePriceTokenA: truePriceTokenA.toFixed(0),
        truePriceTokenB: truePriceTokenB.toFixed(0),
      }),
      options,
    );
  }
}
