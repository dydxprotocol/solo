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
import Web3 from 'web3';
import {
  Block,
  TransactionObject,
  Tx,
} from 'web3/eth/types';
import PromiEvent from 'web3/promiEvent';
import { Provider } from 'web3/providers';
import { TransactionReceipt } from 'web3/types';
import ammRebalancerProxyV1Json from '../../build/published_contracts/AmmRebalancerProxyV1.json';
import chainlinkPriceOracleV1Json from '../../build/published_contracts/ChainlinkPriceOracleV1.json';
import dolomiteAmmFactoryJson from '../../build/published_contracts/DolomiteAmmFactory.json';
import dolomiteAmmPairJson from '../../build/published_contracts/DolomiteAmmPair.json';
import dolomiteAmmRouterProxyJson from '../../build/published_contracts/DolomiteAmmRouterProxy.json';

// JSON
import dolomiteMarginJson from '../../build/published_contracts/DolomiteMargin.json';
import doubleExponentInterestSetterJson from '../../build/published_contracts/DoubleExponentInterestSetter.json';
import expiryJson from '../../build/published_contracts/Expiry.json';
import erc20Json from '../../build/published_contracts/IERC20.json';
import interestSetterJson from '../../build/published_contracts/IInterestSetter.json';
import priceOracleJson from '../../build/published_contracts/IPriceOracle.json';
import liquidatorV1Json from '../../build/published_contracts/LiquidatorProxyV1.json';
import liquidatorV1WithAmmJson from '../../build/published_contracts/LiquidatorProxyV1WithAmm.json';
import payableProxyJson from '../../build/published_contracts/PayableProxy.json';
import polynomialInterestSetterJson from '../../build/published_contracts/PolynomialInterestSetter.json';
import signedOperationProxyJson from '../../build/published_contracts/SignedOperationProxy.json';
import simpleFeeOwnerJson from '../../build/published_contracts/SimpleFeeOwner.json';
import transferProxyJson from '../../build/published_contracts/TransferProxy.json';
import multiCallJson from '../../build/published_contracts/MultiCall.json';
import wethJson from '../../build/published_contracts/Weth.json';

// Contracts
import { AmmRebalancerProxyV1 } from '../../build/wrappers/AmmRebalancerProxyV1';
import { ChainlinkPriceOracleV1 } from '../../build/wrappers/ChainlinkPriceOracleV1';
import { DolomiteAmmFactory } from '../../build/wrappers/DolomiteAmmFactory';
import { DolomiteAmmPair } from '../../build/wrappers/DolomiteAmmPair';
import { DolomiteAmmRouterProxy } from '../../build/wrappers/DolomiteAmmRouterProxy';
import { DolomiteMargin } from '../../build/wrappers/DolomiteMargin';
import { DoubleExponentInterestSetter } from '../../build/wrappers/DoubleExponentInterestSetter';
import { Expiry } from '../../build/wrappers/Expiry';
import { IERC20 as ERC20 } from '../../build/wrappers/IERC20';
import { IInterestSetter as InterestSetter } from '../../build/wrappers/IInterestSetter';
import { IPriceOracle as PriceOracle } from '../../build/wrappers/IPriceOracle';
import { LiquidatorProxyV1 as LiquidatorProxyV1 } from '../../build/wrappers/LiquidatorProxyV1';
import { LiquidatorProxyV1WithAmm as LiquidatorProxyV1WithAmm } from '../../build/wrappers/LiquidatorProxyV1WithAmm';
import { MultiCall } from '../../build/wrappers/MultiCall';
import { PayableProxy as PayableProxy } from '../../build/wrappers/PayableProxy';
import { PolynomialInterestSetter } from '../../build/wrappers/PolynomialInterestSetter';
import { SignedOperationProxy } from '../../build/wrappers/SignedOperationProxy';
import { SimpleFeeOwner } from '../../build/wrappers/SimpleFeeOwner';
import { TransferProxy } from '../../build/wrappers/TransferProxy';
import { Weth } from '../../build/wrappers/Weth';
import {
  address,
  ConfirmationType,
  ContractCallOptions,
  ContractConstantCallOptions,
  DolomiteMarginOptions,
  TxResult,
} from '../types';

import {
  SUBTRACT_GAS_LIMIT,
} from './Constants';

interface CallableTransactionObject<T> {
  call(tx?: Tx, blockNumber?: number): Promise<T>;
}

