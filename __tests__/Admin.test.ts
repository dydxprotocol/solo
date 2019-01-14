import BN from 'bn.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { address, MarketWithInfo } from '../src/types';
import { resetEVM } from './helpers/EVM';

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

      await solo.testing.priceOracle.setPrice(
        token,
        new BN(1),
      );

      await solo.admin.addMarket(
        token,
        solo.testing.priceOracle.getAddress(),
        solo.testing.interestSetter.getAddress(),
        { from: accounts[0] },
      );

      const addr = await solo.getters.getMarketCurrentIndex(new BN(0));

      console.log(addr)

      console.log('A')
      const marketInfo: MarketWithInfo = await solo.getters.getMarket(new BN(0));
      console.log('B')

      console.log(marketInfo)
    });
  });
});
