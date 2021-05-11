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
  throw new Error('No chainId for network', network);
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
    coefficients: coefficientsToString([20, 20, 20, 20, 20]),
  };
}

function getDaiPriceOracleParams(network) {
  verifyNetwork(network);
  if (isDevNetwork) {
    return {
      oasisEthAmount: decimalToString('0.01'),
      deviationParams: {
        denominator: decimalToString('1.00'),
        maximumPerSecond: decimalToString('0.0001'),
        maximumAbsolute: decimalToString('0.01'),
      },
    };
  }
  return {
    oasisEthAmount: decimalToString('1.00'),
    deviationParams: {
      denominator: decimalToString('1.00'),
      maximumPerSecond: decimalToString('0.0001'),
      maximumAbsolute: decimalToString('0.01'),
    },
  };
}

function getExpiryRampTime() {
  return '3600';
}

function verifyNetwork(network) {
  if (!network) {
    throw new Error('No network provided');
  }
}

function getSenderAddress(network, accounts) {
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
  throw new Error('Cannot find Sender address');
}

function getOraclePokerAddress(network, accounts) {
  if (isMainNet(network)) {
    return '0x500dd93a74dbfa65a4eeda44da489adcef530cb9';
  }
  if (isKovan(network)) {
    return '0xa13cc3ab215bf669764a1a56a831c1bdc95659dd';
  }
  if (isDevNetwork(network) || isMaticTest(network) || isMaticTest(network)) {
    return accounts[0];
  }
  throw new Error('Cannot find Oracle Poker');
}

function getMultisigAddress(network) {
  if (isMainNet(network)) {
    throw new Error('No Mainnet multisig');
  }
  if (isKovan(network)) {
    throw new Error('No Kovan multisig');
  }
  if (isMaticTest(network)) {
    return '0x874Ad8fb87a67B1A33C5834CC8820DBa80D18Bbb';
  }
  throw new Error('Cannot find Admin Multisig');
}

module.exports = {
  isDevNetwork,
  isMainNet,
  isMatic,
  isMaticTest,
  isKovan,
  isDocker,
  getChainId,
  getRiskLimits,
  getRiskParams,
  getPolynomialParams,
  getDoubleExponentParams,
  getDaiPriceOracleParams,
  getExpiryRampTime,
  getOraclePokerAddress,
  getSenderAddress,
  getMultisigAddress,
};
