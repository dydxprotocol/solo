const { coefficientsToString, decimalToString } = require('../src/lib/Helpers.ts');

// ============ Network Helper Functions ============

function isDevNetwork(network) {
  verifyNetwork(network);
  return network === 'development'
      || network === 'test'
      || network === 'test_ci'
      || network === 'develop'
      || network === 'dev'
      || network === 'docker'
      || network === 'coverage';
}

function isMainNet(network) {
  verifyNetwork(network);
  return network === 'mainnet';
}

function isKovan(network) {
  verifyNetwork(network);
  return network === 'kovan';
}

function isDocker(network) {
  verifyNetwork(network);
  return network === 'docker';
}

const MULTISIG = {
  KOVAN: {
  },
  MAINNET: {
  },
};

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

async function getPolynomialParams() {
  return {
    maxAPR: decimalToString('1.00'), // 100%
    coefficients: coefficientsToString([0, 10, 10, 0, 0, 80]),
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

function getOraclePokerAddress(network, accounts) {
  if (isMainNet(network)) {
    return '0xac89e378758c97625d5448065d92f63f4851f1e2';
  }
  if (isKovan(network)) {
    return '0xa13cc3ab215bf669764a1a56a831c1bdc95659dd';
  }
  if (isDevNetwork(network)) {
    return accounts[0];
  }
  throw new Error('Cannot find Oracle Poker');
}

module.exports = {
  isDevNetwork,
  isMainNet,
  isKovan,
  isDocker,
  MULTISIG,
  getRiskLimits,
  getRiskParams,
  getPolynomialParams,
  getDaiPriceOracleParams,
  getExpiryRampTime,
  getOraclePokerAddress,
};
