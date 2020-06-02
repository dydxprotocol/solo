# HTTP API

dYdX offers an HTTP API for retrieving information about the protocol, and submitting orders to
our exchange. Feel free to use these APIs to build your own applications on top of dYdX.
Please let us know via Intercom or Telegram if you have any questions or experience any issues.

All of these endpoints live at `https://api.dydx.exchange/`

e.g. `https://api.dydx.exchange/v2/orders`

## Introduction

The API endpoints described below can be used for submitting and retrieving orders from the dYdX orderbook.
This orderbook is what's sometimes referred to as a "Matching Model" orderbook. This means that
all orders are submitted to the blockchain by dYdX itself. You do not need to provide gas fees
or send on-chain transactions yourself. This is especially useful for traders and market makers who
wish to be able to quickly cancel their orders without waiting for a transaction to be mined.

The HTTP API is documented below. For easier implementation we recommend using the official [Python Client](python.md) or [TypeScript Client](typescript.md#api). We may build clients for other languages in the future, so if you have other language/framework needs, please let us know.

### Creating and Signing Orders

In order to submit an order, you (the maker) must first create a JSON object specifying the
details of your order. You must then sign the order with your Ethereum private key,
and put the result in the `typedSignature` field. Note that the `typedSignature` field is omitted
before signing, and added only after signing the message.

The order data is hashed and signed according to [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).
The hash includes the exact order schema and schema version, as well as information about the
verifying contract and the chain ID of the network.
See the [CanonicalOrders.ts](https://github.com/dydxprotocol/solo/blob/master/src/modules/CanonicalOrders.ts)
Solo client module and the [Orders.ts](https://github.com/dydxprotocol/perpetual/blob/master/src/modules/Orders.ts)
Perpetual client module for reference implementations for signing orders.

When creating your order you _must_ specify the takerAccountOwner as `0xf809e07870dca762B9536d61A4fBEF1a17178092` and the takerAccountNumber
as `0`, otherwise your order will be rejected.

After this is done, the order is ready to be submitted to the API.

### Solo V2 order fields

| Field Name         | JSON type | Description                                                                                                                                            |
|--------------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| isBuy              | boolean   | Whether the order is a buy order.                                                                                                                      |
| isDecreaseOnly     | boolean   | (Optional) Whether the Stop-Limit order is tied to an existing Isolated Position.                                                                      |
| baseMarket         | string    | The Solo base [market](protocol.md#markets).                                                                                                           |
| quoteMarket        | string    | The Solo quote [market](protocol.md#markets).                                                                                                          |
| amount             | string    | The amount of token being offered, in base units.                                                                                                      |
| limitPrice         | string    | The worst base/quote price at which a fill will be accepted.                                                                                           |
| triggerPrice       | string    | (Optional) The stop price at which the order will go to market.                                                                                        |
| limitFee           | string    | Makers pay 0% fees. Takers pay 0.15% for ETH-DAI and ETH-USDC and 0.05% for DAI-USDC. The taker fee is increased to 0.50% for amounts less than 5 ETH. |
| makerAccountNumber | string    | The Solo [account number](protocol.md#accounts) of the Maker                                                                                           |
| makerAccountOwner  | string    | The Ethereum address of the Maker.                                                                                                                     |
| expiration         | string    | The Unix time in seconds at which this order will expire and can no longer be filled. Use `"0"` to specify that the order does not expire.             |
| salt               | string    | A random number to make the order hash unique.                                                                                                         |
| typedSignature     | string    | The signature of the order.                                                                                                                            |

**Tick size:**

The tick size is `0.01` for ETH-DAI, `0.01e-12` for ETH-USDC and `0.0001e-12` for DAI-USDC transactions. The negative twelfth power is due to the fact that the USDC smart contract uses 6 decimal places of precision whereas ETH and DAI use 18.
The `limitPrice` must be a multiple of the tick size.
If `triggerPrice` is set, it must be a multiple of the tick size.

**Example:**

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
}
```

### Perpetual V2 order fields

| Field Name     | JSON type | Description                                                                                                                                 |
|----------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------|
| isBuy          | boolean   | Whether the order is a buy order.                                                                                                           |
| isDecreaseOnly | boolean   | (Optional) Positions can only decrease in magnitude when trading this order. *Must be false currently.*                                     |
| amount         | string    | The amount of token being offered, in base units.                                                                                           |
| limitPrice     | string    | The worst base/quote price at which the transaction will be accepted.                                                                       |
| triggerPrice   | string    | (Optional) The stop price at which the order will go to market.                                                                             |
| limitFee       | string    | Makers pay -0.025% fees (i.e. they receive a rebate). Takers pay 0.075%. The taker fee is increased to 0.50% for amounts less than 0.1 BTC. |
| maker          | string    | The Ethereum address of the Maker.                                                                                                          |
| taker          | string    | The Ethereum address of the Taker.                                                                                                          |
| expiration     | string    | The Unix time in seconds at which this order will expire and can no longer be filled. Use `"0"` to specify that the order does not expire.  |
| salt           | string    | A random number to make the orderHash unique.                                                                                               |
| typedSignature | string    | The signature of the order.                                                                                                                 |

**Tick size:**

The tick size is `1` for PBTC-USDC. The `limitPrice` must be a multiple of the tick size.
If `triggerPrice` is set, it must be a multiple of the tick size.

**Example:**

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
}
```

## Solo and Perpetual endpoints

### POST `/v2/orders`

Description:
Post a new order to the orderbook.

Note:

* Each account may have at most 50 orders open for a given trading pair on a given side of the book. If you exceed this limit, your request will return `400` and will not be added to the book.

* Successful calls will return `201`, but the order itself will still have a status of `PENDING` until
it is processed by our internal matching engine.

* The request fields are different for Solo and Perpetual orders. Please refer to the Solo V2 and Perpetual V2 order fields above. Note that the market field is required on the request body for Perpetual orders.

Headers:
```
Content-Type: application/json
```

Request Body (SOLO):

| Field Name           | JSON type | Description                                                                                                                                     |
|----------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| order                | Object    | A valid signed Solo V2 order JSON object.                                                                                                       |
| fillOrKill           | boolean   | Whether the order should be canceled if it cannot be immediately filled.                                                                        |
| postOnly             | boolean   | Whether the order should be canceled if it would be immediately filled.                                                                         |
| triggerPrice         | string    | (Optional) The stop price at which the order will go to market. Must be greater than or equal to triggerPrice in the order.                     |
| cancelId             | string    | (Optional) ID of an order to cancel and replace.                                                                                                |
| clientId             | string    | (Optional) An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests. |
| setExpirationOnFill  | boolean   | (Optional) Expiration field for order will be applied upon the order filling.                                                                   |
| cancelAmountOnRevert | boolean   | (Optional) Whether to try the order again if it is involved in a reverted fill.                                                                 |

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
  }
}
```

Request Body (PERPETUAL):

| Field Name           | JSON type | Description                                                                                                                                     |
|----------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| order                | Object    | A valid signed Perpetual V2 order JSON object.                                                                                                  |
| fillOrKill           | boolean   | Whether the order should be canceled if it cannot be immediately filled.                                                                        |
| postOnly             | boolean   | Whether the order should be canceled if it would be immediately filled.                                                                         |
| triggerPrice         | string    | (Optional) The stop price at which the order will go to market. Must be greater than or equal to triggerPrice in the order.                     |
| cancelId             | string    | (Optional) ID of an order to cancel and replace.                                                                                                |
| clientId             | string    | (Optional) An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests. |
| market               | string    | The perpetual [market](protocol.md#markets).                                                                                                    |
| cancelAmountOnRevert | boolean   | (Optional) Whether to try the order again if it is involved in a reverted fill.                                                                 |

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

### DELETE `/v2/orders/:hash`

Description:
Cancels an open order by hash.

You will need to provide a valid cancelation signature in the Authorization header in order to cancel an order. The Authorization header signature should be hashed according to [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash. See the [CanonicalOrders.ts](https://github.com/dydxprotocol/solo/blob/master/src/modules/CanonicalOrders.ts) Solo client module and the [Orders.ts](https://github.com/dydxprotocol/perpetual/blob/master/src/modules/Orders.ts) Perpetual client module for reference implementations for signing order cancellations.

The response will have a status of `200` as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user cancels an order twice, then `200` will be returned both times. As another example, canceling a fully-filled order will return `200` but will NOT update the status of the order from `FILLED` to `CANCELED`. Therefore, receiving a `200` status does not necessarily mean that the order was canceled.

Headers:
```
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

### GET `/v1/orderbook/:market`

Description:
Returns the active orderbook for a market. All bids and asks that are fillable are returned.

Market is one of: `[WETH-DAI, WETH-USDC, DAI-USDC, PBTC-USDC]`

Amounts for this endpoint are returned in the base asset for the market (e.g. WETH for WETH-DAI). Prices are denominated as `(quote amount) / (base amount)` for each given order. For markets where the tokens have different number of decimals (e.g. DAI-USDC & WETH-USDC) prices will include the decimal places (e.g. prices in DAI-USDC will look like `0.00000000000100252200`)

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

### GET `/v2/orders`

Description:
Get orders from the active orderbook and order history.

Orders can be filtered on fields like market, status, and accepted order status, and are returned in descending order by `createdAt`. At most 100 orders are returned.

Query Params:

| Field Name     | Description                                                                                                                  |
|----------------|------------------------------------------------------------------------------------------------------------------------------|
| accountOwner   | (Optional) The Ethereum address of the account(s) to request orders for.                                                     |
| accountNumber  | (Optional) The Solo account number of the account to request orders for.                                                     |
| side           | (Optional) Side of the order in (`BUY`, `SELL`)                                                                              |
| status         | (Optional) Status(es) of the orders to query in (`PENDING`, `OPEN`, `FILLED`, `PARTIALLY_FILLED`, `CANCELED`, `UNTRIGGERED`) |
| orderType      | (Optional) Type(s) of orders to query in (`LIMIT`, `ISOLATED_MARKET`, `STOP_LIMIT`)                                          |
| market         | (Optional) Market(s) to query in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`, `PBTC-USDC`)                                          |
| limit          | (Optional) The maximum number of orders to return. The default, and maximum, is 100.                                         |
| startingBefore | (Optional) ISO 8601 date and time. Starts returning orders created before this date.                                         |

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

### GET `/v2/trades`

Description:
Get all historical trades. Where a fill represents one side of a trade, a trade contains both a
maker and a taker. There will be single trade for each fill. The maker in this case represents
the order that was already on the book, where the taker represents the order that was placed
to fill the maker order(s).

Query Params:

| Field Name     | Description                                                                          |
|----------------|--------------------------------------------------------------------------------------|
| accountOwner   | (Optional) The Ethereum address of the account(s) to request trades for.             |
| accountNumber  | (Optional) The Solo account number of the account to request trades for.             |
| limit          | (Optional) The maximum number of trades to return. The default, and maximum, is 100. |
| startingBefore | (Optional) ISO 8601 date and time. Starts returning trades created before this date. |
| market         | (Optional) Market to query in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`, `PBTC-USDC`)     |

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

### GET `/v2/fills`

Description:
Get all historical fills. This endpoint is most useful if you care about the outcome of the trade from the perspective of a particular `accountOwner`.

Query Params:

| Field Name     | Description                                                                         |
|----------------|-------------------------------------------------------------------------------------|
| accountOwner   | (Optional) The Ethereum address of the account(s) to request fills for.             |
| accountNumber  | (Optional) The Solo account number of the account to request fills for.             |
| limit          | (Optional) The maximum number of fills to return. The default, and maximum, is 100. |
| startingBefore | (Optional) ISO 8601 date and time. Starts returning fills created before this date. |
| market         | (Optional) Market to query in (`WETH-DAI`, `WETH-USDC`, `DAI-USDC`, `PBTC-USDC`)    |
| orderClientId  | (Optional) clientId of order.                                                       |

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

### GET `/v1/stats/markets`

Description:
Get market statistics for the last 24 hours.

Query Params:
None

Example Response Body:

```json
{
  "markets": {
    "ETH-DAI": {
      "symbol": "ETH-DAI",
      "low": "162.4405999999999897",
      "high": "174.2499999999999868",
      "open": "164.2299999999999944",
      "last": "172.3",
      "count": "471",
      "baseVolume": "5843.639421040800787051",
      "quoteVolume": "989969.012877626028804362",
      "usdVolume": "986637.73064075646796575518",
      "type": "SPOT"
    },
    "ETH-USDC": {
      "symbol": "ETH-USDC",
      "low": "164.6288399939555261",
      "high": "172.3813",
      "open": "165.6253902",
      "last": "172.024530000172056",
      "count": "39",
      "baseVolume": "1242.716813796154791774",
      "quoteVolume": "208529.481209",
      "usdVolume": "208996.90504319296510926476",
      "type": "SPOT"
    },
    "DAI-USDC": {
      "symbol": "DAI-USDC",
      "low": "0.9955",
      "high": "0.99990000047398794804",
      "open": "0.997",
      "last": "0.9992585",
      "count": "70",
      "baseVolume": "125214.755274428622751688",
      "quoteVolume": "124872.38461",
      "usdVolume": "125214.755274428622751688",
      "type": "SPOT"
    },
    "PBTC-USDC": {
      "symbol": "PBTC-USDC",
      "low": "8909.0000",
      "high": "9592.0000",
      "open": "9488.0000",
      "last": "8944.0000",
      "count": "221",
      "baseVolume": "116.5380",
      "quoteVolume": "1057559.1430",
      "usdVolume": "1057559.1430",
      "type": "PERPETUAL"
    }
  }
}
```

### GET `/v1/candles/:market`

Description:
Get historical trade statistics for a Solo market.

Query Params:

| Field Name | Description                   |
|------------|-------------------------------|
| res        | `1HOUR` or `1DAY`             |
| fromISO    | Start ISO 8601 date and time. |
| toISO      | End ISO 8601 date and time.   |

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


### GET `/v1/standard-actions`

Description:

Gets the perpetual and solo standard actions for a particular user.

Query Params:

| Field Name | Description                                                                |
|------------|----------------------------------------------------------------------------|
| owner      | (optional) The wallet address of the user.                                 |
| number     | (optional) The account number for the specified wallet address             |
| type       | (optional) The type of standard action e.g. `OPEN`, `CLOSE`, `DEPOSIT`.    |
| asset      | (optional) The asset for the standard action eg: `WETH`, `DAI`             |
| market     | (optional) The market of the action e.g. `PBTC-USDC`.                      |
| limit      | (optional) The maximum number of standard actions to retrieve.             |
| product    | (optional) The product of the standard action, e.g. `PERPETUAL` or `SOLO`. |

Standard Action types:

| Type                   | Product         |
|------------------------|-----------------|
| DEPOSIT                | SOLO, PERPETUAL |
| REPAY                  | SOLO            |
| WITHDRAW               | SOLO, PERPETUAL |
| BORROW                 | SOLO            |
| LIQUIDATE              | SOLO, PERPETUAL |
| LIQUIDATED             | SOLO, PERPETUAL |
| EXPIRE                 | SOLO            |
| EXPIRED                | SOLO            |
| TRADE                  | SOLO            |
| ISOLATED_OPEN          | SOLO            |
| ISOLATED_PARTIAL_CLOSE | SOLO            |
| ISOLATED_FULL_CLOSE    | SOLO            |
| ACCOUNT_SETTLE         | PERPETUAL       |
| OPEN                   | PERPETUAL       |
| CLOSE                  | PERPETUAL       |
| INCREASE               | PERPETUAL       |
| DECREASE               | PERPETUAL       |

Standard action markets

| market    |
|-----------|
| WETH-DAI  |
| WETH-SAI  |
| WETH-USDC |
| DAI-USDC  |
| SAI-USDC  |
| SAI-DAI   |
| PBTC-USDC |

Standard action assets

| asset |
|-------|
| WETH  |
| DAI   |
| USDC  |
| SAI   |

#### Example Response Body for solo:

Query: `https://api.dydx.exchange/v1/standard-actions?owner=0x77A035b677D5A0900E4848Ae885103cD49af9633&limit=2&product=solo`
```json
{
  "standardActions": [
    {
      "uuid": "878c0f3e-ced0-478c-a9c5-76237107050b",
      "type": "ISOLATED_FULL_CLOSE",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
      "transferAmount": "139940891786496509",
      "tradeAmount": "160307343231895490",
      "price": "197.76",
      "market": "WETH-DAI",
      "asset": "WETH",
      "side": "LONG",
      "operationUuid": null,
      "transactionHash": "0xa5c242650815711b45784b57b8132e2523cd5044f0c6c53482c706713de29795",
      "positionUuid": "5f3f0dc0-d84f-4bf8-a0ce-61d4c98ae88c",
      "borrowAmount": null,
      "orderNumber": "1011061200670000",
      "confirmedAt": "2020-05-21T17:34:22.000Z",
      "feeAmount": "158511900987698260.512",
      "feeAsset": "DAI",
      "pnl": "-0.11680504725069452446144687474175947711343548096340565373461771439994077049174357",
      "payoutAmount": "139940891786496509",
      "isPendingBlock": false,
      "refundAmount": "0",
      "product": "SOLO",
      "createdAt": "2020-05-21T17:35:57.265Z",
      "updatedAt": "2020-05-21T17:35:57.280Z"
    },
    {
      "uuid": "d9ee4386-8810-4cf0-ab73-e5eaa7b6d7c8",
      "type": "ISOLATED_OPEN",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
      "transferAmount": "150200220768708569",
      "tradeAmount": "150000000000000000",
      "price": "208.62",
      "market": "WETH-DAI",
      "asset": "WETH",
      "side": "LONG",
      "operationUuid": null,
      "transactionHash": "0x2d39ca14ba40c5049d6983091fe430da8469619aae7657e872f531466fdf7d7a",
      "positionUuid": "5f3f0dc0-d84f-4bf8-a0ce-61d4c98ae88c",
      "borrowAmount": null,
      "orderNumber": "998298000710000",
      "confirmedAt": "2020-05-01T22:13:39.000Z",
      "feeAmount": "156465000000000000",
      "feeAsset": "DAI",
      "pnl": null,
      "payoutAmount": null,
      "isPendingBlock": false,
      "refundAmount": "0",
      "product": "SOLO",
      "createdAt": "2020-05-03T04:06:48.813Z",
      "updatedAt": "2020-05-03T04:06:48.834Z"
    }
  ]
}
```

#### Example Response Body for perpetual:

Query: `https://api.dydx.exchange/v1/standard-actions?owner=0x77A035b677D5A0900E4848Ae885103cD49af9633&limit=1&product=perpetual`
```json
{
  "standardActions": [
    {
      "uuid": "f2f0ac19-373f-4a80-bd34-a8d973ee0235",
      "type": "OPEN",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": null,
      "transferAmount": null,
      "tradeAmount": "990000",
      "price": "90.85",
      "market": "PBTC-USDC",
      "asset": null,
      "side": "SHORT",
      "operationUuid": null,
      "transactionHash": "0x7c6367c2058e8c121437181a3e535a1ea06271ecf47be449c0217bdd0c785ad9",
      "positionUuid": null,
      "borrowAmount": null,
      "orderNumber": "1011122300520002",
      "confirmedAt": "2020-05-21T19:49:10.000Z",
      "feeAmount": "454250",
      "feeAsset": "USDC",
      "pnl": null,
      "payoutAmount": null,
      "isPendingBlock": false,
      "refundAmount": "0",
      "product": "PERPETUAL",
      "createdAt": "2020-05-21T19:49:48.039Z",
      "updatedAt": "2020-05-21T19:49:48.039Z"
    }
  ]
}
```

#### Standard Action Response Object

| Field Name      | Description                                                                                                      |
|-----------------|------------------------------------------------------------------------------------------------------------------|
| uuid            | The unique id for the action.                                                                                    |
| owner           | The wallet address of the user.                                                                                  |
| type            | The type of standard action e.g. `DEPOSIT`, `ISOLATED_OPEN` (for solo), `OPEN`, `ACCOUNT_SETTLE` (for perpetual) |
| market          | The market, e.g. `WETH-USDC` or `PBTC-USDC`.                                                                     |
| side            | The side for the standard action e.g. `LONG`, `SHORT`.                                                           |
| transferAmount  | The amount in settlement token that is transferred.                                                              |
| tradeAmount     | The amount traded. i.e. the base token amount in a trade                                                         |
| price           | The price in settlement token.                                                                                   |
| orderNumber     | Number used for ordering the standard actions.                                                                   |
| updatedAt       | The ISO 8601 date and time the standard action was updated.                                                      |
| createdAt       | The ISO 8601 date and time the standard action was created.                                                      |
| confirmedAt     | The ISO 8601 date and time the standard action was confirmed.                                                    |
| product         | The product type, e.g. `perpetual` or `solo`.                                                                    |
| transactionHash | The transaction corresponding to this standard action                                                            |
| pnl             | The PnL for the corresponding position. Currently not set in the standard action for perpetual.                  |
| feeAmount       | The fee amount charged                                                                                           |
| feeAsset        | The asset of the `feeAmount` eg `DAI`, `USDC`                                                                    |
| asset           | The asset eg `WETH`, `DAI`, `USDC` for deposit or withdraw                                                       |
| payoutAmount    | The amount refunded to the user when maker fee is negative                                                       |

## Solo Endpoints

### GET `/v2/markets/:market`

Description:
Get high-level information on a specific Solo market.

Query Params:

| Field Name | Description                    |
|------------|--------------------------------|
| market     | The market pair being queried. |

Example Response Body:
```json
{
  "market": {
    "WETH-DAI": {
      "name": "WETH-DAI",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0
      },
      "quoteCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3
      },
      "minimumTickSize": "0.01",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015"
    }
  }
}
```

### GET `/v2/markets`
Description:
Get high-level information on all Solo markets.

Query Params:
None

Example Response Body:
```json
{
  "markets": {
    "WETH-DAI": {
      "name": "WETH-DAI",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0
      },
      "quoteCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3
      },
      "minimumTickSize": "0.01",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015"
    },
    "WETH-USDC": {
      "name": "WETH-USDC",
      "baseCurrency": {
        "currency": "WETH",
        "decimals": 18,
        "soloMarketId": 0
      },
      "quoteCurrency": {
        "currency": "USDC",
        "decimals": 6,
        "soloMarketId": 2
      },
      "minimumTickSize": "0.00000000000001",
      "minimumOrderSize": "100000000000000000",
      "smallOrderThreshold": "500000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0015"
    },
    "DAI-USDC": {
      "name": "DAI-USDC",
      "baseCurrency": {
        "currency": "DAI",
        "decimals": 18,
        "soloMarketId": 3
      },
      "quoteCurrency": {
        "currency": "USDC",
        "decimals": 6,
        "soloMarketId": 1
      },
      "minimumTickSize": "0.0000000000000001",
      "minimumOrderSize": "20000000000000000000",
      "smallOrderThreshold": "100000000000000000000",
      "makerFee": "0",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.0005"
    }
  }
}
```

### GET `/v1/accounts/:address`

Description:

Get Solo account balances for a particular account owner. This endpoint can also be used to get pending balances for an account corresponding to pending fills.

Note: To get any account's collateralization, simply take `sumSupplyUsdValue / sumBorrowUsdValue`.
The minimum collateralization where liquidation occurs on the protocol using this formula is `1.15`.

Query Params:

| Field Name | Description                                                               |
|------------|---------------------------------------------------------------------------|
| number     | (Optional) The Solo Acount number of the account to request balances for. |

#### Example Response Body:

Query: `https://api.dydx.exchange/v1/accounts/0x0913017c740260fea4b2c62828a4008ca8b0d6e4`

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
      "par": "9994719126810778"
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

#### Account Response Object

| Field Name | Description                                                           |
|------------|-----------------------------------------------------------------------|
| owner      | The user's wallet address.                                            |
| number     | The account number                                                    |
| balances   | A map from marketIds to the balances for each market.                 |
| par        | The par for the account                                               |
| wei        | The wei for the account                                               |
| pendingWei | The (pending) wei due to a fill that is still waiting to be confirmed |

### GET `/v1/accounts`

Description:

This endpoint returns balances for all the solo accounts.

Query Params:

| parameter name | description                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|
| isLiquidatable | (optional) returns all accounts that are at risk of under-collateralization                     |
| isExpired      | (optional) returns all accounts that have at least one balance that has expired and is negative |
| isMigratable   | (optional) returns all accounts that have SAI balance (positive or negative)                    |

#### Example Response Body:

Query: `https://api.dydx.exchange/v1/accounts`
```json
{
  "accounts": [
    {
      "owner": "0xc8e764dd559e3a6e0a433450a33dbbce83bc52d4",
      "number": "0",
      "uuid": "00006789-5921-4150-a392-4e6c5abc0043",
      "balances": {
        "0": {
          "marketId": 0,
          "par": "0",
          "wei": "0",
          "pendingWei": "0",
          "expiresAt": null,
          "orderNumber": null,
          "expiryAddress": null,
          "expiryOrderNumber": null
        },
        "1": {
          "marketId": 1,
          "par": "0",
          "wei": "0",
          "pendingWei": "0",
          "expiresAt": null,
          "orderNumber": null,
          "expiryAddress": null,
          "expiryOrderNumber": null
        },
        "2": {
          "marketId": 2,
          "par": "0",
          "wei": "0",
          "pendingWei": "0",
          "expiresAt": null,
          "orderNumber": null,
          "expiryAddress": null,
          "expiryOrderNumber": null
        },
        "3": {
          "marketId": 3,
          "par": "49696227095077403931903",
          "wei": "50862611748306230192199",
          "expiresAt": null,
          "expiryAddress": null
        }
      }
    }
  ]
}
```

#### Accounts Response Object

| Field Name | Description                                                           |
|------------|-----------------------------------------------------------------------|
| accounts   | An array of balances for each owner and account number                |
| owner      | The user's wallet address.                                            |
| number     | The account number                                                    |
| balances   | A map from marketIds to the balances for each market.                 |
| par        | The par for the account                                               |
| wei        | The wei for the account                                               |
| pendingWei | The (pending) wei due to a fill that is still waiting to be confirmed |

### GET `/v1/markets`

Description:

Gets high level information for all solo assets.

Note: This is different from the v2/markets endpoint mentioned above.

Query Params:

None

#### Example response body:

Query: `https://api.dydx.exchange/v1/markets`
```json
{
  "markets": [
    {
      "id": 0,
      "name": "Ethereum",
      "symbol": "ETH",
      "supplyIndex": "1.001398660619165827",
      "borrowIndex": "1.010368590898359639",
      "supplyInterestRateSeconds": "0.00000000008945112223964823567690892185119535814786489929645384878315331493235128",
      "borrowInterestRateSeconds": "0.000000000546421514",
      "totalSupplyPar": "98916437591968893681399",
      "totalBorrowPar": "16893907569901507548059",
      "lastIndexUpdateSeconds": "1590172676",
      "oraclePrice": "207420000000000000000",
      "collateralRatio": "1.15",
      "marginPremium": "0",
      "spreadPremium": "0",
      "currencyUuid": "9debe831-5ccd-448b-91f7-cd247ecddc22",
      "createdAt": "2019-04-03T01:11:55.990Z",
      "updatedAt": "2020-05-22T18:38:45.600Z",
      "deletedAt": null,
      "currency": {
        "uuid": "9debe831-5ccd-448b-91f7-cd247ecddc22",
        "symbol": "WETH",
        "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "decimals": 18,
        "createdAt": "2018-07-10T04:08:53.352Z",
        "updatedAt": "2018-07-10T04:08:53.352Z"
      },
      "totalSupplyAPR": "0.00282093059094954676030699975949929681455106746421296857522552293970662996608",
      "totalBorrowAPR": "0.017231948865504",
      "totalSupplyAPY": "0.002824913159618525",
      "totalBorrowAPY": "0.017381275392271966",
      "totalSupplyWei": "99054788117816954779760.734139858486351973",
      "totalBorrowWei": "17069073586168517326002.814653240058390701"
    },
    {
      "id": 1,
      "name": "SAI",
      "symbol": "SAI",
      "supplyIndex": "1.060104599441753982",
      "borrowIndex": "1.094636157956433672",
      "supplyInterestRateSeconds": "0",
      "borrowInterestRateSeconds": "0",
      "totalSupplyPar": "8489728282227392446",
      "totalBorrowPar": "0",
      "lastIndexUpdateSeconds": "1590172676",
      "oraclePrice": "1",
      "collateralRatio": "1.15",
      "marginPremium": "0",
      "spreadPremium": "0",
      "currencyUuid": "3022f2e4-5ce8-4576-882b-cdae6e198e3b",
      "createdAt": "2019-04-03T01:11:55.990Z",
      "updatedAt": "2020-05-22T18:38:45.601Z",
      "deletedAt": null,
      "currency": {
        "uuid": "3022f2e4-5ce8-4576-882b-cdae6e198e3b",
        "symbol": "SAI",
        "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
        "decimals": 18,
        "createdAt": "2018-07-10T04:08:53.352Z",
        "updatedAt": "2018-07-10T04:08:53.352Z"
      },
      "totalSupplyAPR": "0",
      "totalBorrowAPR": "0",
      "totalSupplyAPY": "0",
      "totalBorrowAPY": "0",
      "totalSupplyWei": "8999999999999999970.554429596497219972",
      "totalBorrowWei": "0"
    },
    {
      "id": 2,
      "name": "USDC",
      "symbol": "USDC",
      "supplyIndex": "1.04187613625421444",
      "borrowIndex": "1.072147697097366983",
      "supplyInterestRateSeconds": "0.00000000043237131807605842113005907414001250332155197748006575168539387950003242",
      "borrowInterestRateSeconds": "0.000000001201332793",
      "totalSupplyPar": "9508292364989",
      "totalBorrowPar": "3500532173579",
      "lastIndexUpdateSeconds": "1590172676",
      "oraclePrice": "1000000000000000000000000000000",
      "collateralRatio": "1.15",
      "marginPremium": "0",
      "spreadPremium": "0",
      "currencyUuid": "e714906e-d2ca-43d6-9d5e-d31b2d216157",
      "createdAt": "2019-05-07T23:33:55.642Z",
      "updatedAt": "2020-05-22T18:38:45.601Z",
      "deletedAt": null,
      "currency": {
        "uuid": "e714906e-d2ca-43d6-9d5e-d31b2d216157",
        "symbol": "USDC",
        "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "decimals": 6,
        "createdAt": "2019-05-07T23:33:55.642Z",
        "updatedAt": "2019-05-07T23:33:55.642Z"
      },
      "totalSupplyAPR": "0.01363526188684657836875754296207943430474846316181135354515058138391302239712",
      "totalBorrowAPR": "0.037885230960048",
      "totalSupplyAPY": "0.0137286460265591",
      "totalBorrowAPY": "0.0386120255329192",
      "totalSupplyWei": "9906462911610.18622142595424116",
      "totalBorrowWei": "3753087508517.965354198819542157"
    },
    {
      "id": 3,
      "name": "DAI",
      "symbol": "DAI",
      "supplyIndex": "1.02352463593826795",
      "borrowIndex": "1.03145143300767834",
      "supplyInterestRateSeconds": "0.00000000071328015292052294081913899831940846447245786755728669312100503006956483",
      "borrowInterestRateSeconds": "0.000000001542996581",
      "totalSupplyPar": "9045574058734731599497129",
      "totalBorrowPar": "4367745908691120032726721",
      "lastIndexUpdateSeconds": "1590172676",
      "oraclePrice": "1000436176029173829",
      "collateralRatio": "1.15",
      "marginPremium": "0",
      "spreadPremium": "0",
      "currencyUuid": "3eb5c94b-1727-42bd-b5c8-2dd701e342b7",
      "createdAt": "2019-11-25T01:47:53.051Z",
      "updatedAt": "2020-05-22T18:38:45.601Z",
      "deletedAt": null,
      "currency": {
        "uuid": "3eb5c94b-1727-42bd-b5c8-2dd701e342b7",
        "symbol": "DAI",
        "contractAddress": "0x6b175474e89094c44da98b954eedeac495271d0f",
        "decimals": 18,
        "createdAt": "2019-11-25T00:47:45.213Z",
        "updatedAt": "2019-11-25T00:47:45.213Z"
      },
      "totalSupplyAPR": "0.02249400290250161146167236745100086533560343131128659315426401462827379647888",
      "totalBorrowAPR": "0.048659940178416",
      "totalSupplyAPY": "0.022748900621180734",
      "totalBorrowAPY": "0.049863273712147826",
      "totalSupplyWei": "9258367895319106950860481.35493330725771555",
      "totalBorrowWei": "4505117776532879950251522.64743327989092314"
    }
  ]
}
```

#### Markets Response body:

| Field name                | Description                                                                                  |
|---------------------------|----------------------------------------------------------------------------------------------|
| markets                   | An array of different asset objects                                                          |
| id                        | Id of asset determined by protocol                                                           |
| name                      | Name of asset                                                                                |
| supplyIndex               | Current index of the supply                                                                  |
| borrowIndex               | Current index of the borrow                                                                  |
| totalSupplyPar            | Summation of total available asset par in asset                                              |
| totalBorrowPar            | Summation of total asset borrowed par from asset                                             |
| totalSupplyWei            | `totalSupplyPar` multiplied by `supplyIndex`                                                 |
| totalBorrowWei            | `totalBorrowPar` multiplied by `borrowIndex`                                                 |
| supplyInterestRateSeconds | Current interest rate per second earned from lending assets                                  |
| borrowInterestRateSeconds | Current interest rate per second paid to borrowed assets                                     |
| supplyInterestAPY         | Current interest rate per second earned from lending assets including compound interest      |
| borrowInterestAPY         | Current interest rate per second paid to borrowed assets including compound interest         |
| supplyInterestAPR         | Current interest rate per second earned from lending assets, multiplied by 1 year in seconds |
| borrowInterestAPR         | Current interest rate per second paid to borrowed assets, multiplied by 1 year in seconds    |
| oraclePrice               | Price determined by oracle                                                                   |
| lastIndexUpdateSeconds    | Timestamp of last `indexUpdate` associated with the current asset values                     |
| marginPremium             | Current `marginPremium` of the particular asset                                              |
| spreadPremium             | Current `spreadPremium` of the particular asset                                              |

### GET `/v1/markets/:id`

Description:

This endpoint returns information for a particular Solo asset.

Note: This is different from the v2/markets endpoint mentioned above.

Query Params:

| Field Name | Description  |
|------------|--------------|
| id         | The asset id |


#### Example Response Body:

Query: `https://api.dydx.exchange/v1/markets/0`
```json
{
  "market": {
    "id": 0,
    "name": "Ethereum",
    "symbol": "ETH",
    "supplyIndex": "1.001306342154952813",
    "borrowIndex": "1.009828284827031753",
    "supplyInterestRateSeconds": "0.00000000004969840736422012284564765239517392930721200621215594692201109713616485",
    "borrowInterestRateSeconds": "0.000000000407292234",
    "totalSupplyPar": "98971283228248394332654",
    "totalBorrowPar": "12604957188509875228312",
    "lastIndexUpdateSeconds": "1589227490",
    "oraclePrice": "186720000000000000000",
    "collateralRatio": "1.15",
    "marginPremium": "0",
    "spreadPremium": "0",
    "currencyUuid": "9debe831-5ccd-448b-91f7-cd247ecddc22",
    "createdAt": "2019-04-03T01:11:55.990Z",
    "updatedAt": "2020-05-11T20:05:03.473Z",
    "deletedAt": null,
    "currency": {
      "uuid": "9debe831-5ccd-448b-91f7-cd247ecddc22",
      "symbol": "WETH",
      "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "decimals": 18,
      "createdAt": "2018-07-10T04:08:53.352Z",
      "updatedAt": "2018-07-10T04:08:53.352Z"
    },
    "totalSupplyAPR": "0.0015672889746380457940603443659342050346322378279065499421325419592860947096",
    "totalBorrowAPR": "0.012844367891424",
    "totalSupplyAPY": "0.0015685178139013267",
    "totalBorrowAPY": "0.01292721109424222",
    "totalSupplyWei": "99100573587659229539040.117656245995055702",
    "totalBorrowWei": "12728842297991091658963.688744490148590936"
  }
}
```

#### Market Response body:

| Field name                | Description                                                                                  |
|---------------------------|----------------------------------------------------------------------------------------------|
| id                        | Id of asset determined by protocol                                                           |
| name                      | Name of asset                                                                                |
| supplyIndex               | Current index of the supply                                                                  |
| borrowIndex               | Current index of the borrow                                                                  |
| totalSupplyPar            | Summation of total available asset par in asset                                              |
| totalBorrowPar            | Summation of total asset borrowed par from asset                                             |
| totalSupplyWei            | `totalSupplyPar` multiplied by `supplyIndex`                                                 |
| totalBorrowWei            | `totalBorrowPar` multiplied by `borrowIndex`                                                 |
| supplyInterestRateSeconds | Current interest rate per second earned from lending assets                                  |
| borrowInterestRateSeconds | Current interest rate per second paid to borrowed assets                                     |
| supplyInterestAPY         | Current interest rate per second earned from lending assets including compound interest      |
| borrowInterestAPY         | Current interest rate per second paid to borrowed assets including compound interest         |
| supplyInterestAPR         | Current interest rate per second earned from lending assets, multiplied by 1 year in seconds |
| borrowInterestAPR         | Current interest rate per second paid to borrowed assets, multiplied by 1 year in seconds    |
| oraclePrice               | Price determined by oracle                                                                   |
| lastIndexUpdateSeconds    | Timestamp of last `indexUpdate` associated with the current asset values                     |
| marginPremium             | Current `marginPremium` of the particular asset                                              |
| spreadPremium             | Current `spreadPremium` of the particular asset                                              |


### GET `v1/balance-updates`

Description:

This endpoint returns the last 100 balance updates for an address.

Query Parameters

| Field             | Description                                                                                                      |
|-------------------|------------------------------------------------------------------------------------------------------------------|
| owner             | the account address                                                                                              |
| number            | (optional) the account number                                                                                    |
| orderNumberBefore | (optional) used for querying balance updates before a certain time. (`orderNumber` is used for ordering updates) |
| limit             | (optional) the number of balance updates to return (max 100)                                                     |

#### Example response:

Query: `https://api.dydx.exchange/v1/balance-updates?owner=0x77A035b677D5A0900E4848Ae885103cD49af9633&limit=2`
```json
{
  "balanceUpdates": [
    {
      "uuid": "3920e9df-6260-4196-8d5d-ea3a65e05e16",
      "deltaWei": "139940891786496509",
      "newPar": "320499592695509982",
      "isLiquidate": false,
      "accountUuid": "fb8cb2a7-0910-406f-9ebd-41cb9b267a63",
      "actionUuid": null,
      "marketId": 0,
      "expiresAt": null,
      "orderNumber": "1011061200670003",
      "newWei": "320945032193181973.270328870120749488",
      "confirmedAt": "2020-05-21T17:34:22.000Z",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": "0",
      "isPendingBlock": false,
      "createdAt": "2020-05-21T17:35:57.244Z",
      "updatedAt": "2020-05-21T17:35:57.244Z"
    },
    {
      "uuid": "9312921e-a53e-417f-b672-75a0d1943de8",
      "deltaWei": "-139940891786496509",
      "newPar": "0",
      "isLiquidate": false,
      "accountUuid": "836a4fdc-c994-450e-a07b-830ed37716ce",
      "actionUuid": null,
      "marketId": 0,
      "expiresAt": null,
      "orderNumber": "1011061200670003",
      "newWei": "0",
      "confirmedAt": "2020-05-21T17:34:22.000Z",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
      "isPendingBlock": false,
      "createdAt": "2020-05-21T17:35:57.243Z",
      "updatedAt": "2020-05-21T17:35:57.243Z"
    }
  ]
}
```

#### Balance Updates Response object

| Field          | Description                                                  |
|----------------|--------------------------------------------------------------|
| balanceUpdates | An array of the balance update objects                       |
| uuid           | Unique identifier for a balance update                       |
| deltaWei       | The change in wei in a balance update                        |
| newPar         | The new par value due to the balance update                  |
| newWei         | The new wei value due to the balance update                  |
| orderNumber    | Used for ordering a balance update                           |
| isPendingBlock | Whether the balance update is still pending                  |
| owner          | The account address                                          |
| number         | The account number                                           |
| marketId       | The id of the market for this balance update                 |
| confirmedAt    | The ISO 8601 date and time this balance update was confirmed |
| createdAt      | The ISO 8601 date and time this balance update was created   |
| updatedAt      | The ISO 8601 date and time this balance update was updated   |


### GET `v1/positions`

Description:

This endpoint retrieves the positions for an address.

Query Params

| Field  | Description                                                          |
|--------|----------------------------------------------------------------------|
| owner  | (optional) The account address                                       |
| number | (optional) The account number                                        |
| status | (optional)The position status eg: `OPEN`, `CLOSED` etc               |
| type   | (optional) The position type eg: `ISOLATED_SHORT` or `ISOLATED_LONG` |
| market | (optional) The position market eg: `WETH-DAI`                        |
| limit  | (optional) The number of positions to return ( max 100)              |

Position statuses:

| status        |
|---------------|
| STOP_EXECUTED |
| OPEN          |
| LIQUIDATED    |
| INVALID       |
| EXPIRED       |
| CLOSED        |

Position types:

| type           |
|----------------|
| ISOLATED_SHORT |
| ISOLATED_LONG  |

Position markets:

| market    |
|-----------|
| WETH-DAI  |
| WETH-SAI  |
| WETH-USDC |
| DAI-USDC  |
| SAI-USDC  |
| SAI-DAI   |

#### Example response object:

Query: `https://api.dydx.exchange/v1/positions?owner=0x77A035b677D5A0900E4848Ae885103cD49af9633&limit=1`
```json
{
  "positions": [
    {
      "uuid": "5f3f0dc0-d84f-4bf8-a0ce-61d4c98ae88c",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
      "market": "WETH-DAI",
      "type": "ISOLATED_LONG",
      "status": "CLOSED",
      "accountUuid": "836a4fdc-c994-450e-a07b-830ed37716ce",
      "expiresAt": "2020-05-29T22:13:39.000Z",
      "createdAt": "2020-05-01T22:13:52.847Z",
      "updatedAt": "2020-05-21T17:35:57.278Z",
      "account": {
        "uuid": "836a4fdc-c994-450e-a07b-830ed37716ce",
        "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
        "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
        "createdAt": "2020-05-01T22:13:44.755Z",
        "updatedAt": "2020-05-01T22:13:44.755Z"
      },
      "standardActions": [
        {
          "uuid": "878c0f3e-ced0-478c-a9c5-76237107050b",
          "type": "ISOLATED_FULL_CLOSE",
          "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
          "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
          "transferAmount": "139940891786496509",
          "tradeAmount": "160307343231895490",
          "price": "197.76",
          "market": "WETH-DAI",
          "asset": "WETH",
          "side": "LONG",
          "operationUuid": null,
          "transactionHash": "0xa5c242650815711b45784b57b8132e2523cd5044f0c6c53482c706713de29795",
          "positionUuid": "5f3f0dc0-d84f-4bf8-a0ce-61d4c98ae88c",
          "borrowAmount": null,
          "orderNumber": "1011061200670000",
          "confirmedAt": "2020-05-21T17:34:22.000Z",
          "feeAmount": "158511900987698260.512",
          "feeAsset": "DAI",
          "pnl": "-0.11680504725069452446144687474175947711343548096340565373461771439994077049174357",
          "payoutAmount": "139940891786496509",
          "isPendingBlock": false,
          "refundAmount": "0",
          "product": "SOLO",
          "createdAt": "2020-05-21T17:35:57.265Z",
          "updatedAt": "2020-05-21T17:35:57.280Z"
        },
        {
          "uuid": "d9ee4386-8810-4cf0-ab73-e5eaa7b6d7c8",
          "type": "ISOLATED_OPEN",
          "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
          "number": "72726098636314491067235956043692261150608981229613064856905296785781912974936",
          "transferAmount": "150200220768708569",
          "tradeAmount": "150000000000000000",
          "price": "208.62",
          "market": "WETH-DAI",
          "asset": "WETH",
          "side": "LONG",
          "operationUuid": null,
          "transactionHash": "0x2d39ca14ba40c5049d6983091fe430da8469619aae7657e872f531466fdf7d7a",
          "positionUuid": "5f3f0dc0-d84f-4bf8-a0ce-61d4c98ae88c",
          "borrowAmount": null,
          "orderNumber": "998298000710000",
          "confirmedAt": "2020-05-01T22:13:39.000Z",
          "feeAmount": "156465000000000000",
          "feeAsset": "DAI",
          "pnl": null,
          "payoutAmount": null,
          "isPendingBlock": false,
          "refundAmount": "0",
          "product": "SOLO",
          "createdAt": "2020-05-03T04:06:48.813Z",
          "updatedAt": "2020-05-03T04:06:48.834Z"
        }
      ]
    }
  ]
}
```

#### Position response object

| Field           | Description                                                                                                   |
|-----------------|---------------------------------------------------------------------------------------------------------------|
| uuid            | The unique identifier for the position                                                                        |
| owner           | The account address                                                                                           |
| number          | The account number                                                                                            |
| market          | The market for this position eg `WETH-DAI`                                                                    |
| type            | The position type er: `ISOLATED_LONG` or `ISOLATED_SHORT`                                                     |
| status          | The position status eg: `OPEN`,  `CLOSED`                                                                     |
| account         | An object containing the account information                                                                  |
| standardActions | An array of the associated standard actions for this position eg: the associated `ISOLATED_FULL_CLOSE` action |

## Perpetual Endpoints

### GET `/v1/perpetual-markets`

Description:

Get high-level information on all Perpetual markets.

Query Params

None

#### Example Response Body:

Query `https://api.dydx.exchange/v1/perpetual-markets`
```json
{
  "markets": [
    {
      "uuid": "f6d20698-32ac-4f3a-a9c4-b6b7528b7b94",
      "market": "PBTC-USDC",
      "oraclePrice": "90.3551",
      "fundingRate": "0.000000017511403011",
      "minCollateral": "1.075",
      "globalIndexValue": "1.207692942350066675",
      "globalIndexTimestamp": "1590093314",
      "decimals": "8",
      "minimumTickSize": "0.01",
      "minimumOrderSize": "10000",
      "smallOrderThreshold": "1000000",
      "makerFee": "-0.00025",
      "largeTakerFee": "0.005",
      "smallTakerFee": "0.00075",
      "openInterest": "2835957144",
      "createdAt": "2020-04-09T22:42:35.696Z",
      "updatedAt": "2020-05-21T20:50:55.334Z"
    }
  ]
}
```

#### Markets Response Object:

| Field Name           | Description                                                                                        |
|----------------------|----------------------------------------------------------------------------------------------------|
| markets              | An array of the perpetual market objects                                                           |
| market               | The market string, e.g.: `PBTC-USDC`.                                                              |
| oraclePrice          | The index price from the oracle.                                                                   |
| fundingRate          | The funding rate for the market.                                                                   |
| globalIndexValue     | The global index value for the market.                                                             |
| globalIndexTimestamp | The Unix timestamp (seconds) for the last update to the global index.                              |
| minCollateral        | The minimum collaterization before getting liquidated eg: 1.07                                     |
| decimals             | Corresponds to the precision for the position units eg: if decimals = 8, then 100000000 = 1 BTC    |
| minimumTickSize      | The minimum price amount eg: 0.01 (equal to $1)                                                    |
| minimumOrderSize     | The minimum size, in position units, required for an order                                         |
| smallOrderThreshold  | The threshold, in position units, at which we charge different fees for takers                     |
| makerFee             | The percentage fee charged for the maker of an order eg -0.00025 (equal to -0.025%)                |
| largeTakerFee        | Applies to orders >= smallOrderThreshold. eg 0.005 (equal to 0.5%)                                 |
| smallTakerFee        | Applies to orders < smallOrderThreshold. eg 0.00075 (equal to 0.075%)                              |
| openInterest         | openInterest is the sum of the position amount of all longs (equal to sum of amount of all shorts) |

### GET `v1/perpetual-markets/:market`

Description:

This returns the market information for a specific perpetual market.

Query Params:

| Field Name | Description               |
|------------|---------------------------|
| market     | The perpetual market name |

#### Example response body:
Query `https://api.dydx.exchange/v1/perpetual-markets/PBTC-USDC`

```json
{
  "market": {
    "uuid": "f6d20698-32ac-4f3a-a9c4-b6b7528b7b94",
    "market": "PBTC-USDC",
    "oraclePrice": "92.052",
    "fundingRate": "0.000000017178342607",
    "minCollateral": "1.075",
    "globalIndexValue": "1.258933718003697999",
    "globalIndexTimestamp": "1590170610",
    "decimals": "8",
    "minimumTickSize": "0.01",
    "minimumOrderSize": "10000",
    "smallOrderThreshold": "1000000",
    "makerFee": "-0.00025",
    "largeTakerFee": "0.005",
    "smallTakerFee": "0.00075",
    "openInterest": "3917905240",
    "createdAt": "2020-04-09T22:42:35.696Z",
    "updatedAt": "2020-05-22T18:30:55.429Z"
  }
}
```

#### Market Response Object:

| Field Name           | Description                                                                                        |
|----------------------|----------------------------------------------------------------------------------------------------|
| market               | The market string, e.g.: `PBTC-USDC`.                                                              |
| oraclePrice          | The index price from the oracle.                                                                   |
| fundingRate          | The funding rate for the market.                                                                   |
| globalIndexValue     | The global index value for the market.                                                             |
| globalIndexTimestamp | The Unix timestamp (seconds) for the last update to the global index.                              |
| minCollateral        | The minimum collaterization before getting liquidated eg: 1.07                                     |
| decimals             | Corresponds to the precision for the position units eg: if decimals = 8, then 100000000 = 1 BTC    |
| minimumTickSize      | The minimum price amount eg: 0.01 (equal to $1)                                                    |
| minimumOrderSize     | The minimum size, in position units, required for an order                                         |
| smallOrderThreshold  | The threshold, in position units, at which we charge different fees for takers                     |
| makerFee             | The percentage fee charged for the maker of an order eg -0.00025 (equal to -0.025%)                |
| largeTakerFee        | Applies to orders >= smallOrderThreshold. eg 0.005 (equal to 0.5%)                                 |
| smallTakerFee        | Applies to orders < smallOrderThreshold. eg 0.00075 (equal to 0.075%)                              |
| openInterest         | openInterest is the sum of the position amount of all longs (equal to sum of amount of all shorts) |

### GET `/v1/perpetual-balance-updates`

Description:

Obtains the latest 100 perpetual balance updates.

Query Params:

| Field Name        | Description                                                                |
|-------------------|----------------------------------------------------------------------------|
| owner             | The wallet address of the user.                                            |
| orderNumberBefore | (optional) Used to return balance updates before an `orderNumber`          |
| limit             | (optional) The maximum number of balance updates to retrieve. (max is 100) |

#### Example Response Body:
Query: `https://api.dydx.exchange/v1/perpetual-balance-updates?owner=0x77A035b677D5A0900E4848Ae885103cD49af9633&limit=1`
```json
{
  "balanceUpdates": [
    {
      "uuid": "35f3d8cc-22a9-447e-b0b6-051f3e7272b7",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "market": "PBTC-USDC",
      "deltaMargin": "89957950",
      "newMargin": "130127513",
      "deltaPosition": "-1000000",
      "newPosition": "-990000",
      "indexValue": "1.204924898727124293",
      "indexTimestamp": "1590089676",
      "isPendingBlock": false,
      "orderNumber": "1011116901510002",
      "createdAt": "2020-05-21T19:36:03.270Z",
      "updatedAt": "2020-05-21T19:36:03.270Z"
    }
  ]
}
```

#### Perpetual Balance Update Response Object:

| Field Name     | Description                                           |
|----------------|-------------------------------------------------------|
| balanceUpdates | An array of the balance update objects                |
| uuid           | The unique ID for the balance update.                 |
| owner          | The wallet address of the user.                       |
| market         | The perpetual market, e.g. `PBTC-USDC`.               |
| deltaMargin    | The change in settlement token (e.g. USDC).           |
| newMargin      | The new balance of settlement token (e.g. USDC).      |
| deltaPosition  | The change in position token (e.g. PBTC).             |
| newPosition    | The amount in position token (e.g. PBTC).             |
| indexValue     | The new index value of the account.                   |
| indexTimestamp | The timestamp for when the index value was set.       |
| orderNumber    | Number used for ordering the balance updates.         |
| isPendingBlock | Whether the specific balance update is pending or not |

### GET `/v1/perpetual-accounts/:walletAddress`

Description:

This endpoint takes in the user's walletAddress, and returns balances
for the account.

Query Params:

| Field Name    | Description                                   |
|---------------|-----------------------------------------------|
| walletAddress | The perpetual account to look up balances for |

#### Example Response Body:

Query: `https://api.dydx.exchange/v1/perpetual-accounts/0x77A035b677D5A0900E4848Ae885103cD49af9633`
```json
{
  "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
  "balances": {
    "PBTC-USDC": {
      "cachedMargin": "40181034",
      "margin": "40169512",
      "position": "10000",
      "pendingMargin": "0",
      "pendingPosition": "0",
      "indexValue": "0.057858741951992068",
      "indexTimestamp": "1588271672"
    }
  }
}
```

#### Account Response Object

| Field Name      | Description                                                                       |
|-----------------|-----------------------------------------------------------------------------------|
| owner           | The user's wallet address.                                                        |
| balances        | A mapping of the market to the balances for that market                           |
| margin          | This is calculated as `cachedMargin - (indexValue - globalIndexValue) * position` |
| position        | The balance in position token (e.g. PBTC).                                        |
| cachedMargin    | This is the last stored margin value                                              |
| pendingMargin   | This is the (pending) component of the margin when a fill is still pending        |
| pendingPosition | This is the (pending) component of the position when a fill is still pending      |
| indexValue      | The value of the global index from the last interaction with the account          |
| indexTimestamp  | The timestamp when the index value was set                                        |

### GET `/v1/perpetual-accounts`

Description:

This endpoint returns balances for all perpetual accounts.

Query Params:

| Field Name     | Description                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| isLiquidatable | (optional) If set to true, returns accounts that are below the margin requirement |

#### Example Response Body:

Query: `https://api.dydx.exchange/v1/perpetual-accounts`
```json
{
  "accounts": [
    {
      "owner": "0x000f7f22bfc28d940d4b68e13213ab17cf107790",
      "market": "PBTC-USDC",
      "orderNumber": "1011196300330012",
      "cachedMargin": "36759577102",
      "margin": "36759577102",
      "position": "1201838526",
      "cachedIndexValue": "1.211642619304704688",
      "indexTimestamp": "1590100515"
    },
    {
      "owner": "0x003f480be5b68c5e863d2990d043f3b58f64473f",
      "market": "PBTC-USDC",
      "orderNumber": "1010984800560005",
      "cachedMargin": "368456014",
      "margin": "368468282",
      "position": "-3000000",
      "cachedIndexValue": "1.207553221962107213",
      "indexTimestamp": "1590072186"
    }
  ]
}
```

#### Account Response Object

| Field Name      | Description                                                                       |
|-----------------|-----------------------------------------------------------------------------------|
| owner           | The user's wallet address.                                                        |
| balances        | An object with the user's balances for each market.                               |
| margin          | This is calculated as `cachedMargin - (indexValue - globalIndexValue) * position` |
| position        | The balance in position token (e.g. PBTC).                                        |
| cachedMargin    | This is the last stored margin value                                              |
| pendingMargin   | This is the (pending) component of the margin when a fill is still pending        |
| pendingPosition | This is the (pending) component of the position when a fill is still pending      |
| indexValue      | The value of the global index from the last interaction with the account          |
| indexTimestamp  | The timestamp when the index value was set                                        |

## Funding Endpoints

The funding endpoints can be used to get information related to the funding rates
for Perpetual markets.

### Funding Rate Object

| Field Name                 | Description                                                                                              |
|----------------------------|----------------------------------------------------------------------------------------------------------|
| market                     | The market string, e.g. `PBTC-USDC`.                                                                     |
| effectiveAt                | ISO 8601 date and time representing the start of the hour for which the rate is expected to take effect. |
| fundingRate                | The funding rate for the market, as a per-second rate. Equal to the smart contract representation.       |
| fundingRate8Hr             | The funding rate for the market, as an eight-hour rate. Equal to `fundingRate * 28800`.                  |
| averagePremiumComponent    | The average premium component which went into the calculation of the funding rate.                       |
| averagePremiumComponent8Hr | The average premium component, as an eight-hour rate.                                                    |

### GET `/v1/funding-rates`

Description:
Get the current and predicted funding rates.

The current rate is updated each hour, on the hour. The predicted
rate is updated each minute, on the minute, and may be null if no
premiums have been calculated since the last funding rate update.

**IMPORTANT**: The “current” funding rate returned by this function is not active
until it has been mined on-chain, which may not happen for some period
of time after the start of the hour. To get the funding rate that is
currently active on-chain, use the `/v1/perpetual-markets` endpoint.

Query Params:

| Field Name | Description                                                             |
|------------|-------------------------------------------------------------------------|
| markets    | (Optional) Markets to get rates for. Defaults to all Perpetual markets. |

Response (Per Market):

| Field name | Description                                                                                                                                                                            |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| current    | The funding rate expected to take effect in this hour. It will only actually take effect once the relevant transaction is mined.                                                       |
| predicted  | The predicted funding rate for the next hour. Calculated using premiums since the start of the hour. If no premiums are available (e.g. first minute of the hour) this will be `null`. |

Example Response Body:

```json
{
  "PBTC-USDC": {
    "current": {
      "market": "PBTC-USDC",
      "effectiveAt": "2020-05-22T08:00:00.000Z",
      "fundingRate": "0.000000003192901192",
      "fundingRate8Hr": "0.0000919555543296",
      "averagePremiumComponent": "-0.000000000279321029",
      "averagePremiumComponent8Hr": "-0.000008044445661252"
    },
    "predicted": {
      "market": "PBTC-USDC",
      "effectiveAt": "2020-05-22T09:00:00.000Z",
      "fundingRate": "0.000000003726094076",
      "fundingRate8Hr": "0.0001073115093888",
      "averagePremiumComponent": "0.000000000253871854",
      "averagePremiumComponent8Hr": "0.000007311509403474"
    }
  }
}
```

### GET `/v1/historical-funding-rates`

Description:
Get historical funding rates. The most recent funding rates are returned first.

Query Params:

| Field Name     | Description                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| markets        | (Optional) Markets to get rates for. Defaults to all Perpetual markets.           |
| limit          | (Optional) The maximum number of funding rates. The default, and maximum, is 100. |
| startingBefore | (Optional) ISO 8601 string. Return funding rates effective before this date.      |

Response (Per Market):

| Field name | Description                  |
|------------|------------------------------|
| history    | Array of past funding rates. |

Example Response Body:

```json
{
  "PBTC-USDC": {
    "history": [
      {
        "market": "PBTC-USDC",
        "effectiveAt": "2020-05-22T18:00:00.000Z",
        "fundingRate": "0.000000017178342607",
        "fundingRate8Hr": "0.0004947362670816",
        "averagePremiumComponent": "0.00000001370612038495",
        "averagePremiumComponent8Hr": "0.000394736267086484"
      },
      {
        "market": "PBTC-USDC",
        "effectiveAt": "2020-05-22T17:00:00.000Z",
        "fundingRate": "0.00000000115030126",
        "fundingRate8Hr": "0.000033128676288",
        "averagePremiumComponent": "-0.00000000232192096206",
        "averagePremiumComponent8Hr": "-0.0000668713237074407"
      }
    ]
  }
}
```

### GET `/v1/index-price`

Description:
Get the index price used in the funding rate calculation.
The index price is calculated as the median spot market price from major centralized exchanges.
More info on the index price calculation can be found in the [Perpetual Guide](perpetual-guide.md).

Index prices are available for the markets listed below, which include all Perpetual markets and
some non-Perpetual markets. If price information can't be retrieved from all exchanges, then the
median of the available exchanges will be returned. Prices from a minimum number of exchanges
are required, otherwise a cached price will be returned, and the `live` flag will be set to `false`.

| market    | number of exchanges used | minimum exchanges for live price |
|-----------|--------------------------|----------------------------------|
| PBTC-USDC | 5                        | 3                                |
| WETH-USDC | 5                        | 2                                |

Query Params:

| Field Name | Description                                                                    |
|------------|--------------------------------------------------------------------------------|
| markets    | (Optional) Markets to get index prices for. Defaults to all available markets. |

Response (Per Market):

| Field name | Description                                                                          |
|------------|--------------------------------------------------------------------------------------|
| price      | The index price, denominated in base units.                                          |
| live       | `true` if at least the minimum number of exchanges were available, otherwise `false` |

Example Response Body:

```json
{
  "PBTC-USDC": {
    "price": "86.11512"
  }
}
```

## Deprecated APIs

### Solo V1 order fields [DEPRECATED]

| Field Name         | JSON type | Description                                                                                                                                |
|--------------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------|
| makerMarket        | string    | The Solo [market](protocol.md#markets) of the Maker amount.                                                                                |
| takerMarket        | string    | The Solo [market](protocol.md#markets) of the Taker amount.                                                                                |
| makerAmount        | string    | The amount of token the Maker is offering, in base units.                                                                                  |
| takerAmount        | string    | The amount of token the Maker is requesting from the Taker, in base units.                                                                 |
| makerAccountOwner  | string    | The Ethereum address of the Maker.                                                                                                         |
| takerAccountOwner  | string    | The Ethereum address of the Taker. This must be set to the dYdX account owner address listed above.                                        |
| makerAccountNumber | string    | The Solo [account number](protocol.md#accounts) of the Maker.                                                                              |
| takerAccountNumber | string    | The Solo [account number](protocol.md#accounts) of the Taker. This must be set to the dYdX account number listed above.                    |
| triggerPrice       | string    | (Optional) The stop price at which the order will go to market.                                                                            |
| decreaseOnly       | boolean   | (Optional) Whether the Stop-Limit order is tied to an existing Isolated Position.                                                          |
| expiration         | string    | The Unix time in seconds at which this order will expire and can no longer be filled. Use `"0"` to specify that the order does not expire. |
| salt               | string    | A random number to make the order hash unique.                                                                                             |
| typedSignature     | string    | The signature of the order.                                                                                                                |

**Example:**

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
}
```

### POST `/v1/dex/orders` [DEPRECATED]

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

| Field Name           | JSON type | Description                                                                                                                                     |
|----------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| order                | Object    | A valid signed order JSON object.                                                                                                               |
| fillOrKill           | boolean   | Whether the order should be canceled if it cannot be immediately filled.                                                                        |
| postOnly             | boolean   | Whether the order should be canceled if it would be immediately filled.                                                                         |
| triggerPrice         | string    | (Optional) The stop price at which the order will go to market. Must be greater than triggerPrice in the order.                                 |
| clientId             | string    | (Optional) An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests. |
| cancelAmountOnRevert | boolean   | (Optional) Whether to try the order again if it is involved in a reverted fill.                                                                 |

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
  }
}
```

### POST `/v1/dex/orders/replace` [DEPRECATED]

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

| Field Name           | JSON type | Description                                                                                                                                     |
|----------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| order                | Object    | A valid signed order JSON object.                                                                                                               |
| fillOrKill           | boolean   | Whether the order should be canceled if it cannot be immediately filled.                                                                        |
| postOnly             | boolean   | Whether the order should be canceled if it would be immediately filled.                                                                         |
| triggerPrice         | string    | (Optional) The price at which the order will go to market. Must be greater than triggerPrice in the order.                                      |
| cancelId             | string    | Order id for the order that is being canceled and replaced.                                                                                     |
| clientId             | string    | (Optional) An arbitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests. |
| cancelAmountOnRevert | boolean   | (Optional) Whether to try the order again if it is involved in a reverted fill.                                                                 |

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
  }
}
```

### GET `/v1/dex/pairs` [DEPRECATED]

Description:
Returns all dex-compatible pairs. Be aware that there are two "pairs" for each unique order pair.

For example, in the unique pair WETH and DAI, there are two pairs, one for each side of the book.
The pairs are always named as `MAKER-TAKER`.

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

### GET `/v1/dex/orders` [DEPRECATED - use `/v2/orders`]

Description:
Get all open orders from the orderbook. This includes both unfilled and partially filled orders, but
does not include canceled, pruned, or unfillable orders.

Query Params:

| Field Name         | Description                                                                   |
|--------------------|-------------------------------------------------------------------------------|
| makerAccountOwner  | (Optional) The Ethereum address of the account(s) to request orders for.      |
| makerAccountNumber | (Optional) The Solo account number of the account to request orders for.      |
| limit              | (Optional) The maximum number of orders to return. Defaults to 100.           |
| startingBefore     | (Optional) ISO 8601 string. Starts returning orders created before this date. |
| pairs              | (Optional) Array of pairs to filter by (e.g. ?pairs=WETH-DAI,DAI-WETH)        |
| status             | (Optional) Array of status to filter by (e.g. ?status=CANCELED,FILLED)        |

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

### GET `/v1/dex/orders/:id` [DEPRECATED - use `/v2/orders/:id`]

Description:
Get an order by orderId.

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

### GET `/v1/dex/fills` [DEPRECATED - use `/v2/fills`]

Description:
Get all historical fills. A fill represents one side of a trade. It's most useful when you care
about the outcome of the trade from the perspective of a particular `makerAccountOwner`.

Query Params:

| Field Name         | Description                                                                          |
|--------------------|--------------------------------------------------------------------------------------|
| makerAccountOwner  | (Optional) The Ethereum address of the account(s) to request fills for.              |
| makerAccountNumber | (Optional) The Solo account number of the account to request fills for.              |
| limit              | (Optional) The maximum number of orders to return. Defaults to 100.                  |
| startingBefore     | (Optional) ISO 8601 date and time. Starts returning orders created before this date. |
| pairs              | (Optional) Array of pairs to filter by (e.g. ?pairs=WETH-DAI,DAI-WETH)               |

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
		}
	]
}
```

### DELETE `/v1/dex/orders/:hash` [DEPRECATED - use `/v2/orders/:hash`]

Description:
Cancels an open order by hash.

Please note you will need to provide a valid cancelation signature in the Authorization header in order to cancel an order.
The Authorization header signature should be hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash but will not include any information about the order format, version, or chainId since these are already baked-into the hash of the order. You can see working examples of signing in the [LimitOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/LimitOrders.ts) module of Solo.js.

The response will have a status of `200` as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user cancels an order twice, then `200` will be returned both times. For another example, canceling a fully-filled order will return `200` but will NOT update the status of the order from `FILLED` to `CANCELED`. Therefore, receiving a `200` status does not necessarily mean that the order was canceled.

Headers:
```
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
