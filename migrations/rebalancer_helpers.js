function getRebalancerV1Routers(network) {
  if (network === 'arbitrum') {
    return ['0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'];
  } else if (network === 'arbitrum_rinkeby' || network === 'mumbai') {
    return [];
  }

  throw new Error('Could not find rebalancer params for network: ' + network);
}

function getRebalancerV1InitHashes(network) {
  if (network === 'arbitrum') {
    return ['0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'];
  } else if (network === 'arbitrum_rinkeby' || network === 'mumbai') {
    return [];
  }

  throw new Error('Could not find rebalancer params for network: ' + network);
}

module.exports = {
  getRebalancerV1Routers,
  getRebalancerV1InitHashes
}
