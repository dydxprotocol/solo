import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import {
  AccountStatus,
  address,
  AmountDenomination,
  AmountReference,
  Vaporize,
  Integer,
} from '../../src/types';

let vaporOwner: address;
let solidOwner: address;
let operator: address;
let solo: Solo;
let accounts: address[];
const vaporAccountNumber = INTEGERS.ZERO;
const solidAccountNumber = INTEGERS.ONE;
const owedMarket = INTEGERS.ZERO;
const heldMarket = INTEGERS.ONE;
const otherMarket = new BigNumber(2);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const wei = new BigNumber(15000);
const negPar = par.times(-1);
const negWei = wei.times(-1);
const premium = new BigNumber('1.05');
let defaultGlob: Vaporize;

describe('Vaporize', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    solidOwner = solo.getDefaultAccount();
    vaporOwner = accounts[6];
    operator = accounts[7];
    defaultGlob = {
      primaryAccountOwner: solidOwner,
      primaryAccountId: solidAccountNumber,
      vaporAccountOwner: vaporOwner,
      vaporAccountId: vaporAccountNumber,
      vaporMarketId: owedMarket,
      payoutMarketId: heldMarket,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    const defaultIndex = {
      lastUpdate: INTEGERS.ZERO,
      borrow: wei.div(par),
      supply: wei.div(par),
    };
    await Promise.all([
      solo.testing.setMarketIndex(owedMarket, defaultIndex),
      solo.testing.setMarketIndex(heldMarket, defaultIndex),
      solo.testing.setAccountBalance(vaporOwner, vaporAccountNumber, owedMarket, negPar),
      solo.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic vaporize test', async () => {
    await issueHeldTokensToSolo(wei.times(premium));
    await expectExcessHeldToken(wei.times(premium));
    const txResult = await expectVaporizeOkay({});
    console.log(`\tVaporize gas used: ${txResult.gasUsed}`);
    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      issueHeldTokensToSolo(wei.times(premium)),
      solo.permissions.approveOperator(operator, { from: solidOwner }),
    ]);
    const txResult = await expectVaporizeOkay(
      {},
      { from: operator },
    );
    const [
      heldIndex,
      owedIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(heldMarket),
      solo.getters.getMarketCachedIndex(owedMarket),
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(4);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const owedIndexLog = logs[1];
    expect(owedIndexLog.name).toEqual('LogIndexUpdate');
    expect(owedIndexLog.args.market).toEqual(owedMarket);
    expect(owedIndexLog.args.index).toEqual(owedIndex);

    const heldIndexLog = logs[2];
    expect(heldIndexLog.name).toEqual('LogIndexUpdate');
    expect(heldIndexLog.args.market).toEqual(heldMarket);
    expect(heldIndexLog.args.index).toEqual(heldIndex);

    const vaporizeLog = logs[3];
    expect(vaporizeLog.name).toEqual('LogVaporize');
    expect(vaporizeLog.args.solidAccountOwner).toEqual(solidOwner);
    expect(vaporizeLog.args.solidAccountNumber).toEqual(solidAccountNumber);
    expect(vaporizeLog.args.vaporAccountOwner).toEqual(vaporOwner);
    expect(vaporizeLog.args.vaporAccountNumber).toEqual(vaporAccountNumber);
    expect(vaporizeLog.args.heldMarket).toEqual(heldMarket);
    expect(vaporizeLog.args.owedMarket).toEqual(owedMarket);
    expect(vaporizeLog.args.solidHeldUpdate).toEqual({
      newPar: par.times(premium),
      deltaWei: wei.times(premium),
    });
    expect(vaporizeLog.args.solidOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: negWei,
    });
    expect(vaporizeLog.args.vaporOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: wei,
    });
  });

  it('Fails for unvaporizable account', async () => {
    await solo.testing.setAccountBalance(vaporOwner, vaporAccountNumber, heldMarket, par);
    await expectVaporizeRevert({}, 'OperationImpl: Unvaporizable account');
  });

  it('Succeeds if enough excess owedTokens', async () => {
    await issueOwedTokensToSolo(wei);
    await expectExcessOwedToken(wei);

    const txResult = await expectVaporizeOkay({});

    const [
      heldIndex,
      owedIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(heldMarket),
      solo.getters.getMarketCachedIndex(owedMarket),
      expectExcessOwedToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(zero, par),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(4);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(solidOwner);

    const owedIndexLog = logs[1];
    expect(owedIndexLog.name).toEqual('LogIndexUpdate');
    expect(owedIndexLog.args.market).toEqual(owedMarket);
    expect(owedIndexLog.args.index).toEqual(owedIndex);

    const heldIndexLog = logs[2];
    expect(heldIndexLog.name).toEqual('LogIndexUpdate');
    expect(heldIndexLog.args.market).toEqual(heldMarket);
    expect(heldIndexLog.args.index).toEqual(heldIndex);

    const vaporizeLog = logs[3];
    expect(vaporizeLog.name).toEqual('LogVaporize');
    expect(vaporizeLog.args.solidAccountOwner).toEqual(solidOwner);
    expect(vaporizeLog.args.solidAccountNumber).toEqual(solidAccountNumber);
    expect(vaporizeLog.args.vaporAccountOwner).toEqual(vaporOwner);
    expect(vaporizeLog.args.vaporAccountNumber).toEqual(vaporAccountNumber);
    expect(vaporizeLog.args.heldMarket).toEqual(heldMarket);
    expect(vaporizeLog.args.owedMarket).toEqual(owedMarket);
    expect(vaporizeLog.args.solidHeldUpdate).toEqual({
      newPar: zero,
      deltaWei: zero,
    });
    expect(vaporizeLog.args.solidOwedUpdate).toEqual({
      newPar: par,
      deltaWei: zero,
    });
    expect(vaporizeLog.args.vaporOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: wei,
    });
  });

  it('Succeeds if half excess owedTokens', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      issueOwedTokensToSolo(wei.div(2)),
    ]);

    const txResult = await expectVaporizeOkay({});

    const [
      heldIndex,
      owedIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(heldMarket),
      solo.getters.getMarketCachedIndex(owedMarket),
      expectExcessHeldToken(payoutAmount.div(2)),
      expectExcessOwedToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium).div(2), par.div(2)),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(4);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(solidOwner);

    const owedIndexLog = logs[1];
    expect(owedIndexLog.name).toEqual('LogIndexUpdate');
    expect(owedIndexLog.args.market).toEqual(owedMarket);
    expect(owedIndexLog.args.index).toEqual(owedIndex);

    const heldIndexLog = logs[2];
    expect(heldIndexLog.name).toEqual('LogIndexUpdate');
    expect(heldIndexLog.args.market).toEqual(heldMarket);
    expect(heldIndexLog.args.index).toEqual(heldIndex);

    const vaporizeLog = logs[3];
    expect(vaporizeLog.name).toEqual('LogVaporize');
    expect(vaporizeLog.args.solidAccountOwner).toEqual(solidOwner);
    expect(vaporizeLog.args.solidAccountNumber).toEqual(solidAccountNumber);
    expect(vaporizeLog.args.vaporAccountOwner).toEqual(vaporOwner);
    expect(vaporizeLog.args.vaporAccountNumber).toEqual(vaporAccountNumber);
    expect(vaporizeLog.args.heldMarket).toEqual(heldMarket);
    expect(vaporizeLog.args.owedMarket).toEqual(owedMarket);
    expect(vaporizeLog.args.solidHeldUpdate).toEqual({
      newPar: par.times(premium).div(2),
      deltaWei: wei.times(premium).div(2),
    });
    expect(vaporizeLog.args.solidOwedUpdate).toEqual({
      newPar: par.div(2),
      deltaWei: negWei.div(2),
    });
    expect(vaporizeLog.args.vaporOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: wei,
    });
  });

  it('Succeeds when bound by owedToken', async () => {
    const payoutAmount = wei.times(premium);
    await issueHeldTokensToSolo(payoutAmount.times(2));

    await expectVaporizeOkay({
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([
      expectExcessHeldToken(payoutAmount),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds when bound by heldToken', async () => {
    const payoutAmount = wei.times(premium).div(2);
    await issueHeldTokensToSolo(payoutAmount);

    await expectVaporizeOkay({});

    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, negPar.div(2)),
      expectSolidPars(par.times(premium).div(2), par.div(2)),
    ]);
  });

  it('Succeeds for account already marked with liquidating flag', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.testing.setAccountStatus(vaporOwner, vaporAccountNumber, AccountStatus.Liquidating),
    ]);

    await expectVaporizeOkay({});

    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds for account already marked with vaporizing flag', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.testing.setAccountStatus(vaporOwner, vaporAccountNumber, AccountStatus.Vaporizing),
    ]);

    await expectVaporizeOkay({});

    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds for solid account that takes on a negative balance', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par.div(2)),
      // need another positive balance so there is zero (or negative) excess owedToken
      solo.testing.setAccountBalance(operator, solidAccountNumber, owedMarket, par),
    ]);
    await expectVaporizeOkay({});
    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), negPar.div(2)),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.testing.setAccountStatus(solidOwner, solidAccountNumber, AccountStatus.Liquidating),
    ]);
    await expectVaporizeOkay({});
    const status = await solo.getters.getAccountStatus(solidOwner, solidAccountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.permissions.approveOperator(operator, { from: solidOwner }),
    ]);
    await expectVaporizeOkay({}, { from: operator });
    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds for global operator', async () => {
    const payoutAmount = wei.times(premium);
    await Promise.all([
      issueHeldTokensToSolo(payoutAmount),
      solo.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
    ]);
    await expectVaporizeOkay({}, { from: operator });
    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, zero),
      expectSolidPars(par.times(premium), zero),
    ]);
  });

  it('Succeeds (without effect) for zero excess', async () => {
    await expectExcessHeldToken(zero);
    await expectVaporizeOkay({});
    await Promise.all([
      expectExcessHeldToken(zero),
      expectVaporPars(zero, negPar),
      expectSolidPars(zero, par),
    ]);
  });

  it('Succeeds (without effect) for zero loan', async () => {
    const payoutAmount = wei.times(premium);
    await issueHeldTokensToSolo(payoutAmount);
    await expectVaporizeOkay({
      vaporMarketId: otherMarket,
    });
    await Promise.all([
      expectExcessHeldToken(payoutAmount),
      expectVaporPars(zero, negPar),
      expectSolidPars(zero, par),
    ]);
  });

  it('Fails for non-operator', async () => {
    const payoutAmount = wei.times(premium);
    await issueHeldTokensToSolo(payoutAmount);
    await expectVaporizeRevert(
      {},
      'Storage: Unpermissioned operator',
      { from: operator },
    );
  });

  it('Fails if vaporizing after account used as primary', async () => {
    await solo.permissions.approveOperator(solidOwner, { from: vaporOwner });
    const operation = solo.operation.initiate();
    operation.deposit({
      primaryAccountOwner: vaporOwner,
      primaryAccountId: vaporAccountNumber,
      marketId: owedMarket,
      from: vaporOwner,
      amount: {
        value: par.div(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    operation.vaporize(defaultGlob);
    await expectThrow(
      operation.commit(),
      'OperationImpl: Requires non-primary account',
    );
  });

  it('Fails if vaporizing totally zero account', async () => {
    await expectVaporizeRevert(
      {
        vaporAccountOwner: operator,
        vaporAccountId: zero,
      },
      'OperationImpl: Unvaporizable account',
    );
  });

  it('Fails for repeated market', async () => {
    await expectVaporizeRevert(
      { payoutMarketId: owedMarket },
      'OperationImpl: Duplicate markets in action',
    );
  });

  it('Fails for negative excess heldTokens', async () => {
    await solo.testing.setAccountBalance(solidOwner, solidAccountNumber, heldMarket, par);
    await expectExcessHeldToken(negWei);
    await expectVaporizeRevert({}, 'OperationImpl: Excess cannot be negative');
  });

  it('Fails for a negative delta', async () => {
    await expectVaporizeRevert(
      {
        amount: {
          value: negPar.times(2),
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      'Storage: Owed balance cannot increase',
    );
  });

  it('Fails to vaporize the same account', async () => {
    await expectVaporizeRevert(
      {
        vaporAccountOwner: solidOwner,
        vaporAccountId: solidAccountNumber,
      },
      'OperationImpl: Duplicate accounts in action',
    );
  });
});

// ============ Helper Functions ============

async function issueHeldTokensToSolo(amount: BigNumber) {
  return await solo.testing.tokenB.issueTo(amount, solo.contracts.soloMargin.options.address);
}

async function issueOwedTokensToSolo(amount: BigNumber) {
  return await solo.testing.tokenA.issueTo(amount, solo.contracts.soloMargin.options.address);
}

async function expectVaporizeOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().vaporize(combinedGlob).commit(options);
}

async function expectVaporizeRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectVaporizeOkay(glob, options), reason);
}

async function expectSolidPars(
  expectedHeldPar: Integer,
  expectedOwedPar: Integer,
) {
  const balances = await solo.getters.getAccountBalances(solidOwner, solidAccountNumber);
  balances.forEach((balance, i) => {
    if (i === heldMarket.toNumber()) {
      expect(balance.par).toEqual(expectedHeldPar);
    } else if (i === owedMarket.toNumber()) {
      expect(balance.par).toEqual(expectedOwedPar);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function expectVaporPars(
  expectedHeldPar: Integer,
  expectedOwedPar: Integer,
) {
  const balances = await solo.getters.getAccountBalances(vaporOwner, vaporAccountNumber);
  balances.forEach((balance, i) => {
    if (i === heldMarket.toNumber()) {
      expect(balance.par).toEqual(expectedHeldPar);
    } else if (i === owedMarket.toNumber()) {
      expect(balance.par).toEqual(expectedOwedPar);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function expectExcessHeldToken(
  expected: Integer,
) {
  const actual = await solo.getters.getNumExcessTokens(heldMarket);
  expect(actual).toEqual(expected);
}

async function expectExcessOwedToken(
  expected: Integer,
) {
  const actual = await solo.getters.getNumExcessTokens(owedMarket);
  expect(actual).toEqual(expected);
}
