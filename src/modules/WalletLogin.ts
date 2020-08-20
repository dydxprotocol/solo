import {
  SigningMethod,
  address,
  OffChainAction,
} from '../../src/types';
import { SignOffChainAction } from './SignOffChainAction';

export class WalletLogin extends SignOffChainAction {

  public async signLogin(
    expiration: Date,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    return this.signOffChainAction(
      expiration,
      signer,
      signingMethod,
      OffChainAction.LOGIN,
    );
  }

  public walletLoginIsValid(
    expiration: Date,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    return this.signOffChainActionIsValid(
      expiration,
      typedSignature,
      expectedSigner,
      OffChainAction.LOGIN,
    );
  }

  public getWalletLoginHash(
    expiration: Date,
  ): string {
    return this.getOffChainActionHash(expiration, OffChainAction.LOGIN);
  }
}
