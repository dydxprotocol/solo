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
import { PromiEvent, TransactionReceipt, Transaction } from 'web3-core';
import { Block } from 'web3-eth';
import { SoloMargin } from '../../build/wrappers/SoloMargin';
import { TestSoloMargin } from '../../build/wrappers/TestSoloMargin';
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { Expiry } from '../../build/wrappers/Expiry';
import {
  PayableProxyForSoloMargin as PayableProxy,
} from '../../build/wrappers/PayableProxyForSoloMargin';
import { PolynomialInterestSetter } from '../../build/wrappers/PolynomialInterestSetter';
import { WETH9 as Weth } from '../../build/wrappers/WETH9';
import { TestToken } from '../../build/wrappers/TestToken';
import { TestLib } from '../../build/wrappers/TestLib';
import { TestAutoTrader } from '../../build/wrappers/TestAutoTrader';
import { TestCallee } from '../../build/wrappers/TestCallee';
import { TestExchangeWrapper } from '../../build/wrappers/TestExchangeWrapper';
import { TestPriceOracle } from '../../build/wrappers/TestPriceOracle';
import { TestInterestSetter } from '../../build/wrappers/TestInterestSetter';
import { TestPolynomialInterestSetter } from '../../build/wrappers/TestPolynomialInterestSetter';
import soloMarginJson from '../../build/published_contracts/SoloMargin.json';
import testSoloMarginJson from '../../build/published_contracts/TestSoloMargin.json';
import erc20Json from '../../build/published_contracts/IErc20.json';
import expiryJson from '../../build/published_contracts/Expiry.json';
import payableProxyJson from '../../build/published_contracts/PayableProxyForSoloMargin.json';
import polynomialInterestSetterJson
  from '../../build/published_contracts/PolynomialInterestSetter.json';
import wethJson from '../../build/published_contracts/Weth.json';
import tokenAJson from '../../build/published_contracts/TokenA.json';
import tokenBJson from '../../build/published_contracts/TokenB.json';
import tokenCJson from '../../build/published_contracts/TokenC.json';
import erroringTokenJson from '../../build/published_contracts/ErroringToken.json';
import omiseTokenJson from '../../build/published_contracts/OmiseToken.json';
import testLibJson from '../../build/published_contracts/TestLib.json';
import testAutoTraderJson from '../../build/published_contracts/TestAutoTrader.json';
import testCalleeJson from '../../build/published_contracts/TestCallee.json';
import testExchangeWrapperJson from '../../build/published_contracts/TestExchangeWrapper.json';
import testPriceOracleJson from '../../build/published_contracts/TestPriceOracle.json';
import testPolynomialInterestSetterJson
  from '../../build/published_contracts/TestPolynomialInterestSetter.json';
import testInterestSetterJson from '../../build/published_contracts/TestInterestSetter.json';
import { SUBTRACT_GAS_LIMIT } from './Constants';
import {
  ContractCallOptions,
  TxResult,
  address,
  SoloOptions,
  ConfirmationType,
  ContractConstantCallOptions,
  Provider,
  TransactionObject,
} from '../types';

interface CallableTransactionObject<T> {
  call(tx?: Transaction, blockNumber?: number): Promise<T>;
}

export class Contracts {
  private networkId: number;
  private blockGasLimit: number;
  private autoGasMultiplier: number;
  private defaultConfirmations: number;
  private confirmationType: ConfirmationType;
  private web3: Web3;
  private defaultGas: string | number;
  private defaultGasPrice: string | number;

  // Contract instances
  public soloMargin: (SoloMargin | TestSoloMargin);
  public erc20: ERC20;
  public expiry: Expiry;
  public payableProxy: PayableProxy;
  public polynomialInterestSetter: PolynomialInterestSetter;
  public weth: Weth;

