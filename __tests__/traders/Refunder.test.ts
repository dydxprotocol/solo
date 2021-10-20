import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { deployContract } from '../helpers/Deploy';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { INTEGERS } from '../../src/lib/Constants';
import { setupMarkets } from '../helpers/SoloHelpers';
import { expectThrow } from '../../src/lib/Expect';
import { address, Refund } from '../../src/types';
import RefunderJson from '../../build/contracts/Refunder.json';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let giver: address;
let receiver: address;
let rando: address;

const giverNumber = INTEGERS.ZERO;
const receiverNumber = INTEGERS.ONE;
const giveMarket = INTEGERS.ZERO;
const blankMarket = INTEGERS.ONE;
const wei = new BigNumber(10000);
const zero = new BigNumber(0);
let defaultGlob: Refund;

describe('Refunder', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    giver = accounts[2];
    receiver = accounts[3];
    rando = accounts[9];

    defaultGlob = {
      wei,
      primaryAccountOwner: giver,
      primaryAccountId: giverNumber,
      receiverAccountOwner: receiver,
      receiverAccountId: receiverNumber,
      refundMarketId: giveMarket,
      otherMarketId: blankMarket,
    };

    await resetEVM();
    await Promise.all([
      setupMarkets(solo, accounts),
      solo.contracts.send(
        solo.contracts.refunder.methods.addGiver(giver),
        { from: admin },
      ),
    ]);
    await mineAvgBlock();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('constructor', () => {
    it('Succeeds', async () => {
      const createdContract = await deployContract(
        solo,
        RefunderJson,
        [
          solo.contracts.soloMargin.options.address,
          [giver, rando],
        ],
      );
      const [
        giverIsGiver,
        randoIsGiver,
        receiverIsGiver,
        gottenSolo,
      ] = await Promise.all([
        solo.contracts.call(
          createdContract.methods.g_givers(giver),
        ),
        solo.contracts.call(
          createdContract.methods.g_givers(rando),
        ),
        solo.contracts.call(
          createdContract.methods.g_givers(receiver),
        ),
        solo.contracts.call(
          createdContract.methods.SOLO_MARGIN(),
        ),
      ]);
      expect(giverIsGiver).toEqual(true);
      expect(randoIsGiver).toEqual(true);
      expect(receiverIsGiver).toEqual(false);
      expect(gottenSolo).toEqual(solo.contracts.soloMargin.options.address);
    });
  });

  describe('addGiver', () => {
    it('Succeeds', async () => {
      const txResult = await solo.contracts.send(
        solo.contracts.refunder.methods.addGiver(rando),
        { from: admin },
      );
      const isGiver = await solo.contracts.call(
        solo.contracts.refunder.methods.g_givers(rando),
      );
      expect(isGiver).toEqual(true);
      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogGiverAdded');
      expect(log.args.giver).toEqual(rando);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.refunder.methods.addGiver(rando),
          { from: rando },
        ),
      );
    });
  });

  describe('removeGiver', () => {
    it('Succeeds', async () => {
      const txResult = await solo.contracts.send(
        solo.contracts.refunder.methods.removeGiver(giver),
        { from: admin },
      );
      const isGiver = await solo.contracts.call(
        solo.contracts.refunder.methods.g_givers(giver),
      );
      expect(isGiver).toEqual(false);
      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogGiverRemoved');
      expect(log.args.giver).toEqual(giver);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.refunder.methods.removeGiver(giver),
          { from: rando },
        ),
      );
    });
  });

  describe('getTradeCost', () => {
    it('Succeeds', async () => {
      await solo.testing.setAccountBalance(giver, giverNumber, giveMarket, wei);

      const txResult = await solo.operation.initiate()
        .refund(defaultGlob)
        .commit({ from: giver });

      await expectBalances(
        wei,
        zero,
        zero,
        zero,
      );

      const logs = solo.logs.parseLogs(txResult, {
        skipRefunderLogs: false,
        skipAdminLogs: true,
        skipExpiryLogs: true,
        skipFinalSettlementLogs: true,
        skipOperationLogs: true,
        skipPermissionLogs: true,
        skipLimitOrdersLogs: true,
        skipSignedOperationProxyLogs: true,
      });
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogRefund');
      expect(log.args.account).toEqual({
        owner: receiver,
        number: receiverNumber,
      });
      expect(log.args.marketId).toEqual(giveMarket);
      expect(log.args.amount).toEqual(wei);
    });

    it('Fails for zero', async () => {
      await expectThrow(
        solo.operation.initiate().refund({
          ...defaultGlob,
          wei: zero,
        }).commit({ from: giver }),
        'Refunder: Refund must be positive',
      );
    });

    it('Fails for negative', async () => {
      await expectThrow(
        solo.operation.initiate().refund({
          ...defaultGlob,
          wei: wei.times(-1),
        }).commit({ from: giver }),
        'Refunder: Refund must be positive',
      );
    });

    it('Fails for non-approved giver', async () => {
      await expectThrow(
        solo.operation.initiate().refund({
          ...defaultGlob,
          primaryAccountOwner: rando,
        }).commit({ from: rando }),
        `Refunder: Giver not approved <${rando.toLowerCase()}>`,
      );
    });

    it('Fails for non-solo caller', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.refunder.methods.getTradeCost(
            '0',
            '1',
            {
              owner: receiver,
              number: receiverNumber.toFixed(0),
            },
            {
              owner: giver,
              number: giverNumber.toFixed(0),
            },
            {
              sign: false,
              value: '0',
            },
            {
              sign: false,
              value: '0',
            },
            {
              sign: true,
              value: '100',
            },
            [],
          ),
          { from: rando },
        ),
        'OnlySolo: Only Solo can call function',
      );
    });
  });
});

async function expectBalances(
  expectedRG: BigNumber,
  expectedGG: BigNumber,
  expectedRB: BigNumber,
  expectedGB: BigNumber,
) {
  const [
    rg,
    gg,
    rb,
    gb,
  ] = await Promise.all([
    solo.getters.getAccountWei(receiver, receiverNumber, giveMarket),
    solo.getters.getAccountWei(giver, giverNumber, giveMarket),
    solo.getters.getAccountWei(receiver, receiverNumber, blankMarket),
    solo.getters.getAccountWei(giver, giverNumber, blankMarket),
  ]);
  expect(rg).toEqual(expectedRG);
  expect(gg).toEqual(expectedGG);
  expect(rb).toEqual(expectedRB);
  expect(gb).toEqual(expectedGB);
}
