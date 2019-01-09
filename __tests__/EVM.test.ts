import { solo } from './helpers/Solo';

describe('EVM', () => {
  it('Resets the state of the EVM successfully', async () => {
    await solo.testing.evm.resetEVM();
  });
});
