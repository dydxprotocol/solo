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

const {
  isDevNetwork,
  isKovan,
  isMainNet,
  isDocker,
  isMatic,
  isMaticTest,
  isArbitrum,
  isArbitrumTest,
} = require('./helpers');
const {
  getDaiAddress,
  getLinkAddress,
  getMaticAddress,
  getUsdcAddress,
  getWethAddress,
  getWbtcAddress,
  getWrappedCurrencyAddress,
  getUsdtAddress,
} = require('./token_helpers');
const { getChainlinkPriceOracleContract } = require('./oracle_helpers');

// ============ Contracts ============

// Base Protocol
const DolomiteMargin = artifacts.require('DolomiteMargin');
const DepositWithdrawalProxy = artifacts.require('DepositWithdrawalProxy');
const Expiry = artifacts.require('Expiry');

// Test Contracts
const TestDolomiteMargin = artifacts.require('TestDolomiteMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenD = artifacts.require('TokenD');
const TokenF = artifacts.require('TokenF');
const WETH9 = artifacts.require('WETH9');
const TestPriceOracle = artifacts.require('TestPriceOracle');

// Interest Setters
const DoubleExponentInterestSetter = artifacts.require('DoubleExponentInterestSetter');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await setupProtocol(deployer, network, accounts);
};

module.exports = migration;

// ============ Setup Functions ============

async function setupProtocol(deployer, network) {
  const expiry = await Expiry.deployed();
  const dolomiteMargin = await getDolomiteMargin(network);
  await dolomiteMargin.ownerSetAutoTraderSpecial(expiry.address, true);

  if (isDevNetwork(network) && !isDocker(network)) {
    return;
  }

  const [tokens, oracles, setters] = await Promise.all([getTokens(network), getOracles(network), getSetters(network)]);

  await addMarkets(dolomiteMargin, tokens, oracles, setters);

  const depositWithdrawalProxy = await DepositWithdrawalProxy.deployed();
  depositWithdrawalProxy.initializeETHMarket(getWrappedCurrencyAddress(network, WETH9));
}

async function addMarkets(dolomiteMargin, tokens, priceOracles, interestSetters) {
  const marginPremium = { value: '0' };
  const spreadPremium = { value: '0' };
  const maxWei = '0';
  const isClosed = false;
  const isRecyclable = false;

  for (let i = 0; i < tokens.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await dolomiteMargin.ownerAddMarket(
      tokens[i].address,
      priceOracles[i].address,
      interestSetters[i].address,
      marginPremium,
      spreadPremium,
      maxWei,
      isClosed,
      isRecyclable,
    );
  }
}

// ============ Network Getter Functions ============

async function getDolomiteMargin(network) {
  if (isDevNetwork(network)) {
    return TestDolomiteMargin.deployed();
  }
  return DolomiteMargin.deployed();
}

function getTokens(network) {
  if (isMatic(network)) {
    return [
      { address: getWethAddress(network, WETH9) },
      { address: getDaiAddress(network, TokenB) },
      { address: getMaticAddress(network, TokenD) },
      { address: getUsdcAddress(network, TokenA) },
      { address: getLinkAddress(network, TokenF) },
    ];
  } else if (isMaticTest(network)) {
    return [
      { address: getWethAddress(network, WETH9) },
      { address: getDaiAddress(network, TokenB) },
      { address: getMaticAddress(network, TokenD) },
      { address: getUsdcAddress(network, TokenA) },
    ];
  } else if (isArbitrum(network) || isArbitrumTest(network)) {
    const tokens = [
      { address: getWethAddress(network, WETH9) },
      { address: getDaiAddress(network, TokenB) },
      { address: getUsdcAddress(network, TokenA) },
      { address: getLinkAddress(network, TokenF) },
      { address: getWbtcAddress(network, TokenD) },
    ];
    if (isArbitrum(network)) {
      tokens.push({ address: getUsdtAddress(network) });
    }
    return tokens;
  }

  throw new Error('unknown network');
}

async function getOracles(network) {
  const tokens = getTokens(network);
  if (isDocker(network)) {
    return tokens.map(() => ({ address: TestPriceOracle.address }));
  }

  const OracleContract = getChainlinkPriceOracleContract(network, artifacts);
  if (isKovan(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  if (isMainNet(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  if (isMaticTest(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  if (isMatic(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  if (isArbitrum(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  if (isArbitrumTest(network)) {
    return tokens.map(() => ({ address: OracleContract.address }));
  }
  throw new Error('Cannot find Oracles');
}

async function getSetters(network) {
  const tokens = getTokens(network);
  if (isDocker(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isKovan(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isMainNet(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isMatic(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isMaticTest(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isArbitrum(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  if (isArbitrumTest(network)) {
    return tokens.map(() => ({ address: DoubleExponentInterestSetter.address }));
  }
  throw new Error('Cannot find Setters');
}
