import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';

export class TransferProxy {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async dolomiteMargin(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.transferProxy.methods.DOLOMITE_MARGIN(),
    );
  }

  // ============ Write Functions ============

  public async transfer(
    fromAccountIndex: Integer,
    to: address,
    toAccountIndex: Integer,
    token: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.transferProxy.methods.transfer(
        fromAccountIndex.toFixed(),
        to,
        toAccountIndex.toFixed(),
        token,
        amount.toFixed(),
      ),
      options,
    );
  }

  public async transferMultiple(
    fromAccountIndex: Integer,
    to: address,
    toAccountIndex: Integer,
    tokens: address[],
    amounts: Integer[],
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.transferProxy.methods.transferMultiple(
        fromAccountIndex.toFixed(),
        to,
        toAccountIndex.toFixed(),
        tokens,
        amounts.map(amount => amount.toFixed()),
      ),
      options,
    );
  }

  public async transferMultipleWithMarkets(
    fromAccountIndex: Integer,
    to: address,
    toAccountIndex: Integer,
    markets: Integer[],
    amounts: Integer[],
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.transferProxy.methods.transferMultipleWithMarkets(
        fromAccountIndex.toFixed(),
        to,
        toAccountIndex.toFixed(),
        markets.map(market => market.toFixed()),
        amounts.map(amount => amount.toFixed()),
      ),
      options,
    );
  }

}
