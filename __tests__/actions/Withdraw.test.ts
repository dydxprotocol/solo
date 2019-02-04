import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
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
    await mineAvgBlock();
  });

  it('Basic withdraw test', async () => {
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

    const { gasUsed } = await solo.operation.initiate()
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

    expect(walletTokenBalance).toEqual(amount2);
    expect(soloTokenBalance).toEqual(amount2);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = amount2;
      }

      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });

    // TODO: expect log
  });

  it('Succeeds for some non-one index', async () => {
    //TODO
  });

  it('Succeeds for all kinds of amounts', async () => {
    //TODO
  });

  it('Succeeds to go from zero to negative', async () => {
    //TODO
  });

  it('Succeeds to go from positive to negative', async () => {
    //TODO
  });

  it('Succeeds to withdraw to an external address', async () => {
    //TODO
  });

  it('Succeeds to withdraw to the SoloMargin address', async () => {
    //TODO
  });

  it('Fails for non-operator', async () => {
    //TODO
  });

  it('Fails for positive amount', async () => {
    //TODO
  });

  it('Fails if withdrawing more tokens than exist', async () => {
    //TODO
  });
});
