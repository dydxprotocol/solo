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
import { TestCurve } from '../../build/testing_wrappers/TestCurve';
import { TestUniswapV2Pair } from '../../build/testing_wrappers/TestUniswapV2Pair';
import { TestUniswapV2Pair2 } from '../../build/testing_wrappers/TestUniswapV2Pair2';
import { TestInterestSetter } from '../../build/testing_wrappers/TestInterestSetter';
import { TestPolynomialInterestSetter }
  from '../../build/testing_wrappers/TestPolynomialInterestSetter';
import { TestDoubleExponentInterestSetter }
  from '../../build/testing_wrappers/TestDoubleExponentInterestSetter';

// JSON
import testSoloMarginJson from '../../build/testing_contracts/TestSoloMargin.json';
import tokenAJson from '../../build/testing_contracts/TokenA.json';
import tokenBJson from '../../build/testing_contracts/TokenB.json';
import tokenCJson from '../../build/testing_contracts/TokenC.json';
import erroringTokenJson from '../../build/testing_contracts/ErroringToken.json';
import omiseTokenJson from '../../build/testing_contracts/OmiseToken.json';
import testLibJson from '../../build/testing_contracts/TestLib.json';
import testAutoTraderJson from '../../build/testing_contracts/TestAutoTrader.json';
import testCalleeJson from '../../build/testing_contracts/TestCallee.json';
import testSimpleCalleeJson from '../../build/testing_contracts/TestSimpleCallee.json';
import testExchangeWrapperJson from '../../build/testing_contracts/TestExchangeWrapper.json';
import testPriceOracleJson from '../../build/testing_contracts/TestPriceOracle.json';
import testMakerOracleJson from '../../build/testing_contracts/TestMakerOracle.json';
import testCurveJson from '../../build/testing_contracts/TestCurve.json';
import testUniswapV2PairJson from '../../build/testing_contracts/TestUniswapV2Pair.json';
import testUniswapV2Pair2Json from '../../build/testing_contracts/TestUniswapV2Pair2.json';
import testPolynomialInterestSetterJson
  from '../../build/testing_contracts/TestPolynomialInterestSetter.json';
import testDoubleExponentInterestSetterJson
  from '../../build/testing_contracts/TestDoubleExponentInterestSetter.json';
import testInterestSetterJson from '../../build/testing_contracts/TestInterestSetter.json';

import { address, SoloOptions } from '../../src/types';
import { Contracts } from '../../src/lib/Contracts';

export class TestContracts extends Contracts {

  // Contract instances
  public soloMargin: TestSoloMargin;

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
  public testSimpleCallee: TestSimpleCallee;
  public testExchangeWrapper: TestExchangeWrapper;
  public testPriceOracle: TestPriceOracle;
  public testMakerOracle: TestMakerOracle;
  public testCurve: TestCurve;
  public testUniswapV2Pair: TestUniswapV2Pair;
  public testUniswapV2Pair2: TestUniswapV2Pair2;
  public testPolynomialInterestSetter: TestPolynomialInterestSetter;
  public testDoubleExponentInterestSetter: TestDoubleExponentInterestSetter;
  public testInterestSetter: TestInterestSetter;

