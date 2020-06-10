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

| Field Name    | JSON type | Description                                                                           |
|---------------|-----------|---------------------------------------------------------------------------------------|
| type          | string    | The type of the message                                                               |
| connection_id | string    | A uuid unique to your connection. Will remain the same for the life of the connection |
| message_id    | number    | A sequential number starting at 0 that increases by 1 for each message sent           |

## Subscribe

On the WebSocket you can subscribe to various channels to receive updates. Subscribe messages sent by clients must be of the form:

### Subscribing

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "id": "WETH-DAI",
  ...optional parameter...
  "batched": "true"
}
```

| Field Name | JSON type | Description                                       |
|------------|-----------|---------------------------------------------------|
| type       | string    | Must be set to "subscribe"                        |
| channel    | string    | The channel to subscribe to                       |
| id         | string    | An id to subscribe to on the channel              |
| batched    | boolean   | (optional) Whether to batch messages when sending |

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

### Batching messages

When `batched = true` , the updates will be batched and sent together at regular intervals of 250ms.

```json
{
  "type": "channel_batch_data",
  "connection_id": "6bc52ffd-258a-4554-a3c6-2ebf80fa0fe3",
  "message_id": 317,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": [{
    ...array of updates...
  }]
}
```

eg:

Command:
```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "id": "WETH-DAI",
  "batched": true
}
```

Example message structure:
```json
{
  "type": "channel_batch_data",
  "connection_id": "6bc52ffd-258a-4554-a3c6-2ebf80fa0fe3",
  "message_id": 317,
  "channel": "orderbook",
  "id": "WETH-DAI",
  "contents": [
    {
      "updates": [
        {
          "type": "NEW",
          "id": "0x03ed69375550ab371ecf31c96d7479de6024baa5c1146b8c0bf225c140deeee3",
          "amount": "13000000000000000000",
          "price": "241.86",
          "side": "BUY"
        }
      ]
    },
    {
      "updates": [
        {
          "type": "REMOVED",
          "id": "0xa7c66256f295aa75524996a190175dc002720d6a3d65ce4af667560add7f27bd",
          "side": "BUY"
        },
        {
          "type": "NEW",
          "id": "0x7e41c2eca4325ff350adb54ef46c5f6f51406fb674efc105f2d23e13aa99ee25",
          "amount": "700000000000000000000",
          "price": "241.65",
          "side": "BUY"
        }
      ]
    }
  ]
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

| Field Name | JSON type | Description                              |
|------------|-----------|------------------------------------------|
| type       | string    | Must be set to "subscribe"               |
| channel    | string    | The channel to unsubscribe from          |
| id         | string    | An id to unsubscribe from on the channel |

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

| Field Name | JSON type | Description                                                    |
|------------|-----------|----------------------------------------------------------------|
| type       | string    | Must be set to "subscribe"                                     |
| channel    | string    | Must be set to "orderbook"                                     |
| id         | string    | The market to subscribe to. e.g. WETH-DAI, WETH-USDC, DAI-USDC |

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

| Field Name | JSON type | Description                     |
|------------|-----------|---------------------------------|
| type       | string    | Must be set to "subscribe"      |
| channel    | string    | Must be set to "orders"         |
| id         | string    | The wallet address to listen to |

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

| Field Name | JSON type | Description                              |
|------------|-----------|------------------------------------------|
| type       | string    | Must be set to "unsubscribe"             |
| channel    | string    | The channel to unsubscribe from          |
| id         | string    | An id to unsubscribe from on the channel |

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

| Field Name | JSON type | Description                        |
|------------|-----------|------------------------------------|
| type       | string    | Must be set to "subscribe"         |
| channel    | string    | Must be set to "positions"         |
| id         | string    | The wallet address to subscribe to |

#### Initial Response

The initial response is an array of positions that are open.

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

#### Websocket updates message contents structure

| Field   | Description                                               |
|---------|-----------------------------------------------------------|
| pending | Whether the position is still waiting to be confirmed     |
| hash    | The transaction hash corresponding to the position        |
| uuid    | The unique identifier for the position                    |
| owner   | The account address                                       |
| number  | The account number                                        |
| market  | The market for this position eg `WETH-DAI`                |
| type    | The position type er: `ISOLATED_LONG` or `ISOLATED_SHORT` |
| status  | The position status eg: `OPEN`,  `CLOSED`                 |

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "positions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

| Field Name | JSON type | Description                                      |
|------------|-----------|--------------------------------------------------|
| type       | string    | Must be set to "unsubscribe"                     |
| channel    | string    | The channel to unsubscribe from i.e. "positions" |
| id         | string    | An id to unsubscribe from on the channel         |

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

| Field Name | JSON type | Description                        |
|------------|-----------|------------------------------------|
| type       | string    | Must be set to "subscribe"         |
| channel    | string    | Must be set to "standard_actions"  |
| id         | string    | The wallet address to subscribe to |

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

#### Websocket updates message contents structure

| Field           | Description                                                                                                      |
|-----------------|------------------------------------------------------------------------------------------------------------------|
| pending         | Whether the standard action is still waiting to be confirmed                                                     |
| hash            | The transaction hash corresponding to the standard action                                                        |
| standardAction  | The standardAction object                                                                                        |
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

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "standard_actions",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

| Field Name | JSON type | Description                              |
|------------|-----------|------------------------------------------|
| type       | string    | Must be set to "unsubscribe"             |
| channel    | string    | The channel to unsubscribe from          |
| id         | string    | An id to unsubscribe from on the channel |

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

| Field Name | JSON type | Description                        |
|------------|-----------|------------------------------------|
| type       | string    | Must be set to "subscribe"         |
| channel    | string    | Must be set to "balance_updates"   |
| id         | string    | The wallet address to subscribe to |

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

#### Websocket update message content structure

| Field          | Description                                                  |
|----------------|--------------------------------------------------------------|
| pending        | Whether the balance update is still waiting to be confirmed  |
| hash           | The transaction hash corresponding to the balance update     |
| balanceUpdate  | The balanceUpdate object                                     |
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

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "balance_updates",
  "id": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c"
}
```

| Field Name | JSON type | Description                              |
|------------|-----------|------------------------------------------|
| type       | string    | Must be set to "unsubscribe"             |
| channel    | string    | The channel to unsubscribe from          |
| id         | string    | An id to unsubscribe from on the channel |

### Trades

The trades channel allows clients to receive all trades for the market. This is the fastest way to receive trades made on the market.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "trades",
  "id": "DAI-USDC"
}
```

