import { TransactionObject } from 'web3/eth/types';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
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
  AcctInfo,
  SetExpiry,
  Amount,
  Integer,
} from '../../types';
import { toBytes } from '../../lib/BytesHelper';

interface OptionalTransactionArgs {
  transactionType: number | string;
  primaryMarketId?: number | string;
  secondaryMarketId?: number | string;
  otherAddress?: string;
  otherAccountId?: number;
  data?: (string | number[])[];
  amount?: Amount;
}

export class AccountTransaction {
  private contracts: Contracts;
  private operations: TransactionArgs[];
  private committed: boolean;
  private options: ContractCallOptions;
  private orderMapper: OrderMapper;
  private accounts: AcctInfo[];

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
        amount: deposit.amount,
        otherAddress: deposit.from,
        primaryMarketId: deposit.marketId.toFixed(0),
      },
    );

    return this;
  }

  public withdraw(withdraw: Withdraw): AccountTransaction {
    this.addTransactionArgs(
      withdraw,
      {
        amount: withdraw.amount,
        transactionType: TransactionType.Withdraw,
        otherAddress: withdraw.to,
        primaryMarketId: withdraw.marketId.toFixed(0),
      },
    );

    return this;
  }

  public transfer(transfer: Transfer): AccountTransaction {
    this.addTransactionArgs(
      transfer,
      {
        transactionType: TransactionType.Transfer,
        amount: transfer.amount,
        primaryMarketId: transfer.marketId.toFixed(0),
        otherAddress: transfer.toAccountOwner,
        otherAccountId: this.getAccountId(transfer.toAccountOwner, transfer.toAccountId),
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
        amount: liquidate.amount,
        primaryMarketId: liquidate.liquidMarketId.toFixed(0),
        secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
        otherAddress: liquidate.liquidAccountOwner,
        otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
      },
    );

    return this;
  }

  public setExpiry(args: SetExpiry): AccountTransaction {
    this.addTransactionArgs(
      args,
      {
        transactionType: TransactionType.Call,
        otherAddress: this.contracts.expiry.options.address,
        data: [toBytes(args.marketId, args.expiryTime)],
      },
    );

    return this;
  }

  public liquidateExpiredAccount(liquidate: Liquidate): AccountTransaction {
    this.addTransactionArgs(
      liquidate,
      {
        transactionType: TransactionType.Trade,
        amount: liquidate.amount,
        primaryMarketId: liquidate.liquidMarketId.toFixed(0),
        secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
        otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
        otherAddress: this.contracts.expiry.options.address,
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
      console.log(this.accounts)
      console.log(this.operations)
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

    const [primaryMarketId, secondaryMarketId] =
      transactionType === TransactionType.Buy ?
      [exchange.makerMarketId, exchange.takerMarketId] :
      [exchange.takerMarketId, exchange.makerMarketId];

    this.addTransactionArgs(
      exchange,
      {
        transactionType,
        amount: exchange.amount,
        otherAddress: exchangeWrapperAddress,
        data: [bytes],
        primaryMarketId: primaryMarketId.toFixed(0),
        secondaryMarketId: secondaryMarketId.toFixed(0),
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

    const amount = args.amount ? {
      sign: !args.amount.value.isNegative(),
      denomination: args.amount.denomination,
      ref: args.amount.reference,
      value: args.amount.value.abs().toFixed(0),
    } : {
      sign: false,
      denomination: 0,
      ref: 0,
      value: 0,
    };

    const transactionArgs: TransactionArgs = {
      amount,
      accountId: this.getPrimaryAccountId(operation),
      transactionType: args.transactionType,
      primaryMarketId: args.primaryMarketId || '',
      secondaryMarketId: args.secondaryMarketId || '',
      otherAddress: args.otherAddress || '',
      otherAccountId: args.otherAccountId || '',
      data: args.data || [],
    };

    this.operations.push(transactionArgs);
  }

  private getPrimaryAccountId(operation: AccountOperation): number {
    return this.getAccountId(operation.primaryAccountOwner, operation.primaryAccountId);
  }

  private getAccountId(accountOwner: string, accountNumber: Integer): number {
    const accountInfo: AcctInfo = {
      owner: accountOwner,
      number: accountNumber.toFixed(0),
    };

    const index = this.accounts.indexOf(accountInfo);

    if (index >= 0) {
      return index;
    }

    this.accounts.push(accountInfo);

    return this.accounts.length - 1;
  }
}
