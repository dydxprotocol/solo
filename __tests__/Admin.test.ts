import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { address, MarketWithInfo } from '../src/types';
import { resetEVM } from './helpers/EVM';
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
      expect(marketInfo.market.totalPar.borrow.eq(INTEGERS.ZERO)).toBe(true);
      expect(marketInfo.market.totalPar.supply.eq(INTEGERS.ZERO)).toBe(true);
      expect(marketInfo.market.index.borrow.eq(INTEGERS.ONE)).toBe(true);
      expect(marketInfo.market.index.supply.eq(INTEGERS.ONE)).toBe(true);
      expect(marketInfo.market.index.lastUpdate.eq(new BigNumber(timestamp))).toBe(true);
      expect(marketInfo.currentPrice.eq(price)).toBe(true);
      expect(marketInfo.currentInterestRate.eq(INTEGERS.ZERO)).toBe(true);
      expect(marketInfo.currentIndex.borrow.eq(INTEGERS.ONE)).toBe(true);
      expect(marketInfo.currentIndex.supply.eq(INTEGERS.ONE)).toBe(true);
      const sameTimestamp = marketInfo.market.index.lastUpdate.eq(new BigNumber(timestamp));
      if (!sameTimestamp) {
        console.log(marketInfo.market.index.lastUpdate, timestamp);
      }
      expect(sameTimestamp).toBe(true);
    });
  });
});
