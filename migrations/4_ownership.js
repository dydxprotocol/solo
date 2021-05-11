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
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const Expiry = artifacts.require('Expiry');
const ExpiryV2 = artifacts.require('ExpiryV2');
const Refunder = artifacts.require('Refunder');
const DaiMigrator = artifacts.require('DaiMigrator');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const LimitOrders = artifacts.require('LimitOrders');
const StopLimitOrders = artifacts.require('StopLimitOrders');
const CanonicalOrders = artifacts.require('CanonicalOrders');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
const SimpleFeeOwner = artifacts.require('SimpleFeeOwner');
const ChainlinkPriceOracleV1 = artifacts.require('ChainlinkPriceOracleV1');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  if (!isDevNetwork(network)) {
    const multisig = getMultisigAddress(network);

    const [
      deployedSoloMargin,
      deployedExpiry,
      deployedExpiryV2,
      deployedRefunder,
      deployedDaiMigrator,
      deployedLimitOrders,
      deployedStopLimitOrders,
      deployedCanonicalOrders,
      deployedSignedOperationProxy,
      deployedSimpleFeeOwner,
      deployedChainlinkPriceOracleV1,
    ] = await Promise.all([
      SoloMargin.deployed(),
      Expiry.deployed(),
      ExpiryV2.deployed(),
      Refunder.deployed(),
      DaiMigrator.deployed(),
      LimitOrders.deployed(),
      StopLimitOrders.deployed(),
      CanonicalOrders.deployed(),
      SignedOperationProxy.deployed(),
      SimpleFeeOwner.deployed(),
      ChainlinkPriceOracleV1.deployed(),
    ]);

    await Promise.all([
      deployedSoloMargin.transferOwnership(multisig),
      deployedExpiry.transferOwnership(multisig),
      deployedExpiryV2.transferOwnership(multisig),
      deployedRefunder.transferOwnership(multisig),
      deployedDaiMigrator.transferOwnership(multisig),
      deployedLimitOrders.transferOwnership(multisig),
      deployedStopLimitOrders.transferOwnership(multisig),
      deployedCanonicalOrders.transferOwnership(multisig),
      deployedSignedOperationProxy.transferOwnership(multisig),
      deployedSimpleFeeOwner.transferOwnership(multisig),
      deployedChainlinkPriceOracleV1.transferOwnership(multisig),
    ]);

    if (!isMatic(network) && !isMaticTest(network)) {
      const deployedDaiPriceOracle = await DaiPriceOracle.deployed();
      deployedDaiPriceOracle.transferOwnership(multisig);
    }
  }
};

module.exports = migration;
