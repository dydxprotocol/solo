import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { address } from '../../src/types';

let solo: Solo;
let accounts: address[];
let snapshotId: string;

describe('SignedOperationProxy', () => {

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    await resetEVM();
    await setupMarkets(solo, accounts);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('TODO', () => {
    it('TODO', async () => {
      // TODO
    });

    // TODO
  });

  // TODO
});

// ============ Helper Functions ============
