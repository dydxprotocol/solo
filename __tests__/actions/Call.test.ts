import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { toBytes } from '../../src/lib/BytesHelper';
import { expectThrow } from '../../src/lib/Expect';
import { address, Call } from '../../src/types';

let who: address;
let operator: address;
let solo: Solo;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const accountData = new BigNumber(100);
const senderData = new BigNumber(50);
let defaultGlob: Call;

describe('Call', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    who = solo.getDefaultAccount();
    operator = accounts[5];
    defaultGlob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      callee: solo.testing.callee.getAddress(),
      data: [],
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic call test', async () => {
    const txResult = await expectCallOkay({
      data: toBytes(accountData, senderData),
    });

    await verifyDataIntegrity(who);

    // TODO: expect log

    console.log(`\tCall gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for operator', async () => {
    await solo.permissions.approveOperator(operator, { from: who });
    await expectCallOkay(
      {
        data: toBytes(accountData, senderData),
      },
      { from: operator },
    );
    await verifyDataIntegrity(operator);
  });

  it('Fails for non-operator', async () => {
    await expectCallRevert(
      {
        data: toBytes(accountData, senderData),
      },
      'Storage: Unpermissioned Operator',
      { from: operator },
    );
  });

  it('Fails for non-ICallee contract', async () => {
    await expectCallRevert(
      {
        data: toBytes(accountData, senderData),
        callee: solo.testing.priceOracle.getAddress(),
      },
    );
  });
});

// ============ Helper Functions ============

async function expectCallOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().call(combinedGlob).commit(options);
}

async function expectCallRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectCallOkay(glob, options), reason);
}

async function verifyDataIntegrity(sender: address) {
  const [
    foundAccountData,
    foundSenderData,
  ] = await Promise.all([
    solo.testing.callee.getAccountData(who, accountNumber),
    solo.testing.callee.getSenderData(sender),
  ]);

  expect(foundAccountData).toEqual(accountData.toFixed(0));
  expect(foundSenderData).toEqual(senderData.toFixed(0));
}
