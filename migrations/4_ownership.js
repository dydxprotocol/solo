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
  getMultisigAddress,
  isMatic,
  isMaticTest,
  isArbitrum,
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const ExpiryV2 = artifacts.require('ExpiryV2');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
const SimpleFeeOwner = artifacts.require('SimpleFeeOwner');
const ChainlinkPriceOracleV1 = artifacts.require('ChainlinkPriceOracleV1');
const DolomiteAmmFactory = artifacts.require('DolomiteAmmFactory');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  if (!isDevNetwork(network)) {
    const multisig = getMultisigAddress(network);

    const [
      deployedSoloMargin,
      deployedExpiryV2,
      deployedSignedOperationProxy,
      deployedSimpleFeeOwner,
      deployedChainlinkPriceOracleV1,
      dolomiteAmmFactory,
    ] = await Promise.all([
      SoloMargin.deployed(),
      ExpiryV2.deployed(),
      SignedOperationProxy.deployed(),
      SimpleFeeOwner.deployed(),
      ChainlinkPriceOracleV1.deployed(),
      DolomiteAmmFactory.deployed(),
    ]);

    await Promise.all([
      deployedSoloMargin.transferOwnership(multisig),
      deployedExpiryV2.transferOwnership(multisig),
      deployedSignedOperationProxy.transferOwnership(multisig),
      deployedSimpleFeeOwner.transferOwnership(multisig),
      deployedChainlinkPriceOracleV1.transferOwnership(multisig),
      dolomiteAmmFactory.setFeeToSetter(deployedSimpleFeeOwner.address),
    ]);

    if (!isMatic(network) && !isMaticTest(network) && !isArbitrum(network)) {
      const deployedDaiPriceOracle = await DaiPriceOracle.deployed();
      deployedDaiPriceOracle.transferOwnership(multisig);
    }
    if (isDevNetwork(network)) {
      const uniswapV2Factory = await UniswapV2Factory.deployed();
      await uniswapV2Factory.setFeeToSetter(multisig);
    }
  }
};

module.exports = migration;
