import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer } from '../types';
import BigNumber from 'bignumber.js';

export interface AllGasPricesInWei {
  perL2Tx: Integer;
  perL1CalldataUnit: Integer;
  perStorageAllocation: Integer;
  perArbGasBase: Integer;
  perArbGasCongestion: Integer;
  perArbGasTotal: Integer;
}

export interface SomeGasPricesInWei {
  perL2Tx: Integer;
  perL1CalldataUnit: Integer;
  perStorageAllocation: Integer;
}

export interface GasAccountingParams {
  speedLimitPerSecond: Integer;
  gasPoolMax: Integer;
  maxTxGasLimit: Integer;
}

export class ArbitrumGasInfo {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  private static mapToAllGasPricesInWei(result: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  }): AllGasPricesInWei {
    return {
      perL2Tx: new BigNumber(result[0]),
      perL1CalldataUnit: new BigNumber(result[1]),
      perStorageAllocation: new BigNumber(result[2]),
      perArbGasBase: new BigNumber(result[3]),
      perArbGasCongestion: new BigNumber(result[4]),
      perArbGasTotal: new BigNumber(result[5]),
    };
  }

  private static mapToSomeGasPricesInWei(result: { 0: string; 1: string; 2: string }): SomeGasPricesInWei {
    return {
      perL2Tx: new BigNumber(result[0]),
      perL1CalldataUnit: new BigNumber(result[1]),
      perStorageAllocation: new BigNumber(result[2]),
    };
  }

  public async getPricesInWeiWithAggregator(
    aggregator: address,
    options: ContractCallOptions = {},
  ): Promise<AllGasPricesInWei> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getPricesInWeiWithAggregator(aggregator),
      options,
    );
    return ArbitrumGasInfo.mapToAllGasPricesInWei(result);
  }

  public async getPricesInWei(options: ContractCallOptions = {}): Promise<AllGasPricesInWei> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getPricesInWei(),
      options,
    );
    return ArbitrumGasInfo.mapToAllGasPricesInWei(result);
  }

  public async getPricesInArbGasWithAggregator(
    aggregator: address,
    options: ContractCallOptions = {},
  ): Promise<SomeGasPricesInWei> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getPricesInArbGasWithAggregator(aggregator),
      options,
    );
    return ArbitrumGasInfo.mapToSomeGasPricesInWei(result);
  }

  public async getPricesInArbGas(options: ContractCallOptions = {}): Promise<SomeGasPricesInWei> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getPricesInArbGas(),
      options,
    );
    return ArbitrumGasInfo.mapToSomeGasPricesInWei(result);
  }

  public async getGasAccountingParams(options: ContractCallOptions = {}): Promise<GasAccountingParams> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getGasAccountingParams(),
      options,
    );
    return {
      speedLimitPerSecond: new BigNumber(result[0]),
      gasPoolMax: new BigNumber(result[1]),
      maxTxGasLimit: new BigNumber(result[2]),
    };
  }

  public async getL1GasPriceEstimate(options: ContractCallOptions = {}): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getL1GasPriceEstimate(),
      options,
    );
    return new BigNumber(result);
  }

  public async getCurrentTxL1GasFees(options: ContractCallOptions = {}): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.arbitrumGasInfo.methods.getCurrentTxL1GasFees(),
      options,
    );
    return new BigNumber(result);
  }
}
