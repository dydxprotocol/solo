import {
  SigningMethod,
  address,
} from '../src/types';
import { getSolo } from './helpers/Solo';
import { Solo } from '../src/Solo';

let solo: Solo;
let accounts: address[];
let signer: address;

describe('WalletLogin', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
    accounts = r.accounts;
    signer = accounts[0];
  });

  it('Succeeds for eth.sign', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature = await solo.walletLogin.signLogin(expiration, signer, SigningMethod.Hash);
    expect(solo.walletLogin.walletLoginIsValid(expiration, signature, signer)).toBe(true);
  });

  it('Succeeds for eth_signTypedData', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature = await solo.walletLogin.signLogin(expiration, signer, SigningMethod.TypedData);
    expect(solo.walletLogin.walletLoginIsValid(expiration, signature, signer)).toBe(true);
  });

  it('Recognizes an invalid signature', async () => {
    const expiration = new Date('December 30, 2500 11:20:25');
    const signature = `0x${'1b'.repeat(65)}00`;
    expect(solo.walletLogin.walletLoginIsValid(expiration, signature, signer)).toBe(false);
  });

  it('Recognizes expired signatures', async () => {
    const expiration = new Date('December 30, 2017 11:20:25');
    const signature = await solo.walletLogin.signLogin(expiration, signer, SigningMethod.Hash);
    expect(solo.walletLogin.walletLoginIsValid(expiration, signature, signer)).toBe(false);
  });
});
