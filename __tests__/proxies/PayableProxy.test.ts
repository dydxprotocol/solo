import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { toBytes } from '../../src/lib/BytesHelper';
import { OrderType, TestOrder } from '@dydxprotocol/exchange-wrappers';
import {
  address,
  Amount,
  AmountDenomination,
  AmountReference,
} from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;
let operator: address;
let testOrder: TestOrder;

const amount = new BigNumber(10000);
const accountNumber1 = new BigNumber(111);
const accountNumber2 = new BigNumber(222);
const market1 = INTEGERS.ZERO;
const market2 = INTEGERS.ONE;
const wethMarket = new BigNumber(3);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const negPar = par.times(-1);

const PRIMARY_REVERT_REASON = 'PayableProxyForSoloMargin: Sender must be primary account';
const SECONDARY_REVERT_REASON = 'PayableProxyForSoloMargin: Sender must be secondary account';

const tradeId = new BigNumber('5678');

const amountBlob: Amount = {
  value: zero,
  reference: AmountReference.Target,
  denomination: AmountDenomination.Principal,
};

let bigBlob: any;

describe('PayableProxy', () => {

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();
    owner2 = accounts[3];
    operator = accounts[6];
    testOrder = {
      type: OrderType.Test,
      exchangeWrapperAddress: solo.testing.exchangeWrapper.getAddress(),
      originator: operator,
      makerToken: solo.testing.tokenA.getAddress(),
      takerToken: solo.testing.tokenB.getAddress(),
      makerAmount: zero,
      takerAmount: zero,
      allegedTakerAmount: zero,
      desiredMakerAmount: zero,
    };
    bigBlob = {
      amount: amountBlob,

      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,

      toAccountOwner: owner2,
      toAccountId: accountNumber2,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      liquidAccountOwner: owner2,
      liquidAccountId: accountNumber2,
      vaporAccountOwner: owner2,
      vaporAccountId: accountNumber2,

      marketId: market1,
      makerMarketId: market1,
      inputMarketId: market1,
      liquidMarketId: market1,
      vaporMarketId: market1,

      takerMarketId: market2,
      outputMarketId: market2,
      payoutMarketId: market2,

      from: owner1,
      to: owner1,
      order: testOrder,
      autoTrader: solo.testing.autoTrader.getAddress(),
      data: toBytes(tradeId),
      callee: solo.testing.callee.getAddress(),
    };
    await resetEVM();
    await Promise.all([
      setupMarkets(solo, accounts),
      solo.testing.autoTrader.setData(tradeId, amountBlob),
      solo.testing.priceOracle.setPrice(solo.weth.getAddress(), new BigNumber('1e40')),
    ]);
    await solo.admin.addMarket(
      solo.weth.getAddress(),
      solo.testing.priceOracle.getAddress(),
      solo.testing.interestSetter.getAddress(),
      zero,
      zero,
      { from: admin },
    );
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Fails for other accounts', async () => {
    // deposit
    await expectThrow(
      newOperation().deposit(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // withdraw
    await expectThrow(
      newOperation().withdraw(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // transfer
    await expectThrow(
      newOperation().transfer(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );
    await expectThrow(
      newOperation().transfer(bigBlob).commit(),
      SECONDARY_REVERT_REASON,
    );
    await expectThrow(
      newOperation().transfer(bigBlob).commit({ from: owner2 }),
      PRIMARY_REVERT_REASON,
    );

    // buy
    await expectThrow(
      newOperation().buy(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // sell
    await expectThrow(
      newOperation().sell(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // trade
    await expectThrow(
      newOperation().trade(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // liquidate
    await expectThrow(
      newOperation().liquidate(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // vaporize
    await expectThrow(
      newOperation().vaporize(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // call
    await expectThrow(
      newOperation().call(bigBlob).commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );
  });

  it('Fails for withdrawing to zero', async () => {
    await solo.weth.wrap(owner1, amount);
    await Promise.all([
      solo.weth.transfer(owner1, solo.contracts.soloMargin.options.address, amount),
      solo.testing.setAccountBalance(owner1, accountNumber1, wethMarket, amount),
    ]);
    await expectThrow(
      newOperation(ADDRESSES.ZERO).withdraw({
        ...bigBlob,
        marketId: wethMarket,
        to: solo.contracts.payableProxy.options.address,
      }).commit(),
      'PayableProxyForSoloMargin: Must set sendEthTo',
    );
  });

  it('Succeeds for other accounts', async () => {
    await Promise.all([
      solo.permissions.approveOperator(solo.testing.autoTrader.getAddress(), { from: owner1 }),
      solo.testing.tokenB.issueTo(par, solo.contracts.soloMargin.options.address),
      solo.testing.setAccountBalance(owner1, accountNumber1, new BigNumber(2), par),
      solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
      solo.testing.setAccountBalance(owner2, accountNumber2, market2, par),
    ]);
    await newOperation().deposit(bigBlob).commit();

    await newOperation().withdraw(bigBlob).commit();

    await newOperation().transfer({
      ...bigBlob,
      toAccountOwner: owner1,
      toAccountId: accountNumber2,
    }).commit();

    const exchangeBlob = {
      ...bigBlob,
      order: {
        ...testOrder,
        originator: owner1,
      },
    };
    await newOperation().buy(exchangeBlob).commit();

    await newOperation().sell(exchangeBlob).commit();

    await newOperation().trade({
      ...bigBlob,
      otherAccountOwner: owner1,
      otherAccountId: accountNumber2,
    }).commit();

    await newOperation().call({
      ...bigBlob,
      data: toBytes(tradeId, tradeId),
    }).commit();

    await newOperation().liquidate(bigBlob).commit();

    await newOperation().vaporize(bigBlob).commit();
  });

  it('Succeeds for wrapping ETH', async () => {
    await newOperation().deposit({
      ...bigBlob,
      amount: {
        value: amount,
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      marketId: wethMarket,
      from: solo.contracts.payableProxy.options.address,
    }).commit({ from: owner1, value: amount.toNumber() });
  });

  it('Succeeds for un-wrapping ETH', async () => {
    await solo.weth.wrap(owner1, amount);
    await Promise.all([
      solo.weth.transfer(owner1, solo.contracts.soloMargin.options.address, amount),
      solo.testing.setAccountBalance(owner1, accountNumber1, wethMarket, amount),
    ]);
    await newOperation().withdraw({
      ...bigBlob,
      amount: {
        value: amount.times(-1),
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      marketId: wethMarket,
      to: solo.contracts.payableProxy.options.address,
    }).commit({ from: owner1, value: amount.toNumber() });
  });

  it('Succeeds for wrapping and un-wrapping ETH', async () => {
    await newOperation().deposit({
      ...bigBlob,
      amount: {
        value: amount,
        reference: AmountReference.Delta,
        denomination: AmountDenomination.Actual,
      },
      marketId: wethMarket,
      from: solo.contracts.payableProxy.options.address,
    }).commit({ from: owner1, value: amount.times(2).toNumber() });
  });
});

// ============ Helper Functions ============

function newOperation(sendEthTo?: address) {
  return solo.operation.initiate(
    { usePayableProxy: true, sendEthTo: sendEthTo || owner1 },
  );
}
