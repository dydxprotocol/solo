import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { setupMarkets } from '../helpers/SoloHelpers';
import { toBytes } from '../../src/lib/BytesHelper';
import {
  address,
  AmountDenomination,
  AmountReference,
  Integer,
  LimitOrder,
  SignedLimitOrder,
  LimitOrderStatus,
  SigningMethod,
} from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
const defaultMakerMarket = new BigNumber(0);
const defaultTakerMarket = new BigNumber(1);
const incorrectMarket = new BigNumber(2);
const defaultMakerNumber = new BigNumber(111);
const defaultTakerNumber = new BigNumber(222);
const defaultMakerAmount = new BigNumber('1e10');
const defaultTakerAmount = new BigNumber('2e10');
let admin: address;
let defaultMakerAddress: address;
let defaultTakerAddress: address;
let rando: address;

let testOrder: SignedLimitOrder;

describe('LimitOrders', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    defaultMakerAddress = accounts[6];
    defaultTakerAddress = accounts[7];
    rando = accounts[9];

    testOrder = {
      makerMarket: defaultMakerMarket,
      takerMarket: defaultTakerMarket,
      makerAmount: defaultMakerAmount,
      takerAmount: defaultTakerAmount,
      makerAccountOwner: defaultMakerAddress,
      makerAccountNumber: defaultMakerNumber,
      takerAccountOwner: defaultTakerAddress,
      takerAccountNumber: defaultTakerNumber,
      expiration: INTEGERS.ONES_31,
      salt: new BigNumber(100),
      typedSignature: null,
    };
    testOrder.typedSignature =
        await solo.limitOrders.signOrder(testOrder, SigningMethod.TypedData);

    await resetEVM();

    // set balances
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setAccountBalance(
        testOrder.takerAccountOwner,
        testOrder.takerAccountNumber,
        defaultTakerMarket,
        defaultTakerAmount,
      ),
      solo.testing.setAccountBalance(
        testOrder.makerAccountOwner,
        testOrder.makerAccountNumber,
        defaultMakerMarket,
        defaultMakerAmount,
      ),
    ]);

    await mineAvgBlock();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('Signing Orders', () => {
    it('Succeeds for eth.sign', async () => {
      const order = { ...testOrder };
      order.typedSignature = await solo.limitOrders.signOrder(order, SigningMethod.Hash);
      expect(solo.limitOrders.orderHasValidSignature(order)).toBe(true);
    });

    it('Succeeds for eth_signTypedData', async () => {
      const order = { ...testOrder };
      order.typedSignature = await solo.limitOrders.signOrder(order, SigningMethod.TypedData);
      expect(solo.limitOrders.orderHasValidSignature(order)).toBe(true);
    });

    it('Recognizes a bad signature', async () => {
      const order = { ...testOrder };
      order.typedSignature = `0x${'1b'.repeat(65)}00`;
      expect(solo.limitOrders.orderHasValidSignature(order)).toBe(false);
    });
  });

  describe('Signing CancelOrders', () => {
    it('Succeeds for eth.sign', async () => {
      const order = { ...testOrder };
      const cancelSig = await solo.limitOrders.signCancelOrder(order, SigningMethod.Hash);
      expect(solo.limitOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(true);
    });

    it('Succeeds for eth_signTypedData', async () => {
      const order = { ...testOrder };
      const cancelSig = await solo.limitOrders.signCancelOrder(order, SigningMethod.TypedData);
      expect(solo.limitOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(true);
    });

    it('Recognizes a bad signature', async () => {
      const order = { ...testOrder };
      const cancelSig = `0x${'1b'.repeat(65)}00`;
      expect(solo.limitOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(false);
    });
  });

  describe('shutDown', () => {
    it('Succeeds', async () => {
      expect(await solo.limitOrders.isOperational()).toBe(true);
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(false);
    });

    it('Succeeds when it is already shutDown', async () => {
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(false);
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(false);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.limitOrders.methods.shutDown(),
          { from: rando },
        ),
      );
    });
  });

  describe('startUp', () => {
    it('Succeeds after being shutDown', async () => {
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(false);
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.startUp(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(true);
    });

    it('Succeeds when it is already operational', async () => {
      expect(await solo.limitOrders.isOperational()).toBe(true);
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.startUp(),
        { from: admin },
      );
      expect(await solo.limitOrders.isOperational()).toBe(true);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.limitOrders.methods.startUp(),
          { from: rando },
        ),
      );
    });
  });

  describe('getTradeCost', () => {
    it('Succeeds for makerAmount specified', async () => {
      await fillLimitOrder(testOrder, {
        amount: defaultMakerAmount.times(-1),
        denominatedInMakerAmount: true,
      });
      await expectBalances(INTEGERS.ZERO, defaultMakerAmount, defaultTakerAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrder, defaultMakerAmount);
    });

    it('Succeeds for takerAmount specified', async () => {
      const txResult = await fillLimitOrder(testOrder, {
        amount: defaultTakerAmount,
        denominatedInMakerAmount: false,
      });
      await expectBalances(INTEGERS.ZERO, defaultMakerAmount, defaultTakerAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrder, defaultMakerAmount);
      console.log(`\tLimitOrder Trade gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds for zero expiry', async () => {
      const testOrderNoExpiry = {
        ...testOrder,
        expiration: INTEGERS.ZERO,
      };
      testOrderNoExpiry.typedSignature =
        await solo.limitOrders.signOrder(testOrderNoExpiry, SigningMethod.TypedData);
      await fillLimitOrder(testOrderNoExpiry, {});
      await expectBalances(INTEGERS.ZERO, defaultMakerAmount, defaultTakerAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrderNoExpiry, defaultMakerAmount);
    });

    it('Succeeds for no specific taker', async () => {
      const testOrderNoTaker = {
        ...testOrder,
        takerAccountOwner: ADDRESSES.ZERO,
        takerAccountNumber: INTEGERS.ZERO,
      };
      testOrderNoTaker.typedSignature =
        await solo.limitOrders.signOrder(testOrderNoTaker, SigningMethod.TypedData);
      await fillLimitOrder(testOrderNoTaker, {});
      await expectBalances(INTEGERS.ZERO, defaultMakerAmount, defaultTakerAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrderNoTaker, defaultMakerAmount);
    });

    it('Succeeds for pre-approved order', async () => {
      // approve order
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });

      // create order without signature
      const testOrderNoSig = { ...testOrder };
      delete testOrderNoSig.typedSignature;

      // verify okay
      await solo.operation.initiate().fillPreApprovedLimitOrder(
        defaultTakerAddress,
        defaultTakerNumber,
        testOrderNoSig,
        defaultTakerAmount,
        false,
      ).commit({ from: defaultTakerAddress });
      await expectBalances(INTEGERS.ZERO, defaultMakerAmount, defaultTakerAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrderNoSig, defaultMakerAmount);
    });

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.limitOrders.methods.getTradeCost(
            defaultMakerMarket.toFixed(0),
            defaultTakerMarket.toFixed(0),
            { owner: defaultMakerAddress, number: defaultMakerNumber.toFixed(0) },
            { owner: defaultTakerAddress, number: defaultTakerNumber.toFixed(0) },
            { sign: false, value: '0' },
            { sign: false, value: '0' },
            { sign: false, value: '0' },
            [],
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Fails if shutDown', async () => {
      await solo.contracts.send(
        solo.contracts.limitOrders.methods.shutDown(),
        { from: admin },
      );
      await expectThrow(
        fillLimitOrder(testOrder, {}),
        'LimitOrders: Contract is not operational',
      );
    });

    it('Fails for inputWei of zero', async () => {
      await expectThrow(
        fillLimitOrder(testOrder, { amount: INTEGERS.ZERO }),
        'LimitOrders: InputWei is zero',
      );
    });

    it('Fails for inputMarket mismatch', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...limitOrderToTradeData(testOrder),
          inputMarketId: incorrectMarket,
        }).commit({ from: defaultTakerAddress }),
        'LimitOrders: Market mismatch',
      );
    });

    it('Fails for outputMarket mismatch', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...limitOrderToTradeData(testOrder),
          outputMarketId: incorrectMarket,
        }).commit({ from: defaultTakerAddress }),
        'LimitOrders: Market mismatch',
      );
    });

    it('Fails for switching makerMarket and takerMarket', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...limitOrderToTradeData(testOrder),
          inputMarketId: defaultMakerMarket,
          outputMarketId: defaultTakerMarket,
        }).commit({ from: defaultTakerAddress }),
        'LimitOrders: InputWei sign mismatch',
      );
    });

    it('Fails to overfill order (makerAmount)', async () => {
      await expectThrow(
        fillLimitOrder(testOrder, {
          amount: defaultMakerAmount.plus(5).times(-1),
          denominatedInMakerAmount: true,
        }),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Fails to overfill order (takerAmount)', async () => {
      await expectThrow(
        fillLimitOrder(testOrder, { amount: defaultTakerAmount.plus(5) }),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await expectThrow(
        fillLimitOrder(testOrder, {}),
        'LimitOrders: Order canceled',
      );
    });

    it('Fails for expired order', async () => {
      const testOrderExpired = {
        ...testOrder,
        expiration: INTEGERS.ONE,
      };
      testOrderExpired.typedSignature =
        await solo.limitOrders.signOrder(testOrderExpired, SigningMethod.TypedData);
      await expectThrow(
        fillLimitOrder(testOrderExpired, {}),
        'LimitOrders: Order expired',
      );
    });

    it('Fails for incorrect taker account', async () => {
      await expectThrow(
        fillLimitOrder(testOrder, { taker: rando }),
        'LimitOrders: Order taker account mismatch',
      );
      await expectThrow(
        fillLimitOrder(testOrder, { takerNumber: defaultTakerNumber.plus(1) }),
        'LimitOrders: Order taker account mismatch',
      );
    });

    it('Fails for incorrect maker account', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...limitOrderToTradeData(testOrder),
          otherAccountOwner: defaultTakerAddress,
        }).commit({ from: defaultTakerAddress }),
        'LimitOrders: Order maker account mismatch',
      );
      await expectThrow(
        solo.operation.initiate().trade({
          ...limitOrderToTradeData(testOrder),
          otherAccountId: defaultMakerNumber.plus(1),
        }).commit({ from: defaultTakerAddress }),
        'LimitOrders: Order maker account mismatch',
      );
    });

    it('Fails for invalid signature', async () => {
      const invalidSignature1 = `0x${'00'.repeat(65)}05`;
      const invalidSignature2 = `0x${'00'.repeat(65)}01`;
      const testOrderInvalidSig1 = { ...testOrder, typedSignature: invalidSignature1 };
      const testOrderInvalidSig2 = { ...testOrder, typedSignature: invalidSignature2 };
      await expectThrow(
        fillLimitOrder(testOrderInvalidSig1, {}),
        'TypedSignature: Invalid signature type',
      );
      await expectThrow(
        fillLimitOrder(testOrderInvalidSig2, {}),
        'LimitOrders: Order invalid signature',
      );
    });

    it('Fails for no signature data', async () => {
      const testOrderShortSig = { ...testOrder, typedSignature: '0x' };
      await expectThrow(
        fillLimitOrder(testOrderShortSig, {}),
        'LimitOrders: Cannot parse signature from data',
      );
    });

    it('Fails for bad data length', async () => {
      await expectThrow(
        fillLimitOrder({ ...testOrder, typedSignature: '0x0000' }, {}),
        'LimitOrders: Cannot parse order from data',
      );
      await expectThrow(
        fillLimitOrder({ ...testOrder, typedSignature: `0x${'00'.repeat(100)}` }, {}),
        'LimitOrders: Cannot parse order from data',
      );
    });

    it('Fails for bad order data', async () => {
      await expectThrow(
        solo.operation.initiate().trade(
          {
            ...limitOrderToTradeData(testOrder),
            data: [[255], [255]],
          },
        ).commit({ from: defaultTakerAddress }),
        'LimitOrders: Cannot parse order from data',
      );
    });
  });

  describe('constructor', () => {
    it('Sets constants correctly', async () => {
      const [
        domainHash,
        soloMarginAddress,
      ] = await Promise.all([
        solo.contracts.call(solo.contracts.limitOrders.methods.EIP712_DOMAIN_HASH()),
        solo.contracts.call(solo.contracts.limitOrders.methods.SOLO_MARGIN()),
      ]);
      const expectedDomainHash = solo.limitOrders.getDomainHash();
      expect(domainHash).toEqual(expectedDomainHash);
      expect(soloMarginAddress).toEqual(solo.contracts.soloMargin.options.address);
    });
  });

  describe('approveOrder', () => {
    it('Succeeds for null order', async () => {
      const approver = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await solo.limitOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogLimitOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Succeeds for approved order', async () => {
      const approver = testOrder.makerAccountOwner;
      await solo.limitOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      const txResult = await solo.limitOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogLimitOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner }),
        'LimitOrders: Cannot approve canceled order',
      );
    });
  });

  describe('cancelOrder', () => {
    it('Succeeds for null order', async () => {
      const canceler = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await solo.limitOrders.cancelOrder(testOrder, { from: canceler });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogLimitOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Succeeds for approved order', async () => {
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Succeeds for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        solo.limitOrders.cancelOrder(testOrder, { from: rando }),
        'LimitOrders: Canceler must be maker',
      );
    });
  });

  describe('callFunction: bad data', () => {
    it('Fails for bad callFunction type', async () => {
      const badType = new BigNumber(2);
      await expectThrow(
        solo.operation.initiate().call({
          primaryAccountOwner: testOrder.takerAccountOwner,
          primaryAccountId: testOrder.takerAccountNumber,
          callee: solo.contracts.limitOrders.options.address,
          data: toBytes(
            badType,
            solo.limitOrders.getOrderHash(testOrder),
          ),
        }).commit({ from: testOrder.takerAccountOwner }),
      );
    });

    it('Fails for too-short data', async () => {
      await expectThrow(
        solo.operation.initiate().call({
          primaryAccountOwner: testOrder.takerAccountOwner,
          primaryAccountId: testOrder.takerAccountNumber,
          callee: solo.contracts.limitOrders.options.address,
          data: toBytes(
            solo.limitOrders.getOrderHash(testOrder),
          ),
        }).commit({ from: testOrder.takerAccountOwner }),
        'LimitOrders: Cannot parse CallFunctionData',
      );
    });
  });

  describe('callFunction: approve', () => {
    async function approveTestOrder(from?: address) {
      return solo.operation.initiate().approveLimitOrder({
        primaryAccountOwner: from || testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: from || testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.limitOrders.methods.callFunction(
            ADDRESSES.ZERO,
            {
              owner: testOrder.makerAccountOwner,
              number: testOrder.makerAccountNumber.toFixed(0),
            },
            [],
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Succeeds for null order', async () => {
      const approver = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await approveTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);
      const log = logs[2];
      expect(log.name).toEqual('LogLimitOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Succeeds for approved order', async () => {
      const approver = testOrder.makerAccountOwner;
      await approveTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      const txResult = await approveTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);
      const log = logs[2];
      expect(log.name).toEqual('LogLimitOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        approveTestOrder(),
        'LimitOrders: Cannot approve canceled order',
      );
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        approveTestOrder(rando),
        'LimitOrders: Approver must be maker',
      );
    });
  });

  describe('callFunction: cancel', () => {
    async function cancelTestOrder(from?: address) {
      return solo.operation.initiate().cancelLimitOrder({
        primaryAccountOwner: from || testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: from || testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.limitOrders.methods.callFunction(
            ADDRESSES.ZERO,
            {
              owner: testOrder.makerAccountOwner,
              number: testOrder.makerAccountNumber.toFixed(0),
            },
            [],
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Succeeds for null order', async () => {
      const canceler = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await cancelTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Canceled);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);
      const log = logs[2];
      expect(log.name).toEqual('LogLimitOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
      expect(log.args.makerMarket).toEqual(testOrder.makerMarket);
      expect(log.args.takerMarket).toEqual(testOrder.takerMarket);
    });

    it('Succeeds for approved order', async () => {
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      await cancelTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Succeeds for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await cancelTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        cancelTestOrder(rando),
        'LimitOrders: Canceler must be maker',
      );
    });
  });

  describe('integration', () => {
    it('Fills an order multiple times up to the limit', async () => {
      // fill once
      await fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(2) });
      await expectBalances(
        defaultTakerAmount.div(2),
        defaultMakerAmount.div(2),
        defaultTakerAmount.div(2),
        defaultMakerAmount.div(2),
      );
      await expectFilledAmount(testOrder, defaultMakerAmount.div(2));

      // fill twice
      await fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(2) });
      await expectBalances(
        INTEGERS.ZERO,
        defaultMakerAmount,
        defaultTakerAmount,
        INTEGERS.ZERO,
      );
      await expectFilledAmount(testOrder, defaultMakerAmount);

      // fail a third time
      await expectThrow(
        fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(2) }),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Succeeds for logs', async () => {
      const orderHash = solo.limitOrders.getOrderHash(testOrder);

      // fill half, once
      const txResult1 = await fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(2) });
      await expectFilledAmount(testOrder, defaultMakerAmount.div(2));

      // check logs for first tx
      const logs1 = solo.logs.parseLogs(txResult1);
      expect(logs1.length).toEqual(5);
      const logOrderTaken1 = logs1[3];
      expect(logOrderTaken1.name).toEqual('LogLimitOrderFilled');
      expect(logOrderTaken1.args.orderHash).toEqual(orderHash);
      expect(logOrderTaken1.args.orderMaker).toEqual(testOrder.makerAccountOwner);
      expect(logOrderTaken1.args.makerFillAmount).toEqual(defaultMakerAmount.div(2));
      expect(logOrderTaken1.args.totalMakerFilledAmount).toEqual(defaultMakerAmount.div(2));

      // wait so that the indexes will update
      await mineAvgBlock();

      // fill a quarter
      const txResult2 = await fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(4) });
      await expectFilledAmount(testOrder, defaultMakerAmount.times(3).div(4));

      // check logs for second tx
      const logs2 = solo.logs.parseLogs(txResult2);
      expect(logs2.length).toEqual(5);
      const logOrderTaken2 = logs2[3];
      expect(logOrderTaken2.name).toEqual('LogLimitOrderFilled');
      expect(logOrderTaken2.args.orderHash).toEqual(orderHash);
      expect(logOrderTaken2.args.orderMaker).toEqual(testOrder.makerAccountOwner);
      expect(logOrderTaken2.args.makerFillAmount).toEqual(defaultMakerAmount.div(4));
      expect(logOrderTaken2.args.totalMakerFilledAmount)
        .toEqual(defaultMakerAmount.times(3).div(4));
    });
  });

  describe('getOrderStates', () => {
    it('Succeeds for multiple orders', async () => {
      const canceler = accounts[0];
      const approver = accounts[1];
      const testOrderCancel = { ...testOrder, makerAccountOwner: canceler };
      const testOrderApprove = { ...testOrder, makerAccountOwner: approver };
      testOrderCancel.typedSignature =
        await solo.limitOrders.signOrder(testOrderCancel, SigningMethod.TypedData);
      testOrderApprove.typedSignature =
        await solo.limitOrders.signOrder(testOrderApprove, SigningMethod.TypedData);

      await Promise.all([
        solo.limitOrders.approveOrder(testOrderApprove, { from: approver }),
        solo.limitOrders.cancelOrder(testOrderCancel, { from: canceler }),
        fillLimitOrder(testOrder, { amount: defaultTakerAmount.div(2) }),
      ]);
      const states1 = await solo.limitOrders.getOrderStates([
        testOrder,
        testOrderCancel,
        testOrderApprove,
      ]);
      expect(states1).toEqual([
        { status: LimitOrderStatus.Null, totalMakerFilledAmount: testOrder.makerAmount.div(2) },
        { status: LimitOrderStatus.Canceled, totalMakerFilledAmount: INTEGERS.ZERO },
        { status: LimitOrderStatus.Approved, totalMakerFilledAmount: INTEGERS.ZERO },
      ]);
    });
  });

  describe('getAccountCollateralizationAfterMakingOrders', () => {
    it('succeeds for x/0=infinity', async () => {
      expect(
        solo.limitOrders.getAccountCollateralizationAfterMakingOrders(
          [defaultMakerAmount, INTEGERS.ZERO],
          [new BigNumber(2), new BigNumber(1)],
          [testOrder],
          [testOrder.makerAmount],
        ),
      ).toEqual(
        new BigNumber(Infinity),
      );
    });

    it('succeeds for 0/0=infinity', async () => {
      expect(
        solo.limitOrders.getAccountCollateralizationAfterMakingOrders(
          [INTEGERS.ZERO, INTEGERS.ZERO],
          [],
          [],
          [],
        ),
      ).toEqual(
        new BigNumber(Infinity),
      );
    });

    it('succeeds for zero', async () => {
      expect(
        solo.limitOrders.getAccountCollateralizationAfterMakingOrders(
          [INTEGERS.ZERO, defaultTakerAmount.times(-1)],
          [new BigNumber(2), new BigNumber(1)],
          [testOrder],
          [testOrder.makerAmount],
        ),
      ).toEqual(
        new BigNumber(0),
      );
    });

    it('succeeds for one', async () => {
      expect(
        solo.limitOrders.getAccountCollateralizationAfterMakingOrders(
          [INTEGERS.ZERO, INTEGERS.ZERO],
          [new BigNumber(2), new BigNumber(1)],
          [testOrder],
          [testOrder.makerAmount],
        ),
      ).toEqual(
        new BigNumber(1),
      );
    });

    it('succeeds for two orders', async () => {
      expect(
        solo.limitOrders.getAccountCollateralizationAfterMakingOrders(
          [INTEGERS.ZERO, INTEGERS.ZERO],
          [new BigNumber(2), new BigNumber(1)],
          [testOrder, testOrder],
          [testOrder.makerAmount.div(2), testOrder.makerAmount.div(2)],
        ),
      ).toEqual(
        new BigNumber(1),
      );
    });
  });
});

// ============ Helper Functions ============

async function fillLimitOrder(
  order: SignedLimitOrder,
  {
    taker = defaultTakerAddress,
    takerNumber = defaultTakerNumber,
    amount = defaultTakerAmount,
    denominatedInMakerAmount = false,
  },
) {
  return solo.operation.initiate().fillSignedLimitOrder(
    taker,
    takerNumber,
    order,
    amount,
    denominatedInMakerAmount,
  ).commit({ from: taker });
}

function limitOrderToTradeData(
  order: SignedLimitOrder,
) {
  return {
    primaryAccountOwner: order.takerAccountOwner,
    primaryAccountId: order.takerAccountNumber,
    autoTrader: solo.contracts.limitOrders.options.address,
    inputMarketId: order.takerMarket,
    outputMarketId: order.makerMarket,
    otherAccountOwner: order.makerAccountOwner,
    otherAccountId: order.makerAccountNumber,
    amount: {
      denomination: AmountDenomination.Wei,
      reference: AmountReference.Delta,
      value: order.takerAmount,
    },
    data: toBytes(solo.limitOrders.signedOrderToBytes(order)),
  };
}

async function expectBalances(
  takerTakerExpected: Integer,
  takerMakerExpected: Integer,
  makerTakerExpected: Integer,
  makerMakerExpected: Integer,
) {
  const [
    takerTakerWei,
    takerMakerWei,
    makerTakerWei,
    makerMakerWei,
  ] = await Promise.all([
    solo.getters.getAccountWei(
      testOrder.takerAccountOwner,
      testOrder.takerAccountNumber,
      defaultTakerMarket,
    ),
    solo.getters.getAccountWei(
      testOrder.takerAccountOwner,
      testOrder.takerAccountNumber,
      defaultMakerMarket,
    ),
    solo.getters.getAccountWei(
      testOrder.makerAccountOwner,
      testOrder.makerAccountNumber,
      defaultTakerMarket,
    ),
    solo.getters.getAccountWei(
      testOrder.makerAccountOwner,
      testOrder.makerAccountNumber,
      defaultMakerMarket,
    ),
  ]);
  expect(takerTakerWei).toEqual(takerTakerExpected);
  expect(takerMakerWei).toEqual(takerMakerExpected);
  expect(makerTakerWei).toEqual(makerTakerExpected);
  expect(makerMakerWei).toEqual(makerMakerExpected);
}

async function expectFilledAmount(
  order: LimitOrder,
  expectedFilledAmount: Integer,
) {
  const states = await solo.limitOrders.getOrderStates([order]);
  expect(states[0].totalMakerFilledAmount).toEqual(expectedFilledAmount);
}

async function expectStatus(
  order: LimitOrder,
  expectedStatus: LimitOrderStatus,
) {
  const states = await solo.limitOrders.getOrderStates([order]);
  expect(states[0].status).toEqual(expectedStatus);
}
