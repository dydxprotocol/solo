import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import {
  address,
  AccountStatus,
  AmountDenomination,
  AmountReference,
  Integer,
  Withdraw,
} from '../../src/types';

let who: address;
let solo: TestSolo;
let accounts: address[];
let operator: address;
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
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
  soloWei: zero,
};

describe('Withdraw', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    who = solo.getDefaultAccount();
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
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: wei.div(par),
        supply: wei.div(par),
      }),
      solo.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
    cachedWeis.walletWei = zero;
    cachedWeis.soloWei = zero;
  });

  it('Basic withdraw test', async () => {
    await Promise.all([
      issueTokensToSolo(wei),
      setAccountBalance(par.times(2)),
    ]);
    const txResult = await expectWithdrawOkay({});
    await expectBalances(par, wei, wei, zero);
    console.log(`\tWithdraw gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      issueTokensToSolo(wei),
      setAccountBalance(par.times(2)),
      solo.permissions.approveOperator(operator, { from: who }),
    ]);
    const txResult = await expectWithdrawOkay(
      { to: operator },
      { from: operator },
    );

    const [
      marketIndex,
      collateralIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(market),
      solo.getters.getMarketCachedIndex(collateralMarket),
      expectBalances(par, wei, zero, zero, wei),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(4);

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

    const withdrawLog = logs[3];
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
      await Promise.all([
        issueTokensToSolo(wei),
        setAccountBalance(zero),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei, zero);

      // starting positive (>par)
      await Promise.all([
        issueTokensToSolo(wei),
        setAccountBalance(par.times(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(par, wei, wei, zero);

      // starting positive (=par)
      await Promise.all([
        issueTokensToSolo(wei),
        setAccountBalance(par),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, wei, zero);

      // starting positive (<par)
      await Promise.all([
        issueTokensToSolo(wei),
        setAccountBalance(par.div(2)),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar.div(2), negWei.div(2), wei, zero);

      // starting negative
      await Promise.all([
        issueTokensToSolo(wei),
        setAccountBalance(negPar),
      ]);
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

    await issueTokensToSolo(wei);

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
      await Promise.all([
        setAccountBalance(zero),
        issueTokensToSolo(wei),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(negPar, negWei, wei, zero);

      // starting negative (<target)
      await Promise.all([
        setAccountBalance(negPar.div(2)),
        issueTokensToSolo(wei.div(2)),
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
        issueTokensToSolo(wei.times(2)),
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
      await setAccountBalance(zero),
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await Promise.all([
        setAccountBalance(par),
        issueTokensToSolo(wei),
      ]);
      await expectWithdrawOkay(globs[i]);
      await expectBalances(zero, zero, wei, zero);

      // starting negative
      await setAccountBalance(negPar),
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
        issueTokensToSolo(wei),
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
    const expectedWei = par.times(supplyIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToSolo(expectedWei),
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: supplyIndex,
        borrow: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(who, accountNumber, market, par),
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
    const expectedWei = par.times(supplyIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToSolo(expectedWei),
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        supply: supplyIndex,
        borrow: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(who, accountNumber, market, par),
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
    const expectedWei = par.times(borrowIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToSolo(expectedWei),
      solo.testing.setMarketIndex(market, {
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
    const expectedWei = par.times(borrowIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToSolo(expectedWei),
      solo.testing.setMarketIndex(market, {
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
    await Promise.all([
      setAccountBalance(par),
      issueTokensToSolo(wei),
    ]);
    await expectWithdrawOkay({ to: operator });
    await expectBalances(zero, zero, zero, zero, wei);
  });

  it('Succeeds to withdraw to the SoloMargin address', async () => {
    await Promise.all([
      setAccountBalance(par),
      issueTokensToSolo(wei),
    ]);
    await expectWithdrawOkay({ to: solo.contracts.soloMargin.options.address });
    await expectBalances(zero, zero, zero, wei);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      issueTokensToSolo(wei),
      solo.testing.setAccountStatus(who, accountNumber, AccountStatus.Liquidating),
    ]);
    await expectWithdrawOkay({});
    const status = await solo.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([
      issueTokensToSolo(wei),
      solo.permissions.approveOperator(operator),
    ]);
    await expectWithdrawOkay(
      {},
      { from: operator },
    );
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueTokensToSolo(wei),
      solo.permissions.approveOperator(operator),
    ]);
    await expectWithdrawOkay(
      {},
      { from: operator },
    );
  });

  it('Fails for non-operator', async () => {
    await issueTokensToSolo(wei);
    await expectWithdrawRevert(
      {},
      'Storage: Unpermissioned operator',
      { from: operator },
    );
  });

  it('Fails if withdrawing more tokens than exist', async () => {
    await expectWithdrawRevert(
      {},
      'Token: Transfer failed',
    );
  });
});

// ============ Helper Functions ============

async function setAccountBalance(amount: BigNumber) {
  return solo.testing.setAccountBalance(who, accountNumber, market, amount);
}

async function issueTokensToSolo(amount: BigNumber) {
  return solo.testing.tokenA.issueTo(amount, solo.contracts.soloMargin.options.address);
}

async function expectBalances(
  expectedPar: Integer,
  expectedWei: Integer,
  walletWei: Integer,
  soloWei: Integer,
  operatorWei: Integer = zero,
) {
  const [
    accountBalances,
    soloTokenBalance,
    walletTokenBalance,
    operatorTokenBalance,
  ] = await Promise.all([
    solo.getters.getAccountBalances(who, accountNumber),
    solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
    solo.testing.tokenA.getBalance(who),
    solo.testing.tokenA.getBalance(operator),
  ]);
  accountBalances.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: expectedPar, wei: expectedWei };
    } else if (i === collateralMarket.toNumber()) {
      expected = {
        par: collateralAmount,
        wei: collateralAmount,
      };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
  expect(walletTokenBalance.minus(cachedWeis.walletWei)).toEqual(walletWei);
  expect(soloTokenBalance.minus(cachedWeis.soloWei)).toEqual(soloWei);
  cachedWeis.walletWei = walletTokenBalance;
  cachedWeis.soloWei = soloTokenBalance;
  expect(operatorTokenBalance).toEqual(operatorWei);
}

async function expectWithdrawOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return solo.operation.initiate().withdraw(combinedGlob).commit(options);
}

async function expectWithdrawRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectWithdrawOkay(glob, options), reason);
}
