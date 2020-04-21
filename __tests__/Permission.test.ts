import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { address } from '../src/types';

let solo: TestSolo;
let accounts: address[];
let operator1: address;
let operator2: address;
let operator3: address;
let owner: address;

describe('Permission', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;

    await resetEVM();
    await setupMarkets(solo, accounts);

    owner = solo.getDefaultAccount();
    operator1 = accounts[6];
    operator2 = accounts[7];
    operator3 = accounts[8];

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  // ============ Getters for Risk ============

  describe('setOperators', () => {
    it('Succeeds for single approve', async () => {
      await expectOperator(operator1, false);
      const txResult = await solo.permissions.approveOperator(operator1, { from: owner });
      await expectOperator(operator1, true);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogOperatorSet');
      expect(log.args.owner).toEqual(owner);
      expect(log.args.operator).toEqual(operator1);
      expect(log.args.trusted).toEqual(true);
    });

    it('Succeeds for single disapprove', async () => {
      await solo.permissions.approveOperator(operator1, { from: owner });
      await expectOperator(operator1, true);
      const txResult = await solo.permissions.disapproveOperator(operator1, { from: owner });
      await expectOperator(operator1, false);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogOperatorSet');
      expect(log.args.owner).toEqual(owner);
      expect(log.args.operator).toEqual(operator1);
      expect(log.args.trusted).toEqual(false);
    });

    it('Succeeds for multiple approve/disapprove', async () => {
      const txResult = await solo.permissions.setOperators([
        { operator: operator1, trusted: true },
        { operator: operator2, trusted: false },
        { operator: operator3, trusted: true },
      ]);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(3);

      const [log1, log2, log3] = logs;
      expect(log1.name).toEqual('LogOperatorSet');
      expect(log1.args.owner).toEqual(owner);
      expect(log1.args.operator).toEqual(operator1);
      expect(log1.args.trusted).toEqual(true);
      expect(log2.name).toEqual('LogOperatorSet');
      expect(log2.args.owner).toEqual(owner);
      expect(log2.args.operator).toEqual(operator2);
      expect(log2.args.trusted).toEqual(false);
      expect(log3.name).toEqual('LogOperatorSet');
      expect(log3.args.owner).toEqual(owner);
      expect(log3.args.operator).toEqual(operator3);
      expect(log3.args.trusted).toEqual(true);

      await Promise.all([
        expectOperator(operator1, true),
        expectOperator(operator2, false),
        expectOperator(operator3, true),
      ]);
    });

    it('Succeeds for multiple repeated approve/disapprove', async () => {
      const txResult = await solo.permissions.setOperators([
        { operator: operator1, trusted: true },
        { operator: operator1, trusted: false },
        { operator: operator2, trusted: true },
        { operator: operator2, trusted: true },
      ]);

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(4);

      const [log1, log2, log3, log4] = logs;
      expect(log1.name).toEqual('LogOperatorSet');
      expect(log1.args.owner).toEqual(owner);
      expect(log1.args.operator).toEqual(operator1);
      expect(log1.args.trusted).toEqual(true);
      expect(log2.name).toEqual('LogOperatorSet');
      expect(log2.args.owner).toEqual(owner);
      expect(log2.args.operator).toEqual(operator1);
      expect(log2.args.trusted).toEqual(false);
      expect(log3.name).toEqual('LogOperatorSet');
      expect(log3.args.owner).toEqual(owner);
      expect(log3.args.operator).toEqual(operator2);
      expect(log3.args.trusted).toEqual(true);
      expect(log4.name).toEqual('LogOperatorSet');
      expect(log4.args.owner).toEqual(owner);
      expect(log4.args.operator).toEqual(operator2);
      expect(log4.args.trusted).toEqual(true);

      await Promise.all([
        expectOperator(operator1, false),
        expectOperator(operator2, true),
      ]);
    });

    it('Skips logs when necessary', async () => {
      const txResult = await solo.permissions.approveOperator(operator1, { from: owner });
      const logs = solo.logs.parseLogs(txResult, { skipPermissionLogs: true });
      expect(logs.length).toEqual(0);
    });
  });
});

async function expectOperator(operator:address, b: boolean) {
  const result = await solo.getters.getIsLocalOperator(owner, operator);
  expect(result).toEqual(b);
}
