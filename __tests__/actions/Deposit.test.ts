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
  Deposit,
  Integer,
} from '../../src/types';

let who: address;
let solo: Solo;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = new BigNumber(-100);
const negWei = new BigNumber(-150);
let defaultGlob: Deposit;
const CANNOT_DEPOSIT_NEGATIVE = 'Exchange: Cannot transferIn negative';
const cachedWeis = {
  walletWei: zero,
  soloWei: zero,
};

async function setAccountBalance(amount: BigNumber) {
  return solo.testing.setAccountBalance(who, accountNumber, market, amount);
}

async function issueTokensToUser(amount: BigNumber) {
  return await solo.testing.tokenA.issueTo(amount, who);
}

async function expectBalances(
  expectedPar: Integer,
  expectedWei: Integer,
  walletWei: Integer,
  soloWei: Integer,
) {
  const [
    accountBalances,
    walletTokenBalance,
    soloTokenBalance,
  ] = await Promise.all([
    solo.getters.getAccountBalances(who, accountNumber),
    solo.testing.tokenA.getBalance(who),
    solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
  ]);
  accountBalances.forEach((balance, i) => {
    let expected = { par: zero, wei: zero };
    if (i === market.toNumber()) {
      expected = { par: expectedPar, wei: expectedWei };
    } else if (i === collateralMarket.toNumber()) {
      expected = {
        par: collateralAmount,
        wei: collateralAmount,
      };
    }
    expect(balance.par).toEqual(expected.par);
    expect(balance.wei).toEqual(expected.wei);
  });
  expect(walletTokenBalance.minus(cachedWeis.walletWei)).toEqual(walletWei);
  expect(soloTokenBalance.minus(cachedWeis.soloWei)).toEqual(soloWei);
  cachedWeis.walletWei = walletTokenBalance;
  cachedWeis.soloWei = soloTokenBalance;
}

async function expectDepositOkay(
  glob: Object,
  options?: Object,
) {
  const combinedGlob = { ...defaultGlob, ...glob };
  return await solo.operation.initiate().deposit(combinedGlob).commit(options);
}

async function expectDepositRevert(
  glob: Object,
  reason?: string,
  options?: Object,
) {
  await expectThrow(expectDepositOkay(glob, options), reason);
}

describe('Deposit', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    who = solo.getDefaultAccount();
    defaultGlob = {
      primaryAccountOwner: who,
      primaryAccountId: accountNumber,
      marketId: market,
      from: who,
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
        borrow: wei.div(par),
        supply: wei.div(par),
      }),
      solo.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
      solo.testing.tokenA.setMaximumSoloAllowance(who),
    ]);
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
    cachedWeis.walletWei = zero;
    cachedWeis.soloWei = zero;
  });

  it('Basic deposit test', async () => {
    const amount = new BigNumber(100);
    await Promise.all([
      solo.testing.setMarketIndex(market, {
        lastUpdate: INTEGERS.ZERO,
        borrow: INTEGERS.ONE,
        supply: INTEGERS.ONE,
      }),
      issueTokensToUser(amount),
    ]);

    const txResult = await expectDepositOkay({
      amount: {
        value: amount,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    await expectBalances(amount, amount, zero, amount);
    // TODO: expect log

    console.log(`\tDeposit gas used: ${txResult.gasUsed}`);
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
      await Promise.all([
        setAccountBalance(zero),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive
      await Promise.all([
        setAccountBalance(par),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), zero, wei);

      // starting negative (>par)
      await Promise.all([
        setAccountBalance(negPar.times(2)),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative (=par)
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);

      // starting negative (<par)
      await Promise.all([
        setAccountBalance(negPar.div(2)),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.div(2), wei.div(2), zero, wei);
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
      await setAccountBalance(zero);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting negative
      await setAccountBalance(negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);
    }
  });

  it('Fails for negative delta par/wei', async () => {
    const reason = CANNOT_DEPOSIT_NEGATIVE;
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

    await issueTokensToUser(wei);

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await setAccountBalance(zero);
      await expectDepositRevert(globs[i], reason);

      // starting positive
      await setAccountBalance(par);
      await expectDepositRevert(globs[i], reason);

      // starting negative
      await setAccountBalance(negPar);
      await expectDepositRevert(globs[i], reason);
    }
  });

  it('Mixed for positive target par/wei', async () => {
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
      await Promise.all([
        setAccountBalance(zero),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive (<target)
      await Promise.all([
        setAccountBalance(par.div(2)),
        issueTokensToUser(wei.div(2)),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.div(2));

      // starting positive (=target)
      await setAccountBalance(par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive (>target)
      await setAccountBalance(par.times(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei.times(2)),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.times(2));
    }
  });

  it('Mixed for zero target par/wei', async () => {
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
      await setAccountBalance(zero),
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await setAccountBalance(par),
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([
        setAccountBalance(negPar),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);
    }
  });

  it('Mixed for negative target par/wei', async () => {
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
      await setAccountBalance(zero);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative (<target)
      await Promise.all([
        setAccountBalance(negPar.times(2)),
        issueTokensToUser(wei),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative (=target)
      await setAccountBalance(negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative (>target)
      await setAccountBalance(negPar.div(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting positive
      await setAccountBalance(par);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);
    }
  });

  it('Succeeds for some more specific indexes and values', async () => {
    // TODO
  });

  it('Succeeds for operator', async () => {
    const operator = accounts[2];
    await Promise.all([
      issueTokensToUser(wei),
      solo.permissions.approveOperator(operator),
    ]);
    await expectDepositOkay(
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
      { from: operator },
    );
  });

  it('Fails for non-operator', async () => {
    await issueTokensToUser(wei);
    await expectDepositRevert(
      {
        amount: {
          value: wei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
      'Storage: Unpermissioned Operator',
      { from: accounts[2] },
    );
  });

  it('Fails for from random address', async () => {
    const glob = {
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
      from: accounts[2],
    };

    await expectDepositRevert(glob, 'OperationImpl: Invalid deposit source');
  });

  it('Fails if depositing more tokens than owned', async () => {
    const glob = {
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };
    await expectDepositRevert(glob, 'Token: TransferFrom failed');
  });
});
