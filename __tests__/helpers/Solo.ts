import { TestSolo } from '../modules/TestSolo';
import { provider } from './Provider';
import { address, ConfirmationType, SoloOptions } from '../../src/types';

const soloOptions: SoloOptions = {
  confirmationType: ConfirmationType.Confirmed,
  defaultGas: '4000000',
};

if (process.env.COVERAGE === 'true') {
  soloOptions.defaultGas = '0xfffffffffff';
  soloOptions.defaultGasPrice = '0x01';
}
export const solo = new TestSolo(
  provider,
  Number(process.env.NETWORK_ID),
  soloOptions,
);
let accounts: address[];

let defaultAccountSet = false;

export const getSolo = async (): Promise<{ solo: TestSolo, accounts: address[] }> => {
  if (!defaultAccountSet) {
    accounts = await solo.web3.eth.getAccounts();
    solo.setDefaultAccount(accounts[1]);
    defaultAccountSet = true;
  }

  return { solo, accounts };
};
