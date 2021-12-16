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

import { Provider } from 'web3/providers';
import Web3 from 'web3';

// Contracts
import { TestSoloMargin } from '../../build/testing_wrappers/TestSoloMargin';
import { TestToken } from '../../build/testing_wrappers/TestToken';
import { TestLib } from '../../build/testing_wrappers/TestLib';
import { TestAutoTrader } from '../../build/testing_wrappers/TestAutoTrader';
import { TestCallee } from '../../build/testing_wrappers/TestCallee';
import { TestSimpleCallee } from '../../build/testing_wrappers/TestSimpleCallee';
import { TestExchangeWrapper } from '../../build/testing_wrappers/TestExchangeWrapper';
import { TestPriceOracle } from '../../build/testing_wrappers/TestPriceOracle';
import { TestMakerOracle } from '../../build/testing_wrappers/TestMakerOracle';
import { TestOasisDex } from '../../build/testing_wrappers/TestOasisDex';
import { TestInterestSetter } from '../../build/testing_wrappers/TestInterestSetter';
import { TestPolynomialInterestSetter } from '../../build/testing_wrappers/TestPolynomialInterestSetter';
import { TestDoubleExponentInterestSetter } from '../../build/testing_wrappers/TestDoubleExponentInterestSetter';

// JSON
import testSoloMarginJson from '../../build/testing_contracts/TestSoloMargin.json';
import tokenAJson from '../../build/testing_contracts/TokenA.json';
import tokenBJson from '../../build/testing_contracts/TokenB.json';
import tokenCJson from '../../build/testing_contracts/TokenC.json';
import tokenDJson from '../../build/testing_contracts/TokenD.json';
import tokenEJson from '../../build/testing_contracts/TokenE.json';
import tokenFJson from '../../build/testing_contracts/TokenF.json';
import erroringTokenJson from '../../build/testing_contracts/ErroringToken.json';
import omiseTokenJson from '../../build/testing_contracts/OmiseToken.json';
import testLibJson from '../../build/testing_contracts/TestLib.json';
import testAutoTraderJson from '../../build/testing_contracts/TestAutoTrader.json';
import testCalleeJson from '../../build/testing_contracts/TestCallee.json';
import testSimpleCalleeJson from '../../build/testing_contracts/TestSimpleCallee.json';
import testExchangeWrapperJson from '../../build/testing_contracts/TestExchangeWrapper.json';
import testPriceOracleJson from '../../build/testing_contracts/TestPriceOracle.json';
import testMakerOracleJson from '../../build/testing_contracts/TestMakerOracle.json';
import testOasisDexJson from '../../build/testing_contracts/TestOasisDex.json';
import testPolynomialInterestSetterJson
  from '../../build/testing_contracts/TestPolynomialInterestSetter.json';
import testDoubleExponentInterestSetterJson
  from '../../build/testing_contracts/TestDoubleExponentInterestSetter.json';
import testInterestSetterJson from '../../build/testing_contracts/TestInterestSetter.json';
import testUniswapV2PairJson from '../../build/testing_contracts/UniswapV2Pair.json';
import testUniswapV2RouterJson from '../../build/testing_contracts/UniswapV2Router02.json';
import testUniswapV2FactoryJson from '../../build/testing_contracts/UniswapV2Factory.json';

import { address, SoloOptions } from '../../src/types';
import { Contracts } from '../../src/lib/Contracts';
import { UniswapV2Factory } from '../../build/testing_wrappers/UniswapV2Factory';
import { UniswapV2Router02 } from '../../build/testing_wrappers/UniswapV2Router02';
import { UniswapV2Pair } from '../../build/testing_wrappers/UniswapV2Pair';

export class TestContracts extends Contracts {
  // Contract instances
  public soloMargin: TestSoloMargin;

