import { BigNumber } from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  address,
  AccountStatus,
  Balance,
  Decimal,
  Index,
  Integer,
  Market,
  MarketWithInfo,
  RiskLimits,
  RiskParams,
  TotalPar,
  Values,
} from '../types';
import { INTEGERS } from '../lib/Constants';
import { stringToDecimal } from '../lib/Helpers';

export class Getters {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ Getters for Risk ============

  public async getLiquidationRatio(): Promise<Decimal> {
    const result = await this.contracts.soloMargin.methods
      .getLiquidationRatio().call();
    return stringToDecimal(result.value);
  }

  public async getLiquidationSpread(): Promise<Decimal> {
    const result = await this.contracts.soloMargin.methods
      .getLiquidationSpread().call();
    return stringToDecimal(result.value);
  }

  public async getEarningsRate(): Promise<Decimal> {
    const result = await this.contracts.soloMargin.methods
      .getEarningsRate().call();
    return stringToDecimal(result.value);
  }

  public async getMinBorrowedValue(): Promise<Integer> {
    const result = await this.contracts.soloMargin.methods
      .getMinBorrowedValue().call();
    return new BigNumber(result.value);
  }

  public async getRiskParams(): Promise<RiskParams> {
    const result = await this.contracts.soloMargin.methods
      .getRiskParams().call();
    return {
      liquidationRatio: stringToDecimal(result[0].value),
      liquidationSpread: stringToDecimal(result[1].value),
      earningsRate: stringToDecimal(result[2].value),
      minBorrowedValue: new BigNumber(result[3].value),
    };
  }

  public async getRiskLimits(): Promise<RiskLimits> {
    const result = await this.contracts.soloMargin.methods
      .getRiskLimits().call();
    return {
      interestRateMax: stringToDecimal(result[0]),
      liquidationRatioMax: stringToDecimal(result[1]),
      liquidationRatioMin: stringToDecimal(result[2]),
      liquidationSpreadMax: stringToDecimal(result[3]),
      liquidationSpreadMin: stringToDecimal(result[4]),
      earningsRateMin: stringToDecimal(result[5]),
      earningsRateMax: stringToDecimal(result[6]),
      minBorrowedValueMax: new BigNumber(result[7]),
      minBorrowedValueMin: new BigNumber(result[8]),
    };
  }

  // ============ Getters for Markets ============

  public async getNumMarkets(): Promise<Integer> {
    const result = await this.contracts.soloMargin.methods
      .getNumMarkets().call();
    return new BigNumber(result);
  }

  public async getMarketTokenAddress(
    marketId: Integer,
  ): Promise<address> {
    return this.contracts.soloMargin.methods
      .getMarketTokenAddress(
        marketId.toFixed(0),
      ).call();
  }

  public async getMarketTotalPar(
    marketId: Integer,
  ): Promise<TotalPar> {
    const result = await this.contracts.soloMargin.methods
      .getMarketTotalPar(
        marketId.toFixed(0),
      ).call();
    return {
      borrow: new BigNumber(result[0]),
      supply: new BigNumber(result[1]),
    };
  }

  public async getMarketCachedIndex(
    marketId: Integer,
  ): Promise<Index> {
    const result = await this.contracts.soloMargin.methods
      .getMarketCachedIndex(
        marketId.toFixed(0),
      ).call();
    return this.parseIndex(result);
  }

  public async getMarketCurrentIndex(
    marketId: Integer,
  ): Promise<Index> {
    const result = await this.contracts.soloMargin.methods
      .getMarketCurrentIndex(
        marketId.toFixed(0),
      ).call();
    return this.parseIndex(result);
  }

  public async getMarketPriceOracle(
    marketId: Integer,
  ): Promise<address> {
    return this.contracts.soloMargin.methods
      .getMarketPriceOracle(
        marketId.toFixed(0),
      ).call();
  }

  public async getMarketInterestSetter(
    marketId: Integer,
  ): Promise<address> {
    return this.contracts.soloMargin.methods
      .getMarketInterestSetter(
        marketId.toFixed(0),
      ).call();
  }

