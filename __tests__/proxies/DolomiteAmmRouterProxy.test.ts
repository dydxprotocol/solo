import BigNumber from 'bignumber.js';
import { address, Integer, INTEGERS } from '../../src';
import { expectThrow } from '../../src/lib/Expect';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';

let defaultPath: address[];
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;
let token_ab: address;
let token_bc: address;

const zero = new BigNumber(0);
const parA = new BigNumber('1000000000000000000');
const parB = new BigNumber('2000000');
const parC = new BigNumber('300000000000000000000');
const prices = [new BigNumber('1e20'), new BigNumber('1e32'), new BigNumber('1e18'), new BigNumber('1e21')];
const defaultDeadline = new BigNumber('123456789123');
const defaultIsClosing = false;
const defaultIsRecyclable = false;

describe('DolomiteAmmRouterProxy', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    defaultPath = [dolomiteMargin.testing.tokenA.address, dolomiteMargin.testing.tokenB.address];
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = accounts[1];
    owner2 = accounts[2];

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenA.address, prices[0]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenB.address, prices[1]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenC.address, prices[2]),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.weth.address, prices[3]),
      setUpBasicBalances(),
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

    await Promise.all([
      dolomiteMargin.dolomiteAmmFactory.createPair(
        dolomiteMargin.testing.tokenA.address,
        dolomiteMargin.testing.tokenB.address,
      ),
      dolomiteMargin.dolomiteAmmFactory.createPair(
        dolomiteMargin.testing.tokenB.address,
        dolomiteMargin.testing.tokenC.address,
      ),
    ]);

    // Needs to be done once the balances are set up
    await Promise.all([
      addLiquidity(
        owner2,
        parA.div(100),
        parB.div(100),
        dolomiteMargin.testing.tokenA.address,
        dolomiteMargin.testing.tokenB.address,
      ),
      addLiquidity(
        owner2,
        parB.div(100),
        parC.div(100),
        dolomiteMargin.testing.tokenB.address,
        dolomiteMargin.testing.tokenC.address,
      ),
    ]);

    token_ab = await dolomiteMargin.dolomiteAmmFactory.getPair(
      dolomiteMargin.testing.tokenA.address,
      dolomiteMargin.testing.tokenB.address,
    );

    token_bc = await dolomiteMargin.dolomiteAmmFactory.getPair(
      dolomiteMargin.testing.tokenB.address,
      dolomiteMargin.testing.tokenC.address,
    );

    await mineAvgBlock();

    snapshotId = await snapshot();
  });

  afterEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#symbol', () => {
    describe('Success cases', () => {
      it('should get name properly', async () => {
        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const symbol = await pair.symbol();
        const [token0] =
          dolomiteMargin.testing.tokenA.address < dolomiteMargin.testing.tokenB.address
            ? [dolomiteMargin.testing.tokenA.address]
            : [dolomiteMargin.testing.tokenB.address];

        // tokenA === USDC && tokenB === DAI
        if (token0 === dolomiteMargin.testing.tokenA.address) {
          expect(symbol).toEqual('DLP_USDC_DAI');
        } else {
          expect(symbol).toEqual('DLP_DAI_USDC');
        }
      });
    });
  });

  describe('#name', () => {
    describe('Success cases', () => {
      it('should get name properly', async () => {
        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const name = await pair.name();
        const [token0] =
          dolomiteMargin.testing.tokenA.address < dolomiteMargin.testing.tokenB.address
            ? [dolomiteMargin.testing.tokenA.address]
            : [dolomiteMargin.testing.tokenB.address];

        // tokenA === USDC && tokenB === DAI
        if (token0 === dolomiteMargin.testing.tokenA.address) {
          expect(name).toEqual('Dolomite LP Token: USDC_DAI');
        } else {
          expect(name).toEqual('Dolomite LP Token: DAI_USDC');
        }
      });
    });
  });

  describe('#addLiquidity', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        await addLiquidity(
          owner1,
          parA,
          parB,
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const reserves = await pair.getReservesWei();

        const marketId0 = await pair.marketId0();
        const balance0 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0);
        expect(reserves.reserve0).toEqual(balance0);

        const marketId1 = await pair.marketId1();
        const balance1 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1);
        expect(reserves.reserve1).toEqual(balance1);
      });
    });

    describe('Failure cases', () => {
      it('should not work when amount exceeds user balance', async () => {
        await expectThrow(
          dolomiteMargin.dolomiteAmmRouterProxy.addLiquidity(
            owner1,
            INTEGERS.ZERO,
            dolomiteMargin.testing.tokenA.address,
            dolomiteMargin.testing.tokenB.address,
            parA.times('2'),
            parB.times('2'),
            INTEGERS.ONE,
            INTEGERS.ONE,
            defaultDeadline,
            { from: owner1 },
          ),
          `OperationImpl: Undercollateralized account <${owner1.toLowerCase()}, 0>`,
        );
      });
    });
  });

  describe('#removeLiquidity', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        await addLiquidity(
          owner1,
          parA,
          parB,
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        const lpToken = await dolomiteMargin.getDolomiteAmmPair(token_ab);
        const liquidity = await lpToken.balanceOf(owner1);

        await lpToken.approve(dolomiteMargin.contracts.dolomiteAmmRouterProxy.options.address, INTEGERS.ONES_255, {
          from: owner1,
        });

        await removeLiquidity(owner1, liquidity);

        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const reserves = await pair.getReservesWei();

        const marketId0 = await pair.marketId0();
        const balance0 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0);
        expect(reserves.reserve0).toEqual(balance0);

        const marketId1 = await pair.marketId1();
        const balance1 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1);
        expect(reserves.reserve1).toEqual(balance1);
      });
    });

    describe('Failure cases', () => {
      it('should not work when amount exceeds user balance', async () => {
        await addLiquidity(
          owner1,
          parA,
          parB,
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        const lpToken = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const liquidity = await lpToken.balanceOf(owner1);

        const dolomiteAmmRouterProxyAddress = dolomiteMargin.contracts.dolomiteAmmRouterProxy.options.address;

        await lpToken.approve(dolomiteAmmRouterProxyAddress, INTEGERS.ONES_255, { from: owner1 });

        await expectThrow(removeLiquidity(owner1, liquidity.times('2')), '');

        await expectThrow(
          removeLiquidity(owner1, liquidity, parA.times('2'), parB.times('99').div('100')),
          `DolomiteAmmRouterProxy: insufficient A amount <${parA}, ${parA.times('2')}>`,
        );
        await expectThrow(
          removeLiquidity(owner1, liquidity, parA.times('99').div('100'), parB.times('2')),
          `DolomiteAmmRouterProxy: insufficient B amount <${parB}, ${parB.times('2')}>`,
        );
      });
    });
  });

  describe('#swapExactTokensForTokens', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        await swapExactTokensForTokens(owner1, parA.div(100));

        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const { reserve0, reserve1 } = await pair.getReservesWei();

        const marketId0 = await pair.marketId0();
        const reserveBalance0 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0);
        expect(reserve0).toEqual(reserveBalance0);

        const marketId1 = await pair.marketId1();
        const reserveBalance1 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1);
        expect(reserve1).toEqual(reserveBalance1);
      });

      it('should work for normal case with a path of more than 2 tokens', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        await addLiquidity(
          owner1,
          parB.div(10),
          parC.div(10),
          dolomiteMargin.testing.tokenB.address,
          dolomiteMargin.testing.tokenC.address,
        );

        const _3Path = [
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
          dolomiteMargin.testing.tokenC.address,
        ];

        await swapExactTokensForTokens(owner1, parA.div(100), _3Path);

        await swapExactTokensForTokens(owner1, parA.div(100), _3Path);

        const pair_ab = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const reserves_ab = await pair_ab.getReservesWei();

        const marketId0_ab = await pair_ab.marketId0();
        const balance0_ab = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0_ab);
        expect(reserves_ab.reserve0).toEqual(balance0_ab);

        const marketId1_ab = await pair_ab.marketId1();
        const balance1_ab = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1_ab);
        expect(reserves_ab.reserve1).toEqual(balance1_ab);

        const pair_bc = dolomiteMargin.getDolomiteAmmPair(token_bc);
        const reserves_bc = await pair_bc.getReservesWei();

        const marketId0_bc = await pair_bc.marketId0();
        const balance0_bc = await dolomiteMargin.getters.getAccountWei(token_bc, INTEGERS.ZERO, marketId0_bc);
        expect(reserves_bc.reserve0).toEqual(balance0_bc);

        const marketId1_bc = await pair_bc.marketId1();
        const balance1_bc = await dolomiteMargin.getters.getAccountWei(token_bc, INTEGERS.ZERO, marketId1_bc);
        expect(reserves_bc.reserve1).toEqual(balance1_bc);
      });
    });

    describe('Failure cases', () => {
      it('should not work when trade size is more than available liquidity', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        await expectThrow(
          swapExactTokensForTokens(owner1, parA, defaultPath, parB),
          `DolomiteAmmRouterProxy: insufficient output amount <198139, ${parB}>`,
        );
      });
    });
  });

  describe('#swapExactTokensForTokensAndModifyPosition', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        const accountNumber = INTEGERS.ONE;
        const expiryTimeDelta = new BigNumber('3600');
        const txResult = await dolomiteMargin.dolomiteAmmRouterProxy.swapExactTokensForTokensAndModifyPosition(
          accountNumber,
          parA.div(100),
          INTEGERS.ONE,
          defaultPath,
          dolomiteMargin.testing.tokenB.address,
          true,
          parB.div(10),
          expiryTimeDelta,
          defaultDeadline,
          { from: owner1 },
        );

        console.log(
          `#swapExactTokensForTokensAndModifyPosition gas used ${defaultPath.length}-path with deposit and expiration`,
          txResult.gasUsed.toString(),
        );

        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const reserves = await pair.getReservesWei();

        const marketId0 = await pair.marketId0();
        const balance0 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0);
        expect(reserves.reserve0).toEqual(balance0);

        const marketId1 = await pair.marketId1();
        const balance1 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1);
        expect(reserves.reserve1).toEqual(balance1);
      });
    });
  });

  describe('#swapTokensForExactTokens', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        await swapTokensForExactTokens(owner1, parB.div(100));

        const pair = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const { reserve0, reserve1 } = await pair.getReservesWei();

        const marketId0 = await pair.marketId0();
        const balance0 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0);
        expect(reserve0).toEqual(balance0);

        const marketId1 = await pair.marketId1();
        const balance1 = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1);
        expect(reserve1).toEqual(balance1);
      });

      it('should work for normal case with a path of more than 2 tokens', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        await addLiquidity(
          owner1,
          parB.div(10),
          parC.div(10),
          dolomiteMargin.testing.tokenB.address,
          dolomiteMargin.testing.tokenC.address,
        );

        const _3Path = [
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
          dolomiteMargin.testing.tokenC.address,
        ];

        await swapTokensForExactTokens(owner1, parA.div(100), _3Path);
        await swapTokensForExactTokens(owner1, parA.div(100), _3Path);

        const pair_ab = dolomiteMargin.getDolomiteAmmPair(token_ab);
        const reserves_ab = await pair_ab.getReservesWei();

        const marketId0_ab = await pair_ab.marketId0();
        const balance0_ab = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId0_ab);
        expect(reserves_ab.reserve0).toEqual(balance0_ab);

        const marketId1_ab = await pair_ab.marketId1();
        const balance1_ab = await dolomiteMargin.getters.getAccountWei(token_ab, INTEGERS.ZERO, marketId1_ab);
        expect(reserves_ab.reserve1).toEqual(balance1_ab);

        const pair_bc = dolomiteMargin.getDolomiteAmmPair(token_bc);
        const reserves_bc = await pair_bc.getReservesWei();

        const marketId0_bc = await pair_bc.marketId0();
        const balance0_bc = await dolomiteMargin.getters.getAccountWei(token_bc, INTEGERS.ZERO, marketId0_bc);
        expect(reserves_bc.reserve0).toEqual(balance0_bc);

        const marketId1_bc = await pair_bc.marketId1();
        const balance1_bc = await dolomiteMargin.getters.getAccountWei(token_bc, INTEGERS.ZERO, marketId1_bc);
        expect(reserves_bc.reserve1).toEqual(balance1_bc);
      });
    });

    describe('Failure cases', () => {
      it('should not work when trade size is more than available liquidity', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.address,
          dolomiteMargin.testing.tokenB.address,
        );

        const amountInMax = INTEGERS.ONE;
        await expectThrow(
          swapTokensForExactTokens(owner1, parB.div(25), defaultPath, amountInMax),
          `DolomiteAmmRouterProxy: excessive input amount <63046281702249606, ${amountInMax.toFixed()}>`,
        );
      });
    });
  });
});

