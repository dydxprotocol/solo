import BN from 'bn.js';
import { Contracts } from '../lib/Contracts';
import { MarketWithInfo } from '../types';

export class Getters {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public async getMarket(
    marketId: BN,
  ): Promise<MarketWithInfo> {
    return this.contracts.soloMargin.methods
      .getMarketWithInfo(marketId.toString()).call();
  }
}
