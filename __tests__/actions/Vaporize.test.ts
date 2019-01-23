import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';

describe('Vaporize', () => {
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

  it('Vaporize', async () => {
    await setupMarkets(solo, accounts);

    const fullAmount = new BigNumber(100);
    const halfAmount = new BigNumber(50);
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
        halfAmount,
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketB,
        fullAmount.times(-1),
      ),

      // set tokens
      solo.testing.tokenA.issueTo(
        fullAmount,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.tokenB.issueTo(
        fullAmount,
        solo.contracts.soloMargin.options.address,
      ),
    ]);

    const [
      startingBalancesA,
      startingBalancesB,
    ] = await Promise.all([
      solo.getters.getAccountBalances(who1, accountNumber1),
      solo.getters.getAccountBalances(who2, accountNumber2),
    ]);

    startingBalancesA.forEach((balance, i) => {
      console.log(balance.par.toString());
    });
    startingBalancesB.forEach((balance, i) => {
      console.log(balance.par.toString());
    });

    const { gasUsed } = await solo.transaction.initiate()
      .vaporize({
        primaryAccountOwner: who1,
        primaryAccountId: accountNumber1,
        vaporAccountOwner: who2,
        vaporAccountId: accountNumber2,
        vaporMarketId: marketB,
        payoutMarketId: marketA,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .commit();

    console.log(`\tVaporize gas used: ${gasUsed}`);
  });
});
