import BigNumber from 'bignumber.js';
import { TestSolo } from '../modules/TestSolo';
import { address } from '../../src/types';
import { mineAvgBlock } from './EVM';
import { ADDRESSES } from '../../src/lib/Constants';

export async function setGlobalOperator(
  solo: TestSolo,
  accounts: address[],
  operator: string,
): Promise<void> {
  return solo.admin.setGlobalOperator(operator, true, { from: accounts[0] }).then(() => undefined);
}

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
  const isClosing = false;

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
    // eslint-disable-next-line no-await-in-loop
    await solo.admin.addMarket(
      tokens[i],
      priceOracle,
      interestSetter,
      marginPremium,
      spreadPremium,
      isClosing,
      { from: accounts[0] },
    );
  }

  await mineAvgBlock();
}
