const {
  isDevNetwork, isMainNet, isKovan, isMaticTest, isMatic,
} = require('./helpers');
const {
  getDaiAddress, getLinkAddress, getLrcAddress, getMaticAddress, getUsdcAddress, getWbtcAddress, getWethAddress,
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

function getDaiUsdAggregatorAddress(network) {
  if (isMaticTest(network)) {
    return '0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046';
  }
  if (isMatic(network)) {
    return '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D';
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
  if (isMaticTest(network)) {
    return '0x0715A7794a1dc8e42615F059dD6e406A6594651A';
  }
  if (isMatic(network)) {
    return '0xF9680D99D6C9589e2a93a78A04A279e509205945';
  }
  if (isDevNetwork(network)) {
    return TestEthUsdChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F';
  }
  if (isKovan(network)) {
    return '0xD21912D8762078598283B14cbA40Cb4bFCb87581';
  }
  throw new Error('Cannot find EthUsdAggregatorAddress');
}

function getLinkUsdAggregatorAddress(network, TestLinkUsdChainlinkAggregator) {
  if (isMatic(network)) {
    return '0xd9FFdb71EbE7496cC440152d43986Aae0AB76665';
  }
  if (isDevNetwork(network)) {
    return TestLinkUsdChainlinkAggregator.address;
  }
  if (isMainNet(network)) {
    return '0x32dbd3214aC75223e27e575C53944307914F7a90';
  }
  if (isKovan(network)) {
    return '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
  }
  throw new Error('Cannot find LinkUsdAggregatorAddress');
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
  throw new Error('Cannot find LrcUsdAggregatorAddress');
}

function getMaticUsdAggregatorAddress(network) {
  if (isMatic(network)) {
    return '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0';
  }
  if (isMaticTest(network)) {
    return '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada';
  }

  throw new Error('MaticUsdAggregatorAddress');
}

function getUsdcUsdAggregatorAddress(network) {
  if (isMatic(network)) {
    return '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7';
  }
  if (isMaticTest(network)) {
    return '0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0';
  }
  throw new Error('Cannot find UsdcUsdAggregatorAddress');
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
  if (isMaticTest(network)) {
    return mapPairsToParams([
      [getDaiAddress(network), getDaiUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
      [getMaticAddress(network), getMaticUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
      [getUsdcAddress(network), getUsdcUsdAggregatorAddress(network), 6, ADDRESSES.ZERO, 8],
      [getWethAddress(network), getEthUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
    ]);
  }
  if (isMatic(network)) {
    return mapPairsToParams([
      [getDaiAddress(network), getDaiUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
      [getLinkAddress(network), getLinkUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
      [getMaticAddress(network), getMaticUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
      [getUsdcAddress(network), getUsdcUsdAggregatorAddress(network), 6, ADDRESSES.ZERO, 8],
      [getWethAddress(network), getEthUsdAggregatorAddress(network), 18, ADDRESSES.ZERO, 8],
    ]);
  }

  if (isDevNetwork(network)) {
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

  throw new Error('Not set up for other networks');
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
