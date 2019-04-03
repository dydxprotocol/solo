import { Solo } from '../src/Solo';
import { provider } from './helpers/Provider';
import SoloMarginJson from '../build/published_contracts/SoloMargin.json';
import OperationImplJson from '../build/published_contracts/OperationImpl.json';
import AdminImplJson from '../build/published_contracts/AdminImpl.json';

describe('Solo', () => {
  it('Initializes a new instance successfully', async () => {
    new Solo(provider, Number(process.env.NETWORK_ID));
  });

  it('Has a bytecode that does not exceed the maximum', async () => {
    if (process.env.COVERAGE === 'true') {
      return;
    }

    // Max size is 0x6000 (= 24576) bytes
    const maxSize = 24576 * 2; // 2 characters per byte
    expect(SoloMarginJson.deployedBytecode.length).toBeLessThan(maxSize);
    expect(OperationImplJson.deployedBytecode.length).toBeLessThan(maxSize);
    expect(AdminImplJson.deployedBytecode.length).toBeLessThan(maxSize);
  });
});
