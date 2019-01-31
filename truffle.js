require('ts-node/register');

module.exports = {
  compilers: {
    solc: {
      version: '0.5.2',
      docker: process.env.DOCKER_COMPILER !== undefined ? process.env.DOCKER_COMPILER === 'true' : true,
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
      gas: 0x1fffffffffffff, // TODO reduce this when deploy gas costs go down
    },
    test_ci: {
      host: '0.0.0.0',
      port: 8545,
      gasPrice: 1,
      network_id: '1001',
      gas: 0x1fffffffffffff, // TODO reduce this when deploy gas costs go down
    },
    mainnet: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '1',
      gasPrice: process.env.GAS_PRICE,
      gas: 7900000,
    },
    kovan: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '42',
      gasPrice: 1000000000, // 1 gwei
      gas: 7900000,
    },
    dev: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gasPrice: 1000000000, // 1 gwei
      gas: 7900000,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    docker: {
      host: 'localhost',
      network_id: '1313',
      port: 8545,
      gasPrice: 1,
      gas: 0x1fffffffffffff,
    },
  },
  // migrations_file_extension_regexp: /.*\.ts$/, truffle does not currently support ts migrations
};
