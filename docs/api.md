# HTTP API
dYdX offers an HTTP API for retrieving information about the protocol, and submitting orders to
our exchange. Feel free to use these APIs to build your own applications on top of dYdX. Please feel
free to let us know via Intercom or Telegram if you have any questions or experience any issues.

All of these endpoints live at `https://api.dydx.exchange/`

e.g. `https://api.dydx.exchange/v1/dex/orders`

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

__Order fields__

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
    "expiration": "4294967295",
    "salt": "100",
    "typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
  },
};
```

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

### GET /v1/dex/pairs

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

### POST /v1/dex/orders

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
|clientId|string|(Optional)An abitrary string guaranteed to be unique for each makerAccountOwner. Will be returned alongside the order in subsequent requests.|

Note: `fillOrKill` orders execute immediately and no part of the order will go on the open order
book. `fillOrKill` orders will either be completely filled, or not filled. Partial fills are not possible.

Example Request Body:
```json
{
	"fillOrKill": true,
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
		"expiration": "4294967295",
		"salt": "100",
		"typedSignature": "0xd9c006cf9066e89c2e75de72604751f63985f173ca3c69b195f1f5f445289a1f2229c0475949858522c821190c5f1ec387f31712bd21f6ac31e4510d5711c2681f00"
	  },
};
```

Returns:
`201` if successful

### DELETE /v1/dex/orders/:hash

Description:
Cancels an open order by hash.

Please note you will need to provide a valid cancelation signature in the Authorization header in order to cancel an order.
The Authorization header signature should be hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash but will not include any information about the order format, version, or chainId since these are already baked-into the hash of the order. You can see working examples of signing in the [LimitOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/LimitOrders.ts) module of Solo.js.

The response will have a status of 200 as long as the order already existed and the signature is valid (even if the order is already unfillable for any reason). For example, if a user cancels an order twice, then 200 will be returned both times. For another example, canceling a fully-filled order will return 200 but will NOT update the status of the order from `FILLED` to `CANCELED`. Therefore, receiving a 200 status does not necessarily mean that the order was canceled.

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
            "rawData": "{\"makerMarket\":\"0\",\"takerMarket\":\"1\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"222\",\"makerAccountOwner\":\"0x0913017c740260fea4b2c62828a4008ca8b0d6e4\",\"takerAccountOwner\":\"0x28a8746e75304c0780e011bed21c72cd78cd535e\",\"makerAmount\":\"10\",\"takerAmount\":\"10\",\"salt\":\"79776019296374116968729143546164248655125424402698335194396863096742023853053\",\"expiration\":\"0\",\"typedSignature\":\"0x9db8cc7ee2e06525949a0ae87301d890aee9973c464b276661d760ca8db4c73522ba48b94bf36d4aada7627656f79be9e40225a52f0adec079b07263b9e8ee0c1b01\"}",
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
};
```

If the order was canceled, additional information will be provided by the `unfillableReason`
field.

For fills the status field represents the status of the transaction on-chain.

```javascript
export const STATUSES = {
  PENDING: 'PENDING', // The fill has been sent to the blockchain but not yet mined
  REVERTED: 'REVERTED', // The fill was sent to the blockchain, but was reverted on-chain
  CONFIRMED: 'CONFIRMED', // The fill was sent to the blockchain and successfully mined
};
```

### GET /v1/dex/orders

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

### GET /v1/dex/orders/:id

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

