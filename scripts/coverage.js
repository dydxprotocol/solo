#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
const API = require('solidity-coverage/api');
const utils = require('solidity-coverage/utils');
const truffleUtils = require('solidity-coverage/plugins/resources/truffle.utils');
const PluginUI = require('solidity-coverage/plugins/resources/truffle.ui');
const pkg = require('solidity-coverage/package.json');
const TruffleConfig = require('@truffle/config');
const death = require('death');
const path = require('path');
const Web3 = require('web3');
const shell = require('shelljs');
const truffleJS = require('./../truffle.js');
/* eslint-enable import/no-extraneous-dependencies */

async function coverage() { // eslint-disable-line consistent-return
  let config;
  let api;
  death(utils.finish.bind(null, config, api)); // Catch interrupt signals

  // =======
  // Configs
  // =======
  config = (new TruffleConfig()).with(truffleJS);
  config.temp = 'build'; // --temp build
  config.network = 'coverage'; // --network coverage
  config = truffleUtils.normalizeConfig(config);

  const ui = new PluginUI(config.logger.log);
  const truffle = truffleUtils.loadLibrary(config);
  api = new API(utils.loadSolcoverJS(config));

  truffleUtils.setNetwork(config, api);

  // ========
  // Ganache
  // ========
  const client = api.client || truffle.ganache;
  const address = await api.ganache(client);

  const web3 = new Web3(address);
  const accounts = await web3.eth.getAccounts();
  const nodeInfo = await web3.eth.getNodeInfo();
  const ganacheVersion = nodeInfo.split('/')[1];

  truffleUtils.setNetworkFrom(config, accounts);

  // Version Info
  ui.report('versions', [
    truffle.version,
    ganacheVersion,
    pkg.version,
  ]);

  // Exit if --version
  if (config.version) {
    return utils.finish(config, api);
  }

  ui.report('network', [
    config.network,
    config.networks[config.network].network_id,
    config.networks[config.network].port,
  ]);

  // =====================
  // Instrument Contracts
  // =====================
  const skipFiles = api.skipFiles || [];

  const {
    targets: uninstrumentedTargets,
    skipped,
  } = utils.assembleFiles(config, skipFiles);

  const targets = api.instrument(uninstrumentedTargets);
  utils.reportSkipped(config, skipped);

  // =================================
  // Filesys and compile configuration
  // =================================
  const {
    tempArtifactsDir,
    tempContractsDir,
  } = utils.getTempLocations(config);

  utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir);
  utils.save(targets, config.contracts_directory, tempContractsDir);
  utils.save(skipped, config.contracts_directory, tempContractsDir);

  config.contracts_directory = tempContractsDir;
  config.build_directory = tempArtifactsDir;

  config.contracts_build_directory = path.join(
    tempArtifactsDir,
    path.basename(config.contracts_build_directory),
  );

  config.all = true;
  config.compilers.solc.settings.optimizer.enabled = false;

  // ========
  // Compile
  // ========
  await truffle.contracts.compile(config);

  // ========
  // TS Build
  // ========
  shell.exec('npm run build:cov');

  // ==============
  // Deploy / test
  // ==============
  await new Promise((resolve) => {
    const child = shell.exec('npm run test_cov', { async: true });

    // Jest routes all output to stderr
    child.stderr.on('data', (data) => {
      if (data.includes('Force exiting Jest')) resolve();
    });
  });

  // ========
  // Istanbul
  // ========
  await api.report();

  // ====
  // Exit
  // ====
  await utils.finish(config, api);
}

// Run coverage
coverage()
  .then(() => process.exit(0))
  .catch(err => process.exit(err));
