import { Solo } from '../src/Solo';
import { provider } from './helpers/Provider';
import { NETWORK_ID } from './helpers/Constants';
import SoloMarginJson from '../build/contracts/SoloMargin.json';
import InteractionImplJson from '../build/contracts/InteractionImpl.json';
import AdminImplJson from '../build/contracts/AdminImpl.json';

describe('Solo', () => {
  it('Initializes a new instance successfully', async () => {
    new Solo(provider, NETWORK_ID);
  });

  it('Has a bytecode that does not exceed the maximum', async () => {
      const maxSize = 24000 * 2; // 2 characters per byte
      expect(SoloMarginJson.deployedBytecode.length).toBeLessThan(maxSize);
      expect(InteractionImplJson.deployedBytecode.length).toBeLessThan(maxSize);
      expect(AdminImplJson.deployedBytecode.length).toBeLessThan(maxSize);
  });
});
