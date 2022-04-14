import BigNumber from 'bignumber.js';
import {
  abi as TestLiquidationCallbackABI,
  bytecode as TestLiquidationCallbackBytecode,
} from '../../build/contracts/TestLiquidationCallback.json';
import { TestLiquidationCallback } from '../../build/testing_wrappers/TestLiquidationCallback';
import { address, AmountDenomination, AmountReference, Integer, INTEGERS, Trade, TxResult } from '../../src';
import { toBytes } from '../../src/lib/BytesHelper';
import { expectThrow } from '../../src/lib/Expect';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { fastForward, mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;
let rando: address;
let globalOperator: address;
let startingExpiry: BigNumber;

const accountNumber1 = INTEGERS.ZERO;
const accountNumber2 = INTEGERS.ONE;
const heldMarket = INTEGERS.ZERO;
const owedMarket = INTEGERS.ONE;
const collateralMarket = new BigNumber(2);
const par = new BigNumber(10000);
const zero = new BigNumber(0);
const premium = new BigNumber('1.05');
const defaultPrice = new BigNumber('1e40');
const defaultTimeDelta = new BigNumber(1234);
let defaultGlob: Trade;
let heldGlob: Trade;

describe('Expiry', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = accounts[2];
    owner2 = accounts[3];
    rando = accounts[4];
    globalOperator = accounts[5];
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: owedMarket,
      outputMarketId: heldMarket,
      autoTrader: dolomiteMargin.contracts.expiry.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket, INTEGERS.ONES_31),
    };
    heldGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: heldMarket,
      outputMarketId: owedMarket,
      autoTrader: dolomiteMargin.contracts.expiry.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket, INTEGERS.ONES_31),
    };

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par.times(-1),
      ),
      dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par.times(2),
      ),
      dolomiteMargin.testing.setAccountBalance(owner1, accountNumber1, owedMarket, par),
      dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        collateralMarket,
        par.times(4),
      ),
      dolomiteMargin.admin.setGlobalOperator(globalOperator, true, { from: admin }),
    ]);
    await Promise.all([
      setExpiryForSelf(INTEGERS.ONE, true),
      dolomiteMargin.expiry.setApproval(owner1, defaultTimeDelta, { from: owner2 }),
    ]);
    startingExpiry = await dolomiteMargin.expiry.getExpiry(
      owner2,
      accountNumber2,
      owedMarket,
    );

    await fastForward(60 * 60 * 24);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('setApproval', () => {
    it('Succeeds for zero', async () => {
      const txResult = await dolomiteMargin.expiry.setApproval(owner1, zero, {
        from: owner2,
      });

      // check storage
      const approval = await dolomiteMargin.expiry.getApproval(owner2, owner1);
      expect(approval).toEqual(zero);

      // check logs
      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSenderApproved');
      expect(log.args.approver).toEqual(owner2);
      expect(log.args.sender).toEqual(owner1);
      expect(log.args.minTimeDelta).toEqual(zero);
    });

    it('Succeeds for non-zero', async () => {
      const defaultDelay = new BigNumber(425);
      const txResult = await dolomiteMargin.expiry.setApproval(owner1, defaultDelay, {
        from: owner2,
      });

      // check storage
      const approval = await dolomiteMargin.expiry.getApproval(owner2, owner1);
      expect(approval).toEqual(defaultDelay);

      // check logs
      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSenderApproved');
      expect(log.args.approver).toEqual(owner2);
      expect(log.args.sender).toEqual(owner1);
      expect(log.args.minTimeDelta).toEqual(defaultDelay);
    });
  });

  describe('callFunction (invalid)', () => {
    it('Fails for invalid callType', async () => {
      await expectThrow(
        dolomiteMargin.operation
          .initiate()
          .call({
            primaryAccountOwner: owner1,
            primaryAccountId: accountNumber1,
            callee: dolomiteMargin.contracts.expiry.options.address,
            data: toBytes(2, 2, 2, 2),
          })
          .commit(),
      );
    });

    it('Fails for zero bytes', async () => {
      await expectThrow(
        dolomiteMargin.operation
          .initiate()
          .call({
            primaryAccountOwner: owner1,
            primaryAccountId: accountNumber1,
            callee: dolomiteMargin.contracts.expiry.options.address,
            data: [],
          })
          .commit(),
      );
    });
  });

  describe('callFunctionSetApproval', () => {
    it('Succeeds in setting approval', async () => {
      const minTimeDeltas = [INTEGERS.ZERO, defaultTimeDelta];
      for (let i = 0; i < minTimeDeltas.length; i += 1) {
        // make transaction
        const txResult = await dolomiteMargin.operation
          .initiate()
          .setApprovalForExpiry({
            primaryAccountOwner: owner2,
            primaryAccountId: INTEGERS.ZERO,
            sender: owner1,
            minTimeDelta: minTimeDeltas[i],
          })
          .commit({ from: owner2 });

        // check logs
        const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
        expect(logs.length)
          .toEqual(1);
        const log = logs[0];
        expect(log.name)
          .toEqual('LogSenderApproved');
        expect(log.args.approver)
          .toEqual(owner2);
        expect(log.args.sender)
          .toEqual(owner1);
        expect(log.args.minTimeDelta)
          .toEqual(minTimeDeltas[i]);

        // check approval set
        const actualMinTimeDelta = await dolomiteMargin.expiry.getApproval(
          owner2,
          owner1,
        );
        expect(actualMinTimeDelta)
          .toEqual(minTimeDeltas[i]);
      }
    });
  });

  describe('callFunctionSetExpiry (self)', () => {
    it('Succeeds in setting expiry', async () => {
      const txResult = await setExpiryForSelf(defaultTimeDelta, true);
      await expectExpiry(
        txResult,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTimeDelta,
      );

      console.log(`\tSet expiry (self) gas used: ${txResult.gasUsed}`);
    });

    it('Fails if not forceUpdate', async () => {
      const txResult = await setExpiryForSelf(defaultTimeDelta.div(2), false);
      await expectNoExpirySet(txResult);
    });

    it('Skips logs when necessary', async () => {
      const txResult = await setExpiryForSelf(defaultTimeDelta, true);
      const noLogs = dolomiteMargin.logs.parseLogs(txResult, { skipExpiryLogs: true });
      const logs = dolomiteMargin.logs.parseLogs(txResult, { skipExpiryLogs: false });
      expect(noLogs.filter((e: any) => e.name === 'ExpirySet').length).toEqual(0);
      expect(logs.filter((e: any) => e.name === 'ExpirySet').length).not.toEqual(0);
    });

    it('Sets expiry to zero even if given positive delta (non-negative balances)', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      const txResult = await setExpiryForSelf(defaultTimeDelta, false);
      await expectExpiry(txResult, owner2, accountNumber2, owedMarket, zero);
    });

    it('Sets expiry to zero on purpose (non-negative balances)', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      const txResult = await setExpiryForSelf(zero, false);
      await expectExpiry(txResult, owner2, accountNumber2, owedMarket, zero);
    });
  });

  describe('callFunctionSetExpiry (other)', () => {
    it('Succeeds in setting expiry', async () => {
      const txResult = await setExpiryForOther(defaultTimeDelta, true);
      await expectExpiry(
        txResult,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTimeDelta,
      );
      console.log(`\tSet expiry (other) gas used: ${txResult.gasUsed}`);
    });

    it('Fails if not minimum approved timeDelta', async () => {
      const txResult = await setExpiryForOther(defaultTimeDelta.div(2), true);
      await expectNoExpirySet(txResult);
    });

    it('Fails if not forceUpdate', async () => {
      const txResult = await setExpiryForOther(defaultTimeDelta.div(2), false);
      await expectNoExpirySet(txResult);
    });

    it('Allows longer than minimum approved timeDelta', async () => {
      const txResult = await setExpiryForOther(defaultTimeDelta.times(2), true);
      await expectExpiry(
        txResult,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTimeDelta.times(2),
      );
    });

    it('Do nothing if sender not approved', async () => {
      const timestamp1 = await dolomiteMargin.expiry.getExpiry(
        owner2,
        accountNumber2,
        owedMarket,
      );

      const txResult1 = await dolomiteMargin.operation
        .initiate()
        .setExpiry({
          primaryAccountOwner: rando,
          primaryAccountId: accountNumber1,
          expiryArgs: [
            {
              accountOwner: owner2,
              accountId: accountNumber2,
              marketId: owedMarket,
              timeDelta: defaultTimeDelta,
              forceUpdate: true,
            },
          ],
        })
        .commit({ from: rando });
      expect(
        dolomiteMargin.logs.parseLogs(txResult1, { skipOperationLogs: true }).length,
      ).toEqual(0);

      const txResult2 = await dolomiteMargin.operation
        .initiate()
        .setExpiry({
          primaryAccountOwner: rando,
          primaryAccountId: accountNumber1,
          expiryArgs: [
            {
              accountOwner: owner2,
              accountId: accountNumber2,
              marketId: owedMarket,
              timeDelta: zero,
              forceUpdate: true,
            },
          ],
        })
        .commit({ from: rando });
      expect(
        dolomiteMargin.logs.parseLogs(txResult2, { skipOperationLogs: true }).length,
      ).toEqual(0);

      const timestamp2 = await dolomiteMargin.expiry.getExpiry(
        owner2,
        accountNumber2,
        owedMarket,
      );
      expect(timestamp2).toEqual(timestamp1);
    });

    it('Do nothing if sender not approved (non-negative balance)', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      const timestamp1 = await dolomiteMargin.expiry.getExpiry(
        owner2,
        accountNumber2,
        owedMarket,
      );

      const txResult1 = await dolomiteMargin.operation
        .initiate()
        .setExpiry({
          primaryAccountOwner: rando,
          primaryAccountId: accountNumber1,
          expiryArgs: [
            {
              accountOwner: owner2,
              accountId: accountNumber2,
              marketId: owedMarket,
              timeDelta: defaultTimeDelta,
              forceUpdate: true,
            },
          ],
        })
        .commit({ from: rando });
      expect(
        dolomiteMargin.logs.parseLogs(txResult1, { skipOperationLogs: true }).length,
      ).toEqual(0);

      const txResult2 = await dolomiteMargin.operation
        .initiate()
        .setExpiry({
          primaryAccountOwner: rando,
          primaryAccountId: accountNumber1,
          expiryArgs: [
            {
              accountOwner: owner2,
              accountId: accountNumber2,
              marketId: owedMarket,
              timeDelta: zero,
              forceUpdate: true,
            },
          ],
        })
        .commit({ from: rando });
      expect(
        dolomiteMargin.logs.parseLogs(txResult2, { skipOperationLogs: true }).length,
      ).toEqual(0);

      const timestamp2 = await dolomiteMargin.expiry.getExpiry(
        owner2,
        accountNumber2,
        owedMarket,
      );
      expect(timestamp2).toEqual(timestamp1);
    });

    it('Set it for multiple', async () => {
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(
          owner1,
          accountNumber1,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          owner1,
          accountNumber1,
          collateralMarket,
          par.times(4),
        ),
        dolomiteMargin.testing.setAccountBalance(
          rando,
          accountNumber1,
          heldMarket,
          par.times(-1),
        ),
        dolomiteMargin.expiry.setApproval(owner1, defaultTimeDelta, { from: rando }),
      ]);
      const txResult = await dolomiteMargin.operation
        .initiate()
        .setExpiry({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          expiryArgs: [
            {
              accountOwner: owner2,
              accountId: accountNumber2,
              marketId: owedMarket,
              timeDelta: zero,
              forceUpdate: true,
            },
            {
              accountOwner: owner1,
              accountId: accountNumber1,
              marketId: owedMarket,
              timeDelta: defaultTimeDelta.div(2),
              forceUpdate: false,
            },
            {
              accountOwner: owner1,
              accountId: accountNumber1,
              marketId: owedMarket,
              timeDelta: defaultTimeDelta.div(2),
              forceUpdate: true,
            },
            {
              accountOwner: rando,
              accountId: accountNumber1,
              marketId: heldMarket,
              timeDelta: defaultTimeDelta.times(2),
              forceUpdate: true,
            },
            {
              accountOwner: rando,
              accountId: accountNumber1,
              marketId: owedMarket,
              timeDelta: defaultTimeDelta.div(2),
              forceUpdate: true,
            },
          ],
        })
        .commit({ from: owner1 });

      // check logs
      const { timestamp } = await dolomiteMargin.web3.eth.getBlock(txResult.blockNumber);
      const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
      expect(logs.length).toEqual(3);
      expect(logs[0].name).toEqual('ExpirySet');
      expect(logs[1].name).toEqual('ExpirySet');
      expect(logs[2].name).toEqual('ExpirySet');
      expect(logs[0].args.owner).toEqual(owner1);
      expect(logs[0].args.number).toEqual(accountNumber1);
      expect(logs[0].args.marketId).toEqual(owedMarket);
      expect(logs[0].args.time).toEqual(
        defaultTimeDelta.div(2)
          .plus(timestamp),
      );
      expect(logs[1].args.owner).toEqual(owner1);
      expect(logs[1].args.number).toEqual(accountNumber1);
      expect(logs[1].args.marketId).toEqual(owedMarket);
      expect(logs[1].args.time).toEqual(
        defaultTimeDelta.div(2)
          .plus(timestamp),
      );
      expect(logs[2].args.owner).toEqual(rando);
      expect(logs[2].args.number).toEqual(accountNumber1);
      expect(logs[2].args.marketId).toEqual(heldMarket);
      expect(logs[2].args.time).toEqual(
        defaultTimeDelta.times(2)
          .plus(timestamp),
      );

      // check storage
      const [expiry1, expiry2, expiry3, expiry4] = await Promise.all([
        dolomiteMargin.expiry.getExpiry(owner2, accountNumber2, owedMarket),
        dolomiteMargin.expiry.getExpiry(owner1, accountNumber1, owedMarket),
        dolomiteMargin.expiry.getExpiry(rando, accountNumber1, heldMarket),
        dolomiteMargin.expiry.getExpiry(rando, accountNumber1, owedMarket),
      ]);
      expect(expiry1).toEqual(startingExpiry);
      expect(expiry2).toEqual(defaultTimeDelta.div(2)
        .plus(timestamp));
      expect(expiry3).toEqual(defaultTimeDelta.times(2)
        .plus(timestamp));
      expect(expiry4).toEqual(zero);
    });

    it('Sets expiry to zero for non-negative balances', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      const txResult = await setExpiryForOther(defaultTimeDelta, false);
      await expectExpiry(txResult, owner2, accountNumber2, owedMarket, zero);
    });

    it('Prevents setting expiry back to zero', async () => {
      const txResult1 = await setExpiryForOther(zero, false);
      await expectNoExpirySet(txResult1);

      // even for positive balances
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      const txResult2 = await setExpiryForOther(zero, false);
      await expectNoExpirySet(txResult2);
    });
  });

  describe('expire account (heldAmount)', () => {
    beforeEach(async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par,
      );
    });

    it('Succeeds in expiring', async () => {
      const txResult = await expectExpireOkay(heldGlob);

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.minus(par.div(premium)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par);
      expect(held2).toEqual(zero);

      console.log(`\tExpiring (held) gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds in expiring and setting expiry back to zero', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par.times(premium),
      );
      const txResult = await expectExpireOkay(heldGlob);

      const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
      expect(logs.length).toEqual(1);
      const expiryLog = logs[0];
      expect(expiryLog.name).toEqual('ExpirySet');
      expect(expiryLog.args.owner).toEqual(owner2);
      expect(expiryLog.args.number).toEqual(accountNumber2);
      expect(expiryLog.args.marketId).toEqual(owedMarket);
      expect(expiryLog.args.time).toEqual(zero);
    });

    it('Succeeds in expiring part of a position', async () => {
      const txResult = await expectExpireOkay({
        ...heldGlob,
        amount: {
          value: par.div(2),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      });

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.minus(par.div(premium).div(2)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par.div(2));
      expect(held2).toEqual(par.minus(held1));
    });

    it('Succeeds in expiring including premiums', async () => {
      const owedPremium = new BigNumber('0.5');
      const heldPremium = new BigNumber('1.0');
      const adjustedPremium = premium
        .minus(1)
        .times(owedPremium.plus(1))
        .times(heldPremium.plus(1))
        .plus(1);
      await Promise.all([
        dolomiteMargin.admin.setSpreadPremium(owedMarket, owedPremium, { from: admin }),
        dolomiteMargin.admin.setSpreadPremium(heldMarket, heldPremium, { from: admin }),
      ]);

      await expectExpireOkay(heldGlob);

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.minus(par.div(adjustedPremium)).integerValue(BigNumber.ROUND_DOWN));
      expect(owed2).toEqual(owed1.times(-1));
      expect(held1).toEqual(par);
      expect(held2).toEqual(zero);
    });

    it('Succeeds for zero inputMarket', async () => {
      const getAllBalances = [
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ];
      const start = await Promise.all(getAllBalances);

      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        zero,
      );
      await expectExpireOkay(heldGlob);

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for negative inputMarket', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par.times(-1),
      );
      await expectExpireRevert(heldGlob, 'Expiry: inputMarket mismatch');
    });

    it('Fails for overusing collateral', async () => {
      await expectExpireRevert(
        {
          ...heldGlob,
          amount: {
            value: par.times(-1),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'Expiry: Collateral cannot be overused',
      );
    });

    it('Fails for increasing the heldAmount', async () => {
      await expectExpireRevert(
        {
          ...heldGlob,
          amount: {
            value: par.times(4),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'Expiry: inputMarket mismatch',
      );
    });

    it('Fails for a zero expiry', async () => {
      await setExpiryForSelf(zero, true);
      await expectExpireRevert(heldGlob, 'Expiry: Expiry not set');
    });

    it('Fails for a future expiry', async () => {
      await setExpiryForSelf(defaultTimeDelta, true);
      await expectExpireRevert(heldGlob, 'Expiry: Borrow not yet expired');
    });

    it('Fails for an expiry past maxExpiry', async () => {
      await expectExpireRevert(
        {
          ...heldGlob,
          data: toBytes(owedMarket, defaultTimeDelta),
        },
        'Expiry: Expiry past maxExpiry',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectExpireRevert({
        ...heldGlob,
        data: toBytes(owedMarket),
      });
    });

    it('Fails for zero owedMarket', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        zero,
      );
      await expectExpireRevert(heldGlob, 'Expiry: Borrows must be negative');
    });

    it('Fails for positive owedMarket', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      await expectExpireRevert(heldGlob, 'Expiry: Borrows must be negative');
    });

    it('Fails for over-repaying the borrow', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par.times(2),
      );
      await expectExpireRevert(heldGlob, 'Expiry: outputMarket too small');
    });

    it('Fails for non-global operator calling', async () => {
      await expectExpireRevert({}, 'TradeImpl: Unpermissioned trade operator', { from: owner1 });
    });
  });

  describe('expire account (owedAmount)', () => {
    it('Succeeds in expiring', async () => {
      const txResult = await expectExpireOkay({});

      const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
      expect(logs.length).toEqual(1);
      const expiryLog = logs[0];
      expect(expiryLog.name).toEqual('ExpirySet');
      expect(expiryLog.args.owner).toEqual(owner2);
      expect(expiryLog.args.number).toEqual(accountNumber2);
      expect(expiryLog.args.marketId).toEqual(owedMarket);
      expect(expiryLog.args.time).toEqual(zero);

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));

      console.log(`\tExpiring (owed) gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds in expiring part of a position', async () => {
      const txResult = await expectExpireOkay({
        amount: {
          value: par.div(-2),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      });

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(par.div(2));
      expect(owed2).toEqual(par.div(-2));
      expect(held1).toEqual(par.times(premium)
        .div(2));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds in expiring including premiums', async () => {
      const owedPremium = new BigNumber('0.5');
      const heldPremium = new BigNumber('1.0');
      const adjustedPremium = premium
        .minus(1)
        .times(owedPremium.plus(1))
        .times(heldPremium.plus(1))
        .plus(1);
      await Promise.all([
        dolomiteMargin.admin.setSpreadPremium(owedMarket, owedPremium, { from: admin }),
        dolomiteMargin.admin.setSpreadPremium(heldMarket, heldPremium, { from: admin }),
      ]);

      await expectExpireOkay({});

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(adjustedPremium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Fails for non-DolomiteMargin calls', async () => {
      await expectThrow(
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.expiry.methods.callFunction(
            owner1,
            {
              owner: owner1,
              number: accountNumber1.toFixed(0),
            },
            [],
          ),
        ),
        'OnlyDolomiteMargin: Only Dolomite can call function',
      );
    });

    it('Succeeds for zero inputMarket', async () => {
      const getAllBalances = [
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ];
      const start = await Promise.all(getAllBalances);

      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        zero,
      );
      await expectExpireOkay({});

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for positive inputMarket', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        owedMarket,
        par,
      );
      await expectExpireRevert({}, 'Expiry: outputMarket mismatch');
    });

    it('Fails for overpaying a borrow', async () => {
      await expectExpireRevert(
        {
          amount: {
            value: par,
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'Expiry: Borrows cannot be overpaid',
      );
    });

    it('Fails for increasing a borrow', async () => {
      await expectExpireRevert(
        {
          amount: {
            value: par.times(-2),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Target,
          },
        },
        'Expiry: outputMarket mismatch',
      );
    });

    it('Fails for a zero expiry', async () => {
      await setExpiryForSelf(zero, true);
      await expectExpireRevert({}, 'Expiry: Expiry not set');
    });

    it('Fails for a future expiry', async () => {
      await setExpiryForSelf(defaultTimeDelta, true);
      await expectExpireRevert({}, 'Expiry: Borrow not yet expired');
    });

    it('Fails for an expiry past maxExpiry', async () => {
      await expectExpireRevert(
        {
          data: toBytes(owedMarket, defaultTimeDelta),
        },
        'Expiry: Expiry past maxExpiry',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectExpireRevert(
        {
          data: toBytes(owedMarket),
        },
        // No message, abi.decode reverts.
      );
    });

    it('Fails for zero collateral', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        zero,
      );
      await expectExpireRevert({}, 'Expiry: Collateral must be positive');
    });

    it('Fails for negative collateral', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par.times(-1),
      );
      await expectExpireRevert({}, 'Expiry: Collateral must be positive');
    });

    it('Fails for overtaking collateral', async () => {
      await dolomiteMargin.testing.setAccountBalance(
        owner2,
        accountNumber2,
        heldMarket,
        par,
      );
      await expectExpireRevert({}, 'Expiry: outputMarket too small');
    });

    it('Fails for non-global operator calling', async () => {
      await expectExpireRevert({}, 'TradeImpl: Unpermissioned trade operator', { from: owner1 });
    });
  });

  describe('AccountOperation#fullyLiquidateExpiredAccount', () => {
    it('Succeeds for two assets', async () => {
      const prices = [[0, INTEGERS.ONES_31], [1, INTEGERS.ONES_31], [2, INTEGERS.ONES_31]];
      const premiums = [[0, INTEGERS.ZERO], [1, INTEGERS.ZERO], [2, INTEGERS.ZERO]];
      const collateralPreferences = [owedMarket, heldMarket, collateralMarket];
      const weis = await Promise.all([
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0))
          .then(wei => [0, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1))
          .then(wei => [1, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2))
          .then(wei => [2, wei]),
      ]);
      const weisMap = mapValuesToMap(weis);
      const pricesMap = mapValuesToMap(prices);
      const premiumsMap = mapValuesToMap(premiums);
      const expiryTimestamp = await dolomiteMargin.expiry.getExpiry(owner2, accountNumber2, owedMarket);
      await dolomiteMargin.operation
        .initiate()
        .fullyLiquidateExpiredAccount(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          owedMarket,
          expiryTimestamp,
          expiryTimestamp.plus(INTEGERS.ONE_DAY_IN_SECONDS),
          weisMap,
          pricesMap,
          premiumsMap,
          collateralPreferences,
        )
        .commit({ from: globalOperator });

      const balances = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(par.times(2)
        .minus(par.times(premium)));
      expect(balances[2]).toEqual(par.times(4));
    });

    it('Succeeds for three assets', async () => {
      const prices = [[0, INTEGERS.ONES_31], [1, INTEGERS.ONES_31], [2, INTEGERS.ONES_31]];
      const premiums = [[0, INTEGERS.ZERO], [1, INTEGERS.ZERO], [2, INTEGERS.ZERO]];
      const collateralPreferences = [owedMarket, heldMarket, collateralMarket];
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par),
        dolomiteMargin.testing.setAccountBalance(
          owner2,
          accountNumber2,
          collateralMarket,
          par,
        ),
      ]);
      const weis = await Promise.all([
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0))
          .then(wei => [0, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1))
          .then(wei => [1, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2))
          .then(wei => [2, wei]),
      ]);
      const weisMap = mapValuesToMap(weis);
      const pricesMap = mapValuesToMap(prices);
      const premiumsMap = mapValuesToMap(premiums);
      const expiryTimestamp = await dolomiteMargin.expiry.getExpiry(owner2, accountNumber2, owedMarket);
      await dolomiteMargin.operation
        .initiate()
        .fullyLiquidateExpiredAccount(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          owedMarket,
          expiryTimestamp,
          expiryTimestamp.plus(INTEGERS.ONE_DAY_IN_SECONDS),
          weisMap,
          pricesMap,
          premiumsMap,
          collateralPreferences,
        )
        .commit({ from: globalOperator });

      const balances = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(zero);

      // calculate the last expected value
      const remainingOwed = par.minus(par.div(premium));
      expect(balances[2]).toEqual(
        par
          .minus(remainingOwed.times(premium)).integerValue(BigNumber.ROUND_UP),
      );
    });

    it('Succeeds for three assets (with premiums)', async () => {
      const prices = [[0, INTEGERS.ONES_31], [1, INTEGERS.ONES_31], [2, INTEGERS.ONES_31]];
      const premiums = [
        [0, new BigNumber('0.1')],
        [1, new BigNumber('0.2')],
        [2, new BigNumber('0.3')],
      ];
      const collateralPreferences = [owedMarket, heldMarket, collateralMarket];
      await Promise.all([
        dolomiteMargin.admin.setSpreadPremium(heldMarket, premiums[0][1] as Integer, { from: admin }),
        dolomiteMargin.admin.setSpreadPremium(owedMarket, premiums[1][1] as Integer, { from: admin }),
        dolomiteMargin.admin.setSpreadPremium(collateralMarket, premiums[2][1] as Integer, { from: admin }),
        dolomiteMargin.testing.setAccountBalance(
          owner2,
          accountNumber2,
          heldMarket,
          par.times(premium),
        ),
        dolomiteMargin.testing.setAccountBalance(
          owner2,
          accountNumber2,
          collateralMarket,
          par,
        ),
      ]);
      const weis = await Promise.all([
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0))
          .then(wei => [0, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1))
          .then(wei => [1, wei]),
        dolomiteMargin.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2))
          .then(wei => [2, wei]),
      ]);
      const weisMap = mapValuesToMap(weis);
      const pricesMap = mapValuesToMap(prices);
      const premiumsMap = mapValuesToMap(premiums);
      const expiryTimestamp = await dolomiteMargin.expiry.getExpiry(owner2, accountNumber2, owedMarket);
      await dolomiteMargin.operation
        .initiate()
        .fullyLiquidateExpiredAccount(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          owedMarket,
          expiryTimestamp,
          expiryTimestamp.plus(INTEGERS.ONE_DAY_IN_SECONDS),
          weisMap,
          pricesMap,
          premiumsMap,
          collateralPreferences,
        )
        .commit({ from: globalOperator });

      const balances = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(zero);

      // calculate the last expected value
      const firstPrem = premium
        .minus(1)
        .times('1.1')
        .times('1.2')
        .plus(1);
      const secondPrem = premium
        .minus(1)
        .times('1.2')
        .times('1.3')
        .plus(1);
      const remainingOwed = par.minus(par.times(premium)
        .div(firstPrem));
      expect(balances[2]).toEqual(
        par
          .minus(remainingOwed.times(secondPrem)).integerValue(BigNumber.ROUND_UP),
      );
    });
  });

  describe('#getSpreadAdjustedPrices', () => {
    it('Succeeds for recently expired positions', async () => {
      const { timestamp } = await dolomiteMargin.web3.eth.getBlock(
        await dolomiteMargin.web3.eth.getBlockNumber(),
      );
      await mineAvgBlock();
      const prices = await dolomiteMargin.expiry.getPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp),
      );
      expect(prices.owedPrice.lt(defaultPrice.times(premium))).toEqual(true);
      expect(prices.owedPrice.gt(defaultPrice)).toEqual(true);
      expect(prices.heldPrice).toEqual(defaultPrice);
    });

    it('Succeeds for very expired positions', async () => {
      const prices = await dolomiteMargin.expiry.getPrices(
        heldMarket,
        owedMarket,
        INTEGERS.ONE,
      );
      expect(prices.owedPrice).toEqual(defaultPrice.times(premium));
      expect(prices.heldPrice).toEqual(defaultPrice);
    });
  });

  describe('#ownerSetExpiryRampTime', () => {
    it('Succeeds for owner', async () => {
      const oldValue = await dolomiteMargin.expiry.getRampTime();
      expect(oldValue).toEqual(INTEGERS.ONE_HOUR_IN_SECONDS);
      await dolomiteMargin.expiry.setRampTime(INTEGERS.ONE_DAY_IN_SECONDS, { from: admin });
      const newValue = await dolomiteMargin.expiry.getRampTime();
      expect(newValue).toEqual(INTEGERS.ONE_DAY_IN_SECONDS);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        dolomiteMargin.expiry.setRampTime(INTEGERS.ONE_DAY_IN_SECONDS, { from: owner1 }),
      );
    });
  });

  describe('#liquidateExpiredAccount', () => {
    it('Succeeds', async () => {
      await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
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
        })
        .commit({ from: globalOperator });

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner2, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with callback', async () => {
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
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackSuccess');
      expect(logs.length).toEqual(1);
      let log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);

      const eventLogs = await liquidContract.getPastEvents(
        'LogOnLiquidateInputs',
        { fromBlock: txResult.blockNumber ?? 'latest' },
      );
      expect(eventLogs.length === 1);
      log = dolomiteMargin.logs.parseEventLogWithContract(liquidContract, eventLogs[0]);
      expect(log.args.accountNumber).toEqual(accountNumber2);
      expect(log.args.heldMarketId).toEqual(heldMarket);
      expect(log.args.heldDeltaWei).toEqual(par.times(premium)
        .times(-1));
      expect(log.args.owedMarketId).toEqual(owedMarket);
      expect(log.args.owedDeltaWei).toEqual(par);

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with failed callback', async () => {
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
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackFailure');
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);
      expect(log.args.reason).toEqual('');

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with failed callback with error message', async () => {
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
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackFailure');
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);
      expect(log.args.reason).toEqual('TestLiquidationCallback: purposeful reversion');

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with failed callback with error message that is cut off', async () => {
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
      await liquidContract.methods.setRevertMessage(revertMessage).send();

      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackFailure');
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);
      expect(log.args.reason).toEqual(revertMessage.substring(0, 188));

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with failed callback that consumes tons of gas', async () => {
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
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });
      console.log(`\tExpire with callback reversion with massive gas consumption gas used: ${txResult.gasUsed}`);

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackFailure');
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);
      expect(log.args.reason).toEqual('');

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });

    it('Succeeds with failed callback that returns a memory bomb', async () => {
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
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          owedMarket,
          par.times(-1),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          heldMarket,
          par.times(2),
        ),
        dolomiteMargin.testing.setAccountBalance(
          liquidContract.options.address,
          accountNumber2,
          collateralMarket,
          par.times(4),
        ),
      ]);

      await setExpiryForCallbackContract(liquidContract, INTEGERS.ONE, true);

      await fastForward(60 * 60 * 24);

      const txResult = await dolomiteMargin.operation
        .initiate()
        .liquidateExpiredAccount({
          liquidMarketId: owedMarket,
          payoutMarketId: heldMarket,
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          liquidAccountOwner: liquidContract.options.address,
          liquidAccountId: accountNumber2,
          amount: {
            value: INTEGERS.ZERO,
            denomination: AmountDenomination.Principal,
            reference: AmountReference.Target,
          },
        })
        .commit({ from: globalOperator });
      console.log(`\tExpire with callback reversion with memory bomb gas used: ${txResult.gasUsed}`);

      const logs = dolomiteMargin.logs.parseLogs(txResult)
        .filter(log => log.name === 'LogLiquidationCallbackFailure');
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.args.liquidAccountOwner).toEqual(liquidContract.options.address);
      expect(log.args.liquidAccountNumber).toEqual(accountNumber2);
      expect(log.args.reason).toEqual('');

      const [held1, owed1, held2, owed2] = await Promise.all([
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, heldMarket),
        dolomiteMargin.getters.getAccountPar(owner1, accountNumber1, owedMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, heldMarket),
        dolomiteMargin.getters.getAccountPar(liquidContract.options.address, accountNumber2, owedMarket),
      ]);

      expect(owed1).toEqual(zero);
      expect(owed2).toEqual(zero);
      expect(held1).toEqual(par.times(premium));
      expect(held2).toEqual(par.times(2)
        .minus(held1));
    });
  });
});

