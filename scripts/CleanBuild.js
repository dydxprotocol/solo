"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var es6_promisify_1 = require("es6-promisify");
var mkdirp_1 = __importDefault(require("mkdirp"));
var Artifacts_1 = __importDefault(require("./Artifacts"));
var TestArtifacts_1 = __importDefault(require("./TestArtifacts"));
var deployed_json_1 = __importDefault(require("../migrations/deployed.json"));
var external_deployed_json_1 = __importDefault(require("../migrations/external-deployed.json"));
var Events_json_1 = require("../build/contracts/Events.json");
var AdminImpl_json_1 = require("../build/contracts/AdminImpl.json");
var Permission_json_1 = require("../build/contracts/Permission.json");
var writeFileAsync = es6_promisify_1.promisify(fs_1.default.writeFile);
var mkdirAsync = es6_promisify_1.promisify(mkdirp_1.default);
var TEST_NETWORK_ID = '1001';
var COVERAGE_NETWORK_ID = '1002';
function clean() {
    return __awaiter(this, void 0, void 0, function () {
        var directory, testDirectory, allContractNames, promises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    directory = __dirname + "/../build/published_contracts/";
                    testDirectory = __dirname + "/../build/testing_contracts/";
                    return [4 /*yield*/, mkdirAsync(directory)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, mkdirAsync(testDirectory)];
                case 2:
                    _a.sent();
                    allContractNames = Object.keys(Artifacts_1.default).concat(Object.keys(TestArtifacts_1.default));
                    promises = allContractNames.map(function (contractName) { return __awaiter(_this, void 0, void 0, function () {
                        var contract, finalDirectory, cleaned, json, filename;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    contract = Artifacts_1.default[contractName];
                                    finalDirectory = contract ? directory : testDirectory;
                                    if (!contract) {
                                        contract = TestArtifacts_1.default[contractName];
                                    }
                                    cleaned = {
                                        contractName: contract.contractName,
                                        abi: contract.abi,
                                        networks: {},
                                    };
                                    if (external_deployed_json_1.default[contractName]) {
                                        cleaned.networks = external_deployed_json_1.default[contractName];
                                    }
                                    else if (deployed_json_1.default[contractName]) {
                                        cleaned.networks = deployed_json_1.default[contractName];
                                    }
                                    if (contract.networks[TEST_NETWORK_ID]) {
                                        cleaned.networks[TEST_NETWORK_ID] = {
                                            links: contract.networks[TEST_NETWORK_ID].links,
                                            address: contract.networks[TEST_NETWORK_ID].address,
                                            transactionHash: contract.networks[TEST_NETWORK_ID].transactionHash,
                                        };
                                    }
                                    if (contract.networks[COVERAGE_NETWORK_ID]) {
                                        cleaned.networks[COVERAGE_NETWORK_ID] = {
                                            links: contract.networks[COVERAGE_NETWORK_ID].links,
                                            address: contract.networks[COVERAGE_NETWORK_ID].address,
                                            transactionHash: contract.networks[COVERAGE_NETWORK_ID].transactionHash,
                                        };
                                    }
                                    if (contractName === 'SoloMargin' || contractName === 'TestSoloMargin') {
                                        cleaned.abi = cleaned.abi
                                            .concat(getAllEvents(Events_json_1.abi))
                                            .concat(getAllEvents(AdminImpl_json_1.abi))
                                            .concat(getAllEvents(Permission_json_1.abi));
                                    }
                                    json = JSON.stringify(cleaned, null, 4);
                                    filename = contractName + ".json";
                                    return [4 /*yield*/, writeFileAsync(finalDirectory + filename, json)];
                                case 1:
                                    _a.sent();
                                    console.log("Wrote " + finalDirectory + filename);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getAllEvents(abi) {
    return abi.filter(function (e) { return e.type === 'event'; });
}
clean()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .then(function () { return process.exit(0); });
//# sourceMappingURL=CleanBuild.js.map