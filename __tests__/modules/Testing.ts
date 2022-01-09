import BigNumber from 'bignumber.js';
import { Provider } from 'web3/providers';
import { TestContracts } from './TestContracts';
import { EVM } from './EVM';
import { TestToken } from './TestToken';
import { Token } from '../../src/modules/Token';
import { TestAutoTrader } from './TestAutoTrader';
import { TestCallee } from './TestCallee';
import { TestSimpleCallee } from './TestSimpleCallee';
import { TestExchangeWrapper } from './TestExchangeWrapper';
import { TestPriceOracle } from './TestPriceOracle';
import { TestPolynomialInterestSetter } from './TestPolynomialInterestSetter';
import { TestDoubleExponentInterestSetter } from './TestDoubleExponentInterestSetter';
import { TestInterestSetter } from './TestInterestSetter';
import { decimalToString } from '../../src/lib/Helpers';
import {
  AccountStatus,
  address,
  ContractCallOptions,
  Index,
  Integer,
  TxResult,
} from '../../src';
import { UniswapV2Router } from './UniswapV2Router';
import { UniswapV2Factory } from './UniswapV2Factory';

export class Testing {
  public evm: EVM;
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public erroringToken: TestToken;
  public omiseToken: TestToken;
  public autoTrader: TestAutoTrader;
  public callee: TestCallee;
  public simpleCallee: TestSimpleCallee;
  public exchangeWrapper: TestExchangeWrapper;
  public priceOracle: TestPriceOracle;
  public polynomialInterestSetter: TestPolynomialInterestSetter;
  public doubleExponentInterestSetter: TestDoubleExponentInterestSetter;
  public interestSetter: TestInterestSetter;
  public uniswapV2Factory: UniswapV2Factory;
  public uniswapV2Router: UniswapV2Router;
  private contracts: TestContracts;

  constructor(provider: Provider, contracts: TestContracts, token: Token) {
    this.contracts = contracts;
    this.evm = new EVM(provider);
    this.tokenA = new TestToken(contracts, token, contracts.tokenA);
    this.tokenB = new TestToken(contracts, token, contracts.tokenB);
    this.tokenC = new TestToken(contracts, token, contracts.tokenC);
    this.erroringToken = new TestToken(
      contracts,
      token,
      contracts.erroringToken,
    );
    this.omiseToken = new TestToken(contracts, token, contracts.omiseToken);
    this.autoTrader = new TestAutoTrader(contracts);
    this.callee = new TestCallee(contracts);
    this.simpleCallee = new TestSimpleCallee(contracts);
    this.exchangeWrapper = new TestExchangeWrapper(contracts);
    this.priceOracle = new TestPriceOracle(contracts);
    this.polynomialInterestSetter = new TestPolynomialInterestSetter(contracts);
    this.doubleExponentInterestSetter = new TestDoubleExponentInterestSetter(
      contracts,
    );
    this.interestSetter = new TestInterestSetter(contracts);
    this.uniswapV2Factory = new UniswapV2Factory(contracts);
    this.uniswapV2Router = new UniswapV2Router(contracts);
  }

  public setProvider(provider: Provider): void {
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
      this.contracts.testDolomiteMargin.methods.setAccountBalance(
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
      this.contracts.testDolomiteMargin.methods.setAccountStatus(
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
      const currentIndex = await this.contracts.testDolomiteMargin.methods
        .getMarketCachedIndex(marketId.toFixed(0))
        .call();
      index.lastUpdate = new BigNumber(currentIndex.lastUpdate);
    }

    return this.contracts.callContractFunction(
      this.contracts.testDolomiteMargin.methods.setMarketIndex(
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
