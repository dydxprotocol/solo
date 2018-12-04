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

const { isDevNetwork, isMainNet, isKovan, MULTISIG } = require('./helpers');

const OpenDirectlyExchangeWrapper = artifacts.require("OpenDirectlyExchangeWrapper");
const OasisV1SimpleExchangeWrapper = artifacts.require("OasisV1SimpleExchangeWrapper");
const OasisV1MatchingExchangeWrapper = artifacts.require("OasisV1MatchingExchangeWrapper");
const ZeroExV1ExchangeWrapper = artifacts.require("ZeroExV1ExchangeWrapper");
const ZeroExV2ExchangeWrapper = artifacts.require("ZeroExV2ExchangeWrapper");
const Vault = artifacts.require("Vault");
const TokenProxy = artifacts.require("TokenProxy");
const Margin = artifacts.require("Margin");
const SharedLoanFactory = artifacts.require("SharedLoanFactory");
const ERC20PositionWithdrawer = artifacts.require("ERC20PositionWithdrawer");
const ERC20PositionWithdrawerV2 = artifacts.require("ERC20PositionWithdrawerV2");
const ERC20LongFactory = artifacts.require("ERC20LongFactory");
const ERC20ShortFactory = artifacts.require("ERC20ShortFactory");
const ERC721MarginPosition = artifacts.require("ERC721MarginPosition");
const DutchAuctionCloser = artifacts.require("DutchAuctionCloser");
const WethPayoutRecipient = artifacts.require("WethPayoutRecipient");
const OpenPositionImpl = artifacts.require("OpenPositionImpl");
const OpenWithoutCounterpartyImpl = artifacts.require(
  "OpenWithoutCounterpartyImpl"
);
const IncreasePositionImpl = artifacts.require("IncreasePositionImpl");
const ClosePositionImpl = artifacts.require("ClosePositionImpl");
const CloseWithoutCounterpartyImpl = artifacts.require("CloseWithoutCounterpartyImpl");
const ForceRecoverCollateralImpl = artifacts.require("ForceRecoverCollateralImpl");
const DepositCollateralImpl = artifacts.require("DepositCollateralImpl");
const LoanImpl = artifacts.require("LoanImpl");
const TransferImpl = artifacts.require("TransferImpl");
const InterestImpl = artifacts.require("InterestImpl");
const PayableMarginMinter = artifacts.require("PayableMarginMinter");
const BucketLenderFactory = artifacts.require("BucketLenderFactory");
const EthWrapperForBucketLender = artifacts.require("EthWrapperForBucketLender");
const BucketLenderProxy = artifacts.require("BucketLenderProxy");
const AuctionProxy = artifacts.require("AuctionProxy");
const WETH9 = artifacts.require("WETH9");

// For testing
const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");
const FeeToken = artifacts.require("TokenC");

// External contracts
const { networks } = require("../truffle");
const { assetDataUtils } = require("@0xproject/order-utils");
let { MatchingMarket } = require("../test/contracts/OasisDex");
let { ZeroExExchangeV1, ZeroExProxyV1 } = require("../test/contracts/ZeroExV1");
let { ZeroExExchangeV2, ZeroExProxyV2 } = require("../test/contracts/ZeroExV2");

// Other constants
const BigNumber = require('bignumber.js');
const ONE_HOUR = new BigNumber(60 * 60);

// Helper functions
function parseExternalContracts(contracts, network) {
  const defaults = networks[network] || {}; // try to grab defaults from truffle.js
  const classDefaults = {
    from: web3.eth.accounts[0],
    gas: defaults.gas || 6721975,
    gasPrice: defaults.gasPrice || 100000000000
  };
  for (let i in contracts) {
    let contract = contracts[i];
    contract.setProvider(web3.currentProvider);
    contract.setNetwork(network);
    contract.class_defaults = classDefaults;
  }
}

// Deploy functions
async function maybeDeployTestTokens(deployer, network) {
  if (isDevNetwork(network)) {
    await Promise.all([
      deployer.deploy(TokenA),
      deployer.deploy(TokenB),
      deployer.deploy(FeeToken)
    ]);
  }
}

async function maybeDeployOasisDex(deployer, network) {
  if (isDevNetwork(network)) {
    parseExternalContracts([MatchingMarket]);
    await deployer.deploy(MatchingMarket, new BigNumber("18446744073709551615"));
  }
}

async function maybeDeploy0xV1(deployer, network) {
  if (isDevNetwork(network)) {
    parseExternalContracts([ZeroExExchangeV1, ZeroExProxyV1]);
    await deployer.deploy(ZeroExProxyV1);
    await deployer.deploy(ZeroExExchangeV1, FeeToken.address, ZeroExProxyV1.address);
    const proxy = await ZeroExProxyV1.deployed();
    await proxy.addAuthorizedAddress(ZeroExExchangeV1.address);
  }
}

