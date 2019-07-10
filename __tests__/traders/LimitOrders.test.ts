import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { deployContract } from '../helpers/Deploy';
import { setupMarkets } from '../helpers/SoloHelpers';
import LimitOrdersJson from '../../build/published_contracts/LimitOrders.json';
import { toBytes } from '../../src/lib/BytesHelper';
import { integerToValue } from '../../src/lib/Helpers';
import {
  address,
  AmountDenomination,
  AmountReference,
  Integer,
  LimitOrder,
  LimitOrderStatus,
} from '../../src/types';

let limitOrders: any;
let solo: Solo;
let accounts: address[];
let snapshotId: string;
const chainId = 425;
const zero = INTEGERS.ZERO;
const defaultMakerMarket = new BigNumber(0);
const defaultTakerMarket = new BigNumber(1);
const incorrectMarket = new BigNumber(2);
const defaultMakerNumber = new BigNumber(111);
const defaultTakerNumber = new BigNumber(222);
const defaultMakerAmount = new BigNumber('1e10');
const defaultTakerAmount = new BigNumber('2e10');
let defaultMakerAddress: address;
let defaultTakerAddress: address;
let rando: address;

let testOrder: LimitOrder;
let realOrder: LimitOrder;
const defaultWei = new BigNumber(10);

