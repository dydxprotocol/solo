import BigNumber from 'bignumber.js';
import { AccountStatus, address, AmountDenomination, AmountReference, Deposit, Integer, INTEGERS } from '../../src';
import { expectThrow } from '../../src/lib/Expect';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { resetEVM, snapshot } from '../helpers/EVM';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';

let who: address;
let operator: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = par.times(-1);
const negWei = wei.times(-1);
let defaultGlob: Deposit;
const CANNOT_DEPOSIT_NEGATIVE = 'Exchange: Cannot transferIn negative';
const cachedWeis = {
  walletWei: zero,
  dolomiteMarginWei: zero,
};
const defaultIndex = {
  lastUpdate: INTEGERS.ZERO,
  borrow: wei.div(par),
  supply: wei.div(par),
};

describe('Deposit', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    who = dolomiteMargin.getDefaultAccount();
    operator = accounts[6];
    defaultGlob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      marketId: market,
      from: who,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.setMarketIndex(market, defaultIndex),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(who),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
    cachedWeis.walletWei = zero;
    cachedWeis.dolomiteMarginWei = zero;
  });

  it('Basic deposit test', async () => {
    await issueTokensToUser(wei);
    const txResult = await expectDepositOkay({});
    await expectBalances(par, wei, zero, wei);
    console.log(`\tDeposit gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(wei, operator),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(operator),
      dolomiteMargin.permissions.approveOperator(operator, { from: who }),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, par),
    ]);
    const txResult = await expectDepositOkay({ from: operator }, { from: operator });

    const [marketIndex, collateralIndex, marketOraclePrice, collateralOraclePrice] = await Promise.all([
      dolomiteMargin.getters.getMarketCachedIndex(market),
      dolomiteMargin.getters.getMarketCachedIndex(collateralMarket),
      dolomiteMargin.getters.getMarketPrice(market),
      dolomiteMargin.getters.getMarketPrice(collateralMarket),
      expectBalances(par.times(2), wei.times(2), zero, wei),
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

    const depositLog = logs[5];
    expect(depositLog.name).toEqual('LogDeposit');
    expect(depositLog.args.accountOwner).toEqual(who);
    expect(depositLog.args.accountNumber).toEqual(accountNumber);
    expect(depositLog.args.market).toEqual(market);
    expect(depositLog.args.update).toEqual({
      newPar: par.times(2),
      deltaWei: wei,
    });
    expect(depositLog.args.from).toEqual(operator);
  });

  it('Succeeds for positive delta par/wei', async () => {
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

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([setAccountBalance(zero), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive
      await Promise.all([setAccountBalance(par), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), zero, wei);

      // starting negative (>par)
      await Promise.all([setAccountBalance(negPar.times(2)), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative (=par)
      await Promise.all([setAccountBalance(negPar), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);

      // starting negative (<par)
      await Promise.all([setAccountBalance(negPar.div(2)), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.div(2), wei.div(2), zero, wei);
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
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting negative
      await setAccountBalance(negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);
    }
  });

  it('Fails for negative delta par/wei', async () => {
    const reason = CANNOT_DEPOSIT_NEGATIVE;
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

    await issueTokensToUser(wei);

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectDepositRevert(globs[i], reason);

      // starting positive
      await setAccountBalance(par);
      await expectDepositRevert(globs[i], reason);

      // starting negative
      await setAccountBalance(negPar);
      await expectDepositRevert(globs[i], reason);
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
      await Promise.all([setAccountBalance(zero), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive (<target)
      await Promise.all([setAccountBalance(par.div(2)), issueTokensToUser(wei.div(2))]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.div(2));

      // starting positive (=target)
      await setAccountBalance(par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive (>target)
      await setAccountBalance(par.times(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([setAccountBalance(negPar), issueTokensToUser(wei.times(2))]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.times(2));
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
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([setAccountBalance(negPar), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);
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
      await setAccountBalance(zero);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative (<target)
      await Promise.all([setAccountBalance(negPar.times(2)), issueTokensToUser(wei)]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative (=target)
      await setAccountBalance(negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative (>target)
      await setAccountBalance(negPar.div(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting positive
      await setAccountBalance(par);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);
    }
  });

  it('Succeeds for lending in par', async () => {
    const supplyIndex = new BigNumber('3.99');
    const expectedWei = par.times(supplyIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToUser(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: INTEGERS.ONE,
        supply: supplyIndex,
      }),
    ]);
    await expectDepositOkay({
      amount: {
        value: par,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(par, expectedWei, zero, expectedWei);
  });

  it('Succeeds for lending in wei', async () => {
    const supplyIndex = new BigNumber('3.99');
    const expectedWei = par.times(supplyIndex).integerValue(BigNumber.ROUND_DOWN);
    await Promise.all([
      issueTokensToUser(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: INTEGERS.ONE,
        supply: supplyIndex,
      }),
    ]);
    await expectDepositOkay({
      amount: {
        value: expectedWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(par, expectedWei, zero, expectedWei);
  });

  it('Succeeds for repaying in par', async () => {
    const borrowIndex = new BigNumber('1.99');
    const expectedWei = par.times(borrowIndex).integerValue(BigNumber.ROUND_UP);
    await Promise.all([
      issueTokensToUser(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: borrowIndex,
        supply: INTEGERS.ONE,
      }),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, negPar),
    ]);
    await expectDepositOkay({
      amount: {
        value: par,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(zero, zero, zero, expectedWei);
  });

  it('Succeeds for repaying in wei', async () => {
    const borrowIndex = new BigNumber('1.99');
    const expectedWei = par.times(borrowIndex).integerValue(BigNumber.ROUND_UP);
    await Promise.all([
      issueTokensToUser(expectedWei),
      dolomiteMargin.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: borrowIndex,
        supply: INTEGERS.ONE,
      }),
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, negPar),
    ]);
    await expectDepositOkay({
      amount: {
        value: expectedWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await expectBalances(zero, zero, zero, expectedWei);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      issueTokensToUser(wei),
      dolomiteMargin.testing.setAccountStatus(who, accountNumber, AccountStatus.Liquidating),
    ]);
    await expectDepositOkay({});
    const status = await dolomiteMargin.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([issueTokensToUser(wei), dolomiteMargin.permissions.approveOperator(operator)]);
    await expectDepositOkay({}, { from: operator });
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueTokensToUser(wei),
      dolomiteMargin.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
    ]);
    await expectDepositOkay({}, { from: operator });
  });

  it('Fails for non-operator', async () => {
    await issueTokensToUser(wei);
    await expectDepositRevert({}, 'Storage: Unpermissioned operator', {
      from: operator,
    });
  });

  it('Fails for from random address', async () => {
    await expectDepositRevert({ from: operator }, 'OperationImpl: Invalid deposit source');
  });

  it('Fails if depositing more tokens than owned', async () => {
    const glob = {
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };
    await expectDepositRevert(glob, 'Token: transferFrom failed');
  });
});

// ============ Helper Functions ============

async function setAccountBalance(amount: BigNumber) {
  return dolomiteMargin.testing.setAccountBalance(who, accountNumber, market, amount);
}

async function issueTokensToUser(amount: BigNumber) {
  return dolomiteMargin.testing.tokenA.issueTo(amount, who);
}

async function expectBalances(
  expectedPar: Integer,
  expectedWei: Integer,
  walletWei: Integer,
  dolomiteMarginWei: Integer,
) {
  const [accountBalances, walletTokenBalance, dolomiteMarginTokenBalance] = await Promise.all([
    dolomiteMargin.getters.getAccountBalances(who, accountNumber),
    dolomiteMargin.testing.tokenA.getBalance(who),
    dolomiteMargin.testing.tokenA.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
  ]);
  accountBalances.forEach(balance => {
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
}

async function expectDepositOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return dolomiteMargin.operation
    .initiate()
    .deposit(combinedGlob)
    .commit(options);
}

async function expectDepositRevert(glob: Object, reason?: string, options?: Object) {
  await expectThrow(expectDepositOkay(glob, options), reason);
}
