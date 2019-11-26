# WebSocket API
dYdX offers a WebSocket API for streaming updates to dYdX.

You can connect to the WebSocket at `wss://api.dydx.exchange/ws`

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

#### Subscribing

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
|channel|string|The channel to connect to|
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

The initial response will contain the entire state of the active orderbook. The `contents` field will be of the same form as `GET /v1/orderbook/:market`(https://docs.dydx.exchange/#/api?id=get-v1orderbookmarket):

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
