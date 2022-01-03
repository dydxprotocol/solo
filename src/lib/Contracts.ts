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
import { Block, TransactionObject, Tx } from 'web3/eth/types';

// Contracts
import { SoloMargin } from '../../build/wrappers/SoloMargin';
import { IERC20 as ERC20 } from '../../build/wrappers/IERC20';
import { IInterestSetter as InterestSetter } from '../../build/wrappers/IInterestSetter';
import { IPriceOracle as PriceOracle } from '../../build/wrappers/IPriceOracle';
import { ExpiryV2 } from '../../build/wrappers/ExpiryV2';
import { PayableProxyForSoloMargin as PayableProxy } from '../../build/wrappers/PayableProxyForSoloMargin';
import { SignedOperationProxy } from '../../build/wrappers/SignedOperationProxy';
import { LiquidatorProxyV1ForSoloMargin as LiquidatorProxyV1 } from '../../build/wrappers/LiquidatorProxyV1ForSoloMargin';
import {
  LiquidatorProxyV1WithAmmForSoloMargin,
  LiquidatorProxyV1WithAmmForSoloMargin as LiquidatorProxyV1WithAmm,
} from '../../build/wrappers/LiquidatorProxyV1WithAmmForSoloMargin';
import { DolomiteAmmRouterProxy } from '../../build/wrappers/DolomiteAmmRouterProxy';
import { PolynomialInterestSetter } from '../../build/wrappers/PolynomialInterestSetter';
import { DoubleExponentInterestSetter } from '../../build/wrappers/DoubleExponentInterestSetter';
import { DaiPriceOracle } from '../../build/wrappers/DaiPriceOracle';
import { UsdcPriceOracle } from '../../build/wrappers/UsdcPriceOracle';
import { WethPriceOracle } from '../../build/wrappers/WethPriceOracle';
import { ChainlinkPriceOracleV1 } from '../../build/wrappers/ChainlinkPriceOracleV1';
import { DolomiteAmmFactory } from '../../build/wrappers/DolomiteAmmFactory';
import { SimpleFeeOwner } from '../../build/wrappers/SimpleFeeOwner';
import { Weth } from '../../build/wrappers/Weth';

// JSON
import soloMarginJson from '../../build/published_contracts/SoloMargin.json';
import erc20Json from '../../build/published_contracts/IERC20.json';
import interestSetterJson from '../../build/published_contracts/IInterestSetter.json';
import priceOracleJson from '../../build/published_contracts/IPriceOracle.json';
import expiryV2Json from '../../build/published_contracts/ExpiryV2.json';
import payableProxyJson from '../../build/published_contracts/PayableProxyForSoloMargin.json';
import signedOperationProxyJson from '../../build/published_contracts/SignedOperationProxy.json';
import liquidatorV1Json from '../../build/published_contracts/LiquidatorProxyV1ForSoloMargin.json';
import liquidatorV1WithAmmJson
  from '../../build/published_contracts/LiquidatorProxyV1WithAmmForSoloMargin.json';
import dolomiteAmmRouterProxyJson
  from '../../build/published_contracts/DolomiteAmmRouterProxy.json';
import polynomialInterestSetterJson
  from '../../build/published_contracts/PolynomialInterestSetter.json';
import doubleExponentInterestSetterJson
  from '../../build/published_contracts/DoubleExponentInterestSetter.json';
import wethPriceOracleJson from '../../build/published_contracts/WethPriceOracle.json';
import daiPriceOracleJson from '../../build/published_contracts/DaiPriceOracle.json';
import usdcPriceOracleJson from '../../build/published_contracts/UsdcPriceOracle.json';
import chainlinkPriceOracleV1Json
  from '../../build/published_contracts/ChainlinkPriceOracleV1.json';
import dolomiteAmmFactoryJson from '../../build/published_contracts/DolomiteAmmFactory.json';
import simpleFeeOwnerJson from '../../build/published_contracts/SimpleFeeOwner.json';
import dolomiteAmmPairJson from '../../build/published_contracts/DolomiteAmmPair.json';
import wethJson from '../../build/published_contracts/Weth.json';
import ammRebalancerProxyJson from '../../build/published_contracts/AmmRebalancerProxy.json';
import testnetAmmRebalancerProxyJson
  from '../../build/published_contracts/TestnetAmmRebalancerProxy.json';

