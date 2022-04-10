import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';
import { expectThrow } from '../src/lib/Expect';
import { address, AmountDenomination, AmountReference, INTEGERS } from '../src';

let owner: address;
let admin: address;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
const accountOne = new BigNumber(111);
const accountTwo = new BigNumber(222);
const market = INTEGERS.ZERO;
const amount = new BigNumber(100);

describe('MaxWei', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    owner = dolomiteMargin.getDefaultAccount();

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    await Promise.all([
      dolomiteMargin.testing.setAccountBalance(
        owner,
        accountOne,
        market,
        amount.times(2),
      ),
      dolomiteMargin.testing.setAccountBalance(
        owner,
        accountTwo,
        market,
        amount.times(2),
      ),
      dolomiteMargin.testing.tokenA.issueTo(
        amount.times('10'),
        dolomiteMargin.contracts.dolomiteMargin.options.address,
      ),
      dolomiteMargin.testing.tokenA.issueTo(
        amount.times('10'),
        owner,
      ),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(owner),
    ]);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds for withdraw when under max wei', async () => {
    await dolomiteMargin.admin.setMaxWei(market, amount.times('4'), { from: admin });

    await dolomiteMargin.operation
      .initiate()
      .withdraw({
        primaryAccountOwner: owner,
        primaryAccountId: accountOne,
        marketId: market,
        to: owner,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();
  });

  it('Succeeds for withdraw when over max wei', async () => {
    await dolomiteMargin.admin.setMaxWei(market, amount.times('0.01'), { from: admin });

    await dolomiteMargin.operation
      .initiate()
      .withdraw({
        primaryAccountOwner: owner,
        primaryAccountId: accountOne,
        marketId: market,
        to: owner,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();
  });

  it('Succeeds for deposit when under max wei', async () => {
    await dolomiteMargin.admin.setMaxWei(market, amount.times('5'), { from: admin });

    await dolomiteMargin.operation
      .initiate()
      .deposit({
        primaryAccountOwner: owner,
        primaryAccountId: accountOne,
        marketId: market,
        from: owner,
        amount: {
          value: amount.times(1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit();
  });

  it('Fails for deposit when currently over max wei', async () => {
    await dolomiteMargin.admin.setMaxWei(market, amount.times('2'), { from: admin });

    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner,
          primaryAccountId: accountTwo,
          marketId: market,
          from: owner,
          amount: {
            value: amount.times(1),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
        })
        .commit(),
      `OperationImpl: Total supply exceeds max supply <${market.toFixed(0)}>`,
    );
  });

  it('Fails for deposit that pushes over max wei', async () => {
    await dolomiteMargin.admin.setMaxWei(market, amount.times('5'), { from: admin });

    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner,
          primaryAccountId: accountTwo,
          marketId: market,
          from: owner,
          amount: {
            value: amount.times(2),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
        })
        .commit(),
      `OperationImpl: Total supply exceeds max supply <${market.toFixed(0)}>`,
    );
  });
});