export class Contracts {
  // Contract instances
  public dolomiteMargin: DolomiteMargin;
  public erc20: ERC20;
  public interestSetter: InterestSetter;
  public priceOracle: PriceOracle;
  public expiry: Expiry;
  public payableProxy: PayableProxy;
  public signedOperationProxy: SignedOperationProxy;
  public liquidatorProxyV1: LiquidatorProxyV1;
  public liquidatorProxyV1WithAmm: LiquidatorProxyV1WithAmm;
  public dolomiteAmmRouterProxy: DolomiteAmmRouterProxy;
  public ammRebalancerProxyV1: AmmRebalancerProxyV1;
  public polynomialInterestSetter: PolynomialInterestSetter;
  public doubleExponentInterestSetter: DoubleExponentInterestSetter;
  public chainlinkPriceOracleV1: ChainlinkPriceOracleV1;
  public dolomiteAmmFactory: DolomiteAmmFactory;
  public simpleFeeOwner: SimpleFeeOwner;
  public weth: Weth;
  public transferProxy: TransferProxy;
  public multiCall: MultiCall;
  protected web3: Web3;
  private blockGasLimit: number;
  private readonly autoGasMultiplier: number;
  private readonly defaultConfirmations: number;
  private readonly confirmationType: ConfirmationType;
  private readonly defaultGas: string | number;
  private readonly defaultGasPrice: string | number;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: DolomiteMarginOptions,
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
    this.dolomiteMargin = new this.web3.eth.Contract(
      dolomiteMarginJson.abi,
    ) as DolomiteMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.interestSetter = new this.web3.eth.Contract(
      interestSetterJson.abi,
    ) as InterestSetter;
    this.priceOracle = new this.web3.eth.Contract(
      priceOracleJson.abi,
    ) as PriceOracle;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
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
    ) as LiquidatorProxyV1WithAmm;
    this.dolomiteAmmRouterProxy = new this.web3.eth.Contract(
      dolomiteAmmRouterProxyJson.abi,
    ) as DolomiteAmmRouterProxy;
    this.ammRebalancerProxyV1 = new this.web3.eth.Contract(
      ammRebalancerProxyV1Json.abi,
    ) as AmmRebalancerProxyV1;
    this.polynomialInterestSetter = new this.web3.eth.Contract(
      polynomialInterestSetterJson.abi,
    ) as PolynomialInterestSetter;
    this.doubleExponentInterestSetter = new this.web3.eth.Contract(
      doubleExponentInterestSetterJson.abi,
    ) as DoubleExponentInterestSetter;
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
    this.transferProxy = new this.web3.eth.Contract(transferProxyJson.abi) as TransferProxy;
    this.multiCall = new this.web3.eth.Contract(multiCallJson.abi) as MultiCall;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public getDolomiteLpTokenAddress(
    tokenA: address,
    tokenB: address,
  ): Promise<string> {
    return this.dolomiteAmmFactory.methods.getPair(tokenA, tokenB)
      .call();
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
    this.dolomiteMargin.setProvider(provider);

    const contracts = [
      // contracts
      { contract: this.dolomiteMargin, json: dolomiteMarginJson },
      { contract: this.erc20, json: erc20Json },
      { contract: this.interestSetter, json: interestSetterJson },
      { contract: this.priceOracle, json: priceOracleJson },
      { contract: this.expiry, json: expiryJson },
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
      { contract: this.ammRebalancerProxyV1, json: ammRebalancerProxyV1Json },
      {
        contract: this.polynomialInterestSetter,
        json: polynomialInterestSetterJson,
      },
      {
        contract: this.doubleExponentInterestSetter,
        json: doubleExponentInterestSetterJson,
      },
      { contract: this.dolomiteAmmFactory, json: dolomiteAmmFactoryJson },
      { contract: this.simpleFeeOwner, json: simpleFeeOwnerJson },
      {
        contract: this.chainlinkPriceOracleV1,
        json: chainlinkPriceOracleV1Json,
      },
      { contract: this.weth, json: wethJson },
      { contract: this.transferProxy, json: transferProxyJson },
      { contract: this.multiCall, json: multiCallJson },
    ];

    contracts.forEach(contract =>
      this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
        {},
      ),
    );
  }

  public setDefaultAccount(account: address): void {
    // Contracts
    this.dolomiteMargin.options.from = account;
    this.erc20.options.from = account;
    this.interestSetter.options.from = account;
    this.priceOracle.options.from = account;
    this.expiry.options.from = account;
    this.payableProxy.options.from = account;
    this.signedOperationProxy.options.from = account;
    this.liquidatorProxyV1.options.from = account;
    this.liquidatorProxyV1WithAmm.options.from = account;
    this.dolomiteAmmRouterProxy.options.from = account;
    this.ammRebalancerProxyV1.options.from = account;
    this.polynomialInterestSetter.options.from = account;
    this.doubleExponentInterestSetter.options.from = account;
    this.chainlinkPriceOracleV1.options.from = account;
    this.dolomiteAmmFactory.options.from = account;
    this.simpleFeeOwner.options.from = account;
    this.weth.options.from = account;
    this.transferProxy.options.from = account;
    this.multiCall.options.from = account;
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

    if (!Object.values(ConfirmationType)
      .includes(t)) {
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
