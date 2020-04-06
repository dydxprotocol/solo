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
  Transfer,
} from '../../src/types';

let owner1: address;
let owner2: address;
let admin: address;
let operator: address;
const accountNumber1 = new BigNumber(133);
const accountNumber2 = new BigNumber(244);
let solo: TestSolo;
let accounts: address[];
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = par.times(-1);
const negWei = wei.times(-1);
let defaultGlob: Transfer;

describe('Transfer', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = accounts[5];
    owner2 = accounts[6];
    operator = solo.getDefaultAccount();
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      toAccountOwner: owner2,
      toAccountId: accountNumber2,
      marketId: market,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: new BigNumber(1.5),
        supply: new BigNumber(1.5),
      }),
      solo.permissions.approveOperator(operator, { from: owner1 }),
      solo.permissions.approveOperator(operator, { from: owner2 }),
      solo.testing.setAccountBalance(owner1, accountNumber1, collateralMarket, collateralAmount),
      solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic transfer test', async () => {
    const fullAmount = new BigNumber(100);
    const halfAmount = new BigNumber(50);

    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: INTEGERS.ONE,
        supply: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(
        owner1,
        accountNumber1,
        market,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        owner2,
        accountNumber2,
        market,
        fullAmount,
      ),
    ]);

    const txResult = await expectTransferOkay({
      amount: {
        value: halfAmount,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    await expectBalances(
      fullAmount.plus(halfAmount),
      fullAmount.plus(halfAmount),
      fullAmount.minus(halfAmount),
      fullAmount.minus(halfAmount),
    );

    console.log(`\tTransfer gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for events', async () => {
    await solo.admin.setGlobalOperator(operator, true, { from: admin });

    const txResult = await expectTransferOkay(
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
      { from: operator },
    );

    const [
      marketIndex,
      collateralIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(market),
      solo.getters.getMarketCachedIndex(collateralMarket),
      expectBalances(par, wei, negPar, negWei),
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

    const transferLog = logs[3];
    expect(transferLog.name).toEqual('LogTransfer');
    expect(transferLog.args.accountOneOwner).toEqual(owner1);
    expect(transferLog.args.accountOneNumber).toEqual(accountNumber1);
    expect(transferLog.args.accountTwoOwner).toEqual(owner2);
    expect(transferLog.args.accountTwoNumber).toEqual(accountNumber2);
    expect(transferLog.args.market).toEqual(market);
    expect(transferLog.args.updateOne).toEqual({ newPar: par, deltaWei: wei });
    expect(transferLog.args.updateTwo).toEqual({ newPar: negPar, deltaWei: negWei });
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting negative (>par)
      await setAccountBalances(negPar.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, negPar, negWei);

      // starting negative (=par)
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, negPar, negWei);

      // starting negative (<par)
      await setAccountBalances(negPar.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par.div(2), wei.div(2), negPar, negWei);

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), negPar, negWei);
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalances(par, negPar);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting negative
      await setAccountBalances(negPar, par);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);
    }
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);

      // starting positive (>par)
      await setAccountBalances(par.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, par, wei);

      // starting positive (=par)
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, par, wei);

      // starting positive (<par)
      await setAccountBalances(par.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar.div(2), negWei.div(2), par, wei);

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar.times(2), negWei.times(2), par, wei);
    }
  });

  it('Succeeds for positive target par/wei', async () => {
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting positive (>par)
      await setAccountBalances(par.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, par, wei);

      // starting positive (=par)
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive (<par)
      await setAccountBalances(par.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar.div(2), negWei.div(2));

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar.times(2), negWei.times(2));
    }
  });

  it('Succeeds for zero target par/wei', async () => {
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, negPar, negWei);

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, par, wei);
    }
  });

  it('Succeeds for negative target par/wei', async () => {
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
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);

      // starting negative (>par)
      await setAccountBalances(negPar.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, negPar, negWei);

      // starting negative (=par)
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative (<par)
      await setAccountBalances(negPar.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par.div(2), wei.div(2));

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par.times(2), wei.times(2));
    }
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      solo.testing.setAccountStatus(owner1, accountNumber1, AccountStatus.Liquidating),
      solo.testing.setAccountStatus(owner2, accountNumber2, AccountStatus.Liquidating),
    ]);
    await expectTransferOkay({});
    const [
      status1,
      status2,
    ] = await Promise.all([
      solo.getters.getAccountStatus(owner1, accountNumber1),
      solo.getters.getAccountStatus(owner2, accountNumber2),
    ]);
    expect(status1).toEqual(AccountStatus.Normal);
    expect(status2).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      solo.permissions.disapproveOperator(operator, { from: owner1 }),
      solo.permissions.disapproveOperator(operator, { from: owner2 }),
      solo.admin.setGlobalOperator(operator, true, { from: admin }),
    ]);
    await expectTransferOkay({});
  });

  it('Succeeds for owner of both accounts', async () => {
    await expectTransferOkay({
      toAccountOwner: owner1,
    });
  });

  it('Fails for non-operator on first account', async () => {
    await solo.permissions.disapproveOperator(operator, { from: owner1 });
    await expectTransferRevert(
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      'Storage: Unpermissioned operator',
    );
  });

  it('Fails for non-operator on second account', async () => {
    await solo.permissions.disapproveOperator(operator, { from: owner2 });
    await expectTransferRevert(
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      'Storage: Unpermissioned operator',
    );
  });

  it('Fails to transfer to same account', async () => {
    await expectTransferRevert(
      {
        toAccountOwner: owner1,
        toAccountId: accountNumber1,
      },
      'OperationImpl: Duplicate accounts in action',
    );
  });
});

// ============ Helper Functions ============

async function setAccountBalances(amount1: BigNumber, amount2: BigNumber) {
  await Promise.all([
    solo.testing.setAccountBalance(owner1, accountNumber1, market, amount1),
    solo.testing.setAccountBalance(owner2, accountNumber2, market, amount2),
  ]);
}

async function expectBalances(
  par1: Integer,
  wei1: Integer,
  par2: Integer,
  wei2: Integer,
) {
  const [
    accountBalances1,
    accountBalances2,
  ] = await Promise.all([
    solo.getters.getAccountBalances(owner1, accountNumber1),
    solo.getters.getAccountBalances(owner2, accountNumber2),
  ]);
  accountBalances1.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: par1, wei: wei1 };
    } else if (i === collateralMarket.toNumber()) {
      expected = { par: collateralAmount, wei: collateralAmount };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
  accountBalances2.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: par2, wei: wei2 };
    } else if (i === collateralMarket.toNumber()) {
      expected = { par: collateralAmount, wei: collateralAmount };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
}

async function expectTransferOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return solo.operation.initiate().transfer(combinedGlob).commit(options);
}

async function expectTransferRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectTransferOkay(glob, options), reason);
}
