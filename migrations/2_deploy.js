/*

    Copyright 2019 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License";
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

const {
  isDevNetwork,
  isKovan,
  isMainNet,
  getPolynomialParams,
  getRiskLimits,
  getRiskParams,
  getDaiPriceOracleParams,
  getExpiryRampTime,
  getOraclePokerAddress,
} = require('./helpers');
const { ADDRESSES } = require('../src/lib/Constants.ts');

// ============ Contracts ============

// Base Protocol
const AdminImpl = artifacts.require('AdminImpl');
const OperationImpl = artifacts.require('OperationImpl');
const SoloMargin = artifacts.require('SoloMargin');

// Test Contracts
const TestSoloMargin = artifacts.require('TestSoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const ErroringToken = artifacts.require('ErroringToken');
const OmiseToken = artifacts.require('OmiseToken');
const TestLib = artifacts.require('TestLib');
const TestAutoTrader = artifacts.require('TestAutoTrader');
const TestCallee = artifacts.require('TestCallee');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestMakerOracle = artifacts.require('TestMakerOracle');
const TestOasisDex = artifacts.require('TestOasisDex');
const TestInterestSetter = artifacts.require('TestInterestSetter');
const TestPolynomialInterestSetter = artifacts.require('TestPolynomialInterestSetter');
const TestExchangeWrapper = artifacts.require('TestExchangeWrapper');
const WETH9 = artifacts.require('WETH9');

// Second-Layer Contracts
const PayableProxyForSoloMargin = artifacts.require('PayableProxyForSoloMargin');
const Expiry = artifacts.require('Expiry');

// Interest Setters
const PolynomialInterestSetter = artifacts.require('PolynomialInterestSetter');

// Oracles
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const UsdcPriceOracle = artifacts.require('UsdcPriceOracle');
const WethPriceOracle = artifacts.require('WethPriceOracle');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployTestContracts(deployer, network),
    deployBaseProtocol(deployer, network),
  ]);
  await Promise.all([
    deployInterestSetters(deployer, network),
    deployPriceOracles(deployer, network, accounts),
    deploySecondLayer(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployTestContracts(deployer, network) {
  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TokenA),
      deployer.deploy(TokenB),
      deployer.deploy(TokenC),
      deployer.deploy(WETH9),
      deployer.deploy(ErroringToken),
      deployer.deploy(OmiseToken),
      deployer.deploy(TestLib),
      deployer.deploy(TestAutoTrader),
      deployer.deploy(TestExchangeWrapper),
      deployer.deploy(TestPolynomialInterestSetter, getPolynomialParams(network)),
      deployer.deploy(TestMakerOracle),
      deployer.deploy(TestOasisDex),
    ]);
  }
}

async function deployBaseProtocol(deployer, network) {
  await Promise.all([
    deployer.deploy(AdminImpl),
    deployer.deploy(OperationImpl),
  ]);

  let soloMargin;
  if (isDevNetwork(network)) {
    soloMargin = TestSoloMargin;
  } else if (isKovan(network) || isMainNet(network)) {
    soloMargin = SoloMargin;
  } else {
    throw new Error('Cannot deploy SoloMargin');
  }

  await Promise.all([
    soloMargin.link('AdminImpl', AdminImpl.address),
    soloMargin.link('OperationImpl', OperationImpl.address),
  ]);
  await deployer.deploy(soloMargin, getRiskParams(network), getRiskLimits());
}

async function deployInterestSetters(deployer, network) {
  if (isDevNetwork(network)) {
    await deployer.deploy(TestInterestSetter);
  }
  await deployer.deploy(PolynomialInterestSetter, getPolynomialParams(network));
}

async function deployPriceOracles(deployer, network, accounts) {
  if (
    isDevNetwork(network)
    || isKovan(network)
  ) {
    await deployer.deploy(TestPriceOracle);
  }

  const daiPriceOracleParams = getDaiPriceOracleParams(network);

  await Promise.all([
    deployer.deploy(
      DaiPriceOracle,
      getOraclePokerAddress(network, accounts),
      getWethAddress(network),
      getDaiAddress(network),
      getMedianizerAddress(network),
      getOasisAddress(network),
      getUniswapAddress(network),
      daiPriceOracleParams.oasisEthAmount,
      daiPriceOracleParams.deviationParams,
    ),
    deployer.deploy(UsdcPriceOracle),
    deployer.deploy(WethPriceOracle, getMedianizerAddress(network)),
  ]);
}

async function deploySecondLayer(deployer, network) {
  const soloMargin = await getSoloMargin(network);

  if (isDevNetwork(network)) {
    await deployer.deploy(TestCallee, soloMargin.address);
  }

  await Promise.all([
    deployer.deploy(
      PayableProxyForSoloMargin,
      soloMargin.address,
      getWethAddress(network),
    ),
    deployer.deploy(
      Expiry,
      soloMargin.address,
      getExpiryRampTime(),
    ),
  ]);

  await Promise.all([
    soloMargin.ownerSetGlobalOperator(
      PayableProxyForSoloMargin.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      Expiry.address,
      true,
    ),
  ]);
}

async function getSoloMargin(network) {
  if (isDevNetwork(network)) {
    return TestSoloMargin.deployed();
  }
  return SoloMargin.deployed();
}

// ============ Address Helper Functions ============

function getMedianizerAddress(network) {
  if (isDevNetwork(network)) {
    return TestMakerOracle.address;
  }
  if (isMainNet(network)) {
    return '0x729D19f657BD0614b4985Cf1D82531c67569197B';
  }
  if (isKovan(network)) {
    return '0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66';
  }
  throw new Error('Cannot find Medianizer');
}

function getDaiAddress(network) {
  if (isDevNetwork(network)) {
    return TokenB.address;
  }
  if (isMainNet(network)) {
    return '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';
  }
  if (isKovan(network)) {
    return '0xC4375B7De8af5a38a93548eb8453a498222C4fF2';
  }
  throw new Error('Cannot find Dai');
}

function getOasisAddress(network) {
  if (isDevNetwork(network)) {
    return TestOasisDex.address;
  }
  if (isMainNet(network)) {
    return '0x39755357759cE0d7f32dC8dC45414CCa409AE24e';
  }
  if (isKovan(network)) {
    return '0x4A6bC4e803c62081ffEbCc8d227B5a87a58f1F8F';
  }
  throw new Error('Cannot find OasisDex');
}

function getUniswapAddress(network) {
  if (isDevNetwork(network)) {
    return ADDRESSES.TEST_UNISWAP; // for testing
  }
  if (isMainNet(network)) {
    return '0x09cabec1ead1c0ba254b09efb3ee13841712be14';
  }
  if (isKovan(network)) {
    return '0x47D4Af3BBaEC0dE4dba5F44ae8Ed2761977D32d6';
  }
  throw new Error('Cannot find Uniswap');
}

function getWethAddress(network) {
  if (isDevNetwork(network)) {
    return WETH9.address;
  }
  if (isMainNet(network)) {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }
  if (isKovan(network)) {
    return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
  }
  throw new Error('Cannot find Weth');
}
