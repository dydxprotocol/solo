import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Decimal,
  Integer,
  TxResult,
} from '../types';
import { decimalToString } from '../lib/Helpers';

export class Admin {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ Token Functions ============

  public async withdrawExcessTokens(
    marketId: Integer,
    recipient: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerWithdrawExcessTokens(
        marketId.toFixed(0),
        recipient,
      ),
      options,
    );
  }

  public async withdrawUnsupportedTokens(
    token: address,
    recipient: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerWithdrawUnsupportedTokens(
        token,
        recipient,
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
    isClosing: boolean,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerAddMarket(
        token,
        priceOracle,
        interestSetter,
        { value: decimalToString(marginPremium) },
        { value: decimalToString(spreadPremium) },
        isClosing,
      ),
      options,
    );
  }

  public async setIsClosing(
    marketId: Integer,
    isClosing: boolean,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetIsClosing(
        marketId.toFixed(0),
        isClosing,
      ),
      options,
    );
  }

  public async setMarginPremium(
    marketId: Integer,
    marginPremium: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetMarginPremium(
        marketId.toFixed(0),
        { value: decimalToString(marginPremium) },
      ),
      options,
    );
  }

  public async setSpreadPremium(
    marketId: Integer,
    spreadPremium: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetSpreadPremium(
        marketId.toFixed(0),
        { value: decimalToString(spreadPremium) },
      ),
      options,
    );
  }

  public async setPriceOracle(
    marketId: Integer,
    oracle: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetPriceOracle(
        marketId.toFixed(0),
        oracle,
      ),
      options,
    );
  }

  public async setInterestSetter(
    marketId: Integer,
    interestSetter: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetInterestSetter(
        marketId.toFixed(0),
        interestSetter,
      ),
      options,
    );
  }

  // ============ Risk Functions ============

  public async setMarginRatio(
    ratio: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetMarginRatio(
        { value: decimalToString(ratio) },
      ),
      options,
    );
  }

  public async setLiquidationSpread(
    spread: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetLiquidationSpread(
        { value: decimalToString(spread) },
      ),
      options,
    );
  }

  public async setEarningsRate(
    rate: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetEarningsRate(
        { value: decimalToString(rate) },
      ),
      options,
    );
  }

  public async setMinBorrowedValue(
    minBorrowedValue: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerSetMinBorrowedValue(
        { value: minBorrowedValue.toFixed(0) },
      ),
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
      this.contracts.soloMargin.methods.ownerSetGlobalOperator(
        operator,
        approved,
      ),
      options,
    );
  }

  // ============ Expiry Functions ============

  public async setExpiryRampTime(
    newExpiryRampTime: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.expiry.methods.ownerSetExpiryRampTime(newExpiryRampTime.toFixed(0)),
      options,
    );
  }
}
