module.exports = {
  skipFiles: [
    'Migrations.sol',
    'external/oracles/TestChainlinkPriceOracleV1.sol',
    'external/uniswap-v2/',
    'external/utils/MultiCall.sol',
    'external/multisig/MultiSig.sol',
    'external/multisig/DelayedMultiSig.sol',
    'protocol/interfaces/',
    'testing/',
  ],
  providerOptions: {
    port: 8555,
    network_id: 1002,
  }
};
