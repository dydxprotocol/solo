// noinspection JSUnusedGlobalSymbols

import { Contracts } from '../lib/Contracts';
import { ContractConstantCallOptions } from '../types';
import { bytesToHexString, hexStringToBytes } from '../lib/BytesHelper';

export class MultiCall {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
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
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.multiCall.methods.aggregate(rawCalls),
      options,
    );
    return {
      blockNumber: parseInt(result.blockNumber, 10),
      results: result.returnData.map(result => bytesToHexString(result)),
    };
  }
}
