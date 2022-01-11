import { TestContracts } from './TestContracts';
import { address } from '../../src';

export class UniswapV2Factory {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async getPairInitCodeHash(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testUniswapV2Factory.methods.getPairInitCodeHash()
    );
  }

  public async getPair(
    tokenA: address,
    tokenB: address,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testUniswapV2Factory.methods.getPair(tokenA, tokenB)
    );
  }

  public async feeTo(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testUniswapV2Factory.methods.feeTo()
    );
  }

  public async feeToSetter(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testUniswapV2Factory.methods.feeToSetter()
    );
  }

}