| Field Name | JSON type | Description                                                    |
|------------|-----------|----------------------------------------------------------------|
| type       | string    | Must be set to "subscribe"                                     |
| channel    | string    | Must be set to "trades"                                        |
| id         | string    | The market to subscribe to. e.g. WETH-DAI, WETH-USDC, DAI-USDC |

#### Initial Response

The initial response will contain the most recent 100 orders from the active market:

```json
{
  "type": "channel_data",
  "connection_id": "1de645c9-9ed2-49d0-9192-1522cf5c45f7",
  "message_id": 290,
  "channel": "trades",
  "id": "DAI-USDC",
  "contents": {
    "trades": [
      {
        "uuid": "f363d287-932e-4008-a688-fe62e9fac687",
        "createdAt": "2020-03-25T21:46:31.302Z",
        "transactionHash": "0x87bfd011dc8dcc43c512d19686d41ea9a56da3fc4cc332f245615f289d8702e0",
        "status": "PENDING",
        "market": "DAI-USDC",
        "side": "SELL",
        "price": "0.0000000000010226022495140206638887019651459949910297896178723973394978374208193",
        "amount": "957489517355305926656",
        "makerOrderId": "0xe5cdaa6dfea6e04d2f520d24b94d730b0de8cf58ee6e1e326bbdfe172b5f402a",
        "makerAccountOwner": "0x97ef7039309b938e2893d97ef75c0ceebccfbd55",
        "makerAccountNumber": "0",
        "takerOrderId": "0x8cd16a9964d83707d840cd6e26f54ab4ca425176f479d9fd1b8642fbc8f50a2c",
        "takerAccountOwner": "0x8ebab0129ffea1145a505d8d6d5d046770dd97e6",
        "takerAccountNumber": "0"
      },
      {
        "uuid": "f1909f3d-7d07-438a-8962-985083ad2e2d",
        "createdAt": "2020-03-25T21:46:31.294Z",
        "transactionHash": "0x87bfd011dc8dcc43c512d19686d41ea9a56da3fc4cc332f245615f289d8702e0",
        "status": "PENDING",
        "market": "DAI-USDC",
        "side": "SELL",
        "price": "0.0000000000010231",
        "amount": "2929446700000000081920",
        "makerOrderId": "0x5060c37571e2d243961623a8bc0d76fd63c46387ccf37241c4ee95a167e02e72",
        "makerAccountOwner": "0x97ef7039309b938e2893d97ef75c0ceebccfbd55",
        "makerAccountNumber": "0",
        "takerOrderId": "0x8cd16a9964d83707d840cd6e26f54ab4ca425176f479d9fd1b8642fbc8f50a2c",
        "takerAccountOwner": "0x8ebab0129ffea1145a505d8d6d5d046770dd97e6",
        "takerAccountNumber": "0"
      },
      {
        "uuid": "39c55c38-4829-4344-a723-dc44f867019d",
        "createdAt": "2020-03-25T21:46:31.290Z",
        "transactionHash": "0x87bfd011dc8dcc43c512d19686d41ea9a56da3fc4cc332f245615f289d8702e0",
        "status": "PENDING",
        "market": "DAI-USDC",
        "side": "SELL",
        "price": "0.0000000000010216",
        "amount": "1002063782644693991424",
        "makerOrderId": "0x289b2cb5ad4673beff2b1b8819a7a17df7d1ddfecde352cd53344343787bbaaf",
        "makerAccountOwner": "0x97ef7039309b938e2893d97ef75c0ceebccfbd55",
        "makerAccountNumber": "0",
        "takerOrderId": "0x8cd16a9964d83707d840cd6e26f54ab4ca425176f479d9fd1b8642fbc8f50a2c",
        "takerAccountOwner": "0x8ebab0129ffea1145a505d8d6d5d046770dd97e6",
        "takerAccountNumber": "0"
      },
    ],
  }
}
```

