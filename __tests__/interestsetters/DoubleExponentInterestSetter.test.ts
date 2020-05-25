import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { ADDRESSES } from '../../src/lib/Constants';
import { address } from '../../src/types';
import { expectThrow } from '../../src/lib/Expect';
import { coefficientsToString, getInterestPerSecondForDoubleExponent } from '../../src/lib/Helpers';

let solo: TestSolo;
let owner: address;
let admin: address;
const accountNumber1 = new BigNumber(111);
const accountNumber2 = new BigNumber(222);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const negPar = par.times(-1);
const defaultPrice = new BigNumber(10000);
const maximumRate = new BigNumber(31709791983).div('1e18');
const defaultCoefficients = [20, 20, 20, 20, 20];
const defaultMaxAPR = new BigNumber('1.00');

describe('DoubleExponentInterestSetter', () => {
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
      solo.testing.doubleExponentInterestSetter.getAddress(),
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
      getInterestPerSecondForDoubleExponent(
        defaultMaxAPR,
        defaultCoefficients,
        { totalBorrowed: par.div(2), totalSupply: par },
      ),
    );
  });

  it('Succeeds for 100% (javscript)', async () => {
    const res1 = getInterestPerSecondForDoubleExponent(
      defaultMaxAPR,
      defaultCoefficients,
      { totalBorrowed: par, totalSupply: par },
    );
    const res2 = getInterestPerSecondForDoubleExponent(
      defaultMaxAPR,
      defaultCoefficients,
      { totalBorrowed: par.times(2), totalSupply: par },
    );
    expect(maximumRate).toEqual(res1);
    expect(maximumRate).toEqual(res2);
  });

  it('Succeeds for gas', async () => {
    const baseGasCost = 21000;
    const getRateFunction = solo.contracts.testDoubleExponentInterestSetter.methods.getInterestRate;
    const totalCosts = await Promise.all([
      await getRateFunction(ADDRESSES.ZERO, '0', '0').estimateGas(),
      await getRateFunction(ADDRESSES.ZERO, '1', '1').estimateGas(),
      await getRateFunction(ADDRESSES.ZERO, '1', '2').estimateGas(),
    ]);
    const costs = totalCosts.map(x => x - baseGasCost);
    console.log(`\tInterest calculation gas used: ${costs[0]}, ${costs[1]}, ${costs[2]}`);
  });

  it('Succeeds for some hardcoded numbers (1)', async () => {
    await setCoefficients(new BigNumber('1e18'), [20, 20, 20, 20, 20]);

    // borrowWei, supplyWei, result
    const testCases = [
      [0, 0, '0'],
      [0, 100, '0'],
      [100, 100, '31709791983'],
      [101, 100, '31709791983'],
      [25, 100, '8348690441'],
      [50, 100, '11519572869'],
      [75, 100, '17307326008'],
    ];

    for (let i = 0; i < testCases.length; i += 1) {
      const borrowWei = new BigNumber(testCases[i][0]);
      const supplywei = new BigNumber(testCases[i][1]);
      const result = await solo.testing.doubleExponentInterestSetter.getInterestRate(
        borrowWei,
        supplywei,
      );
      const expectedResult = new BigNumber(testCases[i][2]);
      expect(result).toEqual(expectedResult);
    }
  });

  it('Succeeds for some hardcoded numbers (2)', async () => {
    await setCoefficients(new BigNumber('1e18'), [0, 25, 25, 0, 25, 25]);

    // borrowWei, supplyWei, result
    const testCases = [
      [0, 0, '0'],
      [0, 100, '0'],
      [100, 100, '31709791983'],
      [101, 100, '31709791983'],
      [25, 100, '2477448463'],
      [50, 100, '5976673553'],
      [75, 100, '11277869029'],
    ];

    for (let i = 0; i < testCases.length; i += 1) {
      const borrowWei = new BigNumber(testCases[i][0]);
      const supplywei = new BigNumber(testCases[i][1]);
      const result = await solo.testing.doubleExponentInterestSetter.getInterestRate(
        borrowWei,
        supplywei,
      );
      const expectedResult = new BigNumber(testCases[i][2]);
      expect(result).toEqual(expectedResult);
    }
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
        getInterestPerSecondForDoubleExponent(
          defaultMaxAPR,
          defaultCoefficients,
          {
            totalBorrowed: par.times(utilization),
            totalSupply: par,
          },
        ),
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
      await solo.contracts.testDoubleExponentInterestSetter.methods.getMaxAPR().call();
    expect(maxAPR1).toEqual(new BigNumber('1e18').toFixed(0));

    const newAPR = new BigNumber('1.5e18').toFixed(0);
    expect(newAPR).not.toEqual(maxAPR1);

    await solo.contracts.send(
      solo.contracts.testDoubleExponentInterestSetter.methods.setParameters({
        maxAPR: newAPR,
        coefficients: '100',
      }),
    );

    const maxAPR2 =
      await solo.contracts.testDoubleExponentInterestSetter.methods.getMaxAPR().call();
    expect(maxAPR2).toEqual(newAPR);
  });

  it("Fails to deploy contracts whose coefficients don't add to 100", async () => {
    await expectThrow(
      solo.contracts.testDoubleExponentInterestSetter.methods.createNew({
        maxAPR: '0',
        coefficients: coefficientsToString([10, 0, 10]),
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
    await solo.contracts.testDoubleExponentInterestSetter.methods.getCoefficients().call();
  expect(coefficients).toEqual(expected.map(x => x.toString()));
}

async function setCoefficients(
  maximumRate: BigNumber,
  coefficients: number[],
) {
  const coefficientsString = coefficientsToString(coefficients);
  await solo.contracts.send(
    solo.contracts.testDoubleExponentInterestSetter.methods.setParameters({
      maxAPR: maximumRate.toFixed(0),
      coefficients: coefficientsString,
    }),
  );
}
