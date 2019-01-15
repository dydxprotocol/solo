import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';

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
    await setupMarkets(solo, accounts);

    const amount = new BigNumber(100);
    const who = solo.getDefaultAccount();

    await Promise.all([
      solo.testing.tokenA.issueTo(
        amount,
        who,
      ),
      solo.testing.tokenA.setMaximumSoloAllowance(
        who,
      ),
    ]);

    const tx = await solo.transaction.initiate()
      .deposit({
        primaryAccountOwner: who,
        primaryAccountId: INTEGERS.ZERO,
        marketId: INTEGERS.ZERO,
        amount: {
          value: amount,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
        from: who,
      })
      .commit();

    console.log(tx)
  });
});
