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

const ethers = require('ethers');

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
  isMatic,
  isMaticTest,
  isArbitrum,
  isArbitrumTest,
  getChainlinkFlags,
  getUniswapV3MultiRouter,
} = require('./helpers');
const {
  getChainlinkPriceOracleContract,
  getChainlinkPriceOracleV1Params,
} = require('./oracle_helpers');
const {
  getMaticAddress,
  getWethAddress,
} = require('./token_helpers');
const { bytecode: uniswapV2PairBytecode } = require('../build/contracts/UniswapV2Pair.json');


// ============ Contracts ============

// Base Protocol
const AdminImpl = artifacts.require('AdminImpl');
const OperationImpl = artifacts.require('OperationImpl');
const LiquidateOrVaporizeImpl = artifacts.require('LiquidateOrVaporizeImpl');
const TestOperationImpl = artifacts.require('TestOperationImpl');
const DolomiteMargin = artifacts.require('DolomiteMargin');

// MultiCall
const MultiCall = artifacts.require('MultiCall');
const ArbitrumMultiCall = artifacts.require('ArbitrumMultiCall');

// Test Contracts
const TestDolomiteMargin = artifacts.require('TestDolomiteMargin');
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
const PayableProxy = artifacts.require('PayableProxy');
const Expiry = artifacts.require('Expiry');
const LiquidatorProxyV1 = artifacts.require('LiquidatorProxyV1');
const LiquidatorProxyV1WithAmm = artifacts.require('LiquidatorProxyV1WithAmm');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
const DolomiteAmmRouterProxy = artifacts.require('DolomiteAmmRouterProxy');
const AmmRebalancerProxyV1 = artifacts.require('AmmRebalancerProxyV1');
const AmmRebalancerProxyV2 = artifacts.require('AmmRebalancerProxyV2');
const TestAmmRebalancerProxy = artifacts.require('TestAmmRebalancerProxy');
const TestUniswapAmmRebalancerProxy = artifacts.require('TestUniswapAmmRebalancerProxy');
const TestUniswapV3MultiRouter = artifacts.require('TestUniswapV3MultiRouter');
const TransferProxy = artifacts.require('TransferProxy');

// Interest Setters
const DoubleExponentInterestSetter = artifacts.require('DoubleExponentInterestSetter');

// Amm
const DolomiteAmmFactory = artifacts.require('DolomiteAmmFactory');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');
const SimpleFeeOwner = artifacts.require('SimpleFeeOwner');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployTestContracts(deployer, network),
    deployBaseProtocol(deployer, network),
    deployMultiCall(deployer, network),
  ]);
  await Promise.all([
    deployInterestSetters(deployer, network),
    deployPriceOracles(deployer, network, accounts),
    deploySecondLayer(deployer, network, accounts),
  ]);
  await deployer.deploy(
    SimpleFeeOwner,
    await DolomiteAmmFactory.address,
    (await getDolomiteMargin(network)).address,
  );
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
  await deployer.deploy(LiquidateOrVaporizeImpl);

  OperationImpl.link('LiquidateOrVaporizeImpl', LiquidateOrVaporizeImpl.address);

  await Promise.all([
    deployer.deploy(AdminImpl),
    deployer.deploy(OperationImpl),
  ]);

  let dolomiteMargin;
  if (isDevNetwork(network)) {
    await deployer.deploy(TestOperationImpl);
    dolomiteMargin = TestDolomiteMargin;
  } else if (isMatic(network) || isMaticTest(network) || isArbitrum(network) || isArbitrumTest(network)) {
    dolomiteMargin = DolomiteMargin;
  } else if (isKovan(network) || isMainNet(network)) {
    dolomiteMargin = DolomiteMargin;
  } else {
    throw new Error('Cannot deploy DolomiteMargin');
  }

  await Promise.all([
    dolomiteMargin.link('AdminImpl', AdminImpl.address),
    dolomiteMargin.link('OperationImpl', OperationImpl.address),
  ]);
  if (isDevNetwork(network)) {
    await dolomiteMargin.link('TestOperationImpl', TestOperationImpl.address);
  }
  await deployer.deploy(dolomiteMargin, getRiskParams(network), getRiskLimits());
}

async function deployMultiCall(deployer, network) {
  if (isArbitrum(network) || isArbitrumTest(network)) {
    deployer.deploy(ArbitrumMultiCall);
  } else {
    deployer.deploy(MultiCall);
  }
}