// ============ Helper Functions ============

async function setExpiryForSelf(
  timeDelta: BigNumber,
  forceUpdate: boolean,
  options?: any,
) {
  return dolomiteMargin.operation
    .initiate()
    .setExpiry({
      primaryAccountOwner: owner2,
      primaryAccountId: accountNumber2,
      expiryArgs: [
        {
          timeDelta,
          forceUpdate,
          accountOwner: owner2,
          accountId: accountNumber2,
          marketId: owedMarket,
        },
      ],
    })
    .commit({ ...options, from: owner2 });
}

async function setExpiryForCallbackContract(
  callbackContract: TestLiquidationCallback,
  timeDelta: BigNumber,
  forceUpdate: boolean,
  options?: any,
) {
  await callbackContract.methods.setLocalOperator()
    .send({ ...options, from: owner2 });

  return dolomiteMargin.operation
    .initiate()
    .setExpiry({
      primaryAccountOwner: callbackContract.options.address,
      primaryAccountId: accountNumber2,
      expiryArgs: [
        {
          timeDelta,
          forceUpdate,
          accountOwner: callbackContract.options.address,
          accountId: accountNumber2,
          marketId: owedMarket,
        },
      ],
    })
    .commit({ ...options, from: owner2 });
}

async function setExpiryForOther(
  timeDelta: BigNumber,
  forceUpdate: boolean,
  options?: any,
) {
  return dolomiteMargin.operation
    .initiate()
    .setExpiry({
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      expiryArgs: [
        {
          timeDelta,
          forceUpdate,
          accountOwner: owner2,
          accountId: accountNumber2,
          marketId: owedMarket,
        },
      ],
    })
    .commit({ ...options, from: owner1 });
}

