import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer, TxResult } from '../types';

export class DepositProxy {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  public get address(): address {
    return this.contracts.depositProxy.options.address;
  }

  // ============ View Functions ============

  public async dolomiteMargin(): Promise<address> {
    return this.contracts.callConstantContractFunction(this.contracts.depositProxy.methods.DOLOMITE_MARGIN());
  }

  // ============ Write Functions ============

  public async initializeETHMarket(
    weth: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.initializeETHMarket(weth),
      options,
    );
  }

  public async depositWei(
    accountIndex: Integer,
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.depositWei(accountIndex.toFixed(), marketId.toFixed(), amountWei.toFixed()),
      options,
    );
  }

  public async depositETH(
    accountIndex: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(this.contracts.depositProxy.methods.depositETH(accountIndex.toFixed()), {
      ...options,
      value: amountWei.toFixed(),
    });
  }

  public async depositWeiIntoDefaultAccount(
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.depositWeiIntoDefaultAccount(marketId.toFixed(), amountWei.toFixed()),
      options,
    );
  }

  public async depositETHIntoDefaultAccount(amountWei: Integer, options: ContractCallOptions = {}): Promise<TxResult> {
    return this.contracts.callContractFunction(this.contracts.depositProxy.methods.depositETHIntoDefaultAccount(), {
      ...options,
      value: amountWei.toFixed(),
    });
  }

  public async withdrawWei(
    accountIndex: Integer,
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawWei(accountIndex.toFixed(), marketId.toFixed(), amountWei.toFixed()),
      options,
    );
  }

  public async withdrawETH(
    accountIndex: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawETH(accountIndex.toFixed(), amountWei.toFixed()),
      options,
    );
  }

  public async withdrawWeiFromDefaultAccount(
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawWeiFromDefaultAccount(marketId.toFixed(), amountWei.toFixed()),
      options,
    );
  }

  public async withdrawETHFromDefaultAccount(amountWei: Integer, options: ContractCallOptions = {}): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawETHFromDefaultAccount(amountWei.toFixed()),
      options,
    );
  }

  public async depositPar(
    accountIndex: Integer,
    marketId: Integer,
    amountPar: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.depositPar(accountIndex.toFixed(), marketId.toFixed(), amountPar.toFixed()),
      options,
    );
  }

  public async depositParIntoDefaultAccount(
    marketId: Integer,
    amountPar: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.depositParIntoDefaultAccount(marketId.toFixed(), amountPar.toFixed()),
      options,
    );
  }

  public async withdrawPar(
    accountIndex: Integer,
    marketId: Integer,
    amountPar: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawPar(accountIndex.toFixed(), marketId.toFixed(), amountPar.toFixed()),
      options,
    );
  }

  public async withdrawParFromDefaultAccount(
    marketId: Integer,
    amountPar: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawParFromDefaultAccount(marketId.toFixed(), amountPar.toFixed()),
      options,
    );
  }
}