  constructor(
    provider: Provider,
    networkId: number,
    web3: Web3,
    options: SoloOptions,
  ) {
    super(provider, networkId, web3, options);

    // Testing Contracts
    this.testSoloMargin = new this.web3.eth.Contract(testSoloMarginJson.abi) as TestSoloMargin;
    this.soloMargin = this.testSoloMargin;
    this.tokenA = new this.web3.eth.Contract(tokenAJson.abi) as TestToken;
    this.tokenB = new this.web3.eth.Contract(tokenBJson.abi) as TestToken;
    this.tokenC = new this.web3.eth.Contract(tokenCJson.abi) as TestToken;
    this.erroringToken = new this.web3.eth.Contract(erroringTokenJson.abi) as TestToken;
    this.omiseToken = new this.web3.eth.Contract(omiseTokenJson.abi) as TestToken;
    this.testLib = new this.web3.eth.Contract(testLibJson.abi) as TestLib;
    this.testAutoTrader = new this.web3.eth.Contract(testAutoTraderJson.abi) as TestAutoTrader;
    this.testCallee = new this.web3.eth.Contract(testCalleeJson.abi) as TestCallee;
    this.testSimpleCallee = new this.web3.eth.Contract(
      testSimpleCalleeJson.abi) as TestSimpleCallee;
    this.testExchangeWrapper = new this.web3.eth.Contract(
      testExchangeWrapperJson.abi) as TestExchangeWrapper;
    this.testPriceOracle = new this.web3.eth.Contract(testPriceOracleJson.abi) as TestPriceOracle;
    this.testMakerOracle = new this.web3.eth.Contract(testMakerOracleJson.abi) as TestMakerOracle;
    this.testCurve = new this.web3.eth.Contract(testCurveJson.abi) as TestCurve;
    this.testUniswapV2Pair = new this.web3.eth.Contract(
      testUniswapV2PairJson.abi,
      ) as TestUniswapV2Pair;
    this.testUniswapV2Pair2 = new this.web3.eth.Contract(
      testUniswapV2Pair2Json.abi,
    ) as TestUniswapV2Pair2;
    this.testInterestSetter = new this.web3.eth.Contract(
      testInterestSetterJson.abi) as TestInterestSetter;
    this.testPolynomialInterestSetter = new this.web3.eth.Contract(
      testPolynomialInterestSetterJson.abi) as TestPolynomialInterestSetter;
    this.testDoubleExponentInterestSetter = new this.web3.eth.Contract(
      testDoubleExponentInterestSetterJson.abi) as TestDoubleExponentInterestSetter;

    this.setProvider(provider, networkId);
    this.setDefaultAccount(this.web3.eth.defaultAccount);
  }

  public setProvider(
    provider: Provider,
    networkId: number,
  ): void {
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
      { contract: this.erroringToken, json: erroringTokenJson },
      { contract: this.omiseToken, json: omiseTokenJson },
      { contract: this.testLib, json: testLibJson },
      { contract: this.testAutoTrader, json: testAutoTraderJson },
      { contract: this.testCallee, json: testCalleeJson },
      { contract: this.testSimpleCallee, json: testSimpleCalleeJson },
      { contract: this.testExchangeWrapper, json: testExchangeWrapperJson },
      { contract: this.testPriceOracle, json: testPriceOracleJson },
      { contract: this.testMakerOracle, json: testMakerOracleJson },
      { contract: this.testCurve, json: testCurveJson },
      { contract: this.testUniswapV2Pair, json: testUniswapV2PairJson },
      { contract: this.testUniswapV2Pair2, json: testUniswapV2Pair2Json },
      { contract: this.testPolynomialInterestSetter, json: testPolynomialInterestSetterJson },
      { contract: this.testDoubleExponentInterestSetter,
        json: testDoubleExponentInterestSetterJson },
      { contract: this.testInterestSetter, json: testInterestSetterJson },
    ];

    contracts.forEach(contract => this.setContractProvider(
        contract.contract,
        contract.json,
        provider,
        networkId,
        null,
      ),
    );
  }

  public setDefaultAccount(
    account: address,
  ): void {
    super.setDefaultAccount(account);

    // do not continue if not initialized
    if (!this.tokenA) {
      return;
    }

    // Test Contracts
    this.tokenA.options.from = account;
    this.tokenB.options.from = account;
    this.tokenC.options.from = account;
    this.erroringToken.options.from = account;
    this.omiseToken.options.from = account;
    this.testLib.options.from = account;
    this.testAutoTrader.options.from = account;
    this.testCallee.options.from = account;
    this.testSimpleCallee.options.from = account;
    this.testExchangeWrapper.options.from = account;
    this.testPriceOracle.options.from = account;
    this.testMakerOracle.options.from = account;
    this.testCurve.options.from = account;
    this.testUniswapV2Pair.options.from = account;
    this.testUniswapV2Pair2.options.from = account;
    this.testPolynomialInterestSetter.options.from = account;
    this.testDoubleExponentInterestSetter.options.from = account;
    this.testInterestSetter.options.from = account;
  }
}
