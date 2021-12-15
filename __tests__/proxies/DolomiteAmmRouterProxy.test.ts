/* eslint-disable */
import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src';
import { TestToken } from '../modules/TestToken';
import { expectThrow } from '../../src/lib/Expect';
import { DolomiteAmmPair } from '../../build/wrappers/DolomiteAmmPair';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
// @ts-ignore
let owner2: address;
let token_ab: address;
let token_ab_account;
let token_bc: address;
let token_bc_account;
// @ts-ignore
let token_ac: address;

const zero = new BigNumber(0);
const parA = new BigNumber('1000000000000000000');
const parB = new BigNumber('2000000');
const parC = new BigNumber('300000000000000000000');
const prices = [
  new BigNumber('1e20'),
  new BigNumber('1e32'),
  new BigNumber('1e18'),
  new BigNumber('1e21'),
];
const defaultIsClosing = false;

describe('DolomiteAmmRouterProxy', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();
    owner2 = accounts[3];

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
      deployUniswapLpTokens(),
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

    token_ab = await getUniswapLpTokenAddress(
      solo.testing.tokenA.getAddress(),
      solo.testing.tokenB.getAddress(),
    );
    token_ab_account = { owner: token_ab, number: '0' };

    token_bc = await getUniswapLpTokenAddress(
      solo.testing.tokenB.getAddress(),
      solo.testing.tokenC.getAddress(),
    );
    token_bc_account = { owner: token_bc, number: '0' };

    token_ac = await getUniswapLpTokenAddress(
      solo.testing.tokenA.getAddress(),
      solo.testing.tokenC.getAddress(),
    );
    await mineAvgBlock();

    snapshotId = await snapshot();
  });

  afterEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#addLiquidity', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(solo.testing.tokenA);

        let result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('before account wei ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('after account wei ', result.toString());

        const pair = solo.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
      });
    });

    describe('Failure cases', () => {
      it('should not work when amount exceeds user balance', async () => {
        await expectThrow(
          solo.dolomiteAmmRouterProxy.addLiquidity(
            owner1,
            INTEGERS.ZERO,
            solo.testing.tokenA.getAddress(),
            solo.testing.tokenB.getAddress(),
            parA.times('2'),
            parB.times('2'),
            INTEGERS.ONE,
            INTEGERS.ONE,
            new BigNumber('123456789123'),
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
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(solo.testing.tokenA);

        let result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const lpToken = await getDolomiteLpToken();
        const liquidity = new BigNumber(
          await lpToken.methods.balanceOf(owner1).call(),
        );

        await solo.contracts.callContractFunction(
          lpToken.methods.approve(
            solo.contracts.dolomiteAmmRouterProxy.options.address,
            INTEGERS.ONES_255.toFixed(0),
          ),
          { from: owner1 },
        );

        await removeLiquidity(owner1, liquidity);

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei after ', result.toString());

        const pair = solo.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
      });
    });

    describe('Failure cases', () => {
      it('should not work when amount exceeds user balance', async () => {
        await addLiquidity(
          owner1,
          parA,
          parB,
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const lpToken = solo.contracts.getDolomiteAmmPair(token_ab);
        const liquidity = new BigNumber(
          await lpToken.methods.balanceOf(owner1).call(),
        );
        const dolomiteAmmRouterProxyAddress =
          solo.contracts.dolomiteAmmRouterProxy.options.address;
        const maxUint = INTEGERS.ONES_255.toFixed(0);

        await solo.contracts.callContractFunction(
          lpToken.methods.approve(dolomiteAmmRouterProxyAddress, maxUint),
          { from: owner1 },
        );

        await expectThrow(removeLiquidity(owner1, liquidity.times('2')), '');

        await expectThrow(
          removeLiquidity(
            owner1,
            liquidity,
            parA.times('2'),
            parB.times('99').div('100'),
          ),
          'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_A_AMOUNT',
        );
        await expectThrow(
          removeLiquidity(
            owner1,
            liquidity,
            parA.times('99').div('100'),
            parB.times('2'),
          ),
          'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_B_AMOUNT',
        );
      });
    });
  });

  describe('#swapExactTokensForTokens', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(solo.testing.tokenA);
        const marketIdB = await getMarketId(solo.testing.tokenB);

        let result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const uniswapV2Pair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await uniswapV2Pair.methods.getReservesPar().call(),
        );

        await swapExactTokensForTokens(owner1, parA.div(100));

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        const pair = solo.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
      });

      it('should work for normal case with a path of more than 2 tokens', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(solo.testing.tokenA);
        const marketIdB = await getMarketId(solo.testing.tokenB);
        const marketIdC = await getMarketId(solo.testing.tokenC);

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        await addLiquidity(
          owner1,
          parB.div(10),
          parC.div(10),
          solo.testing.tokenB.getAddress(),
          solo.testing.tokenC.getAddress(),
        );

        const uniswapV2Pair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await uniswapV2Pair.methods.getReservesPar().call(),
        );

        await swapExactTokensForTokens(owner1, parA.div(100), [
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
          solo.testing.tokenC.getAddress(),
        ]);

        let result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdC)
          .call();
        console.log('account marketIdC wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdC)
          .call();
        console.log('account marketIdC wei after ', result.toString());

        const pair_ab = solo.contracts.getDolomiteAmmPair(token_ab);
        const reserves_ab = await pair_ab.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves_ab);

        const marketId0_ab = await pair_ab.methods.marketId0().call();
        const balance0_ab = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId0_ab)
          .call();
        expect(reserves_ab._reserve0).toEqual(balance0_ab.value);
        expect(balance0_ab.sign).toEqual(true);

        const marketId1_ab = await pair_ab.methods.marketId1().call();
        const balance1_ab = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId1_ab)
          .call();
        expect(reserves_ab._reserve1).toEqual(balance1_ab.value);
        expect(balance1_ab.sign).toEqual(true);

        const pair_bc = solo.contracts.getDolomiteAmmPair(token_bc);
        const reserves_bc = await pair_bc.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves_bc);

        const marketId0_bc = await pair_bc.methods.marketId0().call();
        const balance0_bc = await solo.contracts.soloMargin.methods
          .getAccountWei(token_bc_account, marketId0_bc)
          .call();
        expect(reserves_bc._reserve0).toEqual(balance0_bc.value);
        expect(balance0_bc.sign).toEqual(true);

        const marketId1_bc = await pair_bc.methods.marketId1().call();
        const balance1_bc = await solo.contracts.soloMargin.methods
          .getAccountWei(token_bc_account, marketId1_bc)
          .call();
        expect(reserves_bc._reserve1).toEqual(balance1_bc.value);
        expect(balance1_bc.sign).toEqual(true);
      });
    });

    describe('Failure cases', () => {
      it('should not work when trade size is more than available liquidity', async () => {
        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        await expectThrow(
          swapTokensForExactTokens(owner1, parB.div(2)),
          'DolomiteAmmRouterProxy::_getParamsForSwapExactTokensForTokens: INSUFFICIENT_OUTPUT_AMOUNT',
        );
      });
    });
  });

  describe('#swapExactTokensForTokensAndModifyPosition', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(solo.testing.tokenA);
        const marketIdB = await getMarketId(solo.testing.tokenB);

        let result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const dolomiteAmmPair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await dolomiteAmmPair.methods.getReservesPar().call(),
        );

        const accountNumber = INTEGERS.ONE;
        const txResult = await solo.dolomiteAmmRouterProxy.swapExactTokensForTokensAndModifyPosition(
          accountNumber,
          parA.div(100),
          INTEGERS.ONE,
          [solo.testing.tokenA.getAddress(), solo.testing.tokenB.getAddress()],
          solo.testing.tokenB.getAddress(),
          true,
          parB.div(10),
          new BigNumber('3600'),
          new BigNumber('123456789123'),
          { from: owner1 },
        );

        console.log(
          '#swapExactTokensForTokensAndModifyPosition gas used  ',
          txResult.gasUsed.toString(),
        );

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        const pair = solo.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await solo.contracts.soloMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
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
    .catch(reason => {
      console.log('reason ', reason);
      return { gasUsed: 0 };
    });

  console.log('#addLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function removeLiquidity(
  walletAddress: address,
  liquidity: BigNumber,
  amountAMin: BigNumber = INTEGERS.ZERO,
  amountBMin: BigNumber = INTEGERS.ZERO,
) {
  const result = await solo.dolomiteAmmRouterProxy.removeLiquidity(
    walletAddress,
    INTEGERS.ZERO,
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
    liquidity,
    amountAMin,
    amountBMin,
    new BigNumber('123456789123'),
    { from: walletAddress },
  );

  console.log('#removeLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function swapExactTokensForTokens(
  walletAddress: address,
  amountIn: BigNumber,
  path: string[] = [
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
  ],
) {
  const result = await solo.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    amountIn,
    INTEGERS.ONE,
    path,
    new BigNumber('123456789123'),
    { from: walletAddress },
  );

  console.log(
    '#swapExactTokensForTokens gas used  ',
    result.gasUsed.toString(),
  );

  return result;
}

