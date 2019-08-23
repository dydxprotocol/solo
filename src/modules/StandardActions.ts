import { BigNumber } from 'bignumber.js';
import { Operation } from './operate/Operation';
import { Contracts } from '../lib/Contracts';
import {
  TxResult,
  MarketId,
  address,
  AmountReference,
  AmountDenomination,
  ContractCallOptions,
  ConfirmationType,
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
    options?: ContractCallOptions,
  }): Promise<TxResult> {
    const isEth = new BigNumber(marketId).eq(MarketId.ETH);
    const operation = this.operation.initiate({
      usePayableProxy: isEth,
    });
    const realMarketId = isEth ? MarketId.WETH : marketId;

    operation.deposit({
      primaryAccountOwner: accountOwner,
      primaryAccountId: new BigNumber(accountNumber),
      marketId: new BigNumber(realMarketId),
      amount: {
        value: new BigNumber(amount),
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      from: accountOwner,
    });

    const commitOptions = options;
    if (!options.from) {
      commitOptions.from = accountOwner;
    }
    if (!options.confirmationType) {
      commitOptions.confirmationType = ConfirmationType.Hash;
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
    options?: ContractCallOptions,
  }): Promise<TxResult> {
    const isEth = new BigNumber(marketId).eq(MarketId.ETH);
    const operation = this.operation.initiate({
      usePayableProxy: isEth,
      sendEthTo: isEth ? accountOwner : undefined,
    });
    const realMarketId = isEth ? MarketId.WETH : marketId;

    operation.withdraw({
      primaryAccountOwner: accountOwner,
      primaryAccountId: new BigNumber(accountNumber),
      marketId: new BigNumber(realMarketId),
      amount: {
        value: new BigNumber(amount).times('-1'),
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      to: isEth ? this.contracts.payableProxy.options.address : accountOwner,
    });

    const commitOptions = options;
    if (!options.from) {
      commitOptions.from = accountOwner;
    }
    if (!options.confirmationType) {
      commitOptions.confirmationType = ConfirmationType.Hash;
    }

    return operation.commit(commitOptions);
  }
}
