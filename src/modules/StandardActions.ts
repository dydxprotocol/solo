import { BigNumber } from 'bignumber.js';
import { Operation } from './operate/Operation';
import { Contracts } from '../lib/Contracts';
import {
  TxResult,
  MarketId,
  address,
  AmountReference,
  AmountDenomination,
  SendOptions,
  ProxyType,
} from '../types';

export class StandardActions {
  private operation: Operation;
  private contracts: Contracts;

  constructor(
    operation: Operation,
    contracts: Contracts,
  ) {
    this.operation = operation;
    this.contracts = contracts;
  }

  public async deposit({
    accountOwner,
    marketId,
    amount,
    accountNumber = new BigNumber(0),
    options,
  }: {
    accountOwner: address,
    marketId: BigNumber | string,
    amount: BigNumber | string,
    accountNumber: BigNumber | string,
    options?: SendOptions,
  }): Promise<TxResult> {
    const isEth = new BigNumber(marketId).eq(MarketId.ETH);
    const operation = this.operation.initiate({
      proxy: isEth ? ProxyType.Payable : ProxyType.None,
      sendEthTo: accountOwner,
    });
    const realMarketId = isEth ? MarketId.WETH : marketId;
    const depositTokensFrom = isEth ? this.contracts.payableProxy.options.address : accountOwner;

    operation.deposit({
      primaryAccountOwner: accountOwner,
      primaryAccountId: new BigNumber(accountNumber),
      marketId: new BigNumber(realMarketId),
      amount: {
        value: new BigNumber(amount),
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      from: depositTokensFrom,
    });

    const commitOptions = options || {};
    if (!commitOptions.from) {
      commitOptions.from = accountOwner;
    }
    if (isEth && !commitOptions.value) {
      commitOptions.value = new BigNumber(amount).toFixed(0);
    }

    return operation.commit(commitOptions);
  }

  public async withdraw({
    accountOwner,
    marketId,
    amount,
    accountNumber = new BigNumber(0),
    options,
  }: {
    accountOwner: address,
    marketId: BigNumber | string,
    amount: BigNumber | string,
    accountNumber: BigNumber | string,
    options?: SendOptions,
  }): Promise<TxResult> {
    const isEth = new BigNumber(marketId).eq(MarketId.ETH);
    const operation = this.operation.initiate({
      proxy: isEth ? ProxyType.Payable : ProxyType.None,
      sendEthTo: accountOwner,
    });
    const realMarketId = isEth ? MarketId.WETH : marketId;
    const withdrawTokensTo = isEth ? this.contracts.payableProxy.options.address : accountOwner;

    operation.withdraw({
      primaryAccountOwner: accountOwner,
      primaryAccountId: new BigNumber(accountNumber),
      marketId: new BigNumber(realMarketId),
      amount: {
        value: new BigNumber(amount).times('-1'),
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      to: withdrawTokensTo,
    });

    const commitOptions = options || {};
    if (!commitOptions.from) {
      commitOptions.from = accountOwner;
    }

    return operation.commit(commitOptions);
  }

  public async withdrawToZero({
    accountOwner,
    marketId,
    accountNumber = new BigNumber(0),
    options,
  }: {
    accountOwner: address,
    marketId: BigNumber | string,
    accountNumber: BigNumber | string,
    options?: SendOptions,
  }): Promise<TxResult> {
    const isEth = new BigNumber(marketId).eq(MarketId.ETH);
    const operation = this.operation.initiate({
      proxy: isEth ? ProxyType.Payable : ProxyType.None,
      sendEthTo: accountOwner,
    });
    const realMarketId = isEth ? MarketId.WETH : marketId;
    const withdrawTokensTo = isEth ? this.contracts.payableProxy.options.address : accountOwner;

    operation.withdraw({
      primaryAccountOwner: accountOwner,
      primaryAccountId: new BigNumber(accountNumber),
      marketId: new BigNumber(realMarketId),
      amount: {
        value: new BigNumber(0),
        reference: AmountReference.Target,
        denomination: AmountDenomination.Par,
      },
      to: withdrawTokensTo,
    });

    const commitOptions = options || {};
    if (!commitOptions.from) {
      commitOptions.from = accountOwner;
    }

    return operation.commit(commitOptions);
  }
}
