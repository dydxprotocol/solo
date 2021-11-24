import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';

export class AmmRebalancerProxy {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async addLiquidity(
    dolomitePath: address[],
    dolomiteAmountIn: Integer,
    otherRouter: address,
    otherPath: address[],
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.ammRebalancerProxy.methods.performRebalance(
        dolomitePath,
        dolomiteAmountIn.toFixed(0),
        otherRouter,
        otherPath,
      ),
      options,
    );
  }
}
