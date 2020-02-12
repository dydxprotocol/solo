module.exports = {
  // client: require('ganache-cli'), // Use version installed as npm dep
  skipFiles: [
    'testing/',
    'external/multisig/MultiSig.sol',
    'external/multisig/DelayedMultiSig.sol',
    'Migrations.sol'
  ],
  providerOptions: {
    network_id: 1002,
    hardfork: 'petersburg',
    hdPath: "m/44'/60'/0'/0/"
  }
};
