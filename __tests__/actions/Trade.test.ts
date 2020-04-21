import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { toBytes } from '../../src/lib/BytesHelper';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import {
  address,
  AccountStatus,
  AmountDenomination,
  AmountReference,
  Balance,
  Trade,
  Integer,
} from '../../src/types';

let who1: address;
let who2: address;
let operator: address;
let solo: TestSolo;
let accounts: address[];
const accountNumber1 = new BigNumber(111);
const accountNumber2 = new BigNumber(222);
const collateralMkt = new BigNumber(0);
const inputMkt = new BigNumber(1);
const outputMkt = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = par.times(-1);
const negWei = wei.times(-1);
let defaultGlob: Trade;
const defaultData = {
  value: wei,
  denomination: AmountDenomination.Actual,
  reference: AmountReference.Delta,
};
const zeroGlob = { amount: {
  value: zero,
  denomination: AmountDenomination.Principal,
  reference: AmountReference.Delta,
} };

const tradeId = new BigNumber(1234);

describe('Trade', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    who1 = solo.getDefaultAccount();
    who2 = accounts[5];
    operator = accounts[6];
    defaultGlob = {
      primaryAccountOwner: who1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: who2,
      otherAccountId: accountNumber2,
      inputMarketId: inputMkt,
      outputMarketId: outputMkt,
      autoTrader: solo.testing.autoTrader.getAddress(),
      data: toBytes(tradeId),
      amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
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
      solo.testing.setMarketIndex(inputMkt, defaultIndex),
      solo.testing.setMarketIndex(outputMkt, defaultIndex),
      solo.testing.setAccountBalance(who1, accountNumber1, collateralMkt, collateralAmount),
      solo.testing.setAccountBalance(who2, accountNumber2, collateralMkt, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic trade test', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
    ]);
    const txResult = await expectTradeOkay({});
    console.log(`\tTrade gas used: ${txResult.gasUsed}`);
    await Promise.all([
      expectBalances1(par, negPar),
      expectBalances2(negPar, par),
    ]);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      solo.permissions.approveOperator(operator, { from: who1 }),
      approveTrader(),
      setTradeData(),
    ]);
    const txResult = await expectTradeOkay(
      {},
      { from: operator },
    );

    const [
      inputIndex,
      outputIndex,
      collateralIndex,
    ] = await Promise.all([
      solo.getters.getMarketCachedIndex(inputMkt),
      solo.getters.getMarketCachedIndex(outputMkt),
      solo.getters.getMarketCachedIndex(collateralMkt),
      expectBalances1(par, negPar),
      expectBalances2(negPar, par),
    ]);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(5);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const inputIndexLog = logs[1];
    expect(inputIndexLog.name).toEqual('LogIndexUpdate');
    expect(inputIndexLog.args.market).toEqual(inputMkt);
    expect(inputIndexLog.args.index).toEqual(inputIndex);

    const outputIndexLog = logs[2];
    expect(outputIndexLog.name).toEqual('LogIndexUpdate');
    expect(outputIndexLog.args.market).toEqual(outputMkt);
    expect(outputIndexLog.args.index).toEqual(outputIndex);

    const collateralIndexLog = logs[3];
    expect(collateralIndexLog.name).toEqual('LogIndexUpdate');
    expect(collateralIndexLog.args.market).toEqual(collateralMkt);
    expect(collateralIndexLog.args.index).toEqual(collateralIndex);

    const tradeLog = logs[4];
    expect(tradeLog.name).toEqual('LogTrade');
    expect(tradeLog.args.takerAccountOwner).toEqual(who1);
    expect(tradeLog.args.takerAccountNumber).toEqual(accountNumber1);
    expect(tradeLog.args.makerAccountOwner).toEqual(who2);
    expect(tradeLog.args.makerAccountNumber).toEqual(accountNumber2);
    expect(tradeLog.args.inputMarket).toEqual(inputMkt);
    expect(tradeLog.args.outputMarket).toEqual(outputMkt);
    expect(tradeLog.args.takerInputUpdate).toEqual({ newPar: par, deltaWei: wei });
    expect(tradeLog.args.takerOutputUpdate).toEqual({ newPar: negPar, deltaWei: negWei });
    expect(tradeLog.args.makerInputUpdate).toEqual({ newPar: negPar, deltaWei: negWei });
    expect(tradeLog.args.makerOutputUpdate).toEqual({ newPar: par, deltaWei: wei });
    expect(tradeLog.args.autoTrader).toEqual(solo.testing.autoTrader.getAddress());
  });

  it('Succeeds for positive delta par/wei', async () => {
    await approveTrader();
    const globs = [
      { amount: {
        value: par,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      } },
      { amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      } },
    ];

    // test input (output will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar, zero),
        expectBalances2(par, zero),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar, zero),
        expectBalances2(par.times(2), par),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar, zero),
        expectBalances2(zero, negPar),
      ]);
    }

    // test output (input will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar),
        expectBalances2(zero, par),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar),
        expectBalances2(par, par.times(2)),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar),
        expectBalances2(negPar, zero),
      ]);
    }
  });

  it('Succeeds for negative delta par/wei', async () => {
    await approveTrader();
    const globs = [
      { amount: {
        value: negPar,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      } },
      { amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      } },
    ];

    // test input (output will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par, zero),
        expectBalances2(negPar, zero),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par, zero),
        expectBalances2(zero, par),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par, zero),
        expectBalances2(negPar.times(2), negPar),
      ]);
    }

    // test output (input will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par),
        expectBalances2(zero, negPar),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par),
        expectBalances2(par, zero),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par),
        expectBalances2(negPar, negPar.times(2)),
      ]);
    }
  });

  it('Succeeds for positive target par/wei', async () => {
    await approveTrader();
    const globs = [
      { amount: {
        value: par,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      } },
      { amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Target,
      } },
    ];

    // test input (output will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar, zero),
        expectBalances2(par, zero),
      ]);

      // starting positive (<target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par.div(2), par.div(2)),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar.div(2), zero),
        expectBalances2(par, par.div(2)),
      ]);

      // starting positive (=target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(zero, zero),
        expectBalances2(par, par),
      ]);

      // starting positive (>target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par.times(2), par.times(2)),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par, zero),
        expectBalances2(par, par.times(2)),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar.times(2), zero),
        expectBalances2(par, negPar),
      ]);
    }

    // test output (input will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar),
        expectBalances2(zero, par),
      ]);

      // starting positive (<target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par.div(2), par.div(2)),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar.div(2)),
        expectBalances2(par.div(2), par),
      ]);

      // starting positive (=target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, zero),
        expectBalances2(par, par),
      ]);

      // starting positive (>target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par.times(2), par.times(2)),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par),
        expectBalances2(par.times(2), par),
      ]);

      // starting negative
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar.times(2)),
        expectBalances2(negPar, par),
      ]);
    }
  });

  it('Succeeds for negative target par/wei', async () => {
    await approveTrader();
    const globs = [
      { amount: {
        value: negPar,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      } },
      { amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Target,
      } },
    ];

    // test input (output will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par, zero),
        expectBalances2(negPar, zero),
      ]);

      // starting negative (<target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar.div(2), negPar.div(2)),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par.div(2), zero),
        expectBalances2(negPar, negPar.div(2)),
      ]);

      // starting negative (=target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(zero, zero),
        expectBalances2(negPar, negPar),
      ]);

      // starting negative (>target)
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(negPar.times(2), negPar.times(2)),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(negPar, zero),
        expectBalances2(negPar, negPar.times(2)),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(zeroGlob.amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(par.times(2), zero),
        expectBalances2(negPar, par),
      ]);
    }

    // test output (input will be zero)
    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par),
        expectBalances2(zero, negPar),
      ]);

      // starting negative (<target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar.div(2), negPar.div(2)),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par.div(2)),
        expectBalances2(negPar.div(2), negPar),
      ]);

      // starting negative (=target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar, negPar),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, zero),
        expectBalances2(negPar, negPar),
      ]);

      // starting negative (>target)
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(negPar.times(2), negPar.times(2)),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, negPar),
        expectBalances2(negPar.times(2), negPar),
      ]);

      // starting positive
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(zero, zero),
        setBalances2(par, par),
      ]);
      await expectTradeOkay(zeroGlob);
      await Promise.all([
        expectBalances1(zero, par.times(2)),
        expectBalances2(par, negPar),
      ]);
    }
  });

  it('Succeeds for zero target par/wei', async () => {
    await approveTrader();
    const globs = [
      { amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      } },
      { amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Target,
      } },
    ];

    const start1 = par.div(2);
    const start2 = negPar.div(2);

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(start1, start2),
        setBalances2(zero, zero),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(start1, start2),
        expectBalances2(zero, zero),
      ]);

      // starting positive/negative
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(start1, start2),
        setBalances2(par, negPar),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(start1.plus(par), start2.plus(negPar)),
        expectBalances2(zero, zero),
      ]);

      // starting negative/positive
      await Promise.all([
        setTradeData(globs[i].amount),
        setBalances1(start1, start2),
        setBalances2(negPar, par),
      ]);
      await expectTradeOkay(globs[i]);
      await Promise.all([
        expectBalances1(start1.plus(negPar), start2.plus(par)),
        expectBalances2(zero, zero),
      ]);
    }
  });

  it('Succeeds for zero input and output', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: zero }),
    ]);
    await expectTradeOkay({
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await Promise.all([
      expectBalances1(zero, zero),
      expectBalances2(zero, zero),
    ]);
  });

  it('Succeeds for zero input amount (positive output)', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: wei }),
    ]);
    await expectTradeOkay({
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await Promise.all([
      expectBalances1(zero, negPar),
      expectBalances2(zero, par),
    ]);
  });

  it('Succeeds for zero input amount (negative output)', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: negWei }),
    ]);
    await expectTradeOkay({
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await Promise.all([
      expectBalances1(zero, par),
      expectBalances2(zero, negPar),
    ]);
  });

  it('Succeeds for zero output amount (positive input)', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: zero }),
    ]);
    await expectTradeOkay({
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await Promise.all([
      expectBalances1(negPar, zero),
      expectBalances2(par, zero),
    ]);
  });

  it('Succeeds for zero output amount (negative input)', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: zero }),
    ]);
    await expectTradeOkay({
      amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });
    await Promise.all([
      expectBalances1(par, zero),
      expectBalances2(negPar, zero),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      solo.testing.setAccountStatus(who1, accountNumber1, AccountStatus.Liquidating),
      solo.testing.setAccountStatus(who2, accountNumber2, AccountStatus.Liquidating),
      approveTrader(),
      setTradeData(),
    ]);
    await expectTradeOkay({});
    const [
      status1,
      status2,
    ] = await Promise.all([
      solo.getters.getAccountStatus(who1, accountNumber1),
      solo.getters.getAccountStatus(who2, accountNumber2),
    ]);
    expect(status1).toEqual(AccountStatus.Normal);
    expect(status2).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator sender', async () => {
    await Promise.all([
      approveTrader(),
      approveOperator(),
      setTradeData(),
    ]);
    await expectTradeOkay({}, { from: operator });
    await Promise.all([
      expectBalances1(par, negPar),
      expectBalances2(negPar, par),
    ]);
  });

  it('Succeeds for global operator sender', async () => {
    await Promise.all([
      approveTrader(),
      solo.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
      setTradeData(),
    ]);
    await expectTradeOkay({}, { from: operator });
    await Promise.all([
      expectBalances1(par, negPar),
      expectBalances2(negPar, par),
    ]);
  });

  it('Verifies input market', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireInputMarketId(outputMkt),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: input market mismatch');
    await solo.testing.autoTrader.setRequireInputMarketId(inputMkt);
    await expectTradeOkay({});
  });

  it('Verifies output market', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireOutputMarketId(inputMkt),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: output market mismatch');
    await solo.testing.autoTrader.setRequireOutputMarketId(outputMkt);
    await expectTradeOkay({});
  });

  it('Verifies maker account', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireMakerAccount(who1, accountNumber2),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: maker account owner mismatch');
    await solo.testing.autoTrader.setRequireMakerAccount(who2, accountNumber1);
    await expectTradeRevert({}, 'TestAutoTrader: maker account number mismatch');
    await solo.testing.autoTrader.setRequireMakerAccount(who2, accountNumber2);
    await expectTradeOkay({});
  });

  it('Verifies taker account', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireTakerAccount(who2, accountNumber1),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: taker account owner mismatch');
    await solo.testing.autoTrader.setRequireTakerAccount(who1, accountNumber2);
    await expectTradeRevert({}, 'TestAutoTrader: taker account number mismatch');
    await solo.testing.autoTrader.setRequireTakerAccount(who1, accountNumber1);
    await expectTradeOkay({});
  });

  it('Verifies old input par', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      setBalances2(par, zero),
      solo.testing.autoTrader.setRequireOldInputPar(par.times(-1)),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: oldInputPar sign mismatch');
    await solo.testing.autoTrader.setRequireOldInputPar(par.times(2));
    await expectTradeRevert({}, 'TestAutoTrader: oldInputPar value mismatch');
    await solo.testing.autoTrader.setRequireOldInputPar(par);
    await expectTradeOkay({});
  });

  it('Verifies new input par', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireNewInputPar(negPar.times(-1)),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: newInputPar sign mismatch');
    await solo.testing.autoTrader.setRequireNewInputPar(negPar.times(2));
    await expectTradeRevert({}, 'TestAutoTrader: newInputPar value mismatch');
    await solo.testing.autoTrader.setRequireNewInputPar(negPar);
    await expectTradeOkay({});
  });

  it('Verifies input wei', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
      solo.testing.autoTrader.setRequireInputWei(negWei.times(-1)),
    ]);
    await expectTradeRevert({}, 'TestAutoTrader: inputWei sign mismatch');
    await solo.testing.autoTrader.setRequireInputWei(negWei.times(2));
    await expectTradeRevert({}, 'TestAutoTrader: inputWei value mismatch');
    await solo.testing.autoTrader.setRequireInputWei(negWei);
    await expectTradeOkay({});
  });

  it('Fails for non-operator sender', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData(),
    ]);
    await expectTradeRevert(
      {},
      'Storage: Unpermissioned operator',
      { from: operator },
    );
  });

  it('Fails for non-operator autoTrader', async () => {
    await Promise.all([
      approveOperator(),
      setTradeData(),
    ]);
    await expectTradeRevert({}, 'Storage: Unpermissioned operator');
  });

  it('Fails for wrong-contract autoTrader', async () => {
    const otherContract = solo.testing.exchangeWrapper.getAddress();
    await solo.permissions.approveOperator(otherContract, { from: who1 });
    await expectTradeRevert({ autoTrader: otherContract });
  });

  it('Fails for one-sided trades', async () => {
    await Promise.all([
      approveTrader(),
      setTradeData({ value: negWei }),
    ]);
    await expectTradeRevert({}, 'OperationImpl: Trades cannot be one-sided');
  });

  it('Fails to trade to same account', async () => {
    await expectTradeRevert(
      {
        otherAccountOwner: who1,
        otherAccountId: accountNumber1,
      },
      'OperationImpl: Duplicate accounts in action',
    );
  });
});

