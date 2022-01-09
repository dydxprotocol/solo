import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';
import { expectThrow } from '../../src/lib/Expect';
import { TestToken } from '../modules/TestToken';
import {
  AccountStatus,
  address,
  AmountDenomination,
  AmountReference,
  Integer,
  Sell,
} from '../../src/types';

let who: address;
let operator: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const makerMarket = INTEGERS.ZERO;
const takerMarket = INTEGERS.ONE;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const makerPar = new BigNumber(100);
const makerWei = new BigNumber(150);
const takerPar = new BigNumber(200);
const takerWei = new BigNumber(300);
let makerToken: TestToken;
let takerToken: TestToken;
let defaultGlob: Sell;
let testOrder: TestOrder;
let EXCHANGE_ADDRESS: string;

describe('Sell', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    EXCHANGE_ADDRESS = dolomiteMargin.testing.exchangeWrapper.getExchangeAddress();
    accounts = r.accounts;
    who = dolomiteMargin.getDefaultAccount();
    operator = accounts[6];
    makerToken = dolomiteMargin.testing.tokenA;
    takerToken = dolomiteMargin.testing.tokenB;
    testOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: dolomiteMargin.testing.exchangeWrapper.getAddress(),
      originator: who,
      makerToken: makerToken.getAddress(),
      takerToken: takerToken.getAddress(),
      makerAmount: makerWei,
      takerAmount: takerWei,
      allegedTakerAmount: takerWei,
      desiredMakerAmount: makerWei,
    };
    defaultGlob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      takerMarketId: takerMarket,
      makerMarketId: makerMarket,
      order: testOrder,
      amount: {
        value: takerWei.times(-1),
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    const defaultIndex = {
      lastUpdate: INTEGERS.ZERO,
      borrow: takerWei.div(takerPar),
      supply: takerWei.div(takerPar),
    };
    await Promise.all([
      dolomiteMargin.testing.setMarketIndex(makerMarket, defaultIndex),
      dolomiteMargin.testing.setMarketIndex(takerMarket, defaultIndex),
      dolomiteMargin.testing.setAccountBalance(
        who,
        accountNumber,
        collateralMarket,
        collateralAmount,
      ),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(who),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic sell test', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    const txResult = await expectSellOkay({});
    console.log(`\tSell gas used: ${txResult.gasUsed}`);
    await Promise.all([
      await expectPars(makerPar, zero),
      await expectDolomiteMarginBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Succeeds for events', async () => {
    await Promise.all([
      dolomiteMargin.permissions.approveOperator(operator, { from: who }),
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    const txResult = await expectSellOkay({}, { from: operator });
    const [makerIndex, takerIndex, collateralIndex] = await Promise.all([
      dolomiteMargin.getters.getMarketCachedIndex(makerMarket),
      dolomiteMargin.getters.getMarketCachedIndex(takerMarket),
      dolomiteMargin.getters.getMarketCachedIndex(collateralMarket),
      expectPars(makerPar, zero),
      expectDolomiteMarginBalances(makerWei, zero),
      expectWrapperBalances(zero, zero),
      expectExchangeBalances(zero, takerWei),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult);
    expect(logs.length).toEqual(5);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const takerIndexLog = logs[1];
    expect(takerIndexLog.name).toEqual('LogIndexUpdate');
    expect(takerIndexLog.args.market).toEqual(takerMarket);
    expect(takerIndexLog.args.index).toEqual(takerIndex);

    const makerIndexLog = logs[2];
    expect(makerIndexLog.name).toEqual('LogIndexUpdate');
    expect(makerIndexLog.args.market).toEqual(makerMarket);
    expect(makerIndexLog.args.index).toEqual(makerIndex);

    const collateralIndexLog = logs[3];
    expect(collateralIndexLog.name).toEqual('LogIndexUpdate');
    expect(collateralIndexLog.args.market).toEqual(collateralMarket);
    expect(collateralIndexLog.args.index).toEqual(collateralIndex);

    const sellLog = logs[4];
    expect(sellLog.name).toEqual('LogSell');
    expect(sellLog.args.accountOwner).toEqual(who);
    expect(sellLog.args.accountNumber).toEqual(accountNumber);
    expect(sellLog.args.takerMarket).toEqual(takerMarket);
    expect(sellLog.args.makerMarket).toEqual(makerMarket);
    expect(sellLog.args.takerUpdate).toEqual({
      newPar: zero,
      deltaWei: takerWei.times(-1),
    });
    expect(sellLog.args.makerUpdate).toEqual({
      newPar: makerPar,
      deltaWei: makerWei,
    });
    expect(sellLog.args.exchangeWrapper).toEqual(
      dolomiteMargin.testing.exchangeWrapper.getAddress(),
    );
  });

  it('Succeeds for zero makerAmount', async () => {
    await Promise.all([
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectSellOkay({
      order: {
        ...testOrder,
        makerAmount: zero,
      },
    });

    await Promise.all([
      await expectPars(zero, zero),
      await expectDolomiteMarginBalances(zero, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Succeeds for zero takerAmount', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      setTakerBalance(takerPar),
    ]);
    await expectSellOkay({
      order: {
        ...testOrder,
        takerAmount: zero,
      },
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([
      await expectPars(makerPar, takerPar),
      await expectDolomiteMarginBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, zero),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
      dolomiteMargin.testing.setAccountStatus(
        who,
        accountNumber,
        AccountStatus.Liquidating,
      ),
    ]);
    await expectSellOkay({});
    const status = await dolomiteMargin.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
      dolomiteMargin.permissions.approveOperator(operator, { from: who }),
    ]);
    await expectSellOkay({}, { from: operator });

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectDolomiteMarginBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
      dolomiteMargin.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
    ]);
    await expectSellOkay({}, { from: operator });

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectDolomiteMarginBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Fails for non-operator', async () => {
    await expectSellRevert({}, 'Storage: Unpermissioned operator', {
      from: operator,
    });
  });

  it('Fails for positive takerAmount', async () => {
    await expectSellRevert(
      {
        amount: {
          value: takerWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
      'Exchange: Cannot exchange positive',
    );
  });

  it('Fails for takerToken equals makerToken', async () => {
    await expectSellRevert(
      {
        takerMarketId: makerMarket,
        order: {
          ...testOrder,
          takerToken: makerToken.getAddress(),
        },
      },
      'OperationImpl: Duplicate markets in action',
    );
  });

  it('Fails for DolomiteMargin without enough tokens', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei.div(2)),
      setTakerBalance(takerPar),
    ]);
    await expectSellRevert({}, 'Token: transfer failed');
  });

  it('Fails for exchangeWrapper without enough tokens', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei.div(2)),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectSellRevert({}, 'Token: transferFrom failed');
  });
});

