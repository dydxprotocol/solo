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

import { Provider } from 'web3/providers';
import { Contracts } from './lib/Contracts';
import { EVM } from './lib/EVM';
import { Transaction } from './modules/transact/Transaction';
import { Token } from './modules/Token';

export class Solo {
  public contracts: Contracts;
  public evm: EVM;
  public transaction: Transaction;
  public token: Token;

  constructor(
    provider: Provider,
    networkId: number,
  ) {
    this.contracts = new Contracts(provider, networkId);
    this.evm = new EVM(provider);
    this.transaction = new Transaction(this.contracts, networkId);
    this.token = new Token(this.contracts);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.contracts.setProvider(provider, networkId);
    this.evm.setProvider(provider);
    this.transaction.setNetworkId(networkId);
  }
}
