# Overview
dYdX offers a few HTTP APIs for retrieving information about the protocol, and submitting orders to
our DEX. Feel free to use these APIs to build your own applications on top of dYdX. Please feel
free to let us know via Intercom or Telegram if you have any questions or experience any issues.

All of these endpoints live at `https://api.dydx.exchange/`

e.g. `https://api.dyd.exchange/v1/orders`

## Orderbook

### Introduction

The following API endpoints allow for submitting and retrieving orders from the dYdX orderbook.
This orderbook is what's frequently referred to as a "Matching Model" orderbook. This means that
all orders are submitted to the blockchain by dYdX itself You do not need to provide gas fees
or send on-chain transactions yourself. This is especially useful for traders and market makers who
wish to be able to quickly cancel their orders without waiting for a transaction to be mined.

In order to submit an order, you (the maker) must first create a JSON object that specifies the
details of your order. Once you create this object you must sign it with your Ethereum private key,
and put the result in the `typedSignature` field. Note: The `typedSignature` is omitted before
signing, and added only after signing the message.

The order data is hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).
This includes the exact order format and version as well as information about the verifying contract and the chainId of the network.

When creating your order you _must_ specify the takerAccountOwner as `x` and the takerAccountNumber
as `y`, otherwise your order will be rejected.

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
|expiration|string|The time in unix seconds at which this order will be expired and can no longer be filled. Use `0` to specify that there is no expiration on the order.|
|salt|string|A random number to make the orderHash unique.|
|typedSignature|string|The signature of the order.|

Example:
```JSON
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

### POST /v1/dex/orders

Description:
Post a new order to the orderbook.

Headers:
```
Content-Type: application/json
```

Request Body:

|Field Name|JSON type|Description|
|----------|---------|-----------|
|order|Object|A valid signed order JSON object|
|fillOrKill|boolean|Whether the order should be canceled if it cannot be immediately filled|
 
note: Market orders execute immediately and no part of the market order will go on the open order
book. Market orders will either be completely filled, or not filled. Partial fills are not possible.

Example Request Body:
```JSON
{
	"fillOrKill": true,
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

Please note you will need to provide a valid cancelation signature in order to cancel an order.
The cancellation message should be hashed according to [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) and include the original orderHash but will not include any information about the order format, version, or chainId since these are already baked-into the hash of the order. You can see working examples of signing in the [LimitOrders](https://github.com/dydxprotocol/solo/blob/master/src/modules/LimitOrders.ts) module of Solo.js.

Headers:
```
Content-Type: application/json
Authorization: [A valid cancel signature]
```

Query Params:

|Field Name|Description|
|----------|-----------|
|?makerAccountOwner|The Ethereum address of the account(s) to request orders for.|
|?makerAccountNumber|(Optional) The Solo account number of the account to request orders for.|

Example Response Body:
```JSON
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
```
export const STATUS = {
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  CANCELED: 'CANCELED',
};
```

If the order was canceled, additional information will be provided by the `unfillableReason`
field.

For fills the status field represents the status of the transaction on-chain.

```
export const STATUSES = {
  PENDING: 'PENDING',
  REVERTED: 'REVERTED',
  CONFIRMED: 'CONFIRMED',
};

```

### GET /v1/dex/orders

Description:
Get all open orders from the orderbook for a particular makerAccountOnwer.

Headers:
```
Content-Type: application/json
```

Query Params:

|Field Name|Description|
|----------|-----------|
|?makerAccountOwner|The Ethereum address of the account(s) to request orders for.|
|?makerAccountNumber|(Optional) The Solo account number of the account to request orders for.|

Example Response Body:
```JSON
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

### GET /v1/dex/fills

Description:
Get all historical fills for a particular makerAccountOwner.

Headers:
```
Content-Type: application/json
```

Query Params:
```
"?makerAccountOwner": The Ethereum address of the account(s) to request orders for.
"?makerAccountNumber": (Optional) The Solo account number of the account to request orders for.
```

Example Response Body:
```JSON
{
    "fills": [
        {
            "uuid": "c389c0de-a193-49c3-843a-eebee25d1bfa",
            "messageId": "8f1ed6dc-8bd6-4155-ab33-5a252814f88b",
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
