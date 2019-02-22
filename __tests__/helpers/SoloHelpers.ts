import BigNumber from 'bignumber.js';
import { Solo } from '../../src/Solo';
import { address } from '../../src/types';
import { mineAvgBlock } from './EVM';

export async function setupMarkets(
  solo: Solo,
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
  ]);

  const tokens = [
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
    solo.testing.tokenC.getAddress(),
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
