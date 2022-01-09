/* eslint-disable */
import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from '../helpers/DolomiteMargin';
import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/DolomiteMarginHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src';
import { TestToken } from '../modules/TestToken';
import { expectThrow } from '../../src/lib/Expect';
import { DolomiteAmmPair } from '../../build/wrappers/DolomiteAmmPair';

let dolomiteMargin: TestDolomiteMargin;
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
const defaultIsRecyclable = false;
const defaultDeadline = new BigNumber('123456789123');

describe('DolomiteAmmRouterProxy', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = dolomiteMargin.getDefaultAccount();
    owner2 = accounts[3];

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.testing.tokenA.getAddress(),
        prices[0],
      ),
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.testing.tokenB.getAddress(),
        prices[1],
      ),
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.testing.tokenC.getAddress(),
        prices[2],
      ),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.weth.getAddress(), prices[3]),
      setUpBasicBalances(),
      deployUniswapLpTokens(),
    ]);
    await dolomiteMargin.admin.addMarket(
      dolomiteMargin.weth.getAddress(),
      dolomiteMargin.testing.priceOracle.getAddress(),
      dolomiteMargin.testing.interestSetter.getAddress(),
      zero,
      zero,
      defaultIsClosing,
      defaultIsRecyclable,
      { from: admin },
    );

    expect(await dolomiteMargin.dolomiteAmmFactory.getPairInitCodeHash())
      .toEqual(await dolomiteMargin.dolomiteAmmRouterProxy.getPairInitCodeHash());

    token_ab = await getUniswapLpTokenAddress(
      dolomiteMargin.testing.tokenA.getAddress(),
      dolomiteMargin.testing.tokenB.getAddress(),
    );
    token_ab_account = { owner: token_ab, number: '0' };

    token_bc = await getUniswapLpTokenAddress(
      dolomiteMargin.testing.tokenB.getAddress(),
      dolomiteMargin.testing.tokenC.getAddress(),
    );
    token_bc_account = { owner: token_bc, number: '0' };

    token_ac = await getUniswapLpTokenAddress(
      dolomiteMargin.testing.tokenA.getAddress(),
      dolomiteMargin.testing.tokenC.getAddress(),
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
        const marketIdA = await getMarketId(dolomiteMargin.testing.tokenA);

        let result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('before account wei ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('after account wei ', result.toString());

        const pair = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
      });
    });

    describe('Failure cases', () => {
      it('should not work when amount exceeds user balance', async () => {
        await expectThrow(
          dolomiteMargin.dolomiteAmmRouterProxy.addLiquidity(
            owner1,
            INTEGERS.ZERO,
            dolomiteMargin.testing.tokenA.getAddress(),
            dolomiteMargin.testing.tokenB.getAddress(),
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
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(dolomiteMargin.testing.tokenA);

        let result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        const lpToken = await getDolomiteLpToken();
        const liquidity = new BigNumber(
          await lpToken.methods.balanceOf(owner1).call(),
        );

        await dolomiteMargin.contracts.callContractFunction(
          lpToken.methods.approve(
            dolomiteMargin.contracts.dolomiteAmmRouterProxy.options.address,
            INTEGERS.ONES_255.toFixed(0),
          ),
          { from: owner1 },
        );

        await removeLiquidity(owner1, liquidity);

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei after ', result.toString());

        const pair = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await dolomiteMargin.contracts.dolomiteMargin.methods
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
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        const lpToken = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const liquidity = new BigNumber(
          await lpToken.methods.balanceOf(owner1).call(),
        );
        const dolomiteAmmRouterProxyAddress =
          dolomiteMargin.contracts.dolomiteAmmRouterProxy.options.address;
        const maxUint = INTEGERS.ONES_255.toFixed(0);

        await dolomiteMargin.contracts.callContractFunction(
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
        const marketIdA = await getMarketId(dolomiteMargin.testing.tokenA);
        const marketIdB = await getMarketId(dolomiteMargin.testing.tokenB);

        let result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        const uniswapV2Pair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await uniswapV2Pair.methods.getReservesPar().call(),
        );

        await swapExactTokensForTokens(owner1, parA.div(100));

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        const pair = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId1)
          .call();
        expect(reserves._reserve1).toEqual(balance1.value);
        expect(balance1.sign).toEqual(true);
      });

      it('should work for normal case with a path of more than 2 tokens', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString() };
        const marketIdA = await getMarketId(dolomiteMargin.testing.tokenA);
        const marketIdB = await getMarketId(dolomiteMargin.testing.tokenB);
        const marketIdC = await getMarketId(dolomiteMargin.testing.tokenC);

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        await addLiquidity(
          owner1,
          parB.div(10),
          parC.div(10),
          dolomiteMargin.testing.tokenB.getAddress(),
          dolomiteMargin.testing.tokenC.getAddress(),
        );

        const uniswapV2Pair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await uniswapV2Pair.methods.getReservesPar().call(),
        );

        await swapExactTokensForTokens(owner1, parA.div(100), [
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
          dolomiteMargin.testing.tokenC.getAddress(),
        ]);

        await swapExactTokensForTokens(owner1, parA.div(100), [
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
          dolomiteMargin.testing.tokenC.getAddress(),
        ]);

        let result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdC)
          .call();
        console.log('account marketIdC wei after ', result.toString());

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdC)
          .call();
        console.log('account marketIdC wei after ', result.toString());

        const pair_ab = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const reserves_ab = await pair_ab.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves_ab);

        const marketId0_ab = await pair_ab.methods.marketId0().call();
        const balance0_ab = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId0_ab)
          .call();
        expect(reserves_ab._reserve0).toEqual(balance0_ab.value);
        expect(balance0_ab.sign).toEqual(true);

        const marketId1_ab = await pair_ab.methods.marketId1().call();
        const balance1_ab = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId1_ab)
          .call();
        expect(reserves_ab._reserve1).toEqual(balance1_ab.value);
        expect(balance1_ab.sign).toEqual(true);

        const pair_bc = dolomiteMargin.contracts.getDolomiteAmmPair(token_bc);
        const reserves_bc = await pair_bc.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves_bc);

        const marketId0_bc = await pair_bc.methods.marketId0().call();
        const balance0_bc = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_bc_account, marketId0_bc)
          .call();
        expect(reserves_bc._reserve0).toEqual(balance0_bc.value);
        expect(balance0_bc.sign).toEqual(true);

        const marketId1_bc = await pair_bc.methods.marketId1().call();
        const balance1_bc = await dolomiteMargin.contracts.dolomiteMargin.methods
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
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
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
        const marketIdA = await getMarketId(dolomiteMargin.testing.tokenA);
        const marketIdB = await getMarketId(dolomiteMargin.testing.tokenB);

        let result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          dolomiteMargin.testing.tokenA.getAddress(),
          dolomiteMargin.testing.tokenB.getAddress(),
        );

        const dolomiteAmmPair = await getDolomiteLpToken();
        console.log(
          'reserves par ',
          await dolomiteAmmPair.methods.getReservesPar().call(),
        );

        const accountNumber = INTEGERS.ONE;
        const expiryTimeDelta = new BigNumber('3600');
        const txResult = await dolomiteMargin.dolomiteAmmRouterProxy.swapExactTokensForTokensAndModifyPosition(
          accountNumber,
          parA.div(100),
          INTEGERS.ONE,
          [dolomiteMargin.testing.tokenA.getAddress(), dolomiteMargin.testing.tokenB.getAddress()],
          dolomiteMargin.testing.tokenB.getAddress(),
          true,
          parB.div(10),
          expiryTimeDelta,
          defaultDeadline,
          { from: owner1 },
        );

        console.log(
          '#swapExactTokensForTokensAndModifyPosition gas used  ',
          txResult.gasUsed.toString(),
        );

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdA)
          .call();
        console.log('account marketIdA wei after ', result.toString());

        result = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(account, marketIdB)
          .call();
        console.log('account marketIdB wei after ', result.toString());

        const pair = dolomiteMargin.contracts.getDolomiteAmmPair(token_ab);
        const reserves = await pair.methods.getReservesWei().call();
        console.log('reserves wei after ', reserves);

        const marketId0 = await pair.methods.marketId0().call();
        const balance0 = await dolomiteMargin.contracts.dolomiteMargin.methods
          .getAccountWei(token_ab_account, marketId0)
          .call();
        expect(reserves._reserve0).toEqual(balance0.value);
        expect(balance0.sign).toEqual(true);

        const marketId1 = await pair.methods.marketId1().call();
        const balance1 = await dolomiteMargin.contracts.dolomiteMargin.methods
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
    .catch((reason) => {
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
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.removeLiquidity(
    walletAddress,
    INTEGERS.ZERO,
    dolomiteMargin.testing.tokenA.getAddress(),
    dolomiteMargin.testing.tokenB.getAddress(),
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
  path: string[] = [
    dolomiteMargin.testing.tokenA.getAddress(),
    dolomiteMargin.testing.tokenB.getAddress(),
  ],
) {
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    amountIn,
    INTEGERS.ONE,
    path,
    defaultDeadline,
    { from: walletAddress },
  );

  console.log(
    `'#swapExactTokensForTokens gas used ${path.length}-path '`,
    result.gasUsed.toString(),
  );

  return result;
}

async function swapTokensForExactTokens(
  walletAddress: address,
  amountOut: BigNumber,
  path: string[] = [
    dolomiteMargin.testing.tokenA.getAddress(),
    dolomiteMargin.testing.tokenB.getAddress(),
  ],
) {
  const result = await dolomiteMargin.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    INTEGERS.ONE,
    amountOut,
    path,
    defaultDeadline,
    { from: walletAddress },
  );

  console.log(
    '#swapExactTokensForTokens gas used  ',
    result.gasUsed.toString(),
  );

  return result;
}

