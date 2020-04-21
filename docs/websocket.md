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

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "subscribe"|
|channel|string|Must be set to "trades"|
|id|string|The market to subscribe to. e.g. WETH-DAI, WETH-USDC, DAI-USDC|

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

|Field Name|JSON type|Description|
|----------|---------|-----------|
|type|string|Must be set to "unsubscribe"|
|channel|string|The channel to unsubscribe from|
|id|string|A market to unsubscribe from on the channel|

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
