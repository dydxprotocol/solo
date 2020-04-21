import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { snapshot, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import {
  address,
  Integer,
  MarketId,
} from '../../src/types';

let solo: TestSolo;
let tokens: address[];
let accountOwner: address;
const amount = new BigNumber(123456);
const accountNumber = INTEGERS.ZERO;
const markets = [
  MarketId.ETH,
  MarketId.WETH,
  MarketId.SAI,
  MarketId.USDC,
];

describe('StandardActions', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accountOwner = r.accounts[5];
    await resetEVM();
    const soloAddress = solo.contracts.testSoloMargin.options.address;

    // setup markets
    await solo.testing.priceOracle.setPrice(solo.weth.getAddress(), new BigNumber('1e40'));
    await solo.admin.addMarket(
      solo.weth.getAddress(),
      solo.testing.priceOracle.getAddress(),
      solo.testing.interestSetter.getAddress(),
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      { from: r.accounts[0] },
    );
    await setupMarkets(solo, r.accounts, 2);
    tokens = await Promise.all([
      solo.getters.getMarketTokenAddress(new BigNumber(0)),
      solo.getters.getMarketTokenAddress(new BigNumber(1)),
      solo.getters.getMarketTokenAddress(new BigNumber(2)),
    ]);

    // set balances
    await Promise.all([
      solo.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(0),
        amount.times(2),
      ),
      solo.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(1),
        amount.times(2),
      ),
      solo.testing.setAccountBalance(
        accountOwner,
        accountNumber,
        new BigNumber(2),
        amount.times(2),
      ),
    ]);

    // give tokens
    await Promise.all([
      solo.weth.wrap(accountOwner, amount.times(3)),
      solo.testing.tokenA.issueTo(amount, accountOwner),
      solo.testing.tokenB.issueTo(amount, accountOwner),
      solo.testing.tokenA.issueTo(amount.times(2), soloAddress),
      solo.testing.tokenB.issueTo(amount.times(2), soloAddress),
    ]);
    await solo.weth.transfer(accountOwner, soloAddress, amount.times(2));

    // set allowances
    await Promise.all([
      solo.weth.setMaximumSoloAllowance(accountOwner),
      solo.testing.tokenA.setMaximumSoloAllowance(accountOwner),
      solo.testing.tokenB.setMaximumSoloAllowance(accountOwner),
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
        await solo.standardActions.deposit({
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
        await solo.standardActions.withdraw({
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
        await solo.testing.setAccountBalance(
          accountOwner,
          accountNumber,
          marketId,
          amount.times(2),
        );
        await solo.standardActions.withdrawToZero({
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
  return new BigNumber(await solo.web3.eth.getBalance(accountOwner));
}

async function expectAccountWei(marketId: Integer, expectedWei: Integer) {
  const accountWei = await solo.getters.getAccountWei(
    accountOwner,
    accountNumber,
    realify(marketId),
  );
  expect(accountWei).toEqual(expectedWei);
}

async function expectTokens(marketId: Integer, amount: Integer) {
  const accountTokens = await solo.token.getBalance(
    tokens[marketId.toNumber()],
    accountOwner,
  );
  expect(accountTokens).toEqual(amount);
}
