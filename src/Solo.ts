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
import { FinalSettlement } from './modules/FinalSettlement';
import { Oracle } from './modules/Oracle';
import { Weth } from './modules/Weth';
import { Admin } from './modules/Admin';
import { Getters } from './modules/Getters';
import { LimitOrders } from './modules/LimitOrders';
import { StopLimitOrders } from './modules/StopLimitOrders';
import { CanonicalOrders } from './modules/CanonicalOrders';
import { LiquidatorProxy } from './modules/LiquidatorProxy';
import { Logs } from './modules/Logs';
import { SignedOperations } from './modules/SignedOperations';
import { Permissions } from './modules/Permissions';
import { Api } from './modules/Api';
import { Websocket } from './modules/Websocket';
import { StandardActions } from './modules/StandardActions';
import { WalletLogin } from './modules/WalletLogin';
import { SignOffChainAction } from './modules/SignOffChainAction';
import { SoloOptions, EthereumAccount, address, Networks } from './types';

export class Solo {
  public contracts: Contracts;
  public interest: Interest;
  public token: Token;
  public expiryV2: ExpiryV2;
  public finalSettlement: FinalSettlement;
  public oracle: Oracle;
  public weth: Weth;
  public web3: Web3;
  public admin: Admin;
  public getters: Getters;
  public limitOrders: LimitOrders;
  public stopLimitOrders: StopLimitOrders;
  public canonicalOrders: CanonicalOrders;
  public signedOperations: SignedOperations;
  public liquidatorProxy: LiquidatorProxy;
  public permissions: Permissions;
  public logs: Logs;
  public operation: Operation;
  public api: Api;
  public websocket: Websocket;
  public standardActions: StandardActions;
  public walletLogin: WalletLogin;
  public signOffChainAction: SignOffChainAction;

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

    this.contracts = this.createContractsModule(realProvider, networkId, this.web3, options);
    this.interest = new Interest(networkId);
    this.token = new Token(this.contracts);
    this.expiryV2 = new ExpiryV2(this.contracts);
    this.finalSettlement = new FinalSettlement(this.contracts);
    this.oracle = new Oracle(this.contracts);
    this.weth = new Weth(this.contracts, this.token);
    this.admin = new Admin(this.contracts);
    this.getters = new Getters(this.contracts);
    this.limitOrders = new LimitOrders(this.contracts, this.web3, networkId);
    this.stopLimitOrders = new StopLimitOrders(this.contracts, this.web3, networkId);
    this.canonicalOrders = new CanonicalOrders(this.contracts, this.web3, networkId);
    this.signedOperations = new SignedOperations(this.contracts, this.web3, networkId);
    this.liquidatorProxy = new LiquidatorProxy(this.contracts);
    this.permissions = new Permissions(this.contracts);
    this.logs = new Logs(this.contracts, this.web3);
    this.operation = new Operation(
      this.contracts,
      this.limitOrders,
      this.stopLimitOrders,
      this.canonicalOrders,
      networkId,
    );
    this.api = new Api(
      this.canonicalOrders,
      options.apiEndpoint,
      options.apiTimeout,
    );
    this.websocket = new Websocket(
      options.wsTimeout,
      options.wsEndpoint,
      options.wsOrigin,
    );
    this.standardActions = new StandardActions(this.operation, this.contracts);
    this.walletLogin = new WalletLogin(this.web3, networkId);
    this.signOffChainAction = new SignOffChainAction(this.web3, networkId);

    if (options.accounts) {
      options.accounts.forEach(a => this.loadAccount(a));
    }
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.web3.setProvider(provider);
    this.contracts.setProvider(provider, networkId);
    this.interest.setNetworkId(networkId);
    this.operation.setNetworkId(networkId);
  }

  public setDefaultAccount(
    account: address,
  ): void {
    this.web3.eth.defaultAccount = account;
    this.contracts.setDefaultAccount(account);
  }

  public getDefaultAccount(): address {
    return this.web3.eth.defaultAccount;
  }

  public loadAccount(account: EthereumAccount): void {
    const newAccount = this.web3.eth.accounts.wallet.add(
      account.privateKey,
    );

    if (
      !newAccount
      || (
        account.address
        && account.address.toLowerCase() !== newAccount.address.toLowerCase()
      )
    ) {
      throw new Error(`Loaded account address mismatch.
        Expected ${account.address}, got ${newAccount ? newAccount.address : null}`);
    }
  }

  // ============ Helper Functions ============

  protected createContractsModule(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ): any {
    return new Contracts(provider, networkId, web3, options);
  }
}
