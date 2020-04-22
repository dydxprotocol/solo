# HTTP API
dYdX offers an HTTP API for retrieving information about the protocol, and submitting orders to
our exchange. Feel free to use these APIs to build your own applications on top of dYdX. Please feel
free to let us know via Intercom or Telegram if you have any questions or experience any issues.

All of these endpoints live at `https://api.dydx.exchange/`

e.g. `https://api.dydx.exchange/v2/orders`

## Orderbook

### Introduction

The following API endpoints allow for submitting and retrieving orders from the dYdX orderbook.
This orderbook is what's frequently referred to as a "Matching Model" orderbook. This means that
all orders are submitted to the blockchain by dYdX itself. You do not need to provide gas fees
or send on-chain transactions yourself. This is especially useful for traders and market makers who
wish to be able to quickly cancel their orders without waiting for a transaction to be mined.

The below documents the underlying HTTP API. For easier implementation we recommend using the official [Python Client](python.md) or [TypeScript Client](typescript.md#api). We may build clients for other languages in the future, so if you have other language/framework needs, please let us know.

In order to submit an order, you (the maker) must first create a JSON object that specifies the
details of your order. Once you create this object you must sign it with your Ethereum private key,
and put the result in the `typedSignature` field. Note: The `typedSignature` is omitted before
signing, and added only after signing the message.

The order data is hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).
This includes the exact order format and version as well as information about the verifying contract and the chainId of the network. You can see working examples of signing in the [LimitOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/LimitOrders.ts) module of Solo.js.

When creating your order you _must_ specify the takerAccountOwner as `0xf809e07870dca762B9536d61A4fBEF1a17178092` and the takerAccountNumber
as `0`, otherwise your order will be rejected.

After this is done, the order is ready to be submitted to the API.

__V1 Order fields__[DEPRECATED]