async function maybeDeploy0xV2(deployer, network) {
  if (isDevNetwork(network)) {
    // Set up Truffle Contract objects
    parseExternalContracts([ZeroExExchangeV2, ZeroExProxyV2]);

    // Create fake ZRX Token asset data
    const zrxAssetData = assetDataUtils.encodeERC20AssetData(FeeToken.address);

    // Deploy the Exchange and ERC20Proxy
    await Promise.all([
      deployer.deploy(ZeroExExchangeV2, zrxAssetData),
      deployer.deploy(ZeroExProxyV2)
    ]);

    // Register the Exchange and ERC20Proxy with each other
    const [
      exchange,
      erc20Proxy
    ] = await Promise.all([
      ZeroExExchangeV2.deployed(),
      ZeroExProxyV2.deployed()
    ]);
    await Promise.all([
      await erc20Proxy.addAuthorizedAddress(ZeroExExchangeV2.address),
      await exchange.registerAssetProxy(ZeroExProxyV2.address)
    ]);
  }
}

function getOasisDexAddress(network) {
  if (isDevNetwork(network)) {
    return MatchingMarket.address;
  } else if (network === 'kovan') {
    return '0x8cf1cab422a0b6b554077a361f8419cdf122a9f9';
  }

  throw "OasisDex Not Found";
}

function getZeroExExchangeV2Address(network) {
  if (isDevNetwork(network)) {
    return ZeroExExchangeV2.address;
  } else if (isKovan(network)) {
    return '0x35dd2932454449b14cee11a94d3674a936d5d7b2';
  } else if (isMainNet(network)) {
    return '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
  }

  throw "0x ExchangeV2 Not Found";
}

function getZeroExProxyV2Address(network) {
  if (isDevNetwork(network)) {
    return ZeroExProxyV2.address;
  } else if (isKovan(network)) {
    return '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e';
  } else if (isMainNet(network)) {
    return '0x2240dab907db71e64d3e0dba4800c83b5c502d4e';
  }

  throw "0x TokenProxyV2 Not Found";
}

function getZeroExExchangeV1Address(network) {
  if (isDevNetwork(network)) {
    return ZeroExExchangeV1.address;
  } else if (isKovan(network)) {
    return '0x90fe2af704b34e0224bf2299c838e04d4dcf1364';
  } else if (isMainNet(network)) {
    return '0x12459C951127e0c374FF9105DdA097662A027093';
  }

  throw "0x ExchangeV1 Not Found";
}

function getZeroExProxyV1Address(network) {
  if (isDevNetwork(network)) {
    return ZeroExProxyV1.address;
  } else if (isKovan(network)) {
    return '0x087eed4bc1ee3de49befbd66c662b434b15d49d4';
  } else if (isMainNet(network)) {
    return '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4';
  }

  throw "0x TokenProxyV1 Not Found";
}

function getZRXAddress(network) {
  if (isDevNetwork(network)) {
    return FeeToken.address;
  } else if (isKovan(network)) {
    return '0x6Ff6C0Ff1d68b964901F986d4C9FA3ac68346570';
  } else if (isMainNet(network)) {
    return '0xE41d2489571d322189246DaFA5ebDe1F4699F498';
  }

  throw "ZRX Not Found";
}

function getSharedLoanTrustedMarginCallers(network) {
  if (isDevNetwork(network)) {
    return [];
  } else if (isKovan(network)) {
    return [MULTISIG.KOVAN.MARGIN_CALLER];
  } else if (isMainNet(network)) {
    return [MULTISIG.MAINNET.MARGIN_CALLER];
  }

  throw "Network Unsupported";
}

function getWethAddress(network) {
  if (isDevNetwork(network)) {
    return WETH9.address;
  } else if (isKovan(network)) {
    return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
  } else if (isMainNet(network)) {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }

  throw "WETH Not Found";
}

