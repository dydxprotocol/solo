#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/* eslint-disable import/no-extraneous-dependencies */
var API = require('solidity-coverage/api');
var utils = require('solidity-coverage/utils');
var truffleUtils = require('solidity-coverage/plugins/resources/truffle.utils');
var PluginUI = require('solidity-coverage/plugins/resources/truffle.ui');
var pkg = require('solidity-coverage/package.json');
var TruffleConfig = require('@truffle/config');
var death = require('death');
var path = require('path');
var Web3 = require('web3');
var shell = require('shelljs');
var truffleJS = require('./../truffle.js');
/* eslint-enable import/no-extraneous-dependencies */
function coverage() {
    return __awaiter(this, void 0, void 0, function () {
        var config, api, ui, truffle, client, address, web3, accounts, nodeInfo, ganacheVersion, skipFiles, _a, uninstrumentedTargets, skipped, targets, _b, tempArtifactsDir, tempContractsDir;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    death(utils.finish.bind(null, config, api)); // Catch interrupt signals
                    // =======
                    // Configs
                    // =======
                    config = (new TruffleConfig()).with(truffleJS);
                    config.temp = 'build'; // --temp build
                    config.network = 'coverage'; // --network coverage
                    config = truffleUtils.normalizeConfig(config);
                    ui = new PluginUI(config.logger.log);
                    truffle = truffleUtils.loadLibrary(config);
                    api = new API(utils.loadSolcoverJS(config));
                    truffleUtils.setNetwork(config, api);
                    client = api.client || truffle.ganache;
                    return [4 /*yield*/, api.ganache(client)];
                case 1:
                    address = _c.sent();
                    web3 = new Web3(address);
                    return [4 /*yield*/, web3.eth.getAccounts()];
                case 2:
                    accounts = _c.sent();
                    return [4 /*yield*/, web3.eth.getNodeInfo()];
                case 3:
                    nodeInfo = _c.sent();
                    ganacheVersion = nodeInfo.split('/')[1];
                    truffleUtils.setNetworkFrom(config, accounts);
                    // Version Info
                    ui.report('versions', [
                        truffle.version,
                        ganacheVersion,
                        pkg.version,
                    ]);
                    // Exit if --version
                    if (config.version) {
                        return [2 /*return*/, utils.finish(config, api)];
                    }
                    ui.report('network', [
                        config.network,
                        config.networks[config.network].network_id,
                        config.networks[config.network].port,
                    ]);
                    skipFiles = api.skipFiles || [];
                    _a = utils.assembleFiles(config, skipFiles), uninstrumentedTargets = _a.targets, skipped = _a.skipped;
                    targets = api.instrument(uninstrumentedTargets);
                    utils.reportSkipped(config, skipped);
                    _b = utils.getTempLocations(config), tempArtifactsDir = _b.tempArtifactsDir, tempContractsDir = _b.tempContractsDir;
                    utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir);
                    utils.save(targets, config.contracts_directory, tempContractsDir);
                    utils.save(skipped, config.contracts_directory, tempContractsDir);
                    config.contracts_directory = tempContractsDir;
                    config.build_directory = tempArtifactsDir;
                    config.contracts_build_directory = path.join(tempArtifactsDir, path.basename(config.contracts_build_directory));
                    config.all = true;
                    config.compilers.solc.settings.optimizer.enabled = false;
                    shell.exec('npm run replace_bytecode');
                    // ========
                    // Compile
                    // ========
                    return [4 /*yield*/, truffle.contracts.compile(config)];
                case 4:
                    // ========
                    // Compile
                    // ========
                    _c.sent();
                    // ========
                    // TS Build
                    // ========
                    shell.exec('npm run build:cov');
                    // ==============
                    // Deploy / test
                    // ==============
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var child = shell.exec('npm run test_cov', { async: true });
                            // Jest routes all output to stderr
                            child.stderr.on('data', function (data) {
                                if (data.includes('Force exiting Jest'))
                                    resolve();
                            });
                        })];
                case 5:
                    // ==============
                    // Deploy / test
                    // ==============
                    _c.sent();
                    // ========
                    // Istanbul
                    // ========
                    return [4 /*yield*/, api.report()];
                case 6:
                    // ========
                    // Istanbul
                    // ========
                    _c.sent();
                    // ====
                    // Exit
                    // ====
                    return [4 /*yield*/, utils.finish(config, api)];
                case 7:
                    // ====
                    // Exit
                    // ====
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run coverage
coverage()
    .then(function () { return process.exit(0); })
    .catch(function (err) { return process.exit(err); });
//# sourceMappingURL=coverage.js.map
