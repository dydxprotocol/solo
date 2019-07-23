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

import BigNumber from 'bignumber.js';
import { Provider } from 'web3/providers';
import Web3 from 'web3';
import PromiEvent from 'web3/promiEvent';
import { TransactionReceipt } from 'web3/types';
import { TransactionObject, Block, Tx } from 'web3/eth/types';

// Contracts
import { SoloMargin } from '../../build/wrappers/SoloMargin';
import { TestSoloMargin } from '../../build/wrappers/TestSoloMargin';
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { IInterestSetter as InterestSetter } from '../../build/wrappers/IInterestSetter';
import { IPriceOracle as PriceOracle } from '../../build/wrappers/IPriceOracle';
import { Expiry } from '../../build/wrappers/Expiry';
import { LimitOrders } from '../../build/wrappers/LimitOrders';
import {
  PayableProxyForSoloMargin as PayableProxy,
} from '../../build/wrappers/PayableProxyForSoloMargin';
import {
  SignedOperationProxy as SignedOperationProxy,
} from '../../build/wrappers/SignedOperationProxy';
import {
  LiquidatorProxyV1ForSoloMargin as LiquidatorProxyV1,
} from '../../build/wrappers/LiquidatorProxyV1ForSoloMargin';
import { PolynomialInterestSetter } from '../../build/wrappers/PolynomialInterestSetter';
import { WethPriceOracle } from '../../build/wrappers/WethPriceOracle';
import { DaiPriceOracle } from '../../build/wrappers/DaiPriceOracle';
import { UsdcPriceOracle } from '../../build/wrappers/UsdcPriceOracle';
import { WETH9 as Weth } from '../../build/wrappers/WETH9';
import { TestToken } from '../../build/wrappers/TestToken';
import { TestLib } from '../../build/wrappers/TestLib';
import { TestAutoTrader } from '../../build/wrappers/TestAutoTrader';
import { TestCallee } from '../../build/wrappers/TestCallee';
import { TestExchangeWrapper } from '../../build/wrappers/TestExchangeWrapper';
import { TestPriceOracle } from '../../build/wrappers/TestPriceOracle';
import { TestMakerOracle } from '../../build/wrappers/TestMakerOracle';
import { TestOasisDex } from '../../build/wrappers/TestOasisDex';
import { TestInterestSetter } from '../../build/wrappers/TestInterestSetter';
import { TestPolynomialInterestSetter } from '../../build/wrappers/TestPolynomialInterestSetter';

// JSON
import soloMarginJson from '../../build/published_contracts/SoloMargin.json';
import testSoloMarginJson from '../../build/published_contracts/TestSoloMargin.json';
import erc20Json from '../../build/published_contracts/IErc20.json';
import interestSetterJson from '../../build/published_contracts/IInterestSetter.json';
import priceOracleJson from '../../build/published_contracts/IPriceOracle.json';
import expiryJson from '../../build/published_contracts/Expiry.json';
import limitOrdersJson from '../../build/published_contracts/LimitOrders.json';
import payableProxyJson from '../../build/published_contracts/PayableProxyForSoloMargin.json';
import signedOperationProxyJson from '../../build/published_contracts/SignedOperationProxy.json';
import liquidatorV1Json from '../../build/published_contracts/LiquidatorProxyV1ForSoloMargin.json';
import polynomialInterestSetterJson
  from '../../build/published_contracts/PolynomialInterestSetter.json';
import wethPriceOracleJson from '../../build/published_contracts/WethPriceOracle.json';
import daiPriceOracleJson from '../../build/published_contracts/DaiPriceOracle.json';
import usdcPriceOracleJson from '../../build/published_contracts/UsdcPriceOracle.json';
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
import testMakerOracleJson from '../../build/published_contracts/TestMakerOracle.json';
import testOasisDexJson from '../../build/published_contracts/TestOasisDex.json';
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
} from '../types';

interface CallableTransactionObject<T> {
  call(tx?: Tx, blockNumber?: number): Promise<T>;
}

