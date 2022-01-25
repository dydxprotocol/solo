import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { mineAvgBlock, resetEVM } from './helpers/EVM';
import { expectThrow } from '../src/lib/Expect';
import { ADDRESSES, INTEGERS } from '../src/lib/Constants';
import { stripHexPrefix } from '../src/lib/BytesHelper';
import { createTypedSignature, PREPEND_DEC, PREPEND_HEX, SIGNATURE_TYPES } from '../src/lib/SignatureHelper';
import { address } from '../src';

let dolomiteMargin: TestDolomiteMargin;
let owner: address;
const zero = '0';
const amount = '100';
const addr = ADDRESSES.TEST[0];

describe('Library', () => {
  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    owner = dolomiteMargin.getDefaultAccount();
    await resetEVM();
  });

  describe('TypedSignature', () => {
    const hash = '0x1234567812345678123456781234567812345678123456781234567812345678';
    const r = '0x30755ed65396facf86c53e6217c52b4daebe72aa4941d89635409de4c9c7f946';
    const s = '0x6d4e9aaec7977f05e923889b33c0d0dd27d7226b6e6f56ce737465c5cfd04be4';
    const v = '0x1b';
    const signature = `${r}${stripHexPrefix(s)}${stripHexPrefix(v)}`;

    async function recover(hashString: string, typedSignature: string) {
      return dolomiteMargin.contracts.callConstantContractFunction(
        dolomiteMargin.contracts.testLib.methods.TypedSignatureRecover(
          Web3.utils.hexToBytes(hashString),
          Web3.utils.hexToBytes(typedSignature).map(x => [x]),
        ),
      );
    }

    describe('recover', () => {
      it('fails for invalid signature length', async () => {
        await expectThrow(recover(hash, hash.slice(0, -2)), 'TypedSignature: Invalid signature length');
      });

      it('fails for invalid signature type', async () => {
        await expectThrow(recover(hash, `0x${'00'.repeat(65)}04`), 'TypedSignature: Invalid signature type');
        await expectThrow(recover(hash, `0x${'00'.repeat(65)}05`), 'TypedSignature: Invalid signature type');
      });

      it('succeeds for no prepend', async () => {
        const signer = dolomiteMargin.web3.eth.accounts.recover({
          r,
          s,
          v,
          messageHash: hash,
        });
        const recoveredAddress = await recover(hash, createTypedSignature(signature, SIGNATURE_TYPES.NO_PREPEND));
        expect(recoveredAddress).toEqual(signer);
      });

      it('succeeds for decimal prepend', async () => {
        const decHash = Web3.utils.soliditySha3({ t: 'string', v: PREPEND_DEC }, { t: 'bytes32', v: hash });
        const signer = dolomiteMargin.web3.eth.accounts.recover({
          r,
          s,
          v,
          messageHash: decHash,
        });
        const recoveredAddress = await recover(hash, createTypedSignature(signature, SIGNATURE_TYPES.DECIMAL));
        expect(recoveredAddress).toEqual(signer);
      });

      it('succeeds for hexadecimal prepend', async () => {
        const hexHash = Web3.utils.soliditySha3({ t: 'string', v: PREPEND_HEX }, { t: 'bytes32', v: hash });
        const signer = dolomiteMargin.web3.eth.accounts.recover({
          r,
          s,
          v,
          messageHash: hexHash,
        });
        const recoveredAddress = await recover(hash, createTypedSignature(signature, SIGNATURE_TYPES.HEXADECIMAL));
        expect(recoveredAddress).toEqual(signer);
      });
    });
  });

  describe('Math', () => {
    const BN_DOWN = BigNumber.clone({ ROUNDING_MODE: 1 });
    const BN_UP = BigNumber.clone({ ROUNDING_MODE: 0 });
    const BN_HALF_UP = BigNumber.clone({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
    const largeNumber = INTEGERS.ONES_255.div('1.5').toFixed(0);
    const tests = [
      [1, 1, 1],
      [2, 0, 3],
      [0, 3, 2],
      [2, 3, 4],
      [1241, 249835, 89234],
      [1289, 12431, 1],
      [1, 12341, 98],
      [12, 1, 878978],
      [0, 0, 1],
      [1, 1, 999],
      [998, 2, 999],
      [40, 50, 21],
    ];

    it('getPartial', async () => {
      const results = await Promise.all(
        tests.map(args => dolomiteMargin.contracts.testLib.methods.MathGetPartial(args[0], args[1], args[2]).call()),
      );
      expect(results).toEqual(
        tests.map(args =>
          new BN_DOWN(args[0])
            .times(args[1])
            .div(args[2])
            .toFixed(0),
        ),
      );
    });

    it('getPartial reverts', async () => {
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathGetPartial(1, 1, 0).call());
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathGetPartial(largeNumber, largeNumber, 1).call());
    });

    it('getPartialRoundUp', async () => {
      const results = await Promise.all(
        tests.map(args =>
          dolomiteMargin.contracts.testLib.methods.MathGetPartialRoundUp(args[0], args[1], args[2]).call(),
        ),
      );
      expect(results).toEqual(
        tests.map(args =>
          new BN_UP(args[0])
            .times(args[1])
            .div(args[2])
            .toFixed(0),
        ),
      );
    });

    it('getPartialRoundHalfUp', async () => {
      const results = await Promise.all(
        tests.map(args =>
          dolomiteMargin.contracts.testLib.methods.MathGetPartialRoundHalfUp(args[0], args[1], args[2]).call(),
        ),
      );
      expect(results).toEqual(
        tests.map(args =>
          new BN_HALF_UP(args[0])
            .times(args[1])
            .div(args[2])
            .toFixed(0),
        ),
      );
    });

    it('getPartialRoundHalfUp reverts', async () => {
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathGetPartialRoundHalfUp(1, 1, 0).call());
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.MathGetPartialRoundHalfUp(largeNumber, largeNumber, 1).call(),
      );
    });

    it('to128', async () => {
      const large = '340282366920938463463374607431768211456'; // 2^128
      const small = '340282366920938463463374607431768211455'; // 2^128 - 1
      const result = await dolomiteMargin.contracts.testLib.methods.MathTo128(small).call();
      expect(result).toEqual(small);
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathTo128(large).call());
    });

    it('to96', async () => {
      const large = '79228162514264337593543950336'; // 2^96
      const small = '79228162514264337593543950335'; // 2^96 - 1
      const result = await dolomiteMargin.contracts.testLib.methods.MathTo96(small).call();
      expect(result).toEqual(small);
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathTo96(large).call());
    });

    it('to32', async () => {
      const large = '4294967296'; // 2^32
      const small = '4294967295'; // 2^32 - 1
      const result = await dolomiteMargin.contracts.testLib.methods.MathTo32(small).call();
      expect(result).toEqual(small);
      await expectThrow(dolomiteMargin.contracts.testLib.methods.MathTo32(large).call());
    });
  });

  describe('Require', () => {
    const bytes32Hex = `0x${'0123456789abcdef'.repeat(4)}`;
    const emptyReason = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const reason1 = '0x5468697320497320746865205465787420526561736f6e2e3031323334353637';
    const reasonString1 = 'This Is the Text Reason.01234567';
    const reason2 = '0x53686f727420526561736f6e2030393800000000000000000000000000000000';
    const reasonString2 = 'Short Reason 098';
    const arg1 = '0';
    const arg2 = '1234567890987654321';
    const arg3 = INTEGERS.ONES_255.toFixed(0);

    it('that (emptyString)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThat1(emptyReason, arg1).call(),
        `TestLib:  <${arg1}>`,
      );
    });

    it('that (0 args)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThat0(reason1).call(),
        `TestLib: ${reasonString1}`,
      );
    });

    it('that (1 args)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThat1(reason2, arg1).call(),
        `TestLib: ${reasonString2} <${arg1}>`,
      );
    });

    it('that (2 args)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThat2(reason1, arg2, arg3).call(),
        `TestLib: ${reasonString1} <${arg2}, ${arg3}>`,
      );
    });

    it('that (address arg)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThatA0(reason2, addr).call(),
        `TestLib: ${reasonString2} <${addr}>`,
      );
    });

    it('that (1 address, 1 number)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThatA1(reason2, addr, arg1).call(),
        `TestLib: ${reasonString2} <${addr}, ${arg1}>`,
      );
    });

    it('that (1 address, 2 numbers)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThatA2(reason2, addr, arg1, arg3).call(),
        `TestLib: ${reasonString2} <${addr}, ${arg1}, ${arg3}>`,
      );
    });

    it('that (bytes32 arg)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThatB0(reason1, bytes32Hex).call(),
        `TestLib: ${reasonString1} <${bytes32Hex}>`,
      );
    });

    it('that (1 bytes32, 2 numbers)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.testLib.methods.RequireThatB2(reason2, bytes32Hex, arg1, arg3).call(),
        `TestLib: ${reasonString2} <${bytes32Hex}, ${arg1}, ${arg3}>`,
      );
    });
  });

  describe('Time', () => {
    it('currentTime', async () => {
      const [block1, time1] = await Promise.all([
        dolomiteMargin.web3.eth.getBlock('latest'),
        dolomiteMargin.contracts.testLib.methods.TimeCurrentTime().call(),
      ]);
      await mineAvgBlock();
      const [block2, time2] = await Promise.all([
        dolomiteMargin.web3.eth.getBlock('latest'),
        dolomiteMargin.contracts.testLib.methods.TimeCurrentTime().call(),
      ]);
      expect(new BigNumber(time1).toNumber()).toBeGreaterThanOrEqual(block1.timestamp);
      expect(new BigNumber(time2).toNumber()).toBeGreaterThanOrEqual(block2.timestamp);
      expect(block2.timestamp).toBeGreaterThanOrEqual(block1.timestamp + 15);
    });
  });

  describe('Token', () => {
    let result: any;
    let token: address;
    let errorToken: address;
    let omise: address;
    let libAddr: address;

    beforeAll(async () => {
      token = dolomiteMargin.contracts.tokenA.options.address;
      errorToken = dolomiteMargin.contracts.erroringToken.options.address;
      omise = dolomiteMargin.contracts.omiseToken.options.address;
      libAddr = dolomiteMargin.contracts.testLib.options.address;
    });

    it('balanceOf (normal)', async () => {
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(token, addr).call();
      expect(result).toEqual(zero);
      await dolomiteMargin.contracts.callContractFunction(
        dolomiteMargin.contracts.tokenA.methods.issueTo(addr, amount),
      );
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(token, addr).call();
      expect(result).toEqual(amount);
    });

    it('balanceOf (omise)', async () => {
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(omise, addr).call();
      expect(result).toEqual(zero);
      await dolomiteMargin.contracts.callContractFunction(
        dolomiteMargin.contracts.omiseToken.methods.issueTo(addr, amount),
      );
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(omise, addr).call();
      expect(result).toEqual(amount);
    });

    it('transfer (normal)', async () => {
      await dolomiteMargin.contracts.callContractFunction(
        dolomiteMargin.contracts.tokenA.methods.issueTo(libAddr, amount),
      );
      await dolomiteMargin.contracts.testLib.methods.TokenTransfer(token, addr, amount);
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(token, addr).call();
      expect(result).toEqual(amount);
    });

    it('transfer (omise)', async () => {
      await dolomiteMargin.contracts.callContractFunction(
        dolomiteMargin.contracts.omiseToken.methods.issueTo(libAddr, amount),
      );
      await dolomiteMargin.contracts.testLib.methods.TokenTransfer(omise, addr, amount);
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(omise, addr).call();
      expect(result).toEqual(amount);
    });

    it('transfer (error)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.testLib.methods.TokenTransfer(errorToken, addr, amount),
        ),
        'Token: transfer failed',
      );
    });

    it('transferFrom (normal)', async () => {
      await Promise.all([
        dolomiteMargin.contracts.callContractFunction(dolomiteMargin.contracts.tokenA.methods.issueTo(owner, amount)),
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.tokenA.methods.approve(libAddr, amount),
          { from: owner },
        ),
      ]);
      await dolomiteMargin.contracts.testLib.methods.TokenTransferFrom(token, owner, addr, amount);
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(token, addr).call();
      expect(result).toEqual(amount);
    });

    it('transferFrom (error)', async () => {
      await expectThrow(
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.testLib.methods.TokenTransferFrom(errorToken, owner, addr, amount),
        ),
        'Token: transferFrom failed',
      );
    });

    it('transferFrom (omise)', async () => {
      await Promise.all([
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.omiseToken.methods.issueTo(owner, amount),
        ),
        dolomiteMargin.contracts.callContractFunction(
          dolomiteMargin.contracts.omiseToken.methods.approve(libAddr, amount),
          { from: owner },
        ),
      ]);
      await dolomiteMargin.contracts.testLib.methods.TokenTransferFrom(omise, owner, addr, amount);
      result = await dolomiteMargin.contracts.testLib.methods.TokenBalanceOf(omise, addr).call();
      expect(result).toEqual(amount);
    });
  });

  describe('Types', () => {
    const lo = '10';
    const hi = '20';
    const negZo = { sign: false, value: zero };
    const posZo = { sign: true, value: zero };
    const negLo = { sign: false, value: lo };
    const posLo = { sign: true, value: lo };
    const negHi = { sign: false, value: hi };
    const posHi = { sign: true, value: hi };

    it('zeroPar', async () => {
      const result = await dolomiteMargin.contracts.testLib.methods.TypesZeroPar().call();
      expect(result.sign).toStrictEqual(false);
      expect(result.value).toEqual(zero);
    });

    it('parSub', async () => {
      let results: any[];
      // sub zero
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posLo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negLo, negZo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, posLo, posZo, posZo, negZo, negZo, negLo, negLo]);

      // sub positive
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posLo, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negLo, posLo).call(),
      ]);
      expect(results.map(parse)).toEqual([negLo, posZo, negLo, negLo, posLo, negHi]);

      // sub negative
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negLo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(negHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParSub(posLo, negLo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, negZo, posLo, posLo, negLo, posHi]);
    });

    it('parAdd', async () => {
      let results: any[];
      // add zero
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posLo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negLo, negZo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, posLo, posZo, posZo, negZo, negZo, negLo, negLo]);

      // add positive
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negLo, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posLo, posLo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, negZo, posLo, posLo, negLo, posHi]);

      // add negative
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posLo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(posHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParAdd(negLo, negLo).call(),
      ]);
      expect(results.map(parse)).toEqual([negLo, posZo, negLo, negLo, posLo, negHi]);
    });

    it('parEquals', async () => {
      const trues = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posHi, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negHi, negHi).call(),
      ]);
      expect(trues).toEqual([true, true, true, true, true, true, true]);
      const falses = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posHi, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(posZo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParEquals(negLo, posHi).call(),
      ]);
      expect(falses).toEqual([false, false, false, false, false, false, false]);
    });

    it('parNegative', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParNegative(negHi).call(),
      ]);
      expect(results.map(parse)).toEqual([negHi, negLo, negZo, posZo, posLo, posHi]);
    });

    it('parIsNegative', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsNegative(negHi).call(),
      ]);
      expect(results).toEqual([false, false, false, false, true, true]);
    });

    it('parIsPositive', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsPositive(negHi).call(),
      ]);
      expect(results).toEqual([true, true, false, false, false, false]);
    });

    it('parIsZero', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesParIsZero(negHi).call(),
      ]);
      expect(results).toEqual([false, false, true, true, false, false]);
    });

    it('zeroWei', async () => {
      const result = await dolomiteMargin.contracts.testLib.methods.TypesZeroWei().call();
      expect(result.sign).toStrictEqual(false);
      expect(result.value).toEqual(zero);
    });

    it('weiSub', async () => {
      let results: any[];
      // sub zero
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posLo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negLo, negZo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, posLo, posZo, posZo, negZo, negZo, negLo, negLo]);

      // sub positive
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posLo, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negLo, posLo).call(),
      ]);
      expect(results.map(parse)).toEqual([negLo, posZo, negLo, negLo, posLo, negHi]);

      // sub negative
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negLo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(negHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiSub(posLo, negLo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, negZo, posLo, posLo, negLo, posHi]);
    });

    it('weiAdd', async () => {
      let results: any[];
      // add zero
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posLo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negLo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negLo, negZo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, posLo, posZo, posZo, negZo, negZo, negLo, negLo]);

      // add positive
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negLo, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posZo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posLo, posLo).call(),
      ]);
      expect(results.map(parse)).toEqual([posLo, negZo, posLo, posLo, negLo, posHi]);

      // add negative
      results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posLo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negZo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(posHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiAdd(negLo, negLo).call(),
      ]);
      expect(results.map(parse)).toEqual([negLo, posZo, negLo, negLo, posLo, negHi]);
    });

    it('weiEquals', async () => {
      const trues = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posHi, posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posZo, posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negZo, negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negHi, negHi).call(),
      ]);
      expect(trues).toEqual([true, true, true, true, true, true, true]);
      const falses = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posHi, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posLo, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posHi, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(posZo, negHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negHi, negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negLo, posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiEquals(negLo, posHi).call(),
      ]);
      expect(falses).toEqual([false, false, false, false, false, false, false]);
    });

    it('weiNegative', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiNegative(negHi).call(),
      ]);
      expect(results.map(parse)).toEqual([negHi, negLo, negZo, posZo, posLo, posHi]);
    });

    it('weiIsNegative', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsNegative(negHi).call(),
      ]);
      expect(results).toEqual([false, false, false, false, true, true]);
    });

    it('weiIsPositive', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsPositive(negHi).call(),
      ]);
      expect(results).toEqual([true, true, false, false, false, false]);
    });

    it('weiIsZero', async () => {
      const results = await Promise.all([
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(posHi).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(posLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(posZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(negZo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(negLo).call(),
        dolomiteMargin.contracts.testLib.methods.TypesWeiIsZero(negHi).call(),
      ]);
      expect(results).toEqual([false, false, true, true, false, false]);
    });

    function parse(value: any) {
      return { sign: value[0], value: value[1] };
    }
  });
});
