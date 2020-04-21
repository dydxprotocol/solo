import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { INTEGERS } from '../src/lib/Constants';
import { expectThrow } from '../src/lib/Expect';
import {
  address,
  AmountDenomination,
  AmountReference,
} from '../src/types';

let owner: address;
let admin: address;
let solo: TestSolo;
let accounts: address[];
const accountOne = new BigNumber(111);
const accountTwo = new BigNumber(222);
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const zero = new BigNumber(0);
const amount = new BigNumber(100);

describe('Closing', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner = solo.getDefaultAccount();

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.admin.setIsClosing(market, true, { from: admin }),
      solo.testing.setAccountBalance(owner, accountOne, market, amount),
      solo.testing.setAccountBalance(owner, accountOne, collateralMarket, amount.times(2)),
      solo.testing.setAccountBalance(owner, accountTwo, collateralMarket, amount.times(2)),
      solo.testing.tokenA.issueTo(amount, solo.contracts.soloMargin.options.address),
      solo.testing.tokenA.setMaximumSoloAllowance(owner),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds for withdraw when closing', async () => {
    await solo.operation.initiate()
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

  it('Succeeds for borrow if totalPar doesnt increase', async () => {
    await solo.operation.initiate()
    .transfer({
      primaryAccountOwner: owner,
      primaryAccountId: accountOne,
      toAccountOwner: owner,
      toAccountId: accountTwo,
      marketId: market,
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Target,
      },
    })
    .commit();
  });

  it('Fails for borrowing when closing', async () => {
    await expectThrow(
      solo.operation.initiate()
      .withdraw({
        primaryAccountOwner: owner,
        primaryAccountId: accountTwo,
        marketId: market,
        to: owner,
        amount: {
          value: amount.times(-1),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      })
      .commit(),
      'OperationImpl: Market is closing',
    );
  });
});
