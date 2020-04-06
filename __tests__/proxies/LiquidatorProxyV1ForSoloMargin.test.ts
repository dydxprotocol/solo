import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { fastForward, mineAvgBlock, resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { address, AccountStatus } from '../../src/types';

let solo: TestSolo;
let accounts: address[];
let snapshotId: string;
let admin: address;
let owner1: address;
let owner2: address;
let operator: address;

const accountNumber1 = new BigNumber(111);
const accountNumber2 = new BigNumber(222);
const market1 = INTEGERS.ZERO;
const market2 = INTEGERS.ONE;
const market3 = new BigNumber(2);
const market4 = new BigNumber(3);
const zero = new BigNumber(0);
const par = new BigNumber(10000);
const negPar = par.times(-1);
const minLiquidatorRatio = new BigNumber('0.25');
const prices = [
  new BigNumber('1e20'),
  new BigNumber('1e18'),
  new BigNumber('1e18'),
  new BigNumber('1e21'),
];

describe('LiquidatorProxyV1ForSoloMargin', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    owner1 = solo.getDefaultAccount();
    owner2 = accounts[3];
    operator = accounts[6];

    await resetEVM();
    await setupMarkets(solo, accounts);
    await Promise.all([
      solo.testing.priceOracle.setPrice(solo.testing.tokenA.getAddress(), prices[0]),
      solo.testing.priceOracle.setPrice(solo.testing.tokenB.getAddress(), prices[1]),
      solo.testing.priceOracle.setPrice(solo.testing.tokenC.getAddress(), prices[2]),
      solo.testing.priceOracle.setPrice(solo.weth.getAddress(), prices[3]),
      solo.permissions.approveOperator(operator, { from: owner1 }),
      solo.permissions.approveOperator(
        solo.contracts.liquidatorProxyV1.options.address,
        { from: owner1 },
      ),
    ]);
    await solo.admin.addMarket(
      solo.weth.getAddress(),
      solo.testing.priceOracle.getAddress(),
      solo.testing.interestSetter.getAddress(),
      zero,
      zero,
      { from: admin },
    );
    await mineAvgBlock();

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  describe('#liquidate', () => {
    describe('Success cases', () => {
      it('Succeeds for one owed, one held', async () => {
        await setUpBasicBalances();
        await liquidate();
        await expectBalances(
          [zero, par.times('105')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for one owed, one held (held first)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('100')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, par.times('1.1')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, negPar.times('100')),
        ]);
        await liquidate();
        await expectBalances(
          [par.times('1.05'), zero],
          [par.times('.05'), zero],
        );
      });

      it('Succeeds for one owed, one held (undercollateralized)', async () => {
        await setUpBasicBalances();
        await solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('95'));
        await liquidate();
        await expectBalances(
          [par.times('0.0952'), par.times('95')],
          [negPar.times('0.0952'), zero],
        );
      });

      it('Succeeds for one owed, many held', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('60')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market3, par.times('50')),
        ]);
        const txResult = await liquidate();
        await expectBalances(
          [zero, par.times('60'), par.times('44.9925')],
          [zero, zero, par.times('5.0075')],
        );
        console.log(`\tLiquidatorProxyV1 gas used (1 owed, 2 held): ${txResult.gasUsed}`);
      });

      it('Succeeds for many owed, one held', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('100')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, negPar.times('50')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market3, par.times('165')),
        ]);
        const txResult = await liquidate();
        await expectBalances(
          [zero, par.times('50'), par.times('157.5')],
          [zero, zero, par.times('7.5')],
        );
        console.log(`\tLiquidatorProxyV1 gas used (2 owed, 1 held): ${txResult.gasUsed}`);
      });

      it('Succeeds for many owed, many held', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('150')),
          solo.testing.setAccountBalance(owner1, accountNumber1, market4, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, par.times('0.525')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, negPar.times('100')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market3, par.times('170')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market4, negPar.times('0.1')),
        ]);
        const txResult = await liquidate();
        await expectBalances(
          [par.times('0.525'), par.times('50'), par.times('157.5'), par.times('0.9')],
          [zero, zero, par.times('12.5'), zero],
        );
        console.log(`\tLiquidatorProxyV1 gas used (2 owed, 2 held): ${txResult.gasUsed}`);
      });

      it('Succeeds for liquid account collateralized but in liquid status', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('150')),
          solo.testing.setAccountStatus(owner2, accountNumber2, AccountStatus.Liquidating),
        ]);
        await liquidate();
        await expectBalances(
          [zero, par.times('105')],
          [zero, par.times('45')],
        );
      });
    });

    describe('Success cases for various initial liquidator balances', () => {
      it('Succeeds for one owed, one held (liquidator balance is zero)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market4, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar, par.times('105')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for one owed, one held (liquidator balance is posHeld/negOwed)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, negPar),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('500')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.times(2), par.times('605')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for one owed, one held (liquidator balance is negatives)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, negPar.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('50')),
          solo.testing.setAccountBalance(owner1, accountNumber1, market4, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.times('1.5'), par.times('55')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for one owed, one held (liquidator balance is positives)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('50')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.div(2), par.times('155')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for one owed, one held (liquidator balance is !posHeld>!negOwed)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('100')),
          solo.testing.setAccountBalance(owner1, accountNumber1, market4, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        const txResult = await liquidate();
        await expectBalances(
          [negPar.div(2), par.times('5')],
          [zero, par.times('5')],
        );
        console.log(`\tLiquidatorProxyV1 gas used: ${txResult.gasUsed}`);
      });

      it('Succeeds for one owed, one held (liquidator balance is !posHeld<!negOwed)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('50')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [zero, par.times('55')],
          [zero, par.times('5')],
        );
      });
    });

    describe('Limited by minLiquidatorRatio', () => {
      it('Liquidates as much as it can (to 1.25) but no more', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, negPar.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('65')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.times('0.625'), par.times('78.125')],
          [negPar.times('0.875'), par.times('96.875')],
        );
        const liquidatorValues = await solo.getters.getAccountValues(owner1, accountNumber1);
        expect(liquidatorValues.supply).toEqual(liquidatorValues.borrow.times('1.25'));
      });

      it('Liquidates to negOwed/posHeld and then to 1.25', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.times('0.2')),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('10')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.times('0.55'), par.times('68.75')],
          [negPar.times('0.25'), par.times('31.25')],
        );
        const liquidatorValues = await solo.getters.getAccountValues(owner1, accountNumber1);
        expect(liquidatorValues.supply).toEqual(liquidatorValues.borrow.times('1.25'));
      });

      it('Liquidates to zero', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('105')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [zero, zero],
          [zero, par.times('5')],
        );
      });

      it('Liquidates even if it starts below 1.25', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.times('2.4')),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('200')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [par.times('1.4'), negPar.times('95')],
          [zero, par.times('5')],
        );
      });

      it('Does not liquidate below 1.25', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, negPar.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('60')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar.div(2), par.times('60')],
          [negPar, par.times('110')],
        );
      });

      it('Does not liquidate at 1.25', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, negPar),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('125')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await liquidate();
        await expectBalances(
          [negPar, par.times('125')],
          [negPar, par.times('110')],
        );
      });
    });

    describe('Follows minValueLiquidated', () => {
      it('Succeeds for less than valueLiquidatable', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await solo.liquidatorProxy.liquidate(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          minLiquidatorRatio,
          par.times(prices[0]),
          [market1],
          [market2],
          { from: operator },
        );
        await expectBalances(
          [zero, par.times('105')],
          [zero, par.times('5')],
        );
      });

      it('Succeeds for less than valueLiquidatable (even if liquidAccount is small)', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await solo.liquidatorProxy.liquidate(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          minLiquidatorRatio,
          par.times(prices[0]).times(5),
          [market1],
          [market2],
          { from: operator },
        );
        await expectBalances(
          [zero, par.times('105')],
          [zero, par.times('5')],
        );
      });

      it('Reverts if cannot liquidate enough', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.times('0.2')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await expectThrow(
          solo.liquidatorProxy.liquidate(
            owner1,
            accountNumber1,
            owner2,
            accountNumber2,
            minLiquidatorRatio,
            par.times(prices[0]).times(2),
            [market1],
            [market2],
            { from: operator },
          ),
          'LiquidatorProxyV1ForSoloMargin: Not enough liquidatable value',
        );
      });

      it('Reverts if cannot liquidate even 1', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('125')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await expectThrow(
          solo.liquidatorProxy.liquidate(
            owner1,
            accountNumber1,
            owner2,
            accountNumber2,
            minLiquidatorRatio,
            new BigNumber(1),
            [market1],
            [market2],
            { from: operator },
          ),
          'LiquidatorProxyV1ForSoloMargin: Not enough liquidatable value',
        );
      });
    });

    describe('Follows preferences', () => {
      it('Liquidates the most specified markets first', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market4, par.times('0.02')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market3, negPar.times('100')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market4, par.times('0.11')),
        ]);
        await solo.liquidatorProxy.liquidate(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          minLiquidatorRatio,
          zero,
          [market3, market1],
          [market4, market2],
          { from: operator },
        );
        await expectBalances(
          [zero, zero, negPar.times('100'), par.times('0.125')],
          [negPar, par.times('110'), zero, par.times('.005')],
        );
      });

      it('Does not liquidate unspecified markets', async () => {
        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, par.times('100')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);
        await solo.liquidatorProxy.liquidate(
          owner1,
          accountNumber1,
          owner2,
          accountNumber2,
          minLiquidatorRatio,
          zero,
          [market2],
          [market1],
          { from: operator },
        );
        await expectBalances(
          [par, par.times('100')],
          [negPar, par.times('110')],
        );
      });
    });

    describe('Failure cases', () => {
      it('Fails for msg.sender is non-operator', async () => {
        await Promise.all([
          setUpBasicBalances(),
          solo.permissions.disapproveOperator(operator, { from: owner1 }),
        ]);
        await expectThrow(
          liquidate(),
          'LiquidatorProxyV1ForSoloMargin: Sender not operator',
        );
      });

      it('Fails for proxy is non-operator', async () => {
        await Promise.all([
          setUpBasicBalances(),
          solo.permissions.disapproveOperator(
            solo.contracts.liquidatorProxyV1.options.address,
            { from: owner1 },
          ),
        ]);
        await expectThrow(
          liquidate(),
          'Storage: Unpermissioned operator',
        );
      });

      it('Fails for liquid account no supply', async () => {
        await setUpBasicBalances();
        await solo.testing.setAccountBalance(owner2, accountNumber2, market2, zero);
        await expectThrow(
          liquidate(),
          'LiquidatorProxyV1ForSoloMargin: Liquid account no supply',
        );
      });

      it('Fails for liquid account not liquidatable', async () => {
        await setUpBasicBalances();
        await solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('115'));
        await expectThrow(
          liquidate(),
          'LiquidatorProxyV1ForSoloMargin: Liquid account not liquidatable',
        );
      });
    });

    describe('Interest cases', () => {
      it('Liquidates properly even if the indexes have changed', async () => {
        const rate = new BigNumber(1).div(INTEGERS.ONE_YEAR_IN_SECONDS);
        await Promise.all([
          solo.testing.interestSetter.setInterestRate(solo.testing.tokenA.getAddress(), rate),
          solo.testing.interestSetter.setInterestRate(solo.testing.tokenB.getAddress(), rate),
          solo.testing.setMarketIndex(market1, {
            borrow: new BigNumber('1.2'),
            supply: new BigNumber('1.1'),
            lastUpdate: zero,
          }),
          solo.testing.setMarketIndex(market2, {
            borrow: new BigNumber('1.2'),
            supply: new BigNumber('1.1'),
            lastUpdate: zero,
          }),
        ]);
        await fastForward(3600);

        await Promise.all([
          solo.testing.setAccountBalance(owner1, accountNumber1, market1, par.div(2)),
          solo.testing.setAccountBalance(owner1, accountNumber1, market2, negPar.times('30')),
          solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
          solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
        ]);

        await liquidate();
      });
    });
  });
});

