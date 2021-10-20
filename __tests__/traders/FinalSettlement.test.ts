import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { fastForward, mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { toBytes } from '../../src/lib/BytesHelper';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import {
  address,
  AmountDenomination,
  AmountReference,
  Trade,
} from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;

const accountNumber1 = INTEGERS.ZERO;
const accountNumber2 = INTEGERS.ONE;
const heldMarket = INTEGERS.ZERO;
const owedMarket = INTEGERS.ONE;
const collateralMarket = new BigNumber(2);
const par = new BigNumber(10000);
const zero = new BigNumber(0);
const premium = new BigNumber('1.05');
const defaultPrice = new BigNumber('1e40');
let defaultGlob: Trade;
let heldGlob: Trade;

describe('FinalSettlement', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = accounts[2];
    owner2 = accounts[3];
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: owedMarket,
      outputMarketId: heldMarket,
      autoTrader: solo.contracts.finalSettlement.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket),
    };
    heldGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: heldMarket,
      outputMarketId: owedMarket,
      autoTrader: solo.contracts.finalSettlement.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket),
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par.times(-1)),
      solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(2)),
      solo.testing.setAccountBalance(owner1, accountNumber1, owedMarket, par),
      solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, par.times(4)),
    ]);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#getRampTime', () => {
    it('Succeeds', async () => {
      expect(await solo.finalSettlement.getRampTime()).toEqual(new BigNumber(60 * 60 * 24 * 28));
    });
  });

  describe('#initialize', () => {
    it('Succeeds', async () => {
      await solo.finalSettlement.initialize();
      const startTime: BigNumber = await solo.finalSettlement.getStartTime();

      // Expect the start time to equal the block timestamp.
      const { timestamp } = await solo.web3.eth.getBlock(await solo.web3.eth.getBlockNumber());
      expect(startTime).toEqual(new BigNumber(timestamp));
    });

    it('Fails if already initialized', async () => {
      await solo.finalSettlement.initialize();
      await expectThrow(
        solo.finalSettlement.initialize(),
        'FinalSettlement: Already initialized',
      );
    });

    it('Fails if not a global operator', async () => {
      await solo.admin.setGlobalOperator(
        solo.contracts.finalSettlement.options.address,
        false,
        { from: admin },
      );
      await expectThrow(
        solo.finalSettlement.initialize(),
        'FinalSettlement: Not a global operator',
      );
    });
  });

  describe('settle account (heldAmount)', () => {
    beforeEach(async () => {
      await solo.finalSettlement.initialize();
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par);
      await fastForward(60 * 60 * 24 * 28);
    });

    it('Succeeds in settling', async () => {
      const txResult = await expectSettlementOkay(heldGlob);

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);
      expect(owed1).toEqual(par.minus(par.div(premium)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par);
      expect(held2).toEqual(zero);

      const logs = solo.logs.parseLogs(txResult, { skipOperationLogs: true });
      expect(logs.length).toEqual(1);
      const settleLog = logs[0];
      expect(settleLog.name).toEqual('Settlement');
      expect(settleLog.args.makerAddress).toEqual(owner2);
      expect(settleLog.args.takerAddress).toEqual(owner1);
      expect(settleLog.args.heldMarketId).toEqual(heldMarket);
      expect(settleLog.args.owedMarketId).toEqual(owedMarket);
      expect(settleLog.args.heldWei).toEqual(par);
      expect(settleLog.args.owedWei).toEqual(par.div(premium).integerValue(BigNumber.ROUND_UP));

      console.log(`\tFinalSettlement (held) gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds in settling part of a position', async () => {
      await expectSettlementOkay({
        ...heldGlob,
        amount: {
          value: par.div(2),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      });

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.minus(par.div(premium).div(2)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par.div(2));
      expect(held2).toEqual(par.minus(held1));
    });

    it('Succeeds in settling including premiums', async () => {
      const owedPremium = new BigNumber('0.5');
      const heldPremium = new BigNumber('1.0');
      const adjustedPremium = premium.minus(1).times(
        owedPremium.plus(1),
      ).times(
        heldPremium.plus(1),
      ).plus(1);
      await Promise.all([
        solo.admin.setSpreadPremium(owedMarket, owedPremium, { from: admin }),
        solo.admin.setSpreadPremium(heldMarket, heldPremium, { from: admin }),
      ]);

      await expectSettlementOkay(heldGlob);

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.minus(par.div(adjustedPremium)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par);
      expect(held2).toEqual(zero);
    });

    it('Succeeds for zero inputMarket', async () => {
      const getAllBalances = [
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ];
      const start = await Promise.all(getAllBalances);

      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, zero);
      await expectSettlementOkay(heldGlob, {}, false);

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for negative inputMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(-1));
      await expectSettlementRevert(
        heldGlob,
        'FinalSettlement: inputMarket mismatch',
      );
    });

    it('Fails for overusing collateral', async () => {
      await expectSettlementRevert(
        {
          ...heldGlob,
          amount: {
            value: par.times(-1),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'FinalSettlement: Collateral cannot be overused',
      );
    });

    it('Fails for increasing the heldAmount', async () => {
      await expectSettlementRevert(
        {
          ...heldGlob,
          amount: {
            value: par.times(4),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'FinalSettlement: inputMarket mismatch',
      );
    });

    it('Fails if not initialized', async () => {
      await resetEVM(snapshotId);
      await expectSettlementRevert(
        heldGlob,
        'FinalSettlement: Contract must be initialized',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectSettlementRevert(
        {
          ...heldGlob,
          data: [],
        },
        // No message, abi.decode reverts.
      );
    });

    it('Fails for zero owedMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, zero);
      await expectSettlementRevert(
        heldGlob,
        'FinalSettlement: Borrows must be negative',
      );
    });

    it('Fails for positive owedMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await expectSettlementRevert(
        heldGlob,
        'FinalSettlement: Borrows must be negative',
      );
    });

    it('Fails for over-repaying the borrow', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(2));
      await expectSettlementRevert(
        heldGlob,
        'FinalSettlement: outputMarket too small',
      );
    });
  });

  describe('settle account (owedAmount)', () => {
    beforeEach(async () => {
      await solo.finalSettlement.initialize();
      await fastForward(60 * 60 * 24 * 28);
    });

    it('Succeeds in settling', async () => {
      const txResult = await expectSettlementOkay({});

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);
      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2).minus(held1));

      const logs = solo.logs.parseLogs(txResult, { skipOperationLogs: true });
      expect(logs.length).toEqual(1);
      const settleLog = logs[0];
      expect(settleLog.name).toEqual('Settlement');
      expect(settleLog.args.makerAddress).toEqual(owner2);
      expect(settleLog.args.takerAddress).toEqual(owner1);
      expect(settleLog.args.heldMarketId).toEqual(heldMarket);
      expect(settleLog.args.owedMarketId).toEqual(owedMarket);
      expect(settleLog.args.heldWei).toEqual(par.times(premium));
      expect(settleLog.args.owedWei).toEqual(par);

      console.log(`\tFinalSettlement (owed) gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds in settling part of a position', async () => {
      await expectSettlementOkay({
        amount: {
          value: par.div(-2),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      });

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.div(2));
      expect(owed2).toEqual(par.div(-2));
      expect(held1).toEqual(par.times(premium).div(2));
      expect(held2).toEqual(par.times(2).minus(held1));
    });

    it('Succeeds in settling including premiums', async () => {
      const owedPremium = new BigNumber('0.5');
      const heldPremium = new BigNumber('1.0');
      const adjustedPremium = premium.minus(1).times(
        owedPremium.plus(1),
      ).times(
        heldPremium.plus(1),
      ).plus(1);
      await Promise.all([
        solo.admin.setSpreadPremium(owedMarket, owedPremium, { from: admin }),
        solo.admin.setSpreadPremium(heldMarket, heldPremium, { from: admin }),
      ]);

      await expectSettlementOkay({});

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(adjustedPremium));
      expect(held2).toEqual(par.times(2).minus(held1));
    });

    it('Succeeds for zero inputMarket', async () => {
      const getAllBalances = [
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ];
      const start = await Promise.all(getAllBalances);

      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, zero);
      await expectSettlementOkay({}, {}, false);

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for positive inputMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await expectSettlementRevert(
        {},
        'FinalSettlement: outputMarket mismatch',
      );
    });

    it('Fails for overpaying a borrow', async () => {
      await expectSettlementRevert(
        {
          amount: {
            value: par,
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'FinalSettlement: Borrows cannot be overpaid',
      );
    });

    it('Fails for increasing a borrow', async () => {
      await expectSettlementRevert(
        {
          amount: {
            value: par.times(-2),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'FinalSettlement: outputMarket mismatch',
      );
    });

    it('Fails if not initialized', async () => {
      await resetEVM(snapshotId);
      await expectSettlementRevert(
        {},
        'FinalSettlement: Contract must be initialized',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectSettlementRevert(
        { data: [] },
        // No message, abi.decode reverts.
      );
    });

    it('Fails for zero collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, zero);
      await expectSettlementRevert(
        {},
        'FinalSettlement: Collateral must be positive',
      );
    });

    it('Fails for negative collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(-1));
      await expectSettlementRevert(
        {},
        'FinalSettlement: Collateral must be positive',
      );
    });

    it('Fails for overtaking collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.div(2));
      await expectSettlementRevert(
        {},
        'FinalSettlement: outputMarket too small',
      );
    });
  });

  describe('#getSpreadAdjustedPrices', () => {
    it('Succeeds at initialization', async () => {
      await solo.finalSettlement.initialize();
      const { timestamp } = await solo.web3.eth.getBlock(await solo.web3.eth.getBlockNumber());

      const prices = await solo.finalSettlement.getPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp),
      );

      expect(prices.owedPrice.eq(defaultPrice)).toEqual(true);
      expect(prices.heldPrice).toEqual(defaultPrice);
    });

    it('Succeeds when recently initialized', async () => {
      await solo.finalSettlement.initialize();
      const { timestamp } = await solo.web3.eth.getBlock(await solo.web3.eth.getBlockNumber());
      await mineAvgBlock();

      const prices = await solo.finalSettlement.getPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp + 60 * 60), // 1 hour later
      );

      expect(prices.owedPrice.lt(defaultPrice.times(premium))).toEqual(true);
      expect(prices.owedPrice.gt(defaultPrice)).toEqual(true);
      expect(prices.heldPrice).toEqual(defaultPrice);
    });

    it('Succeeds when initialized a long time ago', async () => {
      await solo.finalSettlement.initialize();
      const { timestamp } = await solo.web3.eth.getBlock(await solo.web3.eth.getBlockNumber());
      await mineAvgBlock();

      // Expect maximum spread after 28 days.
      const prices1 = await solo.finalSettlement.getPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp + 60 * 60 * 24 * 28),
      );
      expect(prices1.owedPrice).toEqual(defaultPrice.times(premium));
      expect(prices1.heldPrice).toEqual(defaultPrice);

      // Expect maximum spread after a year.
      const prices2 = await solo.finalSettlement.getPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp + 60 * 60 * 24 * 365),
      );
      expect(prices2).toEqual(prices1);
    });

    it('Fails when not yet initialized', async () => {
      await expectThrow(
        solo.finalSettlement.getPrices(
          heldMarket,
          owedMarket,
          new BigNumber(10),
        ),
        'FinalSettlement: Not initialized',
      );
    });
  });

  describe('accountOperation#finalSettlement', () => {
    beforeEach(async () => {
      await solo.finalSettlement.initialize();
      await fastForward(60 * 60 * 24 * 28);
    });

    it('Succeeds', async () => {
      await solo.operation.initiate().finalSettlement({
        liquidMarketId: owedMarket,
        payoutMarketId: heldMarket,
        primaryAccountOwner: owner1,
        primaryAccountId: accountNumber1,
        liquidAccountOwner: owner2,
        liquidAccountId: accountNumber2,
        amount: {
          value: INTEGERS.ZERO,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      }).commit({ from: owner1 });

      const [
        held1,
        owed1,
        held2,
        owed2,
      ] = await Promise.all([
        solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2).minus(held1));
    });
  });
});

// ============ Helper Functions ============

async function expectSettlementOkay(
  glob: Object,
  options?: Object,
  expectLogs: boolean = true,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  const txResult = await solo.operation
    .initiate()
    .trade(combinedGlob)
    .commit({ ...options, from: owner1 });

  if (expectLogs) {
    const logs = solo.logs.parseLogs(txResult, { skipOperationLogs: true });
    expect(logs.length).toEqual(1);
    expect(logs[0].name).toEqual('Settlement');
  }

  return txResult;
}

async function expectSettlementRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectSettlementOkay(glob, options), reason);
}
