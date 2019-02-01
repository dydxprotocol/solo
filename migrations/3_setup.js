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

const SoloMargin = artifacts.require('SoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestInterestSetter = artifacts.require('TestInterestSetter');

const INITIAL_TOKENS = new BigNumber('10e18');
const BASE_INTEREST_RATE = new BigNumber('1e18').div(60 * 60 * 24 * 365 * 5); // 20% per year

async function maybeSetupProtocol(deployer, network, accounts) {
  if (network === 'docker' || network === 'kovan') {
    const [
      soloMargin,
      [tokenA, tokenB, tokenC],
      testPriceOracle,
      testInterestSetter,
    ] = await Promise.all([
      SoloMargin.deployed(),
      getTokens(network),
      TestPriceOracle.deployed(),
      TestInterestSetter.deployed(),
    ]);

    await Promise.all([
      issueTokens(
        [accounts[1], accounts[2], accounts[3]],
        INITIAL_TOKENS.toFixed(0),
        tokenA,
        tokenB,
        tokenC,
        network,
      ),
      setOraclePrices(
        testPriceOracle,
        tokenA,
        tokenB,
        tokenC,
      ),
      setInterestRates(
        testInterestSetter,
        tokenA,
        tokenB,
        tokenC,
      ),
    ]);

    // Price oracle must return valid amount to add market
    await addMarkets(
      soloMargin,
      tokenA,
      tokenB,
      tokenC,
      testPriceOracle,
      testInterestSetter,
    );
  }
}

async function getTokens(network) {
  if (network === 'docker') {
    return Promise.all([
      TokenA.deployed(),
      TokenB.deployed(),
      TokenC.deployed(),
    ]);
  }

  return [
    { address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c' }, // Kovan WETH
    { address: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2' }, // Kovan DAI
    { address: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa' }, // Kovan ZRX
  ];
}

async function addMarkets(
  soloMargin,
  tokenA,
  tokenB,
  tokenC,
  testPriceOracle,
  testInterestSetter,
) {
  // Do these in sequence so they are always ordered
  await soloMargin.ownerAddMarket(
    tokenA.address,
    testPriceOracle.address,
    testInterestSetter.address,
  );
  await soloMargin.ownerAddMarket(
    tokenB.address,
    testPriceOracle.address,
    testInterestSetter.address,
  );
  await soloMargin.ownerAddMarket(
    tokenC.address,
    testPriceOracle.address,
    testInterestSetter.address,
  );
}

async function issueTokens(
  accounts,
  amount,
  tokenA,
  tokenB,
  tokenC,
  network,
) {
  if (network !== 'docker') {
    return;
  }

  await Promise.all(accounts.map(account => Promise.all([
    tokenA.issueTo(account, amount),
    tokenB.issueTo(account, amount),
    tokenC.issueTo(account, amount),
  ])));
}

async function setOraclePrices(
  testPriceOracle,
  tokenA,
  tokenB,
  tokenC,
) {
  await Promise.all([
    testPriceOracle.setPrice(tokenA.address, '10000000000000000000'), // 1 ETH = 10 DAI
    testPriceOracle.setPrice(tokenB.address, '1000000000000000000'), // DAI
    testPriceOracle.setPrice(tokenC.address, '300000000000000000'), // 1 ZRX = .3 DAI
  ]);
}

async function setInterestRates(
  testInterestSetter,
  tokenA,
  tokenB,
  tokenC,
) {
  await Promise.all([
    testInterestSetter.setInterestRate(
      tokenA.address,
      { value: BASE_INTEREST_RATE.toFixed(0) },
    ),
    testInterestSetter.setInterestRate(
      tokenB.address,
      { value: BASE_INTEREST_RATE.times(2).toFixed(0) },
    ),
    testInterestSetter.setInterestRate(
      tokenC.address,
      { value: BASE_INTEREST_RATE.times(3).toFixed(0) },
    ),
  ]);
}

const migration = async (deployer, network, accounts) => {
  await maybeSetupProtocol(deployer, network, accounts);
};

module.exports = migration;
