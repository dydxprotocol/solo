import { Contracts } from '../lib/Contracts';
import { SendOptions, TxResult, address } from '../types';

export class Permissions {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public async setOperators(
    operatorArgs: ({ operator: address, trusted: boolean })[],
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.soloMargin.methods.setOperators(
        operatorArgs,
      ),
      options,
    );
  }

  public async approveOperator(
    operator: address,
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.soloMargin.methods.setOperators(
        [
          {
            operator,
            trusted: true,
          },
        ],
      ),
      options,
    );
  }

  public async disapproveOperator(
    operator: address,
    options?: SendOptions,
  ): Promise<TxResult> {
    return this.contracts.send(
      this.contracts.soloMargin.methods.setOperators(
        [
          {
            operator,
            trusted: false,
          },
        ],
      ),
      options,
    );
  }
}
