// noinspection JSUnusedGlobalSymbols

import { BigNumber } from '../index';
import { Contracts } from '../lib/Contracts';
import {
  address,
  AmountDenomination,
  AmountReference,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';
import { DolomiteAmmFactory } from './DolomiteAmmFactory';
import { DolomiteAmmPair } from './DolomiteAmmPair';

export class DolomiteAmmRouterProxy {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ View Functions ============

  public async getPairInitCodeHash(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.getPairInitCodeHash()
    );
  }

  public async getDolomiteAmmAmountOut(
    amountIn: BigNumber,
    tokenIn: address,
    tokenOut: address,
  ): Promise<BigNumber> {
    return this.getDolomiteAmmAmountOutWithPath(amountIn, [tokenIn, tokenOut]);
  }

  public async getDolomiteAmmAmountOutWithPath(
    amountIn: BigNumber,
    path: address[],
  ): Promise<BigNumber> {
    const amounts = new Array<BigNumber>(path.length);
    amounts[0] = amountIn;
    const dolomiteAmmFactory = new DolomiteAmmFactory(this.contracts);

    for (let i = 0; i < path.length - 1; i += 1) {
      const pairAddress = await dolomiteAmmFactory.getPair(path[i], path[i + 1]);
      const pair = new DolomiteAmmPair(this.contracts, this.contracts.getDolomiteAmmPair(pairAddress));
      const { reserve0, reserve1 } = await pair.getReservesWei();
      const token0 = path[i] < path[i + 1] ? path[i] : path[i + 1];
      amounts[i + 1] = this.getDolomiteAmmAmountOutWithReserves(
        amounts[i],
        token0 === path[i] ? reserve0 : reserve1,
        token0 === path[i + 1] ? reserve0 : reserve1,
      );
    }

    return amounts[amounts.length - 1];
  }

  public getDolomiteAmmAmountOutWithReserves(
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
  ): BigNumber {
    const amountInWithFee = amountIn.times('997');
    const numerator = amountInWithFee.times(reserveOut);
    const denominator = reserveIn.times('1000').plus(amountInWithFee);
    return numerator.dividedToIntegerBy(denominator);
  }

  public async getDolomiteAmmAmountIn(
    amountOut: BigNumber,
    tokenIn: address,
    tokenOut: address,
  ): Promise<BigNumber> {
    return this.getDolomiteAmmAmountInWithPath(amountOut, [tokenIn, tokenOut]);
  }

  public async getDolomiteAmmAmountInWithPath(
    amountOut: BigNumber,
    path: address[],
  ): Promise<BigNumber> {
    const amounts = new Array<BigNumber>(path.length);
    amounts[amounts.length - 1] = amountOut;
    const dolomiteAmmFactory = new DolomiteAmmFactory(this.contracts);

    for (let i = path.length - 1; i > 0; i -= 1) {
      const pairAddress = await dolomiteAmmFactory.getPair(path[i], path[i - 1]);
      const pair = new DolomiteAmmPair(this.contracts, this.contracts.getDolomiteAmmPair(pairAddress));
      const { reserve0, reserve1 } = await pair.getReservesWei();
      const token0 = path[i - 1] < path[i] ? path[i - 1] : path[i];
      amounts[i - 1] = this.getDolomiteAmmAmountInWithReserves(
        amounts[i],
        token0 === path[i - 1] ? reserve0 : reserve1,
        token0 === path[i] ? reserve0 : reserve1,
      );
    }

    return amounts[0];
  }

  public getDolomiteAmmAmountInWithReserves(
    amountOut: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
  ): BigNumber {
    const numerator = reserveIn.times(amountOut).times('1000');
    const denominator = reserveOut.minus(amountOut).times('997');
    return numerator.dividedToIntegerBy(denominator).plus('1');
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

  public async swapExactTokensForTokensAndModifyPosition(
    accountNumber: Integer,
    amountIn: Integer,
    amountOutMin: Integer,
    tokenPath: address[],
    depositToken: address,
    isPositiveMarginDeposit: boolean,
    marginDeposit: Integer,
    expiryTimeDelta: Integer,
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const createAmount = (value: Integer) => {
      return {
        sign: true,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: value.toFixed(0),
      };
    };

    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.swapExactTokensForTokensAndModifyPosition(
        {
          tokenPath,
          depositToken,
          isPositiveMarginDeposit,
          accountNumber: accountNumber.toFixed(0),
          amountIn: createAmount(amountIn),
          amountOut: createAmount(amountOutMin),
          marginDeposit: marginDeposit.toFixed(0),
          expiryTimeDelta: expiryTimeDelta.toFixed(0),
        },
        deadline.toFixed(0),
      ),
      options,
    );
  }

  public async swapTokensForExactTokens(
    accountNumber: Integer,
    amountInMax: Integer,
    amountOut: Integer,
    tokenPath: address[],
    deadline: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.dolomiteAmmRouterProxy.methods.swapTokensForExactTokens(
        accountNumber.toFixed(0),
        amountInMax.toFixed(0),
        amountOut.toFixed(0),
        tokenPath,
        deadline.toFixed(0),
      ),
      options,
    );
  }
}
