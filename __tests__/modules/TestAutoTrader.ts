import { TestContracts } from './TestContracts';
import { Amount, SendOptions, TxResult, Integer } from '../../src/types';

export class TestAutoTrader {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testAutoTrader.options.address;
  }

  public async setData(
    tradeId: Integer,
    amount: Amount,
    options?: SendOptions,
  ): Promise<TxResult> {
    const parsedAmount = {
      sign: !amount.value.isNegative(),
      denomination: amount.denomination,
      ref: amount.reference,
      value: amount.value.abs().toFixed(0),
    };
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setData(
        tradeId.toFixed(0),
        parsedAmount,
      ),
      options,
    );
  }

  public async setRequireInputMarketId(
    market: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireInputMarketId(
        market.toFixed(0),
      ),
    );
  }

  public async setRequireOutputMarketId(
    market: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireOutputMarketId(
        market.toFixed(0),
      ),
    );
  }

  public async setRequireMakerAccount(
    accountOwner: string,
    accountNumber: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireMakerAccount({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
    );
  }

  public async setRequireTakerAccount(
    accountOwner: string,
    accountNumber: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireTakerAccount({
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      }),
    );
  }

  public async setRequireOldInputPar(
    par: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireOldInputPar({
        sign: par.gt(0),
        value: par.abs().toFixed(0),
      }),
    );
  }

  public async setRequireNewInputPar(
    par: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireNewInputPar({
        sign: par.gt(0),
        value: par.abs().toFixed(0),
      }),
    );
  }

  public async setRequireInputWei(
    wei: Integer,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.testAutoTrader.methods.setRequireInputWei({
        sign: wei.gt(0),
        value: wei.abs().toFixed(0),
      }),
    );
  }
}
