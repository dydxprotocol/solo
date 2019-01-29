/*

    Copyright 2018 dYdX Trading Inc.

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

const { isDevNetwork } = require('./helpers');

const AdminLib = artifacts.require('AdminLib');
const SoloMargin = artifacts.require('SoloMargin');
const TestSoloMargin = artifacts.require('TestSoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TestAutoTrader = artifacts.require('TestAutoTrader');
const TestCallee = artifacts.require('TestCallee');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestInterestSetter = artifacts.require('TestInterestSetter');
const TestExchangeWrapper = artifacts.require('TestExchangeWrapper');

const MAX_INTEREST_RATE = "31709791983"; // Max 100% per year
const MAX_LIQUIDATION_RATIO = "2000000000000000000"; // 200%
const LIQUIDATION_RATIO = "1250000000000000000"; // 125%
const MIN_LIQUIDATION_RATIO = "1100000000000000000"; // 110%
const MAX_LIQUIDATION_SPREAD = "1150000000000000000"; // 115%
const LIQUIDATION_SPREAD = "1050000000000000000"; // 105%
const MIN_LIQUIDATION_SPREAD = "1010000000000000000"; // 101%
const MIN_EARNINGS_RATE = "500000000000000000"; // 50%
const EARNINGS_RATE = "500000000000000000"; // 90%
const MAX_EARNINGS_RATE = "1000000000000000000"; // 100%
const MAX_MIN_BORROWED_VALUE = "100000000000000000000"; // $100
const MIN_BORROWED_VALUE = "100000000000000000000"; // $5
const MIN_MIN_BORROWED_VALUE = "1000000000000000000"; // $1

const prodArgs = {
  MAX_INTEREST_RATE,
  MAX_LIQUIDATION_RATIO,
  LIQUIDATION_RATIO,
  MIN_LIQUIDATION_RATIO,
  MAX_LIQUIDATION_SPREAD,
  LIQUIDATION_SPREAD,
  MIN_LIQUIDATION_SPREAD,
  MIN_EARNINGS_RATE,
  EARNINGS_RATE,
  MAX_EARNINGS_RATE,
  MAX_MIN_BORROWED_VALUE,
  MIN_BORROWED_VALUE,
  MIN_MIN_BORROWED_VALUE,
}

async function maybeDeployTestContracts(deployer, network) {
  if (!isDevNetwork(network)) {
    return;
  }

  await Promise.all([
    deployer.deploy(TestSoloMargin, AdminLib.address, prodArgs),
    deployer.deploy(TokenA),
    deployer.deploy(TokenB),
    deployer.deploy(TokenC),
    deployer.deploy(TestAutoTrader),
    deployer.deploy(TestExchangeWrapper),
    deployer.deploy(TestPriceOracle),
    deployer.deploy(TestInterestSetter),
  ]);

  await deployer.deploy(TestCallee, TestSoloMargin.address);
}

async function deployBaseProtocol(deployer) {
  await deployer.deploy(SoloMargin, AdminLib.address, prodArgs);
}

const migration = async (deployer, network) => {
  await deployer.deploy(AdminLib);
  await Promise.all([
    deployBaseProtocol(deployer),
    maybeDeployTestContracts(deployer, network),
  ]);
};

module.exports = migration;
