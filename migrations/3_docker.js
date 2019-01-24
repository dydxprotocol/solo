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
  if (network === 'docker') {
    const [
      soloMargin,
      tokenA,
      tokenB,
      tokenC,
      testPriceOracle,
      testInterestSetter,
    ] = await Promise.all([
      SoloMargin.deployed(),
      TokenA.deployed(),
      TokenB.deployed(),
      TokenC.deployed(),
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
    testInterestSetter.address
  );
  await soloMargin.ownerAddMarket(
    tokenB.address,
    testPriceOracle.address,
    testInterestSetter.address
  );
  await soloMargin.ownerAddMarket(
    tokenC.address,
    testPriceOracle.address,
    testInterestSetter.address
  );
}

async function issueTokens(
  accounts,
  amount,
  tokenA,
  tokenB,
  tokenC,
) {
  await Promise.all(accounts.map(function (account) {
    return Promise.all([
      tokenA.issueTo(account, amount),
      tokenB.issueTo(account, amount),
      tokenC.issueTo(account, amount),
    ]);
  }));
}

async function setOraclePrices(
  testPriceOracle,
  tokenA,
  tokenB,
  tokenC,
) {
  await Promise.all([
    testPriceOracle.setPrice(TokenA.address, 1),
    testPriceOracle.setPrice(TokenB.address, 2),
    testPriceOracle.setPrice(TokenC.address, 3),
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
      TokenA.address,
      { value: BASE_INTEREST_RATE.toFixed(0) },
    ),
    testInterestSetter.setInterestRate(
      TokenB.address,
      { value: BASE_INTEREST_RATE.times(2).toFixed(0) },
    ),
    testInterestSetter.setInterestRate(
      TokenC.address,
      { value: BASE_INTEREST_RATE.times(3).toFixed(0) },
    ),
  ]);
}

const migration = async (deployer, network, accounts) => {
  await maybeSetupProtocol(deployer, network, accounts);
};

module.exports = migration;
