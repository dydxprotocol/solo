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

import {
  isDevNetwork,
} from './helpers';

// For testing
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const FeeToken = artifacts.require('TokenC');

// Deploy functions
async function maybeDeployTestTokens(deployer: Truffle.Deployer, network: string) {
  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TokenA),
      deployer.deploy(TokenB),
      deployer.deploy(FeeToken),
    ]);
  }
}

const migration: Truffle.Migration = async (deployer: Truffle.Deployer, network: string) => {
  await maybeDeployTestTokens(deployer, network);
};

export default migration;
