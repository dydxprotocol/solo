// noinspection JSUnusedGlobalSymbols

import { BigNumber } from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  stringToDecimal,
  valueToInteger,
} from '../lib/Helpers';
import {
  AccountStatus,
  address,
  Balance,
  ContractConstantCallOptions,
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
import DolomiteMarginMath from './DolomiteMarginMath';

export class Getters {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ Getters for Risk ============

  private static parseIndex(
    {
      borrow,
      supply,
      lastUpdate,
    }: {
      borrow: string;
      supply: string;
      lastUpdate: string;
    },
  ): Index {
    return {
      borrow: stringToDecimal(borrow),
      supply: stringToDecimal(supply),
      lastUpdate: new BigNumber(lastUpdate),
    };
  }

  private static parseTotalPar(
    {
      supply,
      borrow,
    }: {
      supply: string;
      borrow: string;
    },
  ): TotalPar {
    return {
      borrow: new BigNumber(borrow),
      supply: new BigNumber(supply),
    };
  }

  public async getMarginRatio(
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarginRatio(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getLiquidationSpread(
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getLiquidationSpread(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getEarningsRate(
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getEarningsRate(),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getMinBorrowedValue(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMinBorrowedValue(),
      options,
    );
    return new BigNumber(result.value);
  }

  // ============ Getters for Markets ============

  public async getRiskParams(
    options?: ContractConstantCallOptions,
  ): Promise<RiskParams> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getRiskParams(),
      options,
    );
    return {
      marginRatio: stringToDecimal(result[0].value),
      liquidationSpread: stringToDecimal(result[1].value),
      earningsRate: stringToDecimal(result[2].value),
      minBorrowedValue: new BigNumber(result[3].value),
      accountMaxNumberOfMarketsWithBalances: new BigNumber(result[4]),
    };
  }

  public async getRiskLimits(
    options?: ContractConstantCallOptions,
  ): Promise<RiskLimits> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getRiskLimits(),
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

  public async getAccountMaxNumberOfMarketsWithBalances(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountMaxNumberOfMarketsWithBalances(),
      options,
    );
    return new BigNumber(result);
  }

  public async getNumMarkets(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getNumMarkets(),
      options,
    );
    return new BigNumber(result);
  }

  public async getMarketTokenAddress(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketTokenAddress(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketIdByTokenAddress(
    token: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketIdByTokenAddress(token),
      options,
    );
    return new BigNumber(result);
  }

  public async getMarketTotalPar(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<TotalPar> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketTotalPar(marketId.toFixed(0)),
      options,
    );
    return {
      borrow: new BigNumber(result[0]),
      supply: new BigNumber(result[1]),
    };
  }

  public async getMarketCachedIndex(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Index> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketCachedIndex(
        marketId.toFixed(0),
      ),
      options,
    );
    return Getters.parseIndex(result);
  }

  public async getMarketCurrentIndex(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Index> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketCurrentIndex(
        marketId.toFixed(0),
      ),
      options,
    );
    return Getters.parseIndex(result);
  }

  public async getMarketPriceOracle(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketPriceOracle(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketInterestSetter(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketInterestSetter(
        marketId.toFixed(0),
      ),
      options,
    );
  }

  public async getMarketMarginPremium(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const marginPremium = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketMarginPremium(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(marginPremium.value);
  }

  public async getMarketSpreadPremium(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const spreadPremium = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketSpreadPremium(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(spreadPremium.value);
  }

  public async getMarketMaxWei(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const maxWei = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketMaxWei(
        marketId.toFixed(0),
      ),
      options,
    );
    return valueToInteger(maxWei);
  }

  public async getMarketIsClosing(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketIsClosing(marketId.toFixed(0)),
      options,
    );
  }

  public async getMarketIsRecyclable(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketIsRecyclable(marketId.toFixed(0)),
      options,
    );
  }

  public async getRecyclableMarkets(
    numberOfMarkets: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer[]> {
    const marketIds = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getRecyclableMarkets(numberOfMarkets.toFixed(0)),
      options,
    );
    return marketIds.map(marketId => new BigNumber(marketId));
  }

  public async getMarketPrice(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketPrice(marketId.toFixed(0)),
      options,
    );
    return new BigNumber(result.value);
  }

  public async getMarketUtilization(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const market = await this.getMarket(marketId, options);
    const totalSupply: Decimal = market.totalPar.supply.times(
      market.index.supply,
    );
    const totalBorrow: Decimal = market.totalPar.borrow.times(
      market.index.borrow,
    );
    return totalBorrow.div(totalSupply);
  }

  public async getMarketInterestRate(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketInterestRate(
        marketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(result.value);
  }

  public async getMarketSupplyInterestRate(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const [earningsRate, borrowInterestRate, utilization] = await Promise.all([
      this.getEarningsRate(options),
      this.getMarketInterestRate(marketId, options),
      this.getMarketUtilization(marketId, options),
    ]);
    return borrowInterestRate.times(earningsRate)
      .times(utilization);
  }

  public async getLiquidationSpreadForPair(
    heldMarketId: Integer,
    owedMarketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Decimal> {
    const spread = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getLiquidationSpreadForPair(
        heldMarketId.toFixed(0),
        owedMarketId.toFixed(0),
      ),
      options,
    );
    return stringToDecimal(spread.value);
  }

  public async getMarket(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Market> {
    const market = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarket(marketId.toFixed(0)),
      options,
    );
    return {
      ...market,
      totalPar: Getters.parseTotalPar(market.totalPar),
      index: Getters.parseIndex(market.index),
      marginPremium: stringToDecimal(market.marginPremium.value),
      spreadPremium: stringToDecimal(market.spreadPremium.value),
      maxWei: new BigNumber(market.maxWei.value),
    };
  }

  public async getMarketWithInfo(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<MarketWithInfo> {
    const marketWithInfo = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getMarketWithInfo(marketId.toFixed(0)),
      options,
    );
    const market = marketWithInfo[0];
    const currentIndex = marketWithInfo[1];
    const currentPrice = marketWithInfo[2];
    const currentInterestRate = marketWithInfo[3];

    return {
      market: {
        ...market,
        totalPar: Getters.parseTotalPar(market.totalPar),
        index: Getters.parseIndex(market.index),
        marginPremium: stringToDecimal(market.marginPremium.value),
        spreadPremium: stringToDecimal(market.spreadPremium.value),
        maxWei: new BigNumber(market.maxWei.value),
      },
      currentIndex: Getters.parseIndex(currentIndex),
      currentPrice: new BigNumber(currentPrice.value),
      currentInterestRate: stringToDecimal(currentInterestRate.value),
    };
  }

  // ============ Getters for Accounts ============

  public async getMarketTotalWei(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<{ borrow: Integer, supply: Integer }> {
    const { borrow, supply } = await this.getMarketTotalPar(marketId, options);
    const marketIndex = await this.getMarketCurrentIndex(marketId, options);

    return {
      borrow: DolomiteMarginMath.parToWei(borrow.negated(), marketIndex)
        .negated(),
      supply: DolomiteMarginMath.parToWei(supply, marketIndex),
    };
  }

  public async getNumExcessTokens(
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const numExcessTokens = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getNumExcessTokens(marketId.toFixed(0)),
      options,
    );
    return valueToInteger(numExcessTokens);
  }

  public async getAccountPar(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountPar(
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
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountWei(
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
    options?: ContractConstantCallOptions,
  ): Promise<AccountStatus> {
    const rawStatus = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountStatus({
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
        throw new Error(`invalid account status ${rawStatus}`);
    }
  }

  public async getAccountValues(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Values> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountValues({
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

  public async getAccountMarketsWithBalances(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer[]> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountMarketsWithBalances({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    return result.map(marketIdString => new BigNumber(marketIdString));
  }

  public async getAccountNumberOfMarketsWithBalances(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountNumberOfMarketsWithBalances({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    return new BigNumber(result);
  }

  public async getAccountNumberOfMarketsWithDebt(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountNumberOfMarketsWithDebt({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    return new BigNumber(result);
  }

  public async getAdjustedAccountValues(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Values> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAdjustedAccountValues({
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

  // ============ Getters for Permissions ============

  public async getAccountBalances(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Balance[]> {
    const balances = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getAccountBalances({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
      options,
    );
    const marketIds = balances[0];
    const tokens = balances[1];
    const pars = balances[2];
    const weis = balances[3];

    const result: Balance[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      result.push({
        marketId: new BigNumber(marketIds[i]),
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
    options: ContractConstantCallOptions = {},
  ): Promise<boolean> {
    const [accountStatus, marginRatio, accountValues] = await Promise.all([
      this.getAccountStatus(liquidOwner, liquidNumber),
      this.getMarginRatio(options),
      this.getAdjustedAccountValues(liquidOwner, liquidNumber, options),
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

  // ============ Getters for Admin ============

  public async getIsLocalOperator(
    owner: address,
    operator: address,
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getIsLocalOperator(owner, operator),
      options,
    );
  }

  // ============ Getters for Expiry ============

  public async getIsGlobalOperator(
    operator: address,
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getIsGlobalOperator(operator),
      options,
    );
  }

  public async getIsAutoTraderSpecial(
    autoTrader: address,
    options?: ContractConstantCallOptions,
  ): Promise<boolean> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.getIsAutoTraderSpecial(autoTrader),
      options,
    );
  }

  public async getAdmin(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteMargin.methods.owner(),
      options,
    );
  }

  public async getExpiryAdmin(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.owner(),
      options,
    );
  }

  public async getExpiry(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
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

  // ============ Helper Functions ============

  public async getExpiryPrices(
    heldMarketId: Integer,
    owedMarketId: Integer,
    expiryTimestamp: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<{ heldPrice: Integer; owedPrice: Integer }> {
    const result = await this.contracts.callConstantContractFunction(
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
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.g_expiryRampTime(),
      options,
    );
    return new BigNumber(result);
  }
}
