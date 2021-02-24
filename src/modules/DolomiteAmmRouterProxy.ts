import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';

export class DolomiteAmmRouterProxy {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async addLiquidity(
    to: address,
    accountNumber: Integer,
    tokenA: address,
    tokenB: address,
    amountADesired: Integer,
    amountBDesired: Integer,
    amountAMin: Integer,
    amountBMin: Integer,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.addLiquidity(
        to,
        accountNumber.toFixed(0),
        tokenA,
        tokenB,
        amountADesired.toFixed(0),
        amountBDesired.toFixed(0),
        amountAMin.toFixed(0),
        amountBMin.toFixed(0),
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async removeLiquidity(
    to: address,
    fromAccountNumber: Integer,
    tokenA: address,
    tokenB: address,
    liquidity: Integer,
    amountAMin: Integer,
    amountBMin: Integer,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.removeLiquidity(
        to,
        fromAccountNumber.toFixed(0),
        tokenA,
        tokenB,
        liquidity.toFixed(0),
        amountAMin.toFixed(0),
        amountBMin.toFixed(0),
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async swapExactTokensForTokens(
    accountNumber: Integer,
    amountIn: Integer,
    amountOutMin: Integer,
    tokenPath: address[],
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.swapExactTokensForTokens(
        accountNumber.toFixed(0),
        amountIn.toFixed(0),
        amountOutMin.toFixed(0),
        tokenPath,
        deadline.toFixed(0),
      ),
      options,
    );
  }
}