describe('LimitOrders', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;

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
    };
    realOrder = { ...testOrder };

    await resetEVM();

    limitOrders = await deployContract(
      solo,
      LimitOrdersJson,
      [
        solo.getDefaultAccount(),
        chainId,
      ],
    );

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

    await signOrder(testOrder);
    realOrder.signature = await solo.limitOrders.ethSignTypedOrder(realOrder);

    await mineAvgBlock();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('Get trade cost', () => {
    it('Succeeds for negative deltaWei', async () => {
      const txResult = await getTradeCost(
        testOrder,
        defaultMakerAmount.times(-1),
        {
          inputMarket: defaultMakerMarket,
          outputMarket: defaultTakerMarket,
        },
      );
      expect(txResult.result).toEqual({
        sign: true,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultTakerAmount,
      });

      const filledAmount = await getFilledAmount(testOrder);
      expect(filledAmount).toEqual(defaultMakerAmount);
    });

    it('Succeeds for positive deltaWei', async () => {
      const txResult = await getTradeCost(
        testOrder,
        defaultTakerAmount,
        {
          inputMarket: defaultTakerMarket,
          outputMarket: defaultMakerMarket,
        },
      );
      expect(txResult.result).toEqual({
        sign: false,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultMakerAmount,
      });

      const filledAmount = await getFilledAmount(testOrder);
      expect(filledAmount).toEqual(defaultMakerAmount);

      console.log(`\tLimitOrder#TradeCost gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds for no specific taker', async () => {
      const testOrderWithoutTaker = {
        ...testOrder,
        takerAccountOwner: ADDRESSES.ZERO,
        takerAccountNumber: INTEGERS.ZERO,
      };
      await signOrder(testOrderWithoutTaker);
      const txResult = await getTradeCost(
        testOrderWithoutTaker,
        defaultTakerAmount,
        {
          inputMarket: defaultTakerMarket,
          outputMarket: defaultMakerMarket,
        },
      );
      expect(txResult.result).toEqual({
        sign: false,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultMakerAmount,
      });

      const filledAmount = await getFilledAmount(testOrderWithoutTaker);
      expect(filledAmount).toEqual(defaultMakerAmount);
    });

    it('Succeeds for pre-approved order', async () => {
      // approve order
      await approveOrder(testOrder);

      // create order without signature
      const testOrderNoSig = { ...testOrder };
      delete testOrderNoSig.signature;

      // verify okay
      const txResult = await getTradeCost(
        testOrder,
        defaultTakerAmount,
        {
          inputMarket: defaultTakerMarket,
          outputMarket: defaultMakerMarket,
        },
      );
      expect(txResult.result).toEqual({
        sign: false,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultMakerAmount,
      });

      const filledAmount = await getFilledAmount(testOrder);
      expect(filledAmount).toEqual(defaultMakerAmount);
    });

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultWei,
          {},
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Fails for inputWei of zero', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          INTEGERS.ZERO,
          {},
        ),
        'LimitOrders: InputWei is zero',
      );
    });

    it('Fails for takerMarket mismatch', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultMakerAmount,
          {
            inputMarket: defaultMakerMarket,
            outputMarket: incorrectMarket,
          },
        ),
        'LimitOrders: Market mismatch',
      );
    });

    it('Fails for makerMarket mismatch', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultMakerAmount,
          {
            inputMarket: incorrectMarket,
            outputMarket: defaultTakerMarket,
          },
        ),
        'LimitOrders: Market mismatch',
      );
    });

    it('Fails for switching makerMarket and takerMarket', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultTakerAmount,
          {
            inputMarket: defaultMakerMarket,
            outputMarket: defaultTakerMarket,
          },
        ),
        'LimitOrders: InputWei sign mismatch',
      );
    });

    it('Fails to overfill order (makerAmount)', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultMakerAmount.plus(1).times(-1),
          {
            inputMarket: defaultMakerMarket,
            outputMarket: defaultTakerMarket,
          },
        ),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Fails to overfill order (takerAmount)', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultTakerAmount.times(2),
          {
            inputMarket: defaultTakerMarket,
            outputMarket: defaultMakerMarket,
          },
        ),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Fails for canceled order', async () => {
      await cancelOrder(testOrder);
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultTakerAmount,
          {
            inputMarket: defaultTakerMarket,
            outputMarket: defaultMakerMarket,
          },
        ),
        'LimitOrders: Order canceled',
      );
    });

    it('Fails for expired order', async () => {
      const testOrderExpired = {
        ...testOrder,
        expiration: INTEGERS.ONE,
      };
      await signOrder(testOrderExpired);
      await expectThrow(
        getTradeCost(
          testOrderExpired,
          defaultWei,
          {},
        ),
        'LimitOrders: Order expired',
      );
    });

    it('Fails for incorrect taker account', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultWei,
          {
            takerAccountOwner: accounts[0],
          },
        ),
        'LimitOrders: Order taker account mismatch',
      );
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultWei,
          {
            takerAccountNumber: defaultTakerNumber.plus(1),
          },
        ),
        'LimitOrders: Order taker account mismatch',
      );
    });

    it('Fails for incorrect maker account', async () => {
      const testOrderWithTaker = {
        ...testOrder,
        takerAccountOwner: defaultTakerAddress,
        takerAccountNumber: defaultTakerNumber,
      };
      await expectThrow(
        getTradeCost(
          testOrderWithTaker,
          defaultWei,
          {
            makerAccountOwner: accounts[0],
          },
        ),
        'LimitOrders: Order maker account mismatch',
      );
      await expectThrow(
        getTradeCost(
          testOrderWithTaker,
          defaultWei,
          {
            makerAccountNumber: defaultMakerNumber.plus(1),
          },
        ),
        'LimitOrders: Order maker account mismatch',
      );
    });

    it('Fails for invalid signature', async () => {
      const invalidSignature1 = `0x${'00'.repeat(65)}00`;
      const invalidSignature2 = `0x${'00'.repeat(65)}01`;
      const testOrderInvalidSig1 = { ...testOrder, signature: invalidSignature1 };
      const testOrderInvalidSig2 = { ...testOrder, signature: invalidSignature2 };
      await expectThrow(
        getTradeCost(
          testOrderInvalidSig1,
          defaultWei,
          {},
        ),
        'TypedSignature: Invalid signature type',
      );
      await expectThrow(
        getTradeCost(
          testOrderInvalidSig2,
          defaultWei,
          {},
        ),
        'LimitOrders: Order invalid signature',
      );
    });

    it('Fails for bad signature data', async () => {
      const shortSig = '0x0000';
      const testOrderShortSig = { ...testOrder, signature: shortSig };
      await expectThrow(
        getTradeCost(
          testOrderShortSig,
          defaultWei,
          {},
        ),
        'LimitOrders: Cannot parse signature',
      );
    });

    it('Fails for bad order data', async () => {
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultWei,
          { data: '0x00' },
        ),
        'LimitOrders: Cannot parse order',
      );
    });
  });

  describe('constructor', () => {
    it('Sets constants correctly', async () => {
      const cccf = solo.contracts.callConstantContractFunction;
      const [
        domainHash,
        mockSoloMargin,
      ] = await Promise.all([
        cccf(limitOrders.methods.EIP712_DOMAIN_HASH()),
        cccf(limitOrders.methods.SOLO_MARGIN()),
      ]);
      const expectedDomainHash = solo.limitOrders.getDomainHash({
        chainId,
        contractAddress: limitOrders.options.address,
      });
      expect(domainHash).toEqual(expectedDomainHash);
      expect(mockSoloMargin).toEqual(solo.getDefaultAccount());
    });
  });

  describe('approveOrder', () => {
    it('Succeeds for null order', async () => {
      const approver = testOrder.makerAccountOwner;
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      const txResult = await solo.limitOrders.approveOrder(testOrder, { from: approver });
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Null);
      expect(status2.status).toEqual(LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
    });

    it('Fails for approved order', async () => {
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner }),
        'LimitOrders: Cannot approve non-null order',
      );
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner }),
        'LimitOrders: Cannot approve non-null order',
      );
    });
  });

  describe('cancelOrder', () => {
    it('Succeeds for null order', async () => {
      const canceler = testOrder.makerAccountOwner;
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      const txResult = await solo.limitOrders.cancelOrder(testOrder, { from: canceler });
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Null);
      expect(status2.status).toEqual(LimitOrderStatus.Canceled);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
    });

    it('Succeeds for approved order', async () => {
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Approved);
      expect(status2.status).toEqual(LimitOrderStatus.Canceled);
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner }),
        'LimitOrders: Cannot cancel canceled order',
      );
    });
  });

  describe('callFunction: approve', () => {
    async function approveTestOrder() {
      return solo.operation.initiate().approveLimitOrder({
        primaryAccountOwner: testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.callContractFunction(
          solo.contracts.limitOrders.methods.callFunction(
            ADDRESSES.ZERO,
            {
              owner: testOrder.makerAccountOwner,
              number: testOrder.makerAccountNumber.toFixed(0),
            },
            toBytes(INTEGERS.ZERO, getOrderHash(testOrder)),
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Succeeds for null order', async () => {
      const approver = testOrder.makerAccountOwner;
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      const txResult = await approveTestOrder();
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Null);
      expect(status2.status).toEqual(LimitOrderStatus.Approved);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);
      const log = logs[2];
      expect(log.name).toEqual('LogOrderApproved');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.approver).toEqual(approver);
    });

    it('Fails for approved order', async () => {
      await approveTestOrder();
      await expectThrow(
        approveTestOrder(),
        'LimitOrders: Cannot approve non-null order',
      );
    });

    it('Fails for canceled order', async () => {
      await solo.limitOrders.cancelOrder(testOrder, { from: testOrder.makerAccountOwner });
      await expectThrow(
        approveTestOrder(),
        'LimitOrders: Cannot approve non-null order',
      );
    });
  });

  describe('callFunction: cancel', () => {
    async function cancelTestOrder() {
      return solo.operation.initiate().cancelLimitOrder({
        primaryAccountOwner: testOrder.makerAccountOwner,
        primaryAccountId: testOrder.makerAccountNumber,
        order: testOrder,
      }).commit({ from: testOrder.makerAccountOwner });
    }

    it('Fails for non-Solo caller', async () => {
      await expectThrow(
        solo.contracts.callContractFunction(
          solo.contracts.limitOrders.methods.callFunction(
            ADDRESSES.ZERO,
            {
              owner: testOrder.makerAccountOwner,
              number: testOrder.makerAccountNumber.toFixed(0),
            },
            toBytes(INTEGERS.ONE, getOrderHash(testOrder)),
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });

    it('Succeeds for null order', async () => {
      const canceler = testOrder.makerAccountOwner;
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      const txResult = await cancelTestOrder();
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Null);
      expect(status2.status).toEqual(LimitOrderStatus.Canceled);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);
      const log = logs[2];
      expect(log.name).toEqual('LogOrderCanceled');
      expect(log.args.orderHash).toEqual(solo.limitOrders.getOrderHash(testOrder));
      expect(log.args.canceler).toEqual(canceler);
    });

    it('Succeeds for approved order', async () => {
      await solo.limitOrders.approveOrder(testOrder, { from: testOrder.makerAccountOwner });
      const status1 = await solo.limitOrders.getOrderStatus(testOrder);
      await cancelTestOrder();
      const status2 = await solo.limitOrders.getOrderStatus(testOrder);
      expect(status1.status).toEqual(LimitOrderStatus.Approved);
      expect(status2.status).toEqual(LimitOrderStatus.Canceled);
    });

    it('Fails for canceled order', async () => {
      await cancelTestOrder();
      await expectThrow(
        cancelTestOrder(),
        'LimitOrders: Cannot cancel canceled order',
      );
    });
  });

  describe('integration', () => {
    it('Fills an order multiple times up to the limit', async () => {
      // fill once
      const txResult1 = await getTradeCost(
        testOrder,
        defaultMakerAmount.times(-1).div(2),
        {
          inputMarket: defaultMakerMarket,
          outputMarket: defaultTakerMarket,
        },
      );
      expect(txResult1.result).toEqual({
        sign: true,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultTakerAmount.div(2),
      });
      const filledAmount1 = await getFilledAmount(testOrder);
      expect(filledAmount1).toEqual(defaultMakerAmount.div(2));

      // fill twice
      const txResult2 = await getTradeCost(
        testOrder,
        defaultMakerAmount.times(-1).div(2),
        {
          inputMarket: defaultMakerMarket,
          outputMarket: defaultTakerMarket,
        },
      );
      expect(txResult2.result).toEqual({
        sign: true,
        denomination: AmountDenomination.Wei,
        ref: AmountReference.Delta,
        value: defaultTakerAmount.div(2),
      });
      const filledAmount2 = await getFilledAmount(testOrder);
      expect(filledAmount2).toEqual(defaultMakerAmount);

      // fail a third time
      await expectThrow(
        getTradeCost(
          testOrder,
          defaultMakerAmount.times(-1).div(2),
          {
            inputMarket: defaultMakerMarket,
            outputMarket: defaultTakerMarket,
          },
        ),
        'LimitOrders: Cannot overfill order',
      );
    });

    it('Succeeds when going through solo', async () => {
      await expectBalances(
        defaultTakerAmount,
        zero,
        zero,
        defaultMakerAmount,
      );
      await solo.operation.initiate().takeLimitOrder(
        realOrder.takerAccountOwner,
        realOrder.takerAccountNumber,
        realOrder,
        defaultTakerAmount.div(2),
        false,
      ).commit({ from: realOrder.takerAccountOwner });
      await expectBalances(
        defaultTakerAmount.div(2),
        defaultMakerAmount.div(2),
        defaultTakerAmount.div(2),
        defaultMakerAmount.div(2),
      );
      const status = await solo.limitOrders.getOrderStatus(realOrder);
      expect(status.makerFilledAmount).toEqual(defaultMakerAmount.div(2));
    });

    it('Succeeds for logs', async () => {
      const orderHash = solo.limitOrders.getOrderHash(realOrder);

      // fill half, once
      const txResult1 = await solo.operation.initiate().takeLimitOrder(
        realOrder.takerAccountOwner,
        realOrder.takerAccountNumber,
        realOrder,
        defaultTakerAmount.div(2),
        false,
      ).commit({ from: realOrder.takerAccountOwner });
      const status1 = await solo.limitOrders.getOrderStatus(realOrder);
      expect(status1.makerFilledAmount).toEqual(defaultMakerAmount.div(2));

      // check logs for first tx
      const logs1 = solo.logs.parseLogs(txResult1);
      expect(logs1.length).toEqual(5);
      const logOrderTaken1 = logs1[3];
      expect(logOrderTaken1.name).toEqual('LogOrderTaken');
      expect(logOrderTaken1.args.orderHash).toEqual(orderHash);
      expect(logOrderTaken1.args.fillAmount).toEqual(defaultMakerAmount.div(2));

      // wait so that the indexes will update
      await mineAvgBlock();

      // fill a quarter
      const txResult2 = await solo.operation.initiate().takeLimitOrder(
        realOrder.takerAccountOwner,
        realOrder.takerAccountNumber,
        realOrder,
        defaultTakerAmount.div(4),
        false,
      ).commit({ from: realOrder.takerAccountOwner });
      const status2 = await solo.limitOrders.getOrderStatus(realOrder);
      expect(status2.makerFilledAmount).toEqual(defaultMakerAmount.times(3).div(4));

      // check logs for second tx
      const logs2 = solo.logs.parseLogs(txResult2);
      expect(logs2.length).toEqual(5);
      const logOrderTaken2 = logs2[3];
      expect(logOrderTaken2.name).toEqual('LogOrderTaken');
      expect(logOrderTaken2.args.orderHash).toEqual(orderHash);
      expect(logOrderTaken2.args.fillAmount).toEqual(defaultMakerAmount.div(4));
    });
  });
});

// ============ Helper Functions ============
//
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

async function getFilledAmount(
  order: LimitOrder,
): Promise<BigNumber> {
  const hash = getOrderHash(order);
  const filledAmount: any = await solo.contracts.callConstantContractFunction(
    limitOrders.methods.g_filled(hash),
  );
  return new BigNumber(filledAmount);
}

async function signOrder(
  order: LimitOrder,
) {
  order.signature = await solo.limitOrders.ethSignTypedOrder(
    order,
    {
      chainId,
      contractAddress: limitOrders.options.address,
    },
  );
}

function getOrderHash(
  order: LimitOrder,
): string {
  return solo.limitOrders.getOrderHash(
    order,
    {
      chainId,
      contractAddress: limitOrders.options.address,
    },
  );
}

async function getTradeCost(
  order: LimitOrder,
  deltaWei: Integer,
  {
    inputMarket = defaultTakerMarket,
    outputMarket = defaultMakerMarket,
    makerAccountOwner = defaultMakerAddress,
    makerAccountNumber =  defaultMakerNumber,
    takerAccountOwner = defaultTakerAddress,
    takerAccountNumber = defaultTakerNumber,
    data = solo.limitOrders.orderToBytes(order),
  },
  options: any = {},
): Promise<any> {
  const functionCall = limitOrders.methods.getTradeCost(
    inputMarket.toFixed(0),
    outputMarket.toFixed(0),
    {
      owner: makerAccountOwner,
      number: makerAccountNumber.toFixed(0),
    },
    {
      owner: takerAccountOwner,
      number: takerAccountNumber.toFixed(0),
    },
    integerToValue(INTEGERS.ZERO),
    integerToValue(INTEGERS.ZERO),
    integerToValue(deltaWei),
    data,
  );

  // constant call
  const [
    sign,
    denomination,
    ref,
    value,
  ] = await solo.contracts.callConstantContractFunction(functionCall, options);

  // state-changing call
  const txResult = await solo.contracts.callContractFunction(functionCall, options);

  return {
    ...txResult,
    result: {
      sign,
      denomination: parseInt(denomination, 10),
      ref: parseInt(ref, 10),
      value: new BigNumber(value),
    },
  };
}

async function cancelOrder(
  order: LimitOrder,
): Promise<any> {
  return solo.contracts.callContractFunction(
    limitOrders.methods.cancelOrder(getOrderHash(order)),
    { from: order.makerAccountOwner },
  );
}

async function approveOrder(
  order: LimitOrder,
): Promise<any> {
  return solo.contracts.callContractFunction(
    limitOrders.methods.approveOrder(getOrderHash(order)),
    { from: order.makerAccountOwner },
  );
}
