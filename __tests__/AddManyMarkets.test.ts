import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';
import { address, AmountDenomination, AmountReference, Integer, INTEGERS } from '../src';
import { TestToken } from '../build/testing_wrappers/TestToken';
import { abi as TestTokenAbi, bytecode as TestTokenBytecode } from '../build/contracts/TestToken.json';
import { expectThrow } from '../src/lib/Expect';

let user: address;
let admin: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const accountOne = new BigNumber(111);
const accountTwo = new BigNumber(222);
const amount = new BigNumber(100);

describe('AddManyMarkets', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    user = dolomiteMargin.getDefaultAccount();

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(amount, user),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(user),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('should work for many markets without crazy gas prices', async () => {
    console.log('\tNumber of markets before:', (await dolomiteMargin.getters.getNumMarkets()).toFixed());

    const tokens: address[] = [];
    const marketIds: Integer[] = [];

    const numberOfMarkets = 512;
    for (let i = 0; i < numberOfMarkets; i += 1) {
      const priceOracle = dolomiteMargin.testing.priceOracle.address;
      const interestSetter = dolomiteMargin.testing.interestSetter.address;
      const price = new BigNumber('1e40'); // large to prevent hitting minBorrowValue check
      const marginPremium = new BigNumber(0);
      const spreadPremium = new BigNumber(0);
      const maxWei = new BigNumber(0);
      const isClosing = false;
      const isRecyclable = false;

      const testTokenContract = new dolomiteMargin.web3.eth.Contract(TestTokenAbi) as TestToken;
      const testToken = (await testTokenContract
        .deploy({
          data: TestTokenBytecode,
          arguments: [],
        })
        .send({ from: admin, gas: 6000000 })) as TestToken;
      tokens[i] = testToken.options.address;

      await dolomiteMargin.testing.priceOracle.setPrice(tokens[i], price);
      const txResult = await dolomiteMargin.admin.addMarket(
        tokens[i],
        priceOracle,
        interestSetter,
        marginPremium,
        spreadPremium,
        maxWei,
        isClosing,
        isRecyclable,
        { from: admin },
      );
      if (i === numberOfMarkets - 1) {
        console.log('\tAdd market gas cost for last market:', txResult.gasUsed);
      }
      marketIds[i] = await dolomiteMargin.getters.getMarketIdByTokenAddress(tokens[i]);
    }
    console.log('\tNumber of markets after:', (await dolomiteMargin.getters.getNumMarkets()).toFixed());

    await performDeposit(accountOne, 0, tokens, marketIds, true);
    await performDeposit(accountOne, 99, tokens, marketIds, true);
    await performDeposit(accountOne, 199, tokens, marketIds, true);
    await performDeposit(accountOne, 299, tokens, marketIds, true);
    await performDeposit(accountOne, 399, tokens, marketIds, true);
    await performDeposit(accountOne, 499, tokens, marketIds, true);

    let gasUsed = 0;
    const numberOfDeposits = 32;
    for (let i = 0; i < numberOfDeposits; i += 1) {
      gasUsed += await performDeposit(accountTwo, i * 2, tokens, marketIds, i > numberOfDeposits - 6);
    }
    console.log(`\tAveraged gas used for deposit into account ${accountTwo.toFixed()}:`, gasUsed / numberOfDeposits);

    const numberOfMarketsWithBalances = await dolomiteMargin.getters.getAccountNumberOfMarketsWithBalances(
      user,
      accountTwo,
    );
    expect(numberOfMarketsWithBalances).toEqual(new BigNumber(numberOfDeposits));

    // The 33rd one should throw
    await expectThrow(
      performDeposit(accountTwo, 100, tokens, marketIds),
      `OperationImpl: Too many non-zero balances <${user.toLowerCase()}, ${accountTwo.toFixed()}>`,
    );
  });

  const performDeposit = async (
    primaryAccountId: Integer,
    index: number,
    tokens: address[],
    marketIds: Integer[],
    shouldLogGasUsage: boolean = false,
  ) => {
    const testTokenContract = new dolomiteMargin.web3.eth.Contract(TestTokenAbi, tokens[index]) as TestToken;
    await testTokenContract.methods.issueTo(user, amount.toFixed(0)).send({ from: user });
    await testTokenContract.methods.approve(dolomiteMargin.address, INTEGERS.ONES_255.toFixed(0)).send({ from: user });
    const txResult = await dolomiteMargin.operation
      .initiate()
      .deposit({
        primaryAccountId,
        primaryAccountOwner: user,
        marketId: marketIds[index],
        amount: {
          denomination: AmountDenomination.Wei,
          reference: AmountReference.Delta,
          value: amount,
        },
        from: user,
      })
      .commit({ from: user });

    if (shouldLogGasUsage) {
      console.log(`\tGas used for deposit into account ${primaryAccountId.toFixed()}:`, txResult.gasUsed);
    }

    return txResult.gasUsed;
  };
});
