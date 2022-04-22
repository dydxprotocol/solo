const Web3 = require('web3');
const { coefficientsToString, decimalToString } = require('../dist/src/lib/Helpers');

// ============ Network Helper Functions ============

function isDevNetwork(network) {
  verifyNetwork(network);
  return network.startsWith('development')
    || network.startsWith('test')
    || network.startsWith('test_ci')
    || network.startsWith('develop')
    || network.startsWith('dev')
    || network.startsWith('docker')
    || network.startsWith('coverage');
}

function isMainNet(network) {
  verifyNetwork(network);
  return network.startsWith('mainnet');
}

function isMatic(network) {
  verifyNetwork(network);
  return network.startsWith('matic');
}

function isMaticTest(network) {
  verifyNetwork(network);
  return network.startsWith('mumbai_matic');
}

function isArbitrum(network) {
  verifyNetwork(network);
  return network.startsWith('arbitrum') && !isArbitrumTest(network);
}

function isArbitrumTest(network) {
  verifyNetwork(network);
  return network.startsWith('arbitrum_rinkeby');
}

function isKovan(network) {
  verifyNetwork(network);
  return network.startsWith('kovan');
}

function isDocker(network) {
  verifyNetwork(network);
  return network.startsWith('docker');
}

function getChainId(network) {
  if (isMainNet(network)) {
    return 1;
  }
  if (isArbitrum(network)) {
    return 42161;
  }
  if (isArbitrumTest(network)) {
    return 421611;
  }
  if (isMatic(network)) {
    return 137;
  }
  if (isMaticTest(network)) {
    return 80001;
  }
  if (isKovan(network)) {
    return 42;
  }
  if (network.startsWith('coverage')) {
    return 1002;
  }
  if (network.startsWith('docker')) {
    return 1313;
  }
  if (network.startsWith('test') || network.startsWith('test_ci')) {
    return 1001;
  }
  throw new Error('No chainId for network ' + network);
}

async function getRiskLimits() {
  return {
    marginRatioMax: decimalToString('2.00'),
    liquidationSpreadMax: decimalToString('0.50'),
    earningsRateMax: decimalToString('1.00'),
    marginPremiumMax: decimalToString('2.00'),
    spreadPremiumMax: decimalToString('2.00'),
    minBorrowedValueMax: decimalToString('100.00'),
  };
}

async function getRiskParams(network) {
  verifyNetwork(network);
  let mbv = '0.00';
  if (isDevNetwork(network)) {
    mbv = '0.05';
  }
  return {
    marginRatio: { value: decimalToString('0.15') },
    liquidationSpread: { value: decimalToString('0.05') },
    earningsRate: { value: decimalToString('0.90') },
    minBorrowedValue: { value: decimalToString(mbv) },
    accountMaxNumberOfMarketsWithBalances: '32',
  };
}

async function getPolynomialParams(network) {
  if (isMainNet(network)) {
    return {
      maxAPR: decimalToString('0.50'), // 50%
      coefficients: coefficientsToString([0, 20, 10, 0, 0, 0, 0, 0, 0, 0, 70]),
    };
  }
  return {
    maxAPR: decimalToString('1.00'), // 100%
    coefficients: coefficientsToString([0, 10, 10, 0, 0, 80]),
  };
}

async function getDoubleExponentParams(network) {
  if (isMainNet(network)) {
    return {
      maxAPR: decimalToString('0.50'), // 50%
      coefficients: coefficientsToString([0, 20, 0, 0, 0, 0, 20, 60]),
    };
  }
  return {
    maxAPR: decimalToString('1.00'), // 100%
    coefficients: coefficientsToString([0, 20, 0, 0, 0, 0, 20, 60]),
  };
}

function getExpiryRampTime(network) {
  if (isArbitrum(network) || isArbitrumTest(network) || isMaticTest(network)) {
    return '300';
  } else {
    return '3600';
  }
}

function verifyNetwork(network) {
  if (!network) {
    throw new Error('No network provided');
  }
}

function getSenderAddress(network, accounts) {
  const web3 = new Web3(process.env.NODE_URL);
  if (isMainNet(network) || isKovan(network)) {
    return accounts[0];
  }
  if (isDevNetwork(network)) {
    return accounts[0];
  }
  if (isMaticTest(network)) {
    return accounts[0];
  }
  if (isMatic(network)) {
    return accounts[0];
  }
  if (isArbitrum(network)) {
    return web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY).address;
  }
  if (isArbitrumTest(network)) {
    return web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY).address;
  }
  throw new Error('Cannot find Sender address');
}

function getDelayedMultisigAddress(network) {
  if (isMainNet(network) || isArbitrum(network) || isArbitrumTest(network)) {
    return '0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B';
  }
  if (isKovan(network)) {
    throw new Error('No Kovan multisig');
  }
  if (isMaticTest(network)) {
    return '0x874Ad8fb87a67B1A33C5834CC8820DBa80D18Bbb';
  }
  throw new Error('Cannot find DelayedMultisig for network: ' + network);
}

function getGnosisSafeAddress(network) {
  if (isMainNet(network) || isArbitrum(network)) {
    return '0xa75c21C5BE284122a87A37a76cc6C4DD3E55a1D4';
  }
  if (isArbitrumTest(network)) {
    return '0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B'; // use the delayed multi sig
  }
  if (isMaticTest(network)) {
    return '0x874Ad8fb87a67B1A33C5834CC8820DBa80D18Bbb'; // use the delayed multi sig
  }
  throw new Error('Cannot find GnosisSafe for network: ' + network);
}

function getChainlinkFlags(network) {
  if (isArbitrum(network)) {
    return '0x3C14e07Edd0dC67442FA96f1Ec6999c57E810a83';
  }
  if (isArbitrumTest(network)) {
    return '0x491B1dDA0A8fa069bbC1125133A975BF4e85a91b';
  }
  return '0x0000000000000000000000000000000000000000';
}

function getUniswapV3MultiRouter(network, TestUniswapV3MultiRouter) {
  if (isDevNetwork(network)) {
    return TestUniswapV3MultiRouter.address;
  }

  return '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
}

const shouldOverwrite = (contract, network) => {
  const basicCondition = process.env.OVERWRITE_EXISTING_CONTRACTS === 'true' || isDevNetwork(network);
  if (basicCondition) {
    return true;
  }

  try {
    return !contract.address;
  } catch (e) {
    // The address can't be retrieved, which means there isn't one.
    return true
  }
}

const getNoOverwriteParams = () => ({ overwrite: false });

module.exports = {
  isArbitrum,
  isArbitrumTest,
  getChainId,
  isDevNetwork,
  isMainNet,
  isMatic,
  isMaticTest,
  isKovan,
  isDocker,
  getRiskLimits,
  getRiskParams,
  getPolynomialParams,
  getDoubleExponentParams,
  getExpiryRampTime,
  getSenderAddress,
  getDelayedMultisigAddress,
  getGnosisSafeAddress,
  getChainlinkFlags,
  getUniswapV3MultiRouter,
  shouldOverwrite,
  getNoOverwriteParams,
};
