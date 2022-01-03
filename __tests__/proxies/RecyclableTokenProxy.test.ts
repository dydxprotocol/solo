import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import {
  address,
  Amount,
  AmountDenomination,
  AmountReference,
  Integer,
  TxResult,
} from '../../src/types';

import {
  abi as recyclableABI,
  bytecode as recyclableBytecode,
} from '../../build/contracts/RecyclableTokenProxy.json';
import {
  abi as customTestTokenABI,
  bytecode as customTestTokenBytecode,
} from '../../build/contracts/CustomTestToken.json';
import {
  abi as testTraderABI,
  bytecode as testTraderBytecode,
} from '../../build/contracts/TestTrader.json';

import { CustomTestToken } from '../../build/testing_wrappers/CustomTestToken';
import { TestRecyclableToken } from '../../build/testing_wrappers/TestRecyclableToken';
import { TestTrader } from '../../build/testing_wrappers/TestTrader';
import { expectThrow } from '../../src/lib/Expect';
import { toBytes } from '../../src/lib/BytesHelper';

let solo: TestSolo;
let accounts: address[];
let admin: address;
let user: address;
let liquidator: address;
let oracleAddress: address;
let setterAddress: address;
let borrowTokenAddress: address;
let customToken: CustomTestToken;
let recyclableToken: TestRecyclableToken;
let testTrader: TestTrader;
let marketId: Integer;

const borrowMarketId: Integer = INTEGERS.ZERO;
const defaultPrice = new BigNumber('1e36');

const expirationTimestamp = new Date().getTime() / 1000;
const defaultIsOpen = true;