export class Contracts {
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
  public interestSetter: InterestSetter;
  public priceOracle: PriceOracle;
  public expiry: Expiry;
  public limitOrders: LimitOrders;
  public payableProxy: PayableProxy;
  public signedOperationProxy: SignedOperationProxy;
  public liquidatorProxyV1: LiquidatorProxyV1;
  public polynomialInterestSetter: PolynomialInterestSetter;
  public wethPriceOracle: WethPriceOracle;
  public daiPriceOracle: DaiPriceOracle;
  public usdcPriceOracle: UsdcPriceOracle;
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
  public testMakerOracle: TestMakerOracle;
  public testOasisDex: TestOasisDex;
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
    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.interestSetter = new this.web3.eth.Contract(interestSetterJson.abi) as InterestSetter;
    this.priceOracle = new this.web3.eth.Contract(priceOracleJson.abi) as PriceOracle;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
    this.limitOrders = new this.web3.eth.Contract(limitOrdersJson.abi) as LimitOrders;
    this.payableProxy = new this.web3.eth.Contract(payableProxyJson.abi) as PayableProxy;
    this.signedOperationProxy = new this.web3.eth.Contract(signedOperationProxyJson.abi) as
      SignedOperationProxy;
    this.liquidatorProxyV1 = new this.web3.eth.Contract(liquidatorV1Json.abi) as
      LiquidatorProxyV1;
    this.polynomialInterestSetter = new this.web3.eth.Contract(polynomialInterestSetterJson.abi) as
      PolynomialInterestSetter;
    this.wethPriceOracle = new this.web3.eth.Contract(wethPriceOracleJson.abi) as WethPriceOracle;
    this.daiPriceOracle = new this.web3.eth.Contract(daiPriceOracleJson.abi) as DaiPriceOracle;
    this.usdcPriceOracle = new this.web3.eth.Contract(usdcPriceOracleJson.abi) as UsdcPriceOracle;
    this.weth = new this.web3.eth.Contract(wethJson.abi) as Weth;

