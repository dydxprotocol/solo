import { TransactionObject } from 'web3/eth/types';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { Contracts } from '../../lib/Contracts';
import {
  AccountAction,
  Deposit,
  Withdraw,
  ActionType,
  ActionArgs,
  ContractCallOptions,
  TxResult,
  Buy,
  Sell,
  Exchange,
  Transfer,
  Trade,
  Liquidate,
  Vaporize,
  AccountInfo,
  SetExpiry,
  Call,
  Amount,
  Integer,
  AccountOperationOptions,
} from '../../types';
import { toBytes } from '../../lib/BytesHelper';
import { ADDRESSES } from '../../lib/Constants';

interface OptionalActionArgs {
  actionType: number | string;
  primaryMarketId?: number | string;
  secondaryMarketId?: number | string;
  otherAddress?: string;
  otherAccountId?: number;
  data?: (string | number[])[];
  amount?: Amount;
}

export class AccountOperation {
  private contracts: Contracts;
  private actions: ActionArgs[];
  private committed: boolean;
  private orderMapper: OrderMapper;
  private accounts: AccountInfo[];
  private usePayableProxy: boolean;

  constructor(
    contracts: Contracts,
    orderMapper: OrderMapper,
    options: AccountOperationOptions = {},
  ) {
    this.contracts = contracts;
    this.actions = [];
    this.committed = false;
    this.orderMapper = orderMapper;
    this.accounts = [];
    this.usePayableProxy = options.usePayableProxy;
  }

  public deposit(deposit: Deposit): AccountOperation {
    this.addActionArgs(
      deposit,
      {
        actionType: ActionType.Deposit,
        amount: deposit.amount,
        otherAddress: deposit.from,
        primaryMarketId: deposit.marketId.toFixed(0),
      },
    );

    return this;
  }

  public withdraw(withdraw: Withdraw): AccountOperation {
    this.addActionArgs(
      withdraw,
      {
        amount: withdraw.amount,
        actionType: ActionType.Withdraw,
        otherAddress: withdraw.to,
        primaryMarketId: withdraw.marketId.toFixed(0),
      },
    );

    return this;
  }

  public transfer(transfer: Transfer): AccountOperation {
    this.addActionArgs(
      transfer,
      {
        actionType: ActionType.Transfer,
        amount: transfer.amount,
        primaryMarketId: transfer.marketId.toFixed(0),
        otherAccountId: this.getAccountId(transfer.toAccountOwner, transfer.toAccountId),
      },
    );

    return this;
  }

  public buy(buy: Buy): AccountOperation {
    return this.exchange(buy, ActionType.Buy);
  }

  public sell(sell: Sell): AccountOperation {
    return this.exchange(sell, ActionType.Sell);
  }

  public liquidate(liquidate: Liquidate): AccountOperation {
    this.addActionArgs(
      liquidate,
      {
        actionType: ActionType.Liquidate,
        amount: liquidate.amount,
        primaryMarketId: liquidate.liquidMarketId.toFixed(0),
        secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
        otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
      },
    );

    return this;
  }

  public vaporize(vaporize: Vaporize): AccountOperation {
    this.addActionArgs(
      vaporize,
      {
        actionType: ActionType.Vaporize,
        amount: vaporize.amount,
        primaryMarketId: vaporize.vaporMarketId.toFixed(0),
        secondaryMarketId: vaporize.payoutMarketId.toFixed(0),
        otherAccountId: this.getAccountId(vaporize.vaporAccountOwner, vaporize.vaporAccountId),
      },
    );

    return this;
  }

  public setExpiry(args: SetExpiry): AccountOperation {
    this.addActionArgs(
      args,
      {
        actionType: ActionType.Call,
        otherAddress: this.contracts.expiry.options.address,
        data: toBytes(args.marketId, args.expiryTime),
      },
    );

    return this;
  }

