import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { snapshot, resetEVM, fastForward, mineAvgBlock } from '../helpers/EVM';
import { INTEGERS, ADDRESSES } from '../../src/lib/Constants';
import { address, ContractCallOptions } from '../../src/types';
import { expectThrow } from '../../src/lib/Expect';

let solo: Solo;
let accounts: address[];
let admin: address;
let poker: address;
let rando: address;
let marketMaker: address;
const defaultPrice = new BigNumber('1e18');
const defaultEthPrice = new BigNumber('1e20');
const uniswapAddress = ADDRESSES.TEST_UNISWAP;

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
    const oasisDexAddress = solo.contracts.testOasisDex.options.address;
    await Promise.all([
      solo.oracle.daiPriceOracle.setPokerAddress(poker, { from: admin }),
      setEthPrice(defaultEthPrice, true),
      solo.testing.tokenB.issueTo(tokenAmount, marketMaker),
      solo.weth.wrap(marketMaker, tokenAmount),
      solo.weth.setMaximumAllowance(marketMaker, oasisDexAddress),
      solo.testing.tokenB.setMaximumAllowance(marketMaker, oasisDexAddress),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
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
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
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
        setOasisLowPrice('0.99'),
        setOasisHighPrice('1.01'),
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

    it('Does not update price when stale ETH price', async () => {
      await Promise.all([
        setEthPrice(defaultEthPrice, false),
        setOasisLowPrice('0.99'),
        setOasisHighPrice('1.01'),
        setUniswapPrice('1.00'),
      ]);
      await expectThrow(
        updatePrice(),
      );
    });

    it('Updates timestamp correctly', async () => {
      await Promise.all([
        setOasisLowPrice('0.99'),
        setOasisHighPrice('1.01'),
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
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
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
        setOasisLowPrice('1.05'),
        setOasisHighPrice('1.06'),
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
        setOasisLowPrice('1.02'),
        setOasisHighPrice('1.03'),
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
        setOasisLowPrice('0.97'),
        setOasisHighPrice('0.98'),
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
        setOasisLowPrice('1.02'),
        setOasisHighPrice('1.03'),
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
        setOasisLowPrice('1.01'),
        setOasisHighPrice('1.02'),
        setUniswapPrice('0.99'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice);

      await Promise.all([
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
        setUniswapPrice('1.01'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice);
    });

    it('Succeeds for price < dollar', async () => {
      let price: BigNumber;

      await Promise.all([
        setOasisLowPrice('0.95'),
        setOasisHighPrice('0.97'),
        setUniswapPrice('0.98'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice.times('0.98'));

      await setUniswapPrice('0.50');
      const oasisPrice = await solo.oracle.daiPriceOracle.getOasisPrice();
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(oasisPrice);
    });

    it('Succeeds for price > dollar', async () => {
      let price: BigNumber;

      await Promise.all([
        setOasisLowPrice('1.04'),
        setOasisHighPrice('1.06'),
        setUniswapPrice('1.02'),
      ]);
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(defaultPrice.times('1.02'));

      await setUniswapPrice('2.00');
      const oasisPrice = await solo.oracle.daiPriceOracle.getOasisPrice();
      price = await solo.oracle.daiPriceOracle.getTargetPrice();
      expect(price).toEqual(oasisPrice);
    });
  });

  describe('getBoundedTargetPrice', () => {
    it('Upper-bounded by maximum absolute deviation', async () => {
      await fastForward(1000);

      await Promise.all([
        setOasisLowPrice('1.10'),
        setOasisHighPrice('1.11'),
        setUniswapPrice('1.10'),
      ]);
      const price = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(price).toEqual(defaultPrice.times('1.01'));
    });

    it('Lower-bounded by maximum absolute deviation', async () => {
      await fastForward(1000);

      await Promise.all([
        setOasisLowPrice('0.90'),
        setOasisHighPrice('0.91'),
        setUniswapPrice('0.90'),
      ]);
      const price = await solo.oracle.daiPriceOracle.getBoundedTargetPrice();
      expect(price).toEqual(defaultPrice.times('0.99'));
    });

    it('Upper-bounded by maximum deviation per second', async () => {
      await Promise.all([
        setOasisLowPrice('1.10'),
        setOasisHighPrice('1.11'),
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
        setOasisLowPrice('0.90'),
        setOasisHighPrice('0.91'),
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

  describe('getMedianizerPrice', () => {
    it('Fails for stale ETH price', async () => {
      await setEthPrice(defaultEthPrice, false);
      await expectThrow(
        solo.oracle.daiPriceOracle.getMedianizerPrice(),
      );
    });

    it('Succeeds for normal eth price', async () => {
      const price = await solo.oracle.daiPriceOracle.getMedianizerPrice();
      expect(price).toEqual(defaultEthPrice);
    });
  });

  describe('getOasisPrice', () => {
    it('Throws for no liquidity', async () => {
      await expectThrow(
        solo.oracle.daiPriceOracle.getOasisPrice(),
      );
    });

    it('Throws for no liquidity on WETH/DAI side', async () => {
      await Promise.all([setOasisHighPrice('1.01')]);
      await expectThrow(
        solo.oracle.daiPriceOracle.getOasisPrice(),
      );
    });

    it('Throws for no liquidity on DAI/WETH side', async () => {
      await Promise.all([setOasisLowPrice('0.99')]);
      await expectThrow(
        solo.oracle.daiPriceOracle.getOasisPrice(),
      );
    });

    it('Succeeds when there is a best order', async () => {
      const lowPrice = '0.984';
      const highPrice = '0.985';
      await Promise.all([
        setOasisLowPrice(lowPrice),
        setOasisHighPrice(highPrice),
      ]);
      const price = await solo.oracle.daiPriceOracle.getOasisPrice();
      expect(price.gt(defaultPrice.times(lowPrice))).toEqual(true);
      expect(price.lt(defaultPrice.times(highPrice))).toEqual(true);
    });

    it('Returns current price for closed', async () => {
      await Promise.all([
        setUniswapPrice('0.97'),
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
      ]);
      await mineAvgBlock();
      await updatePrice();
      const currentPrice = await solo.oracle.daiPriceOracle.getPrice();
      await solo.contracts.callContractFunction(
        solo.contracts.testOasisDex.methods.stop(),
      );
      const price = await solo.oracle.daiPriceOracle.getOasisPrice();
      expect(price).toEqual(currentPrice);
    });

    it('Returns current price for buy not enabled', async () => {
      await Promise.all([
        setUniswapPrice('0.97'),
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
      ]);
      await mineAvgBlock();
      await updatePrice();
      const currentPrice = await solo.oracle.daiPriceOracle.getPrice();
      await solo.contracts.callContractFunction(
        solo.contracts.testOasisDex.methods.setBuyEnabled(false),
      );
      const price = await solo.oracle.daiPriceOracle.getOasisPrice();
      expect(price).toEqual(currentPrice);
    });

    it('Returns current price for matching not enabled', async () => {
      await Promise.all([
        setUniswapPrice('0.97'),
        setOasisLowPrice('0.98'),
        setOasisHighPrice('0.99'),
      ]);
      await mineAvgBlock();
      await updatePrice();
      const currentPrice = await solo.oracle.daiPriceOracle.getPrice();
      await solo.contracts.callContractFunction(
        solo.contracts.testOasisDex.methods.setMatchingEnabled(false),
      );
      const price = await solo.oracle.daiPriceOracle.getOasisPrice();
      expect(price).toEqual(currentPrice);
    });
  });

  describe('getUniswapPrice', () => {
    it('Fails for zero liquidity', async () => {
      await expectThrow(
        solo.oracle.daiPriceOracle.getUniswapPrice(),
      );
    });

    it('Gets the right price for DAI = ETH', async () => {
      const ethAmt = new BigNumber(4444);
      const daiAmt = new BigNumber(4444);
      await setUniswapBalances(ethAmt, daiAmt);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      expect(price).toEqual(defaultEthPrice);
    });

    it('Gets the right price for ETH > DAI', async () => {
      const ethAmt = new BigNumber(4321);
      const daiAmt = new BigNumber(1234);
      await setUniswapBalances(ethAmt, daiAmt);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      const expected = defaultEthPrice.times(ethAmt).div(daiAmt).integerValue(BigNumber.ROUND_DOWN);
      expect(price).toEqual(expected);
    });

    it('Gets the right price for DAI > ETH', async () => {
      const ethAmt = new BigNumber(1234);
      const daiAmt = new BigNumber(4321);
      await setUniswapBalances(ethAmt, daiAmt);
      const price = await solo.oracle.daiPriceOracle.getUniswapPrice();
      const expected = defaultEthPrice.times(ethAmt).div(daiAmt).integerValue(BigNumber.ROUND_DOWN);
      expect(price).toEqual(expected);
    });

    it('Gets the right price for different ETH prices', async () => {
      const ethAmt = new BigNumber(1500);
      const daiAmt = new BigNumber(400000);
      await setUniswapBalances(ethAmt, daiAmt);
      const price1 = defaultPrice;
      const price2 = defaultPrice.times(2);
      const [daiPrice1, daiPrice2] = await Promise.all([
        solo.oracle.daiPriceOracle.getUniswapPrice(price1),
        solo.oracle.daiPriceOracle.getUniswapPrice(price2),
      ]);
      expect(new BigNumber(daiPrice2)).toEqual(new BigNumber(daiPrice1).times(2));
    });
  });
});

// ============ Helper Functions ============

async function setEthPrice(
  price: BigNumber,
  valid: boolean,
) {
  await solo.contracts.callContractFunction(
    solo.contracts.testMakerOracle.methods.setValues(
      price.toFixed(0),
      valid,
    ),
  );
}

async function setUniswapPrice(
  price: any,
) {
  await setUniswapBalances(
    new BigNumber('1e18'),
    getNumberFromPrice('1e18', price),
  );
}

async function setUniswapBalances(
  ethAmt: BigNumber,
  daiAmt: BigNumber,
) {
  await Promise.all([
    solo.testing.tokenB.issueTo(daiAmt, uniswapAddress),
    solo.web3.eth.sendTransaction({
      from: accounts[9],
      to: uniswapAddress,
      value: ethAmt.toFixed(0),
    }),
  ]);
}

async function setOasisLowPrice(
  price: any,
) {
  await createOasisOrder(
    new BigNumber('1e18'),
    solo.weth.getAddress(),
    getNumberFromPrice('1e18', price),
    solo.testing.tokenB.getAddress(),
  );
}

async function setOasisHighPrice(
  price: any,
) {
  await createOasisOrder(
    getNumberFromPrice('1e18', price),
    solo.testing.tokenB.getAddress(),
    new BigNumber('1e18'),
    solo.weth.getAddress(),
  );
}

function getNumberFromPrice(
  multiplier: any,
  price: any,
) {
  return new BigNumber(multiplier).times(
    defaultEthPrice,
  ).div(
    defaultPrice,
  ).div(
    price,
  ).integerValue(
    BigNumber.ROUND_DOWN,
  );
}

async function createOasisOrder(
  payAmt: BigNumber,
  payGem: address,
  buyAmt: BigNumber,
  buyGem: address,
) {
  await solo.contracts.callContractFunction(
    solo.contracts.testOasisDex.methods.offer(
      payAmt.toFixed(0),
      payGem,
      buyAmt.toFixed(0),
      buyGem,
      0,
    ),
    { from: marketMaker },
  );
}

async function updatePrice(
  minimum?: BigNumber,
  maximum?: BigNumber,
  options?: ContractCallOptions,
) {
  return solo.oracle.daiPriceOracle.updatePrice(minimum, maximum, options || { from: poker });
}
