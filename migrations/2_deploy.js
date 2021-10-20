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
  getDoubleExponentParams,
  getRiskLimits,
  getRiskParams,
  getDaiPriceOracleDeviationParams,
  getExpiryRampTime,
  getFinalSettlementRampTime,
  getOraclePokerAddress,
  getSenderAddress,
  getChainId,
} = require('./helpers');

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
const TestSimpleCallee = artifacts.require('TestSimpleCallee');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestMakerOracle = artifacts.require('TestMakerOracle');
const TestCurve = artifacts.require('TestCurve');
const TestUniswapV2Pair = artifacts.require('TestUniswapV2Pair');
const TestUniswapV2Pair2 = artifacts.require('TestUniswapV2Pair2');
const TestInterestSetter = artifacts.require('TestInterestSetter');
const TestPolynomialInterestSetter = artifacts.require('TestPolynomialInterestSetter');
const TestDoubleExponentInterestSetter = artifacts.require('TestDoubleExponentInterestSetter');
const TestExchangeWrapper = artifacts.require('TestExchangeWrapper');
const WETH9 = artifacts.require('WETH9');

// Second-Layer Contracts
const PayableProxyForSoloMargin = artifacts.require('PayableProxyForSoloMargin');
const Expiry = artifacts.require('Expiry');
const ExpiryV2 = artifacts.require('ExpiryV2');
const FinalSettlement = artifacts.require('FinalSettlement');
const Refunder = artifacts.require('Refunder');
const DaiMigrator = artifacts.require('DaiMigrator');
const LiquidatorProxyV1ForSoloMargin = artifacts.require('LiquidatorProxyV1ForSoloMargin');
const LimitOrders = artifacts.require('LimitOrders');
const StopLimitOrders = artifacts.require('StopLimitOrders');
const CanonicalOrders = artifacts.require('CanonicalOrders');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');

// Interest Setters
const PolynomialInterestSetter = artifacts.require('PolynomialInterestSetter');
const DoubleExponentInterestSetter = artifacts.require('DoubleExponentInterestSetter');

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
    deploySecondLayer(deployer, network, accounts),
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
      deployer.deploy(TestDoubleExponentInterestSetter, getDoubleExponentParams(network)),
      deployer.deploy(TestMakerOracle),
      deployer.deploy(TestCurve),
      deployer.deploy(TestUniswapV2Pair),
      deployer.deploy(TestUniswapV2Pair2),
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
  await Promise.all([
    deployer.deploy(PolynomialInterestSetter, getPolynomialParams(network)),
    deployer.deploy(DoubleExponentInterestSetter, getDoubleExponentParams(network)),
  ]);
}

async function deployPriceOracles(deployer, network, accounts) {
  if (
    isDevNetwork(network)
    || isKovan(network)
  ) {
    await deployer.deploy(TestPriceOracle);
  }

  const daiPriceOracleDeviationParams = getDaiPriceOracleDeviationParams(network);

  await Promise.all([
    deployer.deploy(
      DaiPriceOracle,
      getOraclePokerAddress(network, accounts),
      getWethAddress(network),
      getDaiAddress(network),
      getCurveAddress(network),
      getUniswapDaiEthAddress(network),
      getUniswapUsdcEthAddress(network),
      daiPriceOracleDeviationParams,
    ),
    deployer.deploy(UsdcPriceOracle),
    deployer.deploy(WethPriceOracle, getMedianizerAddress(network)),
  ]);
}

async function deploySecondLayer(deployer, network, accounts) {
  const soloMargin = await getSoloMargin(network);

  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TestCallee, soloMargin.address),
      deployer.deploy(TestSimpleCallee, soloMargin.address),
    ]);
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
    deployer.deploy(
      ExpiryV2,
      soloMargin.address,
      getExpiryRampTime(),
    ),
    deployer.deploy(
      FinalSettlement,
      soloMargin.address,
      getFinalSettlementRampTime(),
    ),
    deployer.deploy(
      Refunder,
      soloMargin.address,
      [],
    ),
    deployer.deploy(
      DaiMigrator,
      [],
    ),
    deployer.deploy(
      LiquidatorProxyV1ForSoloMargin,
      soloMargin.address,
    ),
    deployer.deploy(
      LimitOrders,
      soloMargin.address,
      getChainId(network),
    ),
    deployer.deploy(
      StopLimitOrders,
      soloMargin.address,
      getChainId(network),
    ),
    deployer.deploy(
      CanonicalOrders,
      soloMargin.address,
      getSenderAddress(network, accounts),
      getChainId(network),
    ),
    deployer.deploy(
      SignedOperationProxy,
      soloMargin.address,
      getChainId(network),
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
    soloMargin.ownerSetGlobalOperator(
      ExpiryV2.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      FinalSettlement.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      Refunder.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      DaiMigrator.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      LimitOrders.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      StopLimitOrders.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      CanonicalOrders.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      SignedOperationProxy.address,
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
    return '0x29a199a49af8d657c110418c2b0d2f932b025de7';
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
    return '0x6b175474e89094c44da98b954eedeac495271d0f';
  }
  if (isKovan(network)) {
    return '0x5944413037920674d39049ec4844117a031eaa74';
  }
  throw new Error('Cannot find Dai');
}

function getCurveAddress(network) {
  if (isDevNetwork(network)) {
    return TestCurve.address;
  }
  if (isMainNet(network)) {
    return '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD';
  }
  throw new Error('Cannot find Curve');
}

function getUniswapDaiEthAddress(network) {
  if (isDevNetwork(network)) {
    return TestUniswapV2Pair.address;
  }
  if (isMainNet(network)) {
    return '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11';
  }
  throw new Error('Cannot find DAI-ETH Uniswap pool');
}

function getUniswapUsdcEthAddress(network) {
  if (isDevNetwork(network)) {
    return TestUniswapV2Pair2.address;
  }
  if (isMainNet(network)) {
    return '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc';
  }
  throw new Error('Cannot find USDC-ETH Uniswap pool');
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