async function deployInterestSetters(deployer, network) {
  if (isDevNetwork(network)) {
    await deployer.deploy(TestInterestSetter);
  }
  await Promise.all([
    deployer.deploy(DoubleExponentInterestSetter, getDoubleExponentParams(network))
  ]);
}

async function deployPriceOracles(deployer, network) {
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

  const oracleContract = getChainlinkPriceOracleContract(network, artifacts);
  const params = getChainlinkPriceOracleV1Params(network, tokens, aggregators);
  await Promise.all([
    deployer.deploy(
      oracleContract,
      params.tokens,
      params.aggregators,
      params.tokenDecimals,
      params.tokenPairs,
      params.aggregatorDecimals,
      getChainlinkFlags(network),
    ),
  ]);
}

async function deploySecondLayer(deployer, network, accounts) {
  const dolomiteMargin = await getDolomiteMargin(network);

  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TestCallee, dolomiteMargin.address),
      deployer.deploy(TestSimpleCallee, dolomiteMargin.address),
      deployer.deploy(UniswapV2Factory, getSenderAddress(network, accounts)),
    ]);

    const weth = getWethAddress(network, WETH9);
    const uniswapV2Factory = await UniswapV2Factory.deployed();
    await deployer.deploy(UniswapV2Router02, uniswapV2Factory.address, weth);
    await UniswapV2Router02.deployed();
  }

  await deployer.deploy(
    TransferProxy,
    dolomiteMargin.address,
  );

  const dolomiteAmmFactory = await deployer.deploy(
    DolomiteAmmFactory,
    getSenderAddress(network, accounts),
    dolomiteMargin.address,
    TransferProxy.address,
  );

  const expiry = await deployer.deploy(
    Expiry,
    dolomiteMargin.address,
    getExpiryRampTime(network),
  );

  await deployer.deploy(
    DolomiteAmmRouterProxy,
    dolomiteMargin.address,
    dolomiteAmmFactory.address,
    expiry.address,
  );

  if (isDevNetwork(network) || isMaticTest(network) || isArbitrumTest(network)) {
    await deployer.deploy(
      TestAmmRebalancerProxy,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
    );
    await deployer.deploy(TestUniswapAmmRebalancerProxy);
  }
  if (isDevNetwork(network)) {
    await deployer.deploy(TestUniswapV3MultiRouter);
  }

  if (isDevNetwork(network)) {
    const uniswapV2Router = await UniswapV2Router02.deployed();
    await deployer.deploy(
      AmmRebalancerProxyV1,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      [uniswapV2Router.address],
      [ethers.utils.solidityKeccak256(['bytes'], [uniswapV2PairBytecode])],
    );
  } else {
    await deployer.deploy(
      AmmRebalancerProxyV1,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      [],
      [],
    );
  }

  await deployer.deploy(
    AmmRebalancerProxyV2,
    dolomiteMargin.address,
    dolomiteAmmFactory.address,
    getUniswapV3MultiRouter(network, TestUniswapV3MultiRouter),
  );

  await Promise.all([
    deployer.deploy(
      PayableProxy,
      dolomiteMargin.address,
      isMatic(network) || isMaticTest(network) ? getMaticAddress(network) : getWethAddress(network, WETH9),
    ),
    deployer.deploy(
      LiquidatorProxyV1,
      dolomiteMargin.address,
    ),
    deployer.deploy(
      LiquidatorProxyV1WithAmm,
      dolomiteMargin.address,
      DolomiteAmmRouterProxy.address,
      Expiry.address,
    ),
    deployer.deploy(
      SignedOperationProxy,
      dolomiteMargin.address,
      getChainId(network),
    ),
  ]);

  await Promise.all([
    dolomiteMargin.ownerSetGlobalOperator(
      PayableProxy.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      Expiry.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      SignedOperationProxy.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      DolomiteAmmRouterProxy.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      DolomiteAmmFactory.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      TransferProxy.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      LiquidatorProxyV1.address,
      true,
    ),
    dolomiteMargin.ownerSetGlobalOperator(
      LiquidatorProxyV1WithAmm.address,
      true,
    ),
  ]);
}

async function getDolomiteMargin(network) {
  if (isDevNetwork(network)) {
    return TestDolomiteMargin.deployed();
  }
  return DolomiteMargin.deployed();
}