async function deployBaseProtocol(deployer, network) {
  await Promise.all([
    deployer.deploy(TokenProxy, ONE_HOUR),
    deployer.deploy(InterestImpl),
    deployer.deploy(ForceRecoverCollateralImpl),
    deployer.deploy(LoanImpl),
    deployer.deploy(DepositCollateralImpl),
    deployer.deploy(TransferImpl),
    deployer.deploy(OpenPositionImpl),
    deployer.deploy(OpenWithoutCounterpartyImpl),
  ]);

  await Promise.all([
    ClosePositionImpl.link('InterestImpl', InterestImpl.address),
    CloseWithoutCounterpartyImpl.link('InterestImpl', InterestImpl.address),
    IncreasePositionImpl.link('InterestImpl', InterestImpl.address),
  ]);

  await Promise.all([
    deployer.deploy(ClosePositionImpl),
    deployer.deploy(CloseWithoutCounterpartyImpl),
    deployer.deploy(IncreasePositionImpl),
  ]);

  // Link Margin function libraries
  await Promise.all([
    Margin.link('OpenPositionImpl', OpenPositionImpl.address),
    Margin.link('ClosePositionImpl', ClosePositionImpl.address),
    Margin.link('CloseWithoutCounterpartyImpl', CloseWithoutCounterpartyImpl.address),
    Margin.link('InterestImpl', InterestImpl.address),
    Margin.link('ForceRecoverCollateralImpl', ForceRecoverCollateralImpl.address),
    Margin.link('LoanImpl', LoanImpl.address),
    Margin.link('DepositCollateralImpl', DepositCollateralImpl.address),
    Margin.link('TransferImpl', TransferImpl.address),
    Margin.link('IncreasePositionImpl', IncreasePositionImpl.address),
    Margin.link('OpenWithoutCounterpartyImpl', OpenWithoutCounterpartyImpl.address),
  ]);

  // Deploy Vault
  await deployer.deploy(
    Vault,
    TokenProxy.address,
    ONE_HOUR
  );

  // Deploy Margin
  await deployer.deploy(
    Margin,
    Vault.address,
    TokenProxy.address
  );

  // Get contracts
  const [
    proxy,
    vault,
    margin
  ] = await Promise.all([
    TokenProxy.deployed(),
    Vault.deployed(),
    Margin.deployed()
  ]);

  // Grant access between Margin, Vault, and Proxy
  await Promise.all([
    vault.grantAccess(Margin.address),
    proxy.grantAccess(Vault.address),
    proxy.grantAccess(Margin.address),
  ]);

  // Give ownership of Base Protocol contracts to MultiSig wallets
  if (!isDevNetwork(network)) {
    // get the multisig addresses based on network
    let MULTISIG_MAPPING;
    if (isKovan(network)) {
      MULTISIG_MAPPING = MULTISIG.KOVAN;
    } else if (isMainNet(network)) {
      MULTISIG_MAPPING = MULTISIG.MAINNET;
    } else {
      throw "Multisig addresses not found";
    }
    // set multisig permissions
    await Promise.all([
      margin.transferOwnership(MULTISIG_MAPPING.PROTOCOL_CONTROLLER),
      vault.transferOwnership(MULTISIG_MAPPING.TOKEN_WITHDRAWER)
    ]);
  }
}
async function deploySecondLayer(deployer, network) {
  if (isDevNetwork(network)) {
    await deployer.deploy(WETH9);
  }

  await Promise.all([
    deployer.deploy(
      OasisV1SimpleExchangeWrapper,
      getOasisDexAddress(network)
    ),
    deployer.deploy(
      OasisV1MatchingExchangeWrapper,
      getOasisDexAddress(network)
    ),
    deployer.deploy(
      ZeroExV1ExchangeWrapper,
      getZeroExExchangeV1Address(network),
      getZeroExProxyV1Address(network),
      getZRXAddress(network),
      [Margin.address]
    ),
    deployer.deploy(
      ZeroExV2ExchangeWrapper,
      getZeroExExchangeV2Address(network),
      getZeroExProxyV2Address(network),
      getZRXAddress(network),
      [Margin.address]
    ),
    deployer.deploy(
      OpenDirectlyExchangeWrapper
    ),
    deployer.deploy(
      ERC20PositionWithdrawer,
      getWethAddress(network)
    ),
    deployer.deploy(
      ERC20PositionWithdrawerV2,
      getWethAddress(network)
    ),
    deployer.deploy(
      ERC721MarginPosition,
      Margin.address
    ),
    deployer.deploy(
      AuctionProxy,
      Margin.address
    ),
    deployer.deploy(
      DutchAuctionCloser,
      Margin.address,
      new BigNumber(1), // Numerator
      new BigNumber(1), // Denominator
    ),
  ]);

  const promises = [
    deployer.deploy(
      ERC20ShortFactory,
      Margin.address,
      [DutchAuctionCloser.address],
      [ERC20PositionWithdrawerV2.address]
    ),
    deployer.deploy(
      ERC20LongFactory,
      Margin.address,
      [DutchAuctionCloser.address],
      [ERC20PositionWithdrawerV2.address]
    ),
    deployer.deploy(
      PayableMarginMinter,
      Margin.address,
      getWethAddress(network)
    ),
    deployer.deploy(
      BucketLenderFactory,
      Margin.address
    ),
    deployer.deploy(
      EthWrapperForBucketLender,
      getWethAddress(network)
    ),
    deployer.deploy(
      BucketLenderProxy,
      getWethAddress(network)
    ),
    deployer.deploy(
      WethPayoutRecipient,
      getWethAddress(network)
    ),
  ];

  if (!isMainNet(network)) {
    promises.push(
      deployer.deploy(
        SharedLoanFactory,
        Margin.address,
        getSharedLoanTrustedMarginCallers(network)
      ),
    );
  }

  await Promise.all(promises);
}

async function doMigration(deployer, network) {
  await maybeDeployTestTokens(deployer, network);
  await Promise.all([
    maybeDeployOasisDex(deployer, network),
    maybeDeploy0xV1(deployer, network),
    maybeDeploy0xV2(deployer, network)
  ]);
  await deployBaseProtocol(deployer, network);
  await deploySecondLayer(deployer, network);
}

module.exports = (deployer, network, _addresses) => {
  deployer.then(() => doMigration(deployer, network));
};