async function swapTokensForExactTokens(
  walletAddress: address,
  amountOut: BigNumber,
  path: string[] = [
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
  ],
) {
  const result = await solo.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    INTEGERS.ONE,
    amountOut,
    path,
    new BigNumber('123456789123'),
    { from: walletAddress },
  );

  console.log(
    '#swapExactTokensForTokens gas used  ',
    result.gasUsed.toString(),
  );

  return result;
}

async function getMarketId(token: TestToken) {
  return solo.contracts.soloMargin.methods
    .getMarketIdByTokenAddress(token.getAddress())
    .call();
}

async function setUpBasicBalances() {
  const marketA = new BigNumber(await getMarketId(solo.testing.tokenA));
  const marketB = new BigNumber(await getMarketId(solo.testing.tokenB));

  return Promise.all([
    solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
    solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
  ]);
}

async function deployUniswapLpTokens() {
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

async function getUniswapLpTokenAddress(
  tokenA: address = solo.testing.tokenA.getAddress(),
  tokenB: address = solo.testing.tokenB.getAddress(),
): Promise<string> {
  return solo.contracts.dolomiteAmmFactory.methods
    .getPair(tokenA, tokenB)
    .call();
}

async function getDolomiteLpToken(): Promise<DolomiteAmmPair> {
  return solo.contracts.getDolomiteAmmPair(await getUniswapLpTokenAddress());
}
