import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
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
let solo: Solo;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = new BigNumber(-100);
const negWei = new BigNumber(-150);
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
    await expectBalances(par.times(2), wei.times(2), zero, wei);

    const [
      mIndex,
      cIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(market),
      solo.getters.getMarketCachedIndex(collateralMarket),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(4);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const mIndexLog = logs[1];
    expect(mIndexLog.name).toEqual('LogIndexUpdate');
    expect(mIndexLog.args.market).toEqual(market);
    expect(mIndexLog.args.index).toEqual(mIndex);

    const cIndexLog = logs[2];
    expect(cIndexLog.name).toEqual('LogIndexUpdate');
    expect(cIndexLog.args.market).toEqual(collateralMarket);
    expect(cIndexLog.args.index).toEqual(cIndex);

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

  it('Succeeds for some more specific indexes and values', async () => {
    // TODO
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
  return await solo.testing.tokenA.issueTo(amount, who);
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
  return await solo.operation.initiate().deposit(combinedGlob).commit(options);
}

async function expectDepositRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectDepositOkay(glob, options), reason);
}