#### Updates

New trades are sent in array form.

A trade executed for the market:
```json
{
  "type": "channel_data",
  "connection_id": "0b88ebf2-98ec-4de6-b781-62e1648ae657",
  "message_id": 1277,
  "channel": "trades",
  "id": "DAI-USDC",
  "contents": {
    "updates": [
      {
        "uuid": "7cb4e283-20bf-4ccf-a15b-dc84b86965dd",
        "createdAt": "2020-03-25T21:46:23.351Z",
        "transactionHash": "0xe7cd5f4fafc05c707205d8090d9cd592a87daec3977c5d1c7f0953c68f562bf6",
        "status": "CONFIRMED",
        "market": "DAI-USDC",
        "side": "BUY",
        "price": "0.0000000000010245",
        "amount": "1024685243041289076736",
        "makerOrderId": "0x9bd33ad14caa817135dd92d062b449ffa477f75c4f28f85825e752148e22a96e",
        "makerAccountOwner": "0x97ef7039309b938e2893d97ef75c0ceebccfbd55",
        "makerAccountNumber": "0",
        "takerOrderId": "0x195a54220932ccb9416e9eba6189ffee4248b2e37b403f340982ba695c55a311",
        "takerAccountOwner": "0x97ef7039309b938e2893d97ef75c0ceebccfbd55",
        "takerAccountNumber": "0"
      }
    ]
  }
}
```

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "trades",
  "id": "DAI-USDC"
}
```

| Field Name | JSON type | Description                                 |
|------------|-----------|---------------------------------------------|
| type       | string    | Must be set to "unsubscribe"                |
| channel    | string    | The channel to unsubscribe from             |
| id         | string    | A market to unsubscribe from on the channel |

#### Response

Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "e7259ee2-98f5-4187-8623-9175234d5fb2",
  "message_id": 3,
  "channel": "trades",
  "id": "DAI-USDC"
}
```

