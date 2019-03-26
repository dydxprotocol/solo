import BigNumber from 'bignumber.js';
import { ADDRESSES } from '../../lib/Constants';
import { Contracts } from '../../lib/Contracts';
import {
  Decimal,
  Integer,
  ContractConstantCallOptions,
  ContractCallOptions,
  TxResult,
} from '../../types';

export class DaiPriceOracle {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ Setters ============

  public async updatePrice(
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.daiPriceOracle.methods.updatePrice(),
      options,
    );
  }

  // ============ Getters ============

  public async getPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getPrice(ADDRESSES.ZERO),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getBoundedTargetPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getBoundedTargetPrice(),
      options,
    );
    return new BigNumber(price);
  }

  public async getTargetPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getTargetPrice(),
      options,
    );
    return new BigNumber(price);
  }

  public async getMedianizerPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getMedianizerPrice(),
      options,
    );
    return new BigNumber(price);
  }

  public async getOasisPrice(
    ethUsdPrice?: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const queryPrice = ethUsdPrice ? ethUsdPrice : await this.getMedianizerPrice();
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getOasisPrice(
        queryPrice.toFixed(0),
      ),
      options,
    );
    return new BigNumber(price);
  }

  public async getUniswapPrice(
    ethUsdPrice?: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const queryPrice = ethUsdPrice ? ethUsdPrice : await this.getMedianizerPrice();
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getUniswapPrice(
        queryPrice.toFixed(0),
      ),
      options,
    );
    return new BigNumber(price);
  }

  public async getDeviationParams(
    options?: ContractConstantCallOptions,
  ): Promise<{
    maximumPerSecond: Decimal,
    maximumAbsolute: Decimal,
  }> {
    const params = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.DEVIATION_PARAMS(),
      options,
    );
    return {
      maximumPerSecond: new BigNumber(params.maximumPerSecond).div(params.denominator),
      maximumAbsolute: new BigNumber(params.maximumAbsolute).div(params.denominator),
    };
  }
}
