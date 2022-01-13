import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { address } from '../src';
import { resetEVM } from './helpers/EVM';

describe('EVM', () => {
  let dolomiteMargin: TestDolomiteMargin;
  let accounts: address[];

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
  });

  beforeEach(async () => {
    await resetEVM();
  });

  it('Resets the state of the EVM successfully', async () => {
    const account = accounts[1];
    const amount = new BigNumber(1);
    await dolomiteMargin.testing.tokenA.issueTo(amount, account);
    const balance: BigNumber = await dolomiteMargin.testing.tokenA.getBalance(account);
    expect(balance).toEqual(amount);

    await resetEVM();

    const newBalance: BigNumber = await dolomiteMargin.testing.tokenA.getBalance(account);
    expect(newBalance).toEqual(new BigNumber(0));
  });
});
