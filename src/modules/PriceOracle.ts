import BigNumber from 'bignumber.js';
import { ADDRESSES } from '../lib/Constants';
import { Contracts } from '../lib/Contracts';
import { IPriceOracle } from '../../build/wrappers/IPriceOracle';
import {
  address,
  Integer,
  ContractConstantCallOptions,
} from '../types';

export class PriceOracle {
  private contracts: Contracts;
  private oracles: object;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
    this.oracles = {};
  }

  public async getPrice(
    oracleAddress: address,
    tokenAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const oracle = this.getOracle(oracleAddress);
    const price = await this.contracts.callConstantContractFunction(
      oracle.methods.getPrice(tokenAddress),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getWethPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.getPrice(
      this.contracts.wethPriceOracle.options.address,
      ADDRESSES.ZERO,
      options,
    );
  }

  public async getDaiPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.getPrice(
      this.contracts.daiPriceOracle.options.address,
      ADDRESSES.ZERO,
      options,
    );
  }

  public async getUsdcPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.getPrice(
      this.contracts.usdcPriceOracle.options.address,
      ADDRESSES.ZERO,
      options,
    );
  }

  // ============ Helper Functions ============

  private getOracle(
    oracleAddress: string,
  ): IPriceOracle {
    if (this.oracles[oracleAddress]) {
      return this.oracles[oracleAddress];
    }

    const oracle: IPriceOracle = this.contracts.priceOracle;
    const contract: IPriceOracle = oracle.clone();
    contract.options.address = oracleAddress;

    this.oracles[oracleAddress] = contract;

    return contract;
  }
}
