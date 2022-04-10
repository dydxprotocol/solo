import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { resetEVM, snapshot } from '../helpers/EVM';
import { address, ADDRESSES, INTEGERS } from '../../src';
import { expectThrow } from '../../src/lib/Expect';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let admin: address;
const BTC_PRCE = new BigNumber('96205880000000000000000000000000'); // 30 decimals
const LRC_PRICE = new BigNumber('39402846000000000'); // 18 decimals
const USDC_PRCE = new BigNumber('1000000000000000000000000000000'); // 30 decimals
const WETH_PRICE = new BigNumber('211400000000000000000'); // 18 decimals
const defaultIsClosing = false;
const defaultIsRecyclable = false;

describe('ChainlinkPriceOracleV1', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];

    await resetEVM();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  function chainlinkOracle() {
    return dolomiteMargin.contracts.chainlinkPriceOracleV1.methods;
  }

  it('Returns the correct value for a token with 18 decimals', async () => {
    const price = await dolomiteMargin.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(dolomiteMargin.contracts.weth.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(WETH_PRICE);
  });

  it('Returns the correct value for a token with less than 18 decimals', async () => {
    const price = await dolomiteMargin.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(dolomiteMargin.contracts.tokenD.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(BTC_PRCE);
  });

  it('Returns the correct value for a token with less than 18 decimals and non-USD base price', async () => {
    const price = await dolomiteMargin.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(dolomiteMargin.contracts.tokenA.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(USDC_PRCE);
  });

  it('Returns the correct value for a token with non-USDC base and 18 decimals', async () => {
    const price = await dolomiteMargin.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(dolomiteMargin.contracts.tokenF.options.address),
    );
    expect(new BigNumber(price.value)).toEqual(LRC_PRICE);
  });

  it('Reverts when an invalid address is passed in', async () => {
    const pricePromise = dolomiteMargin.contracts.callConstantContractFunction(
      chainlinkOracle().getPrice(ADDRESSES.ZERO),
    );
    await expectThrow(pricePromise, `ChainlinkPriceOracleV1: invalid token <${ADDRESSES.ZERO}>`);
  });

  it('Can be set as the oracle for a market', async () => {
    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.testing.tokenA.address,
      dolomiteMargin.contracts.chainlinkPriceOracleV1.options.address,
      dolomiteMargin.contracts.testInterestSetter.options.address,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      INTEGERS.ZERO,
      defaultIsClosing,
      defaultIsRecyclable,
      { from: admin },
    );
    const price = await dolomiteMargin.getters.getMarketPrice(INTEGERS.ZERO);
    expect(price).toEqual(USDC_PRCE);
  });
});
