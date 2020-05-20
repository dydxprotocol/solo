const { isDevNetwork, isMainNet, isKovan } = require('./helpers');

function getDaiAddress(network, TokenB) {
  if (isDevNetwork(network)) {
    return TokenB.address;
  }
  if (isMainNet(network)) {
    return '0x6b175474e89094c44da98b954eedeac495271d0f';
  }
  if (isKovan(network)) {
    return '0x4448d5F172FC3073C458d72C8Ee97A81cd824962';
  }
  throw new Error('Cannot find Dai');
}

function getLinkAddress(network, TokenE) {
  if (isDevNetwork(network)) {
    return TokenE.address;
  }
  if (isMainNet(network)) {
    return '0x514910771af9ca656af840dff83e8264ecf986ca';
  }
  if (isKovan(network)) {
    return '0xBd86728Ce5b0da9760c18E871Fe9AaA3F8AC6E10';
  }
  throw new Error('Cannot find Dai');
}

function getLrcAddress(network, TokenF) {
  if (isDevNetwork(network)) {
    return TokenF.address;
  }
  if (isMainNet(network)) {
    return '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd';
  }
  if (isKovan(network)) {
    return '0x9372c3ecf9487418739be231b2d3bcb69f19cdfc';
  }
  throw new Error('Cannot find Weth');
}

function getUsdcAddress(network, TokenA) {
  if (isDevNetwork(network)) {
    return TokenA.address;
  }
  if (isMainNet(network)) {
    return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  }
  if (isKovan(network)) {
    return '0xfb5755567e071663F2DA276aC1D6167B093f00f4';
  }
  throw new Error('Cannot find Weth');
}

function getWbtcAddress(network, TokenD) {
  if (isDevNetwork(network)) {
    return TokenD.address;
  }
  if (isMainNet(network)) {
    return '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
  }
  if (isKovan(network)) {
    return '0xB889322114475137815678748419b67818fBa92c';
  }
  throw new Error('Cannot find Weth');
}

function getWethAddress(network, WETH9) {
  if (isDevNetwork(network)) {
    return WETH9.address;
  }
  if (isMainNet(network)) {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }
  if (isKovan(network)) {
    return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
  }
  throw new Error('Cannot find Weth');
}

module.exports = {
  getDaiAddress,
  getLinkAddress,
  getLrcAddress,
  getUsdcAddress,
  getWbtcAddress,
  getWethAddress,
};
