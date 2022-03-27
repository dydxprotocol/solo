// noinspection JSUnusedGlobalSymbols

import { Contracts } from '../lib/Contracts';
import { ContractConstantCallOptions, Integer } from '../types';
import { hexStringToBytes } from '../lib/BytesHelper';
import BigNumber from 'bignumber.js';

export class MultiCall {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  public async getCurrentBlockTimestamp(): Promise<Integer> {
    const transaction = !this.contracts.multiCall.options.address
      ? this.contracts.arbitrumMultiCall.methods.getCurrentBlockTimestamp()
      : this.contracts.multiCall.methods.getCurrentBlockTimestamp();

    const result = await this.contracts.callConstantContractFunction(transaction);
    return new BigNumber(result);
  }

  public async aggregate(
    calls: { target: string; callData: string }[],
    options?: ContractConstantCallOptions,
  ): Promise<{ blockNumber: number; results: string[] }> {
    const rawCalls = calls.map(({ target, callData }) => {
      return {
        target,
        callData: hexStringToBytes(callData),
      };
    });
    const transaction = !this.contracts.multiCall.options.address
      ? this.contracts.arbitrumMultiCall.methods.aggregate(rawCalls)
      : this.contracts.multiCall.methods.aggregate(rawCalls);

    const result = await this.contracts.callConstantContractFunction(transaction, options);
    // result.returnData is actually string[], not string[][]
    return {
      blockNumber: parseInt(result.blockNumber, 10),
      results: (result.returnData as any) as string[],
    };
  }
}