// ============ Helper Functions ============

async function setBalances1(inputPar: Integer, outputPar: Integer) {
  return Promise.all([
    solo.testing.setAccountBalance(who1, accountNumber1, inputMkt, inputPar),
    solo.testing.setAccountBalance(who1, accountNumber1, outputMkt, outputPar),
  ]);
}

async function setBalances2(inputPar: Integer, outputPar: Integer) {
  return Promise.all([
    solo.testing.setAccountBalance(who2, accountNumber2, inputMkt, inputPar),
    solo.testing.setAccountBalance(who2, accountNumber2, outputMkt, outputPar),
  ]);
}

async function setTradeData(
  data?: object,
) {
  const combinedData = { ...defaultData, ...data };
  return solo.testing.autoTrader.setData(tradeId, combinedData);
}

async function expectBalances1(
  expectedInputPar: Integer,
  expectedOutputPar: Integer,
) {
  const balances = await solo.getters.getAccountBalances(who1, accountNumber1);
  expectBalances(balances, expectedInputPar, expectedOutputPar);
}

async function expectBalances2(
  expectedInputPar: Integer,
  expectedOutputPar: Integer,
) {
  const balances = await solo.getters.getAccountBalances(who2, accountNumber2);
  expectBalances(balances, expectedInputPar, expectedOutputPar);
}

function expectBalances(
  balances: Balance[],
  expectedInputPar: Integer,
  expectedOutputPar: Integer,
) {
  balances.forEach((balance, i) => {
    if (i === inputMkt.toNumber()) {
      expect(balance.par).toEqual(expectedInputPar);
    } else if (i === outputMkt.toNumber()) {
      expect(balance.par).toEqual(expectedOutputPar);
    } else if (i === collateralMkt.toNumber()) {
      expect(balance.par).toEqual(collateralAmount);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function approveTrader() {
  return solo.permissions.approveOperator(solo.testing.autoTrader.getAddress(), { from: who2 });
}

async function approveOperator() {
  return solo.permissions.approveOperator(operator, { from: who1 });
}

async function expectTradeOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return solo.operation.initiate().trade(combinedGlob).commit(options);
}

async function expectTradeRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectTradeOkay(glob, options), reason);
}
