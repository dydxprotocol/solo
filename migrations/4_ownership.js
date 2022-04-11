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
  getDelayedMultisigAddress,
  getGnosisSafeAddress,
} = require('./helpers');

const {
  getChainlinkPriceOracleContract,
} = require('./oracle_helpers');

// ============ Contracts ============

const DolomiteMargin = artifacts.require('DolomiteMargin');
const Expiry = artifacts.require('Expiry');
const SignedOperationProxy = artifacts.require('SignedOperationProxy');
const SimpleFeeOwner = artifacts.require('SimpleFeeOwner');
const DolomiteAmmFactory = artifacts.require('DolomiteAmmFactory');
const AmmRebalancerProxyV1 = artifacts.require('AmmRebalancerProxyV1');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');

// ============ Main Migration ============

const migration = async (deployer, network) => {
  if (!isDevNetwork(network)) {
    const delayedMultisig = getDelayedMultisigAddress(network);

    const [
      deployedDolomiteMargin,
      deployedExpiry,
      deployedSignedOperationProxy,
      deployedSimpleFeeOwner,
      deployedChainlinkPriceOracleV1,
      dolomiteAmmFactory,
      deployedAmmRebalancerProxyV1,
    ] = await Promise.all([
      DolomiteMargin.deployed(),
      Expiry.deployed(),
      SignedOperationProxy.deployed(),
      SimpleFeeOwner.deployed(),
      getChainlinkPriceOracleContract(network, artifacts).deployed(),
      DolomiteAmmFactory.deployed(),
      AmmRebalancerProxyV1.deployed(),
    ]);

    await Promise.all([
      deployedDolomiteMargin.transferOwnership(delayedMultisig),
      deployedExpiry.transferOwnership(delayedMultisig),
      deployedSignedOperationProxy.transferOwnership(delayedMultisig),
      deployedSimpleFeeOwner.transferOwnership(delayedMultisig),
      deployedChainlinkPriceOracleV1.transferOwnership(delayedMultisig),
      dolomiteAmmFactory.setFeeToSetter(deployedSimpleFeeOwner.address),
    ]);

    const gnosisSafe = getGnosisSafeAddress(network);
    await Promise.all([
      deployedAmmRebalancerProxyV1.transferOwnership(gnosisSafe),
    ]);

    if (isDevNetwork(network)) {
      const uniswapV2Factory = await UniswapV2Factory.deployed();
      await uniswapV2Factory.setFeeToSetter(delayedMultisig);
    }
  }
};

module.exports = migration;
