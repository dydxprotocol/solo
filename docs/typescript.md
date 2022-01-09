# TypeScript Client

<br>
<div style="display:flex;">
  <a href='https://github.com/dolomite-exchange/dolomite-margin' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/GitHub-dolomite--exchange%2Fdolomite--margin-lightgrey' alt='GitHub'/>
  </a>
  <br>
  <a href='https://www.npmjs.com/package/@dolomite-exchange/dolomite' style="text-decoration:none;padding-left:5px;">
    <img src='https://img.shields.io/npm/v/@dolomite-exchange/dolomite.svg' alt='NPM Package'/>
  </a>
</div>

TypeScript library for interacting with the DolomiteMargin smart contracts and HTTP API.

### Install

```
npm i -s @dolomite-exchange/dolomite
```

### Initialize

You will need to initialize DolomiteMargin using a [Web3 provider](https://web3js.readthedocs.io/en/v1.2.1/web3.html#providers) / Ethereum node endpoint and Network.

```javascript
import { DolomiteMargin, Networks } from '@dolomite-exchange/dolomite-margin';

// --- Initialize with Web3 provider ---
const dolomiteMargin = new DolomiteMargin(
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
const dolomiteMargin = new DolomiteMargin(
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
DolomiteMargin exposes a number of "standard" actions for interacting with the protocol. These are a subset of what is possible with [Operations](#operations), but are simpler to use.

#### Deposit
Deposit funds to DolomiteMargin

```javascript
import { MarketId, BigNumber } from '@dolomite-exchange/dolomite-margin';

// Deposits a certain amount of tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await dolomiteMargin.standardActions.deposit({
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
Withdraw funds from DolomiteMargin

```javascript
import { MarketId, BigNumber } from '@dolomite-exchange/dolomite-margin';

// Withdraws a certain amount of tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await dolomiteMargin.standardActions.withdraw({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
  marketId: MarketId.ETH,

   // Base units of the token, so 1e18 = 1 ETH
   // NOTE: USDC has 6 decimal places, so 1e6 = 1 USDC
  amount: new BigNumber('1e18'),
});

// Withdraws all of your tokens for some asset.
// By default resolves when transaction is received by the node - not when mined
const result = await dolomiteMargin.standardActions.withdrawToZero({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
  marketId: MarketId.ETH,
});
```
- `MarketId.ETH` will withdraw as ETH whereas `MarketId.WETH` will withdraw as WETH. Both are the same market on the protocol

### Operations
The main way to interact with DolomiteMargin is through Operations. See [Operations](protocol.md#operations)

#### Initialize

To initialize an Operation:

```javascript
const operation = dolomiteMargin.operation.initiate();
```

DolomiteMargin also provides a [Payable Proxy](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol) contract that will automatically wrap and unwrap ETH <-> WETH, so that users can interact with DolomiteMargin using only ETH. You can use it by:

```javascript
const operation = dolomiteMargin.operation.initiate({ proxy: ProxyType.Payable });
```

#### Add Actions

Once an operation is initialized, Actions can be added to it. Action functions modify the `operation` itself, and also always return the `operation`.


In this example 1 ETH is being withdrawn from an account, and then 200 DAI are being deposited into it:
```javascript
import { MarketId } from '@dolomite-exchange/dolomite-margin';

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

See [AccountOperation](https://github.com/dolomite-exchange/dolomite-margin/blob/master/src/modules/operate/AccountOperation.ts) for the full list of Actions available to add to an Operation.

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
DolomiteMargin provides a number of read-only getter functions which read information off the smart contracts on the blockchain. You can find them [here](https://github.com/dolomite-exchange/dolomite-margin/blob/master/src/modules/Getters.ts).

Example of getting the balances of an Account:
```javascript
const balances = await dolomiteMargin.getters.getAccountBalances(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // Account Owner
  new BigNumber('11'), // Account Number
);
```

### Logs
DolomiteMargin provides a helper to parse DolomiteMargin-specific logs from a transaction.

```javascript
const dolomiteMarginLogs = dolomiteMargin.logs.parseLogs(transactionReceipt);
```

### Tokens
DolomiteMargin provides helper functions to help with interacting with ERC20 tokens. You can find them all [here](https://github.com/dolomite-exchange/dolomite-margin/blob/master/src/modules/Token.ts).

Example of setting DAI token allowance on DolomiteMargin:

```javascript
await dolomiteMargin.token.setMaximumDolomiteMarginAllowance(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI Contract Address
  '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // My Address
  { from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5' }, // My Address
);
```

### Subgraph
DolomiteMargin provides an easy way to read data that's indexed from the smart contracts.


#### Place Order(v2)
```javascript
import { ApiSide, ApiMarketName, BigNumber } from '@dolomite-exchange/dolomite-margin';

// order has type ApiOrder
const { order } = await dolomiteMargin.api.placeCanonicalOrder({
  order: {
    //Side your order is being placed on
    side: ApiSide.BUY,

    //Market the trade is in
    market: ApiMarketName.WETH_DAI,

    // denominated in base units. i.e. 1 ETH = 1e18
    amount: new BigNumber('1e18'),

    // denominated in base/quote. Since ETH and DAI have 18 decimals and are represented in e-18 while USDC has 6 decimals and is e-6, USDC prices are represented in e-12
    price: '230.1',

    // Your address. Account must be loaded onto DolomiteMargin with private key for signing
    makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',

    // OPTIONAL: number of seconds until the order expires.
    // 0 indicates no expiry. Defaults to 28 days
    expiration: new BigNumber('1000'),

    //OPTIONAL: Maximum fee you are willing to accept. Note, if limitFee is below calculated restriction and no exemption was given, the request will 400
    //Makers will pay 0% fees. Takers with greater than or equal to .5Eth in the transaction will pay .15% of ETH-DAI and ETH-USDC transactions and .05% for DAI-USDC transactions.
    //For transactions below .5Eth they will pay .50% fees.
    limitFee: '0.0015'
  },

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
const { order } = await dolomiteMargin.api.cancelOrderV2({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Get Order
```typescript
const { id } = existingOrder;
// O
const { order }: { order: ApiOrderV2 } = await dolomiteMargin.api.getOrderV2({ id });
```

#### Get Orders
```typescript
const { orders }: { orders: ApiOrderV2[] } = await dolomiteMargin.api.getOrdersV2({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  status: ['OPEN', 'FILLED'], // OPTIONAL
  orderType: ['LIMIT', 'ISOLATED_MARKET'], // OPTIONAL
  limit: 40, // OPTIONAL, max: 100
  startingBefore: new Date() // OPTIONAL
})
```

#### Get Fills
```typescript
const { id } = existingOrder;

const { fills }: { fills: ApiFillV2[] } = await dolomiteMargin.api.getFillsV2({
  orderId: id, // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  transactionHash: '0xb6f6a4e9c513882353aeedd18b1843e6c451ed6bee2075487d5e013c6b0eeaba', // OPTIONAL
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  startingBefore: new Date(), // OPTIONAL
  limit: 40 // OPTIONAL, max: 100
})
```

#### Get Trades
```typescript
const { id } = existingOrder;
// order has type ApiTradeV2
const { trades }: { trades: ApiTradeV2[] } = await dolomiteMargin.api.getTradesV2({
  orderId: id, // OPTIONAL
  side: 'BUY', // OPTIONAL
  market: ['WETH-USDC', 'DAI-USDC'], // OPTIONAL
  transactionHash: '0xb6f6a4e9c513882353aeedd18b1843e6c451ed6bee2075487d5e013c6b0eeaba', // OPTIONAL
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // OPTIONAL
  accountNumber: '0', // OPTIONAL
  startingBefore: new Date(), // OPTIONAL
  limit: 40 // OPTIONAL, max: 100
})
```

#### Get Orderbook
```javascript
import { ApiMarketName } from '@dolomite-exchange/dolomite-margin';

// bids / asks have type ApiOrderOnOrderbook[]
const { bids, asks } = await dolomiteMargin.api.getOrderbookV2({
  market: ApiMarketName.WETH_DAI,
});
```

#### Get Account Balances
```javascript
// account has type ApiAccount
const account = await dolomiteMargin.api.getAccountBalances({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  accountNumber: new BigNumber(0), // OPTIONAL: defaults to 0
});
```

#### Get Markets
Get the markets that exist on the protocol. There is one market per asset (e.g. id 0 = ETH, id 1 = DAI, id 2 = USDC)

```javascript
const { markets } = await dolomiteMargin.api.getMarkets();
```

#### Get Market(v2)
Get v2 Market object by Pair

```javascript
const { market } = await dolomiteMargin.api.getMarketV2({
  // market pair (e.g. WETH-DAI, WETH-USDC, DAI-USDC)
  market: string
});
```

#### Get Markets(v2)
Get all v2 Market objects

```javascript
const { markets } = await dolomiteMargin.api.getMarketsV2();
```

#### Deprecated Functions

#### Place Order(v1) [DEPRECATED]
```javascript
import { MarketId, BigNumber } from '@dolomite-exchange/dolomite-margin';

// order has type ApiOrder
const { order } = await dolomiteMargin.api.placeOrder({
  // Your address. Account must be loaded onto DolomiteMargin with private key for signing
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  makerMarket: MarketId.WETH,
  takerMarket: MarketId.DAI,

  // denominated in base units of the token. i.e. 1 ETH = 1e18
  makerAmount: new BigNumber('1e18'),

  // denominated in base units of the token. i.e. 100 DAI = 100e18
  // (NOTE: USDC has 6 decimals so 100 USDC would be 100e6)
  takerAmount: new BigNumber('100e18'),

  // OPTIONAL: defaults to 0 (0 is the account number that displays
  // on app.dolomite.io)
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
const { order } = await dolomiteMargin.api.cancelOrder({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Replace Order [DEPRECATED]
```javascript
const { id } = existingOrder;

// order has type ApiOrder
const { order } = await dolomiteMargin.api.replaceOrder({
  ...order, // Same as arguments to placeOrder
  cancelId: id,
});
```

### Types
You can import types from DolomiteMargin as:

```javascript
import {
  ProxyType,
  AmountDenomination,
  AmountReference,
  ConfirmationType,
} from '@dolomite-exchange/dolomite-margin';
```

### Web3
DolomiteMargin uses [Web3 1.2.X](https://web3js.readthedocs.io) under the hood. You can access it through `dolomiteMargin.web3`

### BigNumber
DolomiteMargin uses [BigNumber 8.X](http://mikemcl.github.io/bignumber.js/). You can import this from DolomiteMargin as:

```javascript
import { BigNumber } from '@dolomite-exchange/dolomite-margin';
```
