import { Contracts } from '../lib/Contracts';
import {
  address,
  SendOptions,
  Decimal,
  Integer,
  TxResult,
} from '../types';
import { decimalToString } from '../lib/Helpers';

export class LiquidatorProxy {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async liquidate(
    accountOwner: address,
    accountNumber: Integer,
    liquidOwner: address,
    liquidNumber: Integer,
    minLiquidatorRatio: Decimal,
    minValueLiquidated: Integer,
    owedPreferences: Integer[],
    heldPreferences: Integer[],
    options: SendOptions = {},
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.liquidatorProxyV1.methods.liquidate(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        {
          owner: liquidOwner,
          number: liquidNumber.toFixed(0),
        },
        {
          value: decimalToString(minLiquidatorRatio),
        },
        minValueLiquidated.toFixed(0),
        owedPreferences.map(x => x.toFixed(0)),
        heldPreferences.map(x => x.toFixed(0)),
      ),
      options,
    );
  }
}
