import { Provider } from 'web3/providers';
import { Contracts } from '../../lib/Contracts';
import { EVM } from './EVM';
import { TestToken } from './TestToken';
import { Token } from '../Token';
import { TestPriceOracle } from './TestPriceOracle';
import { TestInterestSetter } from './TestInterestSetter';

export class Testing {
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
}
