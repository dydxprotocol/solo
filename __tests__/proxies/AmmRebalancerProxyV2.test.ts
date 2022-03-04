/* eslint-disable */
import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { address, INTEGERS } from '../../src';
import { TestToken } from '../modules/TestToken';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;

const zero = new BigNumber(0);
const parA = new BigNumber('100000000000000000000'); // 100
const parB = new BigNumber('200000000'); // 200
const prices = [new BigNumber('1e20'), new BigNumber('1e32'), new BigNumber('1e18'), new BigNumber('1e21')];
const defaultIsClosing = false;
const defaultIsRecyclable = false;

describe('AmmRebalancerProxyV2', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = dolomiteMargin.getDefaultAccount();

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenA.address, prices[0]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenB.address, prices[1]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenC.address, prices[2]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.weth.address, prices[3]),
      setUpBasicBalances(),
      deployDolomiteLpTokens(),
      dolomiteMargin.permissions.approveOperator(dolomiteMargin.contracts.ammRebalancerProxyV2.options.address, {
        from: owner1,
      }),
    ]);

    expect(await dolomiteMargin.dolomiteAmmFactory.getPairInitCodeHash()).toEqual(
      await dolomiteMargin.dolomiteAmmRouterProxy.getPairInitCodeHash(),
    );

    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.weth.address,
      dolomiteMargin.testing.priceOracle.address,
      dolomiteMargin.testing.interestSetter.address,
      zero,
      zero,
      defaultIsClosing,
      defaultIsRecyclable,
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
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );
        const accountWeiA = await dolomiteMargin.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(dolomiteMargin.testing.tokenA)),
        );
        const accountWeiB = await dolomiteMargin.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(dolomiteMargin.testing.tokenB)),
        );

        const otherAmountIn = new BigNumber('100');
        const otherAmountOut = new BigNumber('1990050');

        const uniswapV3CallData = dolomiteMargin.contracts.testUniswapV3MultiRouter.methods
          .call(dolomiteMargin.testing.tokenB.address, otherAmountOut.toFixed(0))
          .encodeABI();

        // converge the prices of the two on ~0.5025 (0.5% away from the "real" price of 0.5)
        // true price needs to be calculated assuming the correct number of decimals, per asset
        const txResult = await dolomiteMargin.ammRebalancerProxyV2.performRebalance(
          [dolomiteMargin.testing.tokenB.address, dolomiteMargin.testing.tokenA.address],
          new BigNumber('1990049'),
          new BigNumber('1000000000000000000'),
          otherAmountIn,
          uniswapV3CallData,
          { from: owner1 },
        );
        console.log('\tperformRebalance gas used', txResult.gasUsed.toString());

        const accountWeiANew = await dolomiteMargin.getters.getAccountWei(
          owner1,
          INTEGERS.ZERO,
          new BigNumber(await getMarketId(dolomiteMargin.testing.tokenA)),
        );
        expect(accountWeiA.lt(accountWeiANew)).toEqual(true);
        expect(accountWeiB).toEqual(
          await dolomiteMargin.getters.getAccountWei(
            owner1,
            INTEGERS.ZERO,
            new BigNumber(await getMarketId(dolomiteMargin.testing.tokenB)),
          ),
        );

        console.log('\tarb profit', accountWeiANew.minus(accountWeiA).toFixed(0));
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
  const result = await dolomiteMargin.dolomiteAmmRouterProxy
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
    .catch(reason => {
      console.error('could not add dolomite liquidity: ', reason);
      return { gasUsed: 0 };
    });

  console.log('\t#addDolomiteLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function getMarketId(token: TestToken): Promise<string> {
  return dolomiteMargin.contracts.dolomiteMargin.methods.getMarketIdByTokenAddress(token.address).call();
}

async function setUpBasicBalances() {
  const marketA = new BigNumber(await getMarketId(dolomiteMargin.testing.tokenA));
  const marketB = new BigNumber(await getMarketId(dolomiteMargin.testing.tokenB));

  const dolomiteMarginAddress = dolomiteMargin.contracts.dolomiteMargin.options.address;

  return Promise.all([
    dolomiteMargin.testing.tokenA.setBalance(owner1, parA.times(10000000)),
    dolomiteMargin.testing.tokenB.setBalance(owner1, parB.times(10000000)),
    dolomiteMargin.testing.tokenA.setBalance(dolomiteMarginAddress, parA, { from: owner1 }),
    dolomiteMargin.testing.tokenB.setBalance(dolomiteMarginAddress, parB, { from: owner1 }),
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
  ]);
}

async function deployDolomiteLpTokens() {
  await dolomiteMargin.contracts.callContractFunction(
    dolomiteMargin.contracts.dolomiteAmmFactory.methods.createPair(
      dolomiteMargin.testing.tokenA.address,
      dolomiteMargin.testing.tokenB.address,
    ),
  );
  await dolomiteMargin.contracts.callContractFunction(
    dolomiteMargin.contracts.dolomiteAmmFactory.methods.createPair(
      dolomiteMargin.testing.tokenB.address,
      dolomiteMargin.testing.tokenC.address,
    ),
  );
}
