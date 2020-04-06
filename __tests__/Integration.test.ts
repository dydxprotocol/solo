import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
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
  let solo: TestSolo;
  let accounts: address[];
  let snapshotId: string;
  let who:address;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    who = solo.getDefaultAccount();
    await resetEVM();
    await setupMarkets(solo, accounts);
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
    await solo.testing.interestSetter.setInterestRate(solo.testing.tokenA.getAddress(), actualRate);

    let result1: TxResult;
    let result2: TxResult;
    let block1: any;
    let block2: any;

    let numTries = 0;
    do {
      await solo.testing.evm.stopMining();
      const tx1 = solo.operation.initiate().deposit(blob).commit();
      const tx2 = solo.operation.initiate().deposit(blob).commit();
      await solo.testing.evm.startMining();
      [result1, result2] = await Promise.all([tx1, tx2]);
      [block1, block2] = await Promise.all([
        solo.web3.eth.getBlock(result1.blockNumber),
        solo.web3.eth.getBlock(result2.blockNumber),
      ]);
      numTries += 1;
    }
    while (block1.timestamp !== block2.timestamp || numTries > 10);

    expect(block1.timestamp).toEqual(block2.timestamp);
    expect(
      result1.events.LogIndexUpdate.returnValues,
    ).toEqual(
      result2.events.LogIndexUpdate.returnValues,
    );
  });

  it('Deposit then Withdraw', async () => {
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
      soloTokenBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance).toEqual(halfAmount);
    expect(soloTokenBalance).toEqual(halfAmount);

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
    const solidOwner = solo.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket1 = INTEGERS.ZERO;
    const heldMarket2 = new BigNumber(2);
    const owedMarket = INTEGERS.ONE;
    const premium = new BigNumber('1.05');

    await Promise.all([
      solo.testing.setAccountBalance(
        solidOwner,
        solidNumber,
        owedMarket,
        amount,
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket1,
        amount.times(premium).div(2),
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket2,
        amount.times(premium).div(2),
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
        amount.times(-1),
      ),
    ]);

    await solo.operation.initiate()
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

    const [
      solidBalances,
      liquidBalances,
    ] = await Promise.all([
      solo.getters.getAccountBalances(solidOwner, solidNumber),
      solo.getters.getAccountBalances(liquidOwner, liquidNumber),
    ]);

    solidBalances.forEach((balance, i) => {
      let expected = INTEGERS.ZERO;
      if (
          i === heldMarket1.toNumber()
          || i === heldMarket2.toNumber()
      ) {
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
    const solidOwner = solo.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
    const heldToken = solo.testing.tokenA;
    const premium = new BigNumber('1.05');

    await Promise.all([
      // issue tokens
      heldToken.issueTo(
        amount.times(2),
        solo.contracts.soloMargin.options.address,
      ),

      // set balances
      solo.testing.setAccountBalance(
        solidOwner,
        solidNumber,
        owedMarket,
        amount,
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        heldMarket,
        amount.times(premium).div(2),
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
        amount.times(-1),
      ),
    ]);

    const { gasUsed } = await solo.operation.initiate()
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

    const [
      solidBalances,
      liquidBalances,
    ] = await Promise.all([
      solo.getters.getAccountBalances(solidOwner, solidNumber),
      solo.getters.getAccountBalances(liquidOwner, liquidNumber),
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
    const solidOwner = solo.getDefaultAccount();
    const liquidOwner = accounts[2];
    expect(solidOwner).not.toEqual(liquidOwner);
    const solidNumber = INTEGERS.ZERO;
    const liquidNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
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
        heldMarket,
        amount.times(collateralization),
      ),
      solo.testing.setAccountBalance(
        liquidOwner,
        liquidNumber,
        owedMarket,
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
      allegedTakerAmount: amount,
      desiredMakerAmount: amount,
    };

    const { gasUsed } = await solo.operation.initiate()
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
    const owner = solo.getDefaultAccount();
    const oneNumber = INTEGERS.ZERO;
    const twoNumber = INTEGERS.ONE;
    const heldMarket = INTEGERS.ZERO;
    const owedMarket = INTEGERS.ONE;
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
        heldMarket,
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
      allegedTakerAmount: amount,
      desiredMakerAmount: amount,
    };

    const { gasUsed } = await solo.operation.initiate()
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
    const txResult = await solo.operation.initiate().deposit(blob).commit();
    const noLogs = solo.logs.parseLogs(txResult, { skipOperationLogs: true });
    const logs = solo.logs.parseLogs(txResult, { skipOperationLogs: false });
    expect(noLogs.length).toEqual(0);
    expect(logs.length).not.toEqual(0);
  });
});

// ============ Helper Functions ============
