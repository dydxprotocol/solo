import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  SendOptions,
  CallOptions,
  Integer,
  TxResult,
} from '../../src/types';

export class FinalSettlement {
  private contracts: Contracts;

  // ============ Constructor ============

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ Getters ============

  public async getPrices(
    heldMarketId: Integer,
    owedMarketId: Integer,
    timestamp: Integer,
    options?: CallOptions,
  ): Promise<{heldPrice: Integer, owedPrice: Integer}> {
    const result = await this.contracts.call(
      this.contracts.finalSettlement.methods.getSpreadAdjustedPrices(
        heldMarketId.toFixed(0),
        owedMarketId.toFixed(0),
        timestamp.toFixed(0),
      ),
      options,
    );

    return {
      heldPrice: new BigNumber(result[0].value),
      owedPrice: new BigNumber(result[1].value),
    };
  }

  public async getRampTime(
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.finalSettlement.methods.g_spreadRampTime(),
      options,
    );
    return new BigNumber(result);
  }

  public async getStartTime(
    options?: CallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.call(
      this.contracts.finalSettlement.methods.g_startTime(),
      options,
    );
    return new BigNumber(result);
  }

  // ============ Setters ============

  public async initialize(
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.finalSettlement.methods.initialize(),
      options,
    );
  }
}
