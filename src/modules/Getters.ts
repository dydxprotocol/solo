import { BigNumber } from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import { MarketWithInfo, Index, Integer } from '../types';
import { INTEGERS } from '../lib/Constants';

export class Getters {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public async getMarket(
    marketId: Integer,
  ): Promise<MarketWithInfo> {
    const marketWithInfo = await this.contracts.soloMargin.methods
      .getMarketWithInfo(marketId.toFixed(0)).call();

    return {
      market: {
        token: marketWithInfo.market.token,
        priceOracle: marketWithInfo.market.priceOracle,
        interestSetter: marketWithInfo.market.interestSetter,
        isClosing: marketWithInfo.market.isClosing,
        totalPar: {
          borrow: new BigNumber(marketWithInfo.market.totalPar.borrow),
          supply: new BigNumber(marketWithInfo.market.totalPar.supply),
        },
        index: this.parseIndex(marketWithInfo.market.index),
      },
      currentIndex: this.parseIndex(marketWithInfo.currentIndex),
      currentPrice: new BigNumber(marketWithInfo.currentPrice.value),
      currentInterestRate: new BigNumber(marketWithInfo.currentInterestRate.value).div(
        INTEGERS.INTEREST_RATE_BASE,
      ),
    };
  }

  private parseIndex(
    { borrow, supply, lastUpdate }: { borrow: string, supply: string, lastUpdate: string },
  ): Index {
    return {
      borrow: new BigNumber(borrow).div(INTEGERS.INTEREST_RATE_BASE),
      supply: new BigNumber(supply).div(INTEGERS.INTEREST_RATE_BASE),
      lastUpdate: new BigNumber(lastUpdate),
    };
  }
}
