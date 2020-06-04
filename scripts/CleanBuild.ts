import fs from 'fs';
import { promisify } from 'es6-promisify';
import mkdirp from 'mkdirp';
import contracts from './Artifacts';
import testContracts from './TestArtifacts';
import deployed from '../migrations/deployed.json';
import externalDeployed from '../migrations/external-deployed.json';
import { abi as operationAbi } from '../build/contracts/Events.json';
import { abi as adminAbi } from '../build/contracts/AdminImpl.json';
import { abi as permissionAbi } from '../build/contracts/Permission.json';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(mkdirp);

const TEST_NETWORK_ID: string = '1001';
const COVERAGE_NETWORK_ID: string = '1002';

async function clean(): Promise<void> {
  const directory = `${__dirname}/../build/published_contracts/`;
  const testDirectory = `${__dirname}/../build/testing_contracts/`;
  await mkdirAsync(directory);
  await mkdirAsync(testDirectory);

  const allContractNames = Object.keys(contracts).concat(Object.keys(testContracts));

  const promises = allContractNames.map(async (contractName) => {
    let contract = contracts[contractName];
    const finalDirectory = contract ? directory : testDirectory;
    if (!contract) {
      contract = testContracts[contractName];
    }

    const cleaned = {
      contractName: contract.contractName,
      abi: contract.abi,
      networks: {},
    };

    if (externalDeployed[contractName]) {
      cleaned.networks = externalDeployed[contractName];
    } else if (deployed[contractName]) {
      cleaned.networks = deployed[contractName];
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
        .concat(getAllEvents(operationAbi))
        .concat(getAllEvents(adminAbi))
        .concat(getAllEvents(permissionAbi));
    }

    const json = JSON.stringify(cleaned, null, 4);

    const filename = `${contractName}.json`;
    await writeFileAsync(finalDirectory + filename, json, null);

    console.log(`Wrote ${finalDirectory}${filename}`);
  });

  await Promise.all(promises);
}

function getAllEvents(abi: any) {
  return abi.filter(e => e.type === 'event');
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
