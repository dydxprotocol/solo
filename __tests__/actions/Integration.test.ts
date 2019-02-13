import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';

describe('Integration', () => {
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

  it('Deposit then Withdraw', async () => {
    await setupMarkets(solo, accounts);

    const amount1 = new BigNumber(100);
    const amount2 = new BigNumber(50);
    const who = solo.getDefaultAccount();
    const accountNumber = INTEGERS.ZERO;
    const market = INTEGERS.ZERO;

    await Promise.all([
      solo.testing.tokenA.issueTo(
        amount1,
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
          value: amount1,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
        from: who,
      })
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

    console.log(`\tDeposit then Withdraw gas used: ${gasUsed}`);

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
  });

  it('Liquidate => Exchange => Withdraw', async () => {
    await setupMarkets(solo, accounts);

    const amount = new BigNumber(100);
    const solidOwner = solo.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMkt = INTEGERS.ZERO;
    const owedMkt = INTEGERS.ONE;
    const heldToken = solo.testing.tokenA;
    const owedToken = solo.testing.tokenB;
    const collateralization = new BigNumber('1.1');
    const premium = new BigNumber('1.05');

    await Promise.all([
      // issue tokens
      heldToken.issueTo(
        amount.times(collateralization),
        solo.contracts.soloMargin.options.address,
      ),
      owedToken.issueTo(
        amount,
        solo.testing.exchangeWrapper.getAddress(),
      ),

      // set balances
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMkt,
        amount.times(collateralization),
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMkt,
        amount.times(-1),
      ),
    ]);

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: solidOwner,
      makerToken: owedToken.getAddress(),
      takerToken: heldToken.getAddress(),
      makerAmount: amount,
      takerAmount: amount,
    };

    const { gasUsed } = await solo.operation.initiate()
      .liquidate({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        liquidAccountOwner: liquidOwner,
        liquidAccountId: liquidNumber,
        liquidMarketId: owedMkt,
        payoutMarketId: heldMkt,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .buy({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        takerMarketId: heldMkt,
        makerMarketId: owedMkt,
        order: testOrder,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .withdraw({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        marketId: heldMkt,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
        to: solidOwner,
      })
      .commit();

    console.log(`\tLiquidate => Exchange => Withdraw gas used: ${gasUsed}`);

    const [
      ownerHeldTokenBalance,
      ownerOwedTokenBalance,
      wrapperHeldTokenBalance,
      wrapperOwedTokenBalance,
      soloHeldTokenBalance,
      soloOwedTokenBalance,
      solidBalances,
      liquidBalances,
    ] = await Promise.all([
      heldToken.getBalance(solidOwner),
      owedToken.getBalance(solidOwner),
      heldToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
      owedToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
      heldToken.getBalance(solo.contracts.soloMargin.options.address),
      owedToken.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(solidOwner, solidNumber),
      solo.getters.getAccountBalances(liquidOwner, liquidNumber),
    ]);

    expect(ownerHeldTokenBalance).toEqual(amount.times(premium.minus(1)));
    expect(ownerOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperHeldTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloHeldTokenBalance).toEqual(amount.times(collateralization.minus(premium)));
    expect(soloOwedTokenBalance).toEqual(amount);

    solidBalances.forEach((balance, i) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
    liquidBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMkt.toNumber()) {
        expected = amount.times(collateralization.minus(premium));
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Opening a new short position (deposit in heldToken)', async () => {
    await setupMarkets(solo, accounts);

    const amount = new BigNumber(100);
    const owner = solo.getDefaultAccount();
    const oneNumber = INTEGERS.ZERO;
    const twoNumber = INTEGERS.ONE;
    const heldMkt = INTEGERS.ZERO;
    const owedMkt = INTEGERS.ONE;
    const heldToken = solo.testing.tokenA;
    const owedToken = solo.testing.tokenB;

    await Promise.all([
      // issue tokens
      owedToken.issueTo(
        amount,
        solo.contracts.soloMargin.options.address,
      ),
      heldToken.issueTo(
        amount,
        solo.testing.exchangeWrapper.getAddress(),
      ),

      // set balances
      solo.testing.setAccountBalance(
        owner,
        oneNumber,
        heldMkt,
        amount,
      ),
    ]);

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: owner,
      makerToken: heldToken.getAddress(),
      takerToken: owedToken.getAddress(),
      makerAmount: amount,
      takerAmount: amount,
    };

    const { gasUsed } = await solo.operation.initiate()
      .transfer({
        primaryAccountOwner: owner,
        primaryAccountId: oneNumber,
        toAccountOwner: owner,
        toAccountId: twoNumber,
        marketId: heldMkt,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .sell({
        primaryAccountOwner: owner,
        primaryAccountId: twoNumber,
        takerMarketId: owedMkt,
        makerMarketId: heldMkt,
        order: testOrder,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .commit();

    console.log(`\tOpen-Short (deposit in heldToken) gas used: ${gasUsed}`);

    const [
      wrapperHeldTokenBalance,
      wrapperOwedTokenBalance,
      soloHeldTokenBalance,
      soloOwedTokenBalance,
      oneBalances,
      twoBalances,
    ] = await Promise.all([
      heldToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
      owedToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
      heldToken.getBalance(solo.contracts.soloMargin.options.address),
      owedToken.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(owner, oneNumber),
      solo.getters.getAccountBalances(owner, twoNumber),
    ]);

    expect(wrapperHeldTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloHeldTokenBalance).toEqual(amount);
    expect(soloOwedTokenBalance).toEqual(INTEGERS.ZERO);

    oneBalances.forEach((balance, i) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });

    twoBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMkt.toNumber()) {
        expected = amount.times(2);
      }
      if (i === owedMkt.toNumber()) {
        expected = amount.times(-1);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });
});

// ============ Helper Functions ============
