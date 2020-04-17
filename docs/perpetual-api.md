# Perpetual API

# MARKETS

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

# Balance Updates

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

# Perpetual Standard Actions

### GET /v1/standard-actions
This is the same as the existing standard actions endpoint.

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

# ACCOUNTS

### GET /v1/perpetual-accounts
This will return all the perpetual accounts in the database.

Query Params:

|Field Name|Description|
|----------|-----------|
|isLiquidatable|if set to true, returns all accounts that are at risk of under-collateralization|

Example Response Body:

```json
[
  {
    "owner": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc3",
    "balances": {
      "PBTC-USDC": {
        "margin": "120000",
        "position": "20",
        "indexValue": "6000000000000000000000",
        "indexTimestamp": "1585933964",
        "cachedMargin": "11997",
      }
    }
  },
  {
    "owner": "0x014be43bf2d72a7a151a761a1bd5224f7ad4973c",
    "balances": {
      "PBTC-USDC": {
        "margin": "-60000",
        "position": "-10",
        "indexValue": "6000000000000000000000",
        "indexTimestamp": "1585933964",
        "cachedMargin": "-5976",
      }
    }
  }
]
```

### Accounts Response Object

|Field Name|Description|
|----------|-----------|
|owner|The user's wallet address|
|uuid|The identifier for the user's account|
|balances|An object with the user's balances for each market|
|margin|The balance in settlement token (eg USDC)|
|position|The amount in position token (e.g. PBTC)|

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