    // Testing Contracts
    this.testSoloMargin = new this.web3.eth.Contract(testSoloMarginJson.abi) as TestSoloMargin;
    if (options.testing) {
      this.soloMargin = this.testSoloMargin;
    }
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;
    this.erroringToken = new this.web3.eth.Contract(erroringTokenJson.abi) as TestToken;
    this.omiseToken = new this.web3.eth.Contract(omiseTokenJson.abi) as TestToken;
    this.testLib = new this.web3.eth.Contract(testLibJson.abi) as TestLib;
    this.testAutoTrader = new this.web3.eth.Contract(testAutoTraderJson.abi) as TestAutoTrader;
    this.testCallee = new this.web3.eth.Contract(testCalleeJson.abi) as TestCallee;
    this.testExchangeWrapper = new this.web3.eth.Contract(
      testExchangeWrapperJson.abi) as TestExchangeWrapper;
    this.testPriceOracle = new this.web3.eth.Contract(testPriceOracleJson.abi) as TestPriceOracle;
    this.testMakerOracle = new this.web3.eth.Contract(testMakerOracleJson.abi) as TestMakerOracle;
    this.testOasisDex = new this.web3.eth.Contract(testOasisDexJson.abi) as TestOasisDex;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi) as TestInterestSetter;
    this.testPolynomialInterestSetter = new this.web3.eth.Contract(
      testPolynomialInterestSetterJson.abi) as TestPolynomialInterestSetter;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
    this.soloMargin.setProvider(provider);

    const contracts = [
      // contracts
      { contract: this.soloMargin, json: soloMarginJson },
      { contract: this.erc20, json: erc20Json },
      { contract: this.interestSetter, json: interestSetterJson },
      { contract: this.priceOracle, json: priceOracleJson },
      { contract: this.expiry, json: expiryJson },
      { contract: this.limitOrders, json: limitOrdersJson },
      { contract: this.payableProxy, json: payableProxyJson },
      { contract: this.signedOperationProxy, json: signedOperationProxyJson },
      { contract: this.liquidatorProxyV1, json: liquidatorV1Json },
      { contract: this.polynomialInterestSetter, json: polynomialInterestSetterJson },
      { contract: this.wethPriceOracle, json: wethPriceOracleJson },
      { contract: this.daiPriceOracle, json: daiPriceOracleJson },
      { contract: this.usdcPriceOracle, json: usdcPriceOracleJson },
      { contract: this.weth, json: wethJson },

      // test contracts
      { contract: this.testSoloMargin, json: testSoloMarginJson },
      { contract: this.tokenA, json: tokenAJson },
      { contract: this.tokenB, json: tokenBJson },
      { contract: this.tokenC, json: tokenCJson },
      { contract: this.erroringToken, json: erroringTokenJson },
      { contract: this.omiseToken, json: omiseTokenJson },
      { contract: this.testLib, json: testLibJson },
      { contract: this.testAutoTrader, json: testAutoTraderJson },
      { contract: this.testCallee, json: testCalleeJson },
      { contract: this.testExchangeWrapper, json: testExchangeWrapperJson },
      { contract: this.testPriceOracle, json: testPriceOracleJson },
      { contract: this.testMakerOracle, json: testMakerOracleJson },
      { contract: this.testOasisDex, json: testOasisDexJson },
      { contract: this.testPolynomialInterestSetter, json: testPolynomialInterestSetterJson },
      { contract: this.testInterestSetter, json: testInterestSetterJson },
    ];

    contracts.forEach(contract => this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
      ),
    );
  }

  public setDefaultAccount(
    account: address,
  ): void {
    // Contracts
    this.soloMargin.options.from = account;
    this.testSoloMargin.options.from = account;
    this.erc20.options.from = account;
    this.interestSetter.options.from = account;
    this.priceOracle.options.from = account;
    this.expiry.options.from = account;
    this.limitOrders.options.from = account;
    this.payableProxy.options.from = account;
    this.signedOperationProxy.options.from = account;
    this.liquidatorProxyV1.options.from = account;
    this.polynomialInterestSetter.options.from = account;
    this.wethPriceOracle.options.from = account;
    this.daiPriceOracle.options.from = account;
    this.usdcPriceOracle.options.from = account;
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
    this.testMakerOracle.options.from = account;
    this.testOasisDex.options.from = account;
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
      txOptions.gasPrice = this.defaultGasPrice;
    }

    if (confirmationType === ConfirmationType.Simulate || !options.gas) {
      let gasEstimate: number;

      if (this.defaultGas && confirmationType !== ConfirmationType.Simulate) {
        txOptions.gas = this.defaultGas;
      } else {
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

      if (confirmationType === ConfirmationType.Simulate) {
        return { gasEstimate, gas: Number(txOptions.gas) };
      }
    }

    if (txOptions.value) {
      txOptions.value = new BigNumber(txOptions.value).toFixed(0);
    } else {
      txOptions.value = '0';
    }

    const promi: PromiEvent<T> = method.send(txOptions);

    const OUTCOMES = {
      INITIAL: 0,
      RESOLVED: 1,
      REJECTED: 2,
    };

    let hashOutcome = OUTCOMES.INITIAL;
    let confirmationOutcome = OUTCOMES.INITIAL;

    const t = confirmationType !== undefined ? confirmationType : this.confirmationType;

    if (!Object.values(ConfirmationType).includes(t)) {
      throw new Error(`Invalid confirmation type: ${t}`);
    }

    let hashPromise: Promise<string>;
    let confirmationPromise: Promise<TransactionReceipt>;

    if (t === ConfirmationType.Hash || t === ConfirmationType.Both) {
      hashPromise = new Promise(
        (resolve, reject) => {
          promi.on('error', (error: Error) => {
            if (hashOutcome === OUTCOMES.INITIAL) {
              hashOutcome = OUTCOMES.REJECTED;
              reject(error);
              const anyPromi = promi as any;
              anyPromi.off();
            }
          });

          promi.on('transactionHash', (txHash: string) => {
            if (hashOutcome === OUTCOMES.INITIAL) {
              hashOutcome = OUTCOMES.RESOLVED;
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
              (t === ConfirmationType.Confirmed || hashOutcome === OUTCOMES.RESOLVED)
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
