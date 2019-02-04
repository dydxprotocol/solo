import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { toBytes } from '../../src/lib/BytesHelper';

describe('Call', () => {
  let solo: Solo;
  let accounts: address[];

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
  });

  beforeEach(async () => {
    await resetEVM();
    await mineAvgBlock();
  });

  it('Basic call test', async () => {
    await setupMarkets(solo, accounts);

    const accountData = new BigNumber(100);
    const senderData = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ONE;

    const { gasUsed } = await solo.operation.initiate()
      .call({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        callee: solo.testing.callee.getAddress(),
        data: toBytes(accountData, senderData),
      })
      .commit();

    console.log(`\tCall gas used: ${gasUsed}`);

    const [
      foundAccountData,
      foundSenderData,
    ] = await Promise.all([
      solo.testing.callee.getAccountData(who, accountNumber),
      solo.testing.callee.getSenderData(who), // TODO make sender a different address
    ]);

    expect(foundAccountData).toEqual(accountData.toFixed(0));
    expect(foundSenderData).toEqual(senderData.toFixed(0));

    //TODO: expect log
  });

  it('Fails for non-operator', async () => {
    //TODO
  });

  it('Fails for non-ICallee contract', async () => {
    //TODO
  });
});