  // Testing contract instances
  public testSoloMargin: TestSoloMargin;
  public tokenA: TestToken;
  public tokenB: TestToken;
  public tokenC: TestToken;
  public tokenD: TestToken;
  public tokenE: TestToken;
  public tokenF: TestToken;
  public erroringToken: TestToken;
  public omiseToken: TestToken;
  public testLib: TestLib;
  public testAutoTrader: TestAutoTrader;
  public testCallee: TestCallee;
  public testSimpleCallee: TestSimpleCallee;
  public testExchangeWrapper: TestExchangeWrapper;
  public testPriceOracle: TestPriceOracle;
  public testMakerOracle: TestMakerOracle;
  public testOasisDex: TestOasisDex;
  public testPolynomialInterestSetter: TestPolynomialInterestSetter;
  public testDoubleExponentInterestSetter: TestDoubleExponentInterestSetter;
  public testInterestSetter: TestInterestSetter;
  public testUniswapV2Factory: UniswapV2Factory;
  public testUniswapV2Router: UniswapV2Router02;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ) {
    super(provider, networkId, web3, options);

    // Testing Contracts
    this.testSoloMargin = new this.web3.eth.Contract(
      testSoloMarginJson.abi,
    ) as TestSoloMargin;
    this.soloMargin = this.testSoloMargin;
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;
    this.tokenD = new this.web3.eth.Contract(tokenDJson.abi) as TestToken;
    this.tokenE = new this.web3.eth.Contract(tokenEJson.abi) as TestToken;
    this.tokenF = new this.web3.eth.Contract(tokenFJson.abi) as TestToken;
    this.erroringToken = new this.web3.eth.Contract(
      erroringTokenJson.abi,
    ) as TestToken;
    this.omiseToken = new this.web3.eth.Contract(
      omiseTokenJson.abi,
    ) as TestToken;
    this.testLib = new this.web3.eth.Contract(testLibJson.abi) as TestLib;
    this.testAutoTrader = new this.web3.eth.Contract(
      testAutoTraderJson.abi,
    ) as TestAutoTrader;
    this.testCallee = new this.web3.eth.Contract(
      testCalleeJson.abi,
    ) as TestCallee;
    this.testSimpleCallee = new this.web3.eth.Contract(
      testSimpleCalleeJson.abi,
    ) as TestSimpleCallee;
    this.testExchangeWrapper = new this.web3.eth.Contract(
      testExchangeWrapperJson.abi,
    ) as TestExchangeWrapper;
    this.testPriceOracle = new this.web3.eth.Contract(
      testPriceOracleJson.abi,
    ) as TestPriceOracle;
    this.testMakerOracle = new this.web3.eth.Contract(
      testMakerOracleJson.abi,
    ) as TestMakerOracle;
    this.testOasisDex = new this.web3.eth.Contract(
      testOasisDexJson.abi,
    ) as TestOasisDex;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi,
    ) as TestInterestSetter;
    this.testPolynomialInterestSetter = new this.web3.eth.Contract(
      testPolynomialInterestSetterJson.abi,
    ) as TestPolynomialInterestSetter;
    this.testDoubleExponentInterestSetter = new this.web3.eth.Contract(
      testDoubleExponentInterestSetterJson.abi,
    ) as TestDoubleExponentInterestSetter;
    this.testUniswapV2Factory = new this.web3.eth.Contract(
      testUniswapV2FactoryJson.abi,
    ) as UniswapV2Factory;
    this.testUniswapV2Router = new this.web3.eth.Contract(
      testUniswapV2RouterJson.abi,
    ) as UniswapV2Router02;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public async getUniswapV2PairByTokens(
    tokenA: address,
    tokenB: address,
  ): Promise<UniswapV2Pair> {
    const pairAddress = await this.testUniswapV2Factory.methods
      .getPair(tokenA, tokenB)
      .call();
    const pair = new this.web3.eth.Contract(
      testUniswapV2PairJson.abi,
      pairAddress,
    ) as UniswapV2Pair;
    pair.options.from = this.testUniswapV2Factory.options.from;
    return pair;
  }

  public setProvider(provider: Provider, networkId: number): void {
    super.setProvider(provider, networkId);

    // do not continue if not initialized
    if (!this.tokenA) {
      return;
    }

    this.soloMargin.setProvider(provider);

    const contracts = [
      // test contracts
      { contract: this.testSoloMargin, json: testSoloMarginJson },
      { contract: this.tokenA, json: tokenAJson },
      { contract: this.tokenB, json: tokenBJson },
      { contract: this.tokenC, json: tokenCJson },
      { contract: this.tokenD, json: tokenDJson },
      { contract: this.tokenE, json: tokenEJson },
      { contract: this.tokenF, json: tokenFJson },
      { contract: this.erroringToken, json: erroringTokenJson },
      { contract: this.omiseToken, json: omiseTokenJson },
      { contract: this.testLib, json: testLibJson },
      { contract: this.testAutoTrader, json: testAutoTraderJson },
      { contract: this.testCallee, json: testCalleeJson },
      { contract: this.testSimpleCallee, json: testSimpleCalleeJson },
      { contract: this.testExchangeWrapper, json: testExchangeWrapperJson },
      { contract: this.testPriceOracle, json: testPriceOracleJson },
      { contract: this.testMakerOracle, json: testMakerOracleJson },
      { contract: this.testOasisDex, json: testOasisDexJson },
      {
        contract: this.testPolynomialInterestSetter,
        json: testPolynomialInterestSetterJson,
      },
      {
        contract: this.testDoubleExponentInterestSetter,
        json: testDoubleExponentInterestSetterJson,
      },
      { contract: this.testInterestSetter, json: testInterestSetterJson },
      { contract: this.testUniswapV2Factory, json: testUniswapV2FactoryJson },
      { contract: this.testUniswapV2Router, json: testUniswapV2RouterJson },
    ];

    contracts.forEach(contract =>
      this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
        null,
      ),
    );
  }

  public setDefaultAccount(account: address): void {
    super.setDefaultAccount(account);

    // do not continue if not initialized
    if (!this.tokenA) {
      return;
    }

    // Test Contracts
    this.tokenA.options.from = account;
    this.tokenB.options.from = account;
    this.tokenC.options.from = account;
    this.tokenD.options.from = account;
    this.tokenE.options.from = account;
    this.tokenF.options.from = account;
    this.erroringToken.options.from = account;
    this.omiseToken.options.from = account;
    this.testLib.options.from = account;
    this.testAutoTrader.options.from = account;
    this.testCallee.options.from = account;
    this.testSimpleCallee.options.from = account;
    this.testExchangeWrapper.options.from = account;
    this.testPriceOracle.options.from = account;
    this.testMakerOracle.options.from = account;
    this.testOasisDex.options.from = account;
    this.testPolynomialInterestSetter.options.from = account;
    this.testDoubleExponentInterestSetter.options.from = account;
    this.testInterestSetter.options.from = account;
    this.testUniswapV2Factory.options.from = account;
    this.testUniswapV2Router.options.from = account;
  }

  public getUniswapV2Pair(contractAddress: address): UniswapV2Pair {
    const pair = new this.web3.eth.Contract(
      testUniswapV2PairJson.abi,
      contractAddress,
    ) as UniswapV2Pair;
    pair.options.from = this.testUniswapV2Factory.options.from;
    return pair;
  }
}
