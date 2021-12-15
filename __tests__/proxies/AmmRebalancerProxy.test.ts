/* eslint-disable */
import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src';
import { TestToken } from '../modules/TestToken';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;

const zero = new BigNumber(0);
const parA = new BigNumber('100000000000000000000'); // 100
const parB = new BigNumber('200000000'); // 200
const prices = [
  new BigNumber('1e20'),
  new BigNumber('1e32'),
  new BigNumber('1e18'),
  new BigNumber('1e21'),
];
const defaultIsClosing = false;

describe('AmmRebalancerProxy', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.priceOracle.setPrice(
        solo.testing.tokenA.getAddress(),
        prices[0],
      ),
      solo.testing.priceOracle.setPrice(
        solo.testing.tokenB.getAddress(),
        prices[1],
      ),
      solo.testing.priceOracle.setPrice(
        solo.testing.tokenC.getAddress(),
        prices[2],
      ),
      solo.testing.priceOracle.setPrice(solo.weth.getAddress(), prices[3]),
      setUpBasicBalances(),
      deployDolomiteLpTokens(),
      deployUniswapLpTokens(),
      solo.permissions.approveOperator(
        solo.contracts.ammRebalancerProxy.options.address,
        { from: owner1 },
      ),
    ]);
    await solo.admin.addMarket(
      solo.weth.getAddress(),
      solo.testing.priceOracle.getAddress(),
      solo.testing.interestSetter.getAddress(),
      zero,
      zero,
      defaultIsClosing,
      { from: admin },
    );

    await mineAvgBlock();

    snapshotId = await snapshot();
  });

  afterEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#performRebalance', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        // price is ~0.55
        await addDolomiteLiquidity(
          owner1,
          parA.div(10), // 10
          parB.div(11), // 18.1818
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );
        // price is 0.5
        await addUniswapLiquidity(
          owner1,
          parA.times(1000000), // 10
          parB.times(1000000), // 20
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        // const pair = await solo.contracts.getDolomiteAmmPairFromTokens(
        //   solo.testing.tokenA.getAddress(),
        //   solo.testing.tokenB.getAddress(),
        // );
        //
        // const pairWeiA = await solo.getters.getAccountWei(
        //   pair.options.address,
        //   INTEGERS.ZERO,
        //   new BigNumber(await getMarketId(solo.testing.tokenA)),
        // );
        // console.log('pairWeiA', pairWeiA.toFixed());

        const accountWeiA = await solo.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(solo.testing.tokenA)),
        );
        const accountWeiB = await solo.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(solo.testing.tokenB)),
        );

        // converge the prices of the two on ~0.5025 (0.5% away from the "real" price of 0.5)
        // true price needs to be calculated assuming the correct number of decimals, per asset
        const txResult = await solo.ammRebalancerProxy.performRebalance(
          [solo.testing.tokenB.getAddress(), solo.testing.tokenA.getAddress()],
          new BigNumber('1990049'),
          new BigNumber('1000000000000000000'),
          solo.contracts.testUniswapV2Router.options.address,
          [solo.testing.tokenA.getAddress(), solo.testing.tokenB.getAddress()],
          { from: owner1 },
        );
        console.log('performRebalance gas used', txResult.gasUsed.toString());

        const accountWeiANew = await solo.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(solo.testing.tokenA)),
        );
        expect(accountWeiA.lt(accountWeiANew)).toEqual(true);
        expect(accountWeiB).toEqual(
          await solo.getters.getAccountWei(
            owner1,
            INTEGERS.ZERO,
            new BigNumber(await getMarketId(solo.testing.tokenB)),
          ),
        );

        console.log('profit', accountWeiANew.minus(accountWeiA).toFixed(0));
      });
    });
  });
});

// ============ Helper Functions ============

// @ts-ignore
async function addDolomiteLiquidity(
  walletAddress: address,
  amountADesired: BigNumber,
  amountBDesired: BigNumber,
  tokenA: address,
  tokenB: address,
) {
  const result = await solo.dolomiteAmmRouterProxy
    .addLiquidity(
      walletAddress,
      INTEGERS.ZERO,
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      INTEGERS.ONE,
      INTEGERS.ONE,
      new BigNumber('123456789123'),
      { from: walletAddress },
    )
    .catch((reason) => {
      console.error('could not add dolomite liquidity: ', reason);
      return { gasUsed: 0 };
    });

  console.log('#addDolomiteLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function addUniswapLiquidity(
  walletAddress: address,
  amountADesired: BigNumber,
  amountBDesired: BigNumber,
  tokenA: address,
  tokenB: address,
) {
  await solo.testing.tokenA.approve(
    solo.contracts.testUniswapV2Router.options.address,
    INTEGERS.MAX_UINT,
    { from: walletAddress },
  );
  await solo.testing.tokenB.approve(
    solo.contracts.testUniswapV2Router.options.address,
    INTEGERS.MAX_UINT,
    { from: walletAddress },
  );

  const result = await solo.testing.uniswapV2Router
    .addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      INTEGERS.ONE,
      INTEGERS.ONE,
      walletAddress,
      new BigNumber('123456789123'),
      { from: walletAddress },
    )
    .catch(async (reason) => {
      console.error('could not add uniswap liquidity: ', reason);
      return { gasUsed: 0 };
    });

  console.log('#addUniswapLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function getMarketId(token: TestToken): Promise<string> {
  return solo.contracts.soloMargin.methods
    .getMarketIdByTokenAddress(token.getAddress())
    .call();
}

async function setUpBasicBalances() {
  const marketA = new BigNumber(await getMarketId(solo.testing.tokenA));
  const marketB = new BigNumber(await getMarketId(solo.testing.tokenB));

  const soloMarginAddress = solo.contracts.soloMargin.options.address;

  return Promise.all([
    solo.testing.tokenA.setBalance(owner1, parA.times(10000000)),
    solo.testing.tokenB.setBalance(owner1, parB.times(10000000)),
    solo.testing.tokenA.setBalance(soloMarginAddress, parA, { from: owner1 }),
    solo.testing.tokenB.setBalance(soloMarginAddress, parB, { from: owner1 }),
    solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
    solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
  ]);
}

async function deployDolomiteLpTokens() {
  await solo.contracts.callContractFunction(
    solo.contracts.dolomiteAmmFactory.methods.createPair(
      solo.testing.tokenA.getAddress(),
      solo.testing.tokenB.getAddress(),
    ),
  );
  await solo.contracts.callContractFunction(
    solo.contracts.dolomiteAmmFactory.methods.createPair(
      solo.testing.tokenB.getAddress(),
      solo.testing.tokenC.getAddress(),
    ),
  );
}

async function deployUniswapLpTokens() {
  await solo.contracts.callContractFunction(
    solo.contracts.testUniswapV2Factory.methods.createPair(
      solo.testing.tokenA.getAddress(),
      solo.testing.tokenB.getAddress(),
    ),
  );
  await solo.contracts.callContractFunction(
    solo.contracts.testUniswapV2Factory.methods.createPair(
      solo.testing.tokenB.getAddress(),
      solo.testing.tokenC.getAddress(),
    ),
  );
}
