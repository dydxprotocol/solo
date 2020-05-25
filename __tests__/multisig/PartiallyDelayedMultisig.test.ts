import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { deployContract } from '../helpers/Deploy';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot, fastForward } from '../helpers/EVM';
import { ADDRESSES } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { address } from '../../src/types';
import MultiSigJson from '../../build/contracts/PartiallyDelayedMultiSig.json';
import TestCounterJson from '../../build/contracts/TestCounter.json';

let multiSig: any;
let testCounterA: any;
let testCounterB: any;
let solo: TestSolo;
let accounts: address[];
let owner1: address;
let owner2: address;
let owner3: address;
let rando: address;
let counterAAddress: address;
let counterBAddress: address;
const functionOneSelector = '0x181b3bb3';
const functionTwoSelector = '0x935272a2';
const functionThreeSelector = '0x8e0137b9';
const fallbackSelector = '0x00000000';

describe('PartiallyDelayedMultiSig', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    owner1 = accounts[1];
    owner2 = accounts[2];
    owner3 = accounts[3];
    rando = accounts[4];

    await resetEVM();

    // deploy contracts
    [testCounterA, testCounterB] = await Promise.all([
      deployContract(solo, TestCounterJson),
      deployContract(solo, TestCounterJson),
    ]);
    counterAAddress = testCounterA.options.address;
    counterBAddress = testCounterB.options.address;
    multiSig = await deployContract(
      solo,
      MultiSigJson,
      [
        [owner1, owner2, owner3],
        '2',
        '120',
        [counterAAddress, ADDRESSES.ZERO, counterBAddress],
        [functionOneSelector, functionTwoSelector, fallbackSelector],
      ],
    );

    // synchronously submit all transaction from owner1
    await submitTransaction(counterAAddress, functionOneData());
    await submitTransaction(counterBAddress, functionOneData());
    await submitTransaction(counterAAddress, numberToFunctionTwoData(1));
    await submitTransaction(counterBAddress, numberToFunctionTwoData(1));
    await submitTransaction(counterAAddress, numbersToFunctionThreeData(2, 3));
    await submitTransaction(counterBAddress, numbersToFunctionThreeData(2, 3));
    await submitTransaction(counterAAddress, []);
    await submitTransaction(counterBAddress, []);
    await submitTransaction(counterAAddress, [[0]]);

    // approve all transactions from owner2
    await Promise.all([
      confirmTransaction(0),
      confirmTransaction(1),
      confirmTransaction(2),
      confirmTransaction(3),
      confirmTransaction(4),
      confirmTransaction(5),
      confirmTransaction(6),
      confirmTransaction(7),
      confirmTransaction(8),
    ]);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#constructor', () => {
    it('Succeeds', async () => {
      const owners = await solo.contracts.call(
        multiSig.methods.getOwners(),
      );
      expect(owners).toEqual([owner1, owner2, owner3]);

      const required = await solo.contracts.call(
        multiSig.methods.required(),
      );
      expect(required).toEqual('2');

      const secondsTimeLocked = await solo.contracts.call(
        multiSig.methods.secondsTimeLocked(),
      );
      expect(secondsTimeLocked).toEqual('120');

      await Promise.all([
        expectInstantData(counterAAddress, functionOneSelector, true),
        expectInstantData(counterBAddress, functionOneSelector, false),
        expectInstantData(ADDRESSES.ZERO, functionOneSelector, false),
        expectInstantData(counterAAddress, functionTwoSelector, false),
        expectInstantData(counterBAddress, functionTwoSelector, false),
        expectInstantData(ADDRESSES.ZERO, functionTwoSelector, true),
        expectInstantData(counterAAddress, functionThreeSelector, false),
        expectInstantData(counterBAddress, functionThreeSelector, false),
        expectInstantData(ADDRESSES.ZERO, functionThreeSelector, false),
        expectInstantData(counterAAddress, fallbackSelector, false),
        expectInstantData(counterBAddress, fallbackSelector, true),
        expectInstantData(ADDRESSES.ZERO, fallbackSelector, false),
      ]);
    });

    it('Fails for array mismatch', async () => {
      await expectThrow(
        deployContract(
          solo,
          MultiSigJson,
          [
            [owner1, owner2, owner3],
            '2',
            '120',
            [counterAAddress, ADDRESSES.ZERO, counterBAddress],
            [functionOneSelector, functionTwoSelector],
          ],
        ),
        'ADDRESS_AND_SELECTOR_MISMATCH',
      );
    });
  });

  describe('#setSelector', () => {
    it('Succeeds for false', async () => {
      await expectInstantData(counterAAddress, functionOneSelector, true);
      await submitTransaction(
        multiSig.options.address,
        setSelectorData(counterAAddress, functionOneSelector, false),
      );
      await confirmTransaction(9);
      await fastForward(120);
      await executeTransaction(9);
      await expectInstantData(counterAAddress, functionOneSelector, false);
    });

    it('Succeeds for true', async () => {
      await expectInstantData(counterBAddress, functionThreeSelector, false);
      await submitTransaction(
        multiSig.options.address,
        setSelectorData(counterBAddress, functionThreeSelector, true),
      );
      await confirmTransaction(9);
      await fastForward(120);
      await executeTransaction(9);
      await expectInstantData(counterBAddress, functionThreeSelector, true);
    });

    it('Fails for external sender', async () => {
      await expectThrow(
        solo.contracts.send(
          multiSig.methods.setSelector(
            ADDRESSES.ZERO,
            '0x00000000',
            true,
          ),
        ),
      );
    });
  });

  describe('#executeTransaction (slow)', () => {
    it('Fails for before timelock', async () => {
      await expectThrow(
        executeTransaction(5),
        'TIME_LOCK_INCOMPLETE',
      );
    });

    it('Succeeds for past timelock', async () => {
      await fastForward(120);
      await executeTransaction(5);
    });
  });

  describe('#executeTransaction (fast, specific)', () => {
    it('Succeeds for specific address', async () => {
      await executeTransaction(0);
    });

    it('Fails for other addresses', async () => {
      await expectThrow(
        executeTransaction(1),
        'TIME_LOCK_INCOMPLETE',
      );
    });
  });

  describe('#executeTransaction (fast, all)', () => {
    it('Succeeds', async () => {
      await executeTransaction(3);
    });

    it('Fails for rando', async () => {
      await expectThrow(
        executeTransaction(3, rando),
      );
    });
  });

  describe('#executeTransaction (fallback)', () => {
    it('Succeeds for specific address', async () => {
      await executeTransaction(7);
    });

    it('Fails for other addresses', async () => {
      await expectThrow(
        executeTransaction(6),
        'TIME_LOCK_INCOMPLETE',
      );
    });
  });

  describe('#executeTransaction (short data)', () => {
    it('Fails', async () => {
      await expectThrow(
        executeTransaction(8),
        'TIME_LOCK_INCOMPLETE',
      );
    });
  });
});

