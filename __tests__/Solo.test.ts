import { Solo } from '../src/Solo';
import { provider } from './helpers/Provider';
import { NETWORK_ID } from './helpers/Constants';

describe('Solo', () => {
  it('Initializes a new instance successfully', async () => {
    new Solo(provider, NETWORK_ID);
  });
});