|Field Name|JSON type|Description|
|----------|---------|-----------|
|makerMarket|string|The Solo [market](https://docs.dydx.exchange/#/overview?id=markets) of the Maker amount|
|takerMarket|string|The Solo [market](https://docs.dydx.exchange/#/overview?id=markets) of the Taker amount|
|makerAmount|string|The amount of token the Maker is offering in base units|
|takerAmount|string|The amount of token the Maker is requesting from the taker base units|
|makerAccountOwner|string|The Ethereum address of the Maker.|
|takerAccountOwner|string|The Ethereum address of the Taker. This must be to the dYdX account owner listed above|
|makerAccountNumber|string|The Solo [account number](https://docs.dydx.exchange/#/overview?id=markets) of the Maker|
|takerAccountNumber|string|The Solo [account number](https://docs.dydx.exchange/#/overview?id=markets) of the Taker. This must be set to teh dYdX account number listed above|
|triggerPrice|string|(Optional)The price at which the order will go to market.|
|decreaseOnly|boolean|(Optional)If the Stop-Limit order is tied to an existing Isolated Position.|
|expiration|string|The time in unix seconds at which this order will be expired and can no longer be filled. Use `"0"` to specify that there is no expiration on the order.|
|salt|string|A random number to make the orderHash unique.|
|typedSignature|string|The signature of the order.|

Example:
```json
{
    "makerMarket": "0",
    "takerMarket": "1",
    "makerAmount": "10000000000",
    "takerAmount": "20000000000",
    "makerAccountOwner": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "makerAccountNumber": "111",
    "takerAccountOwner": "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
    "takerAccountNumber": "222",
    "triggerPrice": "10000000000",
    "decreaseOnly": false,
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};
```

__Solo V2 Order fields__

|Field Name|JSON type|Description|
|----------|---------|-----------|
|isBuy|boolean|If the order is a buy order|
|isDecreaseOnly|boolean|(Optional)If the Stop-Limit order is tied to an existing Isolated Position|
|baseMarket|string|The Solo base [market](https://docs.dydx.exchange/#/overview?id=markets)|
|quoteMarket|string|The Solo quote [market](https://docs.dydx.exchange/#/overview?id=markets)|
|amount|string|The amount of token being offered in base units|
|limitPrice|string| The worst base/quote price at which the transaction will be accepted|
|triggerPrice|string|(Optional)The price at which the order will go to market.|
|limitFee|string| Makers will pay 0% fees. Takers with greater than or equal to 0.5Eth in the transaction will pay 0.15% of ETH-DAI and ETH-USDC transactions and 0.05% for DAI-USDC transactions.
For transactions below 0.5Eth they will pay 0.50% fees.
|makerAccountNumber|string|The Solo [account number](https://docs.dydx.exchange/#/overview?id=markets) of the Maker|
|makerAccountOwner|string|The Ethereum address of the Maker.|
|expiration|string|The time in unix seconds at which this order will be expired and can no longer be filled. Use `"0"` to specify that there is no expiration on the order.|
|salt|string|A random number to make the orderHash unique.|
|typedSignature|string|The signature of the order.|

Example:
```json
{
    "isBuy": true,
    "isDecreaseOnly": false,
    "baseMarket": "0",
    "quoteMarket": "3",
    "amount": "10000000000",
    "limitPrice": "20.3",
    "triggerPrice": "0",
    "limitFee": "0.0015",
    "makerAccountNumber": "0",
    "makerAccountOwner": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};

Note: The tick size is 0.01 for ETH-DAI, 0.01e-12 for ETH-USDC and 0.0001e-12 for DAI-USDC transactions. The negative twelfth power is because USDC has 6 decimal places of specificity whereas ETH and DAI have 18.
The `limitPrice` must be divisible by the tick size.
If `triggerPrice` is set, it must be divisible by the tick size.

```

__Perpetual V2 Order fields__

|Field Name|JSON type|Description|
|----------|---------|-----------|
|isBuy|boolean|If the order is a buy order|
|isDecreaseOnly|boolean|(Optional)Positions can only decrease in magnitude when trading this order. Note - must be false currently|
|amount|string|The amount of token being offered in base units|
|limitPrice|string| The worst base/quote price at which the transaction will be accepted|
|triggerPrice|string|(Optional)The price at which the order will go to market.|
|limitFee|string| Maker orders use a fee of -0.025% (i.e. a rebate). Takers pay a fee of 0.075%, unless the order amount is less than the “small order” size of 0.01 BTC, in which case they must pay a 0.50% fee.
|maker|string|The Ethereum address of the Maker.|
|taker|string|The Ethereum address of the Taker.|
|expiration|string|The time in unix seconds at which this order will be expired and can no longer be filled. Use `"0"` to specify that there is no expiration on the order.|
|salt|string|A random number to make the orderHash unique.|
|typedSignature|string|The signature of the order.|

Example:
```json
{
    "isBuy": true,
    "isDecreaseOnly": false,
    "amount": "10000000000",
    "limitPrice": "20.3",
    "triggerPrice": "0",
    "limitFee": "0.0015",
    "maker": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "taker": "0x7a94831b66a7ae1948b1a94a9555a7efa99cb426",
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};
Note: The tick size is 1 for PBTC-USDC. The `limitPrice` must be divisible by the tick size.
If `triggerPrice` is set, it must be divisible by the tick size.
```

## Trading Endpoints

### POST /v2/orders

Description:
Post a new order to the orderbook.

Please Note:

* There is a limit of 50 active orders on each book per-side. If you exceed this limit,
your request will return `400` and will not be added to the book.

* Your request will return `201`, but the order itself will still have a status of `PENDING` until
it is processed by our internal matching engine.

* For Solo orders and Perpetual orders, the order fields are different. Please refer to the Solo V2 order fields or Perpetual order fields above respectively. For Perpetual orders, the market field is also required.

Headers:
```
Content-Type: application/json
```

Request Body (SOLO):

|Field Name|JSON type|Description|
|----------|---------|-----------|
|order|Object|A valid signed Solo V2 order JSON object|
|fillOrKill|boolean|Whether the order should be canceled if it cannot be immediately filled|
|postOnly|boolean|Whether the order should be canceled if it would be immediately filled|
|triggerPrice|(Optional)The price at which the order will go to market. Must be greater than triggerPrice in the order|
|cancelId|string|(Optional)Order id for the order that is being canceled and replaced|
|clientId|string|(Optional)An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests.|
|setExpirationOnFill|boolean|(Optional)Expiration field for order will be applied upon the order filling.|
|cancelAmountOnRevert|boolean|Whether to try the order again if it is involved in a reverted fill|

Note: `fillOrKill` orders execute immediately and no part of the order will go on the open order
book. `fillOrKill` orders will either be completely filled, or not filled. Partial fills are not possible.
`postOnly` orders will be canceled immediately if they would fill. If `postOnly` orders do not immediately cancel,
they go on the open order book.


Example Request Body:
```json
{
  "fillOrKill": true,
  "cancelAmountOnRevert": true,
  "postOnly": false,
  "triggerPrice": "0",
  "clientId": "foo",
  "order": {
    "isBuy": true,
    "isDecreaseOnly": false,
    "baseMarket": "0",
    "quoteMarket": "3",
    "amount": "10000000000",
    "limitPrice": "20.3",
    "triggerPrice": "0",
    "limitFee": "0.0015",
    "makerAccountNumber": "0",
    "makerAccountOwner": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};

Request Body (PERPETUAL):

|Field Name|JSON type|Description|
|----------|---------|-----------|
|order|Object|A valid signed Perpetual V2 order JSON object|
|fillOrKill|boolean|Whether the order should be canceled if it cannot be immediately filled|
|postOnly|boolean|Whether the order should be canceled if it would be immediately filled|
|triggerPrice|(Optional)The price at which the order will go to market. Must be greater than triggerPrice in the order|
|cancelId|string|(Optional)Order id for the order that is being canceled and replaced|
|clientId|string|(Optional)An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests.|
|market|string|The perpetual market|
|cancelAmountOnRevert|boolean|Whether to try the order again if it is involved in a reverted fill|

Note: `fillOrKill` orders execute immediately and no part of the order will go on the open order
book. `fillOrKill` orders will either be completely filled, or not filled. Partial fills are not possible.
`postOnly` orders will be canceled immediately if they would fill. If `postOnly` orders do not immediately cancel,
they go on the open order book.


Example Request Body:
```json
{
  "fillOrKill": true,
  "cancelAmountOnRevert": true,
  "postOnly": false,
  "triggerPrice": "0",
  "clientId": "foo",
  "market": "PBTC-USDC",
  "order": {
    "isBuy": true,
    "isDecreaseOnly": false,
    "amount": "10000000000",
    "limitPrice": "20.3",
    "triggerPrice": "0",
    "limitFee": "0.0015",
    "maker": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "taker": "0x7a94831b66a7ae1948b1a94a9555a7efa99cb426",
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};
```

Returns:
`201` if successful

### DELETE /v2/orders/:hash

Description:
Cancels an open order by hash.

Please note you will need to provide a valid cancelation signature in the Authorization header in order to cancel an order.
The Authorization header signature should be hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash but will not include any information about the order format, version, or chainId since these are already baked-into the hash of the order. You can see working examples of signing in the [CanonicalOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/CanonicalOrders.ts) module of Solo.js.

The response will have a status of `200` as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user cancels an order twice, then `200` will be returned both times. For another example, canceling a fully-filled order will return `200` but will NOT update the status of the order from `FILLED` to `CANCELED`. Therefore, receiving a `200` status does not necessarily mean that the order was canceled.

Headers:
```
Content-Type: application/json
Authorization: Bearer [A valid cancel signature]
```

Example Response Body:
```json
{
  "orders": [
    {
      "uuid": "ffb8f5e3-68aa-4dc9-89d2-1de6738b8c3f",
      "id": "0xd17ae8439b99c6c7637808be36d856c6f6f497ab132a7f394f611396b5594844",
      "createdAt": "2020-01-15T22:30:55.533Z",
      "status": "PENDING",
      "accountOwner": "0x998497ffc64240d6a70c38e544521d09dcd23293",
      "accountNumber": "0",
      "orderType": "CANONICAL_CROSS",
      "fillOrKill": false,
      "postOnly": null,
      "market": "WETH-DAI",
      "side": "BUY",
      "baseAmount": "50900000000000000000",
      "quoteAmount": "8386480372200000000000",
      "filledAmount": "0",
      "price": "231.763858",
      "cancelReason": null
    },
  ]
}
```

### A note about Order and Fill status

Both orders and fills returned from the API will provide a status field.

For orders this field represents the current status of the order.
```javascript
export const STATUS = {
  PENDING: 'PENDING', // The order is not yet processed by our internal matching engine
  OPEN: 'OPEN', // The order is open and can be filled
  FILLED: 'FILLED', // The order has been completely filled
  PARTIALLY_FILLED: 'PARTIALLY_FILLED', // The order has been partially filled
  CANCELED: 'CANCELED', // The order has been canceled and can no longer be filled
  FAILED: 'FAILED', // The order failed to be processed due to an internal error
};
```

If the order was canceled, additional information will be provided by the `cancelReason`
field.

For fills the status field represents the status of the transaction on-chain.

```javascript
export const STATUSES = {
  PENDING: 'PENDING', // The fill has been sent to the blockchain but not yet mined
  REVERTED: 'REVERTED', // The fill was sent to the blockchain, but was reverted on-chain
  CONFIRMED: 'CONFIRMED', // The fill was sent to the blockchain and successfully mined
};
```

To get pending balances related to fills in `PENDING` status, see [GET /v1/accounts/:address](#accounts)

### GET /v1/orderbook/:market

Description:
Returns the active orderbook for a given market. All bids and asks that are fillable are returned.

Market is one of: `[WETH-DAI, WETH-USDC, DAI-USDC]`

Amounts for this endpoint are returned in the base asset for the market (e.g. WETH for WETH-DAI). Prices are denominated as `(quote amount) / (base amount)` for each given order. For markets where the tokens have different number of decimals (e.g. DAI-USDC & WETH-USDC) prices will include the decimal places (e.g. prices in DAI-USDC will return as `0.00000000000100252200`)

Headers:
```
Content-Type: application/json
```

Example Response Body:
```json
{
  "bids": [
    {
      "id": "0xefa4562c0747a8f2a9aa69abb817474ee9e98c8505a71de6054a610ac744b0cd",
      "uuid": "c58be890-6e76-4e98-95d4-27977a91af19",
      "amount": "17459277053478281216",
      "price": "160.06010000000002787211"
    },
    {
      "id": "0xa2ab9f653106fefef5b1264a509b02eab021ffea442307e995908e5360f3cd4d",
      "uuid": "d2dba4c6-6442-46bc-b097-1f37312cf279",
      "amount": "149610989871929360384",
      "price": "160.06010000000000157722"
    },
    {
      "id": "0xec35d60dd1c5eab86cd7881fcbc1239193ceda695df2815d521a46f54bd90580",
      "uuid": "24d5a4e1-195b-43fa-a7d8-1d794619e97e",
      "amount": "54494000000000000000",
      "price": "160.05999999999998977766"
    },
  ],
  "asks": [
    {
      "id": "0xb242e2006a0d99c390fc7256d10558844a719d580e80eaa5a4f99dd14bd9ce5e",
      "uuid": "6fdff2f3-0175-4297-bf23-89526eb9aa36",
      "amount": "12074182754430260637",
      "price": "160.30000000000000000000"
    },
    {
      "id": "0xe32a00e11b91b6f8daa70fbe03ad0100fa458c0d87e5c59f2e629ce9d5d32921",
      "uuid": "3f9b35a8-d843-4ae6-bc8b-b534b07e8093",
      "amount": "50000000000000000000",
      "price": "160.40000000000000000000"
    },
    {
      "id": "0xcad0c2e92094bd1dd17a694bd25933a8825c6014aaf4ae2925512f62c15ae968",
      "uuid": "5aefdfd2-4e4d-4b37-9c99-35e8eec0ed9a",
      "amount": "50000000000000000000",
      "price": "160.50000000000000000000"
    },
  ]
}
```

### GET /v2/orders
Description:
Get all orders from the orderbook. Orders can be queried on markets, statuses, as well as accepted order statuses

Headers:
```
Content-Type: application/json
```
Query Params:

|Field Name|Description|
|----------|-----------|
|?accountOwner| The Ethereum address of the account(s) to request fills for.|
|?accountNumber| (Optional) The Solo account number of the account to request fills for.|
|?side| (Optional) Side of the order in (`BUY`, `SELL`)|
|?status| (Optional) Status(es) of the orders to query in (`PENDING`, `OPEN`, `FILLED`, `PARTIALLY_FILLED`, `CANCELED`, `UNTRIGGERED`)
|?orderType| (Optional) Type(s) of orders to query in (`LIMIT`, `ISOLATED_MARKET`, `STOP_LIMIT`)
|?market| (Optional) Market(s) to query trades in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`)|
|?limit| (Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore| (Optional) ISO8601 string. Starts returning orders created before this date.|

Example Response Body:
```json
{
  "orders": [
    {
      "uuid": "ffb8f5e3-68aa-4dc9-89d2-1de6738b8c3f",
      "id": "0xd17ae8439b99c6c7637808be36d856c6f6f497ab132a7f394f611396b5594844",
      "createdAt": "2020-01-15T22:30:55.533Z",
      "status": "OPEN",
      "accountOwner": "0x998497ffc64240d6a70c38e544521d09dcd23293",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": null,
      "market": "WETH-DAI",
      "side": "BUY",
      "baseAmount": "50900000000000000000",
      "quoteAmount": "8386480372200000000000",
      "filledAmount": "0",
      "price": "164.763858",
      "cancelReason": null
    },
    {
      "uuid": "da43af50-56dd-4884-a540-a7314a628b06",
      "id": "0xfb65cfa2ff31e5fbc6629da82cb0a2d7eefcf92ac8b00d94da4c541b60293e8f",
      "createdAt": "2020-01-15T22:30:55.498Z",
      "status": "OPEN",
      "accountOwner": "0x998497ffc64240d6a70c38e544521d09dcd23293",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": null,
      "market": "WETH-DAI",
      "side": "BUY",
      "baseAmount": "50500000000000000000",
      "quoteAmount": "8323093314500000000000",
      "filledAmount": "0",
      "price": "164.813729",
      "cancelReason": null
    }
  ]
}
```

### GET /v2/trades
Description:
Get all historical trades. Where a fill represents one side of a trade, a trade contains both a
maker and a taker. There will be single trade for each fill. The maker in this case represents
the order that was already on the book, where the taker represents the order that was placed
to fill the maker order(s).

Headers:
```
Content-Type: application/json
```
Query Params:

|Field Name|Description|
|----------|-----------|
|?accountOwner|The Ethereum address of the account(s) to request fills for.|
|?accountNumber|(Optional) The Solo account number of the account to request fills for.|
|?limit|(Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore|(Optional) ISO8601 string. Starts returning orders created before this date.|
|?market|(Optional) Market to query trades in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`)|

Example Response Body:
```json
{
  "trades": [
    {
      "uuid": "f3c049a8-ca91-41a3-9466-a0bdbd1a058c",
      "transactionHash": "0x90c4a9835f5c242d1dd18919dfb9b8444cff8df75d518ae0966a6d8205ac9721",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "BUY",
      "price": "142.569999999999978406",
      "amount": "1000000000000000000",
      "makerOrderId": "0x145a78477771cea8ecf077c41c8301de3fedcdca9521361df3e40066bf4aab92",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0x3908e04d89741d802127be31ba0698fe6728da766cf1a820194e13346068da4d",
      "takerAccountOwner": "0xe184468b7103af442509dfb087a9c222353787b3",
      "takerAccountNumber": "0",
      "createdAt": "2019-12-11T21:29:58.032Z"
    },
    {
      "uuid": "f1b7a849-f765-4c18-8842-86e5750e08f5",
      "transactionHash": "0x6d83c6d11d8f8a712acf3066d83292aa13422399b4ed77defd764e32971def4e",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "SELL",
      "price": "142.569999999999978406",
      "amount": "2000000000000000000",
      "makerOrderId": "0x145a78477771cea8ecf077c41c8301de3fedcdca9521361df3e40066bf4aab92",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0xa88bbd489128a0399c516a68d84622aba65971966d174cc98f692d07c70d9d1b",
      "takerAccountOwner": "0x3801d2d7e604e8333baacb2ab53ceeb8d7995416",
      "takerAccountNumber": "0",
      "createdAt": "2019-12-11T21:29:39.707Z"
    },
    {
      "uuid": "4711636c-8ac3-4d92-806b-7d811a2ee7d4",
      "transactionHash": "0xa6b0caa07f44b4d16d253c6a547771b10d230838e692eaa6aabba65aa1f72826",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "BUY",
      "price": "142.569999999999998833",
      "amount": "2000000000000000000",
      "makerOrderId": "0x9d503c9ec3789143f4e47a0928a71cadb83ec445b680eef01ae5808d020c3cab",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0xd93b9b62f44168b4cfa0f1877be5cf329288958c9024158870308d60fd2cc347",
      "takerAccountOwner": "0xe46fbdfc5ec01d5914a802aa06fd0e4c5cd41bd5",
      "takerAccountNumber": "0",
      "createdAt": "2019-12-11T21:19:59.157Z"
    },
    {
      "uuid": "22d04881-f427-45d7-88c8-da61fea00210",
      "transactionHash": "0xbdd78f7dd75f8304b896c6ca5aa9cec847cc14925f70ac93e14958756b3bc372",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "SELL",
      "price": "142.56999999999999883412062732488427883543558159273568954946785561652608982546567212",
      "amount": "500008846251751135",
      "makerOrderId": "0x9d503c9ec3789143f4e47a0928a71cadb83ec445b680eef01ae5808d020c3cab",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0x69ba7a2c7c2d4110e36af82c5f0a9076c4db70a5a3455e27a04a1c525d0233fd",
      "takerAccountOwner": "0xf03df965490882583018c64fd41fa82d7dee032f",
      "takerAccountNumber": "107168784608729135660257601028275559138738399573533131184788900278475157896234",
      "createdAt": "2019-12-11T21:11:02.247Z"
    }
  ]
}
```

### GET /v2/fills
Description:
Get all historical fills.
It's most useful when you care
about the outcome of the trade from the perspective of a particular `accountOwner`.

Headers:
```
Content-Type: application/json
```

Query Params:

|Field Name|Description|
|----------|-----------|
|?accountOwner|The Ethereum address of the account(s) to request fills for.|
|?accountNumber|(Optional) The Solo account number of the account to request fills for.|
|?limit|(Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore|(Optional) ISO8601 string. Starts returning orders created before this date.|
|?market|(Optional) Market to query trades in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`)|
|?orderClientId|(Optional) clientId of order.|

Example Response Body:
```json
{
  "fills": [
    {
      "uuid": "8994f3a0-f5a6-4aa8-a19f-075f076ad999",
      "createdAt": "2020-01-15T00:50:17.042Z",
      "transactionHash": "0x8350fae014702ce62c73762f9f38d29704d9dbf1909dd1fc02526c897207a35a",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "SELL",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "orderId": "0x773a0afd79bcc4c005c79d85ab7da21ff3e6bb11d73e5b3757b25fb1bc9c0f97",
      "orderClientId": null,
      "price": "169.98523710095444091",
      "amount": "100000000000000000",
      "feeAmount": "0",
      "liquidity": "MAKER"
    },
    {
      "uuid": "15a0d654-76d6-4bb4-ad1a-15c088def1b7",
      "createdAt": "2020-01-15T00:49:55.580Z",
      "transactionHash": "0x7419547186ee1c54785162fd6752f4c2e88ca09f0944d8b9c038a0e2cf169a8c",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "BUY",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "orderId": "0x4ef2ab5b3735c43c6ca6d91088884fe3ea43be9b03c3f16eab19aecf259420ab",
      "orderClientId": "d025f607-9827-4043-9445-aec9c4b2e9af",
      "price": "170.94678134323509863",
      "amount": "100000000000000000",
      "feeAmount": "0",
      "liquidity": "TAKER"
    }
  ]
}
```

### GET /v2/markets/:market
Description:
Get all information on specified market

Headers:
```
Content-Type: application/json
```
Query Params:

|Field Name|Description|
|----------|-----------|
|market| The market pair being queried on.|

Example Response Body:
```json
{
 "market": {
    "WETH-DAI": {
      "name": "WETH-DAI",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0,
      },
      "quoteCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3,
      },
      "minimumTickSize": "0.01",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015",
    },
  }
}
```

### GET /v2/markets
Description:
Get all information on all markets

Headers:
```
Content-Type: application/json
```
Query Params:

|Field Name|Description|
|----------|-----------|

Example Response Body:
```json
{
 "markets": {
    "WETH-DAI": {
      "name": "WETH-DAI",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0,
      },
      "quoteCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3,
      },
      "minimumTickSize": "0.01",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015",
    },
    "WETH-USDC": {
      "name": "WETH-USDC",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0,
      },
      "quoteCurrency": {
        "currency": "USDC",
        "decimals": 6,
        "soloMarketId": 2,
      },
      "minimumTickSize": "0.00000000000001",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015",
    },
    "DAI-USDC": {
      "name": "DAI-USDC",
      "baseCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3,
      },
      "quoteCurrency": {
        "currency": "USDC",
        "decimals": 6,
        "soloMarketId": 1,
      },
      "minimumTickSize": "0.0000000000000001",
      "minimumOrderSize": "20000000000000000000",
      "smallOrderThreshold": "100000000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0005",
    },
  }
}
```

### GET /v1/stats/markets
Description:
Get last 24H statistics on markets.

Query Params:
None

Example Response Body:
```json
{
  "markets": {
    "ETH-DAI": {
      "low": "162.4405999999999897",
      "high": "174.2499999999999868",
      "open": "164.2299999999999944",
      "last": "172.3",
      "symbol": "ETH-DAI",
      "baseVolume": "5843.639421040800787051",
      "quoteVolume": "989969.012877626028804362",
      "usdVolume": "986637.73064075646796575518",
      "count": "471"
    },
    "ETH-USDC": {
      "low": "164.6288399939555261",
      "high": "172.3813",
      "open": "165.6253902",
      "last": "172.024530000172056",
      "symbol": "ETH-USDC",
      "baseVolume": "1242.716813796154791774",
      "quoteVolume": "208529.481209",
      "usdVolume": "208996.90504319296510926476",
      "count": "39"
    },
    "DAI-USDC": {
      "low": "0.9955",
      "high": "0.99990000047398794804",
      "open": "0.997",
      "last": "0.9992585",
      "symbol": "DAI-USDC",
      "baseVolume": "125214.755274428622751688",
      "quoteVolume": "124872.38461",
      "usdVolume": "125214.755274428622751688",
      "count": "70"
    }
  }
}
```

### GET /v1/candles/:market
Description:
Get historical trading data

Query Params:

|Field Name|Description|
|----------|-----------|
|res|1HOUR or 1DAY|
|?fromISO|Start ISO date|
|?toISO|End ISO date|

Example Response Body:
```json
{
  "candles": [
    {
      "startedAt": "2019-09-04T00:00:00.000Z",
      "pair": "WETH-DAI",
      "resolution": "1DAY",
      "low": "0",
      "high": "300",
      "open": "184.89",
      "close": "300",
      "baseTokenVolume": "1.520026280892103673",
      "createdAt": "2019-10-31T18:36:51.159Z",
      "updatedAt": "2019-12-02T18:38:11.005Z"
    },
    {
      "startedAt": "2019-09-05T00:00:00.000Z",
      "pair": "WETH-DAI",
      "resolution": "1DAY",
      "low": "180",
      "high": "300",
      "open": "300",
      "close": "180",
      "baseTokenVolume": "0.2",
      "createdAt": "2019-10-31T18:36:51.159Z",
      "updatedAt": "2019-12-02T18:38:11.005Z"
    },
  ]
}
```

## Accounts

### GET /v1/accounts/:address

Description:
Get account balances for a particular account owner. This endpoint can also be used to get pending balances for an account corresponding to pending fills.

Headers:
```
Content-Type: application/json
```

Note: To get any account's collateralization, simply take `sumSupplyUsdValue / sumBorrowUsdValue`.
The minimum collateralization where liquidation occurs on the protocol using this formula is 1.15.

Query Params:

|Field Name|Description|
|----------|-----------|
|?number|(Optional) The Solo Acount number of the account to request balances for.|

Example Response Body:
```json
{
  "owner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
  "number": "0",
  "uuid": "72cd6a2a-17ff-4394-92d3-e951a96aa266",
  "balances": {
    "0": {
      "owner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
      "number": "0",
      "marketId": 0,
      "accountUuid": "72cd6a2a-17ff-4394-92d3-e951a96aa266",
      "wei": "10000184397123234.892111593021043502",
      "pendingWei": "20000184397123234.892111593021043502",
      "expiresAt": null,
      "par": "9994719126810778",
    },
    "1": {
      "par": 0,
      "wei": 0,
      "expiresAt": null
    },
    "2": {
      "par": 0,
      "wei": 0,
      "expiresAt": null
    }
  }
}
```

## Deprecated Endpoints
### POST /v1/dex/orders[DEPRECATED]

Description:
Post a new order to the orderbook.

Please Note:

* There is a limit of 50 active orders on each book per-side. If you exceed this limit,
your request will return `400` and will not be added to the book.

* Your request will return `201`, but the order itself will still have a status of `PENDING` until
it is processed by our internal matching engine.

Headers:
```
Content-Type: application/json
```

Request Body:

|Field Name|JSON type|Description|
|----------|---------|-----------|
|order|Object|A valid signed order JSON object|
|fillOrKill|boolean|Whether the order should be canceled if it cannot be immediately filled|
|postOnly|boolean|Whether the order should be canceled if it would be immediately filled|
|triggerPrice|(Optional)The price at which the order will go to market. Must be greater than triggerPrice in the order|
|clientId|string|(Optional)An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests.|
|cancelAmountOnRevert|boolean|Whether to try the order again if it is involved in a reverted fill|

Note: `fillOrKill` orders execute immediately and no part of the order will go on the open order
book. `fillOrKill` orders will either be completely filled, or not filled. Partial fills are not possible.
`postOnly` orders will be canceled immediately if they would fill. If `postOnly` orders do not immediately cancel,
they go on the open order book.


Example Request Body:
```json
{
        "fillOrKill": true,
        "cancelAmountOnRevert": true,
        "postOnly": false,
        "triggerPrice": "10100000000",
  "clientId": "foo",
  "order": {
    "makerMarket": "0",
    "takerMarket": "1",
    "makerAmount": "10000000000",
    "takerAmount": "20000000000",
    "price": "10100000000",
    "makerAccountNumber": "111",
    "takerAccountOwner": "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
    "takerAccountNumber": "222",
    "triggerPrice": "10000000000",
    "decreaseOnly": false,
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
    },
};
```

### POST /v1/dex/orders/replace[DEPRECATED]

Description:
Atomically cancel an old order and replace with a new order in the orderbook.

Please Note:

* Your request will return `201`, but the new order itself will still have a status of `PENDING` until
it is processed by our internal matching engine. The canceled order will also not be canceled until processed
by our internal matching engine.

* The response will have a status of `201` as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user tries to make the same replace order twice, then `201` will be returned both times. For another example, replacing a fully-filled order will return `201` but will NOT update the status of the order from `FILLED` to `REPLACED`. Therefore, receiving a `201` status does not necessarily mean that the order was replaced.

Headers:
```
Content-Type: application/json
```

Request Body:

|Field Name|JSON type|Description|
|----------|---------|-----------|
|order|Object|A valid signed order JSON object|
|fillOrKill|boolean|Whether the order should be canceled if it cannot be immediately filled|
|postOnly|boolean|Whether the order should be canceled if it would be immediately filled|
|triggerPrice|(Optional)The price at which the order will go to market. Must be greater than triggerPrice in the order|
|cancelId|string|Order id for the order that is being canceled and replaced|
|clientId|string|(Optional)An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests.|
|cancelAmountOnRevert|boolean|Whether to try the order again if it is involved in a reverted fill|

Note: `fillOrKill` orders execute immediately and no part of the order will go on the open order
book. `fillOrKill` orders will either be completely filled, or not filled. Partial fills are not possible.
`postOnly` orders will be canceled immediately if they would fill. If `postOnly` orders do not immediately cancel,
they go on the open order book.

Example Request Body:
```json
{
  "fillOrKill": true,
  "cancelAmountOnRevert": true,
  "postOnly": false,
  "triggerPrice": "10100000000",
  "cancelId": "0x2c45cdcd3bce2dd0f2b40502e6bea7975f6daa642d12d28620deb18736619fa2",
  "clientId": "foo",
  "order": {
    "makerMarket": "0",
    "takerMarket": "1",
    "makerAmount": "10000000000",
    "takerAmount": "20000000000",
    "makerAccountOwner": "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    "makerAccountNumber": "111",
    "takerAccountOwner": "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
    "takerAccountNumber": "222",
    "triggerPrice": "10000000000",
    "decreaseOnly": false,
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};
```

### GET /v1/dex/pairs [DEPRECATED]

Description:
Returns all dex-compatible pairs. Be aware that there are two "pairs" for each unique order pair.

For example, in the unique pair WETH and DAI, there are two pairs, one for each side of the book.
The pairs are always named as `MAKER-TAKER`.

Headers:
```
Content-Type: application/json
```

Example Response Body:
```json
{
    "pairs": [
        {
            "uuid": "e401535b-e43a-4a79-933f-7c1950cabbdf",
            "name": "DAI-WETH",
            "createdAt": "2019-08-13T19:12:27.386Z",
            "updatedAt": "2019-08-13T19:12:27.386Z",
            "deletedAt": null,
            "makerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
            "takerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
            "makerCurrency": {
                "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                "symbol": "DAI",
                "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                "decimals": 18,
                "soloMarket": 1,
                "createdAt": "2019-08-13T19:12:27.365Z",
                "updatedAt": "2019-08-13T19:12:27.365Z",
                "deletedAt": null
            },
            "takerCurrency": {
                "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                "symbol": "WETH",
                "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "decimals": 18,
                "soloMarket": 0,
                "createdAt": "2019-08-13T19:12:27.227Z",
                "updatedAt": "2019-08-13T19:12:27.227Z",
                "deletedAt": null
            }
        },
        {
            "uuid": "65354d23-f9a0-49fa-b823-4c0592e0fa60",
            "name": "WETH-DAI",
            "createdAt": "2019-08-13T19:12:27.386Z",
            "updatedAt": "2019-08-13T19:12:27.386Z",
            "deletedAt": null,
            "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
            "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
            "makerCurrency": {
                "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                "symbol": "WETH",
                "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "decimals": 18,
                "soloMarket": 0,
                "createdAt": "2019-08-13T19:12:27.227Z",
                "updatedAt": "2019-08-13T19:12:27.227Z",
                "deletedAt": null
            },
            "takerCurrency": {
                "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                "symbol": "DAI",
                "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                "decimals": 18,
                "soloMarket": 1,
                "createdAt": "2019-08-13T19:12:27.365Z",
                "updatedAt": "2019-08-13T19:12:27.365Z",
                "deletedAt": null
            }
        }
    ]
}
```

Returns:
`200` if successful

### GET /v1/dex/orders [DEPRECATED - use /v2/orders]

Description:
Get all open orders from the orderbook. This includes both unfilled and partially filled orders, but
does not include canceled, pruned, or unfillable orders.

Headers:
```
Content-Type: application/json
```

Query Params:

|Field Name|Description|
|----------|-----------|
|?makerAccountOwner|(Optional) The Ethereum address of the account(s) to request orders for.|
|?makerAccountNumber|(Optional) The Solo account number of the account to request orders for.|
|?limit|(Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore|(Optional) ISO8601 string. Starts returning orders created before this date.|
|?pairs|(Optional) Array of pairs to filter by (e.g. ?pairs=WETH-DAI,DAI-WETH)|
|?status|(Optional) Array of status to filter by (e.g. ?status=CANCELED,FILLED)|

Example Response Body:
```json
{
    "orders": [
        {
            "uuid": "d13aadc8-49fb-4420-a5a0-03c15b668705",
            "id": "0x2c45cdcd3bce2dd0f2b40502e6bea7975f6daa642d12d28620deb18736619fa2",
            "makerAccountOwner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
            "makerAccountNumber": "0",
            "status": "PENDING",
            "price": "1",
            "clientId": "foo",
            "fillOrKill": false,
            "postOnly": false,
            "rawData": "{\"makerMarket\":\"0\",\"takerMarket\":\"1\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"222\",\"makerAccountOwner\":\"0x0913017c740260fea4b2c62828a4008ca8b0d6e4\",\"takerAccountOwner\":\"0x28a8746e75304c0780e011bed21c72cd78cd535e\",\"makerAmount\":\"10\",\"takerAmount\":\"10\",\"salt\":\"79776019296374116968729143546164248655125424402698335194396863096742023853053\",\"expiration\":\"0\",\"typedSignature\":\"0x9db8cc7ee2e06525949a0ae87301d890aee9973c464b276661d760ca8db4c73522ba48b94bf36d4aada7627656f79be9e40225a52f0adec079b07263b9e8ee0c1b01\"}",
            "makerAmount": "10",
            "expiresAt": null,
            "unfillableAt": null,
            "unfillableReason": null,
            "takerAmount": "10",
            "makerAmountRemaining": "10",
            "takerAmountRemaining": "10",
            "createdAt": "2019-07-29T23:56:25.522Z",
            "updatedAt": "2019-07-29T23:56:25.522Z",
            "deletedAt": null,
            "pairUuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
            "pair": {
                "uuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
                "name": "WETH-DAI",
                "createdAt": "2019-07-26T17:19:34.955Z",
                "updatedAt": "2019-07-26T17:19:34.955Z",
                "deletedAt": null,
                "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                "makerCurrency": {
                    "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                    "symbol": "WETH",
                    "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    "decimals": 18,
                    "soloMarket": 0,
                    "createdAt": "2019-07-26T17:19:34.627Z",
                    "updatedAt": "2019-07-26T17:19:34.627Z",
                    "deletedAt": null
                },
                "takerCurrency": {
                    "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                    "symbol": "DAI",
                    "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                    "decimals": 18,
                    "soloMarket": 1,
                    "createdAt": "2019-07-26T17:19:34.919Z",
                    "updatedAt": "2019-07-26T17:19:34.919Z",
                    "deletedAt": null
                }
            },
            "fills": []
        }
    ]
}
```

### GET /v1/dex/orders/:id [DEPRECATED - use /v2/orders/:id]

Description:
Get an order by orderId

Example Response Body:
```json
{
    "order": {
        "uuid": "80d500c0-683b-4b62-852c-aff0646dac3f",
        "id": "0x887ec43045d7f529564132f7cffce152eca6694d03e4594147569b977113becb",
        "makerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
        "makerAccountNumber": "0",
        "status": "PARTIALLY_FILLED",
        "price": "0.004974629390110436772460451696348622027658939409014028454880111431698338473784",
        "fillOrKill": false,
        "postOnly": false,
        "rawData": "{\"makerMarket\":\"1\",\"takerMarket\":\"0\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"0\",\"makerAccountOwner\":\"0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8\",\"takerAccountOwner\":\"0xf809e07870dca762B9536d61A4fBEF1a17178092\",\"makerAmount\":\"2010200000000000000\",\"takerAmount\":\"10000000000000000\",\"salt\":\"63517970482988907828502269663484214646761418296755166268654358377296169568397\",\"expiration\":\"1569280418\",\"typedSignature\":\"0x29d4c79f1ef15bb489eaf1bc4bb4eb0a1eb63ef8e83ef0c68b19a61159041e2f29c283797f0fc4fae56728f0dd8e47f67b51287795c163ceedb77b5b6672ca231c00\"}",
        "makerAmount": "2010200000000000000",
        "unfillableAt": null,
        "expiresAt": "2019-09-23T23:13:38.000Z",
        "unfillableReason": null,
        "clientId": null,
        "takerAmount": "10000000000000000",
        "makerAmountRemaining": "10050999989438200",
        "orderType": "dydexLimitV1",
        "takerAmountRemaining": "49999999947458",
        "createdAt": "2019-08-26T23:13:42.257Z",
        "updatedAt": "2019-08-27T17:16:24.064Z",
        "deletedAt": null,
        "pairUuid": "83b69358-a05e-4048-bc11-204da54a8b19",
        "pair": {
            "uuid": "83b69358-a05e-4048-bc11-204da54a8b19",
            "name": "DAI-WETH",
            "createdAt": "2018-08-24T16:26:46.963Z",
            "updatedAt": "2018-08-24T16:26:46.963Z",
            "deletedAt": null,
            "makerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
            "takerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c"
        }
    }
}
```

### GET /v1/dex/fills [Deprecated - use /v2/fills]

Description:
Get all historical fills. A fill represents one side of a trade. It's most useful when you care
about the outcome of the trade from the perspective of a particular `makerAccountOwner`.

Headers:
```
Content-Type: application/json
```

Query Params:

|Field Name|Description|
|----------|-----------|
|?makerAccountOwner|The Ethereum address of the account(s) to request fills for.|
|?makerAccountNumber|(Optional) The Solo account number of the account to request fills for.|
|?limit|(Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore|(Optional) ISO8601 string. Starts returning orders created before this date.|
|?pairs|(Optional) Array of pairs to filter by (e.g. ?pairs=WETH-DAI,DAI-WETH)|

Example Response Body:
```json
{
    "fills": [
        {
            "uuid": "c389c0de-a193-49c3-843a-eebee25d1bfa",
            "status": "PENDING",
            "orderId": "0x66a5b2d4bca3414ed902bd7cda0500df5947fadbfd48c280a206d44606c1c906",
            "transactionHash": "0x811cf67aca5fb8d085efcc47cd8213e767410866c7c840f2177391bf6e6b2fd0",
            "fillAmount": "10",
            "createdAt": "2019-07-27T00:48:15.963Z",
            "updatedAt": "2019-07-27T00:48:15.963Z",
            "deletedAt": null,
            "order": {
                "uuid": "b415de0d-a54c-4496-a8af-0a15d9fb95d5",
                "id": "0x66a5b2d4bca3414ed902bd7cda0500df5947fadbfd48c280a206d44606c1c906",
                "makerAccountOwner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
                "makerAccountNumber": "0",
                "status": "FILLED",
                "price": "1",
                "fillOrKill": false,
                "postOnly": false,
                "rawData": "{\"makerAccountOwner\":\"0x0913017c740260fea4b2c62828a4008ca8b0d6e4\",\"takerAccountOwner\":\"0x28a8746e75304c0780e011bed21c72cd78cd535e\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"222\",\"makerMarket\":\"0\",\"takerMarket\":\"1\",\"makerAmount\":\"10\",\"takerAmount\":\"10\",\"salt\":\"0\",\"expiration\":\"0\",\"typedSignature\":\"0xd9561c880b9572899eb97901f58423a610640357c1d36138f0bd31b16ca17edb715ec175b7cd7a308d70e88a6654ac706672419765720b6d8e357e60a9a5ce9b1c01\"}",
                "makerAmount": "10",
                "expiresAt": null,
                "unfillableAt": "2019-07-27T00:48:16.000Z",
                "unfillableReason": "ENTIRELY_FILLED",
                "takerAmount": "10",
                "makerAmountRemaining": "0",
                "takerAmountRemaining": "0",
                "createdAt": "2019-07-26T17:20:36.999Z",
                "updatedAt": "2019-07-27T00:48:16.001Z",
                "deletedAt": null,
                "pairUuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
                "pair": {
                    "uuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
                    "name": "WETH-DAI",
                    "createdAt": "2019-07-26T17:19:34.955Z",
                    "updatedAt": "2019-07-26T17:19:34.955Z",
                    "deletedAt": null,
                    "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                    "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                    "makerCurrency": {
                        "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                        "symbol": "WETH",
                        "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "decimals": 18,
                        "soloMarket": 0,
                        "createdAt": "2019-07-26T17:19:34.627Z",
                        "updatedAt": "2019-07-26T17:19:34.627Z",
                        "deletedAt": null
                    },
                    "takerCurrency": {
                        "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                        "symbol": "DAI",
                        "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                        "decimals": 18,
                        "soloMarket": 1,
                        "createdAt": "2019-07-26T17:19:34.919Z",
                        "updatedAt": "2019-07-26T17:19:34.919Z",
                        "deletedAt": null
                    }
                }
            }
        },
    ]
}
```

### DELETE /v1/dex/orders/:hash [DEPRECATED - use /v2/orders/:hash]

Description:
Cancels an open order by hash.

Please note you will need to provide a valid cancelation signature in the Authorization header in order to cancel an order.
The Authorization header signature should be hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash but will not include any information about the order format, version, or chainId since these are already baked-into the hash of the order. You can see working examples of signing in the [LimitOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/LimitOrders.ts) module of Solo.js.

The response will have a status of `200` as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user cancels an order twice, then `200` will be returned both times. For another example, canceling a fully-filled order will return `200` but will NOT update the status of the order from `FILLED` to `CANCELED`. Therefore, receiving a `200` status does not necessarily mean that the order was canceled.

Headers:
```
Content-Type: application/json
Authorization: Bearer [A valid cancel signature]
```

Example Response Body:
```json
{
    "orders": [
        {
            "uuid": "d13aadc8-49fb-4420-a5a0-03c15b668705",
            "id": "0x2c45cdcd3bce2dd0f2b40502e6bea7975f6daa642d12d28620deb18736619fa2",
            "makerAccountOwner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
            "makerAccountNumber": "0",
            "status": "PENDING",
            "price": "1",
            "fillOrKill": false,
            "triggerPrice": "10100000000",
            "decreaseOnly": false,
            "postOnly": false,
            "rawData": "{\"makerMarket\":\"0\",\"takerMarket\":\"1\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"222\",\"makerAccountOwner\":\"0x0913017c740260fea4b2c62828a4008ca8b0d6e4\",\"takerAccountOwner\":\"0x28a8746e75304c0780e011bed21c72cd78cd535e\",\"makerAmount\":\"10\",\"takerAmount\":\"10\",\"salt\":\"79776019296374116968729143546164248655125424402698335194396863096742023853053\",\"expiration\":\"0\",\"typedSignature\":\"0x9db8cc7ee2e06525949a0ae87301d890aee9973c464b276661d760ca8db4c73522ba48b94bf36d4aada7627656f79be9e40225a52f0adec079b07263b9e8ee0c1b01\":\"triggerPrice\"10000000000\"}",
            "makerAmount": "10",
            "unfillableAt": null,
            "unfillableReason": null,
            "takerAmount": "10",
            "expiresAt": null,
            "makerAmountRemaining": "10",
            "takerAmountRemaining": "10",
            "createdAt": "2019-07-29T23:56:25.522Z",
            "updatedAt": "2019-07-29T23:56:25.522Z",
            "deletedAt": null,
            "pairUuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
            "pair": {
                "uuid": "b9b38876-c3a6-470e-81cf-d352d26685d0",
                "name": "WETH-DAI",
                "createdAt": "2019-07-26T17:19:34.955Z",
                "updatedAt": "2019-07-26T17:19:34.955Z",
                "deletedAt": null,
                "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                "makerCurrency": {
                    "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                    "symbol": "WETH",
                    "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    "decimals": 18,
                    "soloMarket": 0,
                    "createdAt": "2019-07-26T17:19:34.627Z",
                    "updatedAt": "2019-07-26T17:19:34.627Z",
                    "deletedAt": null
                },
                "takerCurrency": {
                    "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                    "symbol": "DAI",
                    "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                    "decimals": 18,
                    "soloMarket": 1,
                    "createdAt": "2019-07-26T17:19:34.919Z",
                    "updatedAt": "2019-07-26T17:19:34.919Z",
                    "deletedAt": null
                }
            },
            "fills": []
        }
    ]
}
```

## Perpetual Endpoints

### GET /v1/perpetual-markets
This will return the market data.

Query Params:
None

Example Response Body:

```json
{
  "markets": [
    {
      "createdAt": "2020-02-18T17:56:06.219Z",
      "updatedAt": "2020-02-18T17:56:06.219Z",
      "market": "PBTC-USDC",
      "oraclePrice": "6000000000000000000000",
      "fundingRate": "0.999991",
      "globalIndexValue": "6000000000000000000000",
      "globalIndexTimestamp": "1585933964",
    }
  ]
}
```

### Markets Response Object

|Field Name|Description|
|----------|-----------|
|market|The market string eg: PBTC-USDC|
|oraclePrice|The market price from the oracle|
|fundingRate|The funding rate for the market|
|globalIndexValue|The current index value for the market|
|globalIndexTimestamp|The timestamp for the index|

### GET /v1/perpetual-balance-updates

Query Params:
|Field Name|Description|
|----------|-----------|
| owner | The wallet address of the user |
| limit | The maximum number of balance updates to retrieve |

Example Response Body:

```json
{
  "balanceUpdates": [
    {
      "uuid": "6c2f7a09-d602-4c1a-a435-e915ed64423d",
      "owner": "0xba7353ff41853ca0429a594584ae256231decb51",
      "createdAt": "2020-01-18T17:56:06.219Z",
      "updatedAt": "2020-02-14T19:01:06.198Z",
      "market": "PBTC-USDC",
      "deltaMargin": "0.00000000121",
      "newMargin": "10.00000000001",
      "deltaPosition": "0",
      "newPosition": "15000",
      "indexValue": "6000000000000000000000",
      "indexTimestamp": "1585934124",
      "orderNumber": "956855500050000",
    }
  ]
}
```

### Balance Update Response Object

|Field Name|Description|
|----------|-----------|
|uuid|The unique id for balance updates|
|owner|The wallet address of the user|
|createdAt|The ISO time the balance update was created|
|updatedAt|The ISO time the balance update was updated|
|market|The perpetual market, e.g. PBTC-USDC|
|deltaMargin|The change in settlement token (e.g. USDC)|
|newMargin|The new balance of settlement token (e.g. USDC)|
|deltaPosition|The change in position token (e.g. PBTC)|
|newPosition|The amount in position token (e.g. PBTC)|
|indexValue|The new index value of the account|
|indexTimestamp|The new index timestamp of the account|
|orderNumber|Number used for ordering the balance updates|


### GET /v1/standard-actions
This will return the standard actions for a particular user.

Query Params:

|Field Name|Description|
|----------|-----------|
|owner|The wallet address of the user|
|type|The type of standard action eg: OPEN, CLOSE, DEPOSIT|
|market|The market of the action eg: PBTC-USDC|
|limit|The maximum number of standard actions to retrieve|
|product|The product of the standard action, eg: perpetual or solo|

Example Response Body:

```json
{
  "standardActions": [
    {
      "uuid": "b95fa3fc-84a7-46f1-9ce0-1eca1b144117",
      "type": "DEPOSIT",
      "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "transferAmount": "33720746949513441",
      "price": "6227979999899999000000",
      "market": "PBTC-USDC",
      "side": "LONG",
      "orderNumber": "956855500050000",
      "confirmedAt": "2020-02-27T23:10:31.000Z",
      "createdAt": "2020-02-27T23:11:31.758Z",
      "updatedAt": "2020-02-27T23:11:31.778Z",
      "product": "perpetual",
    },
  ]
}
```

### Standard Action Response Object

|Field Name|Description|
|----------|-----------|
|uuid|The unique id for the action|
|owner|The wallet address of the user|
|type|The type of standard action eg: DEPOSIT|
|market|The perpetual market, e.g. PBTC-USDC|
|side|The side for the standard action eg: LONG, SHORT|
|transferAmount|The amount in settlement token that is transferred|
|price|The price in settlement token|
|orderNumber|Number used for ordering the standard actions|
|updatedAt|The ISO time the standard action was updated|
|createdAt|The ISO time the standard action was created|
|confirmedAt|The ISO time the standard action was confirmed|
|product|The product type, eg: perpetual or solo|

### GET /v1/perpetual-accounts/`{walletAddress}`

This endpoint takes in the user's walletAddress, and returns balances
for the account.

Query Params:
None

Example Response Body:

```json
{
  "owner": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc3",
  "balances": {
    "PBTC-USDC": {
      "margin": "120000",
      "position": "20",
      "indexValue": "6000000000000000000000",
      "indexTimestamp": "1585933964",
      "cachedMargin": "12005",
    }
  }
}
```

### Account Response Object

|Field Name|Description|
|----------|-----------|
|owner|The user's wallet address|
|balances|An object with the user's balances for each market|
|margin|The balance in settlement token (eg USDC)|
|position|The amount in position token (e.g. PBTC)|
