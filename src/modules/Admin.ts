import { Contracts } from '../lib/Contracts';
import { decimalToString } from '../lib/Helpers';
import { address, ContractCallOptions, Decimal, Integer, TxResult } from '../types';

export class Admin {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ Token Functions ============

  public async withdrawExcessTokens(
    marketId: Integer,
    recipient: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerWithdrawExcessTokens(marketId.toFixed(0), recipient),
      options,
    );
  }

  public async withdrawUnsupportedTokens(
    token: address,
    recipient: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerWithdrawUnsupportedTokens(token, recipient),
      options,
    );
  }

  public async setAccountMaxNumberOfMarketsWithBalances(
    accountMaxNumberOfMarketsWithBalances: number,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetAccountMaxNumberOfMarketsWithBalances(
        accountMaxNumberOfMarketsWithBalances,
      ),
      options,
    );
  }

  // ============ Market Functions ============

  public async addMarket(
    token: address,
    priceOracle: address,
    interestSetter: address,
    marginPremium: Decimal,
    spreadPremium: Decimal,
    maxWei: Integer,
    isClosing: boolean,
    isRecyclable: boolean,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    if (options) {
      options.gas = '1000000';
    }
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerAddMarket(
        token,
        priceOracle,
        interestSetter,
        { value: decimalToString(marginPremium) },
        { value: decimalToString(spreadPremium) },
        maxWei.toFixed(0),
        isClosing,
        isRecyclable,
      ),
      options,
    );
  }

  public async removeMarkets(
    marketIds: Integer[],
    salvager: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    if (options) {
      options.gas = '1000000';
    }
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerRemoveMarkets(
        marketIds.map(marketId => marketId.toFixed(0)),
        salvager,
      ),
      options,
    );
  }

  public async setIsClosing(marketId: Integer, isClosing: boolean, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetIsClosing(marketId.toFixed(0), isClosing),
      options,
    );
  }

  public async setMarginPremium(
    marketId: Integer,
    marginPremium: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetMarginPremium(marketId.toFixed(0), {
        value: decimalToString(marginPremium),
      }),
      options,
    );
  }

  public async setSpreadPremium(
    marketId: Integer,
    spreadPremium: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetSpreadPremium(marketId.toFixed(0), {
        value: decimalToString(spreadPremium),
      }),
      options,
    );
  }

  public async setMaxWei(
    marketId: Integer,
    maxWei: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetMaxWei(marketId.toFixed(0), maxWei.toFixed(0)),
      options,
    );
  }

  public async setPriceOracle(marketId: Integer, oracle: address, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetPriceOracle(marketId.toFixed(0), oracle),
      options,
    );
  }

  public async setInterestSetter(
    marketId: Integer,
    interestSetter: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetInterestSetter(marketId.toFixed(0), interestSetter),
      options,
    );
  }

  // ============ Risk Functions ============

  public async setMarginRatio(ratio: Decimal, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetMarginRatio({
        value: decimalToString(ratio),
      }),
      options,
    );
  }

  public async setLiquidationSpread(spread: Decimal, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetLiquidationSpread({
        value: decimalToString(spread),
      }),
      options,
    );
  }

  public async setEarningsRate(rate: Decimal, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetEarningsRate({
        value: decimalToString(rate),
      }),
      options,
    );
  }

  public async setMinBorrowedValue(minBorrowedValue: Integer, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetMinBorrowedValue({
        value: minBorrowedValue.toFixed(0),
      }),
      options,
    );
  }

  // ============ Global Operator Functions ============

  public async setGlobalOperator(
    operator: address,
    approved: boolean,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetGlobalOperator(operator, approved),
      options,
    );
  }

  public async setAutoTraderIsSpecial(
    autoTrader: address,
    isSpecial: boolean,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteMargin.methods.ownerSetAutoTraderSpecial(autoTrader, isSpecial),
      options,
    );
  }

  // ============ Expiry Functions ============

  public async setExpiryRampTime(newExpiryRampTime: Integer, options?: ContractCallOptions): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.expiry.methods.ownerSetExpiryRampTime(newExpiryRampTime.toFixed(0)),
      options,
    );
  }
}
