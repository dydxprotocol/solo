import { Contracts } from '../lib/Contracts';
import { MakerStablecoinPriceOracle } from './oracles/MakerStablecoinPriceOracle';

export class Oracle {
  private contracts: Contracts;
  public daiPriceOracle: MakerStablecoinPriceOracle;
  public saiPriceOracle: MakerStablecoinPriceOracle;

  constructor(
    contracts: Contracts,
  ) {
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
