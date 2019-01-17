import { Provider } from 'web3/providers';
import { Contracts } from '../../lib/Contracts';
import { EVM } from './EVM';
import { TestToken } from './TestToken';
import { Token } from '../Token';
import { TestPriceOracle } from './TestPriceOracle';
import { TestInterestSetter } from './TestInterestSetter';
import {
  AccountStatus,
  ContractCallOptions,
  Index,
  Integer,
  TxResult,
  address,
} from '../../types';

export class Testing {
  private contracts: Contracts;
  public evm: EVM;
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public priceOracle: TestPriceOracle;
  public interestSetter: TestInterestSetter;

  constructor(
    provider: Provider,
    contracts: Contracts,
    token: Token,
  ) {
    this.contracts = contracts;
    this.evm = new EVM(provider);
    this.tokenA = new TestToken(contracts, token, contracts.tokenA);
    this.tokenB = new TestToken(contracts, token, contracts.tokenB);
    this.tokenC = new TestToken(contracts, token, contracts.tokenC);
    this.priceOracle = new TestPriceOracle(contracts);
    this.interestSetter = new TestInterestSetter(contracts);
  }

  public setProvider(
    provider: Provider,
  ): void {
    this.evm.setProvider(provider);
  }

  public async setAccountBalance(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    par: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.mockSoloMargin.methods.setAccountBalance(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
        {
          sign: par.gt(0),
          value: par.abs().toFixed(0),
        },
      ),
      options,
    );
  }

  public async setAccountStatus(
    accountOwner: address,
    accountNumber: Integer,
    status: AccountStatus,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.mockSoloMargin.methods.setAccountStatus(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        status,
      ),
      options,
    );
  }

  public async setMarketIndex(
    marketId: Integer,
    index: Index,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.mockSoloMargin.methods.setMarketIndex(
        marketId.toFixed(0),
        {
          borrow: index.borrow.toFixed(0),
          supply: index.supply.toFixed(0),
          lastUpdate: index.lastUpdate.toFixed(0),
        },
      ),
      options,
    );
  }
}
