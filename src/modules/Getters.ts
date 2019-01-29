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
    const mkt = marketId.toFixed(0);
    const [
      token,
      totalPar,
      index,
      priceOracle,
      interestSetter,
      isClosing,
      currentIndex,
      currentPrice,
      currentInterestRate,
    ] = await Promise.all([
      this.contracts.soloMargin.methods.getMarketTokenAddress(mkt).call(),
      this.contracts.soloMargin.methods.getMarketTotalPar(mkt).call(),
      this.contracts.soloMargin.methods.getMarketCachedIndex(mkt).call(),
      this.contracts.soloMargin.methods.getMarketPriceOracle(mkt).call(),
      this.contracts.soloMargin.methods.getMarketInterestSetter(mkt).call(),
      this.contracts.soloMargin.methods.getMarketIsClosing(mkt).call(),
      this.contracts.soloMargin.methods.getMarketCurrentIndex(mkt).call(),
      this.contracts.soloMargin.methods.getMarketPrice(mkt).call(),
      this.contracts.soloMargin.methods.getMarketInterestRate(mkt).call(),
    ]);

    return {
      market: {
        token,
        priceOracle,
        interestSetter,
        isClosing,
        totalPar: {
          borrow: new BigNumber(totalPar.borrow),
          supply: new BigNumber(totalPar.supply),
        },
        index: this.parseIndex(index),
      },
      currentIndex: this.parseIndex(currentIndex),
      currentPrice: new BigNumber(currentPrice.value),
      currentInterestRate: new BigNumber(currentInterestRate.value).div(
        INTEGERS.INTEREST_RATE_BASE,
      ),
    };
  }

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Balance[]> {
    const account = { owner: accountOwner, number: accountNumber.toFixed(0) };
    const nm = await this.contracts.soloMargin.methods.getNumMarkets().call();
    const numMarkets = new BigNumber(nm).toNumber();

    const queries = [];

    for (let i = 0; i < numMarkets; i += 1) {
      queries.push(this.contracts.soloMargin.methods.getAccountPar(account, i).call());
      queries.push(this.contracts.soloMargin.methods.getAccountWei(account, i).call());
      queries.push(this.contracts.soloMargin.methods.getMarketTokenAddress(i).call());
    }

    const retVals = await Promise.all(queries);

    const result = [];

    for (let i = 0; i < numMarkets; i += 1) {
      result.push({
        par: this.parseValue(retVals[i * 3 + 0]),
        wei: this.parseValue(retVals[i * 3 + 1]),
        tokenAddress: retVals[i * 3 + 2],
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
