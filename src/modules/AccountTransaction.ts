import { TransactionObject } from 'web3/eth/types';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../lib/Contracts';
import {
  AccountOperation,
  Deposit,
  Withdraw,
  TransactionType,
  TransactionArgs,
  ContractCallOptions,
  TxResult,
  Buy,
  Sell,
  Exchange,
  Transfer,
  Liquidate,
  AccountInfo,
} from '../types';

interface OptionalTransactionArgs {
  transactionType: number | string;
  primaryMarketId?: number | string;
  secondaryMarketId?: number | string;
  otherAddress?: string;
  otherAccountId?: number | string;
  orderData?: (string | number[])[];
  intent?: number | string;
}

export class AccountTransaction {
  private contracts: Contracts;
  private operations: TransactionArgs[];
  private committed: boolean;
  private options: ContractCallOptions;
  private orderMapper: OrderMapper;
  private accounts: AccountInfo[];

  constructor(
    contracts: Contracts,
    options: ContractCallOptions,
    orderMapper: OrderMapper,
  ) {
    this.contracts = contracts;
    this.operations = [];
    this.committed = false;
    this.options = options;
    this.orderMapper = orderMapper;
    this.accounts = [];
  }

  public deposit(deposit: Deposit): AccountTransaction {
    this.addTransactionArgs(
      deposit,
      {
        transactionType: TransactionType.Deposit,
        otherAddress: deposit.from,
        primaryMarketId: deposit.marketId.toString(),
      },
    );

    return this;
  }

  public withdraw(withdraw: Withdraw): AccountTransaction {
    this.addTransactionArgs(
      withdraw,
      {
        transactionType: TransactionType.Withdraw,
        otherAddress: withdraw.to,
        primaryMarketId: withdraw.marketId.toString(),
      },
    );

    return this;
  }

  public transfer(transfer: Transfer): AccountTransaction {
    this.addTransactionArgs(
      transfer,
      {
        transactionType: TransactionType.Transfer,
        primaryMarketId: transfer.marketId.toString(),
        otherAddress: transfer.toAccountOwner,
        otherAccountId: transfer.toAccountId.toString(),
      },
    );

    return this;
  }

  public buy(buy: Buy): AccountTransaction {
    return this.exchange(buy, TransactionType.Buy);
  }

  public sell(sell: Sell): AccountTransaction {
    return this.exchange(sell, TransactionType.Sell);
  }

  public liquidate(liquidate: Liquidate): AccountTransaction {
    this.addTransactionArgs(
      liquidate,
      {
        transactionType: TransactionType.Liquidate,
        primaryMarketId: liquidate.liquidMarketId.toString(),
        secondaryMarketId: liquidate.payoutMarketId.toString(),
        otherAddress: liquidate.liquidAccountOwner,
        otherAccountId: liquidate.liquidAccountId.toString(),
      },
    );

    return this;
  }

  public async commit(): Promise<TxResult> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.operations.length === 0) {
      throw new Error('No operations have been added to transaction');
    }

    this.committed = true;

    try {
      const method: TransactionObject<void> = this.contracts.soloMargin.methods.transact(
        this.accounts,
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

  private exchange(exchange: Exchange, transactionType: TransactionType): AccountTransaction {
    const {
      bytes,
      exchangeWrapperAddress,
    }: {
      bytes: number[],
      exchangeWrapperAddress: string,
    } = this.orderMapper.mapOrder(exchange.order);

    this.addTransactionArgs(
      exchange,
      {
        transactionType,
        otherAddress: exchangeWrapperAddress,
        orderData: [bytes],
         // TODO are these right? idk how contracts implemented
        primaryMarketId: exchange.takerMarketId.toString(),
        secondaryMarketId: exchange.makerMarketId.toString(),
      },
    );

    return this;
  }

  private addTransactionArgs(
    operation: AccountOperation,
    args: OptionalTransactionArgs,
  ): void {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    const amount = {
      sign: !operation.amount.value.isNeg(),
      denomination: operation.amount.denomination,
      refPoint: operation.amount.reference,
      value: operation.amount.value.abs().toString(10),
    };
    const a = { // TODO remove when contracts updated
      ...amount,
      intent: 0,
    };
    const transactionArgs: TransactionArgs = {
      amount: a,
      accountId: this.getAccountId(operation),
      transactionType: args.transactionType,
      primaryMarketId: args.primaryMarketId || '', // TODO change when contracts updated
      secondaryMarketId: args.secondaryMarketId || '',
      otherAddress: args.otherAddress || '',
      otherAccountId: args.otherAccountId || '',
      orderData: args.orderData || [],
    };

    this.operations.push(transactionArgs);
  }

  private getAccountId(operation: AccountOperation): number {
    const accountInfo: AccountInfo = {
      owner: operation.primaryAccountOwner,
      account: operation.primaryAccountId.toString(),
    };

    const index = this.accounts.indexOf(accountInfo);

    if (index >= 0) {
      return index;
    }

    this.accounts.push(accountInfo);

    return this.accounts.length - 1;
  }
}
