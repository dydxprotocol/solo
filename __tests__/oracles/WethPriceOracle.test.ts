import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { snapshot, resetEVM } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let admin: address;
const defaultPrice = new BigNumber('1e20');

describe('WethPriceOracle', () => {
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
    await setPrice(defaultPrice, true);
    const price = await solo.contracts.call(
      solo.contracts.wethPriceOracle.methods.getPrice(ADDRESSES.ZERO),
    );
    expect(new BigNumber(price.value)).toEqual(defaultPrice);
  });

  it('Returns the correct value even when stale', async () => {
    await setPrice(defaultPrice, false);
    const price = await solo.contracts.call(
      solo.contracts.wethPriceOracle.methods.getPrice(ADDRESSES.ZERO),
    );
    expect(new BigNumber(price.value)).toEqual(defaultPrice);
  });

  it('Can be set as the oracle for a market', async () => {
    await setPrice(defaultPrice, true);
    await solo.admin.addMarket(
      solo.testing.tokenA.getAddress(),
      solo.contracts.wethPriceOracle.options.address,
      solo.contracts.testInterestSetter.options.address,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      { from: admin },
    );
    const price = await solo.getters.getMarketPrice(INTEGERS.ZERO);
    expect(price).toEqual(defaultPrice);
  });
});

// ============ Helper Functions ============

async function setPrice(
  price: BigNumber,
  valid: boolean,
) {
  await solo.contracts.send(
    solo.contracts.testMakerOracle.methods.setValues(
      price.toFixed(0),
      valid,
    ),
  );
}
