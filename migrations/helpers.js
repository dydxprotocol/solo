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

function isDocker(network) {
  return network === 'docker';
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
  isDocker,
  MULTISIG,
};