// ============ Helper Functions ============

async function submitTransaction(destination: address, data: number[][]) {
  return solo.contracts.send(
    multiSig.methods.submitTransaction(
      destination,
      '0', // value
      data,
    ),
    { from: owner1 },
  );
}

async function confirmTransaction(n: number) {
  return solo.contracts.send(
    multiSig.methods.confirmTransaction(n.toString()),
    { from: owner2 },
  );
}

function setSelectorData(destination: address, selector: string, approved: boolean) {
  const data = multiSig.methods.setSelector(destination, selector, approved).encodeABI();
  return hexToBytes(data);
}

function functionOneData() {
  const data = testCounterA.methods.functionOne().encodeABI();
  return hexToBytes(data);
}

function numberToFunctionTwoData(n: number) {
  const data = testCounterA.methods.functionTwo(n.toString()).encodeABI();
  return hexToBytes(data);
}

function numbersToFunctionThreeData(n1: number, n2: number) {
  const data = testCounterA.methods.functionThree(n1.toString(), n2.toString()).encodeABI();
  return hexToBytes(data);
}

function hexToBytes(hex: string) {
  return hex.toLowerCase().match(/.{1,2}/g).slice(1).map(
    x => [new BigNumber(x, 16).toNumber()],
  );
}

async function executeTransaction(n: number, from?: address) {
  const txResult = await solo.contracts.send(
    multiSig.methods.executeTransaction(
      n.toString(),
    ),
    {
      from: from || owner3,
      gas: '5000000',
    },
  );

  const transaction: any = await solo.contracts.call(
    multiSig.methods.transactions(n.toString()),
  );
  expect(transaction.executed).toEqual(true);

  return txResult;
}

async function expectInstantData(dest: address, selector: string, expected: boolean) {
  const result = await solo.contracts.call(
    multiSig.methods.instantData(dest, selector),
  );
  expect(result).toEqual(expected);
}
