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
import { Admin } from './modules/Admin';
import { AmmRebalancerProxy } from './modules/AmmRebalancerProxy';
import { DolomiteAmmFactory } from './modules/DolomiteAmmFactory';
import { DolomiteAmmPair } from './modules/DolomiteAmmPair';
import { DolomiteAmmRouterProxy } from './modules/DolomiteAmmRouterProxy';
import { Expiry } from './modules/Expiry';
import { Getters } from './modules/Getters';
import { LiquidatorProxy } from './modules/LiquidatorProxy';
import { LiquidatorProxyWithAmm } from './modules/LiquidatorProxyWithAmm';
import { Logs } from './modules/Logs';
import { Operation } from './modules/operate/Operation';
import { ChainlinkPriceOracleV1 } from './modules/oracles/ChainlinkPriceOracleV1';
import { OrderMapper } from './modules/OrderMapper';
import { Permissions } from './modules/Permissions';
import { SignedOperations } from './modules/SignedOperations';
import { StandardActions } from './modules/StandardActions';
import { SubgraphAPI } from './modules/SubgraphAPI';
import { Token } from './modules/Token';
import { TransferProxy } from './modules/TransferProxy';
import { WalletLogin } from './modules/WalletLogin';
import { Weth } from './modules/Weth';
import {
  address,
  DolomiteMarginOptions,
  EthereumAccount,
  Networks,
} from './types';

export class DolomiteMargin {
  public contracts: Contracts;
  public api: SubgraphAPI;
  public interest: Interest;
  public token: Token;
  public expiry: Expiry;
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
  public transferProxy: TransferProxy;
  public permissions: Permissions;
  public logs: Logs;
  public operation: Operation;
  public standardActions: StandardActions;
  public walletLogin: WalletLogin;

  constructor(
    provider: Provider | string,
    networkId: number = Networks.MUMBAI,
    options: DolomiteMarginOptions = {},
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
    this.expiry = new Expiry(this.contracts);
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
    this.transferProxy = new TransferProxy(this.contracts);
    this.dolomiteAmmFactory = new DolomiteAmmFactory(this.contracts);
    this.dolomiteAmmRouterProxy = new DolomiteAmmRouterProxy(this.contracts);
    this.permissions = new Permissions(this.contracts);
    this.logs = new Logs(this.contracts, this.web3);
    this.operation = new Operation(
      this.contracts,
      new OrderMapper(this.contracts),
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

  getDolomiteAmmPair(pairAddress: address) {
    return new DolomiteAmmPair(this.contracts, this.contracts.getDolomiteAmmPair(pairAddress));
  }

  protected createContractsModule(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: DolomiteMarginOptions,
  ): any {
    return new Contracts(provider, networkId, web3, options);
  }
}
