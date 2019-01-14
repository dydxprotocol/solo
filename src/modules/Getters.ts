import BN from 'bn.js';
import { Contracts } from '../lib/Contracts';
import { MarketWithInfo, address, Index } from '../types';

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

  public async getMarketOnly(
    marketId: BN,
  ): Promise<any> {
    return this.contracts.soloMargin.methods
      .getMarket(marketId.toString()).call();
  }

  public async getMarketTokenAddress(
    marketId: BN,
  ): Promise<address> {
    return this.contracts.soloMargin.methods
      .getMarketTokenAddress(marketId.toString()).call();
  }

  public async getMarketPrice(
    marketId: BN,
  ): Promise<BN> {
    const { value } = await this.contracts.soloMargin.methods
      .getMarketPrice(marketId.toString()).call();

    return new BN(value);
  }

  public async getMarketCurrentIndex(
    marketId: BN,
  ): Promise<Index> {
    return this.contracts.soloMargin.methods
      .getMarketCurrentIndex(marketId.toString()).call();
  }
}
