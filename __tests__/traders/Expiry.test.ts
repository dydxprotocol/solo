import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
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
const defaultTime = new BigNumber(1234321);
const par = new BigNumber(10000);
const zero = new BigNumber(0);
const premium = new BigNumber('1.05');
const defaultPrice = new BigNumber('1e40');
let defaultGlob: Trade;
let heldGlob: Trade;

describe('Expiry', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();
    owner2 = accounts[3];
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: owedMarket,
      outputMarketId: heldMarket,
      autoTrader: solo.contracts.expiry.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket, defaultTime),
    };
    heldGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: heldMarket,
      outputMarketId: owedMarket,
      autoTrader: solo.contracts.expiry.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: toBytes(owedMarket, defaultTime),
    };

    await resetEVM();
    await Promise.all([
      setupMarkets(solo, accounts),
      solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par.times(-1)),
      solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(2)),
      solo.testing.setAccountBalance(owner1, accountNumber1, owedMarket, par),
      solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, par.times(4)),
    ]);
    await setExpiry(defaultTime);
    await mineAvgBlock();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('set expiry', () => {
    it('Succeeds in setting expiry', async () => {
      const newTime = defaultTime.plus(1000);
      const txResult = await setExpiry(newTime);
      const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
      expect(expiry).toEqual(newTime);

      console.log(`\tSet expiry gas used: ${txResult.gasUsed}`);
    });

    it('Does not parse logs', async () => {
      const newTime = defaultTime.plus(1000);
      const txResult = await setExpiry(newTime);
      const noLogs = solo.logs.parseLogs(txResult);
      expect(noLogs.filter((e: any) => e.name === 'ExpirySet').length).toEqual(0);
    });

    it('Doesnt set expiry for non-negative balances', async () => {
      const newTime = defaultTime.plus(1000);
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await setExpiry(newTime);
      const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
      expect(expiry).toEqual(defaultTime);
    });

    it('Allows setting expiry back to zero even for non-negative balances', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await setExpiry(zero, { gas: '5000000' });
      const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
      expect(expiry).toEqual(zero);
    });

    it('Fails for invalid number of bytes', async () => {
      const errorMessage = 'Expiry: Call data invalid length';
      const callGlob = {
        primaryAccountOwner: owner1,
        primaryAccountId: accountNumber1,
        callee: solo.contracts.expiry.options.address,
        data: [],
      };
      await expectThrow(
        solo.operation.initiate().call(callGlob).commit(),
        errorMessage,
      );

      const bunchOfZeroes = [];
      for (let i = 0; i < 100; i += 1) {
        bunchOfZeroes.push([0]);
      }
      await expectThrow(
        solo.operation.initiate().call({
          ...callGlob,
          data: bunchOfZeroes,
        }).commit(),
        errorMessage,
      );
    });
  });

  describe('expire account (heldAmount)', () => {
    beforeEach(async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par);
    });

    it('Succeeds in expiring', async () => {
      const txResult = await expectExpireOkay(heldGlob);

      const logs = solo.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

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

      console.log(`\tExpiring (held) gas used: ${txResult.gasUsed}`);
    });

    it('Succeeds in expiring and setting expiry back to zero', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(premium));
      await expectExpireOkay(heldGlob);
      const expiry = await solo.getters.getExpiry(owner2, accountNumber2, heldMarket);
      expect(expiry).toEqual(zero);
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

      const logs = solo.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

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

    it('Succeeds in expiring including premiums', async () => {
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

      await expectExpireOkay(heldGlob);

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
      await expectExpireOkay(heldGlob);

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for negative inputMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(-1));
      await expectExpireRevert(
        heldGlob,
        'Expiry: inputMarket mismatch',
      );
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
      await setExpiry(zero);
      await expectExpireRevert(
        heldGlob,
        'Expiry: Expiry not set',
      );
    });

    it('Fails for a future expiry', async () => {
      await setExpiry(INTEGERS.ONES_31);
      await expectExpireRevert(
        heldGlob,
        'Expiry: Borrow not yet expired',
      );
    });

    it('Fails for an expiry past maxExpiry', async () => {
      await expectExpireRevert(
        {
          ...heldGlob,
          data: toBytes(owedMarket, defaultTime.minus(1)),
        },
        'Expiry: Expiry past maxExpiry',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectExpireRevert(
        {
          ...heldGlob,
          data: toBytes(owedMarket),
        },
        'Expiry: Trade data invalid length',
      );
    });

    it('Fails for zero owedMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, zero);
      await expectExpireRevert(
        heldGlob,
        'Expiry: Borrows must be negative',
      );
    });

    it('Fails for positive owedMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await expectExpireRevert(
        heldGlob,
        'Expiry: Borrows must be negative',
      );
    });

    it('Fails for over-repaying the borrow', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(2));
      await expectExpireRevert(
        heldGlob,
        'Expiry: outputMarket too small',
      );
    });
  });

  describe('expire account (owedAmount)', () => {
    it('Succeeds in expiring', async () => {
      const txResult = await expectExpireOkay({});
      const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
      expect(expiry).toEqual(zero);

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

      const logs = solo.logs.parseLogs(txResult);
      logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

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

    it('Succeeds in expiring including premiums', async () => {
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

      await expectExpireOkay({});

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

    it('Fails for non-solo calls', async () => {
      await expectThrow(
        solo.contracts.send(
          solo.contracts.expiry.methods.callFunction(
            owner1,
            {
              owner: owner1,
              number: accountNumber1.toFixed(0),
            },
            [],
          ),
        ),
        'OnlySolo: Only Solo can call function',
      );
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
      await expectExpireOkay({});

      const end = await Promise.all(getAllBalances);
      expect(start).toEqual(end);
    });

    it('Fails for positive inputMarket', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
      await expectExpireRevert(
        {},
        'Expiry: outputMarket mismatch',
      );
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
      await setExpiry(zero);
      await expectExpireRevert(
        {},
        'Expiry: Expiry not set',
      );
    });

    it('Fails for a future expiry', async () => {
      await setExpiry(INTEGERS.ONES_31);
      await expectExpireRevert(
        {},
        'Expiry: Borrow not yet expired',
      );
    });

    it('Fails for an expiry past maxExpiry', async () => {
      await expectExpireRevert(
        {
          data: toBytes(owedMarket, defaultTime.minus(1)),
        },
        'Expiry: Expiry past maxExpiry',
      );
    });

    it('Fails for invalid trade data', async () => {
      await expectExpireRevert(
        {
          data: toBytes(owedMarket),
        },
        'Expiry: Trade data invalid length',
      );
    });

    it('Fails for zero collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, zero);
      await expectExpireRevert(
        {},
        'Expiry: Collateral must be positive',
      );
    });

    it('Fails for negative collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(-1));
      await expectExpireRevert(
        {},
        'Expiry: Collateral must be positive',
      );
    });

    it('Fails for overtaking collateral', async () => {
      await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par);
      await expectExpireRevert(
        {},
        'Expiry: outputMarket too small',
      );
    });
  });

  describe('AccountOperation#fullyLiquidateExpiredAccount', () => {
    it('Succeeds for two assets', async () => {
      const prices = [
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
      ];
      const premiums = [
        INTEGERS.ZERO,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
      ];
      const collateralPreferences = [
        owedMarket,
        heldMarket,
        collateralMarket,
      ];
      const weis = await Promise.all([
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2)),
      ]);
      await solo.operation.initiate().fullyLiquidateExpiredAccount(
        owner1,
        accountNumber1,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTime,
        defaultTime.plus(INTEGERS.ONE_DAY_IN_SECONDS),
        weis,
        prices,
        premiums,
        collateralPreferences,
      ).commit();

      const balances = await Promise.all([
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(par.times(2).minus(par.times(premium)));
      expect(balances[2]).toEqual(par.times(4));
    });

    it('Succeeds for three assets', async () => {
      const prices = [
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
      ];
      const premiums = [
        INTEGERS.ZERO,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
      ];
      const collateralPreferences = [
        owedMarket,
        heldMarket,
        collateralMarket,
      ];
      await Promise.all([
        solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par),
        solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, par),
      ]);
      const weis = await Promise.all([
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2)),
      ]);
      await solo.operation.initiate().fullyLiquidateExpiredAccount(
        owner1,
        accountNumber1,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTime,
        defaultTime.plus(INTEGERS.ONE_DAY_IN_SECONDS),
        weis,
        prices,
        premiums,
        collateralPreferences,
      ).commit();

      const balances = await Promise.all([
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(zero);

      // calculate the last expected value
      const remainingOwed = par.minus(par.div(premium));
      expect(balances[2]).toEqual(
        par.minus(remainingOwed.times(premium)).integerValue(BigNumber.ROUND_UP),
      );
    });

    it('Succeeds for three assets (with premiums)', async () => {
      const prices = [
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
        INTEGERS.ONES_31,
      ];
      const premiums = [
        new BigNumber('0.1'),
        new BigNumber('0.2'),
        new BigNumber('0.3'),
      ];
      const collateralPreferences = [
        owedMarket,
        heldMarket,
        collateralMarket,
      ];
      await Promise.all([
        solo.admin.setSpreadPremium(heldMarket, premiums[0], { from: admin }),
        solo.admin.setSpreadPremium(owedMarket, premiums[1], { from: admin }),
        solo.admin.setSpreadPremium(collateralMarket, premiums[2], { from: admin }),
        solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(premium)),
        solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, par),
      ]);
      const weis = await Promise.all([
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(0)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(1)),
        solo.getters.getAccountWei(owner2, accountNumber2, new BigNumber(2)),
      ]);
      await solo.operation.initiate().fullyLiquidateExpiredAccount(
        owner1,
        accountNumber1,
        owner2,
        accountNumber2,
        owedMarket,
        defaultTime,
        defaultTime.plus(INTEGERS.ONE_DAY_IN_SECONDS),
        weis,
        prices,
        premiums,
        collateralPreferences,
      ).commit();

      const balances = await Promise.all([
        solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
        solo.getters.getAccountPar(owner2, accountNumber2, collateralMarket),
      ]);

      expect(balances[0]).toEqual(zero);
      expect(balances[1]).toEqual(zero);

      // calculate the last expected value
      const firstPrem = premium.minus(1).times('1.1').times('1.2').plus(1);
      const secondPrem = premium.minus(1).times('1.2').times('1.3').plus(1);
      const remainingOwed = par.minus(par.times(premium).div(firstPrem));
      expect(balances[2]).toEqual(
        par.minus(remainingOwed.times(secondPrem)).integerValue(BigNumber.ROUND_UP),
      );
    });
  });

  describe('#getSpreadAdjustedPrices', () => {
    it('Succeeds for recently expired positions', async () => {
      const txResult = await setExpiry(zero);
      const { timestamp } = await solo.web3.eth.getBlock(txResult.blockNumber);
      await mineAvgBlock();
      const prices = await solo.getters.getExpiryPrices(
        heldMarket,
        owedMarket,
        new BigNumber(timestamp),
      );
      expect(prices.owedPrice.lt(defaultPrice.times(premium))).toEqual(true);
      expect(prices.owedPrice.gt(defaultPrice)).toEqual(true);
      expect(prices.heldPrice).toEqual(defaultPrice);
    });

    it('Succeeds for very expired positions', async () => {
      const prices = await solo.getters.getExpiryPrices(
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
      const oldValue = await solo.getters.getExpiryRampTime();
      expect(oldValue).toEqual(INTEGERS.ONE_HOUR_IN_SECONDS);
      await solo.admin.setExpiryRampTime(INTEGERS.ONE_DAY_IN_SECONDS, { from: admin });
      const newValue = await solo.getters.getExpiryRampTime();
      expect(newValue).toEqual(INTEGERS.ONE_DAY_IN_SECONDS);
    });

    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.admin.setExpiryRampTime(INTEGERS.ONE_DAY_IN_SECONDS, { from: owner1 }),
      );
    });
  });

  describe('#liquidateExpiredAccount', () => {
    it('Succeeds', async () => {
      await solo.operation.initiate().liquidateExpiredAccount({
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
      }).commit();

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

async function setExpiry(expiryTime: BigNumber, options?: any) {
  const txResult = await solo.operation.initiate().setExpiry({
    expiryTime,
    primaryAccountOwner: owner2,
    primaryAccountId: accountNumber2,
    marketId: owedMarket,
  }).commit({ ...options, from: owner2 });
  return txResult;
}

async function expectExpireOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return solo.operation.initiate().trade(combinedGlob).commit(options);
}

async function expectExpireRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectExpireOkay(glob, options), reason);
}
