require('ts-node/register'); // eslint-disable-line
require('dotenv-flow').config(); // eslint-disable-line
const HDWalletProvider = require('@truffle/hdwallet-provider'); // eslint-disable-line
const path = require('path');

const covContractsDir = path.join(process.cwd(), '.coverage_contracts');
const regContractsDir = path.join(process.cwd(), 'contracts');

module.exports = {
  compilers: {
    solc: {
      version: '0.5.16',
      docker: process.env.DOCKER_COMPILER !== undefined
        ? process.env.DOCKER_COMPILER === 'true' : true,
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000,
        },
        evmVersion: 'istanbul',
      },
    },
  },
  contracts_directory: process.env.COVERAGE ? covContractsDir : regContractsDir,
  networks: {
    test: {
      host: '0.0.0.0',
      port: 8445,
      gasPrice: 1,
      network_id: '1001',
    },
    test_ci: {
      host: '0.0.0.0',
      port: 8545,
      gasPrice: 1,
      network_id: '1001',
    },
    mainnet: {
      network_id: '1',
      provider: () => new HDWalletProvider(process.env.DEPLOYER_PRIVATE_KEY, process.env.NODE_URL),
      gasPrice: Number(process.env.GAS_PRICE),
      gas: 6900000,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
    kovan: {
      network_id: '42',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'http://54.235.26.63:8545',
        0,
        1,
      ),
      gasPrice: 37000000000, // 37 gwei
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
    dev: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gasPrice: 1000000000, // 1 gwei
      gas: 7900000,
    },
    coverage: {
      host: '127.0.0.1',
      network_id: '1002',
      port: 8555,
      gas: 0xffffffffff,
      gasPrice: 1,
    },
    docker: {
      host: 'localhost',
      network_id: '1313',
      port: 8545,
      gasPrice: 1,
    },
    matic: {
      network_id: '137',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'https://rpc-mainnet.maticvigil.com',
        0,
        1,
      ),
      gasPrice: 5000000000,
      gas: 7900000,
      confirmations: 1,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
    mumbai_matic: {
      network_id: '80001',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        "https://matic-mumbai.chainstacklabs.com",
        0,
        1,
      ),
      gasPrice: 5e9,
      gas: 7900000,
      confirmations: 1,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
    arbitrum: {
      network_id: '42161',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'https://arb1.arbitrum.io/rpc',
        0,
        1,
      ),
      gasPrice: 5000000000,
      gas: 7900000,
      confirmations: 1,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
    arbitrum_rinkeby: {
      network_id: '421611',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        "https://rinkeby.arbitrum.io/rpc",
        0,
        1,
      ),
      gasPrice: 5e9,
      gas: 7900000,
      confirmations: 1,
      timeoutBlocks: 5000,
      networkCheckTimeout: 99999,
    },
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    arbiscan: process.env.ARBISCAN_API_KEY,
    optimistic_etherscan: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
    polygonscan: process.env.POLYGONSCAN_API_KEY,
  }
};