### Perpetual Balance Updates

The perpetual balance updates channel allows clients to receive balance updates for the perpetual product for their account.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "perpetual_balance_updates",
  "id": "<account address>"
}
```

| Field Name | JSON type | Description                                                  |
|------------|-----------|--------------------------------------------------------------|
| type       | string    | Must be set to "subscribe"                                   |
| channel    | string    | Must be set to "perpetual_balance_updates"                   |
| id         | string    | The account address to receive perpetual balance updates for |

#### Initial Response

The initial response will contain the most recent 100 perpetual balance updates for the account:

```json
{
  "type": "subscribed",
  "connection_id": "5da13205-2f3a-41c8-9f4a-cb0e5aa72dd4",
  "message_id": 1,
  "channel": "perpetual_balance_updates",
  "id": "0x77A035b677D5A0900E4848Ae885103cD49af9633",
  "contents": {
    "balanceUpdates": [
      {
        "uuid": "3d7d6a8d-0202-4e40-ae2b-dff670efbbf9",
        "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
        "market": "PBTC-USDC",
        "deltaMargin": "-1741062",
        "newMargin": "40181034",
        "deltaPosition": "20000",
        "newPosition": "10000",
        "indexValue": "0.057858741951992068",
        "indexTimestamp": "1588271672",
        "isPendingBlock": false,
        "orderNumber": "997556200290002",
        "createdAt": "2020-05-03T02:53:41.421Z",
        "updatedAt": "2020-05-03T02:53:41.421Z"
      },
      {
        "uuid": "45bb37d9-f608-428a-9868-b1a9c1925e57",
        "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
        "market": "PBTC-USDC",
        "deltaMargin": "0",
        "newMargin": "41922096",
        "deltaPosition": "0",
        "newPosition": "-10000",
        "indexValue": "0.057858741951992068",
        "indexTimestamp": "1588271672",
        "isPendingBlock": false,
        "orderNumber": "997556200290000",
        "createdAt": "2020-05-03T02:53:41.419Z",
        "updatedAt": "2020-05-03T02:53:41.419Z"
      }
    ]
  }
}
```

#### Updates

New perpetual balance updates are sent in array form.

Example:

```json
{
  "type": "channel_data",
  "connection_id": "5a767699-aad6-425e-b18a-a96eb5711a1d",
  "message_id": 7,
  "channel": "perpetual_balance_updates",
  "id": "0x77a035b677d5a0900e4848ae885103cd49af9633",
  "contents": {
    "pending": true,
    "hash": "0xdcd230955f15d1c4747c36d0d094a6fb5c596ed3d43854d773f4a112a33bf7e6",
    "perpetualBalanceUpdate": {
      "uuid": "4bda3a11-f261-4dc8-ae40-7990541c7226",
      "owner": "0x77a035b677d5a0900e4848ae885103cd49af9633",
      "market": "PBTC-USDC",
      "deltaMargin": "2321",
      "newMargin": "129190281",
      "deltaPosition": "0",
      "newPosition": "-990000",
      "indexValue": "1.205724630104738866",
      "indexTimestamp": "1590092070",
      "isPendingBlock": true,
      "orderNumber": "1011133800340001",
      "updatedAt": "2020-05-21T20:14:52.626Z",
      "createdAt": "2020-05-21T20:14:52.626Z"
    }
  }
}
```

#### Websocket update message content structure

| Field          | Description                                                           |
|----------------|-----------------------------------------------------------------------|
| pending        | Whether the perpetual balance update is still waiting to be confirmed |
| hash           | The transaction hash corresponding to the perpetual balance update    |
| uuid           | The unique ID for the balance update.                                 |
| owner          | The wallet address of the user.                                       |
| market         | The perpetual market, e.g. `PBTC-USDC`.                               |
| deltaMargin    | The change in settlement token (e.g. USDC).                           |
| newMargin      | The new balance of settlement token (e.g. USDC).                      |
| deltaPosition  | The change in position token (e.g. PBTC).                             |
| newPosition    | The amount in position token (e.g. PBTC).                             |
| indexValue     | The new index value of the account.                                   |
| indexTimestamp | The timestamp for when the index value was set.                       |
| orderNumber    | Number used for ordering the balance updates.                         |
| isPendingBlock | Whether the specific balance update is pending or not                 |

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "perpetual_balance_updates",
  "id": "<the account address>"
}
```

