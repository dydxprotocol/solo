import BigNumber from 'bignumber.js';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { fastForward, resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';
import { expectThrow } from '../src/lib/Expect';
import { ADDRESSES, INTEGERS } from '../src/lib/Constants';
import {
  ActionArgs,
  ActionType,
  address,
  AmountDenomination,
  AmountReference,
} from '../src';

let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let owner1: address;
let account1: any;
const accountNumber1 = new BigNumber(11);
const market1 = new BigNumber(1);
const market2 = new BigNumber(2);
const wei = new BigNumber(150);
const zero = new BigNumber(0);
const zeroAction: ActionArgs = {
  amount: {
    sign: false,
    denomination: AmountDenomination.Actual,
    ref: AmountReference.Delta,
    value: '0',
  },
  accountId: '0',
  actionType: ActionType.Deposit,
  primaryMarketId: '0',
  secondaryMarketId: '0',
  otherAddress: ADDRESSES.ZERO,
  otherAccountId: '0',
  data: [],
};

describe('Invalid', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    owner1 = accounts[2];
    account1 = {
      owner: owner1,
      number: accountNumber1.toFixed(0),
    };
    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Fails for invalid denomination', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(wei, owner1),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(owner1),
    ]);
    const invalidDenomination = 2;
    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market1,
          amount: {
            value: wei,
            denomination: invalidDenomination,
            reference: AmountReference.Delta,
          },
          from: owner1,
        })
        .commit({ from: owner1 }),
    );
  });

  it('Fails for invalid reference', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(wei, owner1),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(owner1),
    ]);
    const invalidReference = 2;
    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market1,
          amount: {
            value: wei,
            denomination: AmountDenomination.Actual,
            reference: invalidReference,
          },
          from: owner1,
        })
        .commit({ from: owner1 }),
    );
  });

  it('Fails for invalid action type', async () => {
    const invalidActionType = 9;
    const action = {
      ...zeroAction,
      actionType: invalidActionType,
    };
    await expectThrow(operate([account1], [action]));
  });

  it('Fails for zero actions and zero accounts', async () => {
    await expectThrow(
      operate([], []),
      'OperationImpl: Cannot have zero accounts',
    );
  });

  it('Fails for zero actions', async () => {
    await expectThrow(
      operate([account1], []),
      'OperationImpl: Cannot have zero actions',
    );
  });

  it('Fails for zero accounts', async () => {
    await expectThrow(
      operate([], [zeroAction]),
      'OperationImpl: Cannot have zero accounts',
    );
  });

  it('Fails for actions that use OOB account', async () => {
    const action = {
      ...zeroAction,
      accountId: '1',
    };
    await expectThrow(
      operate([account1, account1], [action]),
      'OperationImpl: Cannot duplicate accounts',
    );
  });

  it('Fails for duplicate accounts', async () => {
    await expectThrow(
      operate([account1, account1], [zeroAction]),
      'OperationImpl: Cannot duplicate accounts',
    );
  });

  it('Fails for zero price', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenA.issueTo(wei, owner1),
      dolomiteMargin.testing.tokenA.setMaximumDolomiteMarginAllowance(owner1),
      dolomiteMargin.testing.priceOracle.setPrice(dolomiteMargin.testing.tokenA.address, zero),
    ]);
    await expectThrow(
      operate([account1], [zeroAction]),
      'Storage: Price cannot be zero',
    );
  });

  it('Fails for time past max uint32', async () => {
    await fastForward(4294967296); // 2^32
    await expectThrow(
      operate([account1], [zeroAction]),
      'Math: Unsafe cast to uint32',
    );
  });

  it('Fails for borrow amount less than the minimum', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenB.issueTo(wei.times(2), owner1),
      dolomiteMargin.testing.tokenB.setMaximumDolomiteMarginAllowance(owner1),
      dolomiteMargin.testing.tokenC.issueTo(
        wei,
        dolomiteMargin.address,
      ),
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.testing.tokenB.address,
        INTEGERS.ONE,
      ),
      dolomiteMargin.testing.priceOracle.setPrice(
        dolomiteMargin.testing.tokenC.address,
        INTEGERS.ONE,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market1,
          amount: {
            value: wei.times(2),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
          from: owner1,
        })
        .withdraw({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market2,
          amount: {
            value: wei.times(-1),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
          to: owner1,
        })
        .commit({ from: owner1 }),
      'Storage: Borrow value too low',
    );
  });

  it('Fails for undercollateralized account', async () => {
    await Promise.all([
      dolomiteMargin.testing.tokenB.issueTo(wei, owner1),
      dolomiteMargin.testing.tokenB.setMaximumDolomiteMarginAllowance(owner1),
      dolomiteMargin.testing.tokenC.issueTo(
        wei,
        dolomiteMargin.address,
      ),
    ]);
    await expectThrow(
      dolomiteMargin.operation
        .initiate()
        .deposit({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market1,
          amount: {
            value: wei,
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
          from: owner1,
        })
        .withdraw({
          primaryAccountOwner: owner1,
          primaryAccountId: accountNumber1,
          marketId: market2,
          amount: {
            value: wei.times(-1),
            denomination: AmountDenomination.Actual,
            reference: AmountReference.Delta,
          },
          to: owner1,
        })
        .commit({ from: owner1 }),
      'OperationImpl: Undercollateralized account',
    );
  });
});

// ============ Helper Functions ============

async function operate(accounts: any[], actions: any[]) {
  return dolomiteMargin.contracts.callContractFunction(
    dolomiteMargin.contracts.dolomiteMargin.methods.operate(accounts, actions),
  );
}
