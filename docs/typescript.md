# TypeScript Client

<br>
<div style="display:flex;">
  <a href='https://github.com/dydxprotocol/solo' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fsolo-lightgrey' alt='GitHub'/>
  </a>
  <br>
  <a href='https://www.npmjs.com/package/@dydxprotocol/solo' style="text-decoration:none;padding-left:5px;">
    <img src='https://img.shields.io/npm/v/@dydxprotocol/solo.svg' alt='NPM Package'/>
  </a>
</div>

TypeScript library for interacting with the dYdX smart contracts and http API

### Install

```
npm i -s @dydxprotocol/solo
```

### Initialize

You will need to initialize Solo using a [Web3 provider](https://web3js.readthedocs.io/en/v1.2.1/web3.html#providers) / Ethereum node endpoint and Network.

```javascript
import { Solo, Networks } from '@dydxprotocol/solo';

// --- Initialize with Web3 provider ---
const solo = new Solo(
  provider,  // Valid web3 provider
  Networks.MAINNET,
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

// --- OR Initialize with Ethereum node endpoint ---
const solo = new Solo(
  'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
  Networks.MAINNET,
  {
    defaultAccount: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // Optional - but needed if using Infura
    accounts: [
      {
        address: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // Optional
        privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      },
    ], // Optional: loading in an account for signing transactions
  }, // Optional
);
```

### Standard Actions
Solo exposes a number of "standard" actions for interacting with the protocol. These are a subset of what is possible with [Operations](#operations), but are simpler to use.

#### Deposit
Deposit funds to dYdX

```javascript
import { MarketId, BigNumber } from '@dydxprotocol/solo';

// Deposits a certain amount of tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await solo.standardActions.deposit({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
  marketId: MarketId.ETH,

   // Base units of the token, so 1e18 = 1 ETH
   // NOTE: USDC has 6 decimal places, so 1e6 = 1 USDC
  amount: new BigNumber('1e18'),
});
```

- `MarketId.ETH` will send ETH whereas `MarketId.WETH` will send WETH. Both are the same market on the protocol
- For all markets except `MarketId.ETH`, you will first need to set allowance on that token. See [Tokens](#tokens)

#### Withdraw
Withdraw funds from dYdX

```javascript
import { MarketId, BigNumber } from '@dydxprotocol/solo';

// Withdraws a certain amount of tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await solo.standardActions.withdraw({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
  marketId: MarketId.ETH,

   // Base units of the token, so 1e18 = 1 ETH
   // NOTE: USDC has 6 decimal places, so 1e6 = 1 USDC
  amount: new BigNumber('1e18'),
});

// Withdraws all of your tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await solo.standardActions.withdrawToZero({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
  marketId: MarketId.ETH,
});
```
- `MarketId.ETH` will withdraw as ETH whereas `MarketId.WETH` will withdraw as WETH. Both are the same market on the protocol

### Operations
The main way to interact with Solo is through Operations. See [Operations](protocol.md#operations)

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
import { MarketId } from '@dydxprotocol/solo';

operation.withdraw({
    primaryAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    primaryAccountId: new BigNumber('123456'),
    marketId: MarketId.WETH,
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
    marketId: MarketId.DAI,
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

### Getters
Solo provides a number of read-only getter functions which read information off the smart contracts on the blockchain. You can find them [here](https://github.com/dydxprotocol/solo/blob/master/src/modules/Getters.ts).

Example of getting the balances of an Account:
```javascript
const balances = await solo.getters.getAccountBalances(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // Account Owner
  new BigNumber('11'), // Account Number
);
```

### Logs
Solo provides a helper to parse Solo-specific logs from a transaction.

```javascript
const soloLogs = solo.logs.parseLogs(transactionReceipt);
```

### Tokens
Solo provides helper functions to help with interacting with ERC20 tokens. You can find them all [here](https://github.com/dydxprotocol/solo/blob/master/src/modules/Token.ts).

Example of setting DAI token allowance on Solo:
```javascript
await solo.token.setMaximumSoloAllowance(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI Contract Address
  '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // My Address
  { from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5' }, // My Address
);
```

### Api
Solo provides an easy way to interact with dYdX http API endpoints. This is especially useful for placing & canceling orders.


#### Place Order(v2)
```javascript
import { ApiSide, ApiMarketName, BigNumber } from '@dydxprotocol/solo';

// order has type ApiOrder
const { order } = await solo.api.placeCanonicalOrder({
  order: {
    //Side your order is being placed on
    side: ApiSide.BUY

    //Market the trade is in
    market: ApiMarketName.WETH_DAI

    // denominated in base units. i.e. 1 ETH = 1e18
    amount: new BigNumber('1e18'),

    // denominated in base/quote. Since ETH and DAI have 18 decimals and are represented in e-18 while USDC has 6 decimals and is e-6, USDC prices are represented in e-12
    price: '230.1',

    // Your address. Account must be loaded onto Solo with private key for signing
    makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',

    // OPTIONAL: number of seconds until the order expires.
    // 0 indicates no expiry. Defaults to 28 days
    expiration: new BigNumber('1000'),

    //OPTIONAL: Maximum fee you are willing to accept. Note, if limitFee is below calculated restriction and no exemption was given, the request will 400
    //Makers will pay 0% fees. Takers with greater than or equal to .5Eth in the transaction will pay .15% of ETH-DAI and ETH-USDC transactions and .05% for DAI-USDC transactions.
    //For transactions below .5Eth they will pay .50% fees.
    limitFee: '0.0015'
  }

  // OPTIONAL: defaults to false
  fillOrKill: false,

  // OPTIONAL: defaults to false
  postOnly: false,

  // OPTIONAL: defaults to undefined
  clientId: 'foo',

  // OPTIONAL: Turns this order into a replace order with the cancelId being the replaced order
  cancelId: '0x2c45cdcd3bce2dd0f2b40502e6bea7975f6daa642d12d28620deb18736619fa2',

  // OPTIONAL: defaults to false
  cancelAmountOnRevert: false,
});
```

#### Cancel Order
```javascript
const { id } = existingOrder;

// order has type ApiOrder
const { order } = await solo.api.cancelOrderV2({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Get Order
```typescript
const { id } = existingOrder;
// O
const { order }: { order: ApiOrderV2 } = await solo.api.getOrderV2({ id });
```

#### Get Orders
```typescript
const { orders }: { orders: ApiOrderV2[] } = await solo.api.getOrdersV2({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  status: ['OPEN', 'FILLED'], // OPTIONAL
  orderType: ['LIMIT', 'ISOLATED_MARKET'], // OPTIONAL
  limit: 40 // OPTIONAL, max: 100
  startingBefore: new Date() // OPTIONAL
})
```

#### Get Fills
```typescript
const { id } = existingOrder;

const { fills }: { fills: ApiFillV2[] } = await solo.api.getFillsV2({
  orderId: id, // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  transactionHash: '0xb6f6a4e9c513882353aeedd18b1843e6c451ed6bee2075487d5e013c6b0eeaba' // OPTIONAL
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  startingBefore: new Date() // OPTIONAL
  limit: 40 // OPTIONAL, max: 100
})
```

#### Get Trades
```typescript
const { id } = existingOrder;
// order has type ApiTradeV2
const { trades }: { trades: ApiTradeV2[] } = await solo.api.getTradesV2({
  orderId: id, // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  transactionHash: '0xb6f6a4e9c513882353aeedd18b1843e6c451ed6bee2075487d5e013c6b0eeaba' // OPTIONAL
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  startingBefore: new Date() // OPTIONAL
  limit: 40 // OPTIONAL, max: 100
})
```

#### Get Orderbook
```javascript
import { ApiMarketName } from '@dydxprotocol/solo';

// bids / asks have type ApiOrderOnOrderbook[]
const { bids, asks } = await solo.api.getOrderbookV2({
  market: ApiMarketName.WETH_DAI,
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

#### Get Markets
Get the markets that exist on the protocol. There is one market per asset (e.g. id 0 = ETH, id 1 = DAI, id 2 = USDC)

```javascript
const { markets } = await solo.api.getMarkets();
```

#### Deprecated Functions

#### Place Order(v1) [DEPRECATED]
```javascript
import { MarketId, BigNumber } from '@dydxprotocol/solo';

// order has type ApiOrder
const { order } = await solo.api.placeOrder({
  // Your address. Account must be loaded onto Solo with private key for signing
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  makerMarket: MarketId.WETH,
  takerMarket: MarketId.DAI,

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

  // OPTIONAL: defaults to false
  cancelAmountOnRevert: false,

  // OPTIONAL: defaults to false
  postOnly: false,

  // OPTIONAL: defaults to null
  triggerPrice: new BigNumber('1e18'),

  // OPTIONAL: defaults to null
  signedTriggerPrice: new BigNumber('1e18'),

  // OPTIONAL: defaults to false
  decreaseOnly: false,

  // OPTIONAL: defaults to undefined
  clientId: 'foo',
});
```

#### Cancel Order [DEPRECATED]
```javascript
const { id } = existingOrder;

// order has type ApiOrder
const { order } = await solo.api.cancelOrder({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Replace Order [DEPRECATED]
```javascript
const { id } = existingOrder;

// order has type ApiOrder
const { order } = await solo.api.replaceOrder({
  ...order, // Same as arguments to placeOrder
  cancelId: id,
});
```

### Types
You can import types from Solo as:

```javascript
import {
  ProxyType,
  AmountDenomination,
  AmountReference,
  ConfirmationType,
} from '@dydxprotocol/solo';
```

### Web3
Solo uses [Web3 1.2.X](https://web3js.readthedocs.io) under the hood. You can access it through `solo.web3`

### BigNumber
Solo uses [BigNumber 8.X](http://mikemcl.github.io/bignumber.js/). You can import this from Solo as:

```javascript
import { BigNumber } from '@dydxprotocol/solo';
```
