import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { snapshot, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';
import { expectThrow } from '../../src/lib/Expect';
import { TestToken } from '../../src/modules/testing/TestToken';
import {
  address,
  AccountStatus,
  AmountDenomination,
  AmountReference,
  Integer,
  Buy,
} from '../../src/types';

let who: address;
let operator: address;
let solo: Solo;
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
let testOrder: TestOrder;
let EXCHANGE_ADDRESS: string;

describe('Buy', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    EXCHANGE_ADDRESS = solo.testing.exchangeWrapper.getExchangeAddress();
    accounts = r.accounts;
    who = solo.getDefaultAccount();
    operator = accounts[6];
    makerToken = solo.testing.tokenA;
    takerToken = solo.testing.tokenB;
    testOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: who,
      makerToken: makerToken.getAddress(),
      takerToken: takerToken.getAddress(),
      makerAmount: makerWei,
      takerAmount: takerWei,
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
    await setupMarkets(solo, accounts);
    const defaultIndex = {
      lastUpdate: INTEGERS.ZERO,
      borrow: takerWei.div(takerPar),
      supply: takerWei.div(takerPar),
    };
    await Promise.all([
      solo.testing.setMarketIndex(makerMarket, defaultIndex),
      solo.testing.setMarketIndex(takerMarket, defaultIndex),
      solo.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic buy test', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
    ]);

    const txResult = await expectBuyOkay({});

    console.log(`\tBuy gas used: ${txResult.gasUsed}`);

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectSoloBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);

    // TODO: expect log
  });

  it('Succeeds for zero makerAmount', async () => {
    await Promise.all([
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectBuyOkay({
      order: {
        ...testOrder,
        makerAmount: zero,
      },
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    await Promise.all([
      await expectPars(zero, zero),
      await expectSoloBalances(zero, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Succeeds for zero takerAmount', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      setTakerBalance(takerPar),
    ]);
    await expectBuyOkay({
      order: {
        ...testOrder,
        takerAmount: zero,
      },
    });

    await Promise.all([
      await expectPars(makerPar, takerPar),
      await expectSoloBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, zero),
    ]);
  });

  it('Succeeds and sets status to Normal', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
      solo.testing.setAccountStatus(who, accountNumber, AccountStatus.Liquidating),
    ]);
    await expectBuyOkay({});
    const status = await solo.getters.getAccountStatus(who, accountNumber);
    expect(status).toEqual(AccountStatus.Normal);
  });

  it('Succeeds for local operator', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
      solo.permissions.approveOperator(operator, { from: who }),
    ]);
    await expectBuyOkay({}, { from: operator });

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectSoloBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Succeeds for global operator', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
      solo.admin.setGlobalOperator(operator, true, { from: accounts[0] }),
    ]);
    await expectBuyOkay({}, { from: operator });

    await Promise.all([
      await expectPars(makerPar, zero),
      await expectSoloBalances(makerWei, zero),
      await expectWrapperBalances(zero, zero),
      await expectExchangeBalances(zero, takerWei),
    ]);
  });

  it('Fails for non-operator', async () => {
    await expectBuyRevert(
      {},
      'Storage: Unpermissioned Operator',
      { from: operator },
    );
  });

  it('Fails for takerToken equals makerToken', async () => {
    await expectBuyRevert(
      {
        takerMarketId: makerMarket,
        order: {
          ...testOrder,
          takerToken: makerToken.getAddress(),
        },
      },
      'OperationImpl: Markets must be distinct',
    );
  });

  it('Fails for Solo without enough tokens', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei),
      issueTakerTokenToSolo(takerWei.div(2)),
      setTakerBalance(takerPar),
    ]);
    await expectBuyRevert({}, 'Token: Transfer failed');
  });

  it('Fails for exchangeWrapper without enough tokens', async () => {
    await Promise.all([
      issueMakerTokenToWrapper(makerWei.div(2)),
      issueTakerTokenToSolo(takerWei),
      setTakerBalance(takerPar),
    ]);
    await expectBuyRevert({}, 'Token: TransferFrom failed');
  });

  it('Succeeds for all sorts of amounts', async () => {
    // TODO
  });

  it('Fails for non-truthful exchangeWrapper', async () => {
    // TODO get the following error: 'OperationImpl: Buy amount less than promised'
  });
});

// ============ Helper Functions ============

async function expectPars(expectedMakerPar: Integer, expectedTakerPar: Integer) {
  const [
    makerBalance,
    balances,
  ] = await Promise.all([
    makerToken.getBalance(solo.contracts.soloMargin.options.address),
    solo.getters.getAccountBalances(who, accountNumber),
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

async function expectWrapperBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [
    makerWei,
    takerWei,
  ] = await Promise.all([
    makerToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
    takerToken.getBalance(solo.testing.exchangeWrapper.getAddress()),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectExchangeBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [
    makerWei,
    takerWei,
  ] = await Promise.all([
    makerToken.getBalance(EXCHANGE_ADDRESS),
    takerToken.getBalance(EXCHANGE_ADDRESS),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function expectSoloBalances(expectedMakerWei: Integer, expectedTakerWei: Integer) {
  const [
    makerWei,
    takerWei,
  ] = await Promise.all([
    makerToken.getBalance(solo.contracts.soloMargin.options.address),
    takerToken.getBalance(solo.contracts.soloMargin.options.address),
  ]);
  expect(makerWei).toEqual(expectedMakerWei);
  expect(takerWei).toEqual(expectedTakerWei);
}

async function issueMakerTokenToWrapper(amount: Integer) {
  return makerToken.issueTo(amount, solo.testing.exchangeWrapper.getAddress());
}

async function issueTakerTokenToSolo(amount: Integer) {
  return takerToken.issueTo(amount, solo.contracts.soloMargin.options.address);
}

async function setTakerBalance(par: Integer) {
  return solo.testing.setAccountBalance(who, accountNumber, takerMarket, par);
}

async function expectBuyOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().buy(combinedGlob).commit(options);
}

async function expectBuyRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectBuyOkay(glob, options), reason);
}
