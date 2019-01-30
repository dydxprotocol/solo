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

  it('Basic deposit test', async () => {
    await setupMarkets(solo, accounts);

    const amount = new BigNumber(100);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const market = INTEGERS.ZERO;

    await Promise.all([
      solo.testing.tokenA.issueTo(
        amount,
        who,
      ),
      solo.testing.tokenA.setMaximumSoloAllowance(
        who,
      ),
    ]);

    const { gasUsed } = await solo.operation.initiate()
      .deposit({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        marketId: market,
        amount: {
          value: amount,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
        from: who,
      })
      .commit();

    console.log(`\tDeposit gas used: ${gasUsed}`);

    const [
      walletTokenBalance,
      soloTokenBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloTokenBalance).toEqual(amount);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = amount;
      }

      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });
});
