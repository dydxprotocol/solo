import BigNumber from 'bignumber.js';
import { Solo } from '../../src/Solo';
import { address } from '../../src/types';

export async function setupMarkets(solo: Solo, accounts: address[]): Promise<void> {
  const priceOracle = solo.testing.priceOracle.getAddress();
  const interestSetter = solo.testing.interestSetter.getAddress();
  const price = new BigNumber("1e40"); // large to prevent hitting minBorrowValue check

  await Promise.all([
    solo.testing.priceOracle.setPrice(
      solo.testing.tokenA.getAddress(),
      price,
    ),
    solo.testing.priceOracle.setPrice(
      solo.testing.tokenB.getAddress(),
      price,
    ),
    solo.testing.priceOracle.setPrice(
      solo.testing.tokenC.getAddress(),
      price,
    ),
  ]);

  // Done in sequence so token A is always market 0
  await solo.admin.addMarket(
    solo.testing.tokenA.getAddress(),
    priceOracle,
    interestSetter,
    { from: accounts[0] },
  );
  await solo.admin.addMarket(
    solo.testing.tokenB.getAddress(),
    priceOracle,
    interestSetter,
    { from: accounts[0] },
  );
  await solo.admin.addMarket(
    solo.testing.tokenC.getAddress(),
    priceOracle,
    interestSetter,
    { from: accounts[0] },
  );
}
