module.exports = {
  skipFiles: [
    'testing/',
    'external/multisig/MultiSig.sol',
    'external/multisig/DelayedMultiSig.sol',
    'Migrations.sol'
  ],
  providerOptions: {
    network_id: 1002,
    hdPath: "m/44'/60'/0'/0/"
  }
};