describe('RecyclableTokenProxy', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    user = accounts[2];
    liquidator = accounts[3];
    expect(admin).not.toEqual(user);

    await resetEVM();

    await Promise.all([setupMarkets(solo, accounts, 3)]);

    oracleAddress = solo.testing.priceOracle.getAddress();
    setterAddress = solo.testing.interestSetter.getAddress();

    const {
      recyclableToken: _recyclableToken,
      customToken: _customToken,
    } = await addMarket();
    recyclableToken = _recyclableToken;
    customToken = _customToken;
    marketId = new BigNumber(await recyclableToken.methods.MARKET_ID().call());
    borrowTokenAddress = await solo.getters.getMarketTokenAddress(
      borrowMarketId,
    );

    const borrowToken = new solo.web3.eth.Contract(
      customTestTokenABI,
      borrowTokenAddress,
    ) as CustomTestToken;
    await borrowToken.methods
      .setBalance(solo.contracts.soloMargin.options.address, '1000000')
      .send({
        from: admin,
        gas: '100000',
      });

    // set the price to be 100 times less than the recyclable price.
    await solo.testing.priceOracle.setPrice(borrowTokenAddress, defaultPrice);

    testTrader = (await new solo.web3.eth.Contract(testTraderABI)
      .deploy({
        data: testTraderBytecode,
        arguments: [solo.contracts.soloMargin.options.address],
      })
      .send({ from: admin, gas: '6000000' })) as TestTrader;

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  // ============ Token Functions ============

  describe('#getAccountNumber', () => {
    it('Successfully deposits into Solo', async () => {
      const _number = 1;
      const account = { owner: user, number: _number };
      const accountNumber = await recyclableToken.methods
        .getAccountNumber(account)
        .call();
      const created = solo.web3.utils.keccak256(
        solo.web3.eth.abi.encodeParameters(
          ['address', 'uint256'],
          [user, _number],
        ),
      );
      expect(accountNumber).toEqual(solo.web3.utils.hexToNumberString(created));
    });
  });

  describe('#depositIntoSolo', () => {
    it('Successfully deposits into Solo', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 0;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(balance),
      );
    });

    it('Successfully deposits into Solo with random account number', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 132;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(balance),
      );
    });

    it('Fails to deposit when recycled', async () => {
      const accountNumber = 132;
      const balance = 100;
      await removeMarket(marketId, recyclableToken.options.address);
      await expectThrow(
        recyclableToken.methods.depositIntoSolo(accountNumber, balance).send({
          from: user,
          gas: '1000000',
        }),
        'RecyclableTokenProxy: cannot deposit when recycled',
      );
    });

    it('Fails to deposit when approval is not set for underlying token with recyclable spender', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 132;
      const balance = 100;
      await customToken.methods.setBalance(user, balance).send(tx);
      await expectThrow(
        recyclableToken.methods
          .depositIntoSolo(accountNumber, balance)
          .send(tx),
        'SafeERC20: low-level call failed',
      );
    });
  });

  describe('#withdrawFromSolo', () => {
    it('Successfully withdraws from Solo', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 0;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      await recyclableToken.methods
        .withdrawFromSolo(accountNumber, balance - 10)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(10),
      );
      expect(await customToken.methods.balanceOf(user).call()).toEqual(
        (balance - 10).toString(),
      );
    });

    it('Fails to withdraw when in recycled state', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 132;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      await removeMarket(marketId, recyclableToken.options.address);
      await expectThrow(
        recyclableToken.methods
          .withdrawFromSolo(accountNumber, balance)
          .send(tx),
        'RecyclableTokenProxy: cannot withdraw when recycled',
      );
    });
  });

  describe('#withdrawAfterRecycle', () => {
    it('Successfully withdraws when in recycled state', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 0;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      await removeMarket(marketId, recyclableToken.options.address);
      expect(await customToken.methods.balanceOf(user).call()).toEqual('0');
      await recyclableToken.methods
        .withdrawAfterRecycle(accountNumber)
        .send(tx);
      expect(await customToken.methods.balanceOf(user).call()).toEqual(
        balance.toString(),
      );
    });

    it('Fails to withdraw twice to the same address in a recycled state', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 0;
      const balance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, balance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, balance)
        .send(tx);
      await removeMarket(marketId, recyclableToken.options.address);
      expect(await customToken.methods.balanceOf(user).call()).toEqual('0');
      await recyclableToken.methods
        .withdrawAfterRecycle(accountNumber)
        .send(tx);
      expect(await customToken.methods.balanceOf(user).call()).toEqual(
        balance.toString(),
      );
      await expectThrow(
        recyclableToken.methods.withdrawAfterRecycle(accountNumber).send(tx),
        'RecyclableTokenProxy: user already withdrew',
      );
    });

    it('Fails to withdraw when not in recycled state', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 0;
      await expectThrow(
        recyclableToken.methods.withdrawAfterRecycle(accountNumber).send(tx),
        'RecyclableTokenProxy: not recycled yet',
      );
    });
  });

  describe('#trade', () => {
    it('Successfully trades with test wrapper', async () => {
      const tx = {
        from: user,
        gas: '4000000',
      };
      const accountNumber = 0;
      const supplyBalance = 100;
      const borrowBalance = 20;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, supplyBalance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, supplyBalance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(supplyBalance),
      );
      expect(
        await getOwnerBalance(user, accountNumber, borrowMarketId),
      ).toEqual(INTEGERS.ZERO);

      await recyclableToken.methods
        .trade(
          accountNumber,
          supplyBalance,
          borrowTokenAddress,
          borrowBalance,
          testTrader.options.address,
          expirationTimestamp,
          defaultIsOpen,
          toBytes(supplyBalance, borrowBalance),
        )
        .send(tx);

      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(supplyBalance + supplyBalance),
      );
      expect(
        await getOwnerBalance(user, accountNumber, borrowMarketId),
      ).toEqual(new BigNumber(-borrowBalance));
    });

    it('Fails to trade when in recycled state', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const accountNumber = 132;
      const supplyBalance = 100;
      await removeMarket(marketId, recyclableToken.options.address);
      const borrowBalance = supplyBalance / 10;
      await expectThrow(
        recyclableToken.methods
          .trade(
            accountNumber,
            supplyBalance,
            borrowTokenAddress,
            borrowBalance,
            testTrader.options.address,
            expirationTimestamp,
            defaultIsOpen,
            toBytes(supplyBalance, borrowBalance),
          )
          .send(tx),
        'RecyclableTokenProxy: cannot trade when recycled',
      );
    });

    it('Fails to trade when position would be under collateralized', async () => {
      const tx = {
        from: user,
        gas: '1000000',
      };
      const outerAccountNumber = 132;
      const innerAccountNumber = await recyclableToken.methods
        .getAccountNumber({
          owner: user,
          number: outerAccountNumber,
        })
        .call();
      const supplyBalance = 100;
      const borrowBalance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, supplyBalance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(outerAccountNumber, supplyBalance)
        .send(tx);
      await expectThrow(
        recyclableToken.methods
          .trade(
            outerAccountNumber,
            supplyBalance,
            borrowTokenAddress,
            borrowBalance,
            testTrader.options.address,
            expirationTimestamp,
            defaultIsOpen,
            toBytes(supplyBalance / 10, borrowBalance),
          )
          .send(tx),
        `OperationImpl: Undercollateralized account <${recyclableToken.options.address.toLowerCase()}, ${innerAccountNumber}>`,
      );
    });
  });

  describe('#liquidate', () => {
    it('Successfully liquidates when a user is undercollateralized and liquidator withdraws', async () => {
      const tx = {
        from: user,
        gas: '4000000',
      };
      const accountNumber = 0;
      const supplyBalance = 100;
      const borrowBalance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, supplyBalance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, supplyBalance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(supplyBalance),
      );
      expect(
        await getOwnerBalance(user, accountNumber, borrowMarketId),
      ).toEqual(INTEGERS.ZERO);

      await recyclableToken.methods
        .trade(
          accountNumber,
          supplyBalance,
          borrowTokenAddress,
          borrowBalance,
          testTrader.options.address,
          expirationTimestamp,
          defaultIsOpen,
          toBytes(supplyBalance, borrowBalance),
        )
        .send(tx);

      await solo.testing.priceOracle.setPrice(
        borrowTokenAddress,
        new BigNumber('1740000000000000000000000000000000000'),
      );

      await solo.testing.setAccountBalance(
        liquidator,
        INTEGERS.ZERO,
        borrowMarketId,
        new BigNumber(borrowBalance),
        { from: liquidator, gas: '4000000' },
      );

      const liquidAccountId = await recyclableToken.methods
        .getAccountNumber({
          owner: user,
          number: accountNumber,
        })
        .call();

      const defaultAmount: Amount = {
        value: INTEGERS.ZERO,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      };

      // Only global operators can be liquidators
      await solo.admin.setGlobalOperator(liquidator, true, {
        from: admin,
        gas: '1000000',
      });

      await solo.operation
        .initiate()
        .liquidate({
          primaryAccountOwner: liquidator,
          primaryAccountId: INTEGERS.ZERO,
          liquidMarketId: borrowMarketId,
          payoutMarketId: marketId,
          liquidAccountOwner: recyclableToken.options.address,
          liquidAccountId: new BigNumber(liquidAccountId),
          amount: defaultAmount,
        })
        .withdraw({
          marketId,
          primaryAccountOwner: liquidator,
          primaryAccountId: INTEGERS.ZERO,
          amount: defaultAmount,
          to: liquidator,
        })
        .commit({ from: liquidator, gas: '4000000' });
    });

    it('Fails to liquidate if the liquidator keeps the collateral in Solo', async () => {
      const tx = {
        from: user,
        gas: '4000000',
      };
      const accountNumber = 0;
      const supplyBalance = 100;
      const borrowBalance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, supplyBalance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, supplyBalance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(supplyBalance),
      );
      expect(
        await getOwnerBalance(user, accountNumber, borrowMarketId),
      ).toEqual(INTEGERS.ZERO);

      await recyclableToken.methods
        .trade(
          accountNumber,
          supplyBalance,
          borrowTokenAddress,
          borrowBalance,
          testTrader.options.address,
          expirationTimestamp,
          defaultIsOpen,
          toBytes(supplyBalance, borrowBalance)
        )
        .send(tx);

      await solo.testing.priceOracle.setPrice(
        borrowTokenAddress,
        new BigNumber('1740000000000000000000000000000000000'),
      );

      await solo.testing.setAccountBalance(
        liquidator,
        INTEGERS.ZERO,
        borrowMarketId,
        new BigNumber(borrowBalance),
        { from: liquidator, gas: '4000000' },
      );

      const liquidAccountId = await recyclableToken.methods
        .getAccountNumber({
          owner: user,
          number: accountNumber,
        })
        .call();

      const defaultAmount: Amount = {
        value: INTEGERS.ZERO,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      };

      // Only global operators can be liquidators
      await solo.admin.setGlobalOperator(liquidator, true, {
        from: admin,
        gas: '1000000',
      });

      await expectThrow(
        solo.operation
          .initiate()
          .liquidate({
            primaryAccountOwner: liquidator,
            primaryAccountId: INTEGERS.ZERO,
            liquidMarketId: borrowMarketId,
            payoutMarketId: marketId,
            liquidAccountOwner: recyclableToken.options.address,
            liquidAccountId: new BigNumber(liquidAccountId),
            amount: defaultAmount,
          })
          .commit({ from: liquidator, gas: '4000000' }),
        `OperationImpl: invalid recyclable owner <${liquidator.toLowerCase()}, 0, ${marketId}>`,
      );
    });

    it('Fails to liquidate when in recycled state', async () => {
      const tx = {
        from: user,
        gas: '4000000',
      };
      const accountNumber = 0;
      const supplyBalance = 100;
      const borrowBalance = 100;
      await customToken.methods
        .approve(recyclableToken.options.address, INTEGERS.MAX_UINT.toFixed())
        .send(tx);
      await customToken.methods.setBalance(user, supplyBalance).send(tx);
      await recyclableToken.methods
        .depositIntoSolo(accountNumber, supplyBalance)
        .send(tx);
      expect(await getOwnerBalance(user, accountNumber, marketId)).toEqual(
        new BigNumber(supplyBalance),
      );
      expect(
        await getOwnerBalance(user, accountNumber, borrowMarketId),
      ).toEqual(INTEGERS.ZERO);

      await recyclableToken.methods
        .trade(
          accountNumber,
          supplyBalance,
          borrowTokenAddress,
          borrowBalance,
          testTrader.options.address,
          expirationTimestamp,
          defaultIsOpen,
          toBytes(supplyBalance, borrowBalance)
        )
        .send(tx);

      await solo.admin.removeMarkets(
        [marketId],
        recyclableToken.options.address,
        { from: admin, gas: '1000000' },
      );

      await solo.testing.priceOracle.setPrice(
        borrowTokenAddress,
        new BigNumber('1740000000000000000000000000000000000'),
      );

      await solo.testing.setAccountBalance(
        liquidator,
        INTEGERS.ZERO,
        borrowMarketId,
        new BigNumber(borrowBalance),
        { from: liquidator, gas: '4000000' },
      );

      const liquidAccountId = await recyclableToken.methods
        .getAccountNumber({
          owner: user,
          number: accountNumber,
        })
        .call();

      const defaultAmount: Amount = {
        value: INTEGERS.ZERO,
        denomination: AmountDenomination.Principal,
        reference: AmountReference.Target,
      };

      // Only global operators can be liquidators
      await solo.admin.setGlobalOperator(liquidator, true, {
        from: admin,
        gas: '1000000',
      });

      await expectThrow(
        solo.operation
          .initiate()
          .liquidate({
            primaryAccountOwner: liquidator,
            primaryAccountId: INTEGERS.ZERO,
            liquidMarketId: borrowMarketId,
            payoutMarketId: marketId,
            liquidAccountOwner: recyclableToken.options.address,
            liquidAccountId: new BigNumber(liquidAccountId),
            amount: defaultAmount,
          })
          .withdraw({
            marketId,
            primaryAccountOwner: liquidator,
            primaryAccountId: INTEGERS.ZERO,
            amount: defaultAmount,
            to: liquidator,
          })
          .commit({ from: liquidator, gas: '4000000' }),
        'some error',
      );
    });
  });

  // ============ Private Functions ============

  async function addMarket(): Promise<{
    recyclableToken: TestRecyclableToken;
    customToken: CustomTestToken;
  }> {
    const marginPremium = INTEGERS.ZERO;
    const spreadPremium = INTEGERS.ZERO;
    const isClosing = true;
    const isRecyclable = true;

    const underlyingToken = (await new solo.web3.eth.Contract(
      customTestTokenABI,
    )
      .deploy({
        data: customTestTokenBytecode,
        arguments: ['TestToken', 'TEST', '18'],
      })
      .send({ from: admin, gas: '6000000' })) as CustomTestToken;

    const recyclableToken = (await new solo.web3.eth.Contract(recyclableABI)
      .deploy({
        data: recyclableBytecode,
        arguments: [
          solo.contracts.soloMargin.options.address,
          underlyingToken.options.address,
          solo.contracts.expiryV2.options.address,
          (new Date().getTime() / 1000) + 86400,
        ],
      })
      .send({ from: admin, gas: '6000000' })) as TestRecyclableToken;

    await solo.testing.priceOracle.setPrice(
      recyclableToken.options.address,
      defaultPrice,
    );

    await solo.admin.addMarket(
      recyclableToken.options.address,
      oracleAddress,
      setterAddress,
      marginPremium,
      spreadPremium,
      isClosing,
      isRecyclable,
      { from: admin },
    );

    return { recyclableToken, customToken: underlyingToken };
  }

  async function removeMarket(
    marketId: Integer,
    recycler: address,
  ): Promise<TxResult> {
    return solo.admin.removeMarkets([marketId], recycler, { from: admin });
  }

  async function getOwnerBalance(
    owner: address,
    accountNumber: number,
    market: Integer,
  ): Promise<Integer> {
    const recyclableAccount = await recyclableToken.methods
      .getAccountNumber({
        owner,
        number: accountNumber,
      })
      .call();
    return await solo.getters.getAccountPar(
      recyclableToken.options.address,
      new BigNumber(recyclableAccount),
      market,
    );
  }
});
