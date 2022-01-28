import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM } from './helpers/EVM';
import { expectThrow } from '../src/lib/Expect';
import { address } from '../src';
import { stripHexPrefix } from '../src/lib/BytesHelper';
import { createTypedSignature, PREPEND_DEC, PREPEND_HEX, SIGNATURE_TYPES } from '../src/lib/SignatureHelper';

let dolomiteMargin: TestDolomiteMargin;
let owner: address;

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
});
