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
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { IInterestSetter as InterestSetter } from '../../build/wrappers/IInterestSetter';
import { IPriceOracle as PriceOracle } from '../../build/wrappers/IPriceOracle';
import { Expiry } from '../../build/wrappers/Expiry';
import { ExpiryV2 } from '../../build/wrappers/ExpiryV2';
import { FinalSettlement } from '../../build/wrappers/FinalSettlement';
import { Refunder } from '../../build/wrappers/Refunder';
import { DaiMigrator } from '../../build/wrappers/DaiMigrator';
import { LimitOrders } from '../../build/wrappers/LimitOrders';
import { StopLimitOrders } from '../../build/wrappers/StopLimitOrders';
import { CanonicalOrders } from '../../build/wrappers/CanonicalOrders';
import {
  PayableProxyForSoloMargin as PayableProxy,
} from '../../build/wrappers/PayableProxyForSoloMargin';
import { SignedOperationProxy } from '../../build/wrappers/SignedOperationProxy';
import {
  LiquidatorProxyV1ForSoloMargin as LiquidatorProxyV1,
} from '../../build/wrappers/LiquidatorProxyV1ForSoloMargin';
import { PolynomialInterestSetter } from '../../build/wrappers/PolynomialInterestSetter';
import { DoubleExponentInterestSetter } from '../../build/wrappers/DoubleExponentInterestSetter';
import { WethPriceOracle } from '../../build/wrappers/WethPriceOracle';
import { DaiPriceOracle } from '../../build/wrappers/DaiPriceOracle';
import { UsdcPriceOracle } from '../../build/wrappers/UsdcPriceOracle';
import { Weth } from '../../build/wrappers/Weth';

// JSON
import soloMarginJson from '../../build/published_contracts/SoloMargin.json';
import erc20Json from '../../build/published_contracts/IErc20.json';
import interestSetterJson from '../../build/published_contracts/IInterestSetter.json';
import priceOracleJson from '../../build/published_contracts/IPriceOracle.json';
import expiryJson from '../../build/published_contracts/Expiry.json';
import expiryV2Json from '../../build/published_contracts/ExpiryV2.json';
import finalSettlementJson from '../../build/published_contracts/FinalSettlement.json';
import refunderJson from '../../build/published_contracts/Refunder.json';
import daiMigratorJson from '../../build/published_contracts/DaiMigrator.json';
import limitOrdersJson from '../../build/published_contracts/LimitOrders.json';
import stopLimitOrdersJson from '../../build/published_contracts/StopLimitOrders.json';
import canonicalOrdersJson from '../../build/published_contracts/CanonicalOrders.json';
import payableProxyJson from '../../build/published_contracts/PayableProxyForSoloMargin.json';
import signedOperationProxyJson from '../../build/published_contracts/SignedOperationProxy.json';
import liquidatorV1Json from '../../build/published_contracts/LiquidatorProxyV1ForSoloMargin.json';
import polynomialInterestSetterJson
  from '../../build/published_contracts/PolynomialInterestSetter.json';
import doubleExponentInterestSetterJson
  from '../../build/published_contracts/DoubleExponentInterestSetter.json';
import wethPriceOracleJson from '../../build/published_contracts/WethPriceOracle.json';
import daiPriceOracleJson from '../../build/published_contracts/DaiPriceOracle.json';
import usdcPriceOracleJson from '../../build/published_contracts/UsdcPriceOracle.json';
import wethJson from '../../build/published_contracts/Weth.json';

import { ADDRESSES, SUBTRACT_GAS_LIMIT } from './Constants';
import {
  TxResult,
  address,
  SoloOptions,
  ConfirmationType,
  TxOptions,
  CallOptions,
  NativeSendOptions,
  SendOptions,
} from '../types';

interface CallableTransactionObject<T> {
  call(tx?: Tx, blockNumber?: number | string): Promise<T>;
}

export class Contracts {
  private blockGasLimit: number;
  private autoGasMultiplier: number;
  private defaultConfirmations: number;
  private confirmationType: ConfirmationType;
  private defaultGas: string | number;
  private defaultGasPrice: string | number;
  protected web3: Web3;

