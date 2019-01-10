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

const { isDevNetwork } = require('./helpers');

const SoloMargin = artifacts.require('SoloMargin');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const FeeToken = artifacts.require('TokenC');

async function maybeDeployTestTokens(deployer, network) {
  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TokenA),
      deployer.deploy(TokenB),
      deployer.deploy(FeeToken),
    ]);
  }
}

async function deployBaseProtocol(deployer) {
  await deployer.deploy(SoloMargin);
}

const migration = async (deployer, network) => {
  await Promise.all([
    maybeDeployTestTokens(deployer, network),
    deployBaseProtocol(deployer),
  ]);
};

module.exports = migration;
