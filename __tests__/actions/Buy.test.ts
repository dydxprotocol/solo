import BigNumber from 'bignumber.js';
import { AccountStatus, address, AmountDenomination, AmountReference, Buy, Integer } from '../../src';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { resetEVM, snapshot } from '../helpers/EVM';
import { TestExchangeWrapperOrder, TestOrderType } from '../helpers/types';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { TestToken } from '../modules/TestToken';

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
let defaultGlob: Buy;
let testOrder: TestExchangeWrapperOrder;
let EXCHANGE_ADDRESS: string;

describe('Buy', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    EXCHANGE_ADDRESS = dolomiteMargin.testing.exchangeWrapper.exchangeAddress;
    accounts = r.accounts;
    who = dolomiteMargin.getDefaultAccount();
    operator = accounts[6];
    makerToken = dolomiteMargin.testing.tokenA;
    takerToken = dolomiteMargin.testing.tokenB;
    testOrder = {
      type: TestOrderType.Test,
      exchangeWrapperAddress: dolomiteMargin.testing.exchangeWrapper.address,
      originator: who,
      makerToken: makerToken.address,
      takerToken: takerToken.address,
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
        value: makerWei,
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
      dolomiteMargin.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic buy test', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    const txResult = await expectBuyOkay({});
    console.log(`\tBuy gas used: ${txResult.gasUsed}`);
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
    const txResult = await expectBuyOkay({}, { from: operator });
    const [
      makerIndex,
      takerIndex,
      collateralIndex,
      makerOraclePrice,
      takerOraclePrice,
      collateralOraclePrice,
    ] = await Promise.all([
      dolomiteMargin.getters.getMarketCachedIndex(makerMarket),
      dolomiteMargin.getters.getMarketCachedIndex(takerMarket),
      dolomiteMargin.getters.getMarketCachedIndex(collateralMarket),
      dolomiteMargin.getters.getMarketPrice(makerMarket),
      dolomiteMargin.getters.getMarketPrice(takerMarket),
      dolomiteMargin.getters.getMarketPrice(collateralMarket),
      expectPars(makerPar, zero),
      expectDolomiteMarginBalances(makerWei, zero),
      expectWrapperBalances(zero, zero),
      expectExchangeBalances(zero, takerWei),
    ]);

    const logs = dolomiteMargin.logs.parseLogs(txResult);
    expect(logs.length).toEqual(8);

    const operationLog = logs[0];
    expect(operationLog.name).toEqual('LogOperation');
    expect(operationLog.args.sender).toEqual(operator);

    const makerIndexLog = logs[1];
    expect(makerIndexLog.name).toEqual('LogIndexUpdate');
    expect(makerIndexLog.args.market).toEqual(makerMarket);
    expect(makerIndexLog.args.index).toEqual(makerIndex);

    const takerIndexLog = logs[2];
    expect(takerIndexLog.name).toEqual('LogIndexUpdate');
    expect(takerIndexLog.args.market).toEqual(takerMarket);
    expect(takerIndexLog.args.index).toEqual(takerIndex);

    const collateralIndexLog = logs[3];
    expect(collateralIndexLog.name).toEqual('LogIndexUpdate');
    expect(collateralIndexLog.args.market).toEqual(collateralMarket);
    expect(collateralIndexLog.args.index).toEqual(collateralIndex);

    const makerOraclePriceLog = logs[4];
    expect(makerOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(makerOraclePriceLog.args.market).toEqual(makerMarket);
    expect(makerOraclePriceLog.args.price).toEqual(makerOraclePrice);

    const takerOraclePriceLog = logs[5];
    expect(takerOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(takerOraclePriceLog.args.market).toEqual(takerMarket);
    expect(takerOraclePriceLog.args.price).toEqual(takerOraclePrice);

    const collateralOraclePriceLog = logs[6];
    expect(collateralOraclePriceLog.name).toEqual('LogOraclePrice');
    expect(collateralOraclePriceLog.args.market).toEqual(collateralMarket);
    expect(collateralOraclePriceLog.args.price).toEqual(collateralOraclePrice);

    const buyLog = logs[7];
    expect(buyLog.name).toEqual('LogBuy');
    expect(buyLog.args.accountOwner).toEqual(who);
    expect(buyLog.args.accountNumber).toEqual(accountNumber);
    expect(buyLog.args.takerMarket).toEqual(takerMarket);
    expect(buyLog.args.makerMarket).toEqual(makerMarket);
    expect(buyLog.args.takerUpdate).toEqual({
      newPar: zero,
      deltaWei: takerWei.times(-1),
    });
    expect(buyLog.args.makerUpdate).toEqual({
      newPar: makerPar,
      deltaWei: makerWei,
    });
    expect(buyLog.args.exchangeWrapper).toEqual(dolomiteMargin.testing.exchangeWrapper.address);
  });

  it('Succeeds for zero makerAmount', async () => {
    await Promise.all([issueTakerTokenToDolomiteMargin(takerWei), setTakerBalance(takerPar)]);
    await expectBuyOkay({
      order: {
        ...testOrder,
        makerAmount: zero,
        desiredMakerAmount: zero,
      },
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
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
    await Promise.all([issueMakerTokenToWrapper(makerWei), setTakerBalance(takerPar)]);
    await expectBuyOkay({
      order: {
        ...testOrder,
        takerAmount: zero,
        allegedTakerAmount: zero,
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
      dolomiteMargin.testing.setAccountStatus(who, accountNumber, AccountStatus.Liquidating),
    ]);
    await expectBuyOkay({});
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
    await expectBuyOkay({}, { from: operator });

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
    await expectBuyOkay({}, { from: operator });

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectDolomiteMarginBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Fails for non-operator', async () => {
    await expectBuyRevert({}, 'Storage: Unpermissioned operator', {
      from: operator,
    });
  });

  it('Fails for negative makerAmount', async () => {
    await expectBuyRevert(
      {
        amount: {
          value: makerWei.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
      'Exchange: Cannot getCost negative',
    );
  });

  it('Fails for takerToken equals makerToken', async () => {
    await expectBuyRevert(
      {
        takerMarketId: makerMarket,
        order: {
          ...testOrder,
          takerToken: makerToken.address,
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
    await expectBuyRevert({}, 'Token: transfer failed');
  });

  it('Fails for exchangeWrapper without enough tokens', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei.div(2)),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectBuyRevert({}, 'Token: transferFrom failed');
  });

  it('Fails for non-truthful exchangeWrapper', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei.div(2)),
      issueTakerTokenToDolomiteMargin(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectBuyRevert(
      {
        order: {
          ...testOrder,
          makerAmount: makerWei.div(2),
        },
      },
      'TradeImpl: Buy amount less than promised',
    );
  });
});

// ============ Helper Functions ============

async function expectPars(expectedMakerPar: Integer, expectedTakerPar: Integer) {
  const [makerBalance, balances] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
    dolomiteMargin.getters.getAccountBalances(who, accountNumber),
  ]);
  expect(makerBalance).toEqual(expectedMakerPar.times(makerWei).div(makerPar));
  balances.forEach(balance => {
    if (balance.marketId.eq(makerMarket)) {
      expect(balance.par).toEqual(expectedMakerPar);
    } else if (balance.marketId.eq(takerMarket)) {
      expect(balance.par).toEqual(expectedTakerPar);
    } else if (balance.marketId.eq(collateralMarket)) {
      expect(balance.par).toEqual(collateralAmount);
    } else {
      expect(balance.par).toEqual(zero);
    }
  });
}

async function expectWrapperBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.testing.exchangeWrapper.address),
    takerToken.getBalance(dolomiteMargin.testing.exchangeWrapper.address),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectExchangeBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(EXCHANGE_ADDRESS),
    takerToken.getBalance(EXCHANGE_ADDRESS),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectDolomiteMarginBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [makerWei, takerWei] = await Promise.all([
    makerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
    takerToken.getBalance(dolomiteMargin.contracts.dolomiteMargin.options.address),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function issueMakerTokenToWrapper(amount: Integer) {
  return makerToken.issueTo(amount, dolomiteMargin.testing.exchangeWrapper.address);
}

async function issueTakerTokenToDolomiteMargin(amount: Integer) {
  return takerToken.issueTo(amount, dolomiteMargin.contracts.dolomiteMargin.options.address);
}

async function setTakerBalance(par: Integer) {
  return dolomiteMargin.testing.setAccountBalance(who, accountNumber, takerMarket, par);
}

async function expectBuyOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return dolomiteMargin.operation
    .initiate()
    .buy(combinedGlob)
    .commit(options);
}

async function expectBuyRevert(glob: Object, reason?: string, options?: Object) {
  await expectThrow(expectBuyOkay(glob, options), reason);
}
