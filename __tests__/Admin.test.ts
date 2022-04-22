import BigNumber from 'bignumber.js';
import {
  abi as customTestTokenABI,
  bytecode as customTestTokenBytecode,
} from '../build/contracts/CustomTestToken.json';

import { abi as recyclableABI, bytecode as recyclableBytecode } from '../build/contracts/TestRecyclableToken.json';

import { CustomTestToken } from '../build/testing_wrappers/CustomTestToken';
import { TestRecyclableToken } from '../build/testing_wrappers/TestRecyclableToken';
import { address, ADDRESSES, Decimal, Integer, INTEGERS, MarketWithInfo, RiskLimits, RiskParams } from '../src';
import { expectThrow } from '../src/lib/Expect';
import { stringToDecimal } from '../src/lib/Helpers';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';
import { resetEVM, snapshot } from './helpers/EVM';
import { EVM } from './modules/EVM';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';

let txr: any;
let dolomiteMargin: TestDolomiteMargin;
let accounts: address[];
let admin: address;
let nonAdmin: address;
let operator: address;
let riskLimits: RiskLimits;
let riskParams: RiskParams;
let dolomiteMarginAddress: address;
let oracleAddress: address;
let setterAddress: address;
const smallestDecimal = stringToDecimal('1');
const defaultPrice = new BigNumber(999);
const invalidPrice = new BigNumber(0);
const defaultRate = new BigNumber(0);
const defaultPremium = new BigNumber(0);
const defaultMaxWei = new BigNumber(0);
const highPremium = new BigNumber('0.2');
const highMaxWei = new BigNumber('1000e18');
const defaultMarket = new BigNumber(1);
const defaultIsClosing = false;
const defaultIsRecyclable = false;
const secondaryMarket = new BigNumber(0);
const invalidMarket = new BigNumber(101);

