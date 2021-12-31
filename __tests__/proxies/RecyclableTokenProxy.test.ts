import BigNumber from 'bignumber.js';
import { getSolo } from '../helpers/Solo';
import { TestSolo } from '../modules/TestSolo';
import { resetEVM, snapshot } from '../helpers/EVM';
import { setupMarkets } from '../helpers/SoloHelpers';
import { INTEGERS } from '../../src/lib/Constants';
import { expectThrow } from '../../src/lib/Expect';
import { address, } from '../../src/types';

import {
  abi as recyclableABI,
  bytecode as recyclableBytecode,
} from '../../build/contracts/TestRecyclableToken.json';
import {
  abi as customTestTokenABI,
  bytecode as customTestTokenBytecode,
} from '../../build/contracts/CustomTestToken.json';

import { CustomTestToken } from '../../build/testing_wrappers/CustomTestToken';
import { TestRecyclableToken } from '../../build/testing_wrappers/TestRecyclableToken';
import { inspect } from 'util';
import custom = module;

let solo: TestSolo;
let accounts: address[];
let admin: address;
let nonAdmin: address;
let soloAddress: address;
let oracleAddress: address;
let setterAddress: address;
let customToken: CustomTestToken;
let recyclableToken: TestRecyclableToken;

const defaultPrice = new BigNumber(999);

describe('RecyclableTokenProxy', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    admin = accounts[0];
    nonAdmin = accounts[2];
    expect(admin).not.toEqual(nonAdmin);

    await resetEVM();

    await Promise.all(
      [
        setupMarkets(solo, accounts, 3),
      ]
    );

    soloAddress = solo.contracts.soloMargin.options.address;
    oracleAddress = solo.testing.priceOracle.getAddress();
    setterAddress = solo.testing.interestSetter.getAddress();

    const { recyclableToken: _recyclableToken, customToken: _customToken } = await addMarket();
    recyclableToken = _recyclableToken;
    customToken = _customToken;

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  // ============ Token Functions ============

  describe('#depositIntoSolo', () => {
    it('Successfully deposits into Solo', async () => {
    });

    it('Fails to deposit when recycled', async () => {
    });
  });

  describe('withdrawFromSolo', () => {
    it('Successfully withdraws from Solo', async () => {
    });

    it('Fails to #withdrawAfterRecycle when not in recycled state', async () => {
    });
  });

  describe('#withdrawAfterRecycle', () => {
    it('Successfully withdraws when in recycled state', async () => {
    });

    it('Fails to withdraw twice once in a recycled state', async () => {
    });

    it('Fails to withdraw when not in recycled state', async () => {
    });
  });

  describe('#trade', () => {
    it('Successfully withdraws when in recycled state', async () => {
    });

    it('Fails to withdraw twice once in a recycled state', async () => {
    });

    it('Fails to trade when in recycled state', async () => {
    });
  });

  describe('#liquidate', () => {
    it('Successfully liquidates when a user is undercollateralized and liquidator withdraws', async () => {
    });

    it('Fails to liquidate if the liquidator holds the collateral in Solo', async () => {
    });

    it('Fails to trade when in recycled state', async () => {
    });
  });

  // ============ Private Functions ============

  async function addMarket(): Promise<{ recyclableToken: TestRecyclableToken, customToken: CustomTestToken }> {
    const marginPremium = INTEGERS.ZERO;
    const spreadPremium = INTEGERS.ZERO;
    const isClosing = true;
    const isRecyclable = true;

    const underlyingToken = (await new solo.web3.eth.Contract(customTestTokenABI)
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
        ],
      })
      .send({ from: admin, gas: '6000000' })) as TestRecyclableToken;

    await solo.testing.priceOracle.setPrice(recyclableToken.options.address, defaultPrice);

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

});
