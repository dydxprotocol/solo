import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import {
  address,
  AmountDenomination,
  AmountReference,
  Integer,
  Transfer,
} from '../../src/types';

let owner1: address;
let owner2: address;
let operator: address;
const accountNumber1 = new BigNumber(133);
const accountNumber2 = new BigNumber(244);
let solo: Solo;
let accounts: address[];
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = new BigNumber(-100);
const negWei = new BigNumber(-150);

let defaultGlob: Transfer;

async function setAccountBalances(amount1: BigNumber, amount2: BigNumber) {
  await Promise.all([
    solo.testing.setAccountBalance(owner1, accountNumber1, market, amount1),
    solo.testing.setAccountBalance(owner2, accountNumber2, market, amount2),
  ]);
}

async function expectBalances(
  par1: Integer,
  wei1: Integer,
  par2: Integer,
  wei2: Integer,
) {
  const [
    accountBalances1,
    accountBalances2,
  ] = await Promise.all([
    solo.getters.getAccountBalances(owner1, accountNumber1),
    solo.getters.getAccountBalances(owner2, accountNumber2),
  ]);
  accountBalances1.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: par1, wei: wei1 };
    } else if (i === collateralMarket.toNumber()) {
      expected = { par: collateralAmount, wei: collateralAmount };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
  accountBalances2.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: par2, wei: wei2 };
    } else if (i === collateralMarket.toNumber()) {
      expected = { par: collateralAmount, wei: collateralAmount };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
}

async function expectTransferOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().transfer(combinedGlob).commit(options);
}

async function expectTransferRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectTransferOkay(glob, options), reason);
}

describe('Transfer', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    owner1 = accounts[5];
    owner2 = accounts[6];
    operator = solo.getDefaultAccount();
    defaultGlob = {
      primaryAccountOwner: owner1,
      primaryAccountId: accountNumber1,
      toAccountOwner: owner2,
      toAccountId: accountNumber2,
      marketId: market,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      },
    };

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: new BigNumber(1.5),
        supply: new BigNumber(1.5),
      }),
      solo.permissions.approveOperator(operator, { from: owner1 }),
      solo.permissions.approveOperator(operator, { from: owner2 }),
      solo.testing.setAccountBalance(owner1, accountNumber1, collateralMarket, collateralAmount),
      solo.testing.setAccountBalance(owner2, accountNumber2, collateralMarket, collateralAmount),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Basic transfer test', async () => {
    const fullAmount = new BigNumber(100);
    const halfAmount = new BigNumber(50);

    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: INTEGERS.ONE,
        supply: INTEGERS.ONE,
      }),
      solo.testing.setAccountBalance(
        owner1,
        accountNumber1,
        market,
        fullAmount,
      ),
      solo.testing.setAccountBalance(
        owner2,
        accountNumber2,
        market,
        fullAmount,
      ),
    ]);

    const txResult = await expectTransferOkay({
      amount: {
        value: halfAmount,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    await expectBalances(
      fullAmount.plus(halfAmount),
      fullAmount.plus(halfAmount),
      fullAmount.minus(halfAmount),
      fullAmount.minus(halfAmount),
    );

    // TODO: expect log

    console.log(`\tTransfer gas used: ${txResult.gasUsed}`);
  });

  it('Succeeds for positive delta par/wei', async () => {
    const globs = [
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting negative (>par)
      await setAccountBalances(negPar.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, negPar, negWei);

      // starting negative (=par)
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, negPar, negWei);

      // starting negative (<par)
      await setAccountBalances(negPar.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par.div(2), wei.div(2), negPar, negWei);

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), negPar, negWei);
    }
  });

  it('Succeeds for zero delta par/wei', async () => {
    const globs = [
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalances(par, negPar);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting negative
      await setAccountBalances(negPar, par);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);
    }
  });

  it('Succeeds for negative delta par/wei', async () => {
    const globs = [
      {
        amount: {
          value: negPar,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        amount: {
          value: negWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);

      // starting positive (>par)
      await setAccountBalances(par.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, par, wei);

      // starting positive (=par)
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, par, wei);

      // starting positive (<par)
      await setAccountBalances(par.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar.div(2), negWei.div(2), par, wei);

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar.times(2), negWei.times(2), par, wei);
    }
  });

  it('Succeeds for positive target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar, negWei);

      // starting positive (>par)
      await setAccountBalances(par.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, par, wei);

      // starting positive (=par)
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive (<par)
      await setAccountBalances(par.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar.div(2), negWei.div(2));

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(par, wei, negPar.times(2), negWei.times(2));
    }
  });

  it('Succeeds for zero target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting negative
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, negPar, negWei);

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(zero, zero, par, wei);
    }
  });

  it('Succeeds for negative target par/wei', async () => {
    const globs = [
      {
        amount: {
          value: negPar,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        amount: {
          value: negWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalances(zero, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par, wei);

      // starting negative (>par)
      await setAccountBalances(negPar.times(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, negPar, negWei);

      // starting negative (=par)
      await setAccountBalances(negPar, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative (<par)
      await setAccountBalances(negPar.div(2), zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par.div(2), wei.div(2));

      // starting positive
      await setAccountBalances(par, zero);
      await expectTransferOkay(globs[i]);
      await expectBalances(negPar, negWei, par.times(2), wei.times(2));
    }
  });

  it('Succeeds for some more specific indexes and values', async () => {
    // TODO
  });

  it('Fails for non-operator on first account', async () => {
    await solo.permissions.disapproveOperator(operator, { from: owner1 });
    await expectTransferRevert(
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      'Storage: Unpermissioned Operator',
    );
  });

  it('Fails for non-operator on second account', async () => {
    await solo.permissions.disapproveOperator(operator, { from: owner2 });
    await expectTransferRevert(
      {
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      'Storage: Unpermissioned Operator',
    );
  });
});
