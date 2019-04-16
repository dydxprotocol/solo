require('ts-node/register');
require('dotenv-flow').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  compilers: {
    solc: {
      version: '0.5.7',
      docker: process.env.DOCKER_COMPILER !== undefined
        ? process.env.DOCKER_COMPILER === 'true' : true,
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000,
        },
      },
    },
  },
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
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'https://parity.expotrading.com',
        0,
        1,
      ),
      gasPrice: Number(process.env.GAS_PRICE),
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
    kovan: {
      network_id: '42',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'http://34.227.10.106:8545',
        0,
        1,
      ),
      gasPrice: 10000000000, // 10 gwei
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
    dev: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gasPrice: 1000000000, // 1 gwei
      gas: 7900000,
    },
    coverage: {
      host: '0.0.0.0',
      network_id: '1002',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 1,
    },
    docker: {
      host: 'localhost',
      network_id: '1313',
      port: 8545,
      gasPrice: 1,
    },
  },
  // migrations_file_extension_regexp: /.*\.ts$/, truffle does not currently support ts migrations
};
