require('ts-node/register'); // eslint-disable-line
require('dotenv-flow').config(); // eslint-disable-line
const HDWalletProvider = require('truffle-hdwallet-provider'); // eslint-disable-line
const path = require('path');

const covContractsDir = path.join(process.cwd(), '.coverage_contracts');
const regContractsDir = path.join(process.cwd(), 'contracts');

module.exports = {
  compilers: {
    solc: {
      version: '0.5.7',
      docker: process.env.DOCKER_COMPILER !== undefined
        ? process.env.DOCKER_COMPILER === 'true' : true,
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000,
        },
        evmVersion: 'byzantium',
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
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        process.env.ETHEREUM_NODE_MAINNET,
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
        process.env.ETHEREUM_NODE_KOVAN,
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
  },
  // migrations_file_extension_regexp: /.*\.ts$/, truffle does not currently support ts migrations
};