  public call(args: Call): AccountOperation {
    this.addActionArgs(
      args,
      {
        actionType: ActionType.Call,
        otherAddress: args.callee,
        data: args.data,
      },
    );

    return this;
  }

  public trade(trade: Trade): AccountOperation {
    this.addActionArgs(
      trade,
      {
        actionType: ActionType.Trade,
        amount: trade.amount,
        primaryMarketId: trade.inputMarketId.toFixed(0),
        secondaryMarketId: trade.outputMarketId.toFixed(0),
        otherAccountId: this.getAccountId(trade.otherAccountOwner, trade.otherAccountId),
        otherAddress: trade.autoTrader,
        data: trade.data,
      },
    );

    return this;
  }

  public liquidateExpiredAccount(liquidate: Liquidate): AccountOperation {
    this.addActionArgs(
      liquidate,
      {
        actionType: ActionType.Trade,
        amount: liquidate.amount,
        primaryMarketId: liquidate.liquidMarketId.toFixed(0),
        secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
        otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
        otherAddress: this.contracts.expiry.options.address,
      },
    );

    return this;
  }

  public async commit(
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    if (this.committed) {
      throw new Error('Operation already committed');
    }
    if (this.actions.length === 0) {
      throw new Error('No actions have been added to operation');
    }

    this.committed = true;

    try {
      let method: TransactionObject<void>;

      if (!this.usePayableProxy) {
        method = this.contracts.soloMargin.methods.operate(
          this.accounts,
          this.actions,
        );
      } else {
        method = this.contracts.payableProxy.methods.operate(
          this.accounts,
          this.actions,
        );
      }

      return this.contracts.callContractFunction(
        method,
        options,
      );
    } catch (error) {
      this.committed = false;
      throw error;
    }
  }

  private exchange(exchange: Exchange, actionType: ActionType): AccountOperation {
    const {
      bytes,
      exchangeWrapperAddress,
    }: {
      bytes: number[],
      exchangeWrapperAddress: string,
    } = this.orderMapper.mapOrder(exchange.order);

    const [primaryMarketId, secondaryMarketId] =
      actionType === ActionType.Buy ?
      [exchange.makerMarketId, exchange.takerMarketId] :
      [exchange.takerMarketId, exchange.makerMarketId];

    const orderData = bytes.map((a :number): number[] => [a]);

    this.addActionArgs(
      exchange,
      {
        actionType,
        amount: exchange.amount,
        otherAddress: exchangeWrapperAddress,
        data: orderData,
        primaryMarketId: primaryMarketId.toFixed(0),
        secondaryMarketId: secondaryMarketId.toFixed(0),
      },
    );

    return this;
  }

  private addActionArgs(
    action: AccountAction,
    args: OptionalActionArgs,
  ): void {
    if (this.committed) {
      throw new Error('Operation already committed');
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

    const actionArgs: ActionArgs = {
      amount,
      accountId: this.getPrimaryAccountId(action),
      actionType: args.actionType,
      primaryMarketId: args.primaryMarketId || '0',
      secondaryMarketId: args.secondaryMarketId || '0',
      otherAddress: args.otherAddress || ADDRESSES.ZERO,
      otherAccountId: args.otherAccountId || '0',
      data: args.data || [],
    };

    this.actions.push(actionArgs);
  }

  private getPrimaryAccountId(operation: AccountAction): number {
    return this.getAccountId(operation.primaryAccountOwner, operation.primaryAccountId);
  }

  private getAccountId(accountOwner: string, accountNumber: Integer): number {
    const accountInfo: AccountInfo = {
      owner: accountOwner,
      number: accountNumber.toFixed(0),
    };

    const correctIndex = (i: AccountInfo) =>
      (i.owner === accountInfo.owner && i.number === accountInfo.number);
    const index = this.accounts.findIndex(correctIndex);

    if (index >= 0) {
      return index;
    }

    this.accounts.push(accountInfo);

    return this.accounts.length - 1;
  }
}
