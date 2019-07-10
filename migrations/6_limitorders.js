/*

    Copyright 2019 dYdX Trading Inc.

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

const {
  isDevNetwork,
  getChainId,
} = require('./helpers');

// ============ Contracts ============

const SoloMargin = artifacts.require('SoloMargin');
const TestSoloMargin = artifacts.require('TestSoloMargin');
const LimitOrders = artifacts.require('LimitOrders');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  const soloMargin = await getSoloMargin(network);
  await deployer.deploy(
    LimitOrders,
    soloMargin.address,
    getChainId(network),
  );
  await soloMargin.ownerSetGlobalOperator(
    LimitOrders.address,
    true,
  );
};

module.exports = migration;

// ============ Helper Functions ============

async function getSoloMargin(network) {
  if (isDevNetwork(network)) {
    return TestSoloMargin.deployed();
  }
  return SoloMargin.deployed();
}