  // Contract instances
  public soloMargin: SoloMargin;
  public erc20: ERC20;
  public interestSetter: InterestSetter;
  public priceOracle: PriceOracle;
  public expiry: Expiry;
  public expiryV2: ExpiryV2;
  public finalSettlement: FinalSettlement;
  public refunder: Refunder;
  public daiMigrator: DaiMigrator;
  public limitOrders: LimitOrders;
  public stopLimitOrders: StopLimitOrders;
  public canonicalOrders: CanonicalOrders;
  public payableProxy: PayableProxy;
  public signedOperationProxy: SignedOperationProxy;
  public liquidatorProxyV1: LiquidatorProxyV1;
  public polynomialInterestSetter: PolynomialInterestSetter;
  public doubleExponentInterestSetter: DoubleExponentInterestSetter;
  public wethPriceOracle: WethPriceOracle;
  public daiPriceOracle: DaiPriceOracle;
  public saiPriceOracle: DaiPriceOracle;
  public usdcPriceOracle: UsdcPriceOracle;
  public weth: Weth;

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
    this.blockGasLimit = options.blockGasLimit;

    // Contracts
    this.soloMargin = new this.web3.eth.Contract(soloMarginJson.abi) as SoloMargin;
    this.erc20 = new this.web3.eth.Contract(erc20Json.abi) as ERC20;
    this.interestSetter = new this.web3.eth.Contract(interestSetterJson.abi) as InterestSetter;
    this.priceOracle = new this.web3.eth.Contract(priceOracleJson.abi) as PriceOracle;
    this.expiry = new this.web3.eth.Contract(expiryJson.abi) as Expiry;
    this.expiryV2 = new this.web3.eth.Contract(expiryV2Json.abi) as ExpiryV2;
    this.finalSettlement = new this.web3.eth.Contract(finalSettlementJson.abi) as FinalSettlement;
    this.refunder = new this.web3.eth.Contract(refunderJson.abi) as Refunder;
    this.daiMigrator = new this.web3.eth.Contract(daiMigratorJson.abi) as DaiMigrator;
    this.limitOrders = new this.web3.eth.Contract(limitOrdersJson.abi) as LimitOrders;
    this.stopLimitOrders = new this.web3.eth.Contract(stopLimitOrdersJson.abi) as StopLimitOrders;
    this.canonicalOrders = new this.web3.eth.Contract(canonicalOrdersJson.abi) as CanonicalOrders;
    this.payableProxy = new this.web3.eth.Contract(payableProxyJson.abi) as PayableProxy;
    this.signedOperationProxy = new this.web3.eth.Contract(signedOperationProxyJson.abi) as
      SignedOperationProxy;
    this.liquidatorProxyV1 = new this.web3.eth.Contract(liquidatorV1Json.abi) as
      LiquidatorProxyV1;
    this.polynomialInterestSetter = new this.web3.eth.Contract(polynomialInterestSetterJson.abi) as
      PolynomialInterestSetter;
    this.doubleExponentInterestSetter = new this.web3.eth.Contract(
      doubleExponentInterestSetterJson.abi) as DoubleExponentInterestSetter;
    this.wethPriceOracle = new this.web3.eth.Contract(wethPriceOracleJson.abi) as WethPriceOracle;
    this.daiPriceOracle = new this.web3.eth.Contract(daiPriceOracleJson.abi) as DaiPriceOracle;
    this.saiPriceOracle = new this.web3.eth.Contract(daiPriceOracleJson.abi) as DaiPriceOracle;
    this.usdcPriceOracle = new this.web3.eth.Contract(usdcPriceOracleJson.abi) as UsdcPriceOracle;
    this.weth = new this.web3.eth.Contract(wethJson.abi) as Weth;

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
      { contract: this.expiryV2, json: expiryV2Json },
      { contract: this.finalSettlement, json: finalSettlementJson },
      { contract: this.refunder, json: refunderJson },
      { contract: this.daiMigrator, json: daiMigratorJson },
      { contract: this.limitOrders, json: limitOrdersJson },
      { contract: this.stopLimitOrders, json: stopLimitOrdersJson },
      { contract: this.canonicalOrders, json: canonicalOrdersJson },
      { contract: this.payableProxy, json: payableProxyJson },
      { contract: this.signedOperationProxy, json: signedOperationProxyJson },
      { contract: this.liquidatorProxyV1, json: liquidatorV1Json },
      { contract: this.polynomialInterestSetter, json: polynomialInterestSetterJson },
      { contract: this.doubleExponentInterestSetter, json: doubleExponentInterestSetterJson },
      { contract: this.wethPriceOracle, json: wethPriceOracleJson },
      { contract: this.daiPriceOracle, json: daiPriceOracleJson },
      { contract: this.saiPriceOracle, json: daiPriceOracleJson, overrides: {
        1: '0x787F552BDC17332c98aA360748884513e3cB401a',
        42: '0x8a6629fEba4196E0A61B8E8C94D4905e525bc055',
        1001: ADDRESSES.TEST_SAI_PRICE_ORACLE,
        1002: ADDRESSES.TEST_SAI_PRICE_ORACLE,
      } },
      { contract: this.usdcPriceOracle, json: usdcPriceOracleJson },
      { contract: this.weth, json: wethJson },
    ];

    contracts.forEach(contract => this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
        contract.overrides,
      ),
    );
  }

  public setDefaultAccount(
    account: address,
  ): void {
    // Contracts
    this.soloMargin.options.from = account;
    this.erc20.options.from = account;
    this.interestSetter.options.from = account;
    this.priceOracle.options.from = account;
    this.expiry.options.from = account;
    this.expiryV2.options.from = account;
    this.finalSettlement.options.from = account;
    this.refunder.options.from = account;
    this.daiMigrator.options.from = account;
    this.limitOrders.options.from = account;
    this.stopLimitOrders.options.from = account;
    this.canonicalOrders.options.from = account;
    this.payableProxy.options.from = account;
    this.signedOperationProxy.options.from = account;
    this.liquidatorProxyV1.options.from = account;
    this.polynomialInterestSetter.options.from = account;
    this.doubleExponentInterestSetter.options.from = account;
    this.wethPriceOracle.options.from = account;
    this.daiPriceOracle.options.from = account;
    this.saiPriceOracle.options.from = account;
    this.usdcPriceOracle.options.from = account;
    this.weth.options.from = account;
  }

  public async send<T>(
    method: TransactionObject<T>,
    options: SendOptions = {},
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
          gasEstimate = await method.estimateGas(this.toEstimateOptions(txOptions));
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

    const promi: PromiEvent<T> = method.send(this.toNativeSendOptions(txOptions));

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
      return this.normalizeResponse({ transactionHash });
    }

    if (t === ConfirmationType.Confirmed) {
      return confirmationPromise;
    }

    const transactionHash = await hashPromise;

    return this.normalizeResponse({
      transactionHash,
      confirmation: confirmationPromise,
    });
  }

  public async call<T>(
    method: TransactionObject<T>,
    options: CallOptions = {},
  ): Promise<T> {
    const {
      blockNumber,
      ...txOptions
    } = this.toCallOptions(options);
    const m2 = method as CallableTransactionObject<T>;
    return m2.call(txOptions, blockNumber || 'latest');
  }

  private async setGasLimit(): Promise<void> {
    const block: Block = await this.web3.eth.getBlock('latest');
    this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT;
  }

  protected setContractProvider(
    contract: any,
    contractJson: any,
    provider: Provider,
    networkId: number,
    overrides: any,
  ): void {
    contract.setProvider(provider);

    const contractAddress = contractJson.networks[networkId]
      && contractJson.networks[networkId].address;
    const overrideAddress = overrides && overrides[networkId];

    contract.options.address = overrideAddress || contractAddress;
  }

  // ============ Parse Options ============

  private toEstimateOptions(
    txOptions: SendOptions,
  ): TxOptions {
    return {
      from: txOptions.from,
      value: txOptions.value,
    };
  }

  private toCallOptions(
    options: any,
  ): CallOptions {
    return {
      from: options.from,
      value: options.value,
      blockNumber: options.blockNumber,
    };
  }

  private toNativeSendOptions(
    options: any,
  ): NativeSendOptions {
    return {
      from: options.from,
      value: options.value,
      gasPrice: options.gasPrice,
      gas: options.gas,
      nonce: options.nonce,
    };
  }

  private normalizeResponse(
    txResult: any,
  ): any {
    const txHash = txResult.transactionHash;
    if (txHash) {
      const {
        transactionHash: internalHash,
        nonce: internalNonce,
      } = txHash;
      if (internalHash) {
        txResult.transactionHash = internalHash;
      }
      if (internalNonce) {
        txResult.nonce = internalNonce;
      }
    }
    return txResult;
  }
}
