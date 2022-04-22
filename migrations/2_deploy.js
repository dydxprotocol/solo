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
  shouldOverwrite,
  getNoOverwriteParams,
} = require('./helpers');
const {
  getChainlinkPriceOracleContract,
  getChainlinkPriceOracleV1Params,
} = require('./oracle_helpers');
const {
  getWethAddress,
  getWrappedCurrencyAddress,
} = require('./token_helpers');
const { bytecode: uniswapV2PairBytecode } = require('../build/contracts/UniswapV2Pair.json');
const { getRebalancerV1Routers,
  getRebalancerV1InitHashes
} = require('./rebalancer_helpers');


// ============ Contracts ============

// Base Protocol
const AdminImpl = artifacts.require('AdminImpl');
const DolomiteMargin = artifacts.require('DolomiteMargin');
const CallImpl = artifacts.require('CallImpl');
const DepositImpl = artifacts.require('DepositImpl');
const LiquidateOrVaporizeImpl = artifacts.require('LiquidateOrVaporizeImpl');
const TradeImpl = artifacts.require('TradeImpl');
const TransferImpl = artifacts.require('TransferImpl');
const WithdrawalImpl = artifacts.require('WithdrawalImpl');
const OperationImpl = artifacts.require('OperationImpl');
const TestOperationImpl = artifacts.require('TestOperationImpl');

