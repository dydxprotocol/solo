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
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { Expiry } from '../../build/wrappers/Expiry';
import { TestToken } from '../../build/wrappers/TestToken';
import soloMarginJson from '../../build/contracts/SoloMargin.json';
import erc20Json from '../../build/contracts/IErc20.json';
import expiryJson from '../../build/contracts/Expiry.json';
import tokenAJson from '../../build/contracts/TokenA.json';
import tokenBJson from '../../build/contracts/TokenB.json';
import tokenCJson from '../../build/contracts/TokenC.json';
import { TransactionObject, Block } from 'web3/eth/types';
import { TransactionReceipt } from 'web3/types';
import { ContractCallOptions, TxResult } from '../types';
import { SUBTRACT_GAS_LIMIT } from './Constants';
import PromiEvent from 'web3/promiEvent';

export class Contracts {
  private networkId: number;
  private blockGasLimit: number;
  private autoGasMultiplier: number = 1.5;
  private defaultConfirmations: number = 1;

  public web3: Web3;

  // Contract instances
  public soloMargin: SoloMargin;
  public erc20: ERC20;
  public expiry: Expiry;

  // Testing contract instances
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;

  constructor(
    provider: Provider,
    networkId: number,
  ) {
    this.web3 = new Web3();

    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;

    this.setProvider(provider, networkId);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.web3.setProvider(provider);
    this.networkId = networkId;
    this.soloMargin.setProvider(provider);

    this.setContractProvider(
      this.soloMargin,
      soloMarginJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.erc20,
      erc20Json,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.expiry,
      expiryJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.tokenA,
      tokenAJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.tokenB,
      tokenBJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.tokenC,
      tokenCJson,
      provider,
      networkId,
    );
  }

  public async callContractFunction<T>(
    method: TransactionObject<T>,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    if (!this.blockGasLimit) await this.setGasLimit();
    if (!options.gas) {
      const gasEstimate: number = await method.estimateGas(options);
      const totalGas: number = Math.floor(gasEstimate * this.autoGasMultiplier);
      options.gas = totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
    }
    if (!options.chainId) {
      options.chainId = this.networkId;
    }

    const { confirmations, ...txOptions } = options;

    const promi: PromiEvent<T> = method.send(txOptions);

    const OUTCOMES = {
      INITIAL: 0,
      RESOLVED: 1,
      REJECTED: 2,
    };

    let receivedOutcome = OUTCOMES.INITIAL;
    let confirmationOutcome = OUTCOMES.INITIAL;

    const receivedPromise: Promise<string> = new Promise(
      (resolve, reject) => {
        promi.on('error', (error: Error) => {
          if (receivedOutcome === OUTCOMES.INITIAL) {
            receivedOutcome = OUTCOMES.REJECTED;
            reject(error);
          }
        });

        promi.on('transactionHash', (txHash: string) => {
          if (receivedOutcome === OUTCOMES.INITIAL) {
            receivedOutcome = OUTCOMES.RESOLVED;
            resolve(txHash);
          }
        });
      },
    );

    const confirmationPromise: Promise<TransactionReceipt> = new Promise(
      (resolve, reject) => {
        promi.on('error', (error: Error) => {
          if (receivedOutcome === OUTCOMES.RESOLVED && confirmationOutcome === OUTCOMES.INITIAL) {
            confirmationOutcome = OUTCOMES.REJECTED;
            reject(error);
          }
        });

        promi.on('confirmation', (confNumber: number, receipt: TransactionReceipt) => {
          const desiredConf = confirmations || this.defaultConfirmations;
          if (confNumber >= desiredConf) {
            if (confirmationOutcome === OUTCOMES.INITIAL) {
              resolve(receipt);
            }
          }
        });
      },
    );

    const transactionHash = await receivedPromise;

    return {
      transactionHash,
      confirmation: confirmationPromise,
    };
  }

  private async setGasLimit(): Promise<void> {
    const block: Block = await this.web3.eth.getBlock('latest');
    this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT;
  }

  private setContractProvider(
    contract: any,
    contractJson: any,
    provider: Provider,
    networkId: number,
  ): void {
    contract.setProvider(provider);
    contract.options.address = contractJson.networks[networkId]
      && contractJson.networks[networkId].address;
  }
}
