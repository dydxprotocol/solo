import { NETWORK_ID } from './Constants';
import { Solo } from '../../src/Solo';
import { provider } from './Provider';
import { address, ConfirmationType } from '../../src/types';

export const solo = new Solo(
  provider,
  NETWORK_ID,
  {
    confirmationType: ConfirmationType.Confirmed,
    testing: true,
  },
);
let accounts: address[];

let defaultAccountSet = false;

export const getSolo = async (): Promise<{ solo: Solo, accounts: address[] }> => {
  if (!defaultAccountSet) {
    accounts = await solo.web3.eth.getAccounts();
    solo.setDefaultAccount(accounts[1]);
    defaultAccountSet = true;
  }

  return { solo, accounts };
};
