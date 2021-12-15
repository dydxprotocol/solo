import { Contracts } from '../lib/Contracts';
import { MakerStablecoinPriceOracle } from './oracles/MakerStablecoinPriceOracle';

export class Oracle {
  public daiPriceOracle: MakerStablecoinPriceOracle;
  public saiPriceOracle: MakerStablecoinPriceOracle;
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
    this.daiPriceOracle = new MakerStablecoinPriceOracle(
      this.contracts,
      this.contracts.daiPriceOracle,
    );
    this.saiPriceOracle = new MakerStablecoinPriceOracle(
      this.contracts,
      this.contracts.saiPriceOracle,
    );
  }
}
