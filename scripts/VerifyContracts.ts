import { execSync } from 'child_process';
import deployed from '../migrations/deployed.json';
import truffleConfig from '../truffle';

async function verifyAll(): Promise<void> {
  if (!process.env.NETWORK) {
    return Promise.reject(new Error('No NETWORK specified!'));
  }

  const keys = Object.keys(deployed);
  const networkId = truffleConfig.networks[process.env.NETWORK]['network_id'];
  console.log('Looking for contracts with network ID:', networkId);

  for (let i = 0; i < keys.length; i += 1) {
    const contract = deployed[keys[i]][networkId];
    if (contract && contract.address && !keys[i].toLowerCase().includes('AmmRebalancer'.toLowerCase())) {
      try {
        execSync(`truffle run verify --network ${process.env.NETWORK} ${keys[i]}@${contract.address}`, {
          stdio: 'inherit',
        });
        console.log('Successfully verified', keys[i]);
      } catch (e) {
        console.error(`Could not verify ${keys[i]} due to error:`, e.message);
      }
    } else {
      console.warn('No contract found for key:', keys[i]);
    }
  }
}

verifyAll()
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  })
  .then(() => process.exit(0));
