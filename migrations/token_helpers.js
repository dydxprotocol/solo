const {
  isDevNetwork,
  isMainNet,
  isKovan,
  isMatic,
  isMaticTest,
  isArbitrum,
  isArbitrumTest,
} = require('./helpers');

function getDaiAddress(network, TokenB) {
  if (isMatic(network)) {
    return '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
  }
  if (isMaticTest(network)) {
    return '0x8ac8Ae0A208bEf466512Cd26142aC5A3DDb5B99E';
  }
  if (isDevNetwork(network)) {
    return TokenB.address;
  }
  if (isMainNet(network)) {
    return '0x6b175474e89094c44da98b954eedeac495271d0f';
  }
  if (isKovan(network)) {
    return '0x4448d5F172FC3073C458d72C8Ee97A81cd824962';
  }
  if (isArbitrum(network)) {
    return '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1';
  }
  if (isArbitrumTest(network)) {
    return '0x362eD516f2E8eEab895043AF976864126BdD9C7b';
  }
  throw new Error('Cannot find DAI');
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
  if (isMatic(network)) {
    return '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39';
  }
  if (isMaticTest(network)) {
    return '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
  }
  if (isArbitrum(network)) {
    return '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4';
  }
  if (isArbitrumTest(network)) {
    return '0x615fBe6372676474d9e6933d310469c9b68e9726';
  }
  throw new Error('Cannot find LINK');
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
  if (isMaticTest(network)) {
    return '0xd64cD7A5Cd54C90be14B601dEe83b87546f975c7';
  }
  if (isArbitrum(network)) {
    return '0x46d0cE7de6247b0A95f67b43B589b4041BaE7fbE'
  }
  if (isArbitrumTest(network)) {
    throw new Error('Cannot find LRC for Arbitrum Test');
  }
  throw new Error('Cannot find LRC');
}

function getMaticAddress(network, artifact) {
  if (isMatic(network)) {
    return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
  }
  if (isMaticTest(network)) {
    return '0xBeE8c17b7449fa0cC54D857D774cE523A7A35d00';
  }
  if (isDevNetwork(network)) {
    return artifact.address;
  }
  if (isMainNet(network)) {
    return '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0';
  }
  if (isKovan(network)) {
    return '';
  }
  if (isArbitrum(network)) {
    throw new Error('MATIC is not supported on Arbitrum');
  }
  if (isArbitrumTest(network)) {
    throw new Error('Cannot find MATIC for Arbitrum Test');
  }
  throw new Error('Cannot find MATIC');
}

function getUsdcAddress(network, TokenA) {
  if (isMatic(network)) {
    return '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  }
  if (isMaticTest(network)) {
    return '0xaDe692C9B8C36e6b04bCFD01f0E91c7EbeE0A160';
  }
  if (isDevNetwork(network)) {
    return TokenA.address;
  }
  if (isMainNet(network)) {
    return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  }
  if (isKovan(network)) {
    return '0xfb5755567e071663F2DA276aC1D6167B093f00f4';
  }
  if (isArbitrum(network)) {
    return '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
  }
  if (isArbitrumTest(network)) {
    return '0xf5ba7ca17aF300F52112C4CC8A7AB1A0482e84D5';
  }
  throw new Error('Cannot find USDC');
}

function getUsdtAddress(network) {
  if (isArbitrum(network)) {
    return '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
  }
  throw new Error('Cannot find USDT');
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
  if (isMaticTest(network)) {
    return '0x49769b4755ea8B83A340c24eAeD9d887A4b61104';
  }
  if (isMatic(network)) {
    return '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6';
  }
  if (isArbitrum(network)) {
    return '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';
  }
  if (isArbitrumTest(network)) {
    return '0x48c40e8B9F45E199238e3131B232ADf12d88eA2C';
  }
  throw new Error('Cannot find WBTC');
}

function getWethAddress(network, WETH9) {
  if (isMatic(network)) {
    return '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';
  }
  if (isMaticTest(network)) {
    return '0xa38eF095D071ebBAFeA5E7D1Ce02BE79fc376793';
  }
  if (isDevNetwork(network)) {
    return WETH9.address;
  }
  if (isMainNet(network)) {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }
  if (isKovan(network)) {
    return '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
  }
  if (isArbitrum(network)) {
    return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
  }
  if (isArbitrumTest(network)) {
    return '0x267dc5f342e139b5E407684e3A731aeaE8A71E3e';
  }
  throw new Error('Cannot find WETH');
}

function getWrappedCurrencyAddress(network, WETH9) {
  if (isMatic(network) || isMaticTest(network)) {
    return getMaticAddress(network)
  }

  // fall through case
  return getWethAddress(network, WETH9)
}

module.exports = {
  getDaiAddress,
  getLinkAddress,
  getLrcAddress,
  getMaticAddress,
  getUsdcAddress,
  getUsdtAddress,
  getWbtcAddress,
  getWethAddress,
  getWrappedCurrencyAddress,
};
