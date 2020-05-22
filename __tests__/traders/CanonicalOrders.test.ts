import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { setupMarkets } from '../helpers/SoloHelpers';
import { toBytes, hexStringToBytes } from '../../src/lib/BytesHelper';
import {
  address,
  AmountDenomination,
  AmountReference,
  Integer,
  CanonicalOrder,
  SignedCanonicalOrder,
  LimitOrderStatus,
  SigningMethod,
} from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
const BIP = new BigNumber('1e-4');
const MINIMAL_PRICE_INCREMENT = new BigNumber('1e-18');
const MINIMAL_FEE_INCREMENT = new BigNumber('1e-18');
const baseMarket = new BigNumber(0);
const quoteMarket = new BigNumber(1);
const incorrectMarket = new BigNumber(2);
const defaultMakerNumber = new BigNumber(111);
const defaultTakerNumber = new BigNumber(222);
const defaultAmount = new BigNumber('16e18');
const defaultPrice = new BigNumber('160');
const defaultQuoteAmount = defaultAmount.times(defaultPrice);
const defaultLimitFee = BIP.times(20);
let admin: address;
let defaultMakerAddress: address;
let defaultTakerAddress: address;
let rando: address;

let testOrder: SignedCanonicalOrder;
let noFeeOrder: SignedCanonicalOrder;
let negativeFeeOrder: SignedCanonicalOrder;
let sellOrder: SignedCanonicalOrder;
let decreaseOrder: SignedCanonicalOrder;
let reverseDecreaseOrder: SignedCanonicalOrder;

