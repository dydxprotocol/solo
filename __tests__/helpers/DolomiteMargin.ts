import { TestDolomiteMargin } from '../modules/TestDolomiteMargin';
import { provider } from './Provider';
import { address, ConfirmationType, DolomiteMarginOptions } from '../../src';

const dolomiteMarginOptions: DolomiteMarginOptions = {
  confirmationType: ConfirmationType.Confirmed,
  testing: true,
  defaultGas: '4000000',
};

if (process.env.COVERAGE === 'true') {
  dolomiteMarginOptions.defaultGas = '0xfffffffffff';
  dolomiteMarginOptions.defaultGasPrice = '0x01';
}
export const dolomiteMargin = new TestDolomiteMargin(
  provider,
  Number(process.env.NETWORK_ID),
  dolomiteMarginOptions,
);
let accounts: address[];

let defaultAccountSet = false;

export const getDolomiteMargin = async (): Promise<{
  dolomiteMargin: TestDolomiteMargin;
  accounts: address[];
}> => {
  if (!defaultAccountSet) {
    accounts = await dolomiteMargin.web3.eth.getAccounts();
    dolomiteMargin.setDefaultAccount(accounts[1]);
    defaultAccountSet = true;
  }

  return { dolomiteMargin, accounts };
};
