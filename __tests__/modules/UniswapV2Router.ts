import { TestContracts } from './TestContracts';
import { address, ContractCallOptions, Integer, TxResult } from '../../src';

export class UniswapV2Router {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async getPairInitCodeHash(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testUniswapV2Router.methods.getPairInitCodeHash()
    );
  }

  // ============ State-Changing Functions ============

  public async addLiquidity(
    tokenA: address,
    tokenB: address,
    amountADesired: Integer,
    amountBDesired: Integer,
    amountAMin: Integer,
    amountBMin: Integer,
    to: address,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testUniswapV2Router.methods.addLiquidity(
        tokenA,
        tokenB,
        amountADesired.toFixed(0),
        amountBDesired.toFixed(0),
        amountAMin.toFixed(0),
        amountBMin.toFixed(0),
        to,
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async removeLiquidity(
    tokenA: address,
    tokenB: address,
    liquidity: Integer,
    amountAMin: Integer,
    amountBMin: Integer,
    to: address,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testUniswapV2Router.methods.removeLiquidity(
        tokenA,
        tokenB,
        liquidity.toFixed(0),
        amountAMin.toFixed(0),
        amountBMin.toFixed(0),
        to,
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async swapExactTokensForTokens(
    amountIn: Integer,
    amountOutMin: Integer,
    tokenPath: address[],
    to: address,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testUniswapV2Router.methods.swapExactTokensForTokens(
        amountIn.toFixed(0),
        amountOutMin.toFixed(0),
        tokenPath,
        to,
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async swapTokensForExactTokens(
    amountInMax: Integer,
    amountOut: Integer,
    tokenPath: address[],
    to: address,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.testUniswapV2Router.methods.swapTokensForExactTokens(
        amountInMax.toFixed(0),
        amountOut.toFixed(0),
        tokenPath,
        to,
        deadline.toFixed(0),
      ),
      options,
    );
  }
}
