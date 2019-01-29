import { Solo } from '../src/Solo';
import { provider } from './helpers/Provider';
import { NETWORK_ID } from './helpers/Constants';
import { deployedBytecode } from '../build/contracts/SoloMargin.json';

describe('Solo', () => {
  it('Initializes a new instance successfully', async () => {
    new Solo(provider, NETWORK_ID);
  });

  it('Has a bytecode that does not exceed the maximum', async () => {
      expect(deployedBytecode.length).toBeLessThan(49000);
  });
});
