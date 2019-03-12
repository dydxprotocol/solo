import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';
import { resetEVM, snapshot } from './helpers/EVM';
import { ADDRESSES } from '../src/lib/Constants';
import { address } from '../src/types';
import { expectThrow } from '../src/lib/Expect';
import { coefficientsToString } from '../src/lib/Helpers';

let solo: Solo;
let owner: address;
let admin: address;
const accountNumber1 = new BigNumber(111);
const accountNumber2 = new BigNumber(222);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const negPar = par.times(-1);
const defaultPrice = new BigNumber(10000);
const maximumRate = new BigNumber(31709791983).div('1e18');
const defaultCoefficients = [0, 10, 10, 0, 0, 80];
const SECONDS_IN_A_YEAR = new BigNumber('31536000');

describe('PolynomialInterestSetter', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    owner = solo.getDefaultAccount();
    admin = r.accounts[0];
    await resetEVM();
    await solo.testing.priceOracle.setPrice(
      solo.testing.tokenA.getAddress(),
      defaultPrice,
    );
    await solo.admin.addMarket(
      solo.testing.tokenA.getAddress(),
      solo.testing.priceOracle.getAddress(),
      solo.testing.polynomialInterestSetter.getAddress(),
      zero,
      zero,
      { from: admin },
    );
    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('Succeeds for 0/0', async () => {
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(zero);
  });

  it('Succeeds for 0/100', async () => {
    await solo.testing.setAccountBalance(owner, accountNumber1, zero, par);
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(zero);
  });

  it('Succeeds for 100/0', async () => {
    await solo.testing.setAccountBalance(owner, accountNumber1, zero, negPar);
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(maximumRate);
  });

  it('Succeeds for 100/100', async () => {
    await Promise.all([
      solo.testing.setAccountBalance(owner, accountNumber1, zero, par),
      solo.testing.setAccountBalance(owner, accountNumber2, zero, negPar),
    ]);
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(maximumRate);
  });

  it('Succeeds for 200/100', async () => {
    await Promise.all([
      solo.testing.setAccountBalance(owner, accountNumber1, zero, par),
      solo.testing.setAccountBalance(owner, accountNumber2, zero, negPar.times(2)),
    ]);
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(maximumRate);
  });

  it('Succeeds for 50/100', async () => {
    await Promise.all([
      solo.testing.setAccountBalance(owner, accountNumber1, zero, par),
      solo.testing.setAccountBalance(owner, accountNumber2, zero, negPar.div(2)),
    ]);
    const rate = await solo.getters.getMarketInterestRate(zero);
    expect(rate).toEqual(
      getExpected(defaultCoefficients, new BigNumber('0.5')),
    );
  });

  it('Succeeds for gas', async () => {
    const baseGasCost = 21000;
    const getRateFunction = solo.contracts.testPolynomialInterestSetter.methods.getInterestRate;
    const totalCosts = await Promise.all([
      await getRateFunction(ADDRESSES.ZERO, '0', '0').estimateGas(),
      await getRateFunction(ADDRESSES.ZERO, '1', '1').estimateGas(),
      await getRateFunction(ADDRESSES.ZERO, '1', '2').estimateGas(),
    ]);
    const costs = totalCosts.map(x => x - baseGasCost);
    console.log(`\tInterest calculation gas used: ${costs[0]}, ${costs[1]}, ${costs[2]}`);
  });

  it('Succeeds for bunch of utilization numbers', async () => {
    for (let i = 0; i <= 100; i += 5) {
      const utilization = new BigNumber(i).div(100);
      await Promise.all([
        solo.testing.setAccountBalance(owner, accountNumber1, zero, par),
        solo.testing.setAccountBalance(owner, accountNumber2, zero, negPar.times(utilization)),
      ]);
      const rate = await solo.getters.getMarketInterestRate(zero);
      expect(rate).toEqual(
        getExpected(defaultCoefficients, utilization),
      );
    }
  });

  it('Succeeds for setting/getting coefficients', async () => {
    const testCases = [
      [],
      [100],
      [10, 20, 30, 40],
      [40, 30, 20, 10],
      [0, 0, 0, 0, 0, 100],
      [0, 30, 0, 40, 0, 30],
    ];
    for (let i = 0; i < testCases.length; i += 1) {
      const coefficients = testCases[i];
      await setCoefficients(zero, coefficients);
      await expectCoefficients(coefficients);
    }
  });

  it('Succeeds for setting/getting maxAPR', async () => {
    const maxAPR1 =
      await solo.contracts.testPolynomialInterestSetter.methods.getMaxAPR().call();
    expect(maxAPR1).toEqual(new BigNumber('1e18').toFixed(0));

    const newAPR = new BigNumber('1.5e18').toFixed(0);
    expect(newAPR).not.toEqual(maxAPR1);

    await solo.contracts.callContractFunction(
      solo.contracts.testPolynomialInterestSetter.methods.setParameters({
        maxAPR: newAPR,
        coefficients: '100',
      }),
    );

    const maxAPR2 =
      await solo.contracts.testPolynomialInterestSetter.methods.getMaxAPR().call();
    expect(maxAPR2).toEqual(newAPR);
  });

  it('Fails to deploy contracts whose coefficients dont add to 100', async () => {
    await expectThrow(
      solo.contracts.testPolynomialInterestSetter.methods.createNew({
        maxAPR: '0',
        coefficients: '99',
      }).call(),
      'Coefficients must sum to 100',
    );
  });
});

// ============ Helper Functions ============

async function expectCoefficients(
  expected: number[],
) {
  const coefficients =
    await solo.contracts.testPolynomialInterestSetter.methods.getCoefficients().call();
  expect(coefficients).toEqual(expected.map(x => x.toString()));
}

async function setCoefficients(
  maximumRate: BigNumber,
  coefficients: number[],
) {
  const coefficientsString = coefficientsToString(coefficients);
  await solo.contracts.callContractFunction(
    solo.contracts.testPolynomialInterestSetter.methods.setParameters({
      maxAPR: maximumRate.toFixed(0),
      coefficients: coefficientsString,
    }),
  );
}

function getExpected(
  coefficients: number[],
  utilization: BigNumber,
) {
  let m = new BigNumber(1);
  let result = zero;
  for (let i = 0; i < coefficients.length; i += 1) {
    result = result.plus(m.times(coefficients[i]).times('1e18').div(100));
    m = m.times(utilization);
  }
  return result.div(SECONDS_IN_A_YEAR).integerValue(BigNumber.ROUND_DOWN).div('1e18');
}
