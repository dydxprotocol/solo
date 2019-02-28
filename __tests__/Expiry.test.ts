import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { INTEGERS } from '../src/lib/Constants';
import { expectThrow } from '../src/lib/Expect';
import {
  address,
} from '../src/types';

let solo: Solo;
let accounts: address[];
let snapshotId: string;
let owner: address;

const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const defaultTime = new BigNumber(1552000000);

describe('Expiry', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    owner = solo.getDefaultAccount();
    await resetEVM();
    await setupMarkets(solo, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds in setting expiry', async () => {
    const txResult = await solo.operation.initiate().setExpiry({
      primaryAccountOwner: owner,
      primaryAccountId: accountNumber,
      marketId: market,
      expiryTime: defaultTime,
    }).commit();

    const expiry = await solo.getters.getExpiry(owner, accountNumber, market);
    expect(expiry).toEqual(defaultTime);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(3);

    const expirySetLog = logs[1];
    expect(expirySetLog.name).toEqual('ExpirySet');
    expect(expirySetLog.args.owner).toEqual(owner);
    expect(expirySetLog.args.number).toEqual(accountNumber);
    expect(expirySetLog.args.marketId).toEqual(market);
    expect(expirySetLog.args.time).toEqual(defaultTime);
  });

  it('Fails for non-solo calls', async () => {
    await expectThrow(
      solo.contracts.callContractFunction(
        solo.contracts.expiry.methods.callFunction(
          owner,
          {
            owner,
            number: accountNumber.toFixed(0),
          },
          [],
        ),
      ),
      'OnlySolo: Only Solo can call function',
    );
  });

  // TODO: more tests
});

// ============ Helper Functions ============
