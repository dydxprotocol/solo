import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address } from '../../src/types';
import { resetEVM } from '../helpers/EVM';

describe('Deposit', () => {
  let solo: Solo;
  let accounts: address[];

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
  });

  beforeEach(async () => {
    await resetEVM();
  });

  it('Deposit', async () => {
    // TODO
    solo;
    accounts;
  });
});
