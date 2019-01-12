import BN from 'bn.js';
import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, address } from '../../types';

export class TestPriceOracle {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testPriceOracle.options.address;
  }

  public async setPrice(
    token: address,
    price: BN,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testPriceOracle.methods.setPrice(
        token,
        price.toString(),
      ),
      options,
    );
  }
}
