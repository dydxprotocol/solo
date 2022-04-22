import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { expectThrow } from '../../src/lib/Expect';
import { AccountStatus, address, AmountDenomination, AmountReference, Integer, INTEGERS, Withdraw } from '../../src';

let who: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let admin: address;
let operator: address;
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const otherMarket = new BigNumber(1);
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = par.times(-1);
const negWei = wei.times(-1);
let defaultGlob: Withdraw;
const CANNOT_WITHDRAW_POSITIVE = 'Exchange: Cannot transferOut positive';
const cachedWeis = {
  walletWei: zero,
  dolomiteMarginWei: zero,
};

describe('Withdraw', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    who = dolomiteMargin.getDefaultAccount();
    admin = accounts[0];
    operator = accounts[6];
    defaultGlob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      marketId: market,
      to: who,
      amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: wei.div(par),
        supply: wei.div(par),
      }),
      dolomiteMargin.testing.setAccountBalance(
        who,
        accountNumber,
        collateralMarket,
        collateralAmount,
      ),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
    cachedWeis.walletWei = zero;
    cachedWeis.dolomiteMarginWei = zero;
  });

  it('Basic withdraw test', async () => {
    await Promise.all([
      issueTokensToDolomiteMargin(wei),
      setAccountBalance(par.times(2)),
    ]);
    const txResult = await expectWithdrawOkay({});
    await expectBalances(par, wei, wei, zero);
    console.log(`\tWithdraw gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      issueTokensToDolomiteMargin(wei),
      setAccountBalance(par.times(2)),
      dolomiteMargin.permissions.approveOperator(operator, { from: who }),
    ]);
    const txResult = await expectWithdrawOkay(
      { to: operator },
      { from: operator },
    );

    const [marketIndex, collateralIndex, marketOraclePrice, collateralOraclePrice] = await Promise.all([
      dolomiteMargin.getters.getMarketCachedIndex(market),
      dolomiteMargin.getters.getMarketCachedIndex(collateralMarket),
      dolomiteMargin.getters.getMarketPrice(market),
      dolomiteMargin.getters.getMarketPrice(collateralMarket),
      expectBalances(par, wei, zero, zero, wei),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult);
    expect(logs.length).toEqual(6);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const marketIndexLog = logs[1];
    expect(marketIndexLog.name).toEqual('LogIndexUpdate');
    expect(marketIndexLog.args.market).toEqual(market);
    expect(marketIndexLog.args.index).toEqual(marketIndex);

    const collateralIndexLog = logs[2];
    expect(collateralIndexLog.name).toEqual('LogIndexUpdate');
    expect(collateralIndexLog.args.market).toEqual(collateralMarket);
    expect(collateralIndexLog.args.index).toEqual(collateralIndex);

    const marketOraclePriceLog = logs[3];
    expect(marketOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(marketOraclePriceLog.args.market).toEqual(market);
    expect(marketOraclePriceLog.args.price).toEqual(marketOraclePrice);

    const collateralOraclePriceLog = logs[4];
    expect(collateralOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(collateralOraclePriceLog.args.market).toEqual(collateralMarket);
    expect(collateralOraclePriceLog.args.price).toEqual(collateralOraclePrice);

    const withdrawLog = logs[5];
    expect(withdrawLog.name).toEqual('LogWithdraw');
    expect(withdrawLog.args.accountOwner).toEqual(who);
    expect(withdrawLog.args.accountNumber).toEqual(accountNumber);
    expect(withdrawLog.args.market).toEqual(market);
    expect(withdrawLog.args.update).toEqual({ newPar: par, deltaWei: negWei });
    expect(withdrawLog.args.to).toEqual(operator);
  });

  it('Succeeds for negative delta par/wei', async () => {
    const globs = [
      {
        amount: {
          value: negPar,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: negWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([issueTokensToDolomiteMargin(wei), setAccountBalance(zero)]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei, zero);

      // starting positive (>par)
      await Promise.all([
        issueTokensToDolomiteMargin(wei),
        setAccountBalance(par.times(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(par, wei, wei, zero);

      // starting positive (=par)
      await Promise.all([issueTokensToDolomiteMargin(wei), setAccountBalance(par)]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, wei, zero);

      // starting positive (<par)
      await Promise.all([
        issueTokensToDolomiteMargin(wei),
        setAccountBalance(par.div(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar.div(2), negWei.div(2), wei, zero);

      // starting negative
      await Promise.all([issueTokensToDolomiteMargin(wei), setAccountBalance(negPar)]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar.times(2), negWei.times(2), wei, zero);
    }
  });

  it('Succeeds for zero delta par/wei', async () => {
    const globs = [
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting negative
      await setAccountBalance(negPar);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);
    }
  });

  it('Fails for positive delta par/wei', async () => {
    const reason = CANNOT_WITHDRAW_POSITIVE;
    const globs = [
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    await issueTokensToDolomiteMargin(wei);

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectWithdrawRevert(globs[i], reason);

      // starting positive
      await setAccountBalance(par);
      await expectWithdrawRevert(globs[i], reason);

      // starting negative
      await setAccountBalance(negPar);
      await expectWithdrawRevert(globs[i], reason);
    }
  });

  it('Mixed for negative target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: negPar,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: negWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([setAccountBalance(zero), issueTokensToDolomiteMargin(wei)]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei, zero);

      // starting negative (<target)
      await Promise.all([
        setAccountBalance(negPar.div(2)),
        issueTokensToDolomiteMargin(wei.div(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei.div(2), zero);

      // starting negative (=target)
      await setAccountBalance(negPar);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative (>target)
      await setAccountBalance(negPar.times(2));
      await expectWithdrawRevert(globs[i], CANNOT_WITHDRAW_POSITIVE);

      // starting positive
      await Promise.all([
        setAccountBalance(par),
        issueTokensToDolomiteMargin(wei.times(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei.times(2), zero);
    }
  });

  it('Mixed for zero target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await Promise.all([setAccountBalance(par), issueTokensToDolomiteMargin(wei)]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, wei, zero);

      // starting negative
      await setAccountBalance(negPar);
      await expectWithdrawRevert(globs[i], CANNOT_WITHDRAW_POSITIVE);
    }
  });

  it('Mixed for positive target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectWithdrawRevert(globs[i], CANNOT_WITHDRAW_POSITIVE);

      // starting positive (<target)
      await Promise.all([
        setAccountBalance(par.times(2)),
        issueTokensToDolomiteMargin(wei),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(par, wei, wei, zero);

      // starting positive (=target)
      await setAccountBalance(par);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive (>target)
      await setAccountBalance(par.div(2));
      await expectWithdrawRevert(globs[i], CANNOT_WITHDRAW_POSITIVE);

      // starting negative
      await setAccountBalance(negPar);
      await expectWithdrawRevert(globs[i], CANNOT_WITHDRAW_POSITIVE);
    }
  });

  it('Succeeds for withdrawing in par', async () => {
    const supplyIndex = new BigNumber('1.99');
    const expectedWei = par
      .times(supplyIndex)
      .integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToDolomiteMargin(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: supplyIndex,
        borrow: INTEGERS.ONE,
      }),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, par),
    ]);
    await expectWithdrawOkay({
      amount: {
        value: negPar,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(zero, zero, expectedWei, zero);
  });

  it('Succeeds for withdrawing in wei', async () => {
    const supplyIndex = new BigNumber('1.99');
    const expectedWei = par
      .times(supplyIndex)
      .integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToDolomiteMargin(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: supplyIndex,
        borrow: INTEGERS.ONE,
      }),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, par),
    ]);
    await expectWithdrawOkay({
      amount: {
        value: expectedWei.times(-1),
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(zero, zero, expectedWei, zero);
  });

  it('Succeeds for borrowing in par', async () => {
    const borrowIndex = new BigNumber('3.99');
    const expectedWei = par
      .times(borrowIndex)
      .integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToDolomiteMargin(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: INTEGERS.ONE,
        borrow: borrowIndex,
      }),
    ]);
    await expectWithdrawOkay({
      amount: {
        value: negPar,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(negPar, expectedWei.times(-1), expectedWei, zero);
  });

  it('Succeeds for borrowing in wei', async () => {
    const borrowIndex = new BigNumber('3.99');
    const expectedWei = par
      .times(borrowIndex)
      .integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToDolomiteMargin(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: INTEGERS.ONE,
        borrow: borrowIndex,
      }),
    ]);
    await expectWithdrawOkay({
      amount: {
        value: expectedWei.times(-1),
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(negPar, expectedWei.times(-1), expectedWei, zero);
  });

  it('Succeeds to withdraw to an external address', async () => {
    await Promise.all([setAccountBalance(par), issueTokensToDolomiteMargin(wei)]);
    await expectWithdrawOkay({ to: operator });
    await expectBalances(zero, zero, zero, zero, wei);
  });

  it('Succeeds to withdraw to the DolomiteMargin address', async () => {
    await Promise.all([setAccountBalance(par), issueTokensToDolomiteMargin(wei)]);
    await expectWithdrawOkay({ to: dolomiteMargin.address });
    await expectBalances(zero, zero, zero, wei);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      issueTokensToDolomiteMargin(wei),
      dolomiteMargin.testing.setAccountStatus(
        who,
        accountNumber,
        AccountStatus.Liquidating,
      ),
    ]);
    await expectWithdrawOkay({});
    const status = await dolomiteMargin.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([
      issueTokensToDolomiteMargin(wei),
      dolomiteMargin.permissions.approveOperator(operator),
    ]);
    await expectWithdrawOkay({}, { from: operator });
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueTokensToDolomiteMargin(wei),
      dolomiteMargin.permissions.approveOperator(operator),
    ]);
    await expectWithdrawOkay({}, { from: operator });
  });

  it('Fails for non-operator', async () => {
    await issueTokensToDolomiteMargin(wei);
    await expectWithdrawRevert({}, 'Storage: Unpermissioned operator', {
      from: operator,
    });
  });

  it('Fails if withdrawing more tokens than exist', async () => {
    await expectWithdrawRevert({}, 'Token: transfer failed');
  });

  it('Fails if the user has too many non-zero balances and has debt', async () => {
    await issueTokensToDolomiteMargin(wei);
    await dolomiteMargin.testing.setAccountBalance(who, accountNumber, otherMarket, wei);
    await dolomiteMargin.admin.setAccountMaxNumberOfMarketsWithBalances(2, { from: admin });
    await expectWithdrawRevert(
      {},
      `OperationImpl: Too many non-zero balances <${defaultGlob.primaryAccountOwner.toLowerCase()}, ${defaultGlob.primaryAccountId.toString()}>`,
    );
  });
});

// ============ Helper Functions ============

async function setAccountBalance(amount: BigNumber) {
  return dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, amount);
}

async function issueTokensToDolomiteMargin(amount: BigNumber) {
  return dolomiteMargin.testing.tokenA.issueTo(
    amount,
    dolomiteMargin.address,
  );
}

async function expectBalances(
  expectedPar: Integer,
  expectedWei: Integer,
  walletWei: Integer,
  dolomiteMarginWei: Integer,
  operatorWei: Integer = zero,
) {
  const [
    accountBalances,
    dolomiteMarginTokenBalance,
    walletTokenBalance,
    operatorTokenBalance,
  ] = await Promise.all([
    dolomiteMargin.getters.getAccountBalances(who, accountNumber),
    dolomiteMargin.testing.tokenA.getBalance(dolomiteMargin.address),
    dolomiteMargin.testing.tokenA.getBalance(who),
    dolomiteMargin.testing.tokenA.getBalance(operator),
  ]);
  accountBalances.forEach((balance) => {
    let expected = { par: zero, wei: zero };
    if (balance.marketId.eq(market)) {
      expected = { par: expectedPar, wei: expectedWei };
    } else if (balance.marketId.eq(collateralMarket)) {
      expected = {
        par: collateralAmount,
        wei: collateralAmount,
      };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
  expect(walletTokenBalance.minus(cachedWeis.walletWei)).toEqual(walletWei);
  expect(dolomiteMarginTokenBalance.minus(cachedWeis.dolomiteMarginWei)).toEqual(dolomiteMarginWei);
  cachedWeis.walletWei = walletTokenBalance;
  cachedWeis.dolomiteMarginWei = dolomiteMarginTokenBalance;
  expect(operatorTokenBalance).toEqual(operatorWei);
}

async function expectWithdrawOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return dolomiteMargin.operation
    .initiate()
    .withdraw(combinedGlob)
    .commit(options);
}

async function expectWithdrawRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectWithdrawOkay(glob, options), reason);
}
