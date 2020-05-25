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
  CallOptions,
} from '../types';
import { stringToDecimal, valueToInteger } from '../lib/Helpers';

export class Getters {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ Getters for Risk ============

  public async getMarginRatio(options?: CallOptions): Promise<Decimal> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarginRatio(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getLiquidationSpread(options?: CallOptions): Promise<Decimal> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getLiquidationSpread(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getEarningsRate(options?: CallOptions): Promise<Decimal> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getEarningsRate(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getMinBorrowedValue(options?: CallOptions): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMinBorrowedValue(),
      options,
    );
    return new BigNumber(result.value);
  }

  public async getRiskParams(options?: CallOptions): Promise<RiskParams> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getRiskParams(),
      options,
    );
    return {
      marginRatio: stringToDecimal(result[0].value),
      liquidationSpread: stringToDecimal(result[1].value),
      earningsRate: stringToDecimal(result[2].value),
      minBorrowedValue: new BigNumber(result[3].value),
    };
  }

  public async getRiskLimits(options?: CallOptions): Promise<RiskLimits> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getRiskLimits(),
      options,
    );
    return {
      marginRatioMax: stringToDecimal(result[0]),
      liquidationSpreadMax: stringToDecimal(result[1]),
      earningsRateMax: stringToDecimal(result[2]),
      marginPremiumMax: stringToDecimal(result[3]),
      spreadPremiumMax: stringToDecimal(result[4]),
      minBorrowedValueMax: new BigNumber(result[5]),
    };
  }

  // ============ Getters for Markets ============

  public async getNumMarkets(options?: CallOptions): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getNumMarkets(),
      options,
    );
    return new BigNumber(result);
  }

  public async getMarketTokenAddress(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getMarketTokenAddress(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketTotalPar(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<TotalPar> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketTotalPar(
        marketId.toFixed(0),
      ),
      options,
    );
    return {
      borrow: new BigNumber(result[0]),
      supply: new BigNumber(result[1]),
    };
  }

  public async getMarketCachedIndex(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Index> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketCachedIndex(
        marketId.toFixed(0),
      ),
      options,
    );
    return this.parseIndex(result);
  }

  public async getMarketCurrentIndex(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Index> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketCurrentIndex(
        marketId.toFixed(0),
      ),
      options,
    );
    return this.parseIndex(result);
  }

  public async getMarketPriceOracle(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getMarketPriceOracle(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketInterestSetter(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getMarketInterestSetter(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketMarginPremium(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const marginPremium = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketMarginPremium(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(marginPremium.value);
  }

  public async getMarketSpreadPremium(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const spreadPremium = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketSpreadPremium(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(spreadPremium.value);
  }

  public async getMarketIsClosing(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<boolean> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getMarketIsClosing(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketPrice(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketPrice(
        marketId.toFixed(0),
      ),
      options,
    );
    return new BigNumber(result.value);
  }

  public async getMarketUtilization(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const market = await this.getMarket(marketId, options);
    const totalSupply: Decimal = market.totalPar.supply.times(market.index.supply);
    const totalBorrow: Decimal = market.totalPar.borrow.times(market.index.borrow);
    return totalBorrow.div(totalSupply);
  }

  public async getMarketInterestRate(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketInterestRate(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getMarketSupplyInterestRate(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const [
      earningsRate,
      borrowInterestRate,
      utilization,
    ] = await Promise.all([
      this.getEarningsRate(options),
      this.getMarketInterestRate(marketId, options),
      this.getMarketUtilization(marketId, options),
    ]);
    return borrowInterestRate.times(earningsRate).times(utilization);
  }

  public async getLiquidationSpreadForPair(
    heldMarketId: Integer,
    owedMarketId: Integer,
    options?: CallOptions,
  ): Promise<Decimal> {
    const spread = await this.contracts.call(
      this.contracts.soloMargin.methods.getLiquidationSpreadForPair(
        heldMarketId.toFixed(0),
        owedMarketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(spread.value);
  }

  public async getMarket(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Market> {
    const market = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarket(marketId.toFixed(0)),
      options,
    );
    return {
      ...market,
      totalPar: this.parseTotalPar(market.totalPar),
      index: this.parseIndex(market.index),
      marginPremium: stringToDecimal(market.marginPremium.value),
      spreadPremium: stringToDecimal(market.spreadPremium.value),
    };
  }

  public async getMarketWithInfo(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<MarketWithInfo> {
    const marketWithInfo = await this.contracts.call(
      this.contracts.soloMargin.methods.getMarketWithInfo(marketId.toFixed(0)),
      options,
    );
    const market = marketWithInfo[0];
    const currentIndex = marketWithInfo[1];
    const currentPrice = marketWithInfo[2];
    const currentInterestRate = marketWithInfo[3];

    return {
      market: {
        ...market,
        totalPar: this.parseTotalPar(market.totalPar),
        index: this.parseIndex(market.index),
        marginPremium: stringToDecimal(market.marginPremium.value),
        spreadPremium: stringToDecimal(market.spreadPremium.value),
      },
      currentIndex: this.parseIndex(currentIndex),
      currentPrice: new BigNumber(currentPrice.value),
      currentInterestRate: stringToDecimal(currentInterestRate.value),
    };
  }

  public async getNumExcessTokens(
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const numExcessTokens = await this.contracts.call(
      this.contracts.soloMargin.methods.getNumExcessTokens(marketId.toFixed(0)),
      options,
    );
    return valueToInteger(numExcessTokens);
  }

  // ============ Getters for Accounts ============

  public async getAccountPar(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getAccountPar(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ),
      options,
    );
    return valueToInteger(result);
  }

  public async getAccountWei(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getAccountWei(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ),
      options,
    );
    return valueToInteger(result);
  }

  public async getAccountStatus(
    accountOwner: address,
    accountNumber: Integer,
    options?: CallOptions,
  ): Promise<AccountStatus> {
    const rawStatus = await this.contracts.call(
      this.contracts.soloMargin.methods.getAccountStatus({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
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
    options?: CallOptions,
  ): Promise<Values> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getAccountValues({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    return {
      supply: new BigNumber(result[0].value),
      borrow: new BigNumber(result[1].value),
    };
  }

  public async getAdjustedAccountValues(
    accountOwner: address,
    accountNumber: Integer,
    options?: CallOptions,
  ): Promise<Values> {
    const result = await this.contracts.call(
      this.contracts.soloMargin.methods.getAdjustedAccountValues({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    return {
      supply: new BigNumber(result[0].value),
      borrow: new BigNumber(result[1].value),
    };
  }

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
    options?: CallOptions,
  ): Promise<Balance[]> {
    const balances = await this.contracts.call(
      this.contracts.soloMargin.methods.getAccountBalances({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    const tokens = balances[0];
    const pars = balances[1];
    const weis = balances[2];

    const result = [];
    for (let i = 0; i < tokens.length; i += 1) {
      result.push({
        tokenAddress: tokens[i],
        par: valueToInteger(pars[i]),
        wei: valueToInteger(weis[i]),
      });
    }
    return result;
  }

  public async isAccountLiquidatable(
    liquidOwner: address,
    liquidNumber: Integer,
    options: CallOptions = {},
  ): Promise<boolean> {
    const [
      accountStatus,
      marginRatio,
      accountValues,
    ] = await Promise.all([
      this.getAccountStatus(
        liquidOwner,
        liquidNumber,
      ),
      this.getMarginRatio(options),
      this.getAdjustedAccountValues(
        liquidOwner,
        liquidNumber,
        options,
      ),
    ]);

    // return true if account has been partially liquidated
    if (
      accountValues.borrow.gt(0) &&
      accountValues.supply.gt(0) &&
      accountStatus === AccountStatus.Liquidating
    ) {
      return true;
    }

    // return false if account is vaporizable
    if (accountValues.supply.isZero()) {
      return false;
    }

    // return true if account is undercollateralized
    const marginRequirement = accountValues.borrow.times(marginRatio);
    return accountValues.supply.lt(accountValues.borrow.plus(marginRequirement));
  }

  // ============ Getters for Permissions ============

  public async getIsLocalOperator(
    owner: address,
    operator: address,
    options?: CallOptions,
  ): Promise<boolean> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getIsLocalOperator(owner, operator),
      options,
    );
  }

  public async getIsGlobalOperator(
    operator: address,
    options?: CallOptions,
  ): Promise<boolean> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.getIsGlobalOperator(operator),
      options,
    );
  }

  // ============ Getters for Admin ============

  public async getAdmin(
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.contracts.soloMargin.methods.owner(),
      options,
    );
  }

  // ============ Getters for Expiry ============

  public async getExpiryAdmin(
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.contracts.expiry.methods.owner(),
      options,
    );
  }

  public async getExpiry(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.expiry.methods.getExpiry(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ),
      options,
    );
    return new BigNumber(result);
  }

  public async getExpiryPrices(
    heldMarketId: Integer,
    owedMarketId: Integer,
    expiryTimestamp: Integer,
    options?: CallOptions,
  ): Promise<{heldPrice: Integer, owedPrice: Integer}> {
    const result = await this.contracts.call(
      this.contracts.expiry.methods.getSpreadAdjustedPrices(
        heldMarketId.toFixed(0),
        owedMarketId.toFixed(0),
        expiryTimestamp.toFixed(0),
      ),
      options,
    );

    return {
      heldPrice: new BigNumber(result[0].value),
      owedPrice: new BigNumber(result[1].value),
    };
  }

  public async getExpiryRampTime(
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.expiry.methods.g_expiryRampTime(),
      options,
    );
    return new BigNumber(result);
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
}
