# TypeScript Client

<br>
<a href='https://github.com/dydxprotocol/solo'>
  <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fsolo-lightgrey' alt='GitHub'/>
</a>
<br>
<a href='https://www.npmjs.com/package/@dydxprotocol/solo'>
  <img src='https://img.shields.io/npm/v/@dydxprotocol/solo.svg' alt='NPM Package'/>
</a>

TypeScript library for interacting with the dYdX smart contracts

## Install

```
npm i -s @dydxprotocol/solo
```

## Initialize

You will need to initialize the main class of Solo using a provider and network id.

```javascript
import { Solo } from '@dydxprotocol/solo';
const solo = new Solo(
  provider,  // Valid web3 provider
  networkId, // Ethereum network ID (1 - Mainnet, 42 - Kovan, etc.)
  {
    defaultAccount: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // Optional
    accounts: [
      {
        address: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // Optional
        privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      },
    ], // Optional: loading in an account for signing transactions
  }, // Optional
);
```

If you need other types from the library, you can import them like this:

```javascript
import {
  Solo,
  ProxyType,
  AmountDenomination,
  AmountReference,
  ConfirmationType,
} from '@dydxprotocol/solo';
```

## Operations

#### Initialize

To initialize an Operation:

```javascript
const operation = solo.operation.initiate();
```

Solo also provides a [Payable Proxy](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/PayableProxyForSoloMargin.sol) contract that will automatically wrap and unwrap ETH <-> WETH, so that users can interact with Solo using only ETH. You can use it by:

```javascript
const operation = solo.operation.initiate({ proxy: ProxyType.Payable });
```

#### Add Actions

Once an operation is initialized, Actions can be added to it. Action functions modify the `operation` itself, and also always return the `operation`.


In this example 1 ETH is being withdrawn from an account, and then 200 DAI are being deposited into it:
```javascript
import { MarketNumber } from '@dydxprotocol/solo';

operation.withdraw({
    primaryAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    primaryAccountId: new BigNumber('123456'),
    marketId: MarketNumber.WETH,
    amount: {
      value: new BigNumber('-1e18'),
      reference: AmountReference.Delta,
      denomination: AmountDenomination.Actual,
    },
    to: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5'
  })
  .deposit({
    primaryAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    primaryAccountId: new BigNumber('123456'),
    marketId: MarketNumber.DAI,
    amount: {
      value: new BigNumber('200e18'),
      reference: AmountReference.Delta,
      denomination: AmountDenomination.Actual,
    },
    from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  });
```

See [AccountOperation](https://github.com/dydxprotocol/solo/blob/master/src/modules/operate/AccountOperation.ts) for the full list of Actions available to add to an Operation.

#### Commit

After Actions have been added to the `operation`, it can be committed. This is what sends the transaction to the blockchain to execute the Operation on the protocol.

```javascript
const response = await operation.commit({
  from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  gasPrice: '1000000000',
  confirmationType: ConfirmationType.Confirmed,
});
```

## Getters
Solo provides a number of read-only getter functions which read information off the smart contracts on the blockchain. You can find them [here](https://github.com/dydxprotocol/solo/blob/master/src/modules/Getters.ts).

Example of getting the balances of an Account:
```javascript
const balances = await solo.getters.getAccountBalances(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // Account Owner
  new BigNumber('11'), // Account Number
);
```

## Logs
Solo provides a helper to parse Solo-specific logs from a transaction.

```javascript
const soloLogs = solo.logs.parseLogs(transactionReceipt);
```

## Tokens
Solo provides helper functions to help with interacting with ERC20 tokens. You can find them all [here](https://github.com/dydxprotocol/solo/blob/master/src/modules/Token.ts).

Example of setting DAI token allowance on Solo:
```javascript
await solo.token.setMaximumSoloAllowance(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI Contract Address
  '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // My Address
  { from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5' }, // My Address
);
```

## Api
Solo provides an easy way to interact with dYdX http API endpoints. This is especially useful for making dex orders.

#### Place Order
```javascript
import { MarketNumber, BigNumber } from '@dydxprotocol/solo';

// order has type ApiOrder
const { order } = await solo.api.placeOrder({
   // Your address. Account must be loaded onto Solo with private key for signing
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  makerMarket: MarketNumber.WETH,
  takerMarket: MarketNumber.DAI,

  // denominated in base units of the token. i.e. 1 ETH = 1e18
  makerAmount: new BigNumber('1e18'),

  // denominated in base units of the token. i.e. 100 DAI = 100e18
  // (NOTE: USDC has 6 decimals so 100 USDC would be 100e6)
  takerAmount: new BigNumber('100e18'),

  // OPTIONAL: defaults to 0 (0 is the account number that displays
  // on trade.dydx.exchange/balances)
  makerAccountNumber: new BigNumber(0),

  // OPTIONAL: number of seconds until the order expires.
  // 0 indicates no expiry. Defaults to 28 days
  expiration: new BigNumber('1000'),

  // OPTIONAL: defaults to false
  fillOrKill: false,
});
```

#### Cancel Order
```javascript
const { id } = existingOrder;

// order has type ApiOrder
const { order } = await solo.api.cancelOrder({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Get Orders
```javascript
// orders has type ApiOrder[]
const { orders } = await solo.api.getOrders({
  startingBefore: new Date(), // OPTIONAL
  limit: 50, // OPTIONAL: maximum 100
  pairs: ['WETH-DAI, DAI-WETH'], // OPTIONAL
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL

  // OPTIONAL: defaults to 0 if makerAccountOwner provided
  makerAccountNumber: new BigNumber(0),
});
```

#### Get Fills
```javascript
// fills has type ApiFill[]
const { fills } = await solo.api.getFills({
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  startingBefore: new Date(), // OPTIONAL
  limit: 50, // OPTIONAL: maximum 100
  pairs: ['WETH-DAI, DAI-WETH'], // OPTIONAL

  // OPTIONAL: defaults to 0 if makerAccountOwner provided
  makerAccountNumber: new BigNumber(0),
});
```

#### Get Account Balances
```javascript
// account has type ApiAccount
const account = await solo.api.getAccountBalances({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  accountNumber: new BigNumber(0), // OPTIONAL: defaults to 0
});
```

## Web3
Solo uses [Web3 1.2.X](https://web3js.readthedocs.io) under the hood. You can access it through `solo.web3`
