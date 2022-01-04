/*

    Copyright 2019 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

import Web3 from 'web3';
import { Provider } from 'web3/providers';
import { Contracts } from './lib/Contracts';
import { Interest } from './lib/Interest';
import { Operation } from './modules/operate/Operation';
import { Token } from './modules/Token';
import { ExpiryV2 } from './modules/ExpiryV2';
import { Weth } from './modules/Weth';
import { Admin } from './modules/Admin';
import { Getters } from './modules/Getters';
import { LiquidatorProxy } from './modules/LiquidatorProxy';
import { Logs } from './modules/Logs';
import { SignedOperations } from './modules/SignedOperations';
import { Permissions } from './modules/Permissions';
import { StandardActions } from './modules/StandardActions';
import { WalletLogin } from './modules/WalletLogin';
import { ChainlinkPriceOracleV1 } from './modules/oracles/ChainlinkPriceOracleV1';
import { address, EthereumAccount, Index, Networks, SoloOptions, } from './types';
import { AmmRebalancerProxy } from './modules/AmmRebalancerProxy';
import { DolomiteAmmRouterProxy } from './modules/DolomiteAmmRouterProxy';
import { LiquidatorProxyWithAmm } from './modules/LiquidatorProxyWithAmm';
import { DolomiteAmmFactory } from './modules/DolomiteAmmFactory';
import { BigNumber } from './index';
import { INTEGERS } from './lib/Constants';
import { valueToInteger } from './lib/Helpers';

export class Solo {
  public contracts: Contracts;
  public interest: Interest;
  public token: Token;
  public expiryV2: ExpiryV2;
  public chainlinkPriceOracle: ChainlinkPriceOracleV1;
  public weth: Weth;
  public web3: Web3;
  public admin: Admin;
  public getters: Getters;
  public signedOperations: SignedOperations;
  public liquidatorProxy: LiquidatorProxy;
  public liquidatorProxyWithAmm: LiquidatorProxyWithAmm;
  public dolomiteAmmFactory: DolomiteAmmFactory;
  public dolomiteAmmRouterProxy: DolomiteAmmRouterProxy;
  public ammRebalancerProxy: AmmRebalancerProxy;
  public permissions: Permissions;
  public logs: Logs;
  public operation: Operation;
  public standardActions: StandardActions;
  public walletLogin: WalletLogin;
  function;

  constructor(
    provider: Provider | string,
    networkId: number = Networks.MAINNET,
    options: SoloOptions = {},
  ) {
    let realProvider: Provider;
    if (typeof provider === 'string') {
      realProvider = new Web3.providers.HttpProvider(
        provider,
        options.ethereumNodeTimeout || 10000,
      );
    } else {
      realProvider = provider;
    }

    this.web3 = new Web3(realProvider);
    if (options.defaultAccount) {
      this.web3.eth.defaultAccount = options.defaultAccount;
    }

    this.contracts = this.createContractsModule(
      realProvider,
      networkId,
      this.web3,
      options,
    );
    this.interest = new Interest(networkId);
    this.token = new Token(this.contracts);
    this.expiryV2 = new ExpiryV2(this.contracts);
    this.chainlinkPriceOracle = new ChainlinkPriceOracleV1(this.contracts);
    this.weth = new Weth(this.contracts, this.token);
    this.admin = new Admin(this.contracts);
    this.getters = new Getters(this.contracts);
    this.signedOperations = new SignedOperations(
      this.contracts,
      this.web3,
      networkId,
    );
    this.liquidatorProxy = new LiquidatorProxy(this.contracts);
    this.liquidatorProxyWithAmm = new LiquidatorProxyWithAmm(this.contracts);
    this.ammRebalancerProxy = new AmmRebalancerProxy(this.contracts);
    this.dolomiteAmmFactory = new DolomiteAmmFactory(this.contracts);
    this.dolomiteAmmRouterProxy = new DolomiteAmmRouterProxy(this.contracts);
    this.permissions = new Permissions(this.contracts);
    this.logs = new Logs(this.contracts, this.web3);
    this.operation = new Operation(
      this.contracts,
      networkId,
    );
    this.standardActions = new StandardActions(this.operation, this.contracts);
    this.walletLogin = new WalletLogin(this.web3, networkId);

    if (options.accounts) {
      options.accounts.forEach(a => this.loadAccount(a));
    }
  }

  public setProvider(provider: Provider, networkId: number): void {
    this.web3.setProvider(provider);
    this.contracts.setProvider(provider, networkId);
    this.interest.setNetworkId(networkId);
    this.operation.setNetworkId(networkId);
  }

  public setDefaultAccount(account: address): void {
    this.web3.eth.defaultAccount = account;
    this.contracts.setDefaultAccount(account);
  }

  public getDefaultAccount(): address {
    return this.web3.eth.defaultAccount;
  }

  // ============ Helper Functions ============

  public loadAccount(account: EthereumAccount): void {
    const newAccount = this.web3.eth.accounts.wallet.add(account.privateKey);

    if (
      !newAccount ||
      (account.address &&
        account.address.toLowerCase() !== newAccount.address.toLowerCase())
    ) {
      throw new Error(`Loaded account address mismatch.
        Expected ${account.address}, got ${
        newAccount ? newAccount.address : null
      }`);
    }
  }

  public getMarketTokenAddress(marketId: BigNumber): Promise<address> {
    return this.contracts.soloMargin.methods
      .getMarketTokenAddress(marketId.toFixed(0))
      .call();
  }

  public getMarketIdByTokenAddress(tokenAddress: address): Promise<BigNumber> {
    return this.contracts.soloMargin.methods
      .getMarketIdByTokenAddress(tokenAddress)
      .call()
      .then(resultString => new BigNumber(resultString));
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

    for (let i = 0; i < path.length - 1; i += 1) {
      const { reserveIn, reserveOut } = await this.getDolomiteAmmReserves(
        path[i],
        path[i + 1],
      );
      amounts[i + 1] = this.getDolomiteAmmAmountOutWithReserves(
        amounts[i],
        reserveIn,
        reserveOut,
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

    for (let i = path.length - 1; i > 0; i -= 1) {
      const { reserveIn, reserveOut } = await this.getDolomiteAmmReserves(
        path[i - 1],
        path[i],
      );
      amounts[i - 1] = this.getDolomiteAmmAmountInWithReserves(
        amounts[i],
        reserveIn,
        reserveOut,
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

  public getPartialRoundHalfUp(
    target: BigNumber,
    numerator: BigNumber,
    denominator: BigNumber,
  ): BigNumber {
    const value = target.abs().times(numerator);
    const halfUp = value.mod(denominator).gte(denominator.minus(1).dividedToIntegerBy(2).plus(1))
    ? 1
    : 0;
    const result = value.dividedToIntegerBy(denominator).plus(halfUp);

    if (target.lt(INTEGERS.ZERO)) {
      return result.negated();
    }
    return result;
  }

  public getPartialRoundUp(
    target: BigNumber,
    numerator: BigNumber,
    denominator: BigNumber,
  ): BigNumber {
    const result = target
      .abs()
      .times(numerator)
      .minus('1')
      .dividedToIntegerBy(denominator)
      .plus('1');
    if (target.lt(INTEGERS.ZERO)) {
      return result.negated();
    }

    return result;
  }

  public weiToPar(valueWei: BigNumber, index: Index): BigNumber {
    if (valueWei.lt(INTEGERS.ZERO)) {
      return this.getPartialRoundUp(
        valueWei,
        INTEGERS.INTEREST_RATE_BASE,
        index.borrow.times(INTEGERS.INTEREST_RATE_BASE),
      );
    }

    return valueWei.dividedToIntegerBy(index.supply);
  }

  public parToWei(valueWei: BigNumber, index: Index): BigNumber {
    const base = INTEGERS.INTEREST_RATE_BASE;
    if (valueWei.lt(INTEGERS.ZERO)) {
      return this.getPartialRoundUp(
        valueWei,
        index.borrow.times(base),
        base,
      );
    }

    return this.getPartialRoundHalfUp(
      valueWei,
      index.supply.times(base),
      base,
    );
  }

  public async getMarketWei(
    owner: address,
    accountNumber: BigNumber,
    marketId: BigNumber,
  ): Promise<BigNumber> {
    const result = await this.contracts.soloMargin.methods
      .getAccountWei(
        { owner, number: accountNumber.toFixed() },
        marketId.toFixed(),
      )
      .call();

    return valueToInteger(result);
  }

  protected createContractsModule(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ): any {
    return new Contracts(provider, networkId, web3, options);
  }

  private async getDolomiteAmmReserves(
    tokenIn: address,
    tokenOut: address,
  ): Promise<{ reserveIn: BigNumber; reserveOut: BigNumber }> {
    const pairAddress = await this.contracts.dolomiteAmmFactory.methods
      .getPair(tokenIn, tokenOut)
      .call();
    const pair = this.contracts.getDolomiteAmmPair(pairAddress);

    const { _reserve0, _reserve1 } = await pair.methods.getReservesWei().call();
    const token0 = await pair.methods.token0().call();

    let reserveIn: BigNumber;
    let reserveOut: BigNumber;
    if (token0.toLowerCase() === tokenIn.toLowerCase()) {
      reserveIn = new BigNumber(_reserve0);
      reserveOut = new BigNumber(_reserve1);
    } else {
      reserveIn = new BigNumber(_reserve1);
      reserveOut = new BigNumber(_reserve0);
    }

    return { reserveIn, reserveOut };
  }
}