describe('CanonicalOrders', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    defaultMakerAddress = accounts[6];
    defaultTakerAddress = await solo.canonicalOrders.getTakerAddress();
    rando = accounts[9];

    testOrder = {
      baseMarket,
      quoteMarket,
      isBuy: true,
      isDecreaseOnly: false,
      amount: defaultAmount,
      limitPrice: defaultPrice,
      triggerPrice: INTEGERS.ZERO,
      limitFee: defaultLimitFee,
      makerAccountOwner: defaultMakerAddress,
      makerAccountNumber: defaultMakerNumber,
      expiration: INTEGERS.ONES_31,
      salt: new BigNumber(100),
      typedSignature: null,
    };
    testOrder.typedSignature =
        await solo.canonicalOrders.signOrder(testOrder, SigningMethod.TypedData);
    [
      sellOrder,
      noFeeOrder,
      negativeFeeOrder,
      decreaseOrder,
      reverseDecreaseOrder,
    ] = await Promise.all([
      getModifiedTestOrder({ isBuy: false }),
      getModifiedTestOrder({ limitFee: INTEGERS.ZERO }),
      getModifiedTestOrder({ limitFee: defaultLimitFee.negated() }),
      getModifiedTestOrder({ isDecreaseOnly: true }),
      getModifiedTestOrder({ isBuy: false, isDecreaseOnly: true }),
    ]);

    await resetEVM();

    // set balances
    await setupMarkets(solo, accounts);
    await
    await Promise.all([
      setBalances(defaultAmount, INTEGERS.ZERO, INTEGERS.ZERO, defaultQuoteAmount),
      solo.testing.priceOracle.setPrice(solo.testing.tokenA.getAddress(), defaultPrice),
      solo.testing.priceOracle.setPrice(solo.testing.tokenB.getAddress(), INTEGERS.ONE),
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
      order.typedSignature = await solo.canonicalOrders.signOrder(order, SigningMethod.Hash);
      expect(solo.canonicalOrders.orderHasValidSignature(order)).toBe(true);
    });

    it('Succeeds for eth_signTypedData', async () => {
      const order = { ...testOrder };
      order.typedSignature = await solo.canonicalOrders.signOrder(order, SigningMethod.TypedData);
      expect(solo.canonicalOrders.orderHasValidSignature(order)).toBe(true);
    });

    it('Recognizes a bad signature', async () => {
      const order = { ...testOrder };
      order.typedSignature = `0x${'1b'.repeat(65)}00`;
      expect(solo.canonicalOrders.orderHasValidSignature(order)).toBe(false);
    });
  });

  describe('Signing CancelOrders', () => {
    it('Succeeds for eth.sign', async () => {
      const order = { ...testOrder };
      const cancelSig = await solo.canonicalOrders.signCancelOrder(order, SigningMethod.Hash);
      expect(solo.canonicalOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(true);
    });

    it('Succeeds for eth_signTypedData', async () => {
      const order = { ...testOrder };
      const cancelSig = await solo.canonicalOrders.signCancelOrder(order, SigningMethod.TypedData);
      expect(solo.canonicalOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(true);
    });

    it('Recognizes a bad signature', async () => {
      const order = { ...testOrder };
      const cancelSig = `0x${'1b'.repeat(65)}00`;
      expect(solo.canonicalOrders.cancelOrderHasValidSignature(order, cancelSig)).toBe(false);
    });
  });

  describe('shutDown', () => {
    it('Succeeds', async () => {
      expect(await solo.canonicalOrders.isOperational()).toBe(true);
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(false);
    });

    it('Succeeds when it is already shutDown', async () => {
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(false);
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(false);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.canonicalOrders.methods.shutDown(),
          { from: rando },
        ),
      );
    });
  });

  describe('startUp', () => {
    it('Succeeds after being shutDown', async () => {
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.shutDown(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(false);
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.startUp(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(true);
    });

    it('Succeeds when it is already operational', async () => {
      expect(await solo.canonicalOrders.isOperational()).toBe(true);
      await solo.contracts.send(
        solo.contracts.canonicalOrders.methods.startUp(),
        { from: admin },
      );
      expect(await solo.canonicalOrders.isOperational()).toBe(true);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.canonicalOrders.methods.startUp(),
          { from: rando },
        ),
      );
    });
  });

  describe('setTakerAddress', () => {
    it('Succeeds for owner', async () => {
      expect(await solo.canonicalOrders.getTakerAddress()).toBe(admin);
      await solo.canonicalOrders.setTakerAddress(rando, { from: admin });
      expect(await solo.canonicalOrders.getTakerAddress()).toBe(rando);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.canonicalOrders.setTakerAddress(rando, { from: rando }),
      );
    });
  });

  describe('getTradeCost', () => {
    it('Succeeds for makerAmount specified', async () => {
      const txResult = await fillOrder(testOrder, {});
      await expectBalances(INTEGERS.ZERO, defaultQuoteAmount, defaultAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrder, defaultAmount);
      console.log(`\tCanonicalOrder Trade gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds for takerAmount specified', async () => {
      await solo.operation.initiate().trade({
        ...orderToTradeData(testOrder),
        inputMarketId: quoteMarket,
        outputMarketId: baseMarket,
        amount: {
          denomination: AmountDenomination.Wei,
          reference: AmountReference.Delta,
          value: defaultQuoteAmount.negated(),
        },
      }).commit({ from: defaultTakerAddress }),
      await expectBalances(INTEGERS.ZERO, defaultQuoteAmount, defaultAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrder, defaultAmount);
    });

    it('Succeeds for zero expiry', async () => {
      const testOrderNoExpiry = await getModifiedTestOrder({
        expiration: INTEGERS.ZERO,
      });
      await fillOrder(testOrderNoExpiry, {});
      await expectBalances(INTEGERS.ZERO, defaultQuoteAmount, defaultAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrderNoExpiry, defaultAmount);
    });

    it('Succeeds for pre-approved order', async () => {
      // create order without signature
      const testOrderNoSig = { ...testOrder };
      delete testOrderNoSig.typedSignature;

      // approve order
      await solo.canonicalOrders.approveOrder(
        testOrderNoSig,
        { from: testOrder.makerAccountOwner },
      );

      // verify okay
      await fillOrder(testOrderNoSig, {});
      await expectBalances(INTEGERS.ZERO, defaultQuoteAmount, defaultAmount, INTEGERS.ZERO);
      await expectFilledAmount(testOrderNoSig, defaultAmount);
    });

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.canonicalOrders.methods.getTradeCost(
            baseMarket.toFixed(0),
            quoteMarket.toFixed(0),
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
        solo.contracts.canonicalOrders.methods.shutDown(),
        { from: admin },
      );
      await expectThrow(
        fillOrder(testOrder, {}),
        'CanonicalOrders: Contract is not operational',
      );
    });

    it('Fails for inputWei of zero', async () => {
      await expectThrow(
        fillOrder(testOrder, { amount: INTEGERS.ZERO }),
        'CanonicalOrders: InputWei is zero',
      );
    });

    it('Fails for inputMarket mismatch', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          inputMarketId: incorrectMarket,
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Market mismatch',
      );
    });

    it('Fails for outputMarket mismatch', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          outputMarketId: incorrectMarket,
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Market mismatch',
      );
    });

    it('Fails for switching makerMarket and takerMarket', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          inputMarketId: quoteMarket,
          outputMarketId: baseMarket,
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: InputWei sign mismatch',
      );
    });

    it('Fails to overfill order for output amount', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          inputMarketId: quoteMarket,
          outputMarketId: baseMarket,
          amount: {
            denomination: AmountDenomination.Wei,
            reference: AmountReference.Delta,
            value: defaultQuoteAmount.times(-1.01),
          },
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Cannot overfill order',
      );
    });

    it('Fails to overfill order', async () => {
      await expectThrow(
        fillOrder(testOrder, { amount: testOrder.amount.plus(5) }),
        'CanonicalOrders: Cannot overfill order',
      );
    });

    it('Fails for canceled order', async () => {
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await expectThrow(
        fillOrder(testOrder, {}),
        'CanonicalOrders: Order canceled',
      );
    });

    it('Fails for expired order', async () => {
      const testOrderExpired = await getModifiedTestOrder({
        expiration: INTEGERS.ONE,
      });
      await expectThrow(
        fillOrder(testOrderExpired, {}),
        'CanonicalOrders: Order expired',
      );
    });

    it('Fails for incorrect taker', async () => {
      await expectThrow(
        fillOrder(testOrder, { taker: rando }),
        'CanonicalOrders: Order taker mismatch',
      );
    });

    it('Fails for incorrect maker account', async () => {
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          otherAccountOwner: defaultTakerAddress,
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Order maker account mismatch',
      );
      await expectThrow(
        solo.operation.initiate().trade({
          ...orderToTradeData(testOrder),
          otherAccountId: defaultMakerNumber.plus(1),
        }).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Order maker account mismatch',
      );
    });

    it('Fails for invalid signature', async () => {
      const invalidSignature1 = `0x${'00'.repeat(65)}05`;
      const invalidSignature2 = `0x${'00'.repeat(65)}01`;
      const testOrderInvalidSig1 = { ...testOrder, typedSignature: invalidSignature1 };
      const testOrderInvalidSig2 = { ...testOrder, typedSignature: invalidSignature2 };
      await expectThrow(
        fillOrder(testOrderInvalidSig1, {}),
        'TypedSignature: Invalid signature type',
      );
      await expectThrow(
        fillOrder(testOrderInvalidSig2, {}),
        'CanonicalOrders: Order invalid signature',
      );
    });

    it('Fails for no signature data', async () => {
      const testOrderShortSig = { ...testOrder, typedSignature: '0x' };
      await expectThrow(
        fillOrder(testOrderShortSig, {}),
        'CanonicalOrders: Cannot parse signature from data',
      );
    });

    it('Fails for bad data length', async () => {
      await expectThrow(
        fillOrder({ ...testOrder, typedSignature: '0x0000' }, {}),
        'CanonicalOrders: Cannot parse order from data',
      );
      await expectThrow(
        fillOrder({ ...testOrder, typedSignature: `0x${'00'.repeat(100)}` }, {}),
        'CanonicalOrders: Cannot parse order from data',
      );
    });

    it('Fails for bad order data', async () => {
      await expectThrow(
        solo.operation.initiate().trade(
          {
            ...orderToTradeData(testOrder),
            data: [[255], [255]],
          },
        ).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Cannot parse order from data',
      );
    });
  });

  describe('constructor', () => {
    it('Sets constants correctly', async () => {
      const [
        domainHash,
        soloMarginAddress,
      ] = await Promise.all([
        solo.contracts.call(solo.contracts.canonicalOrders.methods.EIP712_DOMAIN_HASH()),
        solo.contracts.call(solo.contracts.canonicalOrders.methods.SOLO_MARGIN()),
      ]);
      const expectedDomainHash = solo.canonicalOrders.getDomainHash();
      expect(domainHash).toEqual(expectedDomainHash);
      expect(soloMarginAddress).toEqual(solo.contracts.soloMargin.options.address);
    });
  });

  describe('approveOrder', () => {
    it('Succeeds for null order', async () => {
      const approver = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await solo.canonicalOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogCanonicalOrderApproved');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
    });

    it('Succeeds for approved order', async () => {
      const approver = testOrder.makerAccountOwner;
      await solo.canonicalOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      const txResult = await solo.canonicalOrders.approveOrder(testOrder, { from: approver });
      await expectStatus(testOrder, LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogCanonicalOrderApproved');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
    });

    it('Fails for canceled order', async () => {
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        solo.canonicalOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner }),
        'CanonicalOrders: Cannot approve canceled order',
      );
    });
  });

  describe('cancelOrder', () => {
    it('Succeeds for null order', async () => {
      const canceler = testOrder.makerAccountOwner;
      await expectStatus(testOrder, LimitOrderStatus.Null);
      const txResult = await solo.canonicalOrders.cancelOrder(testOrder, { from: canceler });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogCanonicalOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
    });

    it('Succeeds for approved order', async () => {
      await solo.canonicalOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Succeeds for canceled order', async () => {
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        solo.canonicalOrders.cancelOrder(testOrder, { from: rando }),
        'CanonicalOrders: Canceler must be maker',
      );
    });
  });

  describe('callFunction: bad data', () => {
    it('Fails for bad callFunction type', async () => {
      const badType = new BigNumber(2);
      await expectThrow(
        solo.operation.initiate().call({
          primaryAccountOwner: defaultTakerAddress,
          primaryAccountId: defaultTakerNumber,
          callee: solo.contracts.canonicalOrders.options.address,
          data: toBytes(
            badType,
            solo.canonicalOrders.getOrderHash(testOrder),
          ),
        }).commit({ from: defaultTakerAddress }),
      );
    });

    it('Fails for too-short data', async () => {
      await expectThrow(
        solo.operation.initiate().call({
          primaryAccountOwner: defaultTakerAddress,
          primaryAccountId: defaultTakerNumber,
          callee: solo.contracts.canonicalOrders.options.address,
          data: toBytes(
            solo.canonicalOrders.getOrderHash(testOrder),
          ),
        }).commit({ from: defaultTakerAddress }),
      );
    });
  });

  describe('callFunction: approve', () => {
    async function approveTestOrder(from?: address) {
      return solo.operation.initiate().approveCanonicalOrder({
        primaryAccountOwner: from || testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: from || testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.canonicalOrders.methods.callFunction(
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
      expect(log.name).toEqual('LogCanonicalOrderApproved');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
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
      expect(log.name).toEqual('LogCanonicalOrderApproved');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
    });

    it('Fails for canceled order', async () => {
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        approveTestOrder(),
        'CanonicalOrders: Cannot approve canceled order',
      );
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        approveTestOrder(rando),
        'CanonicalOrders: Approver must be maker',
      );
    });
  });

  describe('callFunction: cancel', () => {
    async function cancelTestOrder(from?: address) {
      return solo.operation.initiate().cancelCanonicalOrder({
        primaryAccountOwner: from || testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: from || testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.canonicalOrders.methods.callFunction(
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
      expect(log.name).toEqual('LogCanonicalOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.canonicalOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
      expect(log.args.baseMarket).toEqual(testOrder.baseMarket);
      expect(log.args.quoteMarket).toEqual(testOrder.quoteMarket);
    });

    it('Succeeds for approved order', async () => {
      await solo.canonicalOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Approved);
      await cancelTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Succeeds for canceled order', async () => {
      await solo.canonicalOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
      await cancelTestOrder();
      await expectStatus(testOrder, LimitOrderStatus.Canceled);
    });

    it('Fails for non-maker', async () => {
      await expectThrow(
        cancelTestOrder(rando),
        'CanonicalOrders: Canceler must be maker',
      );
    });
  });

  describe('', () => {
    async function getCurrentPrice() {
      const [
        basePrice,
        quotePrice,
      ] = await Promise.all([
        solo.getters.getMarketPrice(baseMarket),
        solo.getters.getMarketPrice(quoteMarket),
      ]);
      return basePrice.div(quotePrice);
    }

    it('Succeeds for met triggerPrice (buy)', async () => {
      const triggerPrice = await getCurrentPrice();
      const order = await getModifiedTestOrder({ triggerPrice });
      const txResult = await fillOrder(order, {});
      console.log(`\tCanonicalOrder Trade (w/ triggerPrice) gas used: ${txResult.gasUsed}`);
    });

    it('Fails for unmet triggerPrice (buy)', async () => {
      const triggerPrice = (await getCurrentPrice()).plus(MINIMAL_PRICE_INCREMENT);
      const order = await getModifiedTestOrder({ triggerPrice });
      await expectThrow(
        fillOrder(order, {}),
        'CanonicalOrders: Order triggerPrice not triggered',
      );
    });

    it('Succeeds for met triggerPrice (sell)', async () => {
      await setBalances(INTEGERS.ZERO, defaultQuoteAmount, defaultAmount, INTEGERS.ZERO);
      const triggerPrice = await getCurrentPrice();
      const order = await getModifiedTestOrder({ triggerPrice, isBuy: false });
      await fillOrder(order, {});
    });

    it('Fails for unmet triggerPrice (sell)', async () => {
      const triggerPrice = (await getCurrentPrice()).minus(MINIMAL_PRICE_INCREMENT);
      const order = await getModifiedTestOrder({ triggerPrice, isBuy: false });
      await expectThrow(
        fillOrder(order, {}),
        'CanonicalOrders: Order triggerPrice not triggered',
      );
    });
  });

  describe('decreaseOnly', () => {
    describe('long position', () => {
      beforeEach(async () => {
        await setBalances(
          defaultAmount,
          defaultQuoteAmount,
          defaultAmount.div(2),
          defaultQuoteAmount.div(-8),
        );
      });

      it('Succeeds for full close', async () => {
        await solo.operation.initiate().fillDecreaseOnlyCanonicalOrder(
          defaultTakerAddress,
          defaultTakerNumber,
          reverseDecreaseOrder,
          reverseDecreaseOrder.limitPrice,
          INTEGERS.ZERO,
        ).commit({ from: defaultTakerAddress });
        await expectBalances(
          defaultAmount.times(9).div(8),
          defaultQuoteAmount.times(7).div(8),
          defaultAmount.times(3).div(8),
          INTEGERS.ZERO,
        );
      });

      it('Succeeds for decreasing', async () => {
        const fillOptions = { amount: defaultAmount.div(16) };
        await fillOrder(reverseDecreaseOrder, fillOptions);
        await fillOrder(reverseDecreaseOrder, fillOptions);
        await expectBalances(
          defaultAmount.times(9).div(8),
          defaultQuoteAmount.times(7).div(8),
          defaultAmount.times(3).div(8),
          INTEGERS.ZERO,
        );

        // cannot go past zero
        await expectThrow(
          fillOrder(reverseDecreaseOrder, fillOptions),
          'CanonicalOrders: outputMarket not decreased',
        );
      });

      it('Fails when market crosses', async () => {
        await expectThrow(
          fillOrder(reverseDecreaseOrder, { amount: defaultAmount.div(4) }),
          'CanonicalOrders: outputMarket not decreased',
        );
        await expectThrow(
          fillOrder(reverseDecreaseOrder, { amount: defaultAmount.div(2) }),
          'CanonicalOrders: outputMarket not decreased',
        );
      });

      it('Fails when increasing position', async () => {
        await expectThrow(
          fillOrder(decreaseOrder, { amount: INTEGERS.ONE }),
          'CanonicalOrders: inputMarket not decreased',
        );
      });
    });

    describe('short position', () => {
      beforeEach(async () => {
        await setBalances(
          defaultAmount,
          defaultQuoteAmount,
          defaultAmount.div(-8),
          defaultQuoteAmount.div(2),
        );
      });

      it('Succeeds for full close', async () => {
        await solo.operation.initiate().fillDecreaseOnlyCanonicalOrder(
          defaultTakerAddress,
          defaultTakerNumber,
          decreaseOrder,
          decreaseOrder.limitPrice,
          INTEGERS.ZERO,
        ).commit({ from: defaultTakerAddress });
        await expectBalances(
          defaultAmount.times(7).div(8),
          defaultQuoteAmount.times(9).div(8),
          INTEGERS.ZERO,
          defaultQuoteAmount.times(3).div(8),
        );
      });

      it('Succeeds for decreasing', async () => {
        const fillOptions = { amount: defaultAmount.div(16) };
        await fillOrder(decreaseOrder, fillOptions);
        await fillOrder(decreaseOrder, fillOptions);
        await expectBalances(
          defaultAmount.times(7).div(8),
          defaultQuoteAmount.times(9).div(8),
          INTEGERS.ZERO,
          defaultQuoteAmount.times(3).div(8),
        );

        // cannot go past zero
        await expectThrow(
          fillOrder(decreaseOrder, fillOptions),
          'CanonicalOrders: inputMarket not decreased',
        );
      });

      it('Fails when market crosses', async () => {
        await expectThrow(
          fillOrder(decreaseOrder, { amount: defaultAmount.div(4) }),
          'CanonicalOrders: inputMarket not decreased',
        );
        await expectThrow(
          fillOrder(decreaseOrder, { amount: defaultAmount.div(2) }),
          'CanonicalOrders: inputMarket not decreased',
        );
      });

      it('Fails when increasing position', async () => {
        await expectThrow(
          fillOrder(reverseDecreaseOrder, { amount: INTEGERS.ONE }),
          'CanonicalOrders: inputMarket not decreased',
        );
      });
    });

    describe('zero position', () => {
      beforeEach(async () => {
        await setBalances(defaultAmount, defaultQuoteAmount, INTEGERS.ZERO, INTEGERS.ZERO);
      });

      it('Fails when position was originally zero', async () => {
        await expectThrow(
          fillOrder(decreaseOrder, { amount: INTEGERS.ONE }),
          'CanonicalOrders: inputMarket not decreased',
        );
      });
    });
  });

  describe('prices', () => {
    it('Cannot violate limitPrice (buy)', async () => {
      const buyOrder = testOrder;
      await expectThrow(
        fillOrder(buyOrder, { price: buyOrder.limitPrice.plus(MINIMAL_PRICE_INCREMENT) }),
        'CanonicalOrders: Fill invalid price',
      );
    });

    it('Cannot violate limitPrice (sell)', async () => {
      const sellOrder = await getModifiedTestOrder({ isBuy: false });
      await expectThrow(
        fillOrder(sellOrder, { price: sellOrder.limitPrice.minus(MINIMAL_PRICE_INCREMENT) }),
        'CanonicalOrders: Fill invalid price',
      );
    });

    it('Can buy at reduced price', async () => {
      const buyOrder = testOrder;
      await fillOrder(buyOrder, { price: buyOrder.limitPrice.div(2) });
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.div(2),
        defaultAmount,
        defaultQuoteAmount.div(2),
      );
    });

    it('Can sell at increased price', async () => {
      await setBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.times(2),
        defaultAmount,
        INTEGERS.ZERO,
      );
      const sellOrder = await getModifiedTestOrder({ isBuy: false });
      await fillOrder(sellOrder, { price: sellOrder.limitPrice.times(2) });
      await expectBalances(
        defaultAmount,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
        defaultQuoteAmount.times(2),
      );
    });
  });

  describe('fees', () => {
    const INVALID_FEE_MESSAGE = 'CanonicalOrders: Fill invalid fee';

    it('Cannot violate fees', async () => {
      await expectThrow(
        fillOrder(testOrder, { fee: testOrder.limitFee.plus(MINIMAL_FEE_INCREMENT) }),
        INVALID_FEE_MESSAGE,
      );
      await expectThrow(
        fillOrder(noFeeOrder, { fee: INTEGERS.ONE }),
        INVALID_FEE_MESSAGE,
      );
      await expectThrow(
        fillOrder(negativeFeeOrder, { fee: INTEGERS.ZERO }),
        INVALID_FEE_MESSAGE,
      );
      await expectThrow(
        fillOrder(negativeFeeOrder, { fee: negativeFeeOrder.limitFee.plus(MINIMAL_FEE_INCREMENT) }),
        INVALID_FEE_MESSAGE,
      );
    });

    it('Can take zero fee for a zero fee order', async () => {
      await fillOrder(noFeeOrder, { fee: INTEGERS.ZERO });
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
    });

    it('Can take negative fee for a zero fee order', async () => {
      await fillOrder(noFeeOrder, { fee: testOrder.limitFee.negated() });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.minus(feeAmount),
        defaultAmount,
        feeAmount,
      );
    });

    it('Can take a satisfying negative fee', async () => {
      await fillOrder(negativeFeeOrder, { fee: negativeFeeOrder.limitFee });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.minus(feeAmount),
        defaultAmount,
        feeAmount,
      );
    });

    it('Can take an extra-negative fee', async () => {
      await fillOrder(negativeFeeOrder, { fee: negativeFeeOrder.limitFee.times(2) });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee).times(2);
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.minus(feeAmount),
        defaultAmount,
        feeAmount,
      );
    });

    it('Positive fees work properly for buys', async () => {
      await fillOrder(testOrder, { fee: testOrder.limitFee });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.plus(feeAmount),
        defaultAmount,
        feeAmount.negated(),
      );
    });

    it('Zero fees work properly for buys', async () => {
      await fillOrder(testOrder, { fee: INTEGERS.ZERO });
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
    });

    it('Negative fees work properly for buys', async () => {
      await fillOrder(testOrder, { fee: testOrder.limitFee.negated() });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount.minus(feeAmount),
        defaultAmount,
        feeAmount,
      );
    });

    it('Positive fees work properly for sells', async () => {
      await setBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
      await fillOrder(sellOrder, { fee: sellOrder.limitFee });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        defaultAmount,
        feeAmount,
        INTEGERS.ZERO,
        defaultQuoteAmount.minus(feeAmount),
      );
    });

    it('Zero fees work properly for sells', async () => {
      await setBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
      await fillOrder(sellOrder, { fee: INTEGERS.ZERO });
      await expectBalances(
        defaultAmount,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
        defaultQuoteAmount,
      );
    });

    it('Negative fees work properly for sells', async () => {
      await setBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
      await fillOrder(sellOrder, { fee: sellOrder.limitFee.negated() });
      const feeAmount = defaultQuoteAmount.times(defaultLimitFee);
      await expectBalances(
        defaultAmount,
        feeAmount.negated(),
        INTEGERS.ZERO,
        defaultQuoteAmount.plus(feeAmount),
      );
    });
  });

  describe('loading fillArgs', () => {
    it('Succeeds in loading in a price', async () => {
      const txResult = await solo.operation.initiate().setCanonicalOrderFillArgs(
        defaultTakerAddress,
        defaultTakerNumber,
        testOrder.limitPrice,
        INTEGERS.ZERO,
      ).fillCanonicalOrder(
        defaultTakerAddress,
        defaultTakerNumber,
        testOrder,
        testOrder.amount,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
      ).commit({ from: defaultTakerAddress });
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
      console.log(`\tCanonicalOrder Trade (w/ setting fillArgs) gas used: ${txResult.gasUsed}`);
    });

    it('Cannot load in a null price', async () => {
      await expectThrow(
        fillOrder(testOrder, { price: INTEGERS.ZERO }),
        'CanonicalOrders: FillArgs loaded price is zero',
      );
    });

    it('Cannot load in a price past the limit', async () => {
      await expectThrow(
        solo.operation.initiate().setCanonicalOrderFillArgs(
          defaultTakerAddress,
          defaultTakerNumber,
          testOrder.limitPrice.times(2),
          INTEGERS.ZERO,
        ).fillCanonicalOrder(
          defaultTakerAddress,
          defaultTakerNumber,
          testOrder,
          testOrder.amount,
          INTEGERS.ZERO,
          INTEGERS.ZERO,
        ).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Fill invalid price',
      );
    });

    it('Cannot load in a fee past the limit', async () => {
      await expectThrow(
        solo.operation.initiate().setCanonicalOrderFillArgs(
          defaultTakerAddress,
          defaultTakerNumber,
          testOrder.limitPrice,
          testOrder.limitFee.times(2),
        ).fillCanonicalOrder(
          defaultTakerAddress,
          defaultTakerNumber,
          testOrder,
          testOrder.amount,
          INTEGERS.ZERO,
          INTEGERS.ZERO,
        ).commit({ from: defaultTakerAddress }),
        'CanonicalOrders: Fill invalid fee',
      );
    });
  });

  describe('integration', () => {
    it('Fills an order multiple times up to the limit', async () => {
      // fill once
      await fillOrder(testOrder, { amount: defaultAmount.div(2) });
      await expectBalances(
        defaultAmount.div(2),
        defaultQuoteAmount.div(2),
        defaultAmount.div(2),
        defaultQuoteAmount.div(2),
      );
      await expectFilledAmount(testOrder, defaultAmount.div(2));

      // fill twice
      await fillOrder(testOrder, { amount: defaultAmount.div(2) });
      await expectBalances(
        INTEGERS.ZERO,
        defaultQuoteAmount,
        defaultAmount,
        INTEGERS.ZERO,
      );
      await expectFilledAmount(testOrder, defaultAmount);

      // fail a third time
      await expectThrow(
        fillOrder(testOrder, { amount: defaultAmount.div(2) }),
        'CanonicalOrders: Cannot overfill order',
      );
    });

    it('Succeeds for logs', async () => {
      const order = await getModifiedTestOrder({ triggerPrice: INTEGERS.ONE });
      const orderHash = solo.canonicalOrders.getOrderHash(order);

      // fill half, once
      const txResult1 = await fillOrder(order, { amount: defaultAmount.div(2) });
      await expectFilledAmount(order, defaultAmount.div(2));

      // check logs for first tx
      const logs1 = solo.logs.parseLogs(txResult1);
      expect(logs1.length).toEqual(5);
      const logOrderTaken1 = logs1[3];
      expect(logOrderTaken1.name).toEqual('LogCanonicalOrderFilled');
      expect(logOrderTaken1.args.orderHash).toEqual(orderHash);
      expect(logOrderTaken1.args.orderMaker).toEqual(order.makerAccountOwner);
      expect(logOrderTaken1.args.fillAmount).toEqual(defaultAmount.div(2));
      expect(logOrderTaken1.args.isBuy).toEqual(true);
      expect(logOrderTaken1.args.isDecreaseOnly).toEqual(false);
      expect(logOrderTaken1.args.isNegativeLimitFee).toEqual(false);
      expect(logOrderTaken1.args.triggerPrice).toEqual(new BigNumber('1e18'));
    });
  });

  describe('getOrderStates', () => {
    it('Succeeds for multiple orders', async () => {
      const canceler = accounts[0];
      const approver = accounts[1];
      const testOrderCancel = await getModifiedTestOrder({ makerAccountOwner: canceler });
      const testOrderApprove = await getModifiedTestOrder({ makerAccountOwner: approver });

      await Promise.all([
        solo.canonicalOrders.approveOrder(testOrderApprove, { from: approver }),
        solo.canonicalOrders.cancelOrder(testOrderCancel, { from: canceler }),
        fillOrder(testOrder, { amount: defaultAmount.div(2) }),
      ]);
      const states1 = await solo.canonicalOrders.getOrderStates([
        testOrder,
        testOrderCancel,
        testOrderApprove,
      ]);
      expect(states1).toEqual([
        { status: LimitOrderStatus.Null, totalFilledAmount: testOrder.amount.div(2) },
        { status: LimitOrderStatus.Canceled, totalFilledAmount: INTEGERS.ZERO },
        { status: LimitOrderStatus.Approved, totalFilledAmount: INTEGERS.ZERO },
      ]);
    });
  });
});

// ============ Helper Functions ============

async function fillOrder(
  order: SignedCanonicalOrder,
  {
    taker = defaultTakerAddress,
    takerNumber = defaultTakerNumber,
    amount = order.amount,
    price = order.limitPrice,
    fee = INTEGERS.ZERO,
  },
) {
  return solo.operation.initiate().fillCanonicalOrder(
    taker,
    takerNumber,
    order,
    amount,
    price,
    fee,
  ).commit({ from: taker });
}

function orderToTradeData(
  order: SignedCanonicalOrder,
  price: Integer = order.limitPrice,
  fee: Integer = INTEGERS.ZERO,
) {
  return {
    primaryAccountOwner: defaultTakerAddress,
    primaryAccountId: defaultTakerNumber,
    autoTrader: solo.contracts.canonicalOrders.options.address,
    inputMarketId: order.baseMarket,
    outputMarketId: order.quoteMarket,
    otherAccountOwner: order.makerAccountOwner,
    otherAccountId: order.makerAccountNumber,
    amount: {
      denomination: AmountDenomination.Wei,
      reference: AmountReference.Delta,
      value: order.isBuy ? order.amount : order.amount.negated(),
    },
    data: hexStringToBytes(solo.canonicalOrders.orderToBytes(order, price, fee)),
  };
}

async function setBalances(
  takerBase: Integer,
  takerQuote: Integer,
  makerBase: Integer,
  makerQuote: Integer,
) {
  await Promise.all([
    solo.testing.setAccountBalance(
      defaultTakerAddress,
      defaultTakerNumber,
      baseMarket,
      takerBase,
    ),
    solo.testing.setAccountBalance(
      defaultTakerAddress,
      defaultTakerNumber,
      quoteMarket,
      takerQuote,
    ),
    solo.testing.setAccountBalance(
      defaultMakerAddress,
      defaultMakerNumber,
      baseMarket,
      makerBase,
    ),
    solo.testing.setAccountBalance(
      defaultMakerAddress,
      defaultMakerNumber,
      quoteMarket,
      makerQuote,
    ),
  ]);
}

async function expectBalances(
  takerBaseExpected: Integer,
  takerQuoteExpected: Integer,
  makerBaseExpected: Integer,
  makerQuoteExpected: Integer,
) {
  const [
    takerBaseWei,
    takerQuoteWei,
    makerBaseWei,
    makerQuoteWei,
  ] = await Promise.all([
    solo.getters.getAccountWei(
      defaultTakerAddress,
      defaultTakerNumber,
      baseMarket,
    ),
    solo.getters.getAccountWei(
      defaultTakerAddress,
      defaultTakerNumber,
      quoteMarket,
    ),
    solo.getters.getAccountWei(
      defaultMakerAddress,
      defaultMakerNumber,
      baseMarket,
    ),
    solo.getters.getAccountWei(
      defaultMakerAddress,
      defaultMakerNumber,
      quoteMarket,
    ),
  ]);
  expect(takerBaseWei).toEqual(takerBaseExpected);
  expect(takerQuoteWei).toEqual(takerQuoteExpected);
  expect(makerBaseWei).toEqual(makerBaseExpected);
  expect(makerQuoteWei).toEqual(makerQuoteExpected);
}

async function expectFilledAmount(
  order: CanonicalOrder,
  expectedFilledAmount: Integer,
) {
  const states = await solo.canonicalOrders.getOrderStates([order]);
  expect(states[0].totalFilledAmount).toEqual(expectedFilledAmount);
}

async function expectStatus(
  order: CanonicalOrder,
  expectedStatus: LimitOrderStatus,
) {
  const states = await solo.canonicalOrders.getOrderStates([order]);
  expect(states[0].status).toEqual(expectedStatus);
}

async function getModifiedTestOrder(
  params:any,
):Promise<SignedCanonicalOrder> {
  const result = {
    ...testOrder,
    ...params,
  };
  result.typedSignature = await solo.canonicalOrders.signOrder(result, SigningMethod.TypedData);
  return result;
}
