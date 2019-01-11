import BN from 'bn.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { address } from '../src/types';
import { resetEVM } from './helpers/EVM';

describe('EVM', () => {
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

  it('Resets the state of the EVM successfully', async () => {
    const account = accounts[1];
    const amount = new BN(1);
    await solo.testing.tokenA.issueTo(
      amount,
      account,
    );
    const balance: BN = await solo.testing.tokenA.getBalance(account);
    expect(balance.eq(amount)).toBe(true);

    await resetEVM();

    const newBalance: BN = await solo.testing.tokenA.getBalance(account);
    expect(newBalance.eq(new BN(0))).toBe(true);
  });
});