// ============ Helper Functions ============

async function addLiquidity(
  walletAddress: address,
  amountADesired: BigNumber,
  amountBDesired: BigNumber,
  tokenA: address,
  tokenB: address,
  skipGasCheck: boolean = false,
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
      defaultDeadline,
      { from: walletAddress },
    )
    .catch(reason => {
      console.log('reason ', reason);
      return { gasUsed: 0 };
    });

  if (skipGasCheck) {
    console.log('#addLiquidity gas used  ', result.gasUsed.toString());
  }

  return result;
}

async function removeLiquidity(
  walletAddress: address,
  liquidity: BigNumber,
  amountAMin: BigNumber = INTEGERS.ZERO,
  amountBMin: BigNumber = INTEGERS.ZERO,
) {
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.removeLiquidity(
    walletAddress,
    INTEGERS.ZERO,
    dolomiteMargin.testing.tokenA.address,
    dolomiteMargin.testing.tokenB.address,
    liquidity,
    amountAMin,
    amountBMin,
    defaultDeadline,
    { from: walletAddress },
  );

  console.log('#removeLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function swapExactTokensForTokens(
  walletAddress: address,
  amountIn: BigNumber,
  path: string[] = defaultPath,
  amountOutMax: Integer = INTEGERS.ONE,
) {
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    amountIn,
    amountOutMax,
    path,
    defaultDeadline,
    { from: walletAddress },
  );

  console.log(`#swapExactTokensForTokens gas used ${path.length}-path `, result.gasUsed.toString());

  return result;
}

