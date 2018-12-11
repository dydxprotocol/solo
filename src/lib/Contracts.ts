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
import Web3 from 'web3';
import { SoloMargin } from '../../build/wrappers/SoloMargin';
import { abi as soloMarginABI } from '../../build/contracts/SoloMargin.json';
import { TransactionObject, Block } from 'web3/eth/types';
import { TransactionReceipt } from 'web3/types';
import { ContractCallOptions } from '../types';
import { SUBTRACT_GAS_LIMIT } from './Constants';
import PromiEvent from 'web3/promiEvent';

export class Contracts {
  private networkId: number;
  private blockGasLimit: number;
  private autoGasMultiplier: number = 1.5;
  private defaultConfirmations: number = 1;
  private waitForConfirmation: boolean = true;
  private web3: Web3;

  public soloMargin: SoloMargin;

  constructor(
    provider: Provider,
    networkId: number,
  ) {
    this.web3 = new Web3();
    this.soloMargin = new this.web3.eth.Contract(soloMarginABI) as SoloMargin;
    this.setProvider(provider, networkId);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.web3.setProvider(provider);
    this.networkId = networkId;
    this.soloMargin.setProvider(provider);
  }

  public async callContractFunction<T>(
    method: TransactionObject<T>,
    options: ContractCallOptions = {},
  ): Promise<string | TransactionReceipt> {
    if (!this.blockGasLimit) await this.setGasLimit();
    if (!options.gas) {
      const gasEstimate: number = await method.estimateGas(options);
      const totalGas: number = Math.floor(gasEstimate * this.autoGasMultiplier);
      options.gas = totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
    }
    if (!options.chainId) {
      options.chainId = this.networkId;
    }

    const { waitForConfirmation, confirmations, ...txOptions } = options;

    const promi: PromiEvent<T> = method.send(txOptions);

    return new Promise((resolve, reject) => {
      promi.on('error', error => reject(error));

      if (
        waitForConfirmation === undefined && this.waitForConfirmation
        || !waitForConfirmation
      ) {
        promi.on('transactionHash', (txHash: string) => resolve(txHash));
      } else {
        promi.on('confirmation', (confNumber: number, receipt: TransactionReceipt) => {
          const desiredConf = confirmations || this.defaultConfirmations;
          if (confNumber >= desiredConf) {
            resolve(receipt);
          }
        });
      }
    });
  }

  private async setGasLimit(): Promise<void> {
    const block: Block = await this.web3.eth.getBlock('latest');
    this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT;
  }
}
