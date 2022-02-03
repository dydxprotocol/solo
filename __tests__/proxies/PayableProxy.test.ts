import BigNumber from 'bignumber.js';
import { address, ADDRESSES, Amount, AmountDenomination, AmountReference, INTEGERS, ProxyType } from '../../src';
import { toBytes } from '../../src/lib/BytesHelper';
import { expectThrow } from '../../src/lib/Expect';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { resetEVM, snapshot } from '../helpers/EVM';
import { TestExchangeWrapperOrder, TestOrder, TestOrderType } from '../helpers/types';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;
let operator: address;
let globalOperator: address;
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
const defaultIsClosing = false;
const defaultIsRecyclable = false;

const PRIMARY_REVERT_REASON = 'PayableProxy: Sender must be primary account';
const SECONDARY_REVERT_REASON = 'PayableProxy: Sender must be secondary account';

const tradeId = new BigNumber('5678');

const amountBlob: Amount = {
  value: zero,
  reference: AmountReference.Target,
  denomination: AmountDenomination.Principal,
};

let bigBlob: any;

describe('PayableProxy', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = dolomiteMargin.getDefaultAccount();
    owner2 = accounts[3];
    operator = accounts[6];
    globalOperator = accounts[7];
    testOrder = {
      type: TestOrderType.Test,
      exchangeWrapperAddress: dolomiteMargin.testing.exchangeWrapper.address,
      originator: operator,
      makerToken: dolomiteMargin.testing.tokenA.address,
      takerToken: dolomiteMargin.testing.tokenB.address,
      makerAmount: zero,
      takerAmount: zero,
      allegedTakerAmount: zero,
      desiredMakerAmount: zero,
    } as TestExchangeWrapperOrder;
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
      autoTrader: dolomiteMargin.testing.autoTrader.address,
      data: toBytes(tradeId),
      callee: dolomiteMargin.testing.callee.address,
    };
    await resetEVM();
    await Promise.all([
      setupMarkets(dolomiteMargin, accounts),
      dolomiteMargin.testing.autoTrader.setData(tradeId, amountBlob),
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.weth.address,
        new BigNumber('1e40'),
      ),
    ]);
    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.weth.address,
      dolomiteMargin.testing.priceOracle.address,
      dolomiteMargin.testing.interestSetter.address,
      zero,
      zero,
      defaultIsClosing,
      defaultIsRecyclable,
      { from: admin },
    );
    await dolomiteMargin.admin.setGlobalOperator(globalOperator, true, { from: admin })
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Fails for other accounts', async () => {
    // deposit
    await expectThrow(
      newOperation()
        .deposit(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // withdraw
    await expectThrow(
      newOperation()
        .withdraw(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // transfer
    await expectThrow(
      newOperation()
        .transfer(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );
    await expectThrow(
      newOperation()
        .transfer(bigBlob)
        .commit(),
      SECONDARY_REVERT_REASON,
    );
    await expectThrow(
      newOperation()
        .transfer(bigBlob)
        .commit({ from: owner2 }),
      PRIMARY_REVERT_REASON,
    );

    // buy
    await expectThrow(
      newOperation()
        .buy(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // sell
    await expectThrow(
      newOperation()
        .sell(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // trade
    await expectThrow(
      newOperation()
        .trade(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // liquidate
    await expectThrow(
      newOperation()
        .liquidate(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // vaporize
    await expectThrow(
      newOperation()
        .vaporize(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );

    // call
    await expectThrow(
      newOperation()
        .call(bigBlob)
        .commit({ from: operator }),
      PRIMARY_REVERT_REASON,
    );
  });

  it('Fails for withdrawing to zero', async () => {
    await dolomiteMargin.weth.wrap(owner1, amount);
    await Promise.all([
      dolomiteMargin.weth.transfer(
        owner1,
        dolomiteMargin.contracts.dolomiteMargin.options.address,
        amount,
      ),
      dolomiteMargin.testing.setAccountBalance(
        owner1,
        accountNumber1,
        wethMarket,
        amount,
      ),
    ]);
    await expectThrow(
      newOperation(ADDRESSES.ZERO)
        .withdraw({
          ...bigBlob,
          marketId: wethMarket,
          to: dolomiteMargin.contracts.payableProxy.options.address,
        })
        .commit(),
      'PayableProxy: Must set sendEthTo',
    );
  });

  it('Succeeds for other accounts', async () => {
    await Promise.all([
      dolomiteMargin.permissions.approveOperator(dolomiteMargin.testing.autoTrader.address, {
        from: owner1,
      }),
      dolomiteMargin.testing.tokenB.issueTo(
        par,
        dolomiteMargin.contracts.dolomiteMargin.options.address,
      ),
      dolomiteMargin.testing.setAccountBalance(
        owner1,
        accountNumber1,
        new BigNumber(2),
        par,
      ),
      dolomiteMargin.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
      dolomiteMargin.testing.setAccountBalance(owner2, accountNumber2, market2, par),
    ]);
    await newOperation()
      .deposit(bigBlob)
      .commit();

    await newOperation()
      .withdraw(bigBlob)
      .commit();

    await newOperation()
      .transfer({
        ...bigBlob,
        toAccountOwner: owner1,
        toAccountId: accountNumber2,
      })
      .commit();

    const exchangeBlob = {
      ...bigBlob,
      order: {
        ...testOrder,
        originator: owner1,
      },
    };
    await newOperation()
      .buy(exchangeBlob)
      .commit();

    await newOperation()
      .sell(exchangeBlob)
      .commit();

    await newOperation()
      .trade({
        ...bigBlob,
        otherAccountOwner: owner1,
        otherAccountId: accountNumber2,
      })
      .commit();

    await expectThrow(
      newOperation()
        .trade({
          ...bigBlob,
          autoTrader: dolomiteMargin.expiry.address,
          otherAccountOwner: owner1,
          otherAccountId: accountNumber2,
        })
        .commit(),
      'PayableProxy: Unpermissioned trade operator'
    );

    await newOperation()
      .call({
        ...bigBlob,
        data: toBytes(tradeId, tradeId),
      })
      .commit();

    await expectThrow(
      newOperation().liquidate(bigBlob).commit(),
      'PayableProxy: Cannot perform liquidations'
    );

    await newOperation(undefined, ProxyType.None)
      .liquidate(bigBlob)
      .commit({ from: globalOperator });

    await newOperation()
      .vaporize(bigBlob)
      .commit();
  });

  it('Succeeds for wrapping ETH', async () => {
    await newOperation()
      .deposit({
        ...bigBlob,
        amount: {
          value: amount,
          reference: AmountReference.Delta,
          denomination: AmountDenomination.Actual,
        },
        marketId: wethMarket,
        from: dolomiteMargin.contracts.payableProxy.options.address,
      })
      .commit({ from: owner1, value: amount.toNumber() });
  });

  it('Succeeds for un-wrapping ETH', async () => {
    await dolomiteMargin.weth.wrap(owner1, amount);
    await Promise.all([
      dolomiteMargin.weth.transfer(
        owner1,
        dolomiteMargin.contracts.dolomiteMargin.options.address,
        amount,
      ),
      dolomiteMargin.testing.setAccountBalance(
        owner1,
        accountNumber1,
        wethMarket,
        amount,
      ),
    ]);
    await newOperation()
      .withdraw({
        ...bigBlob,
        amount: {
          value: amount.times(-1),
          reference: AmountReference.Delta,
          denomination: AmountDenomination.Actual,
        },
        marketId: wethMarket,
        to: dolomiteMargin.contracts.payableProxy.options.address,
      })
      .commit({ from: owner1, value: amount.toNumber() });
  });

  it('Succeeds for wrapping and un-wrapping ETH', async () => {
    await newOperation()
      .deposit({
        ...bigBlob,
        amount: {
          value: amount,
          reference: AmountReference.Delta,
          denomination: AmountDenomination.Actual,
        },
        marketId: wethMarket,
        from: dolomiteMargin.contracts.payableProxy.options.address,
      })
      .commit({
        from: owner1,
        value: amount.times(2)
          .toNumber(),
      });
  });
});

// ============ Helper Functions ============

function newOperation(sendEthTo?: address, proxy: ProxyType = ProxyType.Payable) {
  return dolomiteMargin.operation.initiate({
    proxy,
    sendEthTo: sendEthTo || owner1,
  });
}
