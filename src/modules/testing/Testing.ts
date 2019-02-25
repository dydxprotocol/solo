import BigNumber from 'bignumber.js';
import { Provider } from 'web3/providers';
import { Contracts } from '../../lib/Contracts';
import { EVM } from './EVM';
import { TestToken } from './TestToken';
import { Token } from '../Token';
import { TestAutoTrader } from './TestAutoTrader';
import { TestCallee } from './TestCallee';
import { TestExchangeWrapper } from './TestExchangeWrapper';
import { TestPriceOracle } from './TestPriceOracle';
import { TestInterestSetter } from './TestInterestSetter';
import { decimalToString } from '../../lib/Helpers';
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
  public erroringToken: TestToken;
  public omiseToken: TestToken;
  public autoTrader: TestAutoTrader;
  public callee: TestCallee;
  public exchangeWrapper: TestExchangeWrapper;
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
    this.erroringToken = new TestToken(contracts, token, contracts.erroringToken);
    this.omiseToken = new TestToken(contracts, token, contracts.omiseToken);
    this.autoTrader = new TestAutoTrader(contracts);
    this.callee = new TestCallee(contracts);
    this.exchangeWrapper = new TestExchangeWrapper(contracts);
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
      this.contracts.testSoloMargin.methods.setAccountBalance(
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
      this.contracts.testSoloMargin.methods.setAccountStatus(
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
    if (index.lastUpdate.isZero()) {
      const currentIndex = await this.contracts.testSoloMargin.methods.getMarketCachedIndex(
          marketId.toFixed(0),
        ).call();
      index.lastUpdate = new BigNumber(currentIndex.lastUpdate);
    }

    return this.contracts.callContractFunction(
      this.contracts.testSoloMargin.methods.setMarketIndex(
        marketId.toFixed(0),
        {
          borrow: decimalToString(index.borrow),
          supply: decimalToString(index.supply),
          lastUpdate: index.lastUpdate.toFixed(0),
        },
      ),
      options,
    );
  }
}
