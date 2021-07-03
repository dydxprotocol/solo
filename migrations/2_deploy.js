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
  getExpiryRampTime,
  getSenderAddress,
  getChainId,
  getOraclePokerAddress,
  getDaiPriceOracleParams,
  isMatic,
  isMaticTest,
} = require('./helpers');
const {
  getChainlinkPriceOracleV1Params,
} = require('./oracle_helpers');
const {
  getDaiAddress,
  getWethAddress,
} = require('./token_helpers');
const { ADDRESSES } = require('../src/lib/Constants');

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
const TokenD = artifacts.require('TokenD');
const TokenE = artifacts.require('TokenE');
const TokenF = artifacts.require('TokenF');
const ErroringToken = artifacts.require('ErroringToken');
const OmiseToken = artifacts.require('OmiseToken');
const TestLib = artifacts.require('TestLib');
const TestAutoTrader = artifacts.require('TestAutoTrader');
const TestCallee = artifacts.require('TestCallee');
const TestSimpleCallee = artifacts.require('TestSimpleCallee');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestBtcUsdChainlinkAggregator = artifacts.require('TestBtcUsdChainlinkAggregator');
const TestDaiUsdChainlinkAggregator = artifacts.require('TestDaiUsdChainlinkAggregator');
const TestEthUsdChainlinkAggregator = artifacts.require('TestEthUsdChainlinkAggregator');
const TestLinkUsdChainlinkAggregator = artifacts.require('TestLinkUsdChainlinkAggregator');
const TestLrcEthChainlinkAggregator = artifacts.require('TestLrcEthChainlinkAggregator');
const TestMaticUsdChainlinkAggregator = artifacts.require('TestMaticUsdChainlinkAggregator');
const TestUsdcUsdChainlinkAggregator = artifacts.require('TestUsdcUsdChainlinkAggregator');
const TestMakerOracle = artifacts.require('TestMakerOracle');
const TestOasisDex = artifacts.require('TestOasisDex');
const TestInterestSetter = artifacts.require('TestInterestSetter');
const TestPolynomialInterestSetter = artifacts.require('TestPolynomialInterestSetter');
const TestDoubleExponentInterestSetter = artifacts.require('TestDoubleExponentInterestSetter');
const TestExchangeWrapper = artifacts.require('TestExchangeWrapper');
const WETH9 = artifacts.require('WETH9');

// Second-Layer Contracts
const PayableProxyForSoloMargin = artifacts.require('PayableProxyForSoloMargin');
const Expiry = artifacts.require('Expiry');
const ExpiryV2 = artifacts.require('ExpiryV2');
const Refunder = artifacts.require('Refunder');
const DaiMigrator = artifacts.require('DaiMigrator');
const LiquidatorProxyV1ForSoloMargin = artifacts.require('LiquidatorProxyV1ForSoloMargin');
const LiquidatorProxyV1WithAmmForSoloMargin = artifacts.require('LiquidatorProxyV1WithAmmForSoloMargin');
const LimitOrders = artifacts.require('LimitOrders');
const StopLimitOrders = artifacts.require('StopLimitOrders');
const CanonicalOrders = artifacts.require('CanonicalOrders');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
const DolomiteAmmRouterProxy = artifacts.require('DolomiteAmmRouterProxy');
const TransferProxy = artifacts.require('TransferProxy');

// Interest Setters
const DoubleExponentInterestSetter = artifacts.require('DoubleExponentInterestSetter');

// Oracles
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const WethPriceOracle = artifacts.require('WethPriceOracle');
const UsdcPriceOracle = artifacts.require('UsdcPriceOracle');
const ChainlinkPriceOracleV1 = artifacts.require('ChainlinkPriceOracleV1');

// Amm
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const SimpleFeeOwner = artifacts.require('SimpleFeeOwner');

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
  await deployer.deploy(
    SimpleFeeOwner,
    await getUniswapV2FactoryAddress(network),
    (await getSoloMargin(network)).address,
  );
  await (await UniswapV2Factory.deployed()).contract.methods.setFeeToSetter(SimpleFeeOwner.address);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployTestContracts(deployer, network) {
  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TokenA),
      deployer.deploy(TokenB),
      deployer.deploy(TokenC),
      deployer.deploy(TokenD),
      deployer.deploy(TokenE),
      deployer.deploy(TokenF),
      deployer.deploy(WETH9),
      deployer.deploy(ErroringToken),
      deployer.deploy(OmiseToken),
      deployer.deploy(TestLib),
      deployer.deploy(TestAutoTrader),
      deployer.deploy(TestExchangeWrapper),
      deployer.deploy(TestPolynomialInterestSetter, getPolynomialParams(network)),
      deployer.deploy(TestDoubleExponentInterestSetter, getDoubleExponentParams(network)),
      deployer.deploy(TestMakerOracle),
      deployer.deploy(TestOasisDex),
    ]);
  }
}

