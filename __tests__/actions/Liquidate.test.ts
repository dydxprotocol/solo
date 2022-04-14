import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setGlobalOperator, setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { expectOutOfGasFailure, expectThrow } from '../../src/lib/Expect';
import {
  AccountStatus,
  address,
  AmountDenomination,
  AmountReference,
  ConfirmationType,
  Integer,
  INTEGERS,
  Liquidate,
} from '../../src';
import { TestLiquidationCallback } from '../../build/testing_wrappers/TestLiquidationCallback';
import {
  abi as TestLiquidationCallbackABI,
  bytecode as TestLiquidationCallbackBytecode,
} from '../../build/contracts/TestLiquidationCallback.json';

let liquidOwner: address;
let solidOwner: address;
let operator: address;
let nonOperator: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const liquidAccountNumber = INTEGERS.ZERO;
const solidAccountNumber = INTEGERS.ONE;
const owedMarket = INTEGERS.ZERO;
const heldMarket = INTEGERS.ONE;
const otherMarket = new BigNumber(2);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const wei = new BigNumber(15000);
const negPar = par.times(-1);
const negWei = wei.times(-1);
const collateralization = new BigNumber('1.1');
const collatPar = par.times(collateralization);
const premium = new BigNumber('1.05');
const remaining = collateralization.minus(premium);
let defaultGlob: Liquidate;

