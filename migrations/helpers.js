function isDevNetwork(network) {
  return network === 'development'
      || network === 'test'
      || network === 'test_ci'
      || network === 'develop'
      || network === 'dev'
      || network === 'docker'
      || network === 'coverage';
}

function isMainNet(network) {
  return network === 'mainnet';
}

function isKovan(network) {
  return network === 'kovan';
}

const MULTISIG = {
  KOVAN: {
  },
  MAINNET: {
  },
};

module.exports = {
  isDevNetwork,
  isMainNet,
  isKovan,
  MULTISIG,
};
