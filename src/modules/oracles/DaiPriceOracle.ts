import BigNumber from 'bignumber.js';
import { ADDRESSES, INTEGERS } from '../../lib/Constants';
import { Contracts } from '../../lib/Contracts';
import {
  address,
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

  // ============ Admin ============

  public async setPokerAddress(
    newPoker: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.daiPriceOracle.methods.ownerSetPokerAddress(newPoker),
      options,
    );
  }

  // ============ Setters ============

  public async updatePrice(
    minimum?: Decimal,
    maximum?: Decimal,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    const minimumArg = minimum ? minimum : INTEGERS.ZERO;
    const maximumArg = maximum ? maximum : INTEGERS.ONES_255;
    return this.contracts.callContractFunction(
      this.contracts.daiPriceOracle.methods.updatePrice(
        { value: minimumArg.toFixed(0) },
        { value: maximumArg.toFixed(0) },
      ),
      options,
    );
  }

  // ============ Getters ============

  public async getOwner(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.owner(),
      options,
    );
  }

  public async getPoker(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    const poker = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.g_poker(),
      options,
    );
    return poker;
  }

  public async getPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getPrice(ADDRESSES.ZERO),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getPriceInfo(
    options?: ContractConstantCallOptions,
  ): Promise<{ price: Decimal, lastUpdate: Integer }> {
    const priceInfo = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.g_priceInfo(),
      options,
    );
    return {
      price: new BigNumber(priceInfo.price),
      lastUpdate: new BigNumber(priceInfo.lastUpdate),
    };
  }

  public async getBoundedTargetPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getBoundedTargetPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getTargetPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getTargetPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getMedianizerPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getMedianizerPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getOasisPrice(
    ethUsdPrice?: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const queryPrice = ethUsdPrice ? ethUsdPrice : await this.getMedianizerPrice();
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getOasisPrice(
        { value: queryPrice.toFixed(0) },
      ),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getUniswapPrice(
    ethUsdPrice?: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const queryPrice = ethUsdPrice ? ethUsdPrice : await this.getMedianizerPrice();
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.daiPriceOracle.methods.getUniswapPrice(
        { value: queryPrice.toFixed(0) },
      ),
      options,
    );
    return new BigNumber(price.value);
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
