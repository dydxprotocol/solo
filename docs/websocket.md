# WebSocket API
dYdX offers a WebSocket API for streaming updates to dYdX.

You can connect to the WebSocket at `wss://api.dydx.exchange/v1/ws`

## Introduction

The WebSocket API accepts and sends messages in JSON format. All messages sent to clients by our server will be of the form:

```json
{
  "type": "channel_data",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 289
  ...additional data...
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|The type of the message|
|connection_id|string|A uuid unique to your connection. Will remain the same for the life of the connection|
|message_id|number|A sequential number starting at 0 that increases by 1 for each message sent|

## Subscribe

On the WebSocket you can subscribe to various channels to receive updates. Subscribe messages sent by clients must be of the form:

### Subscribing

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "id": "WETH-DAI"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|The channel to subscribe to|
|id|string|An id to subscribe to on the channel|

#### Initial Response

Once subscribed, clients will receive a message:
```json
{
  "type": "subscribed",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 289,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
    ...initial state...
  }
}
```
Where initial state is the initial state of what you have subscribed to. After this, updates will be sent of the form:

#### Updates

```json
{
  "type": "channel_data",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 290,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
    ...update...
  }
}
```

### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "orderbook",
  "id": "WETH-DAI"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|An id to unsubscribe from on the channel|

#### Response
Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 289,
  "channel": "orderbook",
  "id": "WETH-DAI"
}
```


### Orderbook

The orderbook channel allows clients to receive all updates to the active orderbook. This is the fastest way to receive updates to the orderbook.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "id": "WETH-DAI"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "orderbook"|
|id|string|The market to subscribe to. e.g. WETH-DAI, WETH-USDC, DAI-USDC|

#### Initial Response

