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
  Deposit,
  Integer,
} from '../../src/types';

let who: address;
let operator: address;
let solo: TestSolo;
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
  soloWei: zero,
};
const defaultIndex = {
  lastUpdate: INTEGERS.ZERO,
  borrow: wei.div(par),
  supply: wei.div(par),
};

describe('Deposit', () => {
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
      from: who,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setMarketIndex(market, defaultIndex),
      solo.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
      solo.testing.tokenA.setMaximumSoloAllowance(who),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
    cachedWeis.walletWei = zero;
    cachedWeis.soloWei = zero;
  });

  it('Basic deposit test', async () => {
    await issueTokensToUser(wei);
    const txResult = await expectDepositOkay({});
    await expectBalances(par, wei, zero, wei);
    console.log(`\tDeposit gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      solo.testing.tokenA.issueTo(wei, operator),
      solo.testing.tokenA.setMaximumSoloAllowance(operator),
      solo.permissions.approveOperator(operator, { from: who }),
      solo.testing.setAccountBalance(who, accountNumber, market, par),
    ]);
    const txResult = await expectDepositOkay(
      { from: operator },
      { from: operator },
    );

    const [
      marketIndex,
      collateralIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(market),
      solo.getters.getMarketCachedIndex(collateralMarket),
      expectBalances(par.times(2), wei.times(2), zero, wei),
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

    const depositLog = logs[3];
    expect(depositLog.name).toEqual('LogDeposit');
    expect(depositLog.args.accountOwner).toEqual(who);
    expect(depositLog.args.accountNumber).toEqual(accountNumber);
    expect(depositLog.args.market).toEqual(market);
    expect(depositLog.args.update).toEqual({ newPar: par.times(2), deltaWei: wei });
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
      await Promise.all([
        setAccountBalance(zero),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive
      await Promise.all([
        setAccountBalance(par),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), zero, wei);

      // starting negative (>par)
      await Promise.all([
        setAccountBalance(negPar.times(2)),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative (=par)
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);

      // starting negative (<par)
      await Promise.all([
        setAccountBalance(negPar.div(2)),
        issueTokensToUser(wei),
      ]);
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
      await Promise.all([
        setAccountBalance(zero),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive (<target)
      await Promise.all([
        setAccountBalance(par.div(2)),
        issueTokensToUser(wei.div(2)),
      ]);
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
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei.times(2)),
      ]);
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
      await setAccountBalance(zero),
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par),
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei),
      ]);
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
      await Promise.all([
        setAccountBalance(negPar.times(2)),
        issueTokensToUser(wei),
      ]);
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
      solo.testing.setMarketIndex(market, {
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
      solo.testing.setMarketIndex(market, {
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
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: borrowIndex,
        supply: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(who, accountNumber, market, negPar),
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
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: borrowIndex,
        supply: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(who, accountNumber, market, negPar),
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
      solo.testing.setAccountStatus(who, accountNumber, AccountStatus.Liquidating),
    ]);
    await expectDepositOkay({});
    const status = await solo.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([
      issueTokensToUser(wei),
      solo.permissions.approveOperator(operator),
    ]);
    await expectDepositOkay({}, { from: operator });
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueTokensToUser(wei),
      solo.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
    ]);
    await expectDepositOkay({}, { from: operator });
  });

  it('Fails for non-operator', async () => {
    await issueTokensToUser(wei);
    await expectDepositRevert(
      {},
      'Storage: Unpermissioned operator',
      { from: operator },
    );
  });

  it('Fails for from random address', async () => {
    await expectDepositRevert(
      { from: operator },
      'OperationImpl: Invalid deposit source',
    );
  });

  it('Fails if depositing more tokens than owned', async () => {
    const glob = {
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };
    await expectDepositRevert(glob, 'Token: TransferFrom failed');
  });
});

// ============ Helper Functions ============

async function setAccountBalance(amount: BigNumber) {
  return solo.testing.setAccountBalance(who, accountNumber, market, amount);
}

async function issueTokensToUser(amount: BigNumber) {
  return solo.testing.tokenA.issueTo(amount, who);
}

async function expectBalances(
  expectedPar: Integer,
  expectedWei: Integer,
  walletWei: Integer,
  soloWei: Integer,
) {
  const [
    accountBalances,
    walletTokenBalance,
    soloTokenBalance,
  ] = await Promise.all([
    solo.getters.getAccountBalances(who, accountNumber),
    solo.testing.tokenA.getBalance(who),
    solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
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
}

async function expectDepositOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return solo.operation.initiate().deposit(combinedGlob).commit(options);
}

async function expectDepositRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectDepositOkay(glob, options), reason);
}
