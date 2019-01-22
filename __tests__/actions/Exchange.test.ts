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

  it('Buy', async () => {
    await setupMarkets(solo, accounts);

    const startAmount = new BigNumber(100);
    const tradeAmount = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const takerMkt = INTEGERS.ZERO;
    const makerMkt = INTEGERS.ONE;

    await Promise.all([
      solo.testing.tokenA.issueTo(
        startAmount,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.tokenB.issueTo(
        startAmount,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber,
        takerMkt,
        startAmount,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber,
        makerMkt,
        startAmount,
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .testBuy({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
        takerMarketId: takerMkt,
        makerMarketId: makerMkt,
        takerAmount: tradeAmount,
        makerAmount: tradeAmount,
        amount: {
          value: tradeAmount,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tBuy gas used: ${gasUsed}`);

    const [
      takerBalance,
      makerBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.testing.tokenB.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    const expectedTakerAmount = startAmount.minus(tradeAmount);
    const expectedMakerAmount = startAmount.plus(tradeAmount);
    expect(takerBalance.eq(expectedTakerAmount)).toBe(true);
    expect(makerBalance.eq(expectedMakerAmount)).toBe(true);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === takerMkt.toNumber()) {
        expected = expectedTakerAmount;
      }
      if (i === makerMkt.toNumber()) {
        expected = expectedMakerAmount;
      }

      expect(balance.par.eq(expected)).toBe(true);
      expect(balance.wei.eq(expected)).toBe(true);
    });
  });

  it('Sell', async () => {
    await setupMarkets(solo, accounts);

    const startAmount = new BigNumber(100);
    const tradeAmount = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const takerMkt = INTEGERS.ZERO;
    const makerMkt = INTEGERS.ONE;

    await Promise.all([
      solo.testing.tokenA.issueTo(
        startAmount,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.tokenB.issueTo(
        startAmount,
        solo.contracts.soloMargin.options.address,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber,
        takerMkt,
        startAmount,
      ),
      solo.testing.setAccountBalance(
        who,
        accountNumber,
        makerMkt,
        startAmount,
      ),
    ]);

    const { gasUsed } = await solo.transaction.initiate()
      .testSell({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
        takerMarketId: takerMkt,
        makerMarketId: makerMkt,
        takerAmount: tradeAmount,
        makerAmount: tradeAmount,
        amount: {
          value: tradeAmount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tBuy gas used: ${gasUsed}`);

    const [
      takerBalance,
      makerBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.testing.tokenB.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    const expectedTakerAmount = startAmount.minus(tradeAmount);
    const expectedMakerAmount = startAmount.plus(tradeAmount);
    expect(takerBalance.eq(expectedTakerAmount)).toBe(true);
    expect(makerBalance.eq(expectedMakerAmount)).toBe(true);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === takerMkt.toNumber()) {
        expected = expectedTakerAmount;
      }
      if (i === makerMkt.toNumber()) {
        expected = expectedMakerAmount;
      }

      expect(balance.par.eq(expected)).toBe(true);
      expect(balance.wei.eq(expected)).toBe(true);
    });
  });
});
