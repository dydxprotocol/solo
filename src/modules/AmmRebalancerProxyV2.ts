import { Contracts } from '../lib/Contracts';
import { toBytesNoPadding } from '../lib/BytesHelper';
import { address, ContractCallOptions, Integer, TxResult } from '../types';

export class AmmRebalancerProxyV2 {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async performRebalance(
    dolomitePath: address[],
    truePriceTokenA: Integer,
    truePriceTokenB: Integer,
    otherAmountIn: Integer,
    uniswapV3CallData: string,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.ammRebalancerProxyV2.methods.performRebalance(
        toBytesNoPadding(...dolomitePath),
        truePriceTokenA.toFixed(0),
        truePriceTokenB.toFixed(0),
        otherAmountIn.toFixed(0),
        toBytesNoPadding(uniswapV3CallData),
      ),
      options,
    );
  }
}
