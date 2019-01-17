/*

    Copyright 2018 dYdX Trading Inc.

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
import { Transaction } from './modules/transact/Transaction';
import { Token } from './modules/Token';
import { Admin } from './modules/Admin';
import { Getters } from './modules/Getters';
import { Testing } from './modules/testing/Testing';
import { SoloOptions, address } from './types';

export class Solo {
  public contracts: Contracts;
  public testing: Testing;
  public transaction: Transaction;
  public token: Token;
  public web3: Web3;
  public admin: Admin;
  public getters: Getters;

  constructor(
    provider: Provider,
    networkId: number,
    options: SoloOptions = {},
  ) {
    this.web3 = new Web3(provider);
    if (options.defaultAccount) {
      this.web3.eth.defaultAccount = options.defaultAccount;
    }

    this.contracts = new Contracts(provider, networkId, this.web3, options);
    this.transaction = new Transaction(this.contracts, networkId);
    this.token = new Token(this.contracts);
    this.testing = new Testing(provider, this.contracts, this.token);
    this.admin = new Admin(this.contracts);
    this.getters = new Getters(this.contracts);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.web3.setProvider(provider);
    this.contracts.setProvider(provider, networkId);
    this.testing.setProvider(provider);
    this.transaction.setNetworkId(networkId);
  }

  public setDefaultAccount(
    account: address,
  ): void {
    this.web3.eth.defaultAccount = account;
    this.contracts.setDefaultAccount(account);
  }
}
