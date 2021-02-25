/* eslint-disable */
import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { mineAvgBlock, resetEVM, snapshot, } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { address } from '../../src';
import { TestToken } from '../modules/TestToken';
import { UniswapV2Pair } from '../../build/wrappers/UniswapV2Pair';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
// @ts-ignore
let owner2: address;

const zero = new BigNumber(0);
const parA = new BigNumber('1000000000000000000');
const parB = new BigNumber('2000000');
const parC = new BigNumber('300000000000000000000');
const prices = [
  new BigNumber('1e20'),
  new BigNumber('1e18'),
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
                        solo.testing.priceOracle.setPrice(solo.testing.tokenA.getAddress(), prices[0]),
                        solo.testing.priceOracle.setPrice(solo.testing.tokenB.getAddress(), prices[1]),
                        solo.testing.priceOracle.setPrice(solo.testing.tokenC.getAddress(), prices[2]),
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
    await mineAvgBlock();

    snapshotId = await snapshot();
  });

  afterEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#addLiquidity', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString(), };
        const marketIdA = await getMarketId(solo.testing.tokenA);

        let result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('before account wei ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('after account wei ', result.toString());

        console.log('reserves wei after ', (await (await getUniswapLpToken()).methods.getReservesWei().call()));
      });
    });

    describe('Failure cases', () => {

    });
  });

  describe('#removeLiquidity', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString(), };
        const marketIdA = await getMarketId(solo.testing.tokenA);

        let result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA,
          parB,
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const lpToken = await getUniswapLpToken();
        const liquidity = new BigNumber(await lpToken.methods.balanceOf(owner1).call());

        await solo.contracts.callContractFunction(
          lpToken.methods.approve(solo.contracts.dolomiteAmmRouterProxy.options.address, INTEGERS.ONES_255.toFixed(0)),
          { from: owner1, },
        );

        await removeLiquidity(
          owner1,
          liquidity,
        );

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('account wei after ', result.toString());

        console.log('reserves wei after ', (await (await getUniswapLpToken()).methods.getReservesWei().call()));
      });
    });

    describe('Failure cases', () => {

    });
  });

  describe('#swapExactTokensForTokens', () => {
    describe('Success cases', () => {
      it('should work for normal case', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString(), };
        const marketIdA = await getMarketId(solo.testing.tokenA);
        const marketIdB = await getMarketId(solo.testing.tokenB);

        let result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('account wei before ', result.toString());

        await addLiquidity(
          owner1,
          parA.div(10),
          parB.div(10),
          solo.testing.tokenA.getAddress(),
          solo.testing.tokenB.getAddress(),
        );

        const uniswapV2Pair = await getUniswapLpToken();
        console.log('reserves par ', (await uniswapV2Pair.methods.getReservesPar().call()));

        await swapExactTokensForTokens(
          owner1,
          parA.div(100),
        );

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('account marketIdA wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdB).call();
        console.log('account marketIdB wei after ', result.toString());

        console.log('reserves wei after ', (await (await getUniswapLpToken()).methods.getReservesWei().call()));
      });

      it('should work for normal case with a path of more than 2 tokens', async () => {
        const account = { owner: owner1, number: INTEGERS.ZERO.toString(), };
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

        const uniswapV2Pair = await getUniswapLpToken();
        console.log('reserves par ', (await uniswapV2Pair.methods.getReservesPar().call()));

        await swapExactTokensForTokens(
          owner1,
          parA.div(100),
          [solo.testing.tokenA.getAddress(), solo.testing.tokenB.getAddress(), solo.testing.tokenC.getAddress()],
        );

        let result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdA).call();
        console.log('account marketIdA wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdB).call();
        console.log('account marketIdB wei after ', result.toString());

        result = await solo.contracts.soloMargin.methods.getAccountWei(account, marketIdC).call();
        console.log('account marketIdC wei after ', result.toString());

      });
    });

    describe('Failure cases', () => {

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
  const result = await solo.dolomiteAmmRouterProxy.addLiquidity(
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
  );

  console.log('#addLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function removeLiquidity(
  walletAddress: address,
  liquidity: BigNumber,
) {
  const result = await solo.dolomiteAmmRouterProxy.removeLiquidity(
    walletAddress,
    INTEGERS.ZERO,
    solo.testing.tokenA.getAddress(),
    solo.testing.tokenB.getAddress(),
    liquidity,
    INTEGERS.ZERO,
    INTEGERS.ZERO,
    new BigNumber('123456789123'),
    { from: walletAddress },
  );

  console.log('#removeLiquidity gas used  ', result.gasUsed.toString());

  return result;
}

async function swapExactTokensForTokens(
  walletAddress: address,
  amountIn: BigNumber,
  path: string[] = [solo.testing.tokenA.getAddress(), solo.testing.tokenB.getAddress()],
) {
  const result = await solo.dolomiteAmmRouterProxy.swapExactTokensForTokens(
    INTEGERS.ZERO,
    amountIn,
    INTEGERS.ONE,
    path,
    new BigNumber('123456789123'),
    { from: walletAddress },
  );

  console.log('#swapExactTokensForTokens gas used  ', result.gasUsed.toString());

  return result;
}

async function getMarketId(token: TestToken) {
  return solo.contracts.soloMargin.methods.getMarketIdByTokenAddress(token.getAddress()).call();
}

async function setUpBasicBalances() {
  const marketA = new BigNumber((await getMarketId(solo.testing.tokenA)));
  const marketB = new BigNumber((await getMarketId(solo.testing.tokenB)));

  return Promise.all([
                       solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketA, parA),
                       solo.testing.setAccountBalance(owner1, INTEGERS.ZERO, marketB, parB),
                     ]);
}

async function deployUniswapLpTokens() {
  await solo.contracts.callContractFunction(
    solo.contracts.uniswapV2Factory.methods.createPair(
      solo.testing.tokenA.getAddress(),
      solo.testing.tokenB.getAddress(),
    )
  );
  await solo.contracts.callContractFunction(
    solo.contracts.uniswapV2Factory.methods.createPair(
      solo.testing.tokenB.getAddress(),
      solo.testing.tokenC.getAddress(),
    )
  );
}

async function getUniswapLpTokenAddress(
  tokenA: address = solo.testing.tokenA.getAddress(),
  tokenB: address = solo.testing.tokenB.getAddress(),
): Promise<string> {
  return solo.contracts.uniswapV2Factory.methods.getPair(tokenA, tokenB).call();
}

async function getUniswapLpToken(): Promise<UniswapV2Pair> {
  return solo.contracts.getUniswapV2Pair(await getUniswapLpTokenAddress());
}
