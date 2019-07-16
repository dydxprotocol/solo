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
  getPartiallyDelayedMultisigAddress,
  getNonDelayedMultisigAddress,
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const Expiry = artifacts.require('Expiry');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const LimitOrders = artifacts.require('LimitOrders');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  if (!isDevNetwork(network)) {
    const partiallyDelayedMultisig = getPartiallyDelayedMultisigAddress(network);
    const nonDelayedMultisig = getNonDelayedMultisigAddress(network);

    const [
      deployedSoloMargin,
      deployedDaiPriceOracle,
      deployedExpiry,
      deployedLimitOrders,
    ] = await Promise.all([
      SoloMargin.deployed(),
      DaiPriceOracle.deployed(),
      Expiry.deployed(),
      LimitOrders.deployed(),
    ]);

    await Promise.all([
      deployedSoloMargin.transferOwnership(partiallyDelayedMultisig),
      deployedDaiPriceOracle.transferOwnership(nonDelayedMultisig),
      deployedExpiry.transferOwnership(partiallyDelayedMultisig),
      deployedLimitOrders.transferOwnership(partiallyDelayedMultisig),
    ]);
  }
};

module.exports = migration;
