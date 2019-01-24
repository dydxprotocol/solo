import { BigNumber } from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import { MarketWithInfo, Index, Integer, address, Balance, Values } from '../types';
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

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Balance[]> {
    const balances = await this.contracts.soloMargin.methods
      .getAccountBalances({ owner: accountOwner, number: accountNumber.toFixed(0) }).call();

    return balances.map(b => ({
      tokenAddress: b.tokenAddress,
      par: this.parseValue(b.parBalance),
      wei: this.parseValue(b.weiBalance),
    }));
  }

  public async getAccountValues(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Values> {
    const values = await this.contracts.soloMargin.methods
      .getAccountValues({ owner: accountOwner, number: accountNumber.toFixed(0) }).call();

    return {
      supply: new BigNumber(values[0].value),
      borrow: new BigNumber(values[1].value),
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

  private parseValue({ value, sign }: { value: string, sign: boolean }): Integer {
    const absolute = new BigNumber(value);

    if (!sign && !absolute.eq(INTEGERS.ZERO)) {
      return absolute.times(new BigNumber(-1));
    }

    return absolute;
  }
}