### GET /v1/dex/fills

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
      "price": "142.569999999999978406",
      "amount": "1000000000000000000",
      "makerOrderId": "0x145a78477771cea8ecf077c41c8301de3fedcdca9521361df3e40066bf4aab92",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0x3908e04d89741d802127be31ba0698fe6728da766cf1a820194e13346068da4d",
      "takerAccountOwner": "0xe184468b7103af442509dfb087a9c222353787b3",
      "takerAccountNumber": "0"
    },
    {
      "uuid": "f1b7a849-f765-4c18-8842-86e5750e08f5",
      "transactionHash": "0x6d83c6d11d8f8a712acf3066d83292aa13422399b4ed77defd764e32971def4e",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "price": "142.569999999999978406",
      "amount": "2000000000000000000",
      "makerOrderId": "0x145a78477771cea8ecf077c41c8301de3fedcdca9521361df3e40066bf4aab92",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0xa88bbd489128a0399c516a68d84622aba65971966d174cc98f692d07c70d9d1b",
      "takerAccountOwner": "0x3801d2d7e604e8333baacb2ab53ceeb8d7995416",
      "takerAccountNumber": "0"
    },
    {
      "uuid": "4711636c-8ac3-4d92-806b-7d811a2ee7d4",
      "transactionHash": "0xa6b0caa07f44b4d16d253c6a547771b10d230838e692eaa6aabba65aa1f72826",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "price": "142.569999999999998833",
      "amount": "2000000000000000000",
      "makerOrderId": "0x9d503c9ec3789143f4e47a0928a71cadb83ec445b680eef01ae5808d020c3cab",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0xd93b9b62f44168b4cfa0f1877be5cf329288958c9024158870308d60fd2cc347",
      "takerAccountOwner": "0xe46fbdfc5ec01d5914a802aa06fd0e4c5cd41bd5",
      "takerAccountNumber": "0"
    },
    {
      "uuid": "22d04881-f427-45d7-88c8-da61fea00210",
      "transactionHash": "0xbdd78f7dd75f8304b896c6ca5aa9cec847cc14925f70ac93e14958756b3bc372",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "price": "142.56999999999999883412062732488427883543558159273568954946785561652608982546567212",
      "amount": "500008846251751135",
      "makerOrderId": "0x9d503c9ec3789143f4e47a0928a71cadb83ec445b680eef01ae5808d020c3cab",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0x69ba7a2c7c2d4110e36af82c5f0a9076c4db70a5a3455e27a04a1c525d0233fd",
      "takerAccountOwner": "0xf03df965490882583018c64fd41fa82d7dee032f",
      "takerAccountNumber": "107168784608729135660257601028275559138738399573533131184788900278475157896234"
    }
  ]
}
```

### GET /v1/dex/trades

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
|?makerAccountOwner|The Ethereum address of the account(s) to request fills for.|
|?makerAccountNumber|(Optional) The Solo account number of the account to request fills for.|
|?limit|(Optional) The maximum number of orders to return. Defaults to 100.|
|?startingBefore|(Optional) ISO8601 string. Starts returning orders created before this date.|
|?pairs|(Optional) Array of pairs to filter by (e.g. ?pairs=WETH-DAI,DAI-WETH)|

Example Response Body:
```json
{
    "trades": [
        {
            "uuid": "9c575414-503f-4d19-97ba-7e329ce7c1f0",
            "transactionSender": "0xf809e07870dca762b9536d61a4fbef1a17178092",
            "transactionNonce": "2036",
            "transactionHash": "0x6376e4af2c2429a1f9fdb0bd46d022c074713c58007f4c36825ed2228cbf6ce2",
            "status": "CONFIRMED",
            "price": "200",
            "makerAmount": "100",
            "takerAmount": "201500",
            "makerOrderId": "0xb5576698cd7ecca927bba833c60e66ae55585c3f9a722cef5fe6fd5cf80eee2a",
            "takerOrderId": "0x20cab002ade434d4e21cc7ff6144339c4b4f199bd1d35ec93813b19c7a03162b",
            "createdAt": "2019-08-27T21:34:12.619Z",
            "updatedAt": "2019-08-27T21:35:14.054Z",
            "takerOrder": {
                "uuid": "3ed110f1-a98b-462f-9a41-a04e6e0da94c",
                "id": "0x20cab002ade434d4e21cc7ff6144339c4b4f199bd1d35ec93813b19c7a03162b",
                "makerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
                "makerAccountNumber": "0",
                "status": "PARTIALLY_FILLED",
                "price": "0.004962779156327543424317617866004962779156327543424317617866004962779156327543",
                "fillOrKill": false,
                "rawData": "{\"makerMarket\":\"1\",\"takerMarket\":\"0\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"0\",\"makerAccountOwner\":\"0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8\",\"takerAccountOwner\":\"0xf809e07870dca762B9536d61A4fBEF1a17178092\",\"makerAmount\":\"2015000000000000000\",\"takerAmount\":\"10000000000000000\",\"salt\":\"98520959837884420232461297527105290253597439542504267862519345092558369505856\",\"expiration\":\"1569360848\",\"typedSignature\":\"0xf26210e77f8ed100c88ba7ab8c3a3132506805c0b7e14a2ba0fb7ea2b8edd659705525b2e98460e3c23ebda83975b668aab287d4c588196eb7e607bba87545a61b00\"}",
                "makerAmount": "2015000000000000000",
                "unfillableAt": null,
                "expiresAt": "2019-09-24T21:34:08.000Z",
                "unfillableReason": null,
                "clientId": null,
                "takerAmount": "10000000000000000",
                "makerAmountRemaining": "2014999999999798500",
                "orderType": "dydexLimitV1",
                "takerAmountRemaining": "9999999999999000",
                "createdAt": "2019-08-27T21:34:10.906Z",
                "updatedAt": "2019-08-27T21:34:12.648Z",
                "deletedAt": null,
                "pairUuid": "83b69358-a05e-4048-bc11-204da54a8b19",
                "pair": {
                    "uuid": "83b69358-a05e-4048-bc11-204da54a8b19",
                    "name": "DAI-WETH",
                    "createdAt": "2018-08-24T16:26:46.963Z",
                    "updatedAt": "2018-08-24T16:26:46.963Z",
                    "deletedAt": null,
                    "makerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                    "takerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                    "makerCurrency": {
                        "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                        "symbol": "DAI",
                        "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                        "decimals": 18,
                        "soloMarket": 1,
                        "createdAt": "2018-08-24T16:26:46.904Z",
                        "updatedAt": "2018-08-24T16:26:46.904Z",
                        "deletedAt": null
                    },
                    "takerCurrency": {
                        "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                        "symbol": "WETH",
                        "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "decimals": 18,
                        "soloMarket": 0,
                        "createdAt": "2018-08-24T16:26:46.683Z",
                        "updatedAt": "2018-08-24T16:26:46.683Z",
                        "deletedAt": null
                    }
                }
            },
            "makerOrder": {
                "uuid": "cd764c34-5198-48d7-a167-8ef120c93a4b",
                "id": "0xb5576698cd7ecca927bba833c60e66ae55585c3f9a722cef5fe6fd5cf80eee2a",
                "makerAccountOwner": "0xa33d2b7ad08cb84784a4db70fe7429eb603774e2",
                "makerAccountNumber": "0",
                "status": "FILLED",
                "price": "200",
                "fillOrKill": false,
                "rawData": "{\"makerMarket\":\"0\",\"takerMarket\":\"1\",\"makerAccountNumber\":\"0\",\"takerAccountNumber\":\"0\",\"makerAccountOwner\":\"0xa33d2b7ad08cb84784a4db70fe7429eb603774e2\",\"takerAccountOwner\":\"0xf809e07870dca762b9536d61a4fbef1a17178092\",\"makerAmount\":\"100\",\"takerAmount\":\"20000\",\"salt\":\"71396665083958089451142428285242792093549457850088753846410228331338822485995\",\"expiration\":\"0\",\"typedSignature\":\"0xfa843b61052d5ac28b7c47acdd0bcf568113eadead435f9f34b474a4fbeab8cd4c88ca7823ac0162c1081d081a50bcfe523dba2dff3b26f98d38c81aa9aad6e21c01\"}",
                "makerAmount": "100",
                "unfillableAt": "2019-08-27T21:34:12.640Z",
                "expiresAt": null,
                "unfillableReason": "ENTIRELY_FILLED",
                "clientId": null,
                "takerAmount": "20000",
                "makerAmountRemaining": "0",
                "orderType": "dydexLimitV1",
                "takerAmountRemaining": "0",
                "createdAt": "2019-08-12T21:10:12.936Z",
                "updatedAt": "2019-08-27T21:34:12.640Z",
                "deletedAt": null,
                "pairUuid": "5a40f128-ced5-4947-ab10-2f5afee8e56b",
                "pair": {
                    "uuid": "5a40f128-ced5-4947-ab10-2f5afee8e56b",
                    "name": "WETH-DAI",
                    "createdAt": "2018-08-24T16:26:46.963Z",
                    "updatedAt": "2018-08-24T16:26:46.963Z",
                    "deletedAt": null,
                    "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                    "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                    "makerCurrency": {
                        "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                        "symbol": "WETH",
                        "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "decimals": 18,
                        "soloMarket": 0,
                        "createdAt": "2018-08-24T16:26:46.683Z",
                        "updatedAt": "2018-08-24T16:26:46.683Z",
                        "deletedAt": null
                    },
                    "takerCurrency": {
                        "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                        "symbol": "DAI",
                        "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                        "decimals": 18,
                        "soloMarket": 1,
                        "createdAt": "2018-08-24T16:26:46.904Z",
                        "updatedAt": "2018-08-24T16:26:46.904Z",
                        "deletedAt": null
                    }
                }
            }
        }
	]
}
```

## Accounts

### GET /v1/accounts/:address

Description:
Get account balances for a particular account owner

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
  "hasAtLeastOneNegativePar": false,
  "hasAtLeastOnePositivePar": true,
  "sumBorrowUsdValue": "0",
  "sumSupplyUsdValue": "0",
  "balances": {
    "0": {
      "owner": "0x0913017c740260fea4b2c62828a4008ca8b0d6e4",
      "number": "0",
      "marketId": 0,
      "newPar": "9994719126810778",
      "accountUuid": "72cd6a2a-17ff-4394-92d3-e951a96aa266",
      "isParPositive": true,
      "isParNegative": false,
      "wei": "10000184397123234.892111593021043502",
      "expiresAt": null,
      "par": "9994719126810778",
      "adjustedSupplyUsdValue": "0",
      "adjustedBorrowUsdValue": "0"
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
