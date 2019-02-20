import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { snapshot, resetEVM } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { expectThrow } from '../src/lib/Expect';
import { ADDRESSES } from '../src/lib/Constants';
import {
  address,
  ActionArgs,
  ActionType,
  AmountDenomination,
  AmountReference,
} from '../src/types';

let solo: Solo;
let accounts: address[];
let owner1: address;
let account1;
const accountNumber1 = new BigNumber(11);
const market1 = new BigNumber(1);
const wei = new BigNumber(150);
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
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    owner1 = accounts[2];
    account1 = {
      owner: owner1,
      number: accountNumber1.toFixed(0),
    };
    await resetEVM();
    await setupMarkets(solo, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Fails for invalid denomination', async () => {
    await Promise.all([
      solo.testing.tokenA.issueTo(wei, owner1),
      solo.testing.tokenA.setMaximumSoloAllowance(owner1),
    ]);
    const invalidDenomination = 2;
    await expectThrow(
      solo.operation.initiate()
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
      .commit(),
    );
  });

  it('Fails for invalid reference', async () => {
    await Promise.all([
      solo.testing.tokenA.issueTo(wei, owner1),
      solo.testing.tokenA.setMaximumSoloAllowance(owner1),
    ]);
    const invalidReference = 2;
    await expectThrow(
      solo.operation.initiate()
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
      .commit(),
    );
  });

  it('Fails for invalid action type', async () => {
    const invalidActionType = 9;
    const action = {
      ...zeroAction,
      actionType: invalidActionType,
    };
    await expectThrow(
      operate([account1], [action]),
    );
  });

  it('Fails for zero actions and zero accounts', async () => {
    await expectThrow(
      operate([], []),
      'OperationImpl: Cannot have zero actions',
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
});

// ============ Helper Functions ============

async function operate(accounts: any[], actions: any[]) {
  return solo.contracts.callContractFunction(
    solo.contracts.soloMargin.methods.operate(accounts, actions),
  );
}
