import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';

describe('Transfer', () => {
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

  it('Transfer', async () => {
    await setupMarkets(solo, accounts);

    const fullAmount = new BigNumber(100);
    const halfAmount = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber1 = INTEGERS.ZERO;
    const accountNumber2 = INTEGERS.ONE;
    const market = INTEGERS.ZERO;

    await Promise.all([
      solo.testing.setAccountBalance(
        who,
        accountNumber1,
        market,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber2,
        market,
        fullAmount,
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .transfer({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber1,
        toAccountOwner: who,
        toAccountId: accountNumber2,
        marketId: market,
        amount: {
          value: halfAmount,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tTransfer gas used: ${gasUsed}`);

    const [
      accountBalances1,
      accountBalances2,
    ] = await Promise.all([
      solo.getters.getAccountBalances(who, accountNumber1),
      solo.getters.getAccountBalances(who, accountNumber2),
    ]);

    accountBalances1.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = fullAmount.plus(halfAmount);
      }
      expect(balance.par.eq(expected)).toBe(true);
      expect(balance.wei.eq(expected)).toBe(true);
    });

    accountBalances2.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = fullAmount.minus(halfAmount);
      }
      expect(balance.par.eq(expected)).toBe(true);
      expect(balance.wei.eq(expected)).toBe(true);
    });
  });
});
