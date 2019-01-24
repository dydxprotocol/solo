import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { toBytes } from '../../src/lib/BytesHelper';

describe('Trade', () => {
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

  it('Basic trade test', async () => {
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
    const tradeId = new BigNumber(1234);

    await Promise.all([
      // set balances
      solo.testing.setAccountBalance(
        who1,
        accountNumber1,
        marketA,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketB,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        who1,
        accountNumber1,
        marketB,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        who2,
        accountNumber2,
        marketA,
        fullAmount,
      ),

      // approve trader
      solo.permissions.approveOperator(
        solo.testing.autoTrader.getAddress(),
        { from: who2 },
      ),

      // set trade
      solo.testing.autoTrader.setData(
        tradeId,
        halfAmount,
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .trade({
        primaryAccountOwner: who1,
        primaryAccountId: accountNumber1,
        otherAccountOwner: who2,
        otherAccountId: accountNumber2,
        inputMarketId: marketB,
        outputMarketId: marketA,
        autoTrader: solo.testing.autoTrader.getAddress(),
        data: toBytes(tradeId),
        amount: {
          value: halfAmount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tTrade gas used: ${gasUsed}`);

    const [
      accountBalances1,
      accountBalances2,
    ] = await Promise.all([
      solo.getters.getAccountBalances(who1, accountNumber1),
      solo.getters.getAccountBalances(who2, accountNumber2),
    ]);

    accountBalances1.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === marketA.toNumber()) {
        expected = fullAmount.minus(halfAmount);
      }
      if (i === marketB.toNumber()) {
        expected = fullAmount.plus(halfAmount);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });

    accountBalances2.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === marketA.toNumber()) {
        expected = fullAmount.plus(halfAmount);
      }
      if (i === marketB.toNumber()) {
        expected = fullAmount.minus(halfAmount);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });
});
