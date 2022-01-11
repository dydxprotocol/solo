import { address, ContractCallOptions, Integer, TxResult } from '../../src';
import { TestContracts } from './TestContracts';

export class TestAmmRebalancerProxy {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async performRebalance(
    tokenA: address,
    tokenB: address,
    truePriceTokenA: Integer,
    truePriceTokenB: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testAmmRebalancerProxy.methods.performRebalance(
        tokenA,
        tokenB,
        truePriceTokenA.toFixed(0),
        truePriceTokenB.toFixed(0),
      ),
      options,
    );
  }
}
