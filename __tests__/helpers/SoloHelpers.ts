import BigNumber from 'bignumber.js';
import { TestSolo } from '../modules/TestSolo';
import { address } from '../../src/types';
import { mineAvgBlock } from './EVM';
import { ADDRESSES } from '../../src/lib/Constants';

export async function setupMarkets(
  solo: TestSolo,
  accounts: address[],
  numMarkets: number = 3,
): Promise<void> {
  const priceOracle = solo.testing.priceOracle.getAddress();
  const interestSetter = solo.testing.interestSetter.getAddress();
  const price = new BigNumber('1e40'); // large to prevent hitting minBorrowValue check
  const marginPremium = new BigNumber(0);
  const spreadPremium = new BigNumber(0);

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
    solo.testing.priceOracle.setPrice(
      ADDRESSES.ZERO,
      price,
    ),
  ]);

  const tokens = [
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
    solo.testing.tokenC.getAddress(),
    ADDRESSES.ZERO,
  ];

  for (let i = 0; i < numMarkets && i < tokens.length; i += 1) {
    await solo.admin.addMarket(
      tokens[i],
      priceOracle,
      interestSetter,
      marginPremium,
      spreadPremium,
      { from: accounts[0] },
    );
  }

  await mineAvgBlock();
}
