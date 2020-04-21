import BigNumber from 'bignumber.js';
import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/SoloHelpers';
import { INTEGERS, ADDRESSES } from '../src/lib/Constants';
import { stringToDecimal } from '../src/lib/Helpers';
import { expectThrow } from '../src/lib/Expect';
import {
  address,
  Decimal,
  Integer,
  MarketWithInfo,
  RiskLimits,
  RiskParams,
 } from '../src/types';

let txr: any;
let solo: TestSolo;
let accounts: address[];
let admin: address;
let nonAdmin: address;
let operator: address;
let riskLimits: RiskLimits;
let riskParams: RiskParams;
let soloAddress: address;
let oracleAddress: address;
let setterAddress: address;
const smallestDecimal = stringToDecimal('1');
const defaultPrice = new BigNumber(999);
const invalidPrice = new BigNumber(0);
const defaultRate = new BigNumber(0);
const defaultPremium = new BigNumber(0);
const highPremium = new BigNumber('0.2');
const defaultMarket = new BigNumber(1);
const secondaryMarket = new BigNumber(0);
const invalidMarket = new BigNumber(101);

describe('Admin', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    nonAdmin = accounts[2];
    operator = accounts[6];
    expect(admin).not.toEqual(nonAdmin);

    await resetEVM();

    [
      riskLimits,
      riskParams,
    ] = await Promise.all([
      solo.getters.getRiskLimits(),
      solo.getters.getRiskParams(),
      setupMarkets(solo, accounts, 2),
    ]);

    soloAddress = solo.contracts.soloMargin.options.address;
    oracleAddress = solo.testing.priceOracle.getAddress();
    setterAddress = solo.testing.interestSetter.getAddress();

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  // ============ Token Functions ============

  describe('#ownerWithdrawExcessTokens', () => {
    const recipient = ADDRESSES.TEST[1];
    const owner = ADDRESSES.TEST[0];
    const account1 = INTEGERS.ZERO;
    const account2 = INTEGERS.ONE;
    const market = INTEGERS.ZERO;
    const amount = new BigNumber(100);

    it('Succeeds even if has more tokens than enough', async () => {
      // has 2X tokens but has X excess
      await Promise.all([
        solo.testing.setAccountBalance(owner, account1, market, amount.times(2)),
        solo.testing.setAccountBalance(owner, account2, market, amount.times(-1)),
        solo.testing.tokenA.issueTo(amount.times(2), soloAddress),
      ]);
      const excess = await solo.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount);

      txr = await solo.admin.withdrawExcessTokens(market, recipient, { from: admin });
      await expectBalances(txr, amount, amount);
    });

    it('Succeeds even if existing tokens arent enough', async () => {
      // has X tokens but has 3X excess
      await Promise.all([
        solo.testing.setAccountBalance(owner, account1, market, amount.times(-3)),
        solo.testing.setAccountBalance(owner, account2, market, amount.times(1)),
        solo.testing.tokenA.issueTo(amount, soloAddress),
      ]);
      const excess = await solo.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount.times(3));

      txr = await solo.admin.withdrawExcessTokens(market, recipient, { from: admin });
      await expectBalances(txr, INTEGERS.ZERO, amount);
    });

    it('Succeeds for zero available', async () => {
      await Promise.all([
        solo.testing.setAccountBalance(owner, account1, market, amount.times(-2)),
        solo.testing.setAccountBalance(owner, account2, market, amount.times(1)),
      ]);
      const excess = await solo.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount);

      txr = await solo.admin.withdrawExcessTokens(market, recipient, { from: admin });
      await expectBalances(txr, INTEGERS.ZERO, INTEGERS.ZERO);
    });

    it('Succeeds for zero excess', async () => {
      await Promise.all([
        solo.testing.setAccountBalance(owner, account1, market, amount.times(-1)),
        solo.testing.setAccountBalance(owner, account2, market, amount.times(2)),
        solo.testing.tokenA.issueTo(amount, soloAddress),
      ]);
      const excess = await solo.getters.getNumExcessTokens(market);
      expect(excess).toEqual(INTEGERS.ZERO);
      txr = await solo.admin.withdrawExcessTokens(market, recipient, { from: admin });
      await expectBalances(txr, amount, INTEGERS.ZERO);
    });

    it('Fails for negative excess', async () => {
      await Promise.all([
        solo.testing.setAccountBalance(owner, account1, market, amount.times(-1)),
        solo.testing.setAccountBalance(owner, account2, market, amount.times(3)),
        solo.testing.tokenA.issueTo(amount, soloAddress),
      ]);
      const excess = await solo.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount.times(-1));

      await expectThrow(
        solo.admin.withdrawExcessTokens(market, recipient, { from: admin }),
        'AdminImpl: Negative excess',
      );
    });

    it('Fails for non-existent market', async () => {
      await expectThrow(
        solo.admin.withdrawExcessTokens(invalidMarket, recipient, { from: nonAdmin }),
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.withdrawExcessTokens(market, recipient, { from: nonAdmin }),
      );
    });

    async function expectBalances(
      txResult: any,
      expectedSolo: Integer,
      expectedRecipient: Integer,
    ) {
      if (txResult) {
        const token = solo.testing.tokenA.getAddress();
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogWithdrawExcessTokens');
        expect(log.args.token).toEqual(token);
        expect(log.args.amount).toEqual(expectedRecipient);
      }
      const [
        soloBalance,
        recipientBalance,
      ] = await Promise.all([
        solo.testing.tokenA.getBalance(soloAddress),
        solo.testing.tokenA.getBalance(recipient),
      ]);
      expect(soloBalance).toEqual(expectedSolo);
      expect(recipientBalance).toEqual(expectedRecipient);
    }
  });

  describe('#ownerWithdrawUnsupportedTokens', () => {
    const recipient = ADDRESSES.TEST[1];

    it('Succeeds', async () => {
      const amount = new BigNumber(100);
      await solo.testing.tokenC.issueTo(amount, soloAddress);
      await expectBalances(null, amount, INTEGERS.ZERO);
      txr = await solo.admin.withdrawUnsupportedTokens(
        solo.testing.tokenC.getAddress(),
        recipient,
        { from: admin },
      );
      await expectBalances(txr, INTEGERS.ZERO, amount);
    });

    it('Succeeds for zero tokens', async () => {
      txr = await solo.admin.withdrawUnsupportedTokens(
        solo.testing.tokenC.getAddress(),
        recipient,
        { from: admin },
      );
      await expectBalances(txr, INTEGERS.ZERO, INTEGERS.ZERO);
    });

    it('Fails for token with existing market', async () => {
      await expectThrow(
        solo.admin.withdrawUnsupportedTokens(
          solo.testing.tokenA.getAddress(),
          recipient,
          { from: admin },
        ),
        'AdminImpl: Market exists',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.withdrawUnsupportedTokens(
          ADDRESSES.TEST[1],
          recipient,
          { from: nonAdmin },
        ),
      );
    });

    async function expectBalances(
      txResult: any,
      expectedSolo: Integer,
      expectedRecipient: Integer,
    ) {
      if (txResult) {
        const token = solo.testing.tokenC.getAddress();
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogWithdrawExcessTokens');
        expect(log.args.token).toEqual(token);
        expect(log.args.amount).toEqual(expectedRecipient);
      }
      const [
        soloBalance,
        recipientBalance,
      ] = await Promise.all([
        solo.testing.tokenC.getBalance(soloAddress),
        solo.testing.tokenC.getBalance(recipient),
      ]);
      expect(soloBalance).toEqual(expectedSolo);
      expect(recipientBalance).toEqual(expectedRecipient);
    }
  });

  // ============ Market Functions ============

  describe('#ownerAddMarket', () => {
    const token = ADDRESSES.TEST[2];

    it('Successfully adds a market', async () => {
      await solo.testing.priceOracle.setPrice(
        token,
        defaultPrice,
      );

      const marginPremium = new BigNumber('0.11');
      const spreadPremium = new BigNumber('0.22');

      const txResult = await solo.admin.addMarket(
        token,
        oracleAddress,
        setterAddress,
        marginPremium,
        spreadPremium,
        { from: admin },
      );

      const { timestamp } = await solo.web3.eth.getBlock(txResult.blockNumber);

      const numMarkets = await solo.getters.getNumMarkets();
      const marketId = numMarkets.minus(1);
      const marketInfo: MarketWithInfo = await solo.getters.getMarketWithInfo(marketId);

      expect(marketInfo.market.token.toLowerCase()).toEqual(token);
      expect(marketInfo.market.priceOracle).toEqual(oracleAddress);
      expect(marketInfo.market.interestSetter).toEqual(setterAddress);
      expect(marketInfo.market.marginPremium).toEqual(marginPremium);
      expect(marketInfo.market.spreadPremium).toEqual(spreadPremium);
      expect(marketInfo.market.isClosing).toEqual(false);
      expect(marketInfo.market.totalPar.borrow).toEqual(INTEGERS.ZERO);
      expect(marketInfo.market.totalPar.supply).toEqual(INTEGERS.ZERO);
      expect(marketInfo.market.index.borrow).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.supply).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.lastUpdate).toEqual(new BigNumber(timestamp));
      expect(marketInfo.currentPrice).toEqual(defaultPrice);
      expect(marketInfo.currentInterestRate).toEqual(INTEGERS.ZERO);
      expect(marketInfo.currentIndex.borrow).toEqual(INTEGERS.ONE);
      expect(marketInfo.currentIndex.supply).toEqual(INTEGERS.ONE);
      expect(marketInfo.market.index.lastUpdate).toEqual(new BigNumber(timestamp));

      const logs = solo.logs.parseLogs(txResult);
      expect(logs.length).toEqual(5);

      const addLog = logs[0];
      expect(addLog.name).toEqual('LogAddMarket');
      expect(addLog.args.marketId).toEqual(marketId);
      expect(addLog.args.token.toLowerCase()).toEqual(token);

      const oracleLog = logs[1];
      expect(oracleLog.name).toEqual('LogSetPriceOracle');
      expect(oracleLog.args.marketId).toEqual(marketId);
      expect(oracleLog.args.priceOracle).toEqual(oracleAddress);

      const setterLog = logs[2];
      expect(setterLog.name).toEqual('LogSetInterestSetter');
      expect(setterLog.args.marketId).toEqual(marketId);
      expect(setterLog.args.interestSetter).toEqual(setterAddress);

      const marginPremiumLog = logs[3];
      expect(marginPremiumLog.name).toEqual('LogSetMarginPremium');
      expect(marginPremiumLog.args.marketId).toEqual(marketId);
      expect(marginPremiumLog.args.marginPremium).toEqual(marginPremium);

      const spreadPremiumLog = logs[4];
      expect(spreadPremiumLog.name).toEqual('LogSetSpreadPremium');
      expect(spreadPremiumLog.args.marketId).toEqual(marketId);
      expect(spreadPremiumLog.args.spreadPremium).toEqual(spreadPremium);
    });

    it('Fails to add a market of the same token', async () => {
      const token = solo.testing.tokenA.getAddress();
      await solo.testing.priceOracle.setPrice(token, defaultPrice);
      await expectThrow(
        solo.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          { from: admin },
        ),
        'AdminImpl: Market exists',
      );
    });

    it('Fails for broken price', async () => {
      await solo.testing.priceOracle.setPrice(token, invalidPrice);
      await expectThrow(
        solo.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          { from: admin },
        ),
        'AdminImpl: Invalid oracle price',
      );
    });

    it('Fails for broken marginPremium', async () => {
      await Promise.all([
        solo.testing.priceOracle.setPrice(token, defaultPrice),
        solo.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        solo.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          riskLimits.marginPremiumMax.plus(smallestDecimal),
          defaultPremium,
          { from: admin },
        ),
        'AdminImpl: Margin premium too high',
      );
    });

    it('Fails for broken spreadPremium', async () => {
      await Promise.all([
        solo.testing.priceOracle.setPrice(token, defaultPrice),
        solo.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        solo.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          riskLimits.spreadPremiumMax.plus(smallestDecimal),
          { from: admin },
        ),
        'AdminImpl: Spread premium too high',
      );
    });

    it('Fails for non-admin', async () => {
      await Promise.all([
        solo.testing.priceOracle.setPrice(token, defaultPrice),
        solo.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        solo.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          { from: nonAdmin },
        ),
      );
    });
  });

  describe('#ownerSetIsClosing', () => {
    it('Succeeds', async () => {
      await expectIsClosing(null, false);

      // set to false again
      txr = await solo.admin.setIsClosing(defaultMarket, false, { from: admin });
      await expectIsClosing(txr, false);

      // set to true
      txr = await solo.admin.setIsClosing(defaultMarket, true, { from: admin });
      await expectIsClosing(txr, true);

      // set to true again
      txr = await solo.admin.setIsClosing(defaultMarket, true, { from: admin });
      await expectIsClosing(txr, true);

      // set to false
      txr = await solo.admin.setIsClosing(defaultMarket, false, { from: admin });
      await expectIsClosing(txr, false);
    });

    it('Fails for index OOB', async () => {
      await expectThrow(
        solo.admin.setIsClosing(invalidMarket, true, { from: admin }),
        'AdminImpl: Market OOB',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setIsClosing(defaultMarket, true, { from: nonAdmin }),
      );
    });

    async function expectIsClosing(txResult: any, b: boolean) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetIsClosing');
        expect(log.args.marketId).toEqual(defaultMarket);
        expect(log.args.isClosing).toEqual(b);
      }
      const isClosing = await solo.getters.getMarketIsClosing(defaultMarket);
      expect(isClosing).toEqual(b);
    }
  });

  describe('#ownerSetPriceOracle', () => {
    it('Succeeds', async () => {
      const token = await solo.getters.getMarketTokenAddress(defaultMarket);
      await solo.testing.priceOracle.setPrice(token, defaultPrice);
      txr = await solo.admin.setPriceOracle(
        defaultMarket,
        oracleAddress,
        { from: admin },
      );
      const logs = solo.logs.parseLogs(txr);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSetPriceOracle');
      expect(log.args.marketId).toEqual(defaultMarket);
      expect(log.args.priceOracle).toEqual(oracleAddress);
    });

    it('Fails for broken price', async () => {
      const token = await solo.getters.getMarketTokenAddress(defaultMarket);
      await solo.testing.priceOracle.setPrice(token, invalidPrice);
      await expectThrow(
        solo.admin.setPriceOracle(
          defaultMarket,
          oracleAddress,
          { from: admin },
        ),
        'AdminImpl: Invalid oracle price',
      );
    });

    it('Fails for contract without proper function', async () => {
      await expectThrow(
        solo.admin.setPriceOracle(
          defaultMarket,
          setterAddress,
          { from: admin },
        ),
      );
    });

    it('Fails for index OOB', async () => {
      const numMarkets = await solo.getters.getNumMarkets();
      await expectThrow(
        solo.admin.setPriceOracle(
          numMarkets,
          setterAddress,
          { from: admin },
        ),
        'AdminImpl: Market OOB',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setPriceOracle(
          defaultMarket,
          oracleAddress,
          { from: nonAdmin },
        ),
      );
    });
  });

  describe('#ownerSetInterestSetter', () => {
    it('Succeeds', async () => {
      const token = await solo.getters.getMarketTokenAddress(defaultMarket);
      await solo.testing.interestSetter.setInterestRate(token, defaultRate);
      txr = await solo.admin.setInterestSetter(
        defaultMarket,
        setterAddress,
        { from: admin },
      );
      const logs = solo.logs.parseLogs(txr);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSetInterestSetter');
      expect(log.args.marketId).toEqual(defaultMarket);
      expect(log.args.interestSetter).toEqual(setterAddress);
    });

    it('Fails for contract without proper function', async () => {
      await expectThrow(
        solo.admin.setInterestSetter(
          defaultMarket,
          oracleAddress,
          { from: admin },
        ),
      );
    });

    it('Fails for index OOB', async () => {
      const numMarkets = await solo.getters.getNumMarkets();
      await expectThrow(
        solo.admin.setInterestSetter(
          numMarkets,
          setterAddress,
          { from: admin },
        ),
        'AdminImpl: Market OOB',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setInterestSetter(
          defaultMarket,
          setterAddress,
          { from: nonAdmin },
        ),
      );
    });
  });

  describe('#ownerSetMarginPremium', () => {
    it('Succeeds', async () => {
      await expectMarginPremium(null, defaultPremium);

      // set to default
      txr = await solo.admin.setMarginPremium(defaultMarket, defaultPremium, { from: admin });
      await expectMarginPremium(txr, defaultPremium);

      // set risky
      txr = await solo.admin.setMarginPremium(defaultMarket, highPremium, { from: admin });
      await expectMarginPremium(txr, highPremium);

      // set to risky again
      txr = await solo.admin.setMarginPremium(defaultMarket, highPremium, { from: admin });
      await expectMarginPremium(txr, highPremium);

      // set back to default
      txr = await solo.admin.setMarginPremium(defaultMarket, defaultPremium, { from: admin });
      await expectMarginPremium(txr, defaultPremium);
    });

    it('Fails for index OOB', async () => {
      await expectThrow(
        solo.admin.setMarginPremium(invalidMarket, highPremium, { from: admin }),
        'AdminImpl: Market OOB',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setMarginPremium(defaultMarket, highPremium, { from: nonAdmin }),
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setMarginPremium(
          defaultMarket,
          riskLimits.marginPremiumMax.plus(smallestDecimal),
          { from: admin },
        ),
        'AdminImpl: Margin premium too high',
      );
    });

    async function expectMarginPremium(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMarginPremium');
        expect(log.args.marginPremium).toEqual(e);
      }
      const premium = await solo.getters.getMarketMarginPremium(defaultMarket);
      expect(premium).toEqual(e);
    }
  });

  describe('#ownerSetSpreadPremium', () => {
    it('Succeeds', async () => {
      await expectSpreadPremium(null, defaultPremium);

      // set to default
      txr = await solo.admin.setSpreadPremium(defaultMarket, defaultPremium, { from: admin });
      await expectSpreadPremium(txr, defaultPremium);

      // set risky
      txr = await solo.admin.setSpreadPremium(defaultMarket, highPremium, { from: admin });
      await expectSpreadPremium(txr, highPremium);

      // set to risky again
      txr = await solo.admin.setSpreadPremium(defaultMarket, highPremium, { from: admin });
      await expectSpreadPremium(txr, highPremium);

      // set back to default
      txr = await solo.admin.setSpreadPremium(defaultMarket, defaultPremium, { from: admin });
      await expectSpreadPremium(txr, defaultPremium);
    });

    it('Succeeds for two markets', async () => {
      const premium1 = new BigNumber('0.2');
      const premium2 = new BigNumber('0.3');

      await Promise.all([
        solo.admin.setSpreadPremium(defaultMarket, premium1, { from: admin }),
        solo.admin.setSpreadPremium(secondaryMarket, premium2, { from: admin }),
      ]);

      const result = await solo.getters.getLiquidationSpreadForPair(
        defaultMarket,
        secondaryMarket,
      );

      const expected = riskParams.liquidationSpread.times(
        premium1.plus(1),
      ).times(
        premium2.plus(1),
      );
      expect(result).toEqual(expected);
    });

    it('Fails for index OOB', async () => {
      await expectThrow(
        solo.admin.setSpreadPremium(invalidMarket, highPremium, { from: admin }),
        'AdminImpl: Market OOB',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setSpreadPremium(defaultMarket, highPremium, { from: nonAdmin }),
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setSpreadPremium(
          defaultMarket,
          riskLimits.spreadPremiumMax.plus(smallestDecimal),
          { from: admin },
        ),
        'AdminImpl: Spread premium too high',
      );
    });

    async function expectSpreadPremium(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetSpreadPremium');
        expect(log.args.spreadPremium).toEqual(e);
      }
      const premium = await solo.getters.getMarketSpreadPremium(defaultMarket);
      expect(premium).toEqual(e);
    }
  });

  // ============ Risk Functions ============

  describe('#ownerSetMarginRatio', () => {
    it('Succeeds', async () => {
      await expectMarginRatio(null, riskParams.marginRatio);

      // keep same
      txr = await solo.admin.setMarginRatio(riskParams.marginRatio, { from: admin });
      await expectMarginRatio(txr, riskParams.marginRatio);

      // set to max
      txr = await solo.admin.setMarginRatio(riskLimits.marginRatioMax, { from: admin });
      await expectMarginRatio(txr, riskLimits.marginRatioMax);

      // set back to original
      txr = await solo.admin.setMarginRatio(riskParams.marginRatio, { from: admin });
      await expectMarginRatio(txr, riskParams.marginRatio);
    });

    it('Fails for value <= spread', async () => {
      // setup
      const error = 'AdminImpl: Ratio cannot be <= spread';
      const liquidationSpread = smallestDecimal.times(10);
      await solo.admin.setLiquidationSpread(liquidationSpread, { from: admin });

      // passes when above the spread
      txr = await solo.admin.setMarginRatio(
        liquidationSpread.plus(smallestDecimal),
        { from: admin },
      );
      await expectMarginRatio(txr, liquidationSpread.plus(smallestDecimal));

      // revert when equal to the spread
      await expectThrow(
        solo.admin.setMarginRatio(liquidationSpread, { from: admin }),
        error,
      );

      // revert when below the spread
      await expectThrow(
        solo.admin.setMarginRatio(
          liquidationSpread.minus(smallestDecimal),
          { from: admin },
        ),
        error,
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setMarginRatio(
          riskLimits.marginRatioMax.plus(smallestDecimal),
          { from: admin },
        ),
        'AdminImpl: Ratio too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setMarginRatio(riskParams.marginRatio, { from: nonAdmin }),
      );
    });

    async function expectMarginRatio(txResult: any, e: Integer) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMarginRatio');
        expect(log.args.marginRatio).toEqual(e);
      }
      const result = await solo.getters.getMarginRatio();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetLiquidationSpread', () => {
    it('Succeeds', async () => {
      // setup
      await solo.admin.setMarginRatio(
        riskLimits.marginRatioMax,
        { from: admin },
      );
      await expectLiquidationSpread(null, riskParams.liquidationSpread);

      // keep same
      txr = await solo.admin.setLiquidationSpread(riskParams.liquidationSpread, { from: admin });
      await expectLiquidationSpread(txr, riskParams.liquidationSpread);

      // set to max
      txr = await solo.admin.setLiquidationSpread(riskLimits.liquidationSpreadMax, { from: admin });
      await expectLiquidationSpread(txr, riskLimits.liquidationSpreadMax);

      // set back to original
      txr = await solo.admin.setLiquidationSpread(riskParams.liquidationSpread, { from: admin });
      await expectLiquidationSpread(txr, riskParams.liquidationSpread);
    });

    it('Fails for value >= ratio', async () => {
      // setup
      const error = 'AdminImpl: Spread cannot be >= ratio';
      const marginRatio = new BigNumber('0.1');
      await solo.admin.setMarginRatio(
        marginRatio,
        { from: admin },
      );

      // passes when below the ratio
      txr = await solo.admin.setLiquidationSpread(
        marginRatio.minus(smallestDecimal),
        { from: admin },
      );
      await expectLiquidationSpread(txr, marginRatio.minus(smallestDecimal));

      // reverts when equal to the ratio
      await expectThrow(
        solo.admin.setLiquidationSpread(
          marginRatio,
          { from: admin },
        ),
        error,
      );

      // reverts when above the ratio
      await expectThrow(
        solo.admin.setLiquidationSpread(
          marginRatio.plus(smallestDecimal),
          { from: admin },
        ),
        error,
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setLiquidationSpread(
          riskLimits.liquidationSpreadMax.plus(smallestDecimal),
          { from: admin },
        ),
        'AdminImpl: Spread too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setLiquidationSpread(
          riskParams.liquidationSpread,
          { from: nonAdmin },
        ),
      );
    });

    async function expectLiquidationSpread(txResult: any, e: Integer) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetLiquidationSpread');
        expect(log.args.liquidationSpread).toEqual(e);
      }
      const result = await solo.getters.getLiquidationSpread();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetEarningsRate', () => {
    it('Succeeds', async () => {
      await expectEarningsRate(null, riskParams.earningsRate);

      // keep same
      txr = await solo.admin.setEarningsRate(
        riskParams.earningsRate,
        { from: admin },
      );
      await expectEarningsRate(txr, riskParams.earningsRate);

      // set to max
      txr = await solo.admin.setEarningsRate(
        riskLimits.earningsRateMax,
        { from: admin },
      );
      await expectEarningsRate(txr, riskLimits.earningsRateMax);

      // set back to original
      txr = await solo.admin.setEarningsRate(
        riskParams.earningsRate,
        { from: admin },
      );
      await expectEarningsRate(txr, riskParams.earningsRate);
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setEarningsRate(
          riskLimits.earningsRateMax.plus(tenToNeg18),
          { from: admin },
        ),
        'AdminImpl: Rate too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setEarningsRate(
          riskParams.earningsRate,
          { from: nonAdmin },
        ),
      );
    });

    const tenToNeg18 = '0.000000000000000001';

    async function expectEarningsRate(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetEarningsRate');
        expect(log.args.earningsRate).toEqual(e);
      }
      const result = await solo.getters.getEarningsRate();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetMinBorrowedValue', () => {
    it('Succeeds', async () => {
      await expectMinBorrowedValue(null, riskParams.minBorrowedValue);

      // keep same
      txr = await solo.admin.setMinBorrowedValue(riskParams.minBorrowedValue, { from: admin });
      await expectMinBorrowedValue(txr, riskParams.minBorrowedValue);

      // set to max
      txr = await solo.admin.setMinBorrowedValue(riskLimits.minBorrowedValueMax, { from: admin });
      await expectMinBorrowedValue(txr, riskLimits.minBorrowedValueMax);

      // set back to original
      txr = await solo.admin.setMinBorrowedValue(riskParams.minBorrowedValue, { from: admin });
      await expectMinBorrowedValue(txr, riskParams.minBorrowedValue);
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        solo.admin.setMinBorrowedValue(riskLimits.minBorrowedValueMax.plus(1), { from: admin }),
        'AdminImpl: Value too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setMinBorrowedValue(riskParams.minBorrowedValue, { from: nonAdmin }),
      );
    });

    async function expectMinBorrowedValue(txResult: any, e: Integer) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMinBorrowedValue');
        expect(log.args.minBorrowedValue).toEqual(e);
      }
      const result = await solo.getters.getMinBorrowedValue();
      expect(result).toEqual(e);
    }
  });

  // ============ Global Operator Functions ============

  describe('#ownerSetGlobalOperator', () => {
    it('Succeeds', async () => {
      await expectGlobalOperatorToBe(null, false);
      txr = await solo.admin.setGlobalOperator(operator, false, { from: admin });
      await expectGlobalOperatorToBe(txr, false);
      txr = await solo.admin.setGlobalOperator(operator, true, { from: admin });
      await expectGlobalOperatorToBe(txr, true);
      txr = await solo.admin.setGlobalOperator(operator, true, { from: admin });
      await expectGlobalOperatorToBe(txr, true);
      txr = await solo.admin.setGlobalOperator(operator, false, { from: admin });
      await expectGlobalOperatorToBe(txr, false);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        solo.admin.setGlobalOperator(operator, true, { from: nonAdmin }),
      );
    });

    async function expectGlobalOperatorToBe(txResult: any, b: boolean) {
      if (txResult) {
        const logs = solo.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetGlobalOperator');
        expect(log.args.operator).toEqual(operator);
        expect(log.args.approved).toEqual(b);
      }
      const result = await solo.getters.getIsGlobalOperator(operator);
      expect(result).toEqual(b);
    }
  });

  // ============ Other ============

  describe('Logs', () => {
    it('Skips logs when necessary', async () => {
      txr = await solo.admin.setGlobalOperator(operator, false, { from: admin });
      const logs = solo.logs.parseLogs(txr, { skipAdminLogs: true });
      expect(logs.length).toEqual(0);
    });
  });
});
