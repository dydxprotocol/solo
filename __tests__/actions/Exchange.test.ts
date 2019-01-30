import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';

describe('Exchange', () => {
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

  it('Basic buy test', async () => {
    await setupMarkets(solo, accounts);

    const startAmount = new BigNumber(100);
    const tradeAmount = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const takerMkt = INTEGERS.ZERO;
    const makerMkt = INTEGERS.ONE;

    await Promise.all([
      solo.testing.tokenB.issueTo(
        startAmount,
        solo.testing.exchangeWrapper.getAddress(),
      ),
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

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: who,
      makerToken: solo.testing.tokenB.getAddress(),
      takerToken: solo.testing.tokenA.getAddress(),
      makerAmount: tradeAmount,
      takerAmount: tradeAmount,
    };

    const { gasUsed } = await solo.operation.initiate()
      .buy({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        takerMarketId: takerMkt,
        makerMarketId: makerMkt,
        order: testOrder,
        amount: {
          value: tradeAmount,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tBuy gas used: ${gasUsed}`);

    const [
      exchangeBalance,
      takerBalance,
      makerBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(solo.testing.exchangeWrapper.getAddress()),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.testing.tokenB.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(exchangeBalance).toEqual(INTEGERS.ZERO);

    const expectedTakerAmount = startAmount.minus(tradeAmount);
    const expectedMakerAmount = startAmount.plus(tradeAmount);
    expect(takerBalance).toEqual(expectedTakerAmount);
    expect(makerBalance).toEqual(expectedMakerAmount);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === takerMkt.toNumber()) {
        expected = expectedTakerAmount;
      }
      if (i === makerMkt.toNumber()) {
        expected = expectedMakerAmount;
      }

      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Basic sell test', async () => {
    await setupMarkets(solo, accounts);

    const startAmount = new BigNumber(100);
    const tradeAmount = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const takerMkt = INTEGERS.ZERO;
    const makerMkt = INTEGERS.ONE;

    await Promise.all([
      solo.testing.tokenB.issueTo(
        startAmount,
        solo.testing.exchangeWrapper.getAddress(),
      ),
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

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: who,
      makerToken: solo.testing.tokenB.getAddress(),
      takerToken: solo.testing.tokenA.getAddress(),
      makerAmount: tradeAmount,
      takerAmount: tradeAmount,
    };

    const { gasUsed } = await solo.operation.initiate()
      .sell({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        takerMarketId: takerMkt,
        makerMarketId: makerMkt,
        order: testOrder,
        amount: {
          value: tradeAmount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();

    console.log(`\tSell gas used: ${gasUsed}`);

    const [
      exchangeBalance,
      takerBalance,
      makerBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(solo.testing.exchangeWrapper.getAddress()),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.testing.tokenB.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(exchangeBalance).toEqual(INTEGERS.ZERO);

    const expectedTakerAmount = startAmount.minus(tradeAmount);
    const expectedMakerAmount = startAmount.plus(tradeAmount);
    expect(takerBalance).toEqual(expectedTakerAmount);
    expect(makerBalance).toEqual(expectedMakerAmount);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === takerMkt.toNumber()) {
        expected = expectedTakerAmount;
      }
      if (i === makerMkt.toNumber()) {
        expected = expectedMakerAmount;
      }

      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });
});
