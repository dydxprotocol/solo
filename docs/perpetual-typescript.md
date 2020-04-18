# Perpetual TypeScript Client

<br>
<div style="display:flex;">
  <a href='https://github.com/dydxprotocol/perpetual' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fperpetual-lightgrey' alt='GitHub'/>
  </a>
  <br>
  <a href='https://www.npmjs.com/package/@dydxprotocol/perpetual' style="text-decoration:none;padding-left:5px;">
    <img src='https://img.shields.io/npm/v/@dydxprotocol/perpetual.svg' alt='NPM Package'/>
  </a>
</div>

TypeScript library for interacting with the dYdX perpetual smart contracts and http API

### Install

```
npm i -s @dydxprotocol/perpetual
```

### Initialize

You will need to initialize Perpetual using a [Web3 provider](https://web3js.readthedocs.io/en/v1.2.1/web3.html#providers) / Ethereum node endpoint and Network.

```javascript
import { Perpetual, Networks } from '@dydxprotocol/perpetual';
// --- Initialize with Web3 provider ---
const perpetual = new Perpetual(
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
```

### Api
Perpetual provides an easy way to interact with dYdX http API endpoints. This is especially useful for placing & canceling orders.


#### Place Order
```javascript
import { ApiSide, ApiMarketName, BigNumber } from '@dydxprotocol/perpetual';
// order has type ApiOrder
const { order } = await perpetual.api.placePerpetualOrder({
  order: {
    // Side your order is being placed on
    side: ApiSide.BUY
    // Market the trade is in
    market: ApiMarketName.PBTC_USDC
    // denominated in base units. i.e. 1 Sat = 1e8
    amount: new BigNumber('1e8'),
    // denominated in base/quote. Since PBTC has 8 decimals and USDC have 6 decimals, USDC prices will appear with decimals
    price: '72.00',
    // Your address. Account must be loaded onto Perpetual with private key for signing
    maker: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    // Taker address. Account must be loaded onto Perpetual with private key for signing
    taker: '0x7a94831b66a7ae1948b1a94a9555a7efa99cb426',
    // OPTIONAL: number of seconds until the order expires.
    // 0 indicates no expiry. Defaults to 28 days
    expiration: new BigNumber('1000'),
    // OPTIONAL: Maximum fee you are willing to accept. Note, if limitFee is below calculated restriction and no exemption was given, the request will 400
    // Makers with greater than or equal to 0.01Sats in the transaction will will be paid 0.025% fees, otherwise they will pay no fee. Takers with greater than or equal to 0.01Sats in the transaction will pay 0.075% for PBTC-USDC transactions. For transactions below 0.01Sats they will pay 0.50% fees.
    limitFee: '0.0075'
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
const { order } = await perpetual.api.cancelOrderV2({
  orderId: id,
  makerAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5', // Your address
});
```

#### Get Account Balances
```javascript
// account has type ApiAccount
const account = await perpetual.api.getAccountBalances({
  accountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
});
```

#### Get Markets
Get all v2 Market objects

```javascript
const { markets } = await perpetual.api.getMarketsV2();
```

### Types
You can import types from Perpetual as:

```javascript
import {
  Order,
  SignedOrder,
} from '@dydxprotocol/perpetual';
```

### Web3
Perpetual uses [Web3 1.2.X](https://web3js.readthedocs.io) under the hood. You can access it through `perpetual.web3`

### BigNumber
Perpetual uses [BigNumber 8.X](http://mikemcl.github.io/bignumber.js/). You can import this from Perpetual as:

```javascript
import { BigNumber } from '@dydxprotocol/perpetual';
```
