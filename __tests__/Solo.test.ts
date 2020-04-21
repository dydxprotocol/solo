import { TestSolo } from './modules/TestSolo';
import { provider } from './helpers/Provider';
import SoloMarginJson from '../build/contracts/SoloMargin.json';
import OperationImplJson from '../build/contracts/OperationImpl.json';
import AdminImplJson from '../build/contracts/AdminImpl.json';

describe('Solo', () => {
  it('Initializes a new instance successfully', async () => {
    new TestSolo(provider, Number(process.env.NETWORK_ID));
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
