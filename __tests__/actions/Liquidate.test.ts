import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
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
    await mineAvgBlock();
  });

  it('Basic liquidate test', async () => {
    await setupMarkets(solo, accounts);

    const fullAmount = new BigNumber(100);
    const who1 = solo.getDefaultAccount();
    const who2 = accounts[2];
    expect(who1).not.toEqual(who2);
    const accountNumber1 = INTEGERS.ZERO;
    const accountNumber2 = INTEGERS.ONE;
    const marketA = INTEGERS.ZERO;
    const marketB = INTEGERS.ONE;
    const collateralization = new BigNumber('1.1');
    const premium = new BigNumber('1.05');

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
        fullAmount.times(collateralization),
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketB,
        fullAmount.times(-1),
      ),
    ]);

    const { gasUsed } = await solo.operation.initiate()
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

    const [
      balancesA,
      balancesB,
    ] = await Promise.all([
      solo.getters.getAccountBalances(who1, accountNumber1),
      solo.getters.getAccountBalances(who2, accountNumber2),
    ]);

    balancesA.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === marketA.toNumber()) {
        expected = fullAmount.times(premium);
      }
      if (i === marketB.toNumber()) {
        expected = fullAmount.times(4);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
    balancesB.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === marketA.toNumber()) {
        expected = fullAmount.times(collateralization.minus(premium));
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });
});
