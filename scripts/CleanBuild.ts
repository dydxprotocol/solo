import fs from 'fs';
import { promisify } from 'es6-promisify';
import mkdirp from 'mkdirp';
import * as contracts from './contracts';
import deployed from '../migrations/deployed.json';
import externalDeployed from '../migrations/external-deployed.json';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(mkdirp);

const DOCKER_NETWORK_ID: string = '1212';

async function clean(): Promise<void> {
  const directory = `${__dirname}/../build/test/`;
  await mkdirAsync(directory);

  const promises = Object.keys(contracts).map(async (contractName) => {
    const contract = contracts[contractName];

    const cleaned = {
      contractName: contract.contractName,
      abi: contract.abi,
      bytecode: contract.bytecode,
      networks: {},
      schemaVersion: contract.schemaVersion,
    };

    if (deployed[contractName]) {
      cleaned.networks = deployed[contractName];
    }

    if (externalDeployed[contractName]) {
      cleaned.networks = externalDeployed[contractName];
    }

    if (contract.networks[DOCKER_NETWORK_ID]) {
      cleaned.networks[DOCKER_NETWORK_ID] = {
        links: contract.networks[DOCKER_NETWORK_ID].links,
        address: contract.networks[DOCKER_NETWORK_ID].address,
        transactionHash: contract.networks[DOCKER_NETWORK_ID].transactionHash,
      };
    }

    const json = JSON.stringify(cleaned, null, 4);

    const filename = `${contractName}.json`;
    await writeFileAsync(directory + filename, json, null);

    console.log(`Wrote ${directory}${filename}`);
  });

  await Promise.all(promises);
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
