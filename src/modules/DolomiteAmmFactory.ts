import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  ContractConstantCallOptions,
  Integer,
  TxResult,
} from '../types';
import BigNumber from 'bignumber.js';

export class DolomiteAmmFactory {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async getPairInitCodeHash(
    options: ContractConstantCallOptions = {},
  ): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.getPairInitCodeHash(),
      options,
    );
  }

  public async allPairs(
    index: number,
    options: ContractConstantCallOptions = {},
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.allPairs(index),
      options,
    );
  }

  public async allPairsLength(
    options: ContractConstantCallOptions = {},
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.allPairsLength(),
      options,
    );
    return new BigNumber(result);
  }

  public async getPair(
    tokenA: address,
    tokenB: address,
    options: ContractConstantCallOptions = {},
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.getPair(tokenA, tokenB),
      options,
    );
  }

  public async feeTo(
    options: ContractConstantCallOptions = {},
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.feeTo(),
      options,
    );
  }

  public async feeToSetter(
    options: ContractConstantCallOptions = {},
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmFactory.methods.feeToSetter(),
      options,
    );
  }

  // ============ Write Functions ============

  public async createPair(
    tokenA: address,
    tokenB: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmFactory.methods.createPair(tokenA, tokenB),
      options,
    );
  }

}
