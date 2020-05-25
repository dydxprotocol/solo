import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { snapshot, resetEVM } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src/types';

let solo: TestSolo;
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
    const price = await solo.contracts.call(
      solo.contracts.usdcPriceOracle.methods.getPrice(ADDRESSES.ZERO),
    );
    expect(new BigNumber(price.value)).toEqual(USDC_PRICE);
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
