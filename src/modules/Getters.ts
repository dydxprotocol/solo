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
    const market = marketWithInfo[0];
    const currentIndex = marketWithInfo[1];
    const currentPrice = marketWithInfo[2];
    const currentInterestRate = marketWithInfo[3];

    return {
      market: {
        token: market.token,
        priceOracle: market.priceOracle,
        interestSetter: market.interestSetter,
        isClosing: market.isClosing,
        totalPar: {
          borrow: new BigNumber(market.totalPar.borrow),
          supply: new BigNumber(market.totalPar.supply),
        },
        index: this.parseIndex(market.index),
      },
      currentIndex: this.parseIndex(currentIndex),
      currentPrice: new BigNumber(currentPrice.value),
      currentInterestRate: new BigNumber(currentInterestRate.value).div(
        INTEGERS.INTEREST_RATE_BASE,
      ),
    };
  }

  public async getNumExcessTokens(
    marketId: Integer,
  ): Promise<Integer> {
    const numExcessTokens = await this.contracts.soloMargin.methods
      .getNumExcessTokens(marketId.toFixed(0)).call();
    return this.parseValue(numExcessTokens);
  }

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Balance[]> {
    const balances = await this.contracts.soloMargin.methods
      .getAccountBalances({ owner: accountOwner, number: accountNumber.toFixed(0) }).call();
    const tokens = balances[0];
    const pars = balances[1];
    const weis = balances[2];

    const result = [];
    for (let i = 0; i < tokens.length; i += 1) {
      result.push({
        tokenAddress: tokens[i],
        par: this.parseValue(pars[i]),
        wei: this.parseValue(weis[i]),
      });
    }
    return result;
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
