import BigNumber from 'bignumber.js';
import Contract from 'web3/eth/contract';
import { ADDRESSES, INTEGERS } from '../../lib/Constants';
import { Contracts } from '../../lib/Contracts';
import {
  address,
  Decimal,
  Integer,
  CallOptions,
  SendOptions,
  TxResult,
} from '../../types';

export class MakerStablecoinPriceOracle {
  private contracts: Contracts;
  private oracleContract: Contract;

  constructor(
    contracts: Contracts,
    oracleContract: Contract,
  ) {
    this.contracts = contracts;
    this.oracleContract = oracleContract;
  }

  // ============ Admin ============

  public async setPokerAddress(
    newPoker: address,
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.oracleContract.methods.ownerSetPokerAddress(newPoker),
      options,
    );
  }

  // ============ Setters ============

  public async updatePrice(
    minimum?: Decimal,
    maximum?: Decimal,
    options?: SendOptions,
  ): Promise<TxResult> {
    const minimumArg = minimum ? minimum : INTEGERS.ZERO;
    const maximumArg = maximum ? maximum : INTEGERS.ONES_255;
    return this.contracts.send(
      this.oracleContract.methods.updatePrice(
        { value: minimumArg.toFixed(0) },
        { value: maximumArg.toFixed(0) },
      ),
      options,
    );
  }

  // ============ Getters ============

  public async getOwner(
    options?: CallOptions,
  ): Promise<address> {
    return this.contracts.call(
      this.oracleContract.methods.owner(),
      options,
    );
  }

  public async getPoker(
    options?: CallOptions,
  ): Promise<address> {
    const poker = await this.contracts.call(
      this.oracleContract.methods.g_poker(),
      options,
    );
    return poker;
  }

  public async getPrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getPrice(ADDRESSES.ZERO),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getPriceInfo(
    options?: CallOptions,
  ): Promise<{ price: Decimal, lastUpdate: Integer }> {
    const priceInfo = await this.contracts.call(
      this.oracleContract.methods.g_priceInfo(),
      options,
    );
    return {
      price: new BigNumber(priceInfo.price),
      lastUpdate: new BigNumber(priceInfo.lastUpdate),
    };
  }

  public async getBoundedTargetPrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getBoundedTargetPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getTargetPrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getTargetPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getMedianizerPrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getMedianizerPrice(),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getCurvePrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getCurvePrice(),
      options,
    );
    return new BigNumber(price);
  }

  public async getUniswapPrice(
    options?: CallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.call(
      this.oracleContract.methods.getUniswapPrice(),
      options,
    );
    return new BigNumber(price);
  }

  public async getDeviationParams(
    options?: CallOptions,
  ): Promise<{
    maximumPerSecond: Decimal,
    maximumAbsolute: Decimal,
  }> {
    const params = await this.contracts.call(
      this.oracleContract.methods.DEVIATION_PARAMS(),
      options,
    );
    return {
      maximumPerSecond: new BigNumber(params.maximumPerSecond).div(params.denominator),
      maximumAbsolute: new BigNumber(params.maximumAbsolute).div(params.denominator),
    };
  }
}