| Field Name | JSON type | Description                                 |
|------------|-----------|---------------------------------------------|
| type       | string    | Must be set to "unsubscribe"                |
| channel    | string    | The channel to unsubscribe from             |
| id         | string    | A market to unsubscribe from on the channel |

#### Response

Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "6c9cfd91-d20e-4920-9545-70640876a677",
  "message_id": 1,
  "channel": "perpetual_balance_updates",
  "id": "0x77A035b677D5A0900E4848Ae885103cD49af9633"
}
```


### Perpetual Markets

The perpetual markets channel allows clients to updates about a particular market.

#### Subscribing

To subscribe send:

```json
{
  "type": "subscribe",
  "channel": "perpetual_markets",
  "id": "<market name>"
}
```

| Field Name | JSON type | Description                                       |
|------------|-----------|---------------------------------------------------|
| type       | string    | Must be set to "subscribe"                        |
| channel    | string    | Must be set to "perpetual_markets"                |
| id         | string    | The market to receive updates for eg: "PBTC-USDC" |

#### Initial Response

The initial response will contain the information for the specified market:

```json
{
  "type": "subscribed",
  "connection_id": "e0107276-e4dd-4b33-9cbf-7746f87b7799",
  "message_id": 1,
  "channel": "perpetual_markets",
  "id": "PBTC-USDC",
  "contents": {
    "market": {
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
      "updatedAt": "2020-05-21T20:46:35.941Z"
    }
  }
}
```
#### Updates

New perpetual market updates are sent to the channel:

Example:

```json
{
  "type": "channel_data",
  "connection_id": "e0107276-e4dd-4b33-9cbf-7746f87b7799",
  "message_id": 16,
  "channel": "perpetual_markets",
  "id": "PBTC-USDC",
  "contents": {
    "market": {
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
      "updatedAt": "2020-05-21T20:49:05.482Z"
    }
  }
}
```

#### Websocket update message content structure

| Field                | Description                                                                                        |
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

#### Unsubscribing

```json
{
  "type": "unsubscribe",
  "channel": "perpetual_markets",
  "id": "<the market name>"
}
```

| Field Name | JSON type | Description                                 |
|------------|-----------|---------------------------------------------|
| type       | string    | Must be set to "unsubscribe"                |
| channel    | string    | The channel to unsubscribe from             |
| id         | string    | A market to unsubscribe from on the channel |

#### Response

Once unsubscribed, clients will receive a message:
```json
{
  "type": "unsubscribed",
  "connection_id": "e0107276-e4dd-4b33-9cbf-7746f87b7799",
  "message_id": 27,
  "channel": "perpetual_markets",
  "id": "PBTC-USDC"
}
```