async function getMarketId(token: TestToken) {
  return dolomiteMargin.contracts.dolomiteMargin.methods
    .getMarketIdByTokenAddress(token.getAddress())
    .call();
}

async function setUpBasicBalances() {
  const marketA = new BigNumber(await getMarketId(dolomiteMargin.testing.tokenA));
  const marketB = new BigNumber(await getMarketId(dolomiteMargin.testing.tokenB));

  return Promise.all([
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
    dolomiteMargin.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
  ]);
}

async function deployUniswapLpTokens() {
  await dolomiteMargin.contracts.callContractFunction(
    dolomiteMargin.contracts.dolomiteAmmFactory.methods.createPair(
      dolomiteMargin.testing.tokenA.getAddress(),
      dolomiteMargin.testing.tokenB.getAddress(),
    ),
  );
  await dolomiteMargin.contracts.callContractFunction(
    dolomiteMargin.contracts.dolomiteAmmFactory.methods.createPair(
      dolomiteMargin.testing.tokenB.getAddress(),
      dolomiteMargin.testing.tokenC.getAddress(),
    ),
  );
}

async function getUniswapLpTokenAddress(
  tokenA: address = dolomiteMargin.testing.tokenA.getAddress(),
  tokenB: address = dolomiteMargin.testing.tokenB.getAddress(),
): Promise<string> {
  return dolomiteMargin.contracts.dolomiteAmmFactory.methods
    .getPair(tokenA, tokenB)
    .call();
}

async function getDolomiteLpToken(): Promise<DolomiteAmmPair> {
  return dolomiteMargin.contracts.getDolomiteAmmPair(await getUniswapLpTokenAddress());
}
