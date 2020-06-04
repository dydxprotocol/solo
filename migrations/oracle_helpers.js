const { isDevNetwork, isMainNet, isKovan } = require('./helpers');
const {
  getDaiAddress, getLinkAddress, getLrcAddress, getUsdcAddress, getWbtcAddress, getWethAddress,
} = require('./token_helpers');
const {
  ADDRESSES,
} = require('../dist/src/lib/Constants');

function getBtcUsdAggregatorAddress(network, TestBtcUsdChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestBtcUsdChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0xF5fff180082d6017036B771bA883025c654BC935';
  }
  if (isKovan(network)) {
    return '0x6F47077D3B6645Cb6fb7A29D280277EC1e5fFD90';
  }
  throw new Error('Cannot find Weth');
}

function getDaiEthAggregatorAddress(network, TestDaiEthChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestDaiEthChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0x037E8F2125bF532F3e228991e051c8A7253B642c';
  }
  if (isKovan(network)) {
    return '0x6F47077D3B6645Cb6fb7A29D280277EC1e5fFD90';
  }
  throw new Error('Cannot find Weth');
}

function getEthUsdAggregatorAddress(network, TestEthUsdChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestEthUsdChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F';
  }
  if (isKovan(network)) {
    return '0xD21912D8762078598283B14cbA40Cb4bFCb87581';
  }
  throw new Error('Cannot find Weth');
}

function getLinkUsdAggregatorAddress(network, TestLinkUsdChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestLinkUsdChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0x32dbd3214aC75223e27e575C53944307914F7a90';
  }
  if (isKovan(network)) {
    return '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
  }
  throw new Error('Cannot find Weth');
}

function getLrcEthAggregatorAddress(network, TestLrcEthChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestLrcEthChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0x8770Afe90c52Fd117f29192866DE705F63e59407';
  }
  if (isKovan(network)) {
    // This really is KNC/ETH. Chainlink doesn't support LRC on Kovan so we're spoofing it.
    return '0x0893AaF58f62279909F9F6FF2E5642f53342e77F';
  }
  throw new Error('Cannot find Weth');
}

function getUsdcEthAggregatorAddress(network, TestUsdcEthChainlinkAggregator) {
  if (isDevNetwork(network)) {
    return TestUsdcEthChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0xdE54467873c3BCAA76421061036053e371721708';
  }
  if (isKovan(network)) {
    return '0x672c1C0d1130912D83664011E7960a42E8cA05D5';
  }
  throw new Error('Cannot find Weth');
}

function getChainlinkPriceOracleV1Params(network, tokens, aggregators) {
  const {
    TokenA, TokenB, TokenD, TokenE, TokenF, WETH9,
  } = tokens;

  const {
    TestBtcUsdChainlinkAggregator,
    TestDaiEthChainlinkAggregator,
    TestEthUsdChainlinkAggregator,
    TestLinkUsdChainlinkAggregator,
    TestLrcEthChainlinkAggregator,
    TestUsdcEthChainlinkAggregator,
  } = aggregators;

  return mapPairsToParams([
    // eslint-disable-next-line max-len
    [getDaiAddress(network, TokenB), getDaiEthAggregatorAddress(network, TestDaiEthChainlinkAggregator), 18, getWethAddress(network, WETH9), 18],
    // eslint-disable-next-line max-len
    [getLinkAddress(network, TokenE), getLinkUsdAggregatorAddress(network, TestLinkUsdChainlinkAggregator), 18, ADDRESSES.ZERO, 8],
    // eslint-disable-next-line max-len
    [getLrcAddress(network, TokenF), getLrcEthAggregatorAddress(network, TestLrcEthChainlinkAggregator), 18, getWethAddress(network, WETH9), 18],
    // eslint-disable-next-line max-len
    [getUsdcAddress(network, TokenA), getUsdcEthAggregatorAddress(network, TestUsdcEthChainlinkAggregator), 6, getWethAddress(network, WETH9), 18],
    // eslint-disable-next-line max-len
    [getWbtcAddress(network, TokenD), getBtcUsdAggregatorAddress(network, TestBtcUsdChainlinkAggregator), 8, ADDRESSES.ZERO, 8],
    // eslint-disable-next-line max-len
    [getWethAddress(network, WETH9), getEthUsdAggregatorAddress(network, TestEthUsdChainlinkAggregator), 18, ADDRESSES.ZERO, 8],
  ]);
}

function mapPairsToParams(pairs) {
  return {
    tokens: pairs.map(pair => pair[0]),
    aggregators: pairs.map(pair => pair[1]),
    tokenDecimals: pairs.map(pair => pair[2]),
    tokenPairs: pairs.map(pair => pair[3]),
    aggregatorDecimals: pairs.map(pair => pair[4]),
  };
}

module.exports = {
  getChainlinkPriceOracleV1Params,
};
