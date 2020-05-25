import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { deployContract } from '../helpers/Deploy';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { INTEGERS } from '../../src/lib/Constants';
import { setupMarkets } from '../helpers/SoloHelpers';
import { expectThrow } from '../../src/lib/Expect';
import {
  address,
  DaiMigrate,
  AmountDenomination,
  AmountReference,
} from '../../src/types';
import DaiMigratorJson from '../../build/contracts/DaiMigrator.json';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let migrator: address;
let user: address;
let rando: address;

const migratorNumber = INTEGERS.ZERO;
const userNumber = INTEGERS.ONE;
const saiMarket = new BigNumber(1);
const daiMarket = new BigNumber(3);
let defaultGlob: DaiMigrate;
const weiString = AmountDenomination.Wei.toString();
const deltaString = AmountReference.Delta.toString();

describe('DaiMigrator', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    migrator = accounts[2];
    user = accounts[3];
    rando = accounts[9];

    defaultGlob = {
      primaryAccountOwner: migrator,
      primaryAccountId: migratorNumber,
      userAccountOwner: user,
      userAccountId: userNumber,
      amount: {
        value: INTEGERS.ZERO,
        denomination: AmountDenomination.Par,
        reference: AmountReference.Target,
      },
    };

    await resetEVM();
    const numMarkets = 4;
    await Promise.all([
      setupMarkets(solo, accounts, numMarkets),
      solo.contracts.send(
        solo.contracts.daiMigrator.methods.addMigrator(migrator),
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
        DaiMigratorJson,
        [[migrator, rando]],
      );
      const [
        migratorIsMigrator,
        randoIsMigrator,
        userIsMigrator,
      ] = await Promise.all([
        solo.contracts.call(
          createdContract.methods.g_migrators(migrator),
        ),
        solo.contracts.call(
          createdContract.methods.g_migrators(rando),
        ),
        solo.contracts.call(
          createdContract.methods.g_migrators(user),
        ),
      ]);
      expect(migratorIsMigrator).toEqual(true);
      expect(randoIsMigrator).toEqual(true);
      expect(userIsMigrator).toEqual(false);
    });
  });

  describe('addMigrator', () => {
    it('Succeeds', async () => {
      await solo.contracts.send(
        solo.contracts.daiMigrator.methods.addMigrator(rando),
        { from: admin },
      );
      const isMigrator = await solo.contracts.call(
        solo.contracts.daiMigrator.methods.g_migrators(rando),
      );
      expect(isMigrator).toEqual(true);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.daiMigrator.methods.addMigrator(rando),
          { from: rando },
        ),
      );
    });
  });

  describe('removeMigrator', () => {
    it('Succeeds', async () => {
      await solo.contracts.send(
        solo.contracts.daiMigrator.methods.removeMigrator(migrator),
        { from: admin },
      );
      const isMigrator = await solo.contracts.call(
        solo.contracts.daiMigrator.methods.g_migrators(migrator),
      );
      expect(isMigrator).toEqual(false);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.daiMigrator.methods.removeMigrator(migrator),
          { from: rando },
        ),
      );
    });
  });

  describe('getTradeCost', () => {
    it('Succeeds for zero', async () => {
      await solo.operation.initiate()
        .daiMigrate(defaultGlob)
        .commit({ from: migrator });
    });

    it('Succeeds for pos->zero', async () => {
      const result = await callTradeCost({
        oldInputParBN: new BigNumber(1),
        newInputParBN: new BigNumber(0),
        inputWeiBN: new BigNumber(-1),
      });
      expect(result).toEqual({
        sign: true,
        denomination: weiString,
        ref: deltaString,
        value: '1',
      });
    });

    it('Succeeds for pos->less pos', async () => {
      const result = await callTradeCost({
        oldInputParBN: new BigNumber(2),
        newInputParBN: new BigNumber(1),
        inputWeiBN: new BigNumber(-1),
      });
      expect(result).toEqual({
        sign: true,
        denomination: weiString,
        ref: deltaString,
        value: '1',
      });
    });

    it('Succeeds for neg->zero', async () => {
      const result = await callTradeCost({
        oldInputParBN: new BigNumber(-1),
        newInputParBN: new BigNumber(0),
        inputWeiBN: new BigNumber(1),
      });
      expect(result).toEqual({
        sign: false,
        denomination: weiString,
        ref: deltaString,
        value: '1',
      });
    });

    it('Succeeds for neg->less neg', async () => {
      const result = await callTradeCost({
        oldInputParBN: new BigNumber(-2),
        newInputParBN: new BigNumber(-1),
        inputWeiBN: new BigNumber(1),
      });
      expect(result).toEqual({
        sign: false,
        denomination: weiString,
        ref: deltaString,
        value: '1',
      });
    });

    it('Fails for pos->neg', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(1),
          newInputParBN: new BigNumber(-1),
          inputWeiBN: new BigNumber(-2),
        }),
        'DaiMigrator: newInputPar cannot be negative',
      );
    });

    it('Fails for neg->pos', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(-1),
          newInputParBN: new BigNumber(1),
          inputWeiBN: new BigNumber(2),
        }),
        'DaiMigrator: newInputPar cannot be positive',
      );
    });

    it('Fails for neg->more neg', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(-1),
          newInputParBN: new BigNumber(-2),
          inputWeiBN: new BigNumber(-1),
        }),
        'DaiMigrator: inputWei must be positive',
      );
    });

    it('Fails for pos->more pos', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(1),
          newInputParBN: new BigNumber(2),
          inputWeiBN: new BigNumber(1),
        }),
        'DaiMigrator: inputWei must be negative',
      );
    });

    it('Fails for zero->pos', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(0),
          newInputParBN: new BigNumber(1),
          inputWeiBN: new BigNumber(1),
        }),
        'DaiMigrator: inputWei must be zero',
      );
    });

    it('Fails for zero->neg', async () => {
      await expectThrow(
        callTradeCost({
          oldInputParBN: new BigNumber(0),
          newInputParBN: new BigNumber(-1),
          inputWeiBN: new BigNumber(-1),
        }),
        'DaiMigrator: inputWei must be zero',
      );
    });

    it('Fails for invalid markets', async () => {
      await expectThrow(
        callTradeCost({
          saiMarketBN: daiMarket,
          daiMarketBN: saiMarket,
          oldInputParBN: new BigNumber(2),
          newInputParBN: new BigNumber(1),
          inputWeiBN: new BigNumber(-1),
        }),
        'DaiMigrator: Invalid markets',
      );
    });

    it('Fails for non-migrator', async () => {
      await expectThrow(
        solo.operation.initiate().daiMigrate({
          ...defaultGlob,
          primaryAccountOwner: rando,
        }).commit({ from: rando }),
        `DaiMigrator: Migrator not approved <${rando.toLowerCase()}>`,
      );
    });
  });
});

async function callTradeCost({
  saiMarketBN = saiMarket,
  daiMarketBN = daiMarket,
  migratorAccount = {
    owner: migrator,
    number: migratorNumber.toFixed(0),
  },
  oldInputParBN,
  newInputParBN,
  inputWeiBN,
}) {
  const result = await solo.contracts.daiMigrator.methods.getTradeCost(
    saiMarketBN.toFixed(0),
    daiMarketBN.toFixed(0),
    {
      owner: user,
      number: '0',
    },
    migratorAccount,
    bnToValue(oldInputParBN),
    bnToValue(newInputParBN),
    bnToValue(inputWeiBN),
    [],
  ).call();
  return {
    sign: result[0],
    denomination: result[1],
    ref: result[2],
    value: result[3],
  };
}

function bnToValue(bn: BigNumber) {
  return {
    sign: bn.gt(0),
    value: bn.abs().toFixed(0),
  };
}
