import BigNumber from 'bignumber.js';
import {
  ConfirmationType,
  DolomiteMargin
} from '../src';

const truffle = require('../truffle');

async function start() {
  const network = process.env.NETWORK;
  if (!network || !truffle.networks[network]) {
    return Promise.reject(new Error('Invalid network'));
  }

  console.log('Using network', network);
  const provider = truffle.networks[network].provider();
  const networkId = truffle.networks[network].network_id;

  const dolomiteMargin = new DolomiteMargin(provider, networkId);

  const accountNumber = process.env.ACCOUNT_NUMBER;
  const marketId = process.env.MARKET_ID;
  const timeDelta = process.env.TIME_DELTA;

  console.log('accountNumber', accountNumber);
  console.log('marketId', marketId);
  console.log('timeDelta', timeDelta);

  if (!accountNumber || !marketId || !timeDelta) {
    return Promise.reject(new Error('One of accountNumber, marketId, or timeDelta was not defined'));
  }

  const account = (await dolomiteMargin.web3.eth.getAccounts())[0];
  console.log('account', account);

  const txResult = await dolomiteMargin.operation
    .initiate()
    .setExpiry({
      primaryAccountOwner: account,
      primaryAccountId: new BigNumber(accountNumber),
      expiryArgs: [
        {
          accountOwner: account,
          accountId: new BigNumber(accountNumber),
          marketId: new BigNumber(marketId),
          timeDelta: new BigNumber(timeDelta),
          forceUpdate: true,
        },
      ],
    })
    .commit({ from: account, confirmationType: ConfirmationType.Hash });

  console.log('transaction hash', txResult.transactionHash);
}

start()
  .then(() => {
    console.log('Finished successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error('Finished with error: ', e);
    process.exit(1);
  });
