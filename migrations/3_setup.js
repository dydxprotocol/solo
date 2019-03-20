/*

    Copyright 2018 dYdX Trading Inc.

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

const BigNumber = require('bignumber.js');

const {
  isDevNetwork,
  isKovan,
  isMainNet,
  isDocker,
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TestPriceOracle = artifacts.require('TestPriceOracle');

// Interest Setters
const PolynomialInterestSetter = artifacts.require('PolynomialInterestSetter');

// Oracles
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const WethPriceOracle = artifacts.require('WethPriceOracle');

// ============ Constants ============

const INITIAL_TOKENS = new BigNumber('10e18');
const ONE_DOLLAR = new BigNumber('1e18');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await setupProtocol(deployer, network, accounts);
};

module.exports = migration;

// ============ Setup Functions ============

async function setupProtocol(deployer, network, accounts) {
  if (isDevNetwork(network) && !isDocker(network)) {
    return;
  }

  const [
    soloMargin,
    tokens,
    oracles,
    setters,
  ] = await Promise.all([
    SoloMargin.deployed(),
    getTokens(network),
    getOracles(network),
    getSetters(network),
  ]);

  if (isKovan(network)) {
    const testPriceOracle = await TestPriceOracle.deployed();
    await testPriceOracle.setPrice(tokens[2].address, ONE_DOLLAR.times('0.3').toFixed()); // ZRX
  }

  if (isDocker(network)) {
    // issue tokens to accounts
    await Promise.all(
      accounts.map(
        account => Promise.all([
          tokens.map(
            t => t.issueTo(account, INITIAL_TOKENS),
          ),
        ]),
      ),
    );
    const testPriceOracle = await TestPriceOracle.deployed();
    await Promise.all([
      testPriceOracle.setPrice(tokens[0].address, ONE_DOLLAR.times('100').toFixed()), // WETH
      testPriceOracle.setPrice(tokens[1].address, ONE_DOLLAR.toFixed()), // DAI
      testPriceOracle.setPrice(tokens[2].address, ONE_DOLLAR.times('0.3').toFixed()), // ZRX
    ]);
  }

  await addMarkets(
    soloMargin,
    tokens,
    oracles,
    setters,
  );
}

async function addMarkets(
  soloMargin,
  tokens,
  priceOracles,
  interestSetters,
) {
  const marginPremium = { value: '0' };
  const spreadPremium = { value: '0' };

  for (let i = 0; i < tokens.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await soloMargin.ownerAddMarket(
      tokens[i].address,
      priceOracles[i].address,
      interestSetters[i].address,
      marginPremium,
      spreadPremium,
    );
  }
}

// ============ Network Getter Functions ============

async function getTokens(network) {
  if (isDocker(network)) {
    return Promise.all([
      TokenA.deployed(),
      TokenB.deployed(),
      TokenC.deployed(),
    ]);
  }
  if (isKovan(network)) {
    return [
      { address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c' }, // Kovan WETH
      { address: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2' }, // Kovan DAI
      { address: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa' }, // Kovan ZRX
    ];
  }
  if (isMainNet(network)) {
    return [
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }, // Main WETH
      { address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359' }, // Main DAI
    ];
  }
  throw new Error('Cannot find Tokens');
}

async function getOracles(network) {
  if (isDocker(network)) {
    return Promise.all([
      { address: TestPriceOracle.address },
      { address: TestPriceOracle.address },
      { address: TestPriceOracle.address },
    ]);
  }
  if (isKovan(network)) {
    return [
      { address: WethPriceOracle.address },
      { address: DaiPriceOracle.address },
      { address: TestPriceOracle.address },
    ];
  }
  if (isMainNet(network)) {
    return [
      { address: WethPriceOracle.address },
      { address: DaiPriceOracle.address },
    ];
  }
  throw new Error('Cannot find Oracles');
}

async function getSetters(network) {
  if (isDocker(network)) {
    return Promise.all([
      { address: PolynomialInterestSetter.address },
      { address: PolynomialInterestSetter.address },
      { address: PolynomialInterestSetter.address },
    ]);
  }
  if (isKovan(network)) {
    return [
      { address: PolynomialInterestSetter.address },
      { address: PolynomialInterestSetter.address },
      { address: PolynomialInterestSetter.address },
    ];
  }
  if (isMainNet(network)) {
    return [
      { address: PolynomialInterestSetter.address },
      { address: PolynomialInterestSetter.address },
    ];
  }
  throw new Error('Cannot find Setters');
}