// MultiCall
const ArbitrumMultiCall = artifacts.require('ArbitrumMultiCall');
const MultiCall = artifacts.require('MultiCall');

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
const AmmRebalancerProxyV1 = artifacts.require('AmmRebalancerProxyV1');
const AmmRebalancerProxyV2 = artifacts.require('AmmRebalancerProxyV2');
const DepositWithdrawalProxy = artifacts.require('DepositWithdrawalProxy');
const DolomiteAmmRouterProxy = artifacts.require('DolomiteAmmRouterProxy');
const Expiry = artifacts.require('Expiry');
const LiquidatorProxyV1 = artifacts.require('LiquidatorProxyV1');
const LiquidatorProxyV1WithAmm = artifacts.require('LiquidatorProxyV1WithAmm');
const PayableProxy = artifacts.require('PayableProxy');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
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
  await deployTestContracts(deployer, network);
  await deployBaseProtocol(deployer, network);
  await deployMultiCall(deployer, network);
  await deployInterestSetters(deployer, network);
  await deployPriceOracles(deployer, network, accounts);
  await deploySecondLayer(deployer, network, accounts);
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
  if (shouldOverwrite(CallImpl, network)) {
    await deployer.deploy(CallImpl);
  } else {
    await deployer.deploy(CallImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(DepositImpl, network)) {
    await deployer.deploy(DepositImpl);
  } else {
    await deployer.deploy(DepositImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(LiquidateOrVaporizeImpl, network)) {
    await deployer.deploy(LiquidateOrVaporizeImpl);
  } else {
    await deployer.deploy(LiquidateOrVaporizeImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(TradeImpl, network)) {
    await deployer.deploy(TradeImpl);
  } else {
    await deployer.deploy(TradeImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(TransferImpl, network)) {
    await deployer.deploy(TransferImpl);
  } else {
    await deployer.deploy(TransferImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(WithdrawalImpl, network)) {
    await deployer.deploy(WithdrawalImpl);
  } else {
    await deployer.deploy(WithdrawalImpl, getNoOverwriteParams());
  }


  OperationImpl.link('CallImpl', CallImpl.address);
  OperationImpl.link('DepositImpl', DepositImpl.address);
  OperationImpl.link('LiquidateOrVaporizeImpl', LiquidateOrVaporizeImpl.address);
  OperationImpl.link('TradeImpl', TradeImpl.address);
  OperationImpl.link('TransferImpl', TransferImpl.address);
  OperationImpl.link('WithdrawalImpl', WithdrawalImpl.address);

  if (shouldOverwrite(AdminImpl, network)) {
    await deployer.deploy(AdminImpl);
  } else {
    await deployer.deploy(AdminImpl, getNoOverwriteParams());
  }

  if (shouldOverwrite(OperationImpl, network)) {
    await deployer.deploy(OperationImpl);
  } else {
    await deployer.deploy(OperationImpl, getNoOverwriteParams());
  }

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

  if (shouldOverwrite(dolomiteMargin, network)) {
    await deployer.deploy(dolomiteMargin, getRiskParams(network), getRiskLimits());
  } else {
    await deployer.deploy(dolomiteMargin, getNoOverwriteParams());
  }
}

async function deployMultiCall(deployer, network) {
  let multiCall;
  if (isArbitrum(network) || isArbitrumTest(network)) {
    multiCall = ArbitrumMultiCall;
  } else {
    multiCall = MultiCall;
  }

  if (shouldOverwrite(multiCall, network)) {
    await deployer.deploy(multiCall);
  } else {
    await deployer.deploy(multiCall, getNoOverwriteParams());
  }
}

async function deployInterestSetters(deployer, network) {
  if (isDevNetwork(network)) {
    await deployer.deploy(TestInterestSetter);
  }

  if (shouldOverwrite(DoubleExponentInterestSetter, network)) {
    await deployer.deploy(DoubleExponentInterestSetter, getDoubleExponentParams(network));
  } else {
    await deployer.deploy(DoubleExponentInterestSetter, getNoOverwriteParams());
  }
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

  if (shouldOverwrite(oracleContract, network)) {
    await deployer.deploy(
      oracleContract,
      params.tokens,
      params.aggregators,
      params.tokenDecimals,
      params.tokenPairs,
      params.aggregatorDecimals,
      getChainlinkFlags(network)
    );
  } else {
    await deployer.deploy(
      oracleContract,
      getNoOverwriteParams(),
    );
  }
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

  const transferProxy = TransferProxy;
  if (shouldOverwrite(transferProxy, network)) {
    await deployer.deploy(
      transferProxy,
      dolomiteMargin.address,
    );
  } else {
    await deployer.deploy(
      transferProxy,
      getNoOverwriteParams(),
    );
  }

  const depositWithdrawalProxy = DepositWithdrawalProxy;
  if (shouldOverwrite(depositWithdrawalProxy, network)) {
    await deployer.deploy(
      depositWithdrawalProxy,
      dolomiteMargin.address,
    );
  } else {
    await deployer.deploy(
      depositWithdrawalProxy,
      getNoOverwriteParams(),
    );
  }

  const dolomiteAmmFactory = DolomiteAmmFactory;
  if (shouldOverwrite(dolomiteAmmFactory, network)) {
    await deployer.deploy(
      dolomiteAmmFactory,
      getSenderAddress(network, accounts),
      dolomiteMargin.address,
      transferProxy.address,
    );
  } else {
    await deployer.deploy(
      dolomiteAmmFactory,
      getNoOverwriteParams(),
    );
  }

  const simpleFeeOwner = SimpleFeeOwner;
  if (shouldOverwrite(simpleFeeOwner, network)) {
    await deployer.deploy(
      simpleFeeOwner,
      dolomiteAmmFactory.address,
      dolomiteMargin.address,
    );
  } else {
    await deployer.deploy(
      simpleFeeOwner,
      getNoOverwriteParams(),
    );
  }

  const expiry = Expiry;
  if (shouldOverwrite(expiry, network)) {
    await deployer.deploy(
      expiry,
      dolomiteMargin.address,
      getExpiryRampTime(network),
    );
  } else {
    await deployer.deploy(
      expiry,
      getNoOverwriteParams(),
    );
  }

  const dolomiteAmmRouterProxy = DolomiteAmmRouterProxy;
  if (shouldOverwrite(dolomiteAmmRouterProxy, network)) {
    await deployer.deploy(
      dolomiteAmmRouterProxy,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      expiry.address,
    );
  } else {
    await deployer.deploy(
      dolomiteAmmRouterProxy,
      getNoOverwriteParams(),
    );
  }

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

    const uniswapV2Router = await UniswapV2Router02.deployed();
    await deployer.deploy(
      AmmRebalancerProxyV1,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      [uniswapV2Router.address],
      [ethers.utils.solidityKeccak256(['bytes'], [uniswapV2PairBytecode])],
    );
  } else {
    if (shouldOverwrite(AmmRebalancerProxyV1, network)) {
      await deployer.deploy(
        AmmRebalancerProxyV1,
        dolomiteMargin.address,
        dolomiteAmmFactory.address,
        getRebalancerV1Routers(network),
        getRebalancerV1InitHashes(network),
      );
    } else {
      await deployer.deploy(
        AmmRebalancerProxyV1,
        getNoOverwriteParams(),
      );
    }
  }

  if (isDevNetwork(network) || isMaticTest(network) || isArbitrumTest(network)) {
    await deployer.deploy(
      TestAmmRebalancerProxy,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      getNoOverwriteParams(),
    );
    await deployer.deploy(TestUniswapAmmRebalancerProxy, getNoOverwriteParams());
  }

  const ammRebalancerProxyV2 = AmmRebalancerProxyV2
  if (shouldOverwrite(ammRebalancerProxyV2, network)) {
    await deployer.deploy(
      ammRebalancerProxyV2,
      dolomiteMargin.address,
      dolomiteAmmFactory.address,
      getUniswapV3MultiRouter(network, TestUniswapV3MultiRouter),
    );
  } else {
    await deployer.deploy(
      ammRebalancerProxyV2,
      getNoOverwriteParams()
    );
  }

  const payableProxy = PayableProxy
  if (shouldOverwrite(payableProxy, network)) {
    await deployer.deploy(
      payableProxy,
      dolomiteMargin.address,
      getWrappedCurrencyAddress(network, WETH9),
    );
  } else {
    await deployer.deploy(
      payableProxy,
      getNoOverwriteParams(),
    );
  }

  const liquidatorProxyV1 = LiquidatorProxyV1
  if (shouldOverwrite(liquidatorProxyV1, network)) {
    await deployer.deploy(
      liquidatorProxyV1,
      dolomiteMargin.address,
    );
  } else {
    await deployer.deploy(
      liquidatorProxyV1,
      getNoOverwriteParams(),
    );
  }

  const liquidatorProxyV1WithAmm = LiquidatorProxyV1WithAmm
  if (shouldOverwrite(liquidatorProxyV1WithAmm, network)) {
    await deployer.deploy(
      liquidatorProxyV1WithAmm,
      dolomiteMargin.address,
      DolomiteAmmRouterProxy.address,
      Expiry.address,
    );
  } else {
    await deployer.deploy(
      liquidatorProxyV1WithAmm,
      getNoOverwriteParams(),
    )
  }

  const signedOperationProxy = SignedOperationProxy
  if (shouldOverwrite(signedOperationProxy, network)) {
    await deployer.deploy(
      signedOperationProxy,
      dolomiteMargin.address,
      getChainId(network),
    )
  } else {
    await deployer.deploy(
      signedOperationProxy,
      getNoOverwriteParams(),
    );
  }

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
      DepositWithdrawalProxy.address,
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
