import {
  SigningMethod,
  address,
  OffChainAction,
} from '../src/types';
import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';

let solo: TestSolo;
let accounts: address[];
let signer: address;

describe('signOffChainAction', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    signer = accounts[0];
  });

  it('Succeeds for eth.sign', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature
      = await solo.signOffChainAction.signOffChainAction(
        expiration,
        signer,
        SigningMethod.Hash,
        OffChainAction.LOGIN,
      );
    expect(
      solo.signOffChainAction.signOffChainActionIsValid(
        expiration,
        signature,
        signer,
        OffChainAction.LOGIN,
      ),
    ).toBe(true);
  });

  it('Succeeds for eth_signTypedData', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature
      = await solo.signOffChainAction.signOffChainAction(
        expiration,
        signer,
        SigningMethod.TypedData,
        OffChainAction.LOGIN,
        );
    expect(
      solo.signOffChainAction.signOffChainActionIsValid(
        expiration,
        signature,
        signer,
        OffChainAction.LOGIN,
        ),
    ).toBe(true);
  });

  it('Recognizes an invalid signature', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature = `0x${'1b'.repeat(65)}00`;
    expect(
      solo.signOffChainAction.signOffChainActionIsValid(
        expiration,
        signature,
        signer,
        OffChainAction.LOGIN,
      ),
    ).toBe(false);
  });

  it('Recognizes expired signatures', async () => {
    const expiration = new Date('December 30, 2017 11:20:25');
    const signature
      = await solo.signOffChainAction.signOffChainAction(
        expiration,
        signer,
        SigningMethod.Hash,
        OffChainAction.LOGIN,
      );
    expect(
      solo.signOffChainAction.signOffChainActionIsValid(
        expiration,
        signature,
        signer,
        OffChainAction.LOGIN,
      ),
    ).toBe(false);
  });
});
