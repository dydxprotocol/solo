import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM, snapshot } from './helpers/EVM';
import { setGlobalOperator, setupMarkets } from './helpers/DolomiteMarginHelpers';
import { INTEGERS } from '../src/lib/Constants';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';
import { stringToDecimal } from '../src/lib/Helpers';
import {
  address,
  AmountDenomination,
  AmountReference,
  TxResult,
} from '../src/types';

const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const amount = new BigNumber(10000);
const halfAmount = amount.div(2);
const zero = new BigNumber(0);

describe('Integration', () => {
  let dolomiteMargin: TestDolomiteMargin;
  let accounts: address[];
  let snapshotId: string;
  let who: address;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    who = dolomiteMargin.getDefaultAccount();
    await resetEVM();
    await setGlobalOperator(dolomiteMargin, accounts, dolomiteMargin.getDefaultAccount());
    await setupMarkets(dolomiteMargin, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('No interest increase when index update was this block', async () => {
    const blob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      marketId: market,
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
      from: who,
    };
    const actualRate = stringToDecimal('1234');
    await dolomiteMargin.testing.interestSetter.setInterestRate(
      dolomiteMargin.testing.tokenA.getAddress(),
      actualRate,
    );

    let result1: TxResult;
    let result2: TxResult;
    let block1: any;
    let block2: any;

    let numTries = 0;
    do {
      await dolomiteMargin.testing.evm.stopMining();
      const tx1 = dolomiteMargin.operation
        .initiate()
        .deposit(blob)
        .commit();
      const tx2 = dolomiteMargin.operation
        .initiate()
        .deposit(blob)
        .commit();
      await dolomiteMargin.testing.evm.startMining();
      [result1, result2] = await Promise.all([tx1, tx2]);
      [block1, block2] = await Promise.all([
        dolomiteMargin.web3.eth.getBlock(result1.blockNumber),
        dolomiteMargin.web3.eth.getBlock(result2.blockNumber),
      ]);
      numTries += 1;
    } while (block1.timestamp !== block2.timestamp || numTries > 10);

    expect(block1.timestamp).toEqual(block2.timestamp);
    expect(result1.events.LogIndexUpdate.returnValues).toEqual(
      result2.events.LogIndexUpdate.returnValues,
    );
  });

  it('Deposit then Withdraw', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(amount, who),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(who),
    ]);

    const { gasUsed } = await dolomiteMargin.operation
      .initiate()
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
      .withdraw({
        primaryAccountOwner: who,
        primaryAccountId: accountNumber,
        marketId: market,
        amount: {
          value: halfAmount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
        to: who,
      })
      .commit();

    console.log(`\tDeposit then Withdraw gas used: ${gasUsed}`);

    const [
      walletTokenBalance,
      dolomiteMarginTokenBalance,
      accountBalances,
    ] = await Promise.all([
      dolomiteMargin.testing.tokenA.getBalance(who),
      dolomiteMargin.testing.tokenA.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
      dolomiteMargin.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance).toEqual(halfAmount);
    expect(dolomiteMarginTokenBalance).toEqual(halfAmount);

    accountBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === market.toNumber()) {
        expected = halfAmount;
      }

      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Liquidate multiple times', async () => {
    const solidOwner = dolomiteMargin.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket1 = INTEGERS.ZERO;
    const heldMarket2 = new BigNumber(2);
    const owedMarket = INTEGERS.ONE;
    const premium = new BigNumber('1.05');

    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(
        solidOwner,
        solidNumber,
        owedMarket,
        amount,
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket1,
        amount.times(premium).div(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket2,
        amount.times(premium).div(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
        amount.times(-1),
      ),
    ]);

    await dolomiteMargin.operation
      .initiate()
      .liquidate({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        liquidAccountOwner: liquidOwner,
        liquidAccountId: liquidNumber,
        liquidMarketId: owedMarket,
        payoutMarketId: heldMarket1,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .liquidate({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        liquidAccountOwner: liquidOwner,
        liquidAccountId: liquidNumber,
        liquidMarketId: owedMarket,
        payoutMarketId: heldMarket2,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .commit();

    const [solidBalances, liquidBalances] = await Promise.all([
      dolomiteMargin.getters.getAccountBalances(solidOwner, solidNumber),
      dolomiteMargin.getters.getAccountBalances(liquidOwner, liquidNumber),
    ]);

    solidBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMarket1.toNumber() || i === heldMarket2.toNumber()) {
        expected = amount.times(premium).div(2);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
    liquidBalances.forEach((balance, _) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Liquidate => Vaporize', async () => {
    const solidOwner = dolomiteMargin.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
    const heldToken = dolomiteMargin.testing.tokenA;
    const premium = new BigNumber('1.05');

    await Promise.all([
      // issue tokens
      heldToken.issueTo(
        amount.times(2),
        dolomiteMargin.contracts.dolomiteMargin.options.address,
      ),

      // set balances
      dolomiteMargin.testing.setAccountBalance(
        solidOwner,
        solidNumber,
        owedMarket,
        amount,
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket,
        amount.times(premium).div(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
        amount.times(-1),
      ),
    ]);

    const { gasUsed } = await dolomiteMargin.operation
      .initiate()
      .liquidate({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        liquidAccountOwner: liquidOwner,
        liquidAccountId: liquidNumber,
        liquidMarketId: owedMarket,
        payoutMarketId: heldMarket,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .vaporize({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        vaporAccountOwner: liquidOwner,
        vaporAccountId: liquidNumber,
        vaporMarketId: owedMarket,
        payoutMarketId: heldMarket,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .commit();

    console.log(`\tLiquidate => Vaporize gas used: ${gasUsed}`);

    const [solidBalances, liquidBalances] = await Promise.all([
      dolomiteMargin.getters.getAccountBalances(solidOwner, solidNumber),
      dolomiteMargin.getters.getAccountBalances(liquidOwner, liquidNumber),
    ]);

    solidBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMarket.toNumber()) {
        expected = amount.times(premium);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
    liquidBalances.forEach((balance, _) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Liquidate => Exchange => Withdraw', async () => {
    const amount = new BigNumber(100);
    const solidOwner = dolomiteMargin.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
    const heldToken = dolomiteMargin.testing.tokenA;
    const owedToken = dolomiteMargin.testing.tokenB;
    const collateralization = new BigNumber('1.1');
    const premium = new BigNumber('1.05');

    await Promise.all([
      // issue tokens
      heldToken.issueTo(
        amount.times(collateralization),
        dolomiteMargin.contracts.dolomiteMargin.options.address,
      ),
      owedToken.issueTo(amount, dolomiteMargin.testing.exchangeWrapper.getAddress()),

      // set balances
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket,
        amount.times(collateralization),
      ),
      dolomiteMargin.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
        amount.times(-1),
      ),
    ]);

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: dolomiteMargin.testing.exchangeWrapper.getAddress(),
      originator: solidOwner,
      makerToken: owedToken.getAddress(),
      takerToken: heldToken.getAddress(),
      makerAmount: amount,
      takerAmount: amount,
      allegedTakerAmount: amount,
      desiredMakerAmount: amount,
    };

    const { gasUsed } = await dolomiteMargin.operation
      .initiate()
      .liquidate({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        liquidAccountOwner: liquidOwner,
        liquidAccountId: liquidNumber,
        liquidMarketId: owedMarket,
        payoutMarketId: heldMarket,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      })
      .buy({
        primaryAccountOwner: solidOwner,
        primaryAccountId: solidNumber,
        takerMarketId: heldMarket,
        makerMarketId: owedMarket,
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
        marketId: heldMarket,
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
      dolomiteMarginHeldTokenBalance,
      dolomiteMarginOwedTokenBalance,
      solidBalances,
      liquidBalances,
    ] = await Promise.all([
      heldToken.getBalance(solidOwner),
      owedToken.getBalance(solidOwner),
      heldToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
      owedToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
      heldToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
      owedToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
      dolomiteMargin.getters.getAccountBalances(solidOwner, solidNumber),
      dolomiteMargin.getters.getAccountBalances(liquidOwner, liquidNumber),
    ]);

    expect(ownerHeldTokenBalance).toEqual(amount.times(premium.minus(1)));
    expect(ownerOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperHeldTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(dolomiteMarginHeldTokenBalance).toEqual(
      amount.times(collateralization.minus(premium)),
    );
    expect(dolomiteMarginOwedTokenBalance).toEqual(amount);

    solidBalances.forEach((balance, _) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
    liquidBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMarket.toNumber()) {
        expected = amount.times(collateralization.minus(premium));
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Opening a new short position (deposit in heldToken)', async () => {
    const amount = new BigNumber(100);
    const owner = dolomiteMargin.getDefaultAccount();
    const oneNumber = INTEGERS.ZERO;
    const twoNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
    const heldToken = dolomiteMargin.testing.tokenA;
    const owedToken = dolomiteMargin.testing.tokenB;

    await Promise.all([
      // issue tokens
      owedToken.issueTo(amount, dolomiteMargin.contracts.dolomiteMargin.options.address),
      heldToken.issueTo(amount, dolomiteMargin.testing.exchangeWrapper.getAddress()),

      // set balances
      dolomiteMargin.testing.setAccountBalance(owner, oneNumber, heldMarket, amount),
    ]);

    const testOrder: TestOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: dolomiteMargin.testing.exchangeWrapper.getAddress(),
      originator: owner,
      makerToken: heldToken.getAddress(),
      takerToken: owedToken.getAddress(),
      makerAmount: amount,
      takerAmount: amount,
      allegedTakerAmount: amount,
      desiredMakerAmount: amount,
    };

    const { gasUsed } = await dolomiteMargin.operation
      .initiate()
      .transfer({
        primaryAccountOwner: owner,
        primaryAccountId: oneNumber,
        toAccountOwner: owner,
        toAccountId: twoNumber,
        marketId: heldMarket,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .sell({
        primaryAccountOwner: owner,
        primaryAccountId: twoNumber,
        takerMarketId: owedMarket,
        makerMarketId: heldMarket,
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
      dolomiteMarginHeldTokenBalance,
      dolomiteMarginOwedTokenBalance,
      oneBalances,
      twoBalances,
    ] = await Promise.all([
      heldToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
      owedToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
      heldToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
      owedToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
      dolomiteMargin.getters.getAccountBalances(owner, oneNumber),
      dolomiteMargin.getters.getAccountBalances(owner, twoNumber),
    ]);

    expect(wrapperHeldTokenBalance).toEqual(INTEGERS.ZERO);
    expect(wrapperOwedTokenBalance).toEqual(INTEGERS.ZERO);
    expect(dolomiteMarginHeldTokenBalance).toEqual(amount);
    expect(dolomiteMarginOwedTokenBalance).toEqual(INTEGERS.ZERO);

    oneBalances.forEach((balance, _) => {
      const expected = INTEGERS.ZERO;
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });

    twoBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (i === heldMarket.toNumber()) {
        expected = amount.times(2);
      }
      if (i === owedMarket.toNumber()) {
        expected = amount.times(-1);
      }
      expect(balance.par).toEqual(expected);
      expect(balance.wei).toEqual(expected);
    });
  });

  it('Skips logs when necessary', async () => {
    const blob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      marketId: market,
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
      from: who,
    };
    const txResult = await dolomiteMargin.operation
      .initiate()
      .deposit(blob)
      .commit();
    const noLogs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
    const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: false });
    expect(noLogs.length).toEqual(0);
    expect(logs.length).not.toEqual(0);
  });
});

// ============ Helper Functions ============
