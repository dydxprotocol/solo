import { Contracts } from '../lib/Contracts';
import { DaiPriceOracle } from './oracles/DaiPriceOracle';

export class Oracle {
  private contracts: Contracts;
  public daiPriceOracle: DaiPriceOracle;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
    this.daiPriceOracle = new DaiPriceOracle(this.contracts);
  }
}
