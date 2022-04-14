import BigNumber from 'bignumber.js';
import { address, Integer, INTEGERS, TxResult } from '../../src';
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
let market: Integer;
let ethMarket: Integer;

const zero = new BigNumber(0);
const par = new BigNumber('10000000000000000000');
const wei = new BigNumber('12000000000000000000');
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
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenA.address, new BigNumber('1e40')),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.weth.address, new BigNumber('1e40')),
      dolomiteMargin.admin.setGlobalOperator(admin, true, { from: admin }),
    ]);
    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.weth.address,
      dolomiteMargin.testing.priceOracle.address,
      dolomiteMargin.testing.interestSetter.address,
      zero,
      zero,
      zero,
      defaultIsClosing,
      defaultIsRecyclable,
      { from: admin },
    );

    market = await dolomiteMargin.getters.getMarketIdByTokenAddress(dolomiteMargin.testing.tokenA.address);
    ethMarket = await dolomiteMargin.getters.getMarketIdByTokenAddress(dolomiteMargin.weth.address);

    await dolomiteMargin.testing.setAccountBalance(user, INTEGERS.ZERO, market, par);
    await dolomiteMargin.testing.setAccountBalance(user, accountIndex, market, par);
    await dolomiteMargin.testing.setAccountBalance(user, INTEGERS.ZERO, ethMarket, par);
    await dolomiteMargin.testing.setAccountBalance(user, accountIndex, ethMarket, par);

    await dolomiteMargin.testing.tokenA.issueTo(wei, user);
    await dolomiteMargin.testing.tokenA.issueTo(wei.times(2), dolomiteMargin.address);

    await dolomiteMargin.weth.wrap(user, wei.times(3));
    await dolomiteMargin.weth.transfer(user, dolomiteMargin.address, wei.times(2));

    await dolomiteMargin.testing.tokenA.approve(dolomiteMargin.address, INTEGERS.MAX_UINT);

    const lastUpdateTimestamp = await dolomiteMargin.multiCall.getCurrentBlockTimestamp();
    await dolomiteMargin.testing.setMarketIndex(market, {
      borrow: new BigNumber('1.1'),
      supply: new BigNumber('1.2'),
      lastUpdate: lastUpdateTimestamp,
    });
    await dolomiteMargin.testing.setMarketIndex(ethMarket, {
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

  describe('default function', () => {
    it('should fail when ETH is sent to it (not from WETH contract)', async () => {
      await expectThrow(
        dolomiteMargin.web3.eth.sendTransaction({
          value: wei.toFixed(),
          to: dolomiteMargin.depositProxy.address,
        }),
        'DepositWithdrawalProxy: invalid ETH sender',
      );
    });
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

  describe('depositETH', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.depositETH(accountIndex, wei);
      await expectProtocolBalanceWei(accountIndex, ethMarket, wei.times(2));
      await expectETHBalanceInWei(txResult, balanceBefore, wei, false);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
    });

    it('should not work when not initialized', async () => {
      await expectThrow(
        dolomiteMargin.depositProxy.depositETH(accountIndex, wei),
        'DepositWithdrawalProxy: not initialized',
      );
    });
  });

  describe('depositWeiIntoDefaultAccount', () => {
    it('should work normally', async () => {
      const txResult = await dolomiteMargin.depositProxy.depositWeiIntoDefaultAccount(market, wei);
      console.log('\tDeposit wei into default account gas used: ', txResult.gasUsed);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });

    it('should work when depositing max uint', async () => {
      await dolomiteMargin.depositProxy.depositWeiIntoDefaultAccount(market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, wei.times(2));
      await expectWalletBalanceWei(market, INTEGERS.ZERO);
    });
  });

  describe('depositETHIntoDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.depositETHIntoDefaultAccount(wei);
      await expectProtocolBalanceWei(INTEGERS.ZERO, ethMarket, wei.times(2));
      await expectETHBalanceInWei(txResult, balanceBefore, wei, false);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
    });

    it('should not work when not initialized', async () => {
      await expectThrow(
        dolomiteMargin.depositProxy.depositETHIntoDefaultAccount(wei),
        'DepositWithdrawalProxy: not initialized',
      );
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

  describe('withdrawETH', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.withdrawETH(accountIndex, wei);
      await expectProtocolBalanceWei(accountIndex, ethMarket, INTEGERS.ZERO);
      await expectETHBalanceInWei(txResult, balanceBefore, wei, true);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.withdrawETH(accountIndex, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(accountIndex, ethMarket, INTEGERS.ZERO);
      await expectETHBalanceInWei(txResult, balanceBefore, wei, true);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
    });

    it('should not work when not initialized', async () => {
      await expectThrow(
        dolomiteMargin.depositProxy.withdrawETH(accountIndex, INTEGERS.MAX_UINT),
        'DepositWithdrawalProxy: not initialized',
      );
    });
  });

  describe('withdrawWeiFromDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.withdrawWeiFromDefaultAccount(market, wei);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.withdrawWeiFromDefaultAccount(market, INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(INTEGERS.ZERO, market, INTEGERS.ZERO);
      await expectWalletBalanceWei(market, wei.times(2));
    });
  });

  describe('withdrawETHFromDefaultAccount', () => {
    it('should work normally', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.withdrawETHFromDefaultAccount(wei);
      await expectProtocolBalanceWei(INTEGERS.ZERO, ethMarket, INTEGERS.ZERO);
      await expectETHBalanceInWei(txResult, balanceBefore, wei, true);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
    });

    it('should work when withdrawing max uint', async () => {
      await dolomiteMargin.depositProxy.initializeETHMarket(dolomiteMargin.weth.address);

      const balanceBefore = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
      const txResult = await dolomiteMargin.depositProxy.withdrawETHFromDefaultAccount(INTEGERS.MAX_UINT);
      await expectProtocolBalanceWei(INTEGERS.ZERO, ethMarket, INTEGERS.ZERO);
      await expectETHBalanceInWei(txResult, balanceBefore, wei, true);
      await expectETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
      await expectWETHBalance(dolomiteMargin.depositProxy.address, INTEGERS.ZERO);
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

  async function expectProtocolBalanceWei(accountIndex: Integer, market: Integer, amountWei: Integer): Promise<void> {
    const balance = await dolomiteMargin.getters.getAccountWei(user, accountIndex, market);
    expect(balance).toEqual(amountWei);
  }

  async function expectProtocolBalancePar(accountIndex: Integer, market: Integer, amountPar: Integer): Promise<void> {
    const balance = await dolomiteMargin.getters.getAccountPar(user, accountIndex, market);
    expect(balance).toEqual(amountPar);
  }

  async function expectWalletBalanceWei(market: Integer, amount: Integer): Promise<void> {
    const balance = await dolomiteMargin.testing.tokenA.getBalance(user);
    expect(balance).toEqual(amount);
  }

  async function expectETHBalanceInWei(
    txResult: TxResult,
    balanceBefore: Integer,
    amount: Integer,
    isWithdrawal: boolean,
  ): Promise<void> {
    const tx = await dolomiteMargin.web3.eth.getTransaction(txResult.transactionHash);
    const balance = new BigNumber(await dolomiteMargin.web3.eth.getBalance(user));
    const balanceWithoutFees = balance.plus(new BigNumber(txResult.gasUsed).times(new BigNumber(tx.gasPrice)));
    expect(balanceWithoutFees).toEqual(isWithdrawal ? balanceBefore.plus(amount) : balanceBefore.minus(amount));
  }

  async function expectETHBalance(
    owner: address,
    amount: Integer,
  ): Promise<void> {
    const balance = new BigNumber(await dolomiteMargin.web3.eth.getBalance(owner));
    expect(balance).toEqual(amount);
  }

  async function expectWETHBalance(
    owner: address,
    amount: Integer,
  ): Promise<void> {
    expect(await dolomiteMargin.weth.getBalance(owner)).toEqual(amount);
  }

  async function expectWalletBalancePar(market: Integer, amount: Integer): Promise<void> {
    const balance = await dolomiteMargin.testing.tokenA.getBalance(user);
    const index = await dolomiteMargin.getters.getMarketCurrentIndex(market);
    expect(balance).toEqual(DolomiteMarginMath.parToWei(amount, index));
  }
});