describe('Liquidate', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    solidOwner = dolomiteMargin.getDefaultAccount();
    liquidOwner = accounts[6];
    operator = accounts[7];
    nonOperator = accounts[9];
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
    await setGlobalOperator(dolomiteMargin, accounts, solidOwner);
    await setGlobalOperator(dolomiteMargin, accounts, operator);
    await setupMarkets(dolomiteMargin, accounts);
    const defaultIndex = {
      lastUpdate: INTEGERS.ZERO,
      borrow: wei.div(par),
      supply: wei.div(par),
    };
    await Promise.all([
      dolomiteMargin.testing.setMarketIndex(owedMarket, defaultIndex),
      dolomiteMargin.testing.setMarketIndex(heldMarket, defaultIndex),
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, collatPar),
      dolomiteMargin.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic liquidate test', async () => {
    const txResult = await expectLiquidateOkay({});
    console.log(`\tLiquidate gas used: ${txResult.gasUsed}`);
    await Promise.all([expectSolidPars(par.times(premium), zero), expectLiquidPars(par.times(remaining), zero)]);
  });

  it('Succeeds for events', async () => {
    await dolomiteMargin.permissions.approveOperator(operator, { from: solidOwner });
    const txResult = await expectLiquidateOkay({}, { from: operator });
    const [heldIndex, owedIndex, heldOraclePrice, owedOraclePrice] = await Promise.all([
      dolomiteMargin.getters.getMarketCachedIndex(heldMarket),
      dolomiteMargin.getters.getMarketCachedIndex(owedMarket),
      dolomiteMargin.getters.getMarketPrice(heldMarket),
      dolomiteMargin.getters.getMarketPrice(owedMarket),
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult);
    expect(logs.length).toEqual(6);

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

    const owedOraclePriceLog = logs[3];
    expect(owedOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(owedOraclePriceLog.args.market).toEqual(owedMarket);
    expect(owedOraclePriceLog.args.price).toEqual(owedOraclePrice);

    const heldOraclePriceLog = logs[4];
    expect(heldOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(heldOraclePriceLog.args.market).toEqual(heldMarket);
    expect(heldOraclePriceLog.args.price).toEqual(heldOraclePrice);

    const liquidateLog = logs[5];
    expect(liquidateLog.name).toEqual('LogLiquidate');
    expect(liquidateLog.args.solidAccountOwner).toEqual(solidOwner);
    expect(liquidateLog.args.solidAccountNumber).toEqual(solidAccountNumber);
    expect(liquidateLog.args.liquidAccountOwner).toEqual(liquidOwner);
    expect(liquidateLog.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(liquidateLog.args.heldMarket).toEqual(heldMarket);
    expect(liquidateLog.args.owedMarket).toEqual(owedMarket);
    expect(liquidateLog.args.solidHeldUpdate).toEqual({
      newPar: par.times(premium),
      deltaWei: wei.times(premium),
    });
    expect(liquidateLog.args.solidOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: negWei,
    });
    expect(liquidateLog.args.liquidHeldUpdate).toEqual({
      newPar: par.times(remaining),
      deltaWei: negWei.times(premium),
    });
    expect(liquidateLog.args.liquidOwedUpdate).toEqual({
      newPar: zero,
      deltaWei: wei,
    });
  });

  it('Succeeds when partially liquidating', async () => {
    await expectLiquidateOkay({
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([expectSolidPars(par.times(premium), zero), expectLiquidPars(par.times(remaining), zero)]);
  });

  it('Succeeds when liquidating a contract with callback', async () => {
    const shouldRevert = false;
    const shouldRevertWithMessage = false;
    const shouldConsumeTonsOfGas = false;
    const shouldReturnBomb = false;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);

    const txResult = await expectLiquidateOkay({
      liquidAccountOwner: liquidContract.options.address,
      amount: {
        liquidAccountOwner: liquidContract.options.address,
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    console.log(`\tLiquidate with callback success gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackSuccess');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
  });

  it('Succeeds when liquidating a contract with callback fails', async () => {
    const shouldRevert = true;
    const shouldRevertWithMessage = true;
    const shouldConsumeTonsOfGas = false;
    const shouldReturnBomb = false;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.contracts.callContractFunction(
        liquidContract.methods.onLiquidate('0', '0', { sign: true, value: '0' }, '0', { sign: true, value: '0' }),
        { confirmationType: ConfirmationType.Simulate, gas: 6000000 },
      ),
    );

    const txResult = await expectLiquidateOkay({
      liquidAccountOwner: liquidContract.options.address,
      amount: {
        liquidAccountOwner: liquidContract.options.address,
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    console.log(`\tLiquidate with callback reversion with message gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackFailure');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(log.args.reason).toEqual('TestLiquidationCallback: purposeful reversion');
  });

  it('Succeeds when liquidating a contract with callback fails with a cut off message', async () => {
    const shouldRevert = true;
    const shouldRevertWithMessage = true;
    const shouldConsumeTonsOfGas = false;
    const shouldReturnBomb = false;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    // tslint:disable:max-line-length
    const revertMessage =
      'This is a long revert message that will get cut off before the vertical bar character. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur eget tempus nisi, quis volutpat nulla. Proin tempus nisl id rutrum scelerisque. Praesent id magna eget lorem dictum interdum nec ac lorem. Aliquam ornare iaculis lectus ut pellentesque. Maecenas id tellus facilisis est finibus convallis id tempus odio. Sed risus nibh.';
    // tslint:enable:max-line-length
    await liquidContract.methods.setRevertMessage(revertMessage).send({ from: accounts[0], gas: 6000000 });
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.contracts.callContractFunction(
        liquidContract.methods.onLiquidate('0', '0', { sign: true, value: '0' }, '0', { sign: true, value: '0' }),
        { confirmationType: ConfirmationType.Simulate, gas: 6000000 },
      ),
    );

    const txResult = await expectLiquidateOkay({
      liquidAccountOwner: liquidContract.options.address,
      amount: {
        liquidAccountOwner: liquidContract.options.address,
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    console.log(`\tLiquidate with callback reversion with cut off message gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackFailure');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(log.args.reason).toEqual(revertMessage.substring(0, 188));
  });

  it('Succeeds when liquidating a contract with callback fails with no message', async () => {
    const shouldRevert = true;
    const shouldRevertWithMessage = false;
    const shouldConsumeTonsOfGas = false;
    const shouldReturnBomb = false;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.contracts.callContractFunction(
        liquidContract.methods.onLiquidate('0', '0', { sign: true, value: '0' }, '0', { sign: true, value: '0' }),
        { confirmationType: ConfirmationType.Simulate, gas: 6000000 },
      ),
    );

    const txResult = await expectLiquidateOkay({
      liquidAccountOwner: liquidContract.options.address,
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    console.log(`\tLiquidate with callback reversion with no message gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackFailure');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(log.args.reason).toEqual('');
  });

  it('Succeeds when liquidating a contract with callback fails and consumes tons of gas', async () => {
    const shouldRevert = true;
    const shouldRevertWithMessage = false;
    const shouldConsumeTonsOfGas = true;
    const shouldReturnBomb = false;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);
    await expectOutOfGasFailure(
      dolomiteMargin.contracts.callContractFunction(
        liquidContract.methods.onLiquidate('0', '0', { sign: true, value: '0' }, '0', { sign: true, value: '0' }),
        { confirmationType: ConfirmationType.Simulate, gas: 6000000 },
      ),
    );

    const txResult = await expectLiquidateOkay(
      {
        liquidAccountOwner: liquidContract.options.address,
        amount: {
          value: par.times(2),
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      { gas: 6000000 },
    );
    console.log(`\tLiquidate with callback reversion with massive gas consumption gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackFailure');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(log.args.reason).toEqual('');
  });

  it('Succeeds when liquidating a contract with callback succeeds and returns a memory bomb', async () => {
    const shouldRevert = true;
    const shouldRevertWithMessage = false;
    const shouldConsumeTonsOfGas = false;
    const shouldReturnBomb = true;
    const liquidContract = await deployCallbackContract(
      shouldRevert,
      shouldRevertWithMessage,
      shouldConsumeTonsOfGas,
      shouldReturnBomb,
    );
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidContract.options.address, liquidAccountNumber, owedMarket, negPar),
      dolomiteMargin.testing.setAccountBalance(
        liquidContract.options.address,
        liquidAccountNumber,
        heldMarket,
        collatPar,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.contracts.callContractFunction(
        liquidContract.methods.onLiquidate('0', '0', { sign: true, value: '0' }, '0', { sign: true, value: '0' }),
        { confirmationType: ConfirmationType.Simulate, gas: 6000000 },
      ),
    );

    const txResult = await expectLiquidateOkay({
      liquidAccountOwner: liquidContract.options.address,
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });
    console.log(`\tLiquidate with callback success with memory bomb gas used: ${txResult.gasUsed}`);

    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(par.times(remaining), zero, liquidContract.options.address),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult).filter(log => log.name === 'LogLiquidationCallbackFailure');
    expect(logs.length).toEqual(1);
    const log = logs[0];
    expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
    expect(log.args.liquidAccountNumber).toEqual(liquidAccountNumber);
    expect(log.args.reason).toEqual('');
  });

  it('Succeeds when bound by owedToken', async () => {
    await expectLiquidateOkay({
      amount: {
        value: par.times(2),
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([expectSolidPars(par.times(premium), zero), expectLiquidPars(par.times(remaining), zero)]);
  });

  it('Succeeds when bound by heldToken', async () => {
    const amount = par.times(premium).div(2);
    await dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount);
    await expectLiquidateOkay({});

    await Promise.all([expectSolidPars(par.times(premium).div(2), par.div(2)), expectLiquidPars(zero, negPar.div(2))]);
  });

  it('Succeeds for solid account that takes on a negative balance', async () => {
    await dolomiteMargin.testing.setAccountBalance(solidOwner, solidAccountNumber, owedMarket, par.div(2));
    await expectLiquidateOkay({});
    await Promise.all([
      expectSolidPars(par.times(premium), negPar.div(2)),
      expectLiquidPars(par.times(remaining), zero),
    ]);
  });

  it('Succeeds for liquidating twice', async () => {
    const amount = par.times(2);
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount),
      dolomiteMargin.testing.setAccountStatus(liquidOwner, liquidAccountNumber, AccountStatus.Liquidating),
    ]);
    await dolomiteMargin.operation
      .initiate()
      .liquidate({
        ...defaultGlob,
        amount: {
          value: negPar.div(5),
          reference: AmountReference.Target,
          denomination: AmountDenomination.Principal,
        },
      })
      .liquidate(defaultGlob)
      .commit();
    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(amount.minus(par.times(premium)), zero),
    ]);
  });

  it('Succeeds for account already marked with liquidating flag', async () => {
    const amount = par.times(2);
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount),
      dolomiteMargin.testing.setAccountStatus(liquidOwner, liquidAccountNumber, AccountStatus.Liquidating),
    ]);
    await expectLiquidateOkay({});
    await Promise.all([
      expectSolidPars(par.times(premium), zero),
      expectLiquidPars(amount.minus(par.times(premium)), zero),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    await dolomiteMargin.testing.setAccountStatus(solidOwner, solidAccountNumber, AccountStatus.Liquidating);
    await expectLiquidateOkay({});
    const status = await dolomiteMargin.getters.getAccountStatus(solidOwner, solidAccountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await dolomiteMargin.permissions.approveOperator(operator, { from: solidOwner });
    await expectLiquidateOkay({}, { from: operator });
    await Promise.all([expectSolidPars(par.times(premium), zero), expectLiquidPars(par.times(remaining), zero)]);
  });

  it('Succeeds for global operator', async () => {
    await dolomiteMargin.admin.setGlobalOperator(operator, true, { from: accounts[0] });
    await expectLiquidateOkay({}, { from: operator });
    await Promise.all([expectSolidPars(par.times(premium), zero), expectLiquidPars(par.times(remaining), zero)]);
  });

  it('Succeeds (without effect) for zero collateral', async () => {
    await expectLiquidateOkay({
      payoutMarketId: otherMarket,
    });
    await Promise.all([expectSolidPars(zero, par), expectLiquidPars(collatPar, negPar)]);
    const totalOtherPar = await dolomiteMargin.getters.getMarketWithInfo(otherMarket);
    expect(totalOtherPar.market.totalPar.supply).toEqual(zero);
    expect(totalOtherPar.market.totalPar.borrow).toEqual(zero);
  });

  it('Succeeds (without effect) for zero borrow', async () => {
    await expectLiquidateOkay({
      liquidMarketId: otherMarket,
    });
    await Promise.all([expectSolidPars(zero, par), expectLiquidPars(collatPar, negPar)]);
    const totalOtherPar = await dolomiteMargin.getters.getMarketWithInfo(otherMarket);
    expect(totalOtherPar.market.totalPar.supply).toEqual(zero);
    expect(totalOtherPar.market.totalPar.borrow).toEqual(zero);
  });

  it('Fails for over-collateralized account', async () => {
    const amount = par.times(2);
    await dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, amount);
    await expectLiquidateRevert({}, 'LiquidateOrVaporizeImpl: Unliquidatable account');
  });

  it('Fails for non-global operator', async () => {
    await expectLiquidateRevert({}, 'Storage: Unpermissioned global operator', {
      from: nonOperator,
    });
  });

  it('Fails if liquidating after account used as primary', async () => {
    await dolomiteMargin.permissions.approveOperator(solidOwner, { from: liquidOwner });
    const operation = dolomiteMargin.operation.initiate();
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
    await expectThrow(operation.commit(), 'OperationImpl: Requires non-primary account');
  });

  it('Fails if liquidating totally zero account', async () => {
    await expectLiquidateRevert(
      {
        liquidAccountOwner: liquidOwner,
        liquidAccountId: solidAccountNumber,
      },
      'LiquidateOrVaporizeImpl: Unliquidatable account',
    );
  });

  it('Fails for repeated market', async () => {
    await expectLiquidateRevert({ payoutMarketId: owedMarket }, 'OperationImpl: Duplicate markets in action');
  });

  it('Fails for negative collateral', async () => {
    await dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, negPar);
    await expectLiquidateRevert({}, 'LiquidateOrVaporizeImpl: Collateral cannot be negative');
  });

  it('Fails for paying back market that is already positive', async () => {
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, owedMarket, collatPar),
      dolomiteMargin.testing.setAccountBalance(liquidOwner, liquidAccountNumber, heldMarket, negPar),
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
      'OperationImpl: Duplicate accounts in action',
    );
  });
});

// ============ Helper Functions ============

async function deployCallbackContract(
  shouldRevert: boolean,
  shouldRevertWithMessage: boolean,
  shouldConsumeTonsOfGas: boolean,
  shouldReturnBomb: boolean,
): Promise<TestLiquidationCallback> {
  const liquidContract = (await new dolomiteMargin.web3.eth.Contract(TestLiquidationCallbackABI)
    .deploy({
      data: TestLiquidationCallbackBytecode,
      arguments: [
        dolomiteMargin.address,
        shouldRevert,
        shouldRevertWithMessage,
        shouldConsumeTonsOfGas,
        shouldReturnBomb,
      ],
    })
    .send({ from: accounts[0], gas: '6000000' })) as TestLiquidationCallback;

  liquidContract.options.gas = 6000000;
  liquidContract.options.from = accounts[0];
  return liquidContract;
}

async function expectLiquidationFlagSet(liquidAddress: address = liquidOwner) {
  const status = await dolomiteMargin.getters.getAccountStatus(liquidAddress, liquidAccountNumber);
  expect(status).toEqual(AccountStatus.Liquidating);
}

async function expectLiquidateOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  const txResult = await dolomiteMargin.operation
    .initiate()
    .liquidate(combinedGlob)
    .commit(options);
  await expectLiquidationFlagSet(combinedGlob.liquidAccountOwner);
  return txResult;
}

async function expectLiquidateRevert(glob: Object, reason?: string, options?: Object) {
  await expectThrow(expectLiquidateOkay(glob, options), reason);
}

async function expectSolidPars(expectedHeldPar: Integer, expectedOwedPar: Integer) {
  const balances = await dolomiteMargin.getters.getAccountBalances(solidOwner, solidAccountNumber);
  balances.forEach(balance => {
    if (balance.marketId.eq(heldMarket)) {
      expect(balance.par).toEqual(expectedHeldPar);
    } else if (balance.marketId.eq(owedMarket)) {
      expect(balance.par).toEqual(expectedOwedPar);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function expectLiquidPars(
  expectedHeldPar: Integer,
  expectedOwedPar: Integer,
  liquidAddress: address = liquidOwner,
) {
  const balances = await dolomiteMargin.getters.getAccountBalances(liquidAddress, liquidAccountNumber);
  balances.forEach(balance => {
    if (balance.marketId.eq(heldMarket)) {
      expect(balance.par).toEqual(expectedHeldPar);
    } else if (balance.marketId.eq(owedMarket)) {
      expect(balance.par).toEqual(expectedOwedPar);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}
