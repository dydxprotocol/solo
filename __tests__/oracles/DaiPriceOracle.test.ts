import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { snapshot, resetEVM, fastForward, mineAvgBlock } from '../helpers/EVM';
import { INTEGERS, ADDRESSES } from '../../src/lib/Constants';
import { address, BigNumberable, SendOptions } from '../../src/types';
import { expectThrow } from '../../src/lib/Expect';

const CURVE_FEE_DENOMINATOR = 10000000000;
const DAI_DECIMALS = 18;
const USDC_DECIMALS = 6;

let solo: TestSolo;
let accounts: address[];
let admin: address;
let poker: address;
let rando: address;
let marketMaker: address;
const defaultPrice = new BigNumber('1e18');

describe('DaiPriceOracle', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    marketMaker = accounts[6];
    poker = accounts[9];
    rando = accounts[8];
    await resetEVM();
    const tokenAmount = new BigNumber('1e19');
    await Promise.all([
      solo.oracle.daiPriceOracle.setPokerAddress(poker, { from: admin }),
      solo.testing.tokenB.issueTo(tokenAmount, marketMaker),
      solo.weth.wrap(marketMaker, tokenAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('saiPriceOracle', () => {
    it('Returns the correct address', async () => {
      const saiPriceOracleAddress = ADDRESSES.TEST_SAI_PRICE_ORACLE;
      expect(solo.contracts.saiPriceOracle.options.address).toEqual(saiPriceOracleAddress);
      expect(solo.contracts.saiPriceOracle._address).toEqual(saiPriceOracleAddress);
    });
  });

  describe('getPrice', () => {
    it('Returns the default value', async () => {
      const price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).toEqual(defaultPrice);
    });

    it('Can be set as the oracle for a market', async () => {
      await solo.admin.addMarket(
        solo.testing.tokenA.getAddress(),
        solo.contracts.daiPriceOracle.options.address,
        solo.contracts.testInterestSetter.options.address,
        INTEGERS.ZERO,
        INTEGERS.ZERO,
        { from: admin },
      );
      const price = await solo.getters.getMarketPrice(INTEGERS.ZERO);
      expect(price).toEqual(defaultPrice);
    });

    it('Matches priceInfo', async () => {
      await Promise.all([
        setCurvePrice('0.98'),
        setUniswapPrice('0.97'),
      ]);
      await updatePrice();
      const priceInfo = await solo.oracle.daiPriceOracle.getPriceInfo();
      const price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).toEqual(priceInfo.price);
    });
  });

  describe('ownerSetPriceOracle', () => {
    it('Fails for non-owner', async () => {
      await expectThrow(
        solo.oracle.daiPriceOracle.setPokerAddress(marketMaker, { from: rando }),
      );
    });

    it('Succeeds', async () => {
      const oldPoker = await solo.oracle.daiPriceOracle.getPoker();
      await solo.oracle.daiPriceOracle.setPokerAddress(marketMaker, { from: admin });
      const newPoker = await solo.oracle.daiPriceOracle.getPoker();
      expect(newPoker).toEqual(marketMaker);
      expect(newPoker).not.toEqual(oldPoker);
    });
  });

  describe('updatePrice', () => {
    it('Does not update for non-poker', async () => {
      await Promise.all([
        setCurvePrice('0.99'),
        setUniswapPrice('1.00'),
      ]);
      await expectThrow(
        updatePrice(
          null,
          null,
          { from: rando },
        ),
        'DaiPriceOracle: Only poker can call updatePrice',
      );
    });

    it('Updates timestamp correctly', async () => {
      await Promise.all([
        setCurvePrice('0.99'),
        setUniswapPrice('1.00'),
      ]);
      const txResult = await updatePrice();
      const { timestamp } = await solo.web3.eth.getBlock(txResult.blockNumber);
      const priceInfo = await solo.oracle.daiPriceOracle.getPriceInfo();
      expect(priceInfo.lastUpdate).toEqual(new BigNumber(timestamp));
      console.log(`\tUpdate Dai Price gas used: ${txResult.gasUsed}`);
    });

    it('Emits an event', async () => {
      await Promise.all([
        setCurvePrice('0.98'),
        setUniswapPrice('0.97'),
      ]);
      const txResult = await updatePrice();
      const priceInfo = await solo.oracle.daiPriceOracle.getPriceInfo();
      const log = txResult.events.PriceSet;
      expect(log).not.toBeUndefined();
      expect(new BigNumber(log.returnValues.newPriceInfo.price)).toEqual(priceInfo.price);
      expect(new BigNumber(log.returnValues.newPriceInfo.lastUpdate)).toEqual(priceInfo.lastUpdate);
    });

    it('Matches getBoundedTargetPrice', async () => {
      await Promise.all([
        setCurvePrice('1.05'),
        setUniswapPrice('1.07'),
      ]);
      await fastForward(1000);
      const boundedPrice = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      await updatePrice();
      const price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).toEqual(boundedPrice);
    });

    it('Will migrate to the right price over many updates', async () => {
      await Promise.all([
        setCurvePrice('1.025'),
        setUniswapPrice('1.04'),
      ]);
      let price: any;
      const targetPrice = await solo.oracle.daiPriceOracle.getTargetPrice();

      await fastForward(1000);
      await updatePrice();
      price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).not.toEqual(targetPrice);

      await fastForward(1000);
      await updatePrice();
      price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).not.toEqual(targetPrice);

      await fastForward(1000);
      await updatePrice();
      price = await solo.oracle.daiPriceOracle.getPrice();
      expect(price).toEqual(targetPrice);
    });

    it('Fails below minimum', async () => {
      await Promise.all([
        setCurvePrice('0.97'),
        setUniswapPrice('0.96'),
      ]);
      await expectThrow(
        updatePrice(
          defaultPrice,
          null,
        ),
        'DaiPriceOracle: newPrice below minimum',
      );
    });

    it('Fails above maximum', async () => {
      await Promise.all([
        setCurvePrice('1.02'),
        setUniswapPrice('1.04'),
      ]);
      await expectThrow(
        updatePrice(
          null,
          defaultPrice,
        ),
        'DaiPriceOracle: newPrice above maximum',
      );
    });
  });

  describe('getTargetPrice', () => {
    it('Succeeds for price = dollar', async () => {
      let price: BigNumber;

      await Promise.all([
        setCurvePrice('1.01'),
        setUniswapPrice('0.99'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice);

      await Promise.all([
        setCurvePrice('0.99'),
        setUniswapPrice('1.01'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice);
    });

    it('Succeeds for price < dollar', async () => {
      let price: BigNumber;

      await Promise.all([
        setCurvePrice('0.95'),
        setUniswapPrice('0.98'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice.times('0.98'));

      await setUniswapPrice('0.50');
      const curvePrice = await solo.oracle.daiPriceOracle.getCurvePrice();
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(curvePrice);
    });

    it('Succeeds for price > dollar', async () => {
      let price: BigNumber;

      await Promise.all([
        setCurvePrice('1.04'),
        setUniswapPrice('1.02'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice.times('1.02'));

      await setUniswapPrice('2.00');
      const curvePrice = await solo.oracle.daiPriceOracle.getCurvePrice();
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(curvePrice);
    });
  });

  describe('getBoundedTargetPrice', () => {
    it('Upper-bounded by maximum absolute deviation', async () => {
      await fastForward(1000);

      await Promise.all([
        setCurvePrice('1.10'),
        setUniswapPrice('1.10'),
      ]);
      const price = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(price).toEqual(defaultPrice.times('1.01'));
    });

    it('Lower-bounded by maximum absolute deviation', async () => {
      await fastForward(1000);

      await Promise.all([
        setCurvePrice('0.90'),
        setUniswapPrice('0.90'),
      ]);
      const price = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(price).toEqual(defaultPrice.times('0.99'));
    });

    it('Upper-bounded by maximum deviation per second', async () => {
      await Promise.all([
        setCurvePrice('1.10'),
        setUniswapPrice('1.10'),
      ]);
      await updatePrice();
      await mineAvgBlock();
      const price = await solo.oracle.daiPriceOracle.getPrice();
      const boundedPrice = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(boundedPrice.gt(price)).toEqual(true);
      expect(boundedPrice.lt(price.times('1.01'))).toEqual(true);
    });

    it('Lower-bounded by maximum deviation per second', async () => {
      await Promise.all([
        setCurvePrice('0.90'),
        setUniswapPrice('0.90'),
      ]);
      await updatePrice();
      await mineAvgBlock();
      const price = await solo.oracle.daiPriceOracle.getPrice();
      const boundedPrice = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(boundedPrice.lt(price)).toEqual(true);
      expect(boundedPrice.gt(price.times('0.99'))).toEqual(true);
    });
  });

  describe('getCurvePrice', () => {
    it('Returns the price, adjusting for the fee', async () => {
      await setCurvePrice('1.05');
      const price = await solo.oracle.daiPriceOracle.getCurvePrice();

      // Allow rounding error.
      const expectedPrice = new BigNumber('1.05').shiftedBy(18);
      expect(price.div(expectedPrice).minus(1).abs().toNumber()).toBeLessThan(1e-10);
    });
  });

  describe('getUniswapPrice', () => {
    it('Fails for zero liquidity', async () => {
      await expectThrow(
        solo.oracle.daiPriceOracle.getUniswapPrice(),
      );
    });

    it('Gets the right price for ETH-DAI = ETH-USDC', async () => {
      await setUniswapPrice(1);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      expect(price).toEqual(defaultPrice);
    });

    it('Gets the right price for ETH-DAI > ETH-USDC', async () => {
      await setUniswapPrice(0.975);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      expect(price).toEqual(new BigNumber(0.975).shiftedBy(18));
    });

    it('Gets the right price for ETH-DAI < ETH-USDC', async () => {
      await setUniswapPrice(1.025);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      expect(price).toEqual(new BigNumber(1.025).shiftedBy(18));
    });

    it('Does not overflow when the pools hold on the order of $100B in value', async () => {
      await Promise.all([
        // Suppose ETH has a price of $1.
        setUniswapEthDaiBalances(
          new BigNumber(100e9).shiftedBy(18), // ethAmt
          new BigNumber(100e9).shiftedBy(18), // daiAmt
        ),
        setUniswapEthUsdcBalances(
          new BigNumber(100e9).shiftedBy(18), // ethAmt
          new BigNumber(100e9).shiftedBy(6),  // usdcAmt
        ),
      ]);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      expect(price).toEqual(defaultPrice);
    });
  });
});

// ============ Helper Functions ============

async function setCurvePrice(
  price: BigNumberable,
) {
  // Add the fee.
  const fee = await solo.contracts.call(
    solo.contracts.testCurve.methods.fee(),
  ) as string;
  // dy is the amount of DAI received for 1 USDC, i.e. the reciprocal of the DAI-USDC price.
  const dy = new BigNumber(1).div(price);

  // Apply the fee which would be applied by the Curve contract.
  const feeAmount = dy.times(fee).div(CURVE_FEE_DENOMINATOR);
  const dyWithFee = dy.minus(feeAmount);

  await solo.contracts.send(
    solo.contracts.testCurve.methods.setDy(
      // Curve will treat dx and dy in terms of the base units of the currencies, so shift the value
      // to be returned by the difference between the decimals of DAI and USDC.
      dyWithFee.shiftedBy(DAI_DECIMALS - USDC_DECIMALS).toFixed(0),
    ),
  );
}

async function setUniswapPrice(
  price: BigNumberable,
) {
  const ethPrice = new BigNumber(100);
  await Promise.all([
    // Apply an arbitrary constant factor to the balances of each pool.
    setUniswapEthDaiBalances(
      new BigNumber(1).times(1.23).shiftedBy(18), // ethAmt
      ethPrice.times(1.23).shiftedBy(18),         // daiAmt
    ),
    setUniswapEthUsdcBalances(
      new BigNumber(1).times(2.34).shiftedBy(18),     // ethAmt
      ethPrice.times(price).times(2.34).shiftedBy(6), // usdcAmt
    ),
  ]);
}

async function setUniswapEthDaiBalances(
  ethAmt: BigNumberable,
  daiAmt: BigNumberable,
) {
  await solo.contracts.send(
    solo.contracts.testUniswapV2Pair.methods.setReserves(
      new BigNumber(daiAmt).toFixed(0),
      new BigNumber(ethAmt).toFixed(0),
    ),
  );
}

async function setUniswapEthUsdcBalances(
  ethAmt: BigNumberable,
  usdcAmt: BigNumberable,
) {
  await solo.contracts.send(
    solo.contracts.testUniswapV2Pair2.methods.setReserves(
      new BigNumber(usdcAmt).toFixed(0),
      new BigNumber(ethAmt).toFixed(0),
    ),
  );
}

async function updatePrice(
  minimum?: BigNumber,
  maximum?: BigNumber,
  options?: SendOptions,
) {
  return solo.oracle.daiPriceOracle.updatePrice(minimum, maximum, options || { from: poker });
}
