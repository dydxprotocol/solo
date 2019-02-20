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
  Liquidate,
  Integer,
} from '../../src/types';

let liquidOwner: address;
let solidOwner: address;
let operator: address;
let solo: Solo;
let accounts: address[];
const liquidAccountNumber = INTEGERS.ZERO;
const solidAccountNumber = INTEGERS.ONE;
const owedMarket = INTEGERS.ZERO;
const heldMarket = INTEGERS.ONE;
const otherMarket = new BigNumber(2);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const wei = new BigNumber(15000);
const negPar = new BigNumber(-10000);
const collateralization = new BigNumber('1.1');
const collatPar = par.times(collateralization);
const premium = new BigNumber('1.05');
const remaining = collateralization.minus(premium);
let defaultGlob: Liquidate;

describe('Liquidate', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    solidOwner = solo.getDefaultAccount();
    liquidOwner = accounts[6];
    operator = accounts[7];
    defaultGlob = {
      primaryAccountOwner: solidOwner,
      primaryAccountId: solidAccountNumber,
      liquidAccountOwner: liquidOwner,
      liquidAccountId: liquidAccountNumber,
      liquidMarketId: owedMarket,
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
      solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, owedMarket, negPar),
      solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, collatPar),
      solo.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic liquidate test', async () => {
    const txResult = await expectLiquidateOkay({});

    console.log(`\tLiquidate gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);

    // TODO: check log
  });

  it('Succeeds when partially liquidating', async () => {
    await expectLiquidateOkay({
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds when bound by owedToken', async () => {
    await expectLiquidateOkay({
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds when bound by heldToken', async () => {
    const amount = par.times(premium).div(2);
    await solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount);
    await expectLiquidateOkay({});

    await Promise.all([
      expectSolidPars(par.times(premium).div(2), par.div(2)),
      expectLiquidPars(zero, negPar.div(2)),
    ]);
  });

  it('Succeeds for solid account that takes on a negative balance', async () => {
    await solo.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par.div(2));
    await expectLiquidateOkay({});
    await Promise.all([
      expectSolidPars(par.times(premium), negPar.div(2)),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds for account already marked with liquidating flag', async () => {
    const amount = par.times(2);
    await Promise.all([
      solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount),
      solo.testing.setAccountStatus(liquidOwner, liquidAccountNumber, AccountStatus.Liquidating),
    ]);
    await expectLiquidateOkay({});
    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(amount.minus(par.times(premium)), zero),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    await solo.testing.setAccountStatus(solidOwner, solidAccountNumber, AccountStatus.Liquidating);
    await expectLiquidateOkay({});
    const status = await solo.getters.getAccountStatus(solidOwner, solidAccountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await solo.permissions.approveOperator(operator, { from: solidOwner });
    await expectLiquidateOkay({}, { from: operator });
    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds for global operator', async () => {
    await solo.admin.setGlobalOperator(operator, true, { from: accounts[0] });
    await expectLiquidateOkay({}, { from: operator });
    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds (without effect) for zero collateral', async () => {
    await expectLiquidateOkay({
      payoutMarketId: otherMarket,
    });
    await Promise.all([
      expectSolidPars(zero, par),
      expectLiquidPars(collatPar, negPar),
    ]);
    const totalOtherPar = await solo.getters.getMarketWithInfo(otherMarket);
    expect(totalOtherPar.market.totalPar.supply).toEqual(zero);
    expect(totalOtherPar.market.totalPar.borrow).toEqual(zero);
  });

  it('Succeeds (without effect) for zero loan', async () => {
    await expectLiquidateOkay({
      liquidMarketId: otherMarket,
    });
    await Promise.all([
      expectSolidPars(zero, par),
      expectLiquidPars(collatPar, negPar),
    ]);
    const totalOtherPar = await solo.getters.getMarketWithInfo(otherMarket);
    expect(totalOtherPar.market.totalPar.supply).toEqual(zero);
    expect(totalOtherPar.market.totalPar.borrow).toEqual(zero);
  });

  it('Fails for over-collateralized account', async () => {
    const amount = par.times(2);
    await solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount);
    await expectLiquidateRevert({}, 'OperationImpl: Unliquidatable account');
  });

  it('Fails for non-operator', async () => {
    await expectLiquidateRevert(
      {},
      'Storage: Unpermissioned Operator',
      { from: operator },
    );
  });

  it('Fails if liquidating after account used as primary', async () => {
    await solo.permissions.approveOperator(solidOwner, { from: liquidOwner });
    const operation = solo.operation.initiate();
    operation.deposit({
      primaryAccountOwner: liquidOwner,
      primaryAccountId: liquidAccountNumber,
      marketId: owedMarket,
      from: liquidOwner,
      amount: {
        value: par.div(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    operation.liquidate(defaultGlob);
    await expectThrow(
      operation.commit(),
      'OperationImpl: Requires non-primary account',
    );
  });

  it('Fails if liquidating totally zero account', async () => {
    await expectLiquidateRevert(
      {
        liquidAccountOwner: liquidOwner,
        liquidAccountId: solidAccountNumber,
      },
      'OperationImpl: Unliquidatable account',
    );
  });

  it('Fails for repeated market', async () => {
    await expectLiquidateRevert(
      { payoutMarketId: owedMarket },
      'OperationImpl: Markets must be distinct',
    );
  });

  it('Fails for negative collateral', async () => {
    await solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, negPar);
    await expectLiquidateRevert(
      {},
      'OperationImpl: Collateral cannot be negative',
    );
  });

  it('Fails for paying back market that is already positive', async () => {
    await Promise.all([
      solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, owedMarket, collatPar),
      solo.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, negPar),
    ]);
    await expectLiquidateRevert(
      {
        payoutMarketId: otherMarket,
      },
      'Storage: Owed balance cannot be positive',
    );
  });

  it('Fails for a negative delta', async () => {
    await expectLiquidateRevert(
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

  it('Fails to liquidate the same account', async () => {
    await expectLiquidateRevert(
      {
        liquidAccountOwner: solidOwner,
        liquidAccountId: solidAccountNumber,
      },
      'OperationImpl: Accounts must be distinct',
    );
  });
});

// ============ Helper Functions ============

async function expectLiquidationFlagSet() {
  const status = await solo.getters.getAccountStatus(liquidOwner, liquidAccountNumber);
  expect(status).toEqual(AccountStatus.Liquidating);
}

async function expectLiquidateOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  const txResult = await solo.operation.initiate().liquidate(combinedGlob).commit(options);
  await expectLiquidationFlagSet();
  return txResult;
}

async function expectLiquidateRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectLiquidateOkay(glob, options), reason);
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

async function expectLiquidPars(
  expectedHeldPar: Integer,
  expectedOwedPar: Integer,
) {
  const balances = await solo.getters.getAccountBalances(liquidOwner, liquidAccountNumber);
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