  // Testing contract instances
  public testSoloMargin: TestSoloMargin;
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public erroringToken: TestToken;
  public omiseToken: TestToken;
  public testLib: TestLib;
  public testAutoTrader: TestAutoTrader;
  public testCallee: TestCallee;
  public testExchangeWrapper: TestExchangeWrapper;
  public testPriceOracle: TestPriceOracle;
  public testPolynomialInterestSetter: TestPolynomialInterestSetter;
  public testInterestSetter: TestInterestSetter;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ) {
    this.web3 = web3;
    this.defaultConfirmations = options.defaultConfirmations;
    this.autoGasMultiplier = options.autoGasMultiplier || 1.5;
    this.confirmationType = options.confirmationType || ConfirmationType.Confirmed;
    this.defaultGas = options.defaultGas;
    this.defaultGasPrice = options.defaultGasPrice;

    // Contracts
    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi as any) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi as any) as ERC20;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi as any) as Expiry;
    this.payableProxy = new this.web3.eth.Contract(payableProxyJson.abi as any) as PayableProxy;
    this.polynomialInterestSetter = new this.web3.eth.Contract(
      polynomialInterestSetterJson.abi as any) as
      PolynomialInterestSetter;
    this.weth = new this.web3.eth.Contract(wethJson.abi as any) as Weth;

    // Testing Contracts
    this.testSoloMargin = new this.web3.eth.Contract(
      testSoloMarginJson.abi as any) as TestSoloMargin;
    if (options.testing) {
      this.soloMargin = this.testSoloMargin;
    }
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi as any) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi as any) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi as any) as TestToken;
    this.erroringToken = new this.web3.eth.Contract(erroringTokenJson.abi as any) as TestToken;
    this.omiseToken = new this.web3.eth.Contract(omiseTokenJson.abi as any) as TestToken;
    this.testLib = new this.web3.eth.Contract(testLibJson.abi as any) as TestLib;
    this.testAutoTrader = new this.web3.eth.Contract(
      testAutoTraderJson.abi as any) as TestAutoTrader;
    this.testCallee = new this.web3.eth.Contract(testCalleeJson.abi as any) as TestCallee;
    this.testExchangeWrapper = new this.web3.eth.Contract(
      testExchangeWrapperJson.abi as any) as TestExchangeWrapper;
    this.testPriceOracle = new this.web3.eth.Contract(
      testPriceOracleJson.abi as any) as TestPriceOracle;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi as any) as TestInterestSetter;
    this.testPolynomialInterestSetter = new this.web3.eth.Contract(
      testPolynomialInterestSetterJson.abi as any) as TestPolynomialInterestSetter;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public setProvider(
    _provider: Provider,
    networkId: number,
  ): void {
    this.networkId = networkId;

    // Contracts
    this.updateContractAddress(
      this.soloMargin,
      soloMarginJson,
      networkId,
    );
    this.updateContractAddress(
      this.erc20,
      erc20Json,
      networkId,
    );
    this.updateContractAddress(
      this.expiry,
      expiryJson,
      networkId,
    );
    this.updateContractAddress(
      this.payableProxy,
      payableProxyJson,
      networkId,
    );
    this.updateContractAddress(
      this.polynomialInterestSetter,
      polynomialInterestSetterJson,
      networkId,
    );
    this.updateContractAddress(
      this.weth,
      wethJson,
      networkId,
    );

    // Test contracts
    this.updateContractAddress(
      this.testSoloMargin,
      testSoloMarginJson,
      networkId,
    );
    this.updateContractAddress(
      this.tokenA,
      tokenAJson,
      networkId,
    );
    this.updateContractAddress(
      this.tokenB,
      tokenBJson,
      networkId,
    );
    this.updateContractAddress(
      this.tokenC,
      tokenCJson,
      networkId,
    );
    this.updateContractAddress(
      this.erroringToken,
      erroringTokenJson,
      networkId,
    );
    this.updateContractAddress(
      this.omiseToken,
      omiseTokenJson,
      networkId,
    );
    this.updateContractAddress(
      this.testLib,
      testLibJson,
      networkId,
    );
    this.updateContractAddress(
      this.testAutoTrader,
      testAutoTraderJson,
      networkId,
    );
    this.updateContractAddress(
      this.testCallee,
      testCalleeJson,
      networkId,
    );
    this.updateContractAddress(
      this.testExchangeWrapper,
      testExchangeWrapperJson,
      networkId,
    );
    this.updateContractAddress(
      this.testPriceOracle,
      testPriceOracleJson,
      networkId,
    );
    this.updateContractAddress(
      this.testPolynomialInterestSetter,
      testPolynomialInterestSetterJson,
      networkId,
    );
    this.updateContractAddress(
      this.testInterestSetter,
      testInterestSetterJson,
      networkId,
    );
  }

  public setDefaultAccount(
    account: address,
  ): void {
    // Contracts
    this.soloMargin.options.from = account;
    this.testSoloMargin.options.from = account;
    this.erc20.options.from = account;
    this.expiry.options.from = account;
    this.payableProxy.options.from = account;
    this.polynomialInterestSetter.options.from = account;
    this.weth.options.from = account;

    // Test Contracts
    this.tokenA.options.from = account;
    this.tokenB.options.from = account;
    this.tokenC.options.from = account;
    this.erroringToken.options.from = account;
    this.omiseToken.options.from = account;
    this.testLib.options.from = account;
    this.testAutoTrader.options.from = account;
    this.testCallee.options.from = account;
    this.testExchangeWrapper.options.from = account;
    this.testPriceOracle.options.from = account;
    this.testPolynomialInterestSetter.options.from = account;
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

    if (!txOptions.gasPrice && this.defaultGasPrice) {
      txOptions.gasPrice = `${this.defaultGasPrice}`;
    }

    if (!options.gas) {
      if (this.defaultGas) {
        txOptions.gas = this.defaultGas;
      } else {
        let gasEstimate: number;

        try {
          gasEstimate = await method.estimateGas(txOptions);
        } catch (error) {
          const data = method.encodeABI();
          const { from, value } = options;
          const to = (method as any)._parent._address;
          error.transactionData = { from, value, data, to };
          throw error;
        }

        const multiplier = autoGasMultiplier || this.autoGasMultiplier;
        const totalGas: number = Math.floor(gasEstimate * multiplier);
        txOptions.gas = totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
      }
    }
    if (!options.chainId) {
      txOptions.chainId = this.networkId;
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

    let hashPromise: Promise<string>;
    let confirmationPromise: Promise<TransactionReceipt>;

    if (t === ConfirmationType.Hash || t === ConfirmationType.Both) {
      hashPromise = new Promise(
        (resolve, reject) => {
          promi.on('error', (error: Error) => {
            if (receivedOutcome === OUTCOMES.INITIAL) {
              receivedOutcome = OUTCOMES.REJECTED;
              reject(error);
              const anyPromi = promi as any;
              anyPromi.off();
            }
          });

          promi.on('transactionHash', (txHash: string) => {
            if (receivedOutcome === OUTCOMES.INITIAL) {
              receivedOutcome = OUTCOMES.RESOLVED;
              resolve(txHash);
              if (t !== ConfirmationType.Both) {
                const anyPromi = promi as any;
                anyPromi.off();
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
            if (
              (t === ConfirmationType.Confirmed || receivedOutcome === OUTCOMES.RESOLVED)
              && confirmationOutcome === OUTCOMES.INITIAL
            ) {
              confirmationOutcome = OUTCOMES.REJECTED;
              reject(error);
              const anyPromi = promi as any;
              anyPromi.off();
            }
          });

          const desiredConf = confirmations || this.defaultConfirmations;
          if (desiredConf) {
            promi.on('confirmation', (confNumber: number, receipt: TransactionReceipt) => {
              if (confNumber >= desiredConf) {
                if (confirmationOutcome === OUTCOMES.INITIAL) {
                  confirmationOutcome = OUTCOMES.RESOLVED;
                  resolve(receipt);
                  const anyPromi = promi as any;
                  anyPromi.off();
                }
              }
            });
          } else {
            promi.on('receipt', (receipt: TransactionReceipt) => {
              confirmationOutcome = OUTCOMES.RESOLVED;
              resolve(receipt);
              const anyPromi = promi as any;
              anyPromi.off();
            });
          }
        },
      );
    }

    if (t === ConfirmationType.Hash) {
      const transactionHash = await hashPromise;
      return { transactionHash };
    }

    if (t === ConfirmationType.Confirmed) {
      return confirmationPromise;
    }

    const transactionHash = await hashPromise;

    return {
      transactionHash,
      confirmation: confirmationPromise,
    };
  }

  public async callConstantContractFunction<T>(
    method: TransactionObject<T>,
    options: ContractConstantCallOptions = {},
  ): Promise<T> {
    const m2 = method as CallableTransactionObject<T>;
    const { blockNumber, ...txOptions } = options;
    return m2.call(txOptions, blockNumber);
  }

  private async setGasLimit(): Promise<void> {
    const block: Block = await this.web3.eth.getBlock('latest');
    this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT;
  }

  private updateContractAddress(
    contract: any,
    contractJson: any,
    networkId: number,
  ): void {
    contract.options.address = contractJson.networks[networkId]
      && contractJson.networks[networkId].address;
  }
}
