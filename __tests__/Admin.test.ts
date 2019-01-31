import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { address, MarketWithInfo } from '../src/types';
import { mineAvgBlock, resetEVM } from './helpers/EVM';
import { INTEGERS } from '../src/lib/Constants';

describe('Admin', () => {
  let solo: Solo;
  let accounts: address[];

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
  });

  beforeEach(async () => {
    await resetEVM();
    await mineAvgBlock();
  });

  describe('#ownerAddMarket', () => {
    it('Successfully adds a market', async () => {
      const token = solo.testing.tokenA.getAddress();
      const priceOracle = solo.testing.priceOracle.getAddress();
      const interestSetter = solo.testing.interestSetter.getAddress();
      const price = new BigNumber(1);

      await solo.testing.priceOracle.setPrice(
        token,
        price,
      );

      const { blockNumber } = await solo.admin.addMarket(
        token,
        priceOracle,
        interestSetter,
        { from: accounts[0] },
      );

      const { timestamp } = await solo.web3.eth.getBlock(blockNumber);

      const marketInfo: MarketWithInfo = await solo.getters.getMarket(new BigNumber(0));

      expect(marketInfo.market.token).toBe(token);
      expect(marketInfo.market.priceOracle).toBe(priceOracle);
      expect(marketInfo.market.interestSetter).toBe(interestSetter);
      expect(marketInfo.market.isClosing).toBe(false);
      expect(marketInfo.market.totalPar.borrow).toEqual(INTEGERS.ZERO);
      expect(marketInfo.market.totalPar.supply).toEqual(INTEGERS.ZERO);
      expect(marketInfo.market.index.borrow).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.supply).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.lastUpdate).toEqual(new BigNumber(timestamp));
      expect(marketInfo.currentPrice).toEqual(price);
      expect(marketInfo.currentInterestRate).toEqual(INTEGERS.ZERO);
      expect(marketInfo.currentIndex.borrow).toEqual(INTEGERS.ONE);
      expect(marketInfo.currentIndex.supply).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.lastUpdate).toEqual(new BigNumber(timestamp));
    });
  });
});
