import BN from 'bn.js';
import { TransactionObject } from 'web3/eth/types';
import { Contracts } from '../lib/Contracts';
import {
  AccountOperation,
  Deposit,
  Withdrawal,
  TransactionType,
  TransactionArgs,
  AmountIntention,
  ContractCallOptions,
  TxResult,
} from '../types';

export class AccountTransaction {
  private contracts: Contracts;
  private operations: TransactionArgs[];
  private trader: string;
  private account: BN;
  private committed: boolean;
  private options: ContractCallOptions;

  constructor(
    contracts: Contracts,
    trader: string,
    account: BN,
    options: ContractCallOptions,
  ) {
    this.contracts = contracts;
    this.operations = [];
    this.trader = trader;
    this.account = account;
    this.committed = false;
    this.options = options;
  }

  public deposit(deposit: Deposit): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    this.operations.push(
      this.operationsToTransactionArgs(
        deposit,
        TransactionType.Deposit,
      ),
    );

    return this;
  }

  public withdraw(withdrawal: Withdrawal): AccountTransaction {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    this.operations.push(
      this.operationsToTransactionArgs(
        withdrawal,
        TransactionType.Withdraw,
      ),
    );

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

  private operationsToTransactionArgs(
    operation: AccountOperation,
    transactionType: TransactionType,
  ): TransactionArgs {
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

    switch (transactionType) {
      case TransactionType.Deposit:
        transactionArgs.amount.intent = AmountIntention.Deposit;
        transactionArgs.transactionType = TransactionType.Deposit;
        transactionArgs.depositAssetId = operation.asset;
        break;

      case TransactionType.Withdraw:
        transactionArgs.amount.intent = AmountIntention.Withdraw;
        transactionArgs.transactionType = TransactionType.Withdraw;
        transactionArgs.withdrawAssetId = operation.asset;
        break;

      default:
        throw new Error(`Unknown transaction type ${transactionType}`);
    }

    return transactionArgs;
  }
}