describe('Admin', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    accounts = r.accounts;
    admin = accounts[0];
    nonAdmin = accounts[2];
    operator = accounts[6];
    expect(admin).not.toEqual(nonAdmin);

    await resetEVM();

    [riskLimits, riskParams] = await Promise.all([
      dolomiteMargin.getters.getRiskLimits(),
      dolomiteMargin.getters.getRiskParams(),
      setupMarkets(dolomiteMargin, accounts, 2),
    ]);

    dolomiteMarginAddress = dolomiteMargin.address;
    oracleAddress = dolomiteMargin.testing.priceOracle.address;
    setterAddress = dolomiteMargin.testing.interestSetter.address;

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
        dolomiteMargin.testing.setAccountBalance(owner, account1, market, amount.times(2)),
        dolomiteMargin.testing.setAccountBalance(owner, account2, market, amount.times(-1)),
        dolomiteMargin.testing.tokenA.issueTo(amount.times(2), dolomiteMarginAddress),
      ]);
      const excess = await dolomiteMargin.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount);

      txr = await dolomiteMargin.admin.withdrawExcessTokens(market, recipient, {
        from: admin,
      });
      await expectBalances(txr, amount, amount);
    });

    it('Succeeds even if existing tokens arent enough', async () => {
      // has X tokens but has 3X excess
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(owner, account1, market, amount.times(-3)),
        dolomiteMargin.testing.setAccountBalance(owner, account2, market, amount.times(1)),
        dolomiteMargin.testing.tokenA.issueTo(amount, dolomiteMarginAddress),
      ]);
      const excess = await dolomiteMargin.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount.times(3));

      txr = await dolomiteMargin.admin.withdrawExcessTokens(market, recipient, {
        from: admin,
      });
      await expectBalances(txr, INTEGERS.ZERO, amount);
    });

    it('Succeeds for zero available', async () => {
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(owner, account1, market, amount.times(-2)),
        dolomiteMargin.testing.setAccountBalance(owner, account2, market, amount.times(1)),
      ]);
      const excess = await dolomiteMargin.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount);

      txr = await dolomiteMargin.admin.withdrawExcessTokens(market, recipient, {
        from: admin,
      });
      await expectBalances(txr, INTEGERS.ZERO, INTEGERS.ZERO);
    });

    it('Succeeds for zero excess', async () => {
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(owner, account1, market, amount.times(-1)),
        dolomiteMargin.testing.setAccountBalance(owner, account2, market, amount.times(2)),
        dolomiteMargin.testing.tokenA.issueTo(amount, dolomiteMarginAddress),
      ]);
      const excess = await dolomiteMargin.getters.getNumExcessTokens(market);
      expect(excess).toEqual(INTEGERS.ZERO);
      txr = await dolomiteMargin.admin.withdrawExcessTokens(market, recipient, {
        from: admin,
      });
      await expectBalances(txr, amount, INTEGERS.ZERO);
    });

    it('Fails for negative excess', async () => {
      await Promise.all([
        dolomiteMargin.testing.setAccountBalance(owner, account1, market, amount.times(-1)),
        dolomiteMargin.testing.setAccountBalance(owner, account2, market, amount.times(3)),
        dolomiteMargin.testing.tokenA.issueTo(amount, dolomiteMarginAddress),
      ]);
      const excess = await dolomiteMargin.getters.getNumExcessTokens(market);
      expect(excess).toEqual(amount.times(-1));

      await expectThrow(
        dolomiteMargin.admin.withdrawExcessTokens(market, recipient, { from: admin }),
        'AdminImpl: Negative excess',
      );
    });

    it('Fails for non-existent market', async () => {
      await expectThrow(
        dolomiteMargin.admin.withdrawExcessTokens(invalidMarket, recipient, {
          from: nonAdmin,
        }),
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.withdrawExcessTokens(market, recipient, { from: nonAdmin }));
    });

    async function expectBalances(txResult: any, expectedDolomiteMargin: Integer, expectedRecipient: Integer) {
      if (txResult) {
        const token = dolomiteMargin.testing.tokenA.address;
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogWithdrawExcessTokens');
        expect(log.args.token).toEqual(token);
        expect(log.args.amount).toEqual(expectedRecipient);
      }
      const [dolomiteMarginBalance, recipientBalance] = await Promise.all([
        dolomiteMargin.testing.tokenA.getBalance(dolomiteMarginAddress),
        dolomiteMargin.testing.tokenA.getBalance(recipient),
      ]);
      expect(dolomiteMarginBalance).toEqual(expectedDolomiteMargin);
      expect(recipientBalance).toEqual(expectedRecipient);
    }
  });

  describe('#ownerWithdrawUnsupportedTokens', () => {
    const recipient = ADDRESSES.TEST[1];

    it('Succeeds', async () => {
      const amount = new BigNumber(100);
      await dolomiteMargin.testing.tokenC.issueTo(amount, dolomiteMarginAddress);
      await expectBalances(null, amount, INTEGERS.ZERO);
      txr = await dolomiteMargin.admin.withdrawUnsupportedTokens(dolomiteMargin.testing.tokenC.address, recipient, {
        from: admin,
      });
      await expectBalances(txr, INTEGERS.ZERO, amount);
    });

    it('Succeeds for zero tokens', async () => {
      txr = await dolomiteMargin.admin.withdrawUnsupportedTokens(dolomiteMargin.testing.tokenC.address, recipient, {
        from: admin,
      });
      await expectBalances(txr, INTEGERS.ZERO, INTEGERS.ZERO);
    });

    it('Fails for token with existing market', async () => {
      await expectThrow(
        dolomiteMargin.admin.withdrawUnsupportedTokens(dolomiteMargin.testing.tokenA.address, recipient, {
          from: admin,
        }),
        'AdminImpl: Market exists',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.withdrawUnsupportedTokens(ADDRESSES.TEST[1], recipient, {
          from: nonAdmin,
        }),
      );
    });

    async function expectBalances(txResult: any, expectedDolomiteMargin: Integer, expectedRecipient: Integer) {
      if (txResult) {
        const token = dolomiteMargin.testing.tokenC.address;
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogWithdrawUnsupportedTokens');
        expect(log.args.token).toEqual(token);
        expect(log.args.amount).toEqual(expectedRecipient);
      }
      const [dolomiteMarginBalance, recipientBalance] = await Promise.all([
        dolomiteMargin.testing.tokenC.getBalance(dolomiteMarginAddress),
        dolomiteMargin.testing.tokenC.getBalance(recipient),
      ]);
      expect(dolomiteMarginBalance).toEqual(expectedDolomiteMargin);
      expect(recipientBalance).toEqual(expectedRecipient);
    }
  });

  // ============ Market Functions ============

  describe('#setAccountMaxNumberOfMarketsWithBalances', () => {
    it('Successfully sets value', async () => {
      const txResult = await dolomiteMargin.admin.setAccountMaxNumberOfMarketsWithBalances(100, { from: admin });
      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(1);
      expect(logs[0].name).toEqual('LogSetAccountMaxNumberOfMarketsWithBalances');
      expect(logs[0].args.accountMaxNumberOfMarketsWithBalances).toEqual(new BigNumber('100'));
      expect(await dolomiteMargin.getters.getAccountMaxNumberOfMarketsWithBalances()).toEqual(new BigNumber('100'));
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setAccountMaxNumberOfMarketsWithBalances(
          100,
          { from: nonAdmin },
        ),
      );
    });

    it('Fails for when too low', async () => {
      await expectThrow(
        dolomiteMargin.admin.setAccountMaxNumberOfMarketsWithBalances(
          1,
          { from: admin },
        ),
        'AdminImpl: Acct MaxNumberOfMarkets too low',
      );
    });
  });

  describe('#ownerAddMarket', () => {
    const token = ADDRESSES.TEST[2];

    it('Successfully adds a market', async () => {
      await dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice);

      const marginPremium = new BigNumber('0.11');
      const spreadPremium = new BigNumber('0.22');
      const maxWei = new BigNumber('420');

      const txResult = await dolomiteMargin.admin.addMarket(
        token,
        oracleAddress,
        setterAddress,
        marginPremium,
        spreadPremium,
        maxWei,
        defaultIsClosing,
        defaultIsRecyclable,
        { from: admin },
      );

      const { timestamp } = await dolomiteMargin.web3.eth.getBlock(txResult.blockNumber);

      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      const marketId = numMarkets.minus(1);
      const marketInfo: MarketWithInfo = await dolomiteMargin.getters.getMarketWithInfo(marketId);

      expect(marketInfo.market.token.toLowerCase()).toEqual(token);
      expect(marketInfo.market.priceOracle).toEqual(oracleAddress);
      expect(marketInfo.market.interestSetter).toEqual(setterAddress);
      expect(marketInfo.market.marginPremium).toEqual(marginPremium);
      expect(marketInfo.market.spreadPremium).toEqual(spreadPremium);
      expect(marketInfo.market.maxWei).toEqual(maxWei);
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

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(6);

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

      const maxWeiLog = logs[5];
      expect(maxWeiLog.name).toEqual('LogSetMaxWei');
      expect(maxWeiLog.args.marketId).toEqual(marketId);
      expect(maxWeiLog.args.maxWei).toEqual(maxWei);
    });

    it('Successfully adds a market that is closing and recyclable', async () => {
      const marginPremium = new BigNumber('0.11');
      const spreadPremium = new BigNumber('0.22');
      const maxWei = new BigNumber('420');
      const isClosing = true;
      const isRecyclable = true;

      const underlyingToken = (await new dolomiteMargin.web3.eth.Contract(customTestTokenABI)
        .deploy({
          data: customTestTokenBytecode,
          arguments: ['TestToken', 'TST', '18'],
        })
        .send({ from: admin, gas: '6000000' })) as CustomTestToken;

      const expirationTimestamp = Math.floor(new Date().getTime() / 1000) + 3600;
      const recyclableToken = (await new dolomiteMargin.web3.eth.Contract(recyclableABI)
        .deploy({
          data: recyclableBytecode,
          arguments: [
            dolomiteMargin.address,
            underlyingToken.options.address,
            dolomiteMargin.contracts.expiry.options.address,
            expirationTimestamp,
          ],
        })
        .send({ from: admin, gas: '6000000' })) as TestRecyclableToken;

      await dolomiteMargin.testing.priceOracle.setPrice(recyclableToken.options.address, defaultPrice);

      const txResult = await dolomiteMargin.admin.addMarket(
        recyclableToken.options.address,
        oracleAddress,
        setterAddress,
        marginPremium,
        spreadPremium,
        maxWei,
        isClosing,
        isRecyclable,
        { from: admin },
      );

      const getIsRecycledResult = await recyclableToken.methods.isRecycled().call();
      expect(getIsRecycledResult).toEqual(false);

      const marketIdResult = await recyclableToken.methods.MARKET_ID().call();
      expect(new BigNumber(marketIdResult)).toEqual(new BigNumber(2));

      const { timestamp } = await dolomiteMargin.web3.eth.getBlock(txResult.blockNumber);

      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      const marketId = numMarkets.minus(1);
      const marketInfo: MarketWithInfo = await dolomiteMargin.getters.getMarketWithInfo(marketId);
      const isClosingResult = await dolomiteMargin.getters.getMarketIsClosing(marketId);
      const isRecyclableResult = await dolomiteMargin.getters.getMarketIsRecyclable(marketId);

      expect(marketInfo.market.token.toLowerCase()).toEqual(recyclableToken.options.address.toLowerCase());
      expect(marketInfo.market.priceOracle).toEqual(oracleAddress);
      expect(marketInfo.market.interestSetter).toEqual(setterAddress);
      expect(marketInfo.market.marginPremium).toEqual(marginPremium);
      expect(marketInfo.market.spreadPremium).toEqual(spreadPremium);
      expect(marketInfo.market.maxWei).toEqual(maxWei);
      expect(marketInfo.market.isClosing).toEqual(true);
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
      expect(isClosingResult).toEqual(isClosing);
      expect(isRecyclableResult).toEqual(isRecyclable);

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(7);

      const addLog = logs[0];
      expect(addLog.name).toEqual('LogAddMarket');
      expect(addLog.args.marketId).toEqual(marketId);
      expect(addLog.args.token.toLowerCase()).toEqual(recyclableToken.options.address.toLowerCase());

      const isClosingLog = logs[1];
      expect(isClosingLog.name).toEqual('LogSetIsClosing');
      expect(isClosingLog.args.marketId).toEqual(marketId);
      expect(isClosingLog.args.isClosing).toEqual(isClosing);

      const oracleLog = logs[2];
      expect(oracleLog.name).toEqual('LogSetPriceOracle');
      expect(oracleLog.args.marketId).toEqual(marketId);
      expect(oracleLog.args.priceOracle).toEqual(oracleAddress);

      const setterLog = logs[3];
      expect(setterLog.name).toEqual('LogSetInterestSetter');
      expect(setterLog.args.marketId).toEqual(marketId);
      expect(setterLog.args.interestSetter).toEqual(setterAddress);

      const marginPremiumLog = logs[4];
      expect(marginPremiumLog.name).toEqual('LogSetMarginPremium');
      expect(marginPremiumLog.args.marketId).toEqual(marketId);
      expect(marginPremiumLog.args.marginPremium).toEqual(marginPremium);

      const spreadPremiumLog = logs[5];
      expect(spreadPremiumLog.name).toEqual('LogSetSpreadPremium');
      expect(spreadPremiumLog.args.marketId).toEqual(marketId);
      expect(spreadPremiumLog.args.spreadPremium).toEqual(spreadPremium);

      const maxWeiLog = logs[6];
      expect(maxWeiLog.name).toEqual('LogSetMaxWei');
      expect(maxWeiLog.args.marketId).toEqual(marketId);
      expect(maxWeiLog.args.maxWei).toEqual(maxWei);
    });

    it('Fails to add a recyclable token with an invalid expiration timestamp', async () => {
      const marginPremium = new BigNumber('0.11');
      const spreadPremium = new BigNumber('0.22');
      const maxWei = new BigNumber('420');
      const isClosing = true;
      const isRecyclable = true;

      const underlyingToken = (await new dolomiteMargin.web3.eth.Contract(customTestTokenABI)
        .deploy({
          data: customTestTokenBytecode,
          arguments: ['TestToken', 'TST', '18'],
        })
        .send({ from: admin, gas: '6000000' })) as CustomTestToken;

      const expirationTimestamp = Math.floor(new Date().getTime() / 1000) - 60;
      const recyclableToken = (await new dolomiteMargin.web3.eth.Contract(recyclableABI)
        .deploy({
          data: recyclableBytecode,
          arguments: [
            dolomiteMargin.address,
            underlyingToken.options.address,
            dolomiteMargin.contracts.expiry.options.address,
            expirationTimestamp,
          ],
        })
        .send({ from: admin, gas: '6000000' })) as TestRecyclableToken;

      await dolomiteMargin.testing.priceOracle.setPrice(recyclableToken.options.address, defaultPrice);

      await expectThrow(
        dolomiteMargin.admin.addMarket(
          recyclableToken.options.address,
          oracleAddress,
          setterAddress,
          marginPremium,
          spreadPremium,
          maxWei,
          isClosing,
          isRecyclable,
          { from: admin },
        ),
        `RecyclableTokenProxy: invalid expiration timestamp <${expirationTimestamp}>`,
      );
    });

    it('Fails to add a recyclable market that is not actually recyclable', async () => {
      await dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          defaultMaxWei,
          true,
          true,
          { from: admin },
        ),
        '', // reason is blank because the call to Recyclable#initialize fails
      );
    });

    it('Fails to add a market of the same token', async () => {
      const duplicateToken = dolomiteMargin.testing.tokenA.address;
      await dolomiteMargin.testing.priceOracle.setPrice(duplicateToken, defaultPrice);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          duplicateToken,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          defaultMaxWei,
          defaultIsClosing,
          defaultIsRecyclable,
          { from: admin },
        ),
        'AdminImpl: Market exists',
      );
    });

    it('Fails for broken price', async () => {
      await dolomiteMargin.testing.priceOracle.setPrice(token, invalidPrice);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          defaultMaxWei,
          defaultIsClosing,
          defaultIsRecyclable,
          { from: admin },
        ),
        'AdminImpl: Invalid oracle price',
      );
    });

    it('Fails for broken marginPremium', async () => {
      await Promise.all([
        dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice),
        dolomiteMargin.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          riskLimits.marginPremiumMax.plus(smallestDecimal),
          defaultPremium,
          defaultMaxWei,
          defaultIsClosing,
          defaultIsRecyclable,
          { from: admin },
        ),
        'AdminImpl: Margin premium too high',
      );
    });

    it('Fails for broken spreadPremium', async () => {
      await Promise.all([
        dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice),
        dolomiteMargin.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          riskLimits.spreadPremiumMax.plus(smallestDecimal),
          defaultMaxWei,
          defaultIsClosing,
          defaultIsRecyclable,
          { from: admin },
        ),
        'AdminImpl: Spread premium too high',
      );
    });

    it('Fails for non-admin', async () => {
      await Promise.all([
        dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice),
        dolomiteMargin.testing.interestSetter.setInterestRate(token, defaultRate),
      ]);
      await expectThrow(
        dolomiteMargin.admin.addMarket(
          token,
          oracleAddress,
          setterAddress,
          defaultPremium,
          defaultPremium,
          defaultMaxWei,
          defaultIsClosing,
          defaultIsRecyclable,
          { from: nonAdmin },
        ),
      );
    });
  });

  describe('#ownerRemoveMarkets', () => {
    const token = ADDRESSES.TEST[2];

    async function addMarket(): Promise<{
      recyclableToken: TestRecyclableToken;
      underlyingToken: CustomTestToken;
    }> {
      const marginPremium = INTEGERS.ZERO;
      const spreadPremium = INTEGERS.ZERO;
      const maxWei = INTEGERS.ZERO;
      const isClosing = true;
      const isRecyclable = true;

      const underlyingToken = (await new dolomiteMargin.web3.eth.Contract(customTestTokenABI)
        .deploy({
          data: customTestTokenBytecode,
          arguments: ['TestToken', 'TST', '18'],
        })
        .send({ from: admin, gas: '6000000' })) as CustomTestToken;

      const expirationTimestamp = Math.floor(new Date().getTime() / 1000) + 3600;
      const recyclableToken = (await new dolomiteMargin.web3.eth.Contract(recyclableABI)
        .deploy({
          data: recyclableBytecode,
          arguments: [
            dolomiteMargin.address,
            underlyingToken.options.address,
            dolomiteMargin.contracts.expiry.options.address,
            expirationTimestamp,
          ],
        })
        .send({ from: admin, gas: '6000000' })) as TestRecyclableToken;

      await dolomiteMargin.testing.priceOracle.setPrice(recyclableToken.options.address, defaultPrice);

      await dolomiteMargin.admin.addMarket(
        recyclableToken.options.address,
        oracleAddress,
        setterAddress,
        marginPremium,
        spreadPremium,
        maxWei,
        isClosing,
        isRecyclable,
        { from: admin },
      );

      return { recyclableToken, underlyingToken };
    }

    it('Successfully removes a market that is recyclable', async () => {
      const { recyclableToken, underlyingToken } = await addMarket();
      await addMarket();

      const getIsRecycledResult = await recyclableToken.methods.isRecycled().call();
      expect(getIsRecycledResult).toEqual(false);

      const marketIdResult = await recyclableToken.methods.MARKET_ID().call();
      expect(new BigNumber(marketIdResult)).toEqual(new BigNumber(2));

      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      const marketId = numMarkets.minus(2);
      const isClosingResult = await dolomiteMargin.getters.getMarketIsClosing(marketId);
      const isRecyclableResult = await dolomiteMargin.getters.getMarketIsRecyclable(marketId);

      expect(isClosingResult).toEqual(true);
      expect(isRecyclableResult).toEqual(true);

      await dolomiteMargin.testing.setAccountBalance(
        recyclableToken.options.address,
        INTEGERS.ZERO,
        marketId,
        INTEGERS.ONE,
      );
      await underlyingToken.methods
        .setBalance(recyclableToken.options.address, INTEGERS.ONE.toFixed())
        .send({ from: admin });

      await new EVM(dolomiteMargin.web3.currentProvider).callJsonrpcMethod(
        'evm_increaseTime',
        [3601 + 86400 * 7], // 3600 is the expiration; 86400 * 7 is the buffer time
      );

      const txResult = await dolomiteMargin.admin.removeMarkets([marketId, marketId.plus(1)], admin, {
        from: admin,
      });

      expect(await dolomiteMargin.getters.getNumMarkets()).toEqual(numMarkets);
      expect(await recyclableToken.methods.isRecycled().call()).toEqual(true);
      expect(await underlyingToken.methods.balanceOf(admin).call()).toEqual(INTEGERS.ONE.toFixed());

      await expectThrow(
        dolomiteMargin.contracts.dolomiteMargin.methods.getMarket(marketId.toFixed()).call(),
        'Getters: Invalid market',
      );

      const recyclableMarkets = await dolomiteMargin.getters.getRecyclableMarkets(new BigNumber('10'));
      expect(recyclableMarkets.length).toEqual(10);
      // the linked-list prepends items, reversing their order
      expect(recyclableMarkets[0]).toEqual(new BigNumber('3'));
      expect(recyclableMarkets[1]).toEqual(new BigNumber('2'));
      for (let i = 2; i < recyclableMarkets.length; i += 1) {
        // all values  where `n` is >= the length of the recyclable markets is filled with 0's
        expect(recyclableMarkets[i]).toEqual(INTEGERS.ZERO);
      }

      const logs = dolomiteMargin.logs.parseLogs(txResult);
      expect(logs.length).toEqual(2);

      const removeLog_0 = logs[0];
      expect(removeLog_0.name).toEqual('LogRemoveMarket');
      expect(removeLog_0.args.marketId).toEqual(new BigNumber('2'));
      expect(removeLog_0.args.token.toLowerCase()).toEqual(recyclableToken.options.address.toLowerCase());

      const removeLog_1 = logs[1];
      expect(removeLog_1.name).toEqual('LogRemoveMarket');
      expect(removeLog_1.args.marketId).toEqual(new BigNumber('3'));
    });

    it('Fails to remove a market that is not expired', async () => {
      const { recyclableToken } = await addMarket();

      const getIsRecycledResult = await recyclableToken.methods.isRecycled().call();
      expect(getIsRecycledResult).toEqual(false);

      const expirationTimestamp = await recyclableToken.methods.MAX_EXPIRATION_TIMESTAMP().call();

      const marketIdResult = await recyclableToken.methods.MARKET_ID().call();
      expect(new BigNumber(marketIdResult)).toEqual(new BigNumber(2));

      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      const marketId = numMarkets.minus(1);
      const isClosingResult = await dolomiteMargin.getters.getMarketIsClosing(marketId);
      const isRecyclableResult = await dolomiteMargin.getters.getMarketIsRecyclable(marketId);

      expect(isClosingResult).toEqual(true);
      expect(isRecyclableResult).toEqual(true);

      await dolomiteMargin.testing.setAccountBalance(
        recyclableToken.options.address,
        INTEGERS.ZERO,
        marketId,
        INTEGERS.ONE,
      );

      await new EVM(dolomiteMargin.web3.currentProvider).callJsonrpcMethod('evm_increaseTime', [100]);

      await expectThrow(
        dolomiteMargin.admin.removeMarkets([marketId], admin, {
          from: admin,
        }),
        `AdminImpl: market is not expired <${marketId}, ${expirationTimestamp}>`,
      );
    });

    it('Fails to remove a market that is not past expiration buffer', async () => {
      const { recyclableToken } = await addMarket();

      const getIsRecycledResult = await recyclableToken.methods.isRecycled().call();
      expect(getIsRecycledResult).toEqual(false);

      const expirationTimestamp = await recyclableToken.methods.MAX_EXPIRATION_TIMESTAMP().call();

      const marketIdResult = await recyclableToken.methods.MARKET_ID().call();
      expect(new BigNumber(marketIdResult)).toEqual(new BigNumber(2));

      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      const marketId = numMarkets.minus(1);
      const isClosingResult = await dolomiteMargin.getters.getMarketIsClosing(marketId);
      const isRecyclableResult = await dolomiteMargin.getters.getMarketIsRecyclable(marketId);

      expect(isClosingResult).toEqual(true);
      expect(isRecyclableResult).toEqual(true);

      await dolomiteMargin.testing.setAccountBalance(
        recyclableToken.options.address,
        INTEGERS.ZERO,
        marketId,
        INTEGERS.ONE,
      );

      await new EVM(dolomiteMargin.web3.currentProvider).callJsonrpcMethod('evm_increaseTime', [3600 + 1]);

      await expectThrow(
        dolomiteMargin.admin.removeMarkets([marketId], admin, {
          from: admin,
        }),
        `AdminImpl: expiration must pass buffer <${marketId}, ${expirationTimestamp}>`,
      );
    });

    it('Fails to remove a non-recyclable market', async () => {
      await dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice);
      await expectThrow(
        dolomiteMargin.admin.removeMarkets([INTEGERS.ZERO], admin, { from: admin }),
        'AdminImpl: market is not recyclable <0>',
      );
    });

    it('Fails to remove an invalid market', async () => {
      await dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice);
      await expectThrow(
        dolomiteMargin.admin.removeMarkets([new BigNumber('9999999')], admin, {
          from: admin,
        }),
        'AdminImpl: market does not exist <9999999>',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.removeMarkets([INTEGERS.ZERO], admin, { from: nonAdmin }),
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('#ownerSetIsClosing', () => {
    it('Succeeds', async () => {
      await expectIsClosing(null, false);

      // set to false again
      txr = await dolomiteMargin.admin.setIsClosing(defaultMarket, false, {
        from: admin,
      });
      await expectIsClosing(txr, false);

      // set to true
      txr = await dolomiteMargin.admin.setIsClosing(defaultMarket, true, { from: admin });
      await expectIsClosing(txr, true);

      // set to true again
      txr = await dolomiteMargin.admin.setIsClosing(defaultMarket, true, { from: admin });
      await expectIsClosing(txr, true);

      // set to false
      txr = await dolomiteMargin.admin.setIsClosing(defaultMarket, false, {
        from: admin,
      });
      await expectIsClosing(txr, false);
    });

    it('Fails for invalid market', async () => {
      await expectThrow(
        dolomiteMargin.admin.setIsClosing(invalidMarket, true, { from: admin }),
        `AdminImpl: Invalid market <${invalidMarket.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.setIsClosing(defaultMarket, true, { from: nonAdmin }));
    });

    async function expectIsClosing(txResult: any, b: boolean) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetIsClosing');
        expect(log.args.marketId).toEqual(defaultMarket);
        expect(log.args.isClosing).toEqual(b);
      }
      const isClosing = await dolomiteMargin.getters.getMarketIsClosing(defaultMarket);
      expect(isClosing).toEqual(b);
    }
  });

  describe('#ownerSetPriceOracle', () => {
    it('Succeeds', async () => {
      const token = await dolomiteMargin.getters.getMarketTokenAddress(defaultMarket);
      await dolomiteMargin.testing.priceOracle.setPrice(token, defaultPrice);
      txr = await dolomiteMargin.admin.setPriceOracle(defaultMarket, oracleAddress, {
        from: admin,
      });
      const logs = dolomiteMargin.logs.parseLogs(txr);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSetPriceOracle');
      expect(log.args.marketId).toEqual(defaultMarket);
      expect(log.args.priceOracle).toEqual(oracleAddress);
    });

    it('Fails for broken price', async () => {
      const token = await dolomiteMargin.getters.getMarketTokenAddress(defaultMarket);
      await dolomiteMargin.testing.priceOracle.setPrice(token, invalidPrice);
      await expectThrow(
        dolomiteMargin.admin.setPriceOracle(defaultMarket, oracleAddress, {
          from: admin,
        }),
        'AdminImpl: Invalid oracle price',
      );
    });

    it('Fails for contract without proper function', async () => {
      await expectThrow(
        dolomiteMargin.admin.setPriceOracle(defaultMarket, setterAddress, {
          from: admin,
        }),
      );
    });

    it('Fails for invalid market', async () => {
      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      await expectThrow(
        dolomiteMargin.admin.setPriceOracle(numMarkets, setterAddress, { from: admin }),
        `AdminImpl: Invalid market <${numMarkets.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setPriceOracle(defaultMarket, oracleAddress, {
          from: nonAdmin,
        }),
      );
    });
  });

  describe('#ownerSetInterestSetter', () => {
    it('Succeeds', async () => {
      const token = await dolomiteMargin.getters.getMarketTokenAddress(defaultMarket);
      await dolomiteMargin.testing.interestSetter.setInterestRate(token, defaultRate);
      txr = await dolomiteMargin.admin.setInterestSetter(defaultMarket, setterAddress, {
        from: admin,
      });
      const logs = dolomiteMargin.logs.parseLogs(txr);
      expect(logs.length).toEqual(1);
      const log = logs[0];
      expect(log.name).toEqual('LogSetInterestSetter');
      expect(log.args.marketId).toEqual(defaultMarket);
      expect(log.args.interestSetter).toEqual(setterAddress);
    });

    it('Fails for contract without proper function', async () => {
      await expectThrow(
        dolomiteMargin.admin.setInterestSetter(defaultMarket, oracleAddress, {
          from: admin,
        }),
      );
    });

    it('Fails for invalid market', async () => {
      const numMarkets = await dolomiteMargin.getters.getNumMarkets();
      await expectThrow(
        dolomiteMargin.admin.setInterestSetter(numMarkets, setterAddress, {
          from: admin,
        }),
        `AdminImpl: Invalid market <${numMarkets.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setInterestSetter(defaultMarket, setterAddress, {
          from: nonAdmin,
        }),
      );
    });
  });

  describe('#ownerSetMarginPremium', () => {
    it('Succeeds', async () => {
      await expectMarginPremium(null, defaultPremium);

      // set to default
      txr = await dolomiteMargin.admin.setMarginPremium(defaultMarket, defaultPremium, {
        from: admin,
      });
      await expectMarginPremium(txr, defaultPremium);

      // set risky
      txr = await dolomiteMargin.admin.setMarginPremium(defaultMarket, highPremium, {
        from: admin,
      });
      await expectMarginPremium(txr, highPremium);

      // set to risky again
      txr = await dolomiteMargin.admin.setMarginPremium(defaultMarket, highPremium, {
        from: admin,
      });
      await expectMarginPremium(txr, highPremium);

      // set back to default
      txr = await dolomiteMargin.admin.setMarginPremium(defaultMarket, defaultPremium, {
        from: admin,
      });
      await expectMarginPremium(txr, defaultPremium);
    });

    it('Fails for invalid market', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMarginPremium(invalidMarket, highPremium, {
          from: admin,
        }),
        `AdminImpl: Invalid market <${invalidMarket.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMarginPremium(defaultMarket, highPremium, {
          from: nonAdmin,
        }),
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMarginPremium(defaultMarket, riskLimits.marginPremiumMax.plus(smallestDecimal), {
          from: admin,
        }),
        'AdminImpl: Margin premium too high',
      );
    });

    async function expectMarginPremium(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMarginPremium');
        expect(log.args.marginPremium).toEqual(e);
      }
      const premium = await dolomiteMargin.getters.getMarketMarginPremium(defaultMarket);
      expect(premium).toEqual(e);
    }
  });

  describe('#ownerSetSpreadPremium', () => {
    it('Succeeds', async () => {
      await expectSpreadPremium(null, defaultPremium);

      // set to default
      txr = await dolomiteMargin.admin.setSpreadPremium(defaultMarket, defaultPremium, {
        from: admin,
      });
      await expectSpreadPremium(txr, defaultPremium);

      // set risky
      txr = await dolomiteMargin.admin.setSpreadPremium(defaultMarket, highPremium, {
        from: admin,
      });
      await expectSpreadPremium(txr, highPremium);

      // set to risky again
      txr = await dolomiteMargin.admin.setSpreadPremium(defaultMarket, highPremium, {
        from: admin,
      });
      await expectSpreadPremium(txr, highPremium);

      // set back to default
      txr = await dolomiteMargin.admin.setSpreadPremium(defaultMarket, defaultPremium, {
        from: admin,
      });
      await expectSpreadPremium(txr, defaultPremium);
    });

    it('Succeeds for two markets', async () => {
      const premium1 = new BigNumber('0.2');
      const premium2 = new BigNumber('0.3');

      await Promise.all([
        dolomiteMargin.admin.setSpreadPremium(defaultMarket, premium1, { from: admin }),
        dolomiteMargin.admin.setSpreadPremium(secondaryMarket, premium2, { from: admin }),
      ]);

      const result = await dolomiteMargin.getters.getLiquidationSpreadForPair(defaultMarket, secondaryMarket);

      const expected = riskParams.liquidationSpread.times(premium1.plus(1)).times(premium2.plus(1));
      expect(result).toEqual(expected);
    });

    it('Fails for invalid market', async () => {
      await expectThrow(
        dolomiteMargin.admin.setSpreadPremium(invalidMarket, highPremium, {
          from: admin,
        }),
        `AdminImpl: Invalid market <${invalidMarket.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setSpreadPremium(defaultMarket, highPremium, {
          from: nonAdmin,
        }),
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setSpreadPremium(defaultMarket, riskLimits.spreadPremiumMax.plus(smallestDecimal), {
          from: admin,
        }),
        'AdminImpl: Spread premium too high',
      );
    });

    async function expectSpreadPremium(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetSpreadPremium');
        expect(log.args.spreadPremium).toEqual(e);
      }
      const premium = await dolomiteMargin.getters.getMarketSpreadPremium(defaultMarket);
      expect(premium).toEqual(e);
    }
  });

  describe('#ownerSetMaxWei', () => {
    it('Succeeds', async () => {
      await expectMaxWei(null, defaultMaxWei);

      // set to default
      txr = await dolomiteMargin.admin.setMaxWei(defaultMarket, defaultMaxWei, {
        from: admin,
      });
      await expectMaxWei(txr, defaultMaxWei);

      // set less risky
      txr = await dolomiteMargin.admin.setMaxWei(defaultMarket, highMaxWei, {
        from: admin,
      });
      await expectMaxWei(txr, highMaxWei);

      // set to risky again
      txr = await dolomiteMargin.admin.setMaxWei(defaultMarket, highMaxWei, {
        from: admin,
      });
      await expectMaxWei(txr, highMaxWei);

      // set back to default
      txr = await dolomiteMargin.admin.setMaxWei(defaultMarket, defaultMaxWei, {
        from: admin,
      });
      await expectMaxWei(txr, defaultMaxWei);
    });

    it('Succeeds for two markets', async () => {
      const maxWei1 = new BigNumber('200e18');
      const maxWei2 = new BigNumber('300e18');

      const [result1, result2] = await Promise.all([
        dolomiteMargin.admin.setMaxWei(defaultMarket, maxWei1, { from: admin }),
        dolomiteMargin.admin.setMaxWei(secondaryMarket, maxWei2, { from: admin }),
      ]);

      await expectMaxWei(result1, maxWei1, defaultMarket);
      await expectMaxWei(result2, maxWei2, secondaryMarket);
    });

    it('Fails for invalid market', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMaxWei(invalidMarket, highPremium, {
          from: admin,
        }),
        `AdminImpl: Invalid market <${invalidMarket.toFixed()}>`,
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMaxWei(defaultMarket, highPremium, {
          from: nonAdmin,
        }),
      );
    });

    async function expectMaxWei(txResult: any, e: Integer, market: Integer = defaultMarket) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMaxWei');
        expect(log.args.maxWei).toEqual(e);
      }
      const maxWei = await dolomiteMargin.getters.getMarketMaxWei(market);
      expect(maxWei).toEqual(e);
    }
  });

  // ============ Risk Functions ============

  describe('#ownerSetMarginRatio', () => {
    it('Succeeds', async () => {
      await expectMarginRatio(null, riskParams.marginRatio);

      // keep same
      txr = await dolomiteMargin.admin.setMarginRatio(riskParams.marginRatio, {
        from: admin,
      });
      await expectMarginRatio(txr, riskParams.marginRatio);

      // set to max
      txr = await dolomiteMargin.admin.setMarginRatio(riskLimits.marginRatioMax, {
        from: admin,
      });
      await expectMarginRatio(txr, riskLimits.marginRatioMax);

      // set back to original
      txr = await dolomiteMargin.admin.setMarginRatio(riskParams.marginRatio, {
        from: admin,
      });
      await expectMarginRatio(txr, riskParams.marginRatio);
    });

    it('Fails for value <= spread', async () => {
      // setup
      const error = 'AdminImpl: Ratio cannot be <= spread';
      const liquidationSpread = smallestDecimal.times(10);
      await dolomiteMargin.admin.setLiquidationSpread(liquidationSpread, { from: admin });

      // passes when above the spread
      txr = await dolomiteMargin.admin.setMarginRatio(liquidationSpread.plus(smallestDecimal), { from: admin });
      await expectMarginRatio(txr, liquidationSpread.plus(smallestDecimal));

      // revert when equal to the spread
      await expectThrow(dolomiteMargin.admin.setMarginRatio(liquidationSpread, { from: admin }), error);

      // revert when below the spread
      await expectThrow(
        dolomiteMargin.admin.setMarginRatio(liquidationSpread.minus(smallestDecimal), {
          from: admin,
        }),
        error,
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMarginRatio(riskLimits.marginRatioMax.plus(smallestDecimal), { from: admin }),
        'AdminImpl: Ratio too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.setMarginRatio(riskParams.marginRatio, { from: nonAdmin }));
    });

    async function expectMarginRatio(txResult: any, e: Integer) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMarginRatio');
        expect(log.args.marginRatio).toEqual(e);
      }
      const result = await dolomiteMargin.getters.getMarginRatio();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetLiquidationSpread', () => {
    it('Succeeds', async () => {
      // setup
      await dolomiteMargin.admin.setMarginRatio(riskLimits.marginRatioMax, {
        from: admin,
      });
      await expectLiquidationSpread(null, riskParams.liquidationSpread);

      // keep same
      txr = await dolomiteMargin.admin.setLiquidationSpread(riskParams.liquidationSpread, { from: admin });
      await expectLiquidationSpread(txr, riskParams.liquidationSpread);

      // set to max
      txr = await dolomiteMargin.admin.setLiquidationSpread(riskLimits.liquidationSpreadMax, { from: admin });
      await expectLiquidationSpread(txr, riskLimits.liquidationSpreadMax);

      // set back to original
      txr = await dolomiteMargin.admin.setLiquidationSpread(riskParams.liquidationSpread, { from: admin });
      await expectLiquidationSpread(txr, riskParams.liquidationSpread);
    });

    it('Fails for value >= ratio', async () => {
      // setup
      const error = 'AdminImpl: Spread cannot be >= ratio';
      const marginRatio = new BigNumber('0.1');
      await dolomiteMargin.admin.setMarginRatio(marginRatio, { from: admin });

      // passes when below the ratio
      txr = await dolomiteMargin.admin.setLiquidationSpread(marginRatio.minus(smallestDecimal), { from: admin });
      await expectLiquidationSpread(txr, marginRatio.minus(smallestDecimal));

      // reverts when equal to the ratio
      await expectThrow(dolomiteMargin.admin.setLiquidationSpread(marginRatio, { from: admin }), error);

      // reverts when above the ratio
      await expectThrow(
        dolomiteMargin.admin.setLiquidationSpread(marginRatio.plus(smallestDecimal), {
          from: admin,
        }),
        error,
      );
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setLiquidationSpread(riskLimits.liquidationSpreadMax.plus(smallestDecimal), {
          from: admin,
        }),
        'AdminImpl: Spread too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setLiquidationSpread(riskParams.liquidationSpread, {
          from: nonAdmin,
        }),
      );
    });

    async function expectLiquidationSpread(txResult: any, e: Integer) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetLiquidationSpread');
        expect(log.args.liquidationSpread).toEqual(e);
      }
      const result = await dolomiteMargin.getters.getLiquidationSpread();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetEarningsRate', () => {
    it('Succeeds', async () => {
      await expectEarningsRate(null, riskParams.earningsRate);

      // keep same
      txr = await dolomiteMargin.admin.setEarningsRate(riskParams.earningsRate, {
        from: admin,
      });
      await expectEarningsRate(txr, riskParams.earningsRate);

      // set to max
      txr = await dolomiteMargin.admin.setEarningsRate(riskLimits.earningsRateMax, {
        from: admin,
      });
      await expectEarningsRate(txr, riskLimits.earningsRateMax);

      // set back to original
      txr = await dolomiteMargin.admin.setEarningsRate(riskParams.earningsRate, {
        from: admin,
      });
      await expectEarningsRate(txr, riskParams.earningsRate);
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setEarningsRate(riskLimits.earningsRateMax.plus(tenToNeg18), { from: admin }),
        'AdminImpl: Rate too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.setEarningsRate(riskParams.earningsRate, { from: nonAdmin }));
    });

    const tenToNeg18 = '0.000000000000000001';

    async function expectEarningsRate(txResult: any, e: Decimal) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetEarningsRate');
        expect(log.args.earningsRate).toEqual(e);
      }
      const result = await dolomiteMargin.getters.getEarningsRate();
      expect(result).toEqual(e);
    }
  });

  describe('#ownerSetMinBorrowedValue', () => {
    it('Succeeds', async () => {
      await expectMinBorrowedValue(null, riskParams.minBorrowedValue);

      // keep same
      txr = await dolomiteMargin.admin.setMinBorrowedValue(riskParams.minBorrowedValue, {
        from: admin,
      });
      await expectMinBorrowedValue(txr, riskParams.minBorrowedValue);

      // set to max
      txr = await dolomiteMargin.admin.setMinBorrowedValue(riskLimits.minBorrowedValueMax, { from: admin });
      await expectMinBorrowedValue(txr, riskLimits.minBorrowedValueMax);

      // set back to original
      txr = await dolomiteMargin.admin.setMinBorrowedValue(riskParams.minBorrowedValue, {
        from: admin,
      });
      await expectMinBorrowedValue(txr, riskParams.minBorrowedValue);
    });

    it('Fails for too-high value', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMinBorrowedValue(riskLimits.minBorrowedValueMax.plus(1), {
          from: admin,
        }),
        'AdminImpl: Value too high',
      );
    });

    it('Fails for non-admin', async () => {
      await expectThrow(
        dolomiteMargin.admin.setMinBorrowedValue(riskParams.minBorrowedValue, {
          from: nonAdmin,
        }),
      );
    });

    async function expectMinBorrowedValue(txResult: any, e: Integer) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetMinBorrowedValue');
        expect(log.args.minBorrowedValue).toEqual(e);
      }
      const result = await dolomiteMargin.getters.getMinBorrowedValue();
      expect(result).toEqual(e);
    }
  });

  // ============ Global Operator Functions ============

  describe('#ownerSetGlobalOperator', () => {
    it('Succeeds', async () => {
      await expectGlobalOperatorToBe(null, false);
      txr = await dolomiteMargin.admin.setGlobalOperator(operator, false, {
        from: admin,
      });
      await expectGlobalOperatorToBe(txr, false);
      txr = await dolomiteMargin.admin.setGlobalOperator(operator, true, { from: admin });
      await expectGlobalOperatorToBe(txr, true);
      txr = await dolomiteMargin.admin.setGlobalOperator(operator, true, { from: admin });
      await expectGlobalOperatorToBe(txr, true);
      txr = await dolomiteMargin.admin.setGlobalOperator(operator, false, {
        from: admin,
      });
      await expectGlobalOperatorToBe(txr, false);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.setGlobalOperator(operator, true, { from: nonAdmin }));
    });

    async function expectGlobalOperatorToBe(txResult: any, b: boolean) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetGlobalOperator');
        expect(log.args.operator).toEqual(operator);
        expect(log.args.approved).toEqual(b);
      }
      const result = await dolomiteMargin.getters.getIsGlobalOperator(operator);
      expect(result).toEqual(b);
    }
  });

  describe('#ownerSetAutoTraderSpecial', () => {
    it('Succeeds', async () => {
      await expectAutoTraderSpecialToBe(null, false);
      txr = await dolomiteMargin.admin.setAutoTraderIsSpecial(operator, false, { from: admin });
      await expectAutoTraderSpecialToBe(txr, false);
      txr = await dolomiteMargin.admin.setAutoTraderIsSpecial(operator, true, { from: admin });
      await expectAutoTraderSpecialToBe(txr, true);
      txr = await dolomiteMargin.admin.setAutoTraderIsSpecial(operator, true, { from: admin });
      await expectAutoTraderSpecialToBe(txr, true);
      txr = await dolomiteMargin.admin.setAutoTraderIsSpecial(operator, false, { from: admin });
      await expectAutoTraderSpecialToBe(txr, false);
    });

    it('Fails for non-admin', async () => {
      await expectThrow(dolomiteMargin.admin.setAutoTraderIsSpecial(operator, true, { from: nonAdmin }));
    });

    async function expectAutoTraderSpecialToBe(txResult: any, b: boolean) {
      if (txResult) {
        const logs = dolomiteMargin.logs.parseLogs(txResult);
        expect(logs.length).toEqual(1);
        const log = logs[0];
        expect(log.name).toEqual('LogSetAutoTraderIsSpecial');
        expect(log.args.autoTrader).toEqual(operator);
        expect(log.args.isSpecial).toEqual(b);
      }
      const result = await dolomiteMargin.getters.getIsAutoTraderSpecial(operator);
      expect(result).toEqual(b);
    }
  });

  // ============ Other ============

  describe('Logs', () => {
    it('Skips logs when necessary', async () => {
      txr = await dolomiteMargin.admin.setGlobalOperator(operator, false, {
        from: admin,
      });
      const logs = dolomiteMargin.logs.parseLogs(txr, { skipAdminLogs: true });
      expect(logs.length).toEqual(0);
    });
  });
});
