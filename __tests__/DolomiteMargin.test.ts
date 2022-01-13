import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { provider } from './helpers/Provider';
import DolomiteMarginJson from '../build/contracts/DolomiteMargin.json';
import OperationImplJson from '../build/contracts/OperationImpl.json';
import AdminImplJson from '../build/contracts/AdminImpl.json';
import LiquidateOrVaporizeImplJson from '../build/contracts/LiquidateOrVaporizeImpl.json';

describe('DolomiteMargin', () => {
  it('Initializes a new instance successfully', async () => {
    new TestDolomiteMargin(provider, Number(process.env.NETWORK_ID));
  });

  it('Has a bytecode that does not exceed the maximum', async () => {
    if (process.env.COVERAGE === 'true') {
      return;
    }

    // Max size is 0x6000 (= 24576) bytes
    const maxSize = 24576 * 2; // 2 characters per byte
    expect(DolomiteMarginJson.deployedBytecode.length).toBeLessThan(maxSize);
    expect(OperationImplJson.deployedBytecode.length).toBeLessThan(maxSize);
    expect(AdminImplJson.deployedBytecode.length).toBeLessThan(maxSize);
    expect(LiquidateOrVaporizeImplJson.deployedBytecode.length).toBeLessThan(maxSize);
  });
});