async function expectExpireOkay(glob: Object, options?: Object) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return dolomiteMargin.operation
    .initiate()
    .trade(combinedGlob)
    .commit({ from: globalOperator, ...options });
}

async function expectExpireRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectExpireOkay(glob, options), reason);
}

async function expectExpiry(
  txResult: TxResult,
  owner: address,
  accountNumber: BigNumber,
  market: BigNumber,
  timeDelta: BigNumber,
) {
  const { timestamp } = await dolomiteMargin.web3.eth.getBlock(txResult.blockNumber);
  const expectedExpiryTime = timeDelta.isZero()
    ? zero
    : timeDelta.plus(timestamp);

  const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
  expect(logs.length).toEqual(1);
  const expirySetLog = logs[0];
  expect(expirySetLog.name).toEqual('ExpirySet');
  expect(expirySetLog.args.owner).toEqual(owner);
  expect(expirySetLog.args.number).toEqual(accountNumber);
  expect(expirySetLog.args.marketId).toEqual(market);
  expect(expirySetLog.args.time).toEqual(expectedExpiryTime);

  const expiry = await dolomiteMargin.expiry.getExpiry(
    owner2,
    accountNumber2,
    owedMarket,
  );
  expect(expiry).toEqual(expectedExpiryTime);
}

async function expectNoExpirySet(txResult: TxResult) {
  const logs = dolomiteMargin.logs.parseLogs(txResult, { skipOperationLogs: true });
  expect(logs.length).toEqual(0);
  const expiry = await dolomiteMargin.expiry.getExpiry(
    owner2,
    accountNumber2,
    owedMarket,
  );
  expect(expiry).toEqual(startingExpiry);
}

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

function mapValuesToMap<T>(values: (number | T)[][]): { [marketId: string]: T } {
  return values.reduce<{ [marketId: string]: T }>((memo, [marketId, value]) => {
    memo[(marketId as number).toString(10)] = value as T;
    return memo;
  }, {});
}
