import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';

describe('Liquidate', () => {
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

  it('Liquidate', async () => {
    await setupMarkets(solo, accounts);

    const fullAmount = new BigNumber(100);
    const who1 = solo.getDefaultAccount();
    const who2 = accounts[2];
    expect(who1).not.toEqual(who2);
    const accountNumber1 = INTEGERS.ZERO;
    const accountNumber2 = INTEGERS.ONE;
    const marketA = INTEGERS.ZERO;
    const marketB = INTEGERS.ONE;

    await Promise.all([
      // set balances
      solo.testing.setAccountBalance(
        who1,
        accountNumber1,
        marketB,
        fullAmount.times(5),
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketA,
        fullAmount.times(1.2),
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketB,
        fullAmount.times(-1),
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .liquidate({
        primaryAccountOwner: who1,
        primaryAccountId: accountNumber1,
        liquidAccountOwner: who2,
        liquidAccountId: accountNumber2,
        liquidMarketId: marketB,
        payoutMarketId: marketA,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .commit();

    console.log(`\tLiquidate gas used: ${gasUsed}`);
  });
});
