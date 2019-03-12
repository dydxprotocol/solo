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

const { isDevNetwork, isKovan, isMainNet } = require('./helpers');
const { coefficientsToString, decimalToString } = require('../src/lib/Helpers.ts');

const AdminImpl = artifacts.require('AdminImpl');
const OperationImpl = artifacts.require('OperationImpl');
const SoloMargin = artifacts.require('SoloMargin');
const TestSoloMargin = artifacts.require('TestSoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const ErroringToken = artifacts.require('ErroringToken');
const OmiseToken = artifacts.require('OmiseToken');
const TestLib = artifacts.require('TestLib');
const TestAutoTrader = artifacts.require('TestAutoTrader');
const TestCallee = artifacts.require('TestCallee');
const TestPriceOracle = artifacts.require('TestPriceOracle');
const TestInterestSetter = artifacts.require('TestInterestSetter');
const TestPolynomialInterestSetter = artifacts.require('TestPolynomialInterestSetter');
const TestExchangeWrapper = artifacts.require('TestExchangeWrapper');
const WETH9 = artifacts.require('WETH9');
const PayableProxyForSoloMargin = artifacts.require('PayableProxyForSoloMargin');
const Expiry = artifacts.require('Expiry');
const PolynomialInterestSetter = artifacts.require('PolynomialInterestSetter');

const riskLimits = {
  marginRatioMax: decimalToString('2.00'),
  liquidationSpreadMax: decimalToString('0.50'),
  earningsRateMax: decimalToString('1.00'),
  marginPremiumMax: decimalToString('2.00'),
  spreadPremiumMax: decimalToString('2.00'),
  minBorrowedValueMax: decimalToString('100.00'),
};

const riskParams = {
  marginRatio: { value: decimalToString('0.15') },
  liquidationSpread: { value: decimalToString('0.05') },
  earningsRate: { value: decimalToString('0.90') },
  minBorrowedValue: { value: decimalToString('0.05') },
};

const polynomialParams = {
  maxAPR: decimalToString('1.00'), // 100%
  coefficients: coefficientsToString([0, 10, 10, 0, 0, 80]),
};

async function maybeDeployTestContracts(deployer, network) {
  if (isKovan(network)) {
    await Promise.all([
      deployer.deploy(TestPriceOracle),
      deployer.deploy(TestInterestSetter),
      deployer.deploy(PolynomialInterestSetter, polynomialParams),
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
    deployer.deploy(ErroringToken),
    deployer.deploy(OmiseToken),
    deployer.deploy(TestLib),
    deployer.deploy(TestAutoTrader),
    deployer.deploy(TestExchangeWrapper),
    deployer.deploy(TestPriceOracle),
    deployer.deploy(TestInterestSetter),
    deployer.deploy(TestPolynomialInterestSetter, polynomialParams),
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
  const soloMargin = await getSoloMargin(network);

  await Promise.all([
    deployer.deploy(
      PayableProxyForSoloMargin,
      soloMargin.address,
      wethAddress,
    ),
    deployer.deploy(
      Expiry,
      soloMargin.address,
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
  ]);
}

async function getSoloMargin(network) {
  if (isDevNetwork(network)) {
    return TestSoloMargin.deployed();
  }
  return SoloMargin.deployed();
}

async function getOrDeployWeth(deployer, network) {
  if (isDevNetwork(network)) {
    await deployer.deploy(WETH9);
    return WETH9.address;
  }
  if (isMainNet(network)) {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }
  if (isKovan(network)) {
    return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
  }
  throw new Error('Cannot find WETH');
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
