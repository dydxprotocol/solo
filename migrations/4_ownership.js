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
  getAdminMultisigAddress,
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const Expiry = artifacts.require('Expiry');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  if (!isDevNetwork(network)) {
    const multisigAddress = getAdminMultisigAddress(network);

    const [
      deployedSoloMargin,
      deployedDaiPriceOracle,
      deployedExpiry,
    ] = await Promise.all([
      SoloMargin.deployed(),
      DaiPriceOracle.deployed(),
      Expiry.deployed(),
    ]);

    await Promise.all([
      deployedSoloMargin.transferOwnership(multisigAddress),
      deployedDaiPriceOracle.transferOwnership(multisigAddress),
      deployedExpiry.transferOwnership(multisigAddress),
    ]);
  }
};

module.exports = migration;