// ============ Helper Functions ============

async function expectPars(
  expectedMakerPar: Integer,
  expectedTakerPar: Integer,
) {
  const [makerBalance, balances] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
    dolomiteMargin.getters.getAccountBalances(who, accountNumber),
  ]);
  expect(makerBalance).toEqual(expectedMakerPar.times(makerWei).div(makerPar));
  balances.forEach((balance, i) => {
    if (i === makerMarket.toNumber()) {
      expect(balance.par).toEqual(expectedMakerPar);
    } else if (i === takerMarket.toNumber()) {
      expect(balance.par).toEqual(expectedTakerPar);
    } else if (i === collateralMarket.toNumber()) {
      expect(balance.par).toEqual(collateralAmount);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function expectWrapperBalances(
  expectedMakerWei: Integer,
  expectedTakerWei: Integer,
) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
    takerToken.getBalance(dolomiteMargin.testing.exchangeWrapper.getAddress()),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectExchangeBalances(
  expectedMakerWei: Integer,
  expectedTakerWei: Integer,
) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(EXCHANGE_ADDRESS),
    takerToken.getBalance(EXCHANGE_ADDRESS),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectDolomiteMarginBalances(
  expectedMakerWei: Integer,
  expectedTakerWei: Integer,
) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
    takerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function issueMakerTokenToWrapper(amount: Integer) {
  return makerToken.issueTo(amount, dolomiteMargin.testing.exchangeWrapper.getAddress());
}

async function issueTakerTokenToDolomiteMargin(amount: Integer) {
  return takerToken.issueTo(amount, dolomiteMargin.contracts.dolomiteMargin.options.address);
}

async function setTakerBalance(par: Integer) {
  return dolomiteMargin.testing.setAccountBalance(who, accountNumber, takerMarket, par);
}

async function expectSellOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return dolomiteMargin.operation
    .initiate()
    .sell(combinedGlob)
    .commit(options);
}

async function expectSellRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectSellOkay(glob, options), reason);
}
