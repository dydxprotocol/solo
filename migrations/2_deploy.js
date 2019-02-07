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

const AdminImpl = artifacts.require('AdminImpl');
const OperationImpl = artifacts.require('OperationImpl');
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
const WETH9 = artifacts.require('WETH9');
const PayableProxyForSoloMargin = artifacts.require('PayableProxyForSoloMargin');

const riskLimits = {
  interestRateMax: '31709791983', // 100% APR
  liquidationRatioMax: '2000000000000000000', // 200%
  liquidationRatioMin: '1100000000000000000', // 110%
  liquidationSpreadMax: '1150000000000000000', // 115%
  liquidationSpreadMin: '1010000000000000000', // 101%
  earningsRateMin: '500000000000000000', //  50%
  earningsRateMax: '1000000000000000000', // 100%
  minBorrowedValueMax: '100000000000000000000', // 100$
  minBorrowedValueMin: '10000000000000000', //   .01$
};

const riskParams = {
  liquidationRatio: { value: '1150000000000000000' }, // 115%
  liquidationSpread: { value: '1050000000000000000' }, // 105%
  earningsRate: { value: '500000000000000000' }, //  50%
  minBorrowedValue: { value: '50000000000000000' }, //   .05$
};

async function maybeDeployTestContracts(deployer, network) {
  if (network === 'kovan') {
    await Promise.all([
      deployer.deploy(TestPriceOracle),
      deployer.deploy(TestInterestSetter),
    ]);
  }

  if (!isDevNetwork(network)) {
    return;
  }

  await Promise.all([
    TestSoloMargin.link('AdminImpl', AdminImpl.address),
    TestSoloMargin.link('OperationImpl', OperationImpl.address),
  ]);

  await Promise.all([
    deployer.deploy(TestSoloMargin, riskParams, riskLimits),
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
  await Promise.all([
    SoloMargin.link('AdminImpl', AdminImpl.address),
    SoloMargin.link('OperationImpl', OperationImpl.address),
  ]);
  await deployer.deploy(SoloMargin, riskParams, riskLimits);
}

async function deploySecondLayer(deployer, network) {
  const wethAddress = await getOrDeployWeth(deployer, network);

  await deployer.deploy(
    PayableProxyForSoloMargin,
    SoloMargin.address,
    wethAddress,
  );

  const soloMargin = await SoloMargin.deployed();

  await soloMargin.ownerSetGlobalOperator(
    PayableProxyForSoloMargin.address,
    true,
  );
}

async function getOrDeployWeth(deployer, network) {
  switch (network) {
    case 'mainnet':
      return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    case 'kovan':
      return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
    default:
      await deployer.deploy(WETH9);
      return WETH9.address;
  }
}

const migration = async (deployer, network) => {
  await Promise.all([
    deployer.deploy(AdminImpl),
    deployer.deploy(OperationImpl),
  ]);
  await Promise.all([
    deployBaseProtocol(deployer),
    maybeDeployTestContracts(deployer, network),
  ]);
  await deploySecondLayer(deployer, network);
};

module.exports = migration;
