import BN from 'bn.js';
import { TransactionObject } from 'web3/eth/types';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../lib/Contracts';
import {
  AccountOperation,
  Deposit,
  TransactionType,
  TransactionArgs,
  AmountIntention,
  ContractCallOptions,
  TxResult,
  Exchange,
  Withdraw,
  Liquidate,
} from '../types';

export class AccountTransaction {
  private contracts: Contracts;
  private operations: TransactionArgs[];
  private trader: string;
  private account: BN;
  private committed: boolean;
  private options: ContractCallOptions;
  private orderMapper: OrderMapper;

  constructor(
    contracts: Contracts,
    trader: string,
    account: BN,
    options: ContractCallOptions,
    orderMapper: OrderMapper,
  ) {
    this.contracts = contracts;
    this.operations = [];
    this.trader = trader;
    this.account = account;
    this.committed = false;
    this.options = options;
    this.orderMapper = orderMapper;
  }

  public deposit(deposit: Deposit): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    const transactionArgs: TransactionArgs = this.newTransactionArgs(deposit);

    transactionArgs.amount.intent = AmountIntention.Deposit;
    transactionArgs.transactionType = TransactionType.Deposit;
    transactionArgs.depositAssetId = deposit.asset;

    this.operations.push(transactionArgs);

    return this;
  }

  public withdraw(withdraw: Withdraw): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    const transactionArgs: TransactionArgs = this.newTransactionArgs(withdraw);

    transactionArgs.amount.intent = AmountIntention.Withdraw;
    transactionArgs.transactionType = TransactionType.Withdraw;
    transactionArgs.withdrawAssetId = withdraw.asset;

    this.operations.push(transactionArgs);

    return this;
  }

  public exchange(exchange: Exchange): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    const transactionArgs: TransactionArgs = this.newTransactionArgs(exchange);
    const {
      bytes,
      exchangeWrapperAddress,
    }: {
      bytes: number[],
      exchangeWrapperAddress: string,
    } = this.orderMapper.mapOrder(exchange.order);

    transactionArgs.transactionType = TransactionType.Exchange;
    transactionArgs.depositAssetId = exchange.depositAsset;
    transactionArgs.withdrawAssetId = exchange.withdrawAsset;
    transactionArgs.exchangeWrapperOrLiquidTrader = exchangeWrapperAddress;
    transactionArgs.orderData = [bytes];

    this.operations.push(transactionArgs);

    return this;
  }

  public liquidate(liquidate: Liquidate): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    const transactionArgs: TransactionArgs = this.newTransactionArgs(liquidate);

    transactionArgs.transactionType = TransactionType.Liquidate;
    transactionArgs.withdrawAssetId = liquidate.withdrawAsset;
    transactionArgs.depositAssetId = liquidate.depositAsset;
    transactionArgs.exchangeWrapperOrLiquidTrader = liquidate.liquidTrader;
    transactionArgs.liquidAccount = liquidate.liquidAccount.toString(10);

    this.operations.push(transactionArgs);

    return this;
  }

  public async commit(): Promise<TxResult> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    this.committed = true;

    try {
      const method: TransactionObject<void> = this.contracts.soloMargin.methods.transact(
        this.trader,
        this.account.toString(),
        this.operations,
      );

      return this.contracts.callContractFunction(
        method,
        this.options,
      );
    } catch (error) {
      this.committed = false;
      throw error;
    }
  }

  private newTransactionArgs(operation: AccountOperation): TransactionArgs {
    const amount = {
      sign: !operation.amount.value.isNeg(),
      intent: operation.amount.intent,
      denom: operation.amount.denomination,
      ref: operation.amount.reference,
      value: operation.amount.value.toString(10),
    };
    const transactionArgs: TransactionArgs = {
      amount,
      transactionType: null,
      depositAssetId: '',
      withdrawAssetId: '',
      exchangeWrapperOrLiquidTrader: '',
      liquidAccount: '',
      orderData: [],
    };

    return transactionArgs;
  }
}
