import BigNumber from 'bignumber.js';
import { TransactionObject } from 'web3/eth/types';
import { OrderMapper } from '@dydxprotocol/exchange-wrappers';
import { LimitOrders } from '../LimitOrders';
import { Contracts } from '../../lib/Contracts';
import {
  AmountReference,
  AmountDenomination,
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
  CallApproveLimitOrder,
  CallCancelLimitOrder,
  Call,
  Amount,
  Integer,
  AccountOperationOptions,
  ConfirmationType,
  address,
  LimitOrder,
} from '../../types';
import { toBytes, hexStringToBytes } from '../../lib/BytesHelper';
import { ADDRESSES, INTEGERS } from '../../lib/Constants';
import expiryConstants from '../../lib/expiry-constants.json';

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
  private limitOrders: LimitOrders;
  private accounts: AccountInfo[];
  private usePayableProxy: boolean;
  private sendEthTo: address;
  private networkId: number;

  constructor(
    contracts: Contracts,
    orderMapper: OrderMapper,
    limitOrders: LimitOrders,
    networkId: number,
    options: AccountOperationOptions = {},
  ) {
    this.contracts = contracts;
    this.actions = [];
    this.committed = false;
    this.orderMapper = orderMapper;
    this.limitOrders = limitOrders;
    this.accounts = [];
    this.usePayableProxy = options.usePayableProxy;
    this.sendEthTo = options.sendEthTo;
    this.networkId = networkId;
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

  public approveLimitOrder(args: CallApproveLimitOrder): AccountOperation {
    const APPROVE_LIMIT_ORDER = new BigNumber(0);
    this.addActionArgs(
      args,
      {
        actionType: ActionType.Call,
        otherAddress: this.contracts.limitOrders.options.address,
        data: toBytes(
          APPROVE_LIMIT_ORDER,
          this.limitOrders.getOrderHash(args.order),
        ),
      },
    );
    return this;
  }

  public cancelLimitOrder(args: CallCancelLimitOrder): AccountOperation {
    const CANCEL_LIMIT_ORDER = new BigNumber(1);
    this.addActionArgs(
      args,
      {
        actionType: ActionType.Call,
        otherAddress: this.contracts.limitOrders.options.address,
        data: toBytes(
          CANCEL_LIMIT_ORDER,
          this.limitOrders.getOrderHash(args.order),
        ),
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

  public takeLimitOrder(
    primaryAccountOwner: address,
    primaryAccountNumber: Integer,
    order: LimitOrder,
    weiAmount: Integer,
    denotedInMakerAmount: boolean = false,
  ): AccountOperation {
    const amount = weiAmount.abs().times(denotedInMakerAmount ? -1 : 1);
    return this.trade({
      primaryAccountOwner,
      primaryAccountId: primaryAccountNumber,
      autoTrader: this.contracts.limitOrders.options.address,
      inputMarketId: denotedInMakerAmount ? order.makerMarket : order.takerMarket,
      outputMarketId: denotedInMakerAmount ? order.takerMarket : order.makerMarket,
      otherAccountOwner: order.makerAccountOwner,
      otherAccountId: order.makerAccountNumber,
      amount: {
        denomination: AmountDenomination.Wei,
        reference: AmountReference.Delta,
        value: amount,
      },
      data: hexStringToBytes(this.limitOrders.orderToBytes(order)),
    });
  }

  public liquidateExpiredAccount(liquidate: Liquidate, minExpiry?: Integer): AccountOperation {
    const maxExpiryTimestamp = minExpiry || INTEGERS.ONES_31;
    this.addActionArgs(
      liquidate,
      {
        actionType: ActionType.Trade,
        amount: liquidate.amount,
        primaryMarketId: liquidate.liquidMarketId.toFixed(0),
        secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
        otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
        otherAddress: this.contracts.expiry.options.address,
        data: toBytes(liquidate.liquidMarketId, maxExpiryTimestamp),
      },
    );
    return this;
  }

  public fullyLiquidateExpiredAccount(
    primaryAccountOwner: address,
    primaryAccountNumber: Integer,
    expiredAccountOwner: address,
    expiredAccountNumber: Integer,
    expiredMarket: Integer,
    expiryTimestamp: Integer,
    blockTimestamp: Integer,
    weis: Integer[],
    prices: Integer[],
    spreadPremiums: Integer[],
    collateralPreferences: Integer[],
  ): AccountOperation {
    // hardcoded values
    const networkExpiryConstants = expiryConstants[this.networkId];
    const defaultSpread = new BigNumber(networkExpiryConstants.spread);
    const expiryRampTime = new BigNumber(networkExpiryConstants.expiryRampTime);

    // get info about the expired market
    let owedWei = weis[expiredMarket.toNumber()];
    const owedPrice = prices[expiredMarket.toNumber()];
    const owedSpreadMult = spreadPremiums[expiredMarket.toNumber()].plus(1);

    // error checking
    if (owedWei.gte(0)) {
      throw new Error('Expired account must have negative expired balance');
    }
    if (blockTimestamp.lt(expiryTimestamp)) {
      throw new Error('Expiry timestamp must be larger than blockTimestamp');
    }

    // loop through each collateral type as long as there is some borrow amount left
    for (let i = 0; i < collateralPreferences.length && owedWei.lt(0); i += 1) {
      // get info about the next collateral market
      const heldMarket = collateralPreferences[i];
      const heldWei = weis[heldMarket.toNumber()];
      const heldPrice = prices[heldMarket.toNumber()];
      const heldSpreadMult = spreadPremiums[heldMarket.toNumber()].plus(1);

      // skip this collateral market if the account is not positive in this market
      if (heldWei.lte(0)) {
        continue;
      }

      // get the relative value of each market
      const rampAdjustment = BigNumber.min(
        blockTimestamp.minus(expiryTimestamp).div(expiryRampTime),
        INTEGERS.ONE,
      );
      const spread = defaultSpread.times(heldSpreadMult).times(owedSpreadMult).plus(1);
      const heldValue = heldWei.times(heldPrice).abs();
      const owedValue = owedWei.times(owedPrice).times(rampAdjustment).times(spread).abs();

      // add variables that need to be populated
      let primaryMarketId: Integer;
      let secondaryMarketId: Integer;

      // set remaining owedWei and the marketIds depending on which market will 'bound' the action
      if (heldValue.gt(owedValue)) {
        // we expect no remaining owedWei
        owedWei = INTEGERS.ZERO;

        primaryMarketId = expiredMarket;
        secondaryMarketId = heldMarket;
      } else {
        // calculate the expected remaining owedWei
        owedWei = owedValue.minus(heldValue).div(owedValue).times(owedWei);

        primaryMarketId = heldMarket;
        secondaryMarketId = expiredMarket;
      }

      // add the action to the current actions
      this.addActionArgs(
        {
          primaryAccountOwner,
          primaryAccountId: primaryAccountNumber,
        },
        {
          actionType: ActionType.Trade,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
          primaryMarketId: primaryMarketId.toFixed(0),
          secondaryMarketId: secondaryMarketId.toFixed(0),
          otherAccountId: this.getAccountId(
            expiredAccountOwner,
            expiredAccountNumber,
          ),
          otherAddress: this.contracts.expiry.options.address,
          data: toBytes(expiredMarket, expiryTimestamp),
        },
      );
    }

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

    if (options && options.confirmationType !== ConfirmationType.Simulate) {
      this.committed = true;
    }

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
          this.sendEthTo || (options && options.from) || this.contracts.payableProxy.options.from,
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