import { ADDRESSES, SUBTRACT_GAS_LIMIT } from './Constants';
import {
  address,
  ConfirmationType,
  ContractCallOptions,
  ContractConstantCallOptions,
  SoloOptions,
  TxResult,
} from '../types';
import { AmmRebalancerProxy } from '../../build/wrappers/AmmRebalancerProxy';
import { TestnetAmmRebalancerProxy } from '../../build/wrappers/TestnetAmmRebalancerProxy';
import { DolomiteAmmPair } from '../../build/wrappers/DolomiteAmmPair';

interface CallableTransactionObject<T> {
  call(tx?: Tx, blockNumber?: number): Promise<T>;
}

export class Contracts {
  // Contract instances
  public soloMargin: SoloMargin;
  public erc20: ERC20;
  public interestSetter: InterestSetter;
  public priceOracle: PriceOracle;
  public expiryV2: ExpiryV2;
  public payableProxy: PayableProxy;
  public signedOperationProxy: SignedOperationProxy;
  public liquidatorProxyV1: LiquidatorProxyV1;
  public liquidatorProxyV1WithAmm: LiquidatorProxyV1WithAmm;
  public dolomiteAmmRouterProxy: DolomiteAmmRouterProxy;
  public ammRebalancerProxy: AmmRebalancerProxy;
  public testnetAmmRebalancerProxy: TestnetAmmRebalancerProxy;
  public polynomialInterestSetter: PolynomialInterestSetter;
  public doubleExponentInterestSetter: DoubleExponentInterestSetter;
  public wethPriceOracle: WethPriceOracle;
  public daiPriceOracle: DaiPriceOracle;
  public saiPriceOracle: DaiPriceOracle;
  public usdcPriceOracle: UsdcPriceOracle;
  public chainlinkPriceOracleV1: ChainlinkPriceOracleV1;
  public dolomiteAmmFactory: DolomiteAmmFactory;
  public simpleFeeOwner: SimpleFeeOwner;
  public weth: Weth;
  protected web3: Web3;
  private blockGasLimit: number;
  private autoGasMultiplier: number;
  private defaultConfirmations: number;
  private confirmationType: ConfirmationType;
  private defaultGas: string | number;
  private defaultGasPrice: string | number;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ) {
    this.web3 = web3;
    this.defaultConfirmations = options.defaultConfirmations;
    this.autoGasMultiplier = options.autoGasMultiplier || 1.5;
    this.confirmationType =
      options.confirmationType || ConfirmationType.Confirmed;
    this.defaultGas = options.defaultGas;
    this.defaultGasPrice = options.defaultGasPrice;
    this.blockGasLimit = options.blockGasLimit;

    // Contracts
    this.soloMargin = new this.web3.eth.Contract(
      soloMarginJson.abi,
    ) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.interestSetter = new this.web3.eth.Contract(
      interestSetterJson.abi,
    ) as InterestSetter;
    this.priceOracle = new this.web3.eth.Contract(
      priceOracleJson.abi,
    ) as PriceOracle;
    this.expiryV2 = new this.web3.eth.Contract(expiryV2Json.abi) as ExpiryV2;
    this.payableProxy = new this.web3.eth.Contract(
      payableProxyJson.abi,
    ) as PayableProxy;
    this.signedOperationProxy = new this.web3.eth.Contract(
      signedOperationProxyJson.abi,
    ) as SignedOperationProxy;
    this.liquidatorProxyV1 = new this.web3.eth.Contract(
      liquidatorV1Json.abi,
    ) as LiquidatorProxyV1;
    this.liquidatorProxyV1WithAmm = new this.web3.eth.Contract(
      liquidatorV1WithAmmJson.abi,
    ) as LiquidatorProxyV1WithAmmForSoloMargin;
    this.dolomiteAmmRouterProxy = new this.web3.eth.Contract(
      dolomiteAmmRouterProxyJson.abi,
    ) as DolomiteAmmRouterProxy;
    this.ammRebalancerProxy = new this.web3.eth.Contract(
      ammRebalancerProxyJson.abi,
    ) as AmmRebalancerProxy;
    this.testnetAmmRebalancerProxy = new this.web3.eth.Contract(
      testnetAmmRebalancerProxyJson.abi,
    ) as TestnetAmmRebalancerProxy;
    this.polynomialInterestSetter = new this.web3.eth.Contract(
      polynomialInterestSetterJson.abi,
    ) as PolynomialInterestSetter;
    this.doubleExponentInterestSetter = new this.web3.eth.Contract(
      doubleExponentInterestSetterJson.abi,
    ) as DoubleExponentInterestSetter;
    this.wethPriceOracle = new this.web3.eth.Contract(
      wethPriceOracleJson.abi,
    ) as WethPriceOracle;
    this.daiPriceOracle = new this.web3.eth.Contract(
      daiPriceOracleJson.abi,
    ) as DaiPriceOracle;
    this.saiPriceOracle = new this.web3.eth.Contract(
      daiPriceOracleJson.abi,
    ) as DaiPriceOracle;
    this.usdcPriceOracle = new this.web3.eth.Contract(
      usdcPriceOracleJson.abi,
    ) as UsdcPriceOracle;
    this.chainlinkPriceOracleV1 = new this.web3.eth.Contract(
      chainlinkPriceOracleV1Json.abi,
    ) as ChainlinkPriceOracleV1;
    this.dolomiteAmmFactory = new this.web3.eth.Contract(
      dolomiteAmmFactoryJson.abi,
    ) as DolomiteAmmFactory;
    this.simpleFeeOwner = new this.web3.eth.Contract(
      simpleFeeOwnerJson.abi,
    ) as SimpleFeeOwner;
    this.weth = new this.web3.eth.Contract(wethJson.abi) as Weth;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public getDolomiteLpTokenAddress(
    tokenA: address,
    tokenB: address,
  ): Promise<string> {
    return this.dolomiteAmmFactory.methods.getPair(tokenA, tokenB).call();
  }

  public async getDolomiteAmmPairFromTokens(
    tokenA: address,
    tokenB: address,
  ): Promise<DolomiteAmmPair> {
    const contractAddress = await this.getDolomiteLpTokenAddress(
      tokenA,
      tokenB,
    );
    const pair = new this.web3.eth.Contract(
      dolomiteAmmPairJson.abi,
      contractAddress,
    ) as DolomiteAmmPair;
    pair.options.from = this.dolomiteAmmFactory.options.from;
    return pair;
  }

  public getDolomiteAmmPair(contractAddress: address): DolomiteAmmPair {
    const pair = new this.web3.eth.Contract(
      dolomiteAmmPairJson.abi,
      contractAddress,
    ) as DolomiteAmmPair;
    pair.options.from = this.dolomiteAmmFactory.options.from;
    return pair;
  }

  public setProvider(provider: Provider, networkId: number): void {
    this.soloMargin.setProvider(provider);

    const contracts = [
      // contracts
      { contract: this.soloMargin, json: soloMarginJson },
      { contract: this.erc20, json: erc20Json },
      { contract: this.interestSetter, json: interestSetterJson },
      { contract: this.priceOracle, json: priceOracleJson },
      { contract: this.expiryV2, json: expiryV2Json },
      { contract: this.payableProxy, json: payableProxyJson },
      { contract: this.signedOperationProxy, json: signedOperationProxyJson },
      { contract: this.liquidatorProxyV1, json: liquidatorV1Json },
      {
        contract: this.liquidatorProxyV1WithAmm,
        json: liquidatorV1WithAmmJson,
      },
      {
        contract: this.dolomiteAmmRouterProxy,
        json: dolomiteAmmRouterProxyJson,
      },
      { contract: this.ammRebalancerProxy, json: ammRebalancerProxyJson },
      {
        contract: this.testnetAmmRebalancerProxy,
        json: testnetAmmRebalancerProxyJson,
      },
      {
        contract: this.polynomialInterestSetter,
        json: polynomialInterestSetterJson,
      },
      {
        contract: this.doubleExponentInterestSetter,
        json: doubleExponentInterestSetterJson,
      },
      { contract: this.wethPriceOracle, json: wethPriceOracleJson },
      { contract: this.daiPriceOracle, json: daiPriceOracleJson },
      {
        contract: this.saiPriceOracle,
        json: daiPriceOracleJson,
        overrides: {
          1: '0x787F552BDC17332c98aA360748884513e3cB401a',
          42: '0x8a6629fEba4196E0A61B8E8C94D4905e525bc055',
          1001: ADDRESSES.TEST_SAI_PRICE_ORACLE,
          1002: ADDRESSES.TEST_SAI_PRICE_ORACLE,
        },
      },
      { contract: this.usdcPriceOracle, json: usdcPriceOracleJson },
      { contract: this.dolomiteAmmFactory, json: dolomiteAmmFactoryJson },
      { contract: this.simpleFeeOwner, json: simpleFeeOwnerJson },
      {
        contract: this.chainlinkPriceOracleV1,
        json: chainlinkPriceOracleV1Json,
      },
      { contract: this.weth, json: wethJson },
    ];

    contracts.forEach(contract =>
      this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
        contract.overrides,
      ),
    );
  }

  public setDefaultAccount(account: address): void {
    // Contracts
    this.soloMargin.options.from = account;
    this.erc20.options.from = account;
    this.interestSetter.options.from = account;
    this.priceOracle.options.from = account;
    this.expiryV2.options.from = account;
    this.payableProxy.options.from = account;
    this.signedOperationProxy.options.from = account;
    this.liquidatorProxyV1.options.from = account;
    this.liquidatorProxyV1WithAmm.options.from = account;
    this.dolomiteAmmRouterProxy.options.from = account;
    this.ammRebalancerProxy.options.from = account;
    this.testnetAmmRebalancerProxy.options.from = account;
    this.polynomialInterestSetter.options.from = account;
    this.doubleExponentInterestSetter.options.from = account;
    this.wethPriceOracle.options.from = account;
    this.daiPriceOracle.options.from = account;
    this.saiPriceOracle.options.from = account;
    this.usdcPriceOracle.options.from = account;
    this.chainlinkPriceOracleV1.options.from = account;
    this.dolomiteAmmFactory.options.from = account;
    this.simpleFeeOwner.options.from = account;
    this.weth.options.from = account;
  }

  public async callContractFunction<T>(
    method: TransactionObject<T>,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const {
      confirmations,
      confirmationType,
      autoGasMultiplier,
      ...txOptions
    } = options;

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
        txOptions.gas =
          totalGas < this.blockGasLimit ? totalGas : this.blockGasLimit;
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

    const t =
      confirmationType !== undefined ? confirmationType : this.confirmationType;

    if (!Object.values(ConfirmationType).includes(t)) {
      throw new Error(`Invalid confirmation type: ${t}`);
    }

    let hashPromise: Promise<string>;
    let confirmationPromise: Promise<TransactionReceipt>;

    if (t === ConfirmationType.Hash || t === ConfirmationType.Both) {
      hashPromise = new Promise((resolve, reject) => {
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
      });
    }

    if (t === ConfirmationType.Confirmed || t === ConfirmationType.Both) {
      confirmationPromise = new Promise((resolve, reject) => {
        promi.on('error', (error: Error) => {
          if (
            (t === ConfirmationType.Confirmed ||
              hashOutcome === OUTCOMES.RESOLVED) &&
            confirmationOutcome === OUTCOMES.INITIAL
          ) {
            confirmationOutcome = OUTCOMES.REJECTED;
            reject(error);
            const anyPromi = promi as any;
            anyPromi.off();
          }
        });

        const desiredConf = confirmations || this.defaultConfirmations;
        if (desiredConf) {
          promi.on(
            'confirmation',
            (confNumber: number, receipt: TransactionReceipt) => {
              if (confNumber >= desiredConf) {
                if (confirmationOutcome === OUTCOMES.INITIAL) {
                  confirmationOutcome = OUTCOMES.RESOLVED;
                  resolve(receipt);
                  const anyPromi = promi as any;
                  anyPromi.off();
                }
              }
            },
          );
        } else {
          promi.on('receipt', (receipt: TransactionReceipt) => {
            confirmationOutcome = OUTCOMES.RESOLVED;
            resolve(receipt);
            const anyPromi = promi as any;
            anyPromi.off();
          });
        }
      });
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

  protected setContractProvider(
    contract: any,
    contractJson: any,
    provider: Provider,
    networkId: number,
    overrides: any,
  ): void {
    contract.setProvider(provider);

    const contractAddress =
      contractJson.networks[networkId] &&
      contractJson.networks[networkId].address;
    const overrideAddress = overrides && overrides[networkId];

    contract.options.address = overrideAddress || contractAddress;
  }

  private async setGasLimit(): Promise<void> {
    const block: Block = await this.web3.eth.getBlock('latest');
    this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT;
  }
}
