import BigNumber from 'bignumber.js';
import { address, Integer, INTEGERS } from '../../src';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { resetEVM, snapshot } from '../helpers/EVM';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import DolomiteMarginMath from '../../src/modules/DolomiteMarginMath';
import { expectThrow } from '../../src/lib/Expect';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let snapshotId: string;
let admin: address;
let user: address;

const market = INTEGERS.ZERO;
const zero = new BigNumber(0);
const par = new BigNumber('100000000000000000000');
const wei = new BigNumber('120000000000000000000');
const accountIndex = new BigNumber(123);
const defaultIsClosing = false;
const defaultIsRecyclable = false;

describe('DepositWithdrawalProxy', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    user = dolomiteMargin.getDefaultAccount();
    await resetEVM();
    await Promise.all([
      setupMarkets(dolomiteMargin, accounts),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.weth.address, new BigNumber('1e40')),
      dolomiteMargin.admin.setGlobalOperator(admin, true, { from: admin }),
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
    await dolomiteMargin.testing.setAccountBalance(user, INTEGERS.ZERO, market, par);
    await dolomiteMargin.testing.setAccountBalance(user, accountIndex, market, par);
    await dolomiteMargin.testing.tokenA.issueTo(wei, user);
    await dolomiteMargin.testing.tokenA.issueTo(wei.times(2), dolomiteMargin.contracts.dolomiteMargin.options.address);
    await dolomiteMargin.testing.tokenA.approve(
      dolomiteMargin.contracts.dolomiteMargin.options.address,
      INTEGERS.MAX_UINT,
    );
    const lastUpdateTimestamp = await dolomiteMargin.multiCall.getCurrentBlockTimestamp();
    await dolomiteMargin.testing.setMarketIndex(market, {
      borrow: new BigNumber('1.1'),
      supply: new BigNumber('1.2'),
      lastUpdate: lastUpdateTimestamp,
    });
    const index = await dolomiteMargin.getters.getMarketCurrentIndex(market);
    expect(DolomiteMarginMath.parToWei(par, index)).toEqual(wei);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('depositWei', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.depositWei(accountIndex, market, wei);
      await expectProtocolBalanceWei(accountIndex, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });

    it('should work when depositing max uint', async () => {
      await dolomiteMargin.depositProxy.depositWei(accountIndex, market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(accountIndex, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });
  });

  describe('depositWeiIntoDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.depositWeiIntoDefaultAccount(market, wei);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });

    it('should work when depositing max uint', async () => {
      await dolomiteMargin.depositProxy.depositWeiIntoDefaultAccount(market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });
  });

  describe('withdrawWei', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.withdrawWei(accountIndex, market, wei);
      await expectProtocolBalanceWei(accountIndex, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.withdrawWei(accountIndex, market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(accountIndex, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });
  });

  describe('withdrawWeiIntoDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.withdrawWeiIntoDefaultAccount(market, wei);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.withdrawWeiIntoDefaultAccount(market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });
  });

  describe('depositPar', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.depositPar(accountIndex, market, par);
      await expectProtocolBalancePar(accountIndex, market, par.times(2));
      await expectWalletBalancePar(market, INTEGERS.ZERO);
    });

    it('should not work when depositing max uint', async () => {
      await expectThrow(dolomiteMargin.depositProxy.depositPar(accountIndex, market, INTEGERS.MAX_UINT));
    });
  });

  describe('depositParIntoDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.depositParIntoDefaultAccount(market, par);
      await expectProtocolBalancePar(INTEGERS.ZERO, market, par.times(2));
      await expectWalletBalancePar(market, INTEGERS.ZERO);
    });

    it('should work when depositing max uint', async () => {
      await expectThrow(dolomiteMargin.depositProxy.depositParIntoDefaultAccount(market, INTEGERS.MAX_UINT));
    });
  });

  describe('withdrawPar', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.withdrawPar(accountIndex, market, par);
      await expectProtocolBalancePar(accountIndex, market, INTEGERS.ZERO);
      await expectWalletBalancePar(market, par.times(2));
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.withdrawPar(accountIndex, market, INTEGERS.MAX_UINT);
      await expectProtocolBalancePar(accountIndex, market, INTEGERS.ZERO);
      await expectWalletBalancePar(market, par.times(2));
    });
  });

  describe('withdrawParFromDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.withdrawParFromDefaultAccount(market, par);
      await expectProtocolBalancePar(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalancePar(market, par.times(2));
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.withdrawParFromDefaultAccount(market, INTEGERS.MAX_UINT);
      await expectProtocolBalancePar(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalancePar(market, par.times(2));
    });
  });

  // ========================= Helper Functions =========================

  async function expectProtocolBalanceWei(
    accountIndex: Integer,
    market: Integer,
    amountWei: Integer,
  ): Promise<void> {
    const balance = await dolomiteMargin.getters.getAccountWei(user, accountIndex, market);
    expect(balance).toEqual(amountWei);
  }

  async function expectProtocolBalancePar(
    accountIndex: Integer,
    market: Integer,
    amountPar: Integer,
  ): Promise<void> {
    const balance = await dolomiteMargin.getters.getAccountPar(user, accountIndex, market);
    expect(balance).toEqual(amountPar);
  }

  async function expectWalletBalanceWei(market: Integer, amount: Integer): Promise<void> {
    const balance = await dolomiteMargin.testing.tokenA.getBalance(user);
    expect(balance).toEqual(amount);
  }

  async function expectWalletBalancePar(market: Integer, amount: Integer): Promise<void> {
    const balance = await dolomiteMargin.testing.tokenA.getBalance(user);
    const index = await dolomiteMargin.getters.getMarketCurrentIndex(market);
    expect(balance).toEqual(DolomiteMarginMath.parToWei(amount, index));
  }
});
