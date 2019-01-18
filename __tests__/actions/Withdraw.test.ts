import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';

describe('Withdraw', () => {
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

  it('Withdraw', async () => {
    await setupMarkets(solo, accounts);

    const amount1 = new BigNumber(100);
    const amount2 = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const market = INTEGERS.ZERO;

    await Promise.all([
      solo.testing.tokenA.issueTo(
        amount1,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber,
        market,
        amount1,
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .withdraw({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        marketId: market,
        amount: {
          value: amount2.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
        to: who,
      })
      .commit();

    console.log(`\tWithdraw gas used: ${gasUsed}`);

    const [
      walletTokenBalance,
      soloTokenBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance.eq(amount2)).toBe(true);
    expect(soloTokenBalance.eq(amount2)).toBe(true);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = amount2;
      }

      expect(balance.par.eq(expected)).toBe(true);
      expect(balance.wei.eq(expected)).toBe(true);
    });
  });
});
