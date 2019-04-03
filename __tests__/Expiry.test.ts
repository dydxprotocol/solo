import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { INTEGERS } from '../src/lib/Constants';
import { expectThrow } from '../src/lib/Expect';
import {
  address,
  AmountDenomination,
  AmountReference,
  Trade,
} from '../src/types';

let solo: Solo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;

const accountNumber1 = INTEGERS.ZERO;
const accountNumber2 = INTEGERS.ONE;
const heldMarket = INTEGERS.ZERO;
const owedMarket = INTEGERS.ONE;
const defaultTime = new BigNumber(1234321);
const par = new BigNumber(10000);
const zero = new BigNumber(0);
const premium = new BigNumber('1.05');
let defaultGlob: Trade;

describe('Expiry', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();
    owner2 = accounts[3];
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      otherAccountOwner: owner2,
      otherAccountId: accountNumber2,
      inputMarketId: owedMarket,
      outputMarketId: heldMarket,
      autoTrader: solo.contracts.expiry.options.address,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
      data: [],
    };

    await resetEVM();
    await Promise.all([
      setupMarkets(solo, accounts),
      solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par.times(-1)),
      solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(2)),
      solo.testing.setAccountBalance(owner1, accountNumber1, owedMarket, par),
    ]);
    await setExpiry();
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds in setting expiry', async () => {
    const newTime = defaultTime.plus(1000);
    const txResult = await setExpiry(newTime);
    const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
    expect(expiry).toEqual(newTime);

    const logs = solo.logs.parseLogs(txResult);
    expect(logs.length).toEqual(5);

    const expirySetLog = logs[3];
    expect(expirySetLog.name).toEqual('ExpirySet');
    expect(expirySetLog.args.owner).toEqual(owner2);
    expect(expirySetLog.args.number).toEqual(accountNumber2);
    expect(expirySetLog.args.marketId).toEqual(owedMarket);
    expect(expirySetLog.args.time).toEqual(newTime);

    console.log(`\tSet expiry gas used: ${txResult.gasUsed}`);
  });

  it('Skips logs when necessary', async () => {
    const newTime = defaultTime.plus(1000);
    const txResult = await setExpiry(newTime);
    const noLogs = solo.logs.parseLogs(txResult, { skipExpiryLogs: true });
    const logs = solo.logs.parseLogs(txResult, { skipExpiryLogs: false });
    expect(noLogs.filter(e => e.name === 'ExpirySet').length).toEqual(0);
    expect(logs.filter(e => e.name === 'ExpirySet').length).not.toEqual(0);
  });

  it('Doesnt set expiry for non-negative balances', async () => {
    const newTime = defaultTime.plus(1000);
    await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
    await setExpiry(newTime);
    const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
    expect(expiry).toEqual(defaultTime);
  });

  it('Allows setting expiry back to zero even for non-negative balances', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
    await setExpiry(zero);
    const expiry = await solo.getters.getExpiry(owner2, accountNumber2, owedMarket);
    expect(expiry).toEqual(zero);
  });

  it('Succeeds in expiring', async () => {
    const txResult = await expectExpireOkay({});

    const logs = solo.logs.parseLogs(txResult);

    const expiryLog = logs[3];
    expect(expiryLog.name).toEqual('ExpirySet');
    expect(expiryLog.args.owner).toEqual(owner2);
    expect(expiryLog.args.number).toEqual(accountNumber2);
    expect(expiryLog.args.marketId).toEqual(owedMarket);
    expect(expiryLog.args.time).toEqual(zero);

    const [
      held1,
      owed1,
      held2,
      owed2,
    ] = await Promise.all([
      solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
      solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
    ]);

    expect(owed1).toEqual(zero);
    expect(owed2).toEqual(zero);
    expect(held1).toEqual(par.times(premium));
    expect(held2).toEqual(par.times(2).minus(held1));

    console.log(`\tExpiring gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds in expiring part of a position', async () => {
    const txResult = await expectExpireOkay({
      amount: {
        value: par.div(-2),
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Target,
      },
    });

    const logs = solo.logs.parseLogs(txResult);
    logs.forEach((log: any) => expect(log.name).not.toEqual('ExpirySet'));

    const [
      held1,
      owed1,
      held2,
      owed2,
    ] = await Promise.all([
      solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
      solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
    ]);

    expect(owed1).toEqual(par.div(2));
    expect(owed2).toEqual(par.div(-2));
    expect(held1).toEqual(par.times(premium).div(2));
    expect(held2).toEqual(par.times(2).minus(held1));
  });

  it('Succeeds in expiring including premiums', async () => {
    const owedPremium = new BigNumber('0.5');
    const heldPremium = new BigNumber('1.0');
    const adjustedPremium = premium.minus(1).times(
      owedPremium.plus(1),
    ).times(
      heldPremium.plus(1),
    ).plus(1);
    await Promise.all([
      solo.admin.setSpreadPremium(owedMarket, owedPremium, { from: admin }),
      solo.admin.setSpreadPremium(heldMarket, heldPremium, { from: admin }),
    ]);

    await expectExpireOkay({});

    const [
      held1,
      owed1,
      held2,
      owed2,
    ] = await Promise.all([
      solo.getters.getAccountPar(owner1, accountNumber1, heldMarket),
      solo.getters.getAccountPar(owner1, accountNumber1, owedMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, heldMarket),
      solo.getters.getAccountPar(owner2, accountNumber2, owedMarket),
    ]);

    expect(owed1).toEqual(zero);
    expect(owed2).toEqual(zero);
    expect(held1).toEqual(par.times(adjustedPremium));
    expect(held2).toEqual(par.times(2).minus(held1));
  });

  it('Fails for invalid number of bytes', async () => {
    const errorMessage = 'Expiry: Call data invalid length';
    const callGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      callee: solo.contracts.expiry.options.address,
      data: [],
    };
    await expectThrow(
      solo.operation.initiate().call(callGlob).commit(),
      errorMessage,
    );

    const bunchOfZeroes = [];
    for (let i = 0; i < 100; i += 1) {
      bunchOfZeroes.push([0]);
    }
    await expectThrow(
      solo.operation.initiate().call({
        ...callGlob,
        data: bunchOfZeroes,
      }).commit(),
      errorMessage,
    );
  });

  it('Fails for non-solo calls', async () => {
    await expectThrow(
      solo.contracts.callContractFunction(
        solo.contracts.expiry.methods.callFunction(
          owner1,
          {
            owner: owner1,
            number: accountNumber1.toFixed(0),
          },
          [],
        ),
      ),
      'OnlySolo: Only Solo can call function',
    );
  });

  it('Fails for zero inputMarket', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, zero);
    await expectExpireRevert(
      {},
      'Expiry: Balance must be negative',
    );
  });

  it('Fails for positive inputMarket', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, owedMarket, par);
    await expectExpireRevert(
      {},
      'Expiry: Balance must be negative',
    );
  });

  it('Fails for overpaying a loan', async () => {
    await expectExpireRevert(
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
      'Expiry: Loans cannot be overpaid',
    );
  });

  it('Fails for increasing a loan', async () => {
    await expectExpireRevert(
      {
        amount: {
          value: par.times(-2),
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
      'Expiry: Loans must be decreased',
    );
  });

  it('Fails for a zero expiry', async () => {
    await setExpiry(zero);
    await expectExpireRevert(
      {},
      'Expiry: Loan not yet expired',
    );
  });

  it('Fails for a future expiry', async () => {
    await setExpiry(INTEGERS.ONES_31);
    await expectExpireRevert(
      {},
      'Expiry: Loan not yet expired',
    );
  });

  it('Fails for zero collateral', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, zero);
    await expectExpireRevert(
      {},
      'Expiry: Collateral must be positive',
    );
  });

  it('Fails for negative collateral', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par.times(-1));
    await expectExpireRevert(
      {},
      'Expiry: Collateral must be positive',
    );
  });

  it('Fails for overtaking collateral', async () => {
    await solo.testing.setAccountBalance(owner2, accountNumber2, heldMarket, par);
    await expectExpireRevert(
      {},
      'Expiry: Collateral cannot be overtaken',
    );
  });
});

// ============ Helper Functions ============

async function setExpiry(time?: BigNumber) {
  return solo.operation.initiate().setExpiry({
    primaryAccountOwner: owner2,
    primaryAccountId: accountNumber2,
    marketId: owedMarket,
    expiryTime: time ? time : defaultTime,
  }).commit({ from: owner2 });
}

async function expectExpireOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().trade(combinedGlob).commit(options);
}

async function expectExpireRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectExpireOkay(glob, options), reason);
}
