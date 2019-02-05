import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { Integer } from '../../src/types';

let who: address;
let solo: Solo;
let accounts: address[];
const accountNumber = INTEGERS.ZERO;
const market = INTEGERS.ZERO;
const collateralMarket = new BigNumber(2);
const collateralAmount = new BigNumber(1000000);
const zero = new BigNumber(0);
const amount = new BigNumber(100);
const par = new BigNumber(100);
const wei = new BigNumber(150);
const negPar = new BigNumber(-100);
const negWei = new BigNumber(-150);
const index = {
  lastUpdate: INTEGERS.ZERO,
  borrow: wei.div(par),
  supply: wei.div(par),
};
let defaultGlob;
const CANNOT_DEPOSIT_NEGATIVE = 'Exchange: Cannot transferIn negative';
const cachedWeis = {
  walletWei: zero,
  soloWei: zero,
};

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
    if (i == market.toNumber()) {
      expected = { par: expectedPar, wei: expectedWei };
    } else if (i == collateralMarket.toNumber()) {
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

async function expectDepositOkay(glob, options?) {
  return await solo.operation.initiate().deposit(glob).commit(options);
}

async function expectDepositRevert(glob, reason?, options?) {
  await expectThrow(
    solo.operation.initiate().deposit(glob).commit(options),
    reason,
  );
}

describe('Deposit', () => {
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
    };
  });

  beforeEach(async () => {
    await resetEVM();
    await mineAvgBlock();
    await Promise.all([
      setupMarkets(solo, accounts),
      solo.testing.tokenA.setMaximumSoloAllowance(who),
    ]);
    await Promise.all([
      solo.testing.setMarketIndex(market, index),
      solo.testing.setAccountBalance(who, accountNumber, collateralMarket, collateralAmount),
    ]);
    await mineAvgBlock();

    cachedWeis.walletWei = zero;
    cachedWeis.soloWei = zero;
  });

  it('Basic deposit test', async () => {
    await solo.testing.setMarketIndex(market, {
      lastUpdate: INTEGERS.ZERO,
      borrow: INTEGERS.ONE,
      supply: INTEGERS.ONE,
    });

    await solo.testing.tokenA.issueTo(amount, who);

    const txResult = await expectDepositOkay({
      ...defaultGlob,
      amount: {
        value: amount,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    console.log(`\tDeposit gas used: ${txResult.gasUsed}`);

    const [
      walletTokenBalance,
      soloTokenBalance,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
    ]);

    expect(walletTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloTokenBalance).toEqual(amount);
    await expectBalances(amount, amount, zero, amount);

    // TODO: expect log
  });

  it('Succeeds for positive delta par/wei', async () => {
    const globs = [
      {
        ...defaultGlob,
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        ...defaultGlob,
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
        solo.testing.setAccountBalance(who, accountNumber, market, zero),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, par),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par.times(2), wei.times(2), zero, wei);

      // starting negative
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, negPar),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);
    }
  });

  it('Succeeds for zero delta par/wei', async () => {
    const globs = [
      {
        ...defaultGlob,
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Delta,
        },
      },
      {
        ...defaultGlob,
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Delta,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await solo.testing.setAccountBalance(who, accountNumber, market, zero);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await solo.testing.setAccountBalance(who, accountNumber, market, par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting negative
      await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);
    }
  });

  it('Mixed for positive target par/wei', async () => {
    const globs = [
      {
        ...defaultGlob,
        amount: {
          value: par,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        ...defaultGlob,
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
        solo.testing.setAccountBalance(who, accountNumber, market, zero),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei);

      // starting positive < target
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, par.div(2)),
        solo.testing.tokenA.issueTo(wei.div(2), who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.div(2));

      // starting positive = target
      await solo.testing.setAccountBalance(who, accountNumber, market, par);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, zero);

      // starting positive > target
      await solo.testing.setAccountBalance(who, accountNumber, market, par.times(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, negPar),
        solo.testing.tokenA.issueTo(wei.times(2), who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(par, wei, zero, wei.times(2));
    }
  });

  it('Mixed for negative target par/wei', async () => {
    const globs = [
      {
        ...defaultGlob,
        amount: {
          value: negPar,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        ...defaultGlob,
        amount: {
          value: negWei,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await solo.testing.setAccountBalance(who, accountNumber, market, zero);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative < target
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, negPar.times(2)),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, wei);

      // starting negative = target
      await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
      await expectDepositOkay(globs[i]);
      await expectBalances(negPar, negWei, zero, zero);

      // starting negative > target
      await solo.testing.setAccountBalance(who, accountNumber, market, negPar.div(2));
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting positive
      await solo.testing.setAccountBalance(who, accountNumber, market, par);
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);
    }
  });

  it('Mixed for zero target par/wei', async () => {
    const globs = [
      {
        ...defaultGlob,
        amount: {
          value: zero,
          denomination: AmountDenomination.Principal,
          reference: AmountReference.Target,
        },
      },
      {
        ...defaultGlob,
        amount: {
          value: zero,
          denomination: AmountDenomination.Actual,
          reference: AmountReference.Target,
        },
      },
    ];

    for (let i = 0; i < globs.length; i += 1) {
      // starting from zero
      await solo.testing.setAccountBalance(who, accountNumber, market, zero),
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, zero);

      // starting positive
      await solo.testing.setAccountBalance(who, accountNumber, market, par),
      await expectDepositRevert(globs[i], CANNOT_DEPOSIT_NEGATIVE);

      // starting negative
      await Promise.all([
        solo.testing.setAccountBalance(who, accountNumber, market, negPar),
        solo.testing.tokenA.issueTo(wei, who),
      ]);
      await expectDepositOkay(globs[i]);
      await expectBalances(zero, zero, zero, wei);
    }
  });

  it('Fails for non-operator', async () => {
    const glob = {
      ...defaultGlob,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await solo.testing.tokenA.issueTo(wei, who);

    await expectDepositRevert(
      glob,
      'Storage: Unpermissioned Operator',
      { from: accounts[2] },
    );
  });

  it('Fails for from random address', async () => {
    const glob = {
      ...defaultGlob,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
      from: accounts[2],
    };

    await expectDepositRevert(glob, 'OperationImpl: Invalid deposit source');
  });

  it('Fails for negative delta wei', async () => {
    const reason = CANNOT_DEPOSIT_NEGATIVE;
    const glob = {
      ...defaultGlob,
      amount: {
        value: negWei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    await solo.testing.tokenA.issueTo(wei, who);

    // starting from zero
    await solo.testing.setAccountBalance(who, accountNumber, market, zero);
    await expectDepositRevert(glob, reason);

    //starting positive
    await solo.testing.setAccountBalance(who, accountNumber, market, par);
    await expectDepositRevert(glob, reason);

    // starting negative
    await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
    await expectDepositRevert(glob, reason);
  });

  it('Fails for negative delta par', async () => {
    const reason = CANNOT_DEPOSIT_NEGATIVE;
    const glob = {
      ...defaultGlob,
      amount: {
        value: negPar,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    };

    await solo.testing.tokenA.issueTo(wei, who);

    // starting from zero
    await solo.testing.setAccountBalance(who, accountNumber, market, zero);
    await expectDepositRevert(glob, reason);

    // starting positive
    await solo.testing.setAccountBalance(who, accountNumber, market, par);
    await expectDepositRevert(glob, reason);

    // starting negative
    await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
    await expectDepositRevert(glob, reason);
  });

  it('Fails if depositing more tokens than owned', async () => {
    await expectDepositRevert({
      ...defaultGlob,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    }, 'Token: TransferFrom failed');
  });
});
