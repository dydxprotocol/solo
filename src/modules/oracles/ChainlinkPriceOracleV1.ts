import BigNumber from 'bignumber.js';
import { ADDRESSES } from '../../lib/Constants';
import { Contracts } from '../../lib/Contracts';
import { address, ContractCallOptions, ContractConstantCallOptions, Integer, TxResult, } from '../../types';

export class ChainlinkPriceOracleV1 {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ Admin ============

  public async insertOrUpdateOracleToken(
    token: address,
    tokenDecimals: number,
    chainlinkAggregator: address,
    aggregatorDecimals: number,
    tokenPair: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.insertOrUpdateOracleToken(
        token,
        tokenDecimals,
        chainlinkAggregator,
        aggregatorDecimals,
        tokenPair,
      ),
      options,
    );
  }

  // ============ Getters ============

  public async getOwner(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.owner(),
      options,
    );
  }

  public async getPrice(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const price = await this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.getPrice(ADDRESSES.ZERO),
      options,
    );
    return new BigNumber(price.value);
  }

  public async getAggregatorByToken(
    token: address,
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.tokenToAggregatorMap(token),
      options,
    );
  }

  public async getTokenDecimalsByToken(
    token: address,
    options?: ContractConstantCallOptions,
  ): Promise<number> {
    const decimals = await this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.tokenToDecimalsMap(token),
      options,
    );
    return Number.parseInt(decimals, 10);
  }

  /**
   * @return 0 address for USD, non-zero address representing another token otherwise.
   */
  public async getCurrencyPairingByToken(
    token: address,
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.tokenToPairingMap(token),
      options,
    );
  }

  public async getAggregatorDecimalsByToken(
    token: address,
    options?: ContractConstantCallOptions,
  ): Promise<number> {
    const decimalsString = await this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.tokenToAggregatorDecimalsMap(token),
      options,
    );
    const decimals = Number.parseInt(decimalsString, 10);
    return decimals === 0 ? 8 : decimals;
  }

  /**
   * @return Standardizes `value` to have `ONE_DOLLAR` - `tokenDecimals` number of decimals.
   */
  public async standardizeNumberOfDecimals(
    tokenDecimals: number,
    value: Integer,
    valueDecimals: number,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const valueString = await this.contracts.callConstantContractFunction(
      this.contracts.chainlinkPriceOracleV1.methods.standardizeNumberOfDecimals(
        tokenDecimals,
        value.toFixed(),
        valueDecimals
      ),
      options,
    );
    return new BigNumber(valueString);
  }

}