// ============ Helper Functions ============

async function setUpBasicBalances() {
  await Promise.all([
    solo.testing.setAccountBalance(owner1, accountNumber1, market1, par),
    solo.testing.setAccountBalance(owner2, accountNumber2, market1, negPar),
    solo.testing.setAccountBalance(owner2, accountNumber2, market2, par.times('110')),
  ]);
}

async function liquidate() {
  const preferences = [
    market1,
    market2,
    market3,
    market4,
  ];
  const txResult = await solo.liquidatorProxy.liquidate(
    owner1,
    accountNumber1,
    owner2,
    accountNumber2,
    minLiquidatorRatio,
    zero,
    preferences,
    preferences,
    { from: operator },
  );
  return txResult;
}

async function expectBalances(
  liquidatorBalances: (number | BigNumber)[],
  liquidBalances: (number | BigNumber)[],
) {
  const bal1 = await Promise.all([
    solo.getters.getAccountPar(owner1, accountNumber1, market1),
    solo.getters.getAccountPar(owner1, accountNumber1, market2),
    solo.getters.getAccountPar(owner1, accountNumber1, market3),
    solo.getters.getAccountPar(owner1, accountNumber1, market4),
  ]);
  const bal2 = await Promise.all([
    solo.getters.getAccountPar(owner2, accountNumber2, market1),
    solo.getters.getAccountPar(owner2, accountNumber2, market2),
    solo.getters.getAccountPar(owner2, accountNumber2, market3),
    solo.getters.getAccountPar(owner2, accountNumber2, market4),
  ]);

  for (let i = 0; i < liquidatorBalances.length; i += 1) {
    expect(bal1[i]).toEqual(liquidatorBalances[i]);
  }
  for (let i = 0; i < liquidBalances.length; i += 1) {
    expect(bal2[i]).toEqual(liquidBalances[i]);
  }
}
