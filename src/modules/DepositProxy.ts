import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';

export class DepositProxy {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async dolomiteMargin(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.depositProxy.methods.DOLOMITE_MARGIN(),
    );
  }

  public async depositWei(
    accountIndex: Integer,
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.depositWei(
        accountIndex.toFixed(),
        marketId.toFixed(),
        amountWei.toFixed(),
      ),
      options,
    );
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

  public async withdrawWei(
    accountIndex: Integer,
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawWei(
        accountIndex.toFixed(),
        marketId.toFixed(),
        amountWei.toFixed(),
      ),
      options,
    );
  }

  public async withdrawWeiIntoDefaultAccount(
    marketId: Integer,
    amountWei: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.depositProxy.methods.withdrawWeiIntoDefaultAccount(marketId.toFixed(), amountWei.toFixed()),
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
      this.contracts.depositProxy.methods.depositPar(
        accountIndex.toFixed(),
        marketId.toFixed(),
        amountPar.toFixed(),
      ),
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
      this.contracts.depositProxy.methods.withdrawPar(
        accountIndex.toFixed(),
        marketId.toFixed(),
        amountPar.toFixed(),
      ),
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
