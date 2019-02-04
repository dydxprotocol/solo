import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { Solo } from '../../src/Solo';
import { address, AmountDenomination, AmountReference } from '../../src/types';
import { mineAvgBlock, resetEVM } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { Balance, Integer } from '../../src/types';

let solo: Solo;
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

function expectBalances(
  accountBalances: Balance[],
  expectedPar: Integer,
  expectedWei: Integer
) {
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
  let accounts: address[];
  let who: address;

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
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloTokenBalance).toEqual(amount);
    expectBalances(accountBalances, amount, amount);

    //TODO: expect log
  });

  it('Succeeds for some non-one index', async () => {
    await solo.testing.tokenA.issueTo(wei, who);

    await expectDepositOkay({
      ...defaultGlob,
      amount: {
        value: wei,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    });

    const [
      walletTokenBalance,
      soloTokenBalance,
      accountBalances,
    ] = await Promise.all([
      solo.testing.tokenA.getBalance(who),
      solo.testing.tokenA.getBalance(solo.contracts.soloMargin.options.address),
      solo.getters.getAccountBalances(who, accountNumber),
    ]);

    expect(walletTokenBalance).toEqual(INTEGERS.ZERO);
    expect(soloTokenBalance).toEqual(wei);
    expectBalances(accountBalances, par, wei);
  });

  it('Succeeds for positive delta par', async () => {

  });

  it('Succeeds for positive delta wei', async () => {

  });

  it('Succeeds for zero delta par', async () => {
    const glob = {
      ...defaultGlob,
      amount: {
        value: zero,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Delta,
      },
    };

    let accountBalances;

    // starting from zero
    await solo.testing.setAccountBalance(who, accountNumber, market, zero);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, zero, zero);

    // starting positive
    await solo.testing.setAccountBalance(who, accountNumber, market, par);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, par, wei);

    // starting negative
    await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, negPar, negWei);
  });

  it('Succeeds for zero delta wei', async () => {
    const glob = {
      ...defaultGlob,
      amount: {
        value: zero,
        denomination: AmountDenomination.Actual,
        reference: AmountReference.Delta,
      },
    };

    let accountBalances;

    // starting from zero
    await solo.testing.setAccountBalance(who, accountNumber, market, zero);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, zero, zero);

    // starting positive
    await solo.testing.setAccountBalance(who, accountNumber, market, par);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, par, wei);

    // starting negative
    await solo.testing.setAccountBalance(who, accountNumber, market, negPar);
    await expectDepositOkay(glob);
    accountBalances = await solo.getters.getAccountBalances(who, accountNumber);
    expectBalances(accountBalances, negPar, negWei);
  });

  it('Mixed for positive target wei', async () => {
    //TODO
  });

  it('Mixed for positive target wei', async () => {
    //TODO
  });

  it('Mixed for negative target wei', async () => {
    //TODO
  });

  it('Mixed for negative target wei', async () => {
    //TODO
  });

  it('Mixed for zero target wei', async () => {
    //TODO
  });

  it('Mixed for zero target par', async () => {
    //TODO
  });

  it('Succeeds for all kinds of amounts', async () => {
    // positive target wei =>
    // positive target par =>
    // negative target wei =>
    // negative target par =>
    // zero target wei =>
    // zero target par =>
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
    const reason = 'Exchange: Cannot transferIn negative';
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
    const reason = 'Exchange: Cannot transferIn negative';
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