  public async getMarketIsClosing(
    marketId: Integer,
  ): Promise<boolean> {
    return this.contracts.soloMargin.methods
      .getMarketIsClosing(
        marketId.toFixed(0),
      ).call();
  }

  public async getMarketPrice(
    marketId: Integer,
  ): Promise<Integer> {
    const result = await this.contracts.soloMargin.methods
      .getMarketPrice(
        marketId.toFixed(0),
      ).call();
    return new BigNumber(result.value);
  }

  public async getMarketInterestRate(
    marketId: Integer,
  ): Promise<Decimal> {
    const result = await this.contracts.soloMargin.methods
      .getMarketInterestRate(
        marketId.toFixed(0),
      ).call();
    return stringToDecimal(result.value);
  }

  public async getMarket(
    marketId: Integer,
  ): Promise<Market> {
    const market = await this.contracts.soloMargin.methods
      .getMarket(marketId.toFixed(0)).call();
    return {
      ...market,
      totalPar: this.parseTotalPar(market.totalPar),
      index: this.parseIndex(market.index),
    };
  }

  public async getMarketWithInfo(
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
        ...market,
        totalPar: this.parseTotalPar(market.totalPar),
        index: this.parseIndex(market.index),
      },
      currentIndex: this.parseIndex(currentIndex),
      currentPrice: new BigNumber(currentPrice.value),
      currentInterestRate: stringToDecimal(currentInterestRate.value),
    };
  }

  public async getNumExcessTokens(
    marketId: Integer,
  ): Promise<Integer> {
    const numExcessTokens = await this.contracts.soloMargin.methods
      .getNumExcessTokens(marketId.toFixed(0)).call();
    return this.parseValue(numExcessTokens);
  }

  // ============ Getters for Accounts ============

  public async getAccountPar(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
  ): Promise<Integer> {
    const result = await this.contracts.soloMargin.methods
      .getAccountPar(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ).call();
    return this.parseValue(result);
  }

  public async getAccountWei(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
  ): Promise<Integer> {
    const result = await this.contracts.soloMargin.methods
      .getAccountWei(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ).call();
    return this.parseValue(result);
  }

  public async getAccountStatus(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<AccountStatus> {
    const rawStatus = await this.contracts.soloMargin.methods
      .getAccountStatus({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }).call();
    switch (rawStatus) {
      case '0':
        return AccountStatus.Normal;
      case '1':
        return AccountStatus.Liquidating;
      case '2':
        return AccountStatus.Vaporizing;
      default:
        throw new Error('invalid account status ${rawStatus}');
    }
  }

  public async getAccountValues(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Values> {
    const result = await this.contracts.soloMargin.methods
      .getAccountValues({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }).call();
    return {
      supply: new BigNumber(result[0].value),
      borrow: new BigNumber(result[1].value),
    };
  }

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<Balance[]> {
    const balances = await this.contracts.soloMargin.methods
      .getAccountBalances({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }).call();
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

  // ============ Getters for Permissions ============

  public async getIsLocalOperator(
    owner: address,
    operator: address,
  ): Promise<boolean> {
    return this.contracts.soloMargin.methods
      .getIsLocalOperator(owner, operator).call();
  }

  public async getIsGlobalOperator(
    operator: address,
  ): Promise<boolean> {
    return this.contracts.soloMargin.methods
      .getIsGlobalOperator(operator).call();
  }

  // ============ Helper Functions ============

  private parseIndex(
    { borrow, supply, lastUpdate }: { borrow: string, supply: string, lastUpdate: string },
  ): Index {
    return {
      borrow: stringToDecimal(borrow),
      supply: stringToDecimal(supply),
      lastUpdate: new BigNumber(lastUpdate),
    };
  }

  private parseTotalPar(
    { supply, borrow }: { supply: string, borrow: string },
  ): TotalPar {
    return {
      borrow: new BigNumber(borrow),
      supply: new BigNumber(supply),
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
