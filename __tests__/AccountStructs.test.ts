import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';
import { INTEGERS } from '../src/lib/Constants';
import { address, Integer } from '../src';

let owner: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const accountOne = new BigNumber(111);
const accountTwo = new BigNumber(222);
const marketOne = INTEGERS.ZERO;
const marketTwo = INTEGERS.ONE;
const marketThree = new BigNumber(2);
let tokenOne: string;
let tokenTwo: string;
let tokenThree: string;
const zero = INTEGERS.ZERO;
const positive = new BigNumber(100);
const negative = new BigNumber(-100);

describe('AccountStructs', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    owner = dolomiteMargin.getDefaultAccount();

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    tokenOne = await dolomiteMargin.getters.getMarketTokenAddress(marketOne);
    tokenTwo = await dolomiteMargin.getters.getMarketTokenAddress(marketTwo);
    tokenThree = await dolomiteMargin.getters.getMarketTokenAddress(marketThree);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds for normal setting balance', async () => {
    expect(await getBalancesLength(accountOne)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, positive);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await dolomiteMargin.getters.getAccountPar(owner, accountOne, marketOne)).toEqual(positive);
    expect(await getBalancesLength(accountOne)).toEqual(1);
    await assertBalancesContainsMarket(accountOne, marketOne);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await dolomiteMargin.getters.getAccountPar(owner, accountOne, marketOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(0);
  });

  it('Succeeds for normal setting balance across accounts', async () => {
    expect(await getBalancesLength(accountOne)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountTwo)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountTwo)).toEqual(zero);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, positive);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(1);
    await assertBalancesContainsMarket(accountOne, marketOne);
    expect(await getBalancesLength(accountTwo)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountTwo)).toEqual(zero);

    await dolomiteMargin.testing.setAccountBalance(owner, accountTwo, marketOne, positive);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(1);
    await assertBalancesContainsMarket(accountOne, marketOne);
    await assertBalancesContainsMarket(accountTwo, marketOne);
    expect(await getBalancesLength(accountTwo)).toEqual(1);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountTwo)).toEqual(zero);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(0);
    expect(await getBalancesLength(accountTwo)).toEqual(1);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountTwo)).toEqual(zero);

    await dolomiteMargin.testing.setAccountBalance(owner, accountTwo, marketOne, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(0);
    expect(await getBalancesLength(accountTwo)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountTwo)).toEqual(zero);
  });

  it('Succeeds for normal setting negative balance', async () => {
    expect(await getBalancesLength(accountOne)).toEqual(0);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    await dolomiteMargin.testing.priceOracle.setPrice(tokenOne, new BigNumber(100));
    await dolomiteMargin.testing.priceOracle.setPrice(tokenTwo, new BigNumber(1));
    await dolomiteMargin.testing.priceOracle.setPrice(tokenThree, new BigNumber(1));

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, positive);
    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketTwo, negative);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(INTEGERS.ONE);
    expect(await getBalancesLength(accountOne)).toEqual(2);
    await assertBalancesContainsMarket(accountOne, marketOne);
    await assertBalancesContainsMarket(accountOne, marketTwo);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, positive.plus(positive));
    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketThree, negative);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(new BigNumber(2));
    expect(await getBalancesLength(accountOne)).toEqual(3);
    await assertBalancesContainsMarket(accountOne, marketOne);
    await assertBalancesContainsMarket(accountOne, marketTwo);
    await assertBalancesContainsMarket(accountOne, marketThree);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketTwo, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(INTEGERS.ONE);
    expect(await getBalancesLength(accountOne)).toEqual(2);
    await assertBalancesContainsMarket(accountOne, marketOne);
    await assertBalancesContainsMarket(accountOne, marketThree);
    await assertBalancesNotContainsMarket(accountOne, marketTwo);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketThree, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(1);
    await assertBalancesContainsMarket(accountOne, marketOne);
    await assertBalancesNotContainsMarket(accountOne, marketTwo);
    await assertBalancesNotContainsMarket(accountOne, marketThree);

    await dolomiteMargin.testing.setAccountBalance(owner, accountOne, marketOne, zero);
    expect(await dolomiteMargin.getters.getAccountNumberOfMarketsWithDebt(owner, accountOne)).toEqual(zero);
    expect(await getBalancesLength(accountOne)).toEqual(0);
  });

  async function getBalancesLength(
    accountNumber: Integer,
  ): Promise<number> {
    const array = await dolomiteMargin.getters.getAccountMarketsWithBalances(owner, accountNumber);
    return array.length;
  }

  async function assertBalancesContainsMarket(
    accountNumber: Integer,
    marketId: Integer,
  ): Promise<void> {
    const array = await dolomiteMargin.getters.getAccountMarketsWithBalances(owner, accountNumber);
    expect(array.some(value => value.eq(marketId))).toEqual(true);
  }

  async function assertBalancesNotContainsMarket(
    accountNumber: Integer,
    marketId: Integer,
  ): Promise<void> {
    const array = await dolomiteMargin.getters.getAccountMarketsWithBalances(owner, accountNumber);
    expect(array.every(value => !value.eq(marketId))).toEqual(true);
  }
});