async function deployBaseProtocol(deployer, network) {
  await Promise.all([
    deployer.deploy(AdminImpl),
    deployer.deploy(OperationImpl, { gas: 6600000 }),
  ]);

  let soloMargin;
  if (isDevNetwork(network)) {
    soloMargin = TestSoloMargin;
  } else if (isMatic(network) || isMaticTest(network)) {
    soloMargin = SoloMargin;
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
    deployer.deploy(DoubleExponentInterestSetter, getDoubleExponentParams(network)),
  ]);
}

async function deployPriceOracles(deployer, network, accounts) {
  if (isDevNetwork(network) || isKovan(network)) {
    await deployer.deploy(TestPriceOracle);
  }

  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TestBtcUsdChainlinkAggregator),
      deployer.deploy(TestDaiUsdChainlinkAggregator),
      deployer.deploy(TestEthUsdChainlinkAggregator),
      deployer.deploy(TestLinkUsdChainlinkAggregator),
      deployer.deploy(TestLrcEthChainlinkAggregator),
      deployer.deploy(TestMaticUsdChainlinkAggregator),
      deployer.deploy(TestUsdcUsdChainlinkAggregator),
    ]);
  }

  const tokens = {
    TokenA,
    TokenB,
    TokenD,
    TokenE,
    TokenF,
    WETH9,
  };

  const aggregators = {
    btcUsdAggregator: TestBtcUsdChainlinkAggregator,
    daiUsdAggregator: TestDaiUsdChainlinkAggregator,
    ethUsdAggregator: TestEthUsdChainlinkAggregator,
    linkUsdAggregator: TestLinkUsdChainlinkAggregator,
    lrcEthAggregator: TestLrcEthChainlinkAggregator,
    maticUsdAggregator: TestMaticUsdChainlinkAggregator,
    usdcUsdAggregator: TestUsdcUsdChainlinkAggregator,
  };

  const params = getChainlinkPriceOracleV1Params(network, tokens, aggregators);
  await Promise.all([
    deployer.deploy(
      ChainlinkPriceOracleV1,
      params.tokens,
      params.aggregators,
      params.tokenDecimals,
      params.tokenPairs,
      params.aggregatorDecimals,
    ),
  ]);

  if (!isMaticTest(network) && !isMatic(network)) {
    const daiPriceOracleParams = getDaiPriceOracleParams(network);
    await Promise.all([
      deployer.deploy(
        DaiPriceOracle,
        getOraclePokerAddress(network, accounts),
        getWethAddress(network, WETH9),
        getDaiAddress(network, TokenB),
        getMedianizerAddress(network),
        getOasisAddress(network),
        getDaiUniswapAddress(network),
        daiPriceOracleParams.oasisEthAmount,
        daiPriceOracleParams.deviationParams,
      ),
      deployer.deploy(UsdcPriceOracle),
      deployer.deploy(WethPriceOracle, getMedianizerAddress(network)),
    ]);
  }
}

async function deploySecondLayer(deployer, network, accounts) {
  const soloMargin = await getSoloMargin(network);

  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TestCallee, soloMargin.address),
      deployer.deploy(TestSimpleCallee, soloMargin.address),
    ]);
  }

  await deployer.deploy(
    TransferProxy,
    soloMargin.address,
  );

  await deployer.deploy(
    UniswapV2Factory,
    getSenderAddress(network, accounts),
    (await getSoloMargin(network)).address,
    TransferProxy.address,
  );

  await deployer.deploy(
    DolomiteAmmRouterProxy,
    soloMargin.address,
    getUniswapV2FactoryAddress(network),
    getWethAddress(network, WETH9),
  );

  await Promise.all([
    deployer.deploy(
      PayableProxyForSoloMargin,
      soloMargin.address,
      getWethAddress(network, WETH9),
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
      LiquidatorProxyV1WithAmmForSoloMargin,
      soloMargin.address,
      DolomiteAmmRouterProxy.address,
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
    soloMargin.ownerSetGlobalOperator(
      DolomiteAmmRouterProxy.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      TransferProxy.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      LiquidatorProxyV1ForSoloMargin.address,
      true,
    ),
    soloMargin.ownerSetGlobalOperator(
      LiquidatorProxyV1WithAmmForSoloMargin.address,
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

function getOasisAddress(network) {
  if (isDevNetwork(network)) {
    return TestOasisDex.address;
  }
  if (isMainNet(network)) {
    return '0x794e6e91555438aFc3ccF1c5076A74F42133d08D';
  }
  if (isKovan(network)) {
    return '0x4A6bC4e803c62081ffEbCc8d227B5a87a58f1F8F';
  }
  throw new Error('Cannot find OasisDex');
}

function getUniswapV2FactoryAddress(network) {
  return UniswapV2Factory.address;
}

function getDaiUniswapAddress(network) {
  if (isDevNetwork(network)) {
    return ADDRESSES.TEST_UNISWAP;
  }
  if (isMainNet(network)) {
    return '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667';
  }
  if (isKovan(network)) {
    return '0x40b4d262fd09814e5e96f7b386d81ba4659a2b1d';
  }
  throw new Error('Cannot find Uniswap for Dai');
}
