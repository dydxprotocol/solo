import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { address, Integer, MarketId } from '../../src';

let dolomiteMargin: TestDolomiteMargin;
let tokens: address[];
let accountOwner: address;
const amount = new BigNumber(123456);
const accountNumber = INTEGERS.ZERO;
const markets = [MarketId.ETH, MarketId.WETH, MarketId.USDC];

describe('StandardActions', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accountOwner = r.accounts[5];
    await resetEVM();
    const dolomiteMarginAddress = dolomiteMargin.contracts.testDolomiteMargin.options.address;

    // setup markets
    await dolomiteMargin.testing.priceOracle.setPrice(
      dolomiteMargin.weth.address,
      new BigNumber('1e40'),
    );
    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.weth.address,
      dolomiteMargin.testing.priceOracle.address,
      dolomiteMargin.testing.interestSetter.address,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      false,
      false,
      { from: r.accounts[0] },
    );
    await setupMarkets(dolomiteMargin, r.accounts, 2);
    tokens = await Promise.all([
      dolomiteMargin.getters.getMarketTokenAddress(new BigNumber(0)),
      dolomiteMargin.getters.getMarketTokenAddress(new BigNumber(1)),
      dolomiteMargin.getters.getMarketTokenAddress(new BigNumber(2)),
    ]);

    // set balances
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(0),
        amount.times(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(1),
        amount.times(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(2),
        amount.times(2),
      ),
    ]);

    // give tokens
    await Promise.all([
      dolomiteMargin.weth.wrap(accountOwner, amount.times(3)),
      dolomiteMargin.testing.tokenA.issueTo(amount, accountOwner),
      dolomiteMargin.testing.tokenB.issueTo(amount, accountOwner),
      dolomiteMargin.testing.tokenA.issueTo(amount.times(2), dolomiteMarginAddress),
      dolomiteMargin.testing.tokenB.issueTo(amount.times(2), dolomiteMarginAddress),
    ]);
    await dolomiteMargin.weth.transfer(accountOwner, dolomiteMarginAddress, amount.times(2));

    // set allowances
    await Promise.all([
      dolomiteMargin.weth.setMaximumDolomiteMarginAllowance(accountOwner),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(accountOwner),
      dolomiteMargin.testing.tokenB.setMaximumDolomiteMarginAllowance(accountOwner),
    ]);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('deposit', () => {
    it('Succeeds', async () => {
      for (let i = 0; i < markets.length; i += 1) {
        await resetEVM(snapshotId);
        const balance0 = await getBalance();
        const marketId = markets[i];
        await dolomiteMargin.standardActions.deposit({
          accountNumber,
          accountOwner,
          amount,
          marketId,
          options: { gasPrice: '0x00' },
        });
        await expectAccountWei(marketId, amount.times(3));
        if (marketId.eq(MarketId.ETH)) {
          const balance1 = await getBalance();
          expect(balance1.lt(balance0)).toEqual(true);
        } else {
          await expectTokens(marketId, INTEGERS.ZERO);
        }
      }
    });
  });

  describe('withdraw', () => {
    it('Succeeds', async () => {
      for (let i = 0; i < markets.length; i += 1) {
        await resetEVM(snapshotId);
        const balance0 = await getBalance();
        const marketId = markets[i];
        await dolomiteMargin.standardActions.withdraw({
          accountNumber,
          accountOwner,
          amount,
          marketId,
          options: { gasPrice: '0x00' },
        });
        await expectAccountWei(marketId, amount);
        if (marketId.eq(MarketId.ETH)) {
          const balance1 = await getBalance();
          expect(balance1.gt(balance0)).toEqual(true);
        } else {
          await expectTokens(marketId, amount.times(2));
        }
      }
    });
  });

  describe('withdrawToZero', () => {
    it('Succeeds', async () => {
      for (let i = 0; i < markets.length; i += 1) {
        await resetEVM(snapshotId);
        const balance0 = await getBalance();
        const marketId = markets[i];
        if (!marketId.eq(MarketId.ETH)) {
          await dolomiteMargin.testing.setAccountBalance(
            accountOwner,
            accountNumber,
            marketId,
            amount.times(2),
          );
        }
        await dolomiteMargin.standardActions.withdrawToZero({
          accountNumber,
          accountOwner,
          marketId,
          options: { gasPrice: '0x00' },
        });
        await expectAccountWei(marketId, INTEGERS.ZERO);
        if (marketId.eq(MarketId.ETH)) {
          const balance1 = await getBalance();
          expect(balance1.gt(balance0)).toEqual(true);
        } else {
          await expectTokens(marketId, amount.times(3));
        }
      }
    });
  });
});

function realify(marketId: Integer): Integer {
  return marketId.isNegative() ? INTEGERS.ZERO : marketId;
}

async function getBalance() {
  return new BigNumber(await dolomiteMargin.web3.eth.getBalance(accountOwner));
}

async function expectAccountWei(marketId: Integer, expectedWei: Integer) {
  const accountWei = await dolomiteMargin.getters.getAccountWei(
    accountOwner,
    accountNumber,
    realify(marketId),
  );
  expect(accountWei).toEqual(expectedWei);
}

async function expectTokens(marketId: Integer, amount: Integer) {
  const accountTokens = await dolomiteMargin.token.getBalance(
    tokens[marketId.toNumber()],
    accountOwner,
  );
  expect(accountTokens).toEqual(amount);
}
