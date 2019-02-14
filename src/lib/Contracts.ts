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
import { TestSoloMargin } from '../../build/wrappers/TestSoloMargin';
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { Expiry } from '../../build/wrappers/Expiry';
import {
  PayableProxyForSoloMargin as PayableProxy,
} from '../../build/wrappers/PayableProxyForSoloMargin';
import { TestToken } from '../../build/wrappers/TestToken';
import { TestAutoTrader } from '../../build/wrappers/TestAutoTrader';
import { TestCallee } from '../../build/wrappers/TestCallee';
import { TestExchangeWrapper } from '../../build/wrappers/TestExchangeWrapper';
import { TestPriceOracle } from '../../build/wrappers/TestPriceOracle';
import { TestInterestSetter } from '../../build/wrappers/TestInterestSetter';
import soloMarginJson from '../../build/published_contracts/SoloMargin.json';
import testSoloMarginJson from '../../build/published_contracts/TestSoloMargin.json';
import erc20Json from '../../build/published_contracts/IErc20.json';
import expiryJson from '../../build/published_contracts/Expiry.json';
import payableProxyJson from '../../build/published_contracts/PayableProxyForSoloMargin.json';
import tokenAJson from '../../build/published_contracts/TokenA.json';
import tokenBJson from '../../build/published_contracts/TokenB.json';
import tokenCJson from '../../build/published_contracts/TokenC.json';
import testAutoTraderJson from '../../build/published_contracts/TestAutoTrader.json';
import testCalleeJson from '../../build/published_contracts/TestCallee.json';
import testExchangeWrapperJson from '../../build/published_contracts/TestExchangeWrapper.json';
import testPriceOracleJson from '../../build/published_contracts/TestPriceOracle.json';
import testInterestSetterJson from '../../build/published_contracts/TestInterestSetter.json';
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
  private defaultGas: string | number;
  private defaultGasPrice: string | number;

  // Contract instances
  public soloMargin: (SoloMargin | TestSoloMargin);
  public erc20: ERC20;
  public expiry: Expiry;
  public payableProxy: PayableProxy;

  // Testing contract instances
  public testSoloMargin: TestSoloMargin;
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public testAutoTrader: TestAutoTrader;
  public testCallee: TestCallee;
  public testExchangeWrapper: TestExchangeWrapper;
  public testPriceOracle: TestPriceOracle;
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
    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
    this.payableProxy = new this.web3.eth.Contract(payableProxyJson.abi) as PayableProxy;

    // Testing Contracts
    this.testSoloMargin = new this.web3.eth.Contract(testSoloMarginJson.abi) as TestSoloMargin;
    if (options.testing) {
      this.soloMargin = this.testSoloMargin;
    }
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;
    this.testAutoTrader = new this.web3.eth.Contract(testAutoTraderJson.abi) as TestAutoTrader;
    this.testCallee = new this.web3.eth.Contract(testCalleeJson.abi) as TestCallee;
    this.testExchangeWrapper = new this.web3.eth.Contract(
      testExchangeWrapperJson.abi) as TestExchangeWrapper;
    this.testPriceOracle = new this.web3.eth.Contract(testPriceOracleJson.abi) as TestPriceOracle;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi) as TestInterestSetter;

    this.soloMargin = this.fixSoloMarginEventSignatures(this.soloMargin);
    this.testSoloMargin = this.fixSoloMarginEventSignatures(this.testSoloMargin);

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.networkId = networkId;
    this.soloMargin.setProvider(provider);

    // Contracts
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
      this.payableProxy,
      payableProxyJson,
      provider,
      networkId,
    );

    // Test contracts
    this.setContractProvider(
      this.testSoloMargin,
      testSoloMarginJson,
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
      this.testAutoTrader,
      testAutoTraderJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.testCallee,
      testCalleeJson,
      provider,
      networkId,
    );
    this.setContractProvider(
      this.testExchangeWrapper,
      testExchangeWrapperJson,
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
    // Contracts
    this.soloMargin.options.from = account;
    this.testSoloMargin.options.from = account;
    this.erc20.options.from = account;
    this.expiry.options.from = account;
    this.payableProxy.options.from = account;

    // Test Contracts
    this.tokenA.options.from = account;
    this.tokenB.options.from = account;
    this.tokenC.options.from = account;
    this.testAutoTrader.options.from = account;
    this.testCallee.options.from = account;
    this.testExchangeWrapper.options.from = account;
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

    if (!txOptions.gasPrice && this.defaultGasPrice) {
      txOptions.gasPrice = this.defaultGasPrice;
    }

    if (!options.gas) {
      if (this.defaultGas) {
        txOptions.gas = this.defaultGas;
      } else {
        let gasEstimate: number;

        try {
          gasEstimate = await method.estimateGas(options);
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

  private fixSoloMarginEventSignatures(contract) {
    contract.options.jsonInterface.forEach((e, i) => {
      if (e.type !== 'event') {
        return;
      }

      let signature: string;

      switch (e.name) {
        case 'LogIndexUpdate': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogIndexUpdate(uint256,Interest.Index)',
          );
          break;
        }
        case 'LogDeposit': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogDeposit(address,uint256,uint256,BalanceUpdate,address)',
          );
          break;
        }
        case 'LogWithdraw': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogWithdraw(address,uint256,uint256,BalanceUpdate,address)',
          );
          break;
        }
        case 'LogTransfer': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogTransfer(address,uint256,address,uint256,uint256,BalanceUpdate,BalanceUpdate)',
          );
          break;
        }
        case 'LogBuy': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogBuy(address,uint256,uint256,uint256,BalanceUpdate,BalanceUpdate,address)',
          );
          break;
        }
        case 'LogSell': {
          signature = this.web3.eth.abi.encodeEventSignature(
            'LogSell(address,uint256,uint256,uint256,BalanceUpdate,BalanceUpdate,address)',
          );
          break;
        }
        case 'LogTrade': {
          signature = this.web3.eth.abi.encodeEventSignature(
            /* tslint:disable-next-line */
            'LogSell(address,uint256,address,uint256,uint256,uint256,BalanceUpdate,BalanceUpdate,BalanceUpdate,BalanceUpdate,address)',
          );
          break;
        }
        case 'LogCall': {
          signature = this.web3.eth.abi.encodeEventSignature(
            /* tslint:disable-next-line */
            'LogSell(address,uint256,address)',
          );
          break;
        }
        case 'LogLiquidate': {
          signature = this.web3.eth.abi.encodeEventSignature(
            /* tslint:disable-next-line */
            'LogLiquidate(address,uint256,address,uint256,uint256,uint256,BalanceUpdate,BalanceUpdate,BalanceUpdate,BalanceUpdate)',
          );
          break;
        }
        case 'LogVaporize': {
          signature = this.web3.eth.abi.encodeEventSignature(
            /* tslint:disable-next-line */
            'LogVaporize(address,uint256,address,uint256,uint256,uint256,BalanceUpdate,BalanceUpdate,BalanceUpdate)',
          );
          break;
        }
      }

      if (signature) {
        contract.options.jsonInterface[i].signature = signature;
      }
    });

    return contract;
  }
}