async function swapTokensForExactTokens(
  walletAddress: address,
  amountOut: BigNumber,
  path: string[] = defaultPath,
  amountInMax: Integer = INTEGERS.MAX_UINT,
) {
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.swapTokensForExactTokens(
    INTEGERS.ZERO,
    amountInMax,
    amountOut,
    path,
    defaultDeadline,
    { from: walletAddress },
  );

  console.log(`#swapTokensForExactTokens gas used ${path.length}-path`, result.gasUsed.toString());

  return result;
}

async function setUpBasicBalances() {
  const marketA = await dolomiteMargin.getters.getMarketIdByTokenAddress(dolomiteMargin.testing.tokenA.address);
  const marketB = await dolomiteMargin.getters.getMarketIdByTokenAddress(dolomiteMargin.testing.tokenB.address);
  const marketC = await dolomiteMargin.getters.getMarketIdByTokenAddress(dolomiteMargin.testing.tokenC.address);

  return Promise.all([
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
    dolomiteMargin.testing.setAccountBalance(owner2, INTEGERS.ZERO, marketA, parA),
    dolomiteMargin.testing.setAccountBalance(owner2, INTEGERS.ZERO, marketB, parB),
    dolomiteMargin.testing.setAccountBalance(owner2, INTEGERS.ZERO, marketC, parC),
  ]);
}
