import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { ADDRESSES, INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src/types';
import { expectThrow } from '../../src/lib/Expect';

let solo: TestSolo;
let accounts: address[];
let admin: address;
const BTC_PRCE = new BigNumber('96205880000000000000000000000000'); // 30 decimals
const LRC_PRICE = new BigNumber('39402846000000000'); // 18 decimals
const USDC_PRCE = new BigNumber('998731818000000000000000000000'); // 30 decimals
const WETH_PRICE = new BigNumber('211400000000000000000'); // 18 decimals
const defaultIsClosing = false;

describe('ChainlinkPriceOracleV1', () => {
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

  function chainlinkOracle() {
    return solo.contracts.chainlinkPriceOracleV1.methods;
  }

  it('Returns the correct value for a token with 18 decimals', async () => {
    const price = await solo.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(solo.contracts.weth.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(WETH_PRICE);
  });

  it('Returns the correct value for a token with less than 18 decimals', async () => {
    const price = await solo.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(solo.contracts.tokenD.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(BTC_PRCE);
  });

  it(
    'Returns the correct value for a token with less than 18 decimals and non-USD base price',
    async () => {
      const price = await solo.contracts.callConstantContractFunction(
        chainlinkOracle().getPrice(solo.contracts.tokenA.options.address),
      );
      expect(new BigNumber(price.value)).toEqual(USDC_PRCE);
    });

  it('Returns the correct value for a token with non-USDC base and 18 decimals', async () => {
    const price = await solo.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(solo.contracts.tokenF.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(LRC_PRICE);
  });

  it('Reverts when an invalid address is passed in', async () => {
    const pricePromise = solo.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(ADDRESSES.ZERO),
    );
    await expectThrow(pricePromise, 'INVALID_TOKEN');
  });

  it('Can be set as the oracle for a market', async () => {
    await solo.admin.addMarket(
      solo.testing.tokenA.getAddress(),
      solo.contracts.chainlinkPriceOracleV1.options.address,
      solo.contracts.testInterestSetter.options.address,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      defaultIsClosing,
      { from: admin },
    );
    const price = await solo.getters.getMarketPrice(INTEGERS.ZERO);
    expect(price).toEqual(USDC_PRCE);
  });
});