The initial response will contain the entire state of the active orderbook. The `contents` field will be of the same form as [`GET /v1/orderbook/:market`](https://docs.dydx.exchange/#/api?id=get-v1orderbookmarket):

```json
{
  "type": "channel_data",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 290,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
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
}
```

#### Updates

Updates to the orderbook are sent in array form, indicating atomic updates to the orderbook. There are 3 types of updates that will be sent:

- `NEW`: sent when a new order is added to the orderbook
- `REMOVED`: sent when an order is removed from the orderbook
- `UPDATED`: sent when an order's amount is updated (e.g. due to a fill)

An order was added to the orderbook:
```json
{
  "type": "channel_data",
  "connection_id": "0b88ebf2-98ec-4de6-b781-62e1648ae657",
  "message_id": 1277,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
    "updates": [
      {
        "type": "NEW",
        "id": "0xe8aad0c4ea79e014b398da781a1b711a4c12086348cd421e4f5c19ba077c3374",
        "amount": "50600000000000000000",
        "price": "145.97665700000000000000",
        "side": "BUY"
      }
    ]
  }
}
```

An order was removed from the orderbook (e.g. cancelled or fully filled):
```json
{
  "type": "channel_data",
  "connection_id": "0b88ebf2-98ec-4de6-b781-62e1648ae657",
  "message_id": 1278,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
    "updates": [
      {
        "type": "REMOVED",
        "id": "0xe8aad0c4ea79e014b398da781a1b711a4c12086348cd421e4f5c19ba077c3374",
        "side": "BUY"
      }
    ]
  }
}
```

An order was removed from the orderbook (e.g. cancelled or fully filled), and another order had its amount updated:
```json
{
  "type": "channel_data",
  "connection_id": "0b88ebf2-98ec-4de6-b781-62e1648ae657",
  "message_id": 1278,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": {
    "updates": [
      {
        "type": "REMOVED",
        "id": "0xe8aad0c4ea79e014b398da781a1b711a4c12086348cd421e4f5c19ba077c3374",
        "side": "BUY"
      },
      {
        "type": "UPDATED",
        "id": "0x510f0a948e9b4488bfcc3b5aa2abf28334e174825a56fa2c6948fd5aaf3dd420",
        "side": "SELL",
        "amount": "50600000000000000000"
      }
    ]
  }
}
```

### Orders

The orders channel allows clients to subscribe to orders and fills pertaining to the wallet address.

#### Subscribing

To subscribe, send:

```json
{
  "type": "subscribe",
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "orders"|
|id|string|The wallet address to listen to|

#### Initial Response

The initial response will be all the user's open and pending orders, inside the
`contents` field.

```json
{
  "type": "subscribed",
  "connection_id": "a3f64f25-4744-46f8-8456-f456f75616b2",
  "message_id": 1,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "orders": [
      {
        "uuid": "210ab138-017d-4983-8d87-2ca6ff0955c8",
        "id": "0x119f4e6e453a90c0eb64f6c2d3015386c4d201e89ea35a35495cba4c7edb4665",
        "createdAt": "2020-01-14T21:56:18.765Z",
        "status": "OPEN",
        "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "accountNumber": "0",
        "orderType": "LIMIT",
        "fillOrKill": false,
        "postOnly": true,
        "market": "DAI-USDC",
        "side": "BUY",
        "baseAmount": "20000000000000000000",
        "quoteAmount": "1000000",
        "filledAmount": "0",
        "price": "0.00000000000005",
        "cancelReason": null
      }
    ]
  }
}
```

#### Updates

Updates to the orders are posted on the channel. If an order is filled, the corresponding fills will also be sent on the channel. The orders and fills are in the same format as the [`V2 HTTP API`](https://docs.dydx.exchange/#/api?id=v2-endpoints):

An order is first placed:
```json
{
  "type": "channel_data",
  "connection_id": "a17dcc8e-9468-4308-96f5-3f458bf485d9",
  "message_id": 4,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "ORDER",
    "order": {
      "uuid": "29c9d044-4e13-468f-8cf4-7e529e614296",
      "id": "0xb0751a113c759779ff5fd6a53b37b26211a9f8845d443323b9f877f32d9aafd9",
      "createdAt": "2020-01-14T22:22:19.131Z",
      "status": "OPEN",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": false,
      "market": "DAI-USDC",
      "side": "BUY",
      "baseAmount": "20000000000000000000",
      "quoteAmount": "20018000",
      "filledAmount": "0",
      "price": "0.0000000000010009",
      "cancelReason": null,
      "updatedAt": "2020-01-14T22:22:19.153Z"
    }
  }
}
```

An order was cancelled:
```json
{
  "type": "channel_data",
  "connection_id": "8c510abb-2e45-4f9a-be17-9c992b441da8",
  "message_id": 7,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "ORDER",
    "order": {
      "uuid": "d98b3b81-8ffa-45c8-8e1a-38a31ab9f690",
      "id": "0x1002e3ae34834109e8f0a8429df1faf9597b39701dc6a51e1950e4c170afa21f",
      "createdAt": "2020-01-14T21:28:04.719Z",
      "status": "CANCELED",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": false,
      "market": "DAI-USDC",
      "side": "BUY",
      "baseAmount": "20000000000000000000",
      "quoteAmount": "100000",
      "filledAmount": "0",
      "price": "0.000000000000005",
      "cancelReason": "USER_CANCELED",
      "updatedAt": "2020-01-14T21:28:19.191Z"
    }
  }
}
```

An order was filled:
```json
{
  "type": "channel_data",
  "connection_id": "839bd50b-77f6-4568-b758-cdc4b2962efb",
  "message_id": 5,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "ORDER",
    "order": {
      "uuid": "5137f016-80dc-47e8-89b5-aee3b2db15d0",
      "id": "0x03dfd18edc2f26fc9298edcd28ca6cad4971bd1f44d40253d5154b0d1f217680",
      "createdAt": "2020-01-14T21:15:13.561Z",
      "status": "FILLED",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": true,
      "postOnly": false,
      "market": "DAI-USDC",
      "side": "SELL",
      "baseAmount": "20000000000000000000",
      "quoteAmount": "19900000",
      "filledAmount": "20000000000000000000",
      "price": "0.000000000000995",
      "cancelReason": null,
      "updatedAt": "2020-01-14T21:15:14.020Z"
    }
  }
}
```

The PENDING fill for the order:
```json
{
  "type": "channel_data",
  "connection_id": "839bd50b-77f6-4568-b758-cdc4b2962efb",
  "message_id": 6,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "FILL",
    "fill": {
      "uuid": "5a2efda1-39f7-44c3-a62b-d5ca925937f9",
      "status": "PENDING",
      "orderId": "0x03dfd18edc2f26fc9298edcd28ca6cad4971bd1f44d40253d5154b0d1f217680",
      "transactionHash": "0xbc331c8894dbe19f65cf4132a98ff81793d1a9e5a437ecf62801d28f4d09caa9",
      "createdAt": "2020-01-14T21:15:14.008Z",
      "updatedAt": "2020-01-14T21:15:14.026Z",
      "amount": "20000000000000000000",
      "price": "0.000000000001",
      "side": "SELL",
      "market": "DAI-USDC",
      "liquidity": "TAKER",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
    }
  }
}
```

When the fill is confirmed:
```json
{
  "type": "channel_data",
  "connection_id": "839bd50b-77f6-4568-b758-cdc4b2962efb",
  "message_id": 7,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "FILL",
    "fill": {
      "uuid": "5a2efda1-39f7-44c3-a62b-d5ca925937f9",
      "status": "CONFIRMED",
      "orderId": "0x03dfd18edc2f26fc9298edcd28ca6cad4971bd1f44d40253d5154b0d1f217680",
      "transactionHash": "0xbc331c8894dbe19f65cf4132a98ff81793d1a9e5a437ecf62801d28f4d09caa9",
      "createdAt": "2020-01-14T21:15:14.008Z",
      "updatedAt": "2020-01-14T21:17:40.591Z",
      "amount": "20000000000000000000",
      "price": "0.000000000001",
      "side": "SELL",
      "market": "DAI-USDC",
      "liquidity": "TAKER",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
    }
  }
}
```

An order expired:
```json
{
  "type": "channel_data",
  "connection_id": "a17dcc8e-9468-4308-96f5-3f458bf485d9",
  "message_id": 5,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "ORDER",
    "order": {
      "uuid": "807e79de-9e60-40d1-9bff-51a50e5249f8",
      "id": "0x40245ed8282415a40a8583ef5b2f12de50a2f610ac6a1ffd4efac6a652c67287",
      "createdAt": "2020-01-14T22:13:57.156Z",
      "status": "CANCELED",
      "accountOwner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": false,
      "market": "DAI-USDC",
      "side": "BUY",
      "baseAmount": "20000000000000000000",
      "quoteAmount": "19972000",
      "filledAmount": "0",
      "price": "0.0000000000009986",
      "cancelReason": "EXPIRED",
      "updatedAt": "2020-01-14T22:25:28.955Z"
    }
  }
}
```
#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "unsubscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|An id to unsubscribe from on the channel|

#### Response

Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "e7259ee2-98f5-4187-8623-9175234d5fb2",
  "message_id": 3,
  "channel": "orders",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

### Operations

The operations channel allows clients to subscribe to operations on a provided wallet address.

#### Subscribing

To subscribe, send:

```json
{
  "type": "subscribe",
  "channel": "operations",
  "id": "0x014bE43BF2d72a7a151A761a1bD5224f7Ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "operations"|
|id|string|The wallet address to listen to|

#### Initial Response

The operations channel does not currently support an initial response

```json
{}
```

#### Updates

Operations on the wallet address are sent on the websocket channel. Currently the operation type is 'ADD'.
eg:

```json
{
   "type":"channel_data",
   "connection_id":"5b21af84-1c30-4290-83c5-762b1ada1018",
   "message_id":12,
   "channel":"operations",
   "id":"0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
   "contents":{
      "type":"ADD",
      "pending":false,
      "hash":"0xe722db3006b704ea6277a277fa727f498aee8d1c9d1f21903e0bb14755e3a4fa",
      "operation": {} //operation field
   }
}
```

### Positions

The positions channel allows clients to receive updates about their existing positions.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "positions"|
|id|string|The wallet address to subscribe to|

#### Initial Response

The initial response will contain the positions that are open. 

```json
{
  "type": "subscribed",
  "connection_id": "e08534fb-f52b-4754-85b2-4a81e26f2cd4",
  "message_id": 1,
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "positions": [
      {
        "uuid": "d4b60574-f1d3-478c-921b-48b416640b0a",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "number": "18391807697043682023758523528032951427719342564248970230470210680141737387458",
        "market": "WETH-DAI",
        "type": "ISOLATED_LONG",
        "status": "OPEN",
        "accountUuid": "6793b2f8-5b07-4bce-ba54-da33372ae988",
        "expiresAt": "2020-03-26T23:10:31.000Z",
        "createdAt": "2020-02-27T23:10:37.319Z",
        "updatedAt": "2020-02-27T23:11:31.773Z",
        "account": {
          "uuid": "6793b2f8-5b07-4bce-ba54-da33372ae988",
          "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
          "number": "18391807697043682023758523528032951427719342564248970230470210680141737387458",
          "createdAt": "2020-02-27T23:08:55.303Z",
          "updatedAt": "2020-02-27T23:08:55.303Z"
        },
        "standardActions": [
          {
            "uuid": "b95fa3fc-84a7-46f1-9ce0-1eca1b144117",
            "type": "ISOLATED_OPEN",
            "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
            "transferAmount": "33720746949513441",
            "tradeAmount": "66666666666666667",
            "price": "227.9799999999999999901000000000000000494999999999999997525000000000000012375",
            "market": "WETH-DAI",
            "asset": "WETH",
            "side": "LONG",
            "operationUuid": "3ce07798-433f-4cab-b699-3cd17f90308f",
            "transactionHash": "0x028e9c22856673a89e649d0d13ded6cb7ff6968313e52ababd66b49900d39123",
            "positionUuid": "d4b60574-f1d3-478c-921b-48b416640b0a",
            "borrowAmount": null,
            "orderNumber": "956855500050000",
            "confirmedAt": "2020-02-27T23:10:31.000Z",
            "createdAt": "2020-02-27T23:11:31.758Z",
            "updatedAt": "2020-02-27T23:11:31.778Z"
          }
        ]
      }
    ]
  }
}
```

#### Updates

Updates to the users position are posted to the positions channel.
eg:- A position is closed:

```json
{
  "type": "channel_data",
  "connection_id": "fcccc0a9-20af-4c55-ab48-a7f285efdfde",
  "message_id": 6,
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "pending": true,
    "hash": "0x2dbe08ace3c10a16dfc7137333ba32463631d698f768b97b28cb9e8265075a3d",
    "position": {
      "uuid": "e2827c5f-a651-40b6-aaf7-01b2a04bd2d4",
      "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "number": "10301656009924513450047526987008292264633253953002046801477043073002343349750",
      "market": "WETH-DAI",
      "type": "ISOLATED_SHORT",
      "status": "CLOSED",
      "accountUuid": "eda666d3-8a89-4f8d-adb5-2e47b6aa630c",
      "expiresAt": "2020-04-01T00:03:20.000Z",
      "createdAt": "2020-03-04T00:03:50.175Z",
      "updatedAt": "2020-03-04T00:07:47.296Z"
    }
  }
}
```

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "unsubscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|An id to unsubscribe from on the channel|

#### Response

Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "e08534fb-f52b-4754-85b2-4a81e26f2cd4",
  "message_id": 7,
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

### Standard Actions

The standard actions channel allows clients to receive updates about actions such as DEPOSIT, 
ISOLATED_OPEN, etc.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "standard_actions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "standard_actions"|
|id|string|The wallet address to subscribe to|

#### Initial Response

The initial response will be the latest 100 standard actions on the user's account.

```json
{
  "type": "subscribed",
  "connection_id": "63b32e89-a572-4e6b-833e-2faf6fe1e195",
  "message_id": 1,
  "channel": "standard_actions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "standardActions": [
      {
        "uuid": "b95fa3fc-84a7-46f1-9ce0-1eca1b144117",
        "type": "ISOLATED_OPEN",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": "33720746949513441",
        "tradeAmount": "66666666666666667",
        "price": "227.9799999999999999901000000000000000494999999999999997525000000000000012375",
        "market": "WETH-DAI",
        "asset": "WETH",
        "side": "LONG",
        "operationUuid": "3ce07798-433f-4cab-b699-3cd17f90308f",
        "transactionHash": "0x028e9c22856673a89e649d0d13ded6cb7ff6968313e52ababd66b49900d39123",
        "positionUuid": "d4b60574-f1d3-478c-921b-48b416640b0a",
        "borrowAmount": null,
        "orderNumber": "956855500050000",
        "confirmedAt": "2020-02-27T23:10:31.000Z",
        "createdAt": "2020-02-27T23:11:31.758Z",
        "updatedAt": "2020-02-27T23:11:31.778Z"
      },
      {
        "uuid": "c237ec6d-9599-40fa-acb5-e8b4c89827ad",
        "type": "ISOLATED_FULL_CLOSE",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": "7208389487816291503",
        "tradeAmount": "100000001487414238",
        "price": "225.85999763831216716128108275674475187561565528432069314401462859563656946568221903",
        "market": "WETH-DAI",
        "asset": "DAI",
        "side": "SHORT",
        "operationUuid": "0a0971b0-1fe2-45f9-bed5-b576bdacb732",
        "transactionHash": "0x16d9eed48b0cf10ffe96999c6c458fbbb6edd36f9d81fac3cc34e8d968f55e79",
        "positionUuid": "8ed5867f-aa3a-4cbf-a661-47cd0f24db85",
        "borrowAmount": null,
        "orderNumber": "956189301250000",
        "confirmedAt": "2020-02-26T22:35:39.000Z",
        "createdAt": "2020-02-26T22:38:17.152Z",
        "updatedAt": "2020-02-26T22:38:17.180Z"
      },
      {
        "uuid": "9b3738a0-92d3-46e2-b8fc-9211e5969ae8",
        "type": "ISOLATED_OPEN",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": "7379308716494646154",
        "tradeAmount": "100000000000000000",
        "price": "225.27999999999999644",
        "market": "WETH-DAI",
        "asset": "DAI",
        "side": "SHORT",
        "operationUuid": "130bc3fa-5ed7-42ca-b972-d1ade4d7c9f2",
        "transactionHash": "0xc98e1246c180278ffd1851e11b56afd59feeda26144d8f89d8e3dca02aab780e",
        "positionUuid": "8ed5867f-aa3a-4cbf-a661-47cd0f24db85",
        "borrowAmount": null,
        "orderNumber": "956188200160000",
        "confirmedAt": "2020-02-26T22:32:54.000Z",
        "createdAt": "2020-02-26T22:33:51.920Z",
        "updatedAt": "2020-02-26T22:33:51.946Z"
      },
      {
        "uuid": "e418ec53-d7fb-4f74-a4c4-5a8ecb6b7f73",
        "type": "ISOLATED_FULL_CLOSE",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": "50337795123416145",
        "tradeAmount": "50002015563715323",
        "price": "266.06001958983337426563213321841718225957351026342936018892644893242773949836804886",
        "market": "WETH-DAI",
        "asset": "WETH",
        "side": "LONG",
        "operationUuid": "719177b1-34be-4872-be11-c76da55358e4",
        "transactionHash": "0x68427cf28e08b0b00be4d58fa7e074adb595cf71f7409377398bc8b3ec3a740f",
        "positionUuid": "c088f1aa-cf10-4122-b767-1c78376865c0",
        "borrowAmount": null,
        "orderNumber": "954926000820000",
        "confirmedAt": "2020-02-24T23:56:56.000Z",
        "createdAt": "2020-02-24T23:58:02.477Z",
        "updatedAt": "2020-02-24T23:58:02.496Z"
      },
      {
        "uuid": "c94687cd-68d6-4b92-a34e-eac80be17028",
        "type": "DEPOSIT",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": "1000000000000000000",
        "tradeAmount": null,
        "price": null,
        "market": null,
        "asset": "WETH",
        "side": null,
        "operationUuid": "6bc95ff7-9c1e-4fab-9cf7-8d2c3492329b",
        "transactionHash": "0xfa53ce0a88f71d5671dd7695d3f3cd3344e9a0e0a638f710f5ec8bc791171c0d",
        "positionUuid": null,
        "borrowAmount": null,
        "orderNumber": "954918100860000",
        "confirmedAt": "2020-02-24T23:41:45.000Z",
        "createdAt": "2020-02-24T23:42:49.788Z",
        "updatedAt": "2020-02-24T23:42:49.792Z"
      },
      {
        "uuid": "ae1bffd4-95bc-45e1-87cc-08cb3c0f8af7",
        "type": "TRADE",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "transferAmount": null,
        "tradeAmount": "20000000000000000000",
        "price": "0.000000000000994204",
        "market": "DAI-USDC",
        "asset": null,
        "side": "SELL",
        "operationUuid": "7837d560-5d13-4bdc-874b-0762eede1173",
        "transactionHash": "0x5fdc86ffb39350070801130c5beb82c7e98c5e9fd2ccd63880f51c5026af034b",
        "positionUuid": null,
        "borrowAmount": null,
        "orderNumber": "954918100580000",
        "confirmedAt": "2020-02-24T23:41:45.000Z",
        "createdAt": "2020-02-24T23:43:19.711Z",
        "updatedAt": "2020-02-24T23:43:19.717Z"
      }
    ]
  }
}
```

#### Updates

New actions performed by the user are posted on the channel.

```json
{
  "type": "channel_data",
  "connection_id": "8427b0ba-d703-43e5-acb6-3f04d9fbebea",
  "message_id": 10,
  "channel": "standard_actions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "pending": true,
    "hash": "0xa0acbb3ebeae61d692267ec7269fa851e12189e9238ad03ee48bc843fdb80b96",
    "standardAction": {
      "uuid": "a13255e8-586a-4a4c-8e9a-2454b138ffb9",
      "type": "DEPOSIT",
      "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "number": "0",
      "transferAmount": "100000000000000000",
      "tradeAmount": null,
      "price": null,
      "market": null,
      "asset": "WETH",
      "side": null,
      "operationUuid": "b4f8f664-7238-452d-89dd-69a45fb1a0be",
      "transactionHash": "0xa0acbb3ebeae61d692267ec7269fa851e12189e9238ad03ee48bc843fdb80b96",
      "positionUuid": null,
      "borrowAmount": null,
      "orderNumber": "960121200610000",
      "confirmedAt": "2020-03-03T23:37:00.000Z",
      "feeAmount": null,
      "feeAsset": null,
      "createdAt": "2020-03-03T23:37:04.198Z",
      "updatedAt": "2020-03-03T23:37:04.200Z"
    }
  }
}
```

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "standard_actions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "unsubscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|An id to unsubscribe from on the channel|

### Balance updates

The balance updates channel allows clients to receive updates about balances and
expirations when an operation is confirmed etc.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "balance_updates",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "balance_updates"|
|id|string|The wallet address to subscribe to|

#### Initial Response

The initial response will be the latest 100 balance updates on the user's account.

```json
{
  "type": "subscribed",
  "connection_id": "fbb65bfb-b460-49a0-9afa-029420b1b6d2",
  "message_id": 1,
  "channel": "balance_updates",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "balanceUpdates": [
      {
        "uuid": "787bc050-dc06-4d41-8dd0-43db57e0ba1b",
        "deltaWei": "-6443662021540585812",
        "newPar": "0",
        "accountUuid": "a108e8dc-043f-4e35-a61c-8c0d8bd605e6",
        "actionUuid": "55efbba1-08ba-4af5-b03a-bf50a47ae6c0",
        "marketId": 3,
        "expiresAt": null,
        "orderNumber": "963883600170002",
        "newWei": "0",
        "confirmedAt": "2020-03-09T18:26:06.000Z",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "number": "23250809876488196813448176070712780961598248407839150544631431380708932406146",
        "isPendingBlock": null,
        "createdAt": "2020-03-22T11:48:11.941Z",
        "updatedAt": "2020-03-22T11:48:11.941Z"
      },
      {
        "uuid": "8970e854-32b6-49a7-99eb-d5d491be03c0",
        "deltaWei": "6443662021540585812",
        "newPar": "9723610723617108642",
        "accountUuid": "6a56f996-42ee-4925-8e2b-3437e7734c34",
        "actionUuid": "55efbba1-08ba-4af5-b03a-bf50a47ae6c0",
        "marketId": 3,
        "expiresAt": null,
        "orderNumber": "963883600170002",
        "newWei": "9860083718207192031.997074607802540022",
        "confirmedAt": "2020-03-09T18:26:06.000Z",
        "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
        "number": "0",
        "isPendingBlock": null,
        "createdAt": "2020-03-22T11:48:11.942Z",
        "updatedAt": "2020-03-22T11:48:11.942Z"
      }
    ]
  }
}
```

#### Updates

New actions performed by the user are posted on the channel.

```json
{
  "type": "channel_data",
  "connection_id": "fbb65bfb-b460-49a0-9afa-029420b1b6d2",
  "message_id": 7,
  "channel": "balance_updates",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
  "contents": {
    "type": "BALANCE_UPDATE",
    "pending": false,
    "hash": "0xc7d682dcd18cf84e4b04cde01e65a9f4961faad476a12b9b6b66e7fcb48e53dd",
    "balanceUpdate": {
      "uuid": "63016bd1-fbc5-4544-876a-3b9eef6d60ca",
      "deltaWei": "-100000000000000000",
      "newPar": "1508081686843845130",
      "accountUuid": "6a56f996-42ee-4925-8e2b-3437e7734c34",
      "actionUuid": "1c900392-0589-4567-9d80-7b4427b4dd8a",
      "marketId": 0,
      "expiresAt": null,
      "orderNumber": "973118700550002",
      "newWei": "1509359692212859652.41423281486264464",
      "confirmedAt": "2020-03-24T01:14:10.000Z",
      "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
      "number": "0",
      "isPendingBlock": null,
      "createdAt": "2020-03-24T01:15:04.269Z",
      "updatedAt": "2020-03-24T01:15:04.269Z"
    }
  }
}
```

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "balance_updates",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "unsubscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|An id to unsubscribe from on the channel|
