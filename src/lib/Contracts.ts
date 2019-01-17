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
import PromiEvent from 'web3/promiEvent';
import { TransactionReceipt } from 'web3/types';
import { TransactionObject, Block } from 'web3/eth/types';
import { SoloMargin } from '../../build/wrappers/SoloMargin';
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { Expiry } from '../../build/wrappers/Expiry';
import { TestToken } from '../../build/wrappers/TestToken';
import { TestPriceOracle } from '../../build/wrappers/TestPriceOracle';
import { TestInterestSetter } from '../../build/wrappers/TestInterestSetter';
import soloMarginJson from '../../build/contracts/SoloMargin.json';
import erc20Json from '../../build/contracts/IErc20.json';
import expiryJson from '../../build/contracts/Expiry.json';
import tokenAJson from '../../build/contracts/TokenA.json';
import tokenBJson from '../../build/contracts/TokenB.json';
import tokenCJson from '../../build/contracts/TokenC.json';
import testPriceOracleJson from '../../build/contracts/TestPriceOracle.json';
import testInterestSetterJson from '../../build/contracts/TestInterestSetter.json';
import { SUBTRACT_GAS_LIMIT } from './Constants';
import {
  ContractCallOptions,
  TxResult,
  address,
  SoloOptions,
  ConfirmationType,
} from '../types';

export class Contracts {
  private networkId: number;
  private blockGasLimit: number;
  private autoGasMultiplier: number;
  private defaultConfirmations: number;
  private confirmationType: ConfirmationType;
  private web3: Web3;

  // Contract instances
  public soloMargin: SoloMargin;
  public erc20: ERC20;
  public expiry: Expiry;

  // Testing contract instances
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public testPriceOracle: TestPriceOracle;
  public testInterestSetter: TestInterestSetter;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ) {
    this.web3 = web3;
    this.defaultConfirmations = options.defaultConfirmations || 1;
    this.autoGasMultiplier = options.autoGasMultiplier || 1.5;
    this.confirmationType = options.confirmationType || ConfirmationType.Confirmed;

    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;
    this.testPriceOracle = new this.web3.eth.Contract(testPriceOracleJson.abi) as TestPriceOracle;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi) as TestInterestSetter;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
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
    this.setContractProvider(
      this.testPriceOracle,
      testPriceOracleJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.testInterestSetter,
      testInterestSetterJson,
      provider,
      networkId,
    );
  }

  public setDefaultAccount(
    account: address,
  ): void {
    this.soloMargin.options.from = account;
    this.erc20.options.from = account;
    this.expiry.options.from = account;
    this.tokenA.options.from = account;
    this.tokenB.options.from = account;
    this.tokenC.options.from = account;
    this.testPriceOracle.options.from = account;
    this.testInterestSetter.options.from = account;
  }

  public async callContractFunction<T>(
    method: TransactionObject<T>,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const { confirmations, confirmationType, autoGasMultiplier, ...txOptions } = options;

    if (!this.blockGasLimit) {
      await this.setGasLimit();
    }

    if (!options.gas) {
      const gasEstimate: number = await method.estimateGas(options);
      const multiplier = autoGasMultiplier || this.autoGasMultiplier;
      const totalGas: number = Math.floor(gasEstimate * multiplier);
      options.gas = totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
    }
    if (!options.chainId) {
      options.chainId = this.networkId;
    }

    const promi: PromiEvent<T> = method.send(txOptions);

    const OUTCOMES = {
      INITIAL: 0,
      RESOLVED: 1,
      REJECTED: 2,
    };

    let receivedOutcome = OUTCOMES.INITIAL;
    let confirmationOutcome = OUTCOMES.INITIAL;

    const t = confirmationType
      || (confirmationType === undefined && this.confirmationType);

    let receivedPromise: Promise<string>;
    let confirmationPromise: Promise<TransactionReceipt>;
    let confirmationRejection: () => void;

    if (t === ConfirmationType.Received || t === ConfirmationType.Both) {
      receivedPromise = new Promise(
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

              if (confirmationRejection) {
                confirmationRejection();
              }
            }
          });
        },
      );
    }

    if (t === ConfirmationType.Confirmed || t === ConfirmationType.Both) {
      confirmationPromise = new Promise(
        (resolve, reject) => {
          promi.on('error', (error: Error) => {
            if (t === ConfirmationType.Both && receivedOutcome === OUTCOMES.INITIAL) {
              confirmationRejection = () => reject(error);
              confirmationOutcome = OUTCOMES.REJECTED;
            } else if (
              (t === ConfirmationType.Confirmed || receivedOutcome === OUTCOMES.RESOLVED)
              && confirmationOutcome === OUTCOMES.INITIAL
            ) {
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
    }

    if (t === ConfirmationType.Received) {
      const transactionHash = await receivedPromise;
      return { transactionHash };
    }

    if (t === ConfirmationType.Confirmed) {
      const receipt = await confirmationPromise;
      return { receipt };
    }

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
