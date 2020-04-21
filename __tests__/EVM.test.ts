import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
import { address } from '../src/types';
import { resetEVM } from './helpers/EVM';

describe('EVM', () => {
  let solo: TestSolo;
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
    const amount = new BigNumber(1);
    await solo.testing.tokenA.issueTo(
      amount,
      account,
    );
    const balance: BigNumber = await solo.testing.tokenA.getBalance(account);
    expect(balance).toEqual(amount);

    await resetEVM();

    const newBalance: BigNumber = await solo.testing.tokenA.getBalance(account);
    expect(newBalance).toEqual(new BigNumber(0));
  });
});
