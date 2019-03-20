import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { snapshot, resetEVM } from '../helpers/EVM';
import { INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src/types';

let solo: Solo;
let accounts: address[];
let admin: address;
const USDC_PRICE = new BigNumber('1e30');

describe('UsdcPriceOracle', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];

    await resetEVM();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Returns the correct value', async () => {
    const price = await solo.priceOracle.getUsdcPrice();
    expect(price).toEqual(USDC_PRICE);
  });

  it('Can be set as the oracle for a market', async () => {
    await solo.admin.addMarket(
      solo.testing.tokenA.getAddress(),
      solo.contracts.usdcPriceOracle.options.address,
      solo.contracts.testInterestSetter.options.address,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      { from: admin },
    );
    const price = await solo.getters.getMarketPrice(INTEGERS.ZERO);
    expect(price).toEqual(USDC_PRICE);
  });
});
