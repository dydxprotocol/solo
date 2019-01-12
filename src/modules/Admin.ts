import { Contracts } from '../lib/Contracts';
import { ContractCallOptions, TxResult, address } from '../types';

export class Admin {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public async addMarket(
    token: address,
    priceOracle: address,
    interestSetter: address,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.soloMargin.methods.ownerAddMarket(
        token,
        priceOracle,
        interestSetter,
      ),
      options,
    );
  }
}
