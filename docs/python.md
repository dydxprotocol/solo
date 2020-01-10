# Python Client

<br>
<div style="display:flex;">
  <a href='https://github.com/dydxprotocol/dydx-python' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fdydx--python-lightgrey' alt='GitHub'/>
  </a>
  <br>
  <a href='https://pypi.org/project/dydx-python' style="text-decoration:none;padding-left:5px;">
    <img src='https://img.shields.io/pypi/v/dydx-python.svg' alt='PyPi'/>
  </a>
</div>

dYdX Python API for Limit Orders

The library is currently tested against Python versions 2.7, 3.4, 3.5, and 3.6

## Installation
`dydx-python` is available on [PyPI](https://pypi.org/project/dydx-python). Install with `pip`:
```
pip install dydx-python
```

## Documentation

Check the [dYdX developer docs](https://docs.dydx.exchange/#/api?id=orderbook) for the API endpoint.

## Example Usage

### Initializing the client

```python
from dydx.client import Client
import dydx.constants as consts
import dydx.util as utils

# create a new client with a private key (string or bytearray)
client = Client(
    private_key='0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    node='https://parity.expotrading.com'
)
```

### HTTP API Calls

#### Trading Pairs

```python
# Get all trading pairs for dydx
pairs = client.get_pairs()
'''
pairs = {
    "pairs": [
        {
            "uuid": "83b69358-a05e-4048-bc11-204da54a8b19",
            "name": "DAI-WETH",
            "makerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
            "takerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
            "makerCurrency": {
                "symbol": "DAI",
                "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                "decimals": 18,
                "soloMarket": 1,
            },
            "takerCurrency": {
                "symbol": "WETH",
                "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "decimals": 18,
                "soloMarket": 0,
                ...
            },
            ...
        },
        {
            "uuid": "5a40f128-ced5-4947-ab10-2f5afee8e56b",
            "name": "WETH-DAI",
            "makerCurrencyUuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
            "takerCurrencyUuid": "b656c441-68ab-4776-927c-d894f4d6483b",
            "makerCurrency": {
                "uuid": "84298577-6a82-4057-8523-27b05d3f5b8c",
                "symbol": "WETH",
                "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "decimals": 18,
                "soloMarket": 0,
                ...
            },
            "takerCurrency": {
                "uuid": "b656c441-68ab-4776-927c-d894f4d6483b",
                "symbol": "DAI",
                "contractAddress": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                "decimals": 18,
                "soloMarket": 1,
                ...
            },
            ...
        }
    ]
}
'''
```

#### Account Balances

```python
# Get my on-chain balances
my_balances = client.get_my_balances()

# Get on-chain balances of another account
balances = client.get_balances(
    address='0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    number=0
)

'''
balances = {
    "owner": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "number": "0",
    "uuid": "0db94de2-a77c-4e81-b6e5-677032344186",
    "balances": {
        "0": {
            "wei": "20000000893540864.968618118602975666",
            "expiresAt": null,
            "par": "19988408759132898",
            ...
        },
        "1": {
            "wei": "3000092108605235003.982412750027831584",
            "expiresAt": null,
            "par": "2895154605310571808",
            ...
        },
        "2": {
            "par": 0,
            "wei": "0",
            "expiresAt": null,
            ...
        }
    }
}
'''
```

#### Open Orders

```python
# Get orders created by my account for both sides of the book
my_orders = client.get_my_orders(
    pairs=['WETH-DAI', 'DAI-WETH'],
    status=['OPEN', 'PARTIALLY_FILLED'],
    limit=None,
    startingBefore=None
)

# Get all orders for both sides of the book
ten_days_ago = datetime.datetime.now() - datetime.timedelta(days=10)
all_orders = client.get_orders(
    pairs=['WETH-DAI', 'DAI-WETH'],
    makerAccountOwner=None,  # optional
    makerAccountNumber=None,  # optional
    limit=2,  # optional
    startingBefore=ten_days_ago  # optional
)
'''
orders = {
    "orders": [
        {
            "uuid": "6c2d9196-8b18-4749-9c80-3a40135ce325",
            "id": "0x1bd537b8ccfa22c4d37e33062a5d88996819720b4748be5bd621c38f34d59708",
            "makerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
            "makerAccountNumber": "0",
            "status": "OPEN",
            "price": "0.01",
            "fillOrKill": false,
            "postOnly": false,
            "rawData": "...",
            "makerAmount": "10000000000000000000",
            "unfillableAt": null,
            "expiresAt": "2019-09-16T21:34:38.000Z",
            "unfillableReason": null,
            "takerAmount": "100000000000000000",
            "makerAmountRemaining": "10000000000000000000",
            "orderType": "dydexLimitV1",
            "takerAmountRemaining": "100000000000000000",
            "createdAt": "2019-08-19T21:34:41.626Z",
            "pairUuid": "83b69358-a05e-4048-bc11-204da54a8b19",
            "pair": {
                "name": "DAI-WETH",
                ...
            },
            "fills": []
        },
        { ... }
    ]
}
'''
```

#### Historical Fills

```python
# Get fills created by my account for both sides of the orderbook
my_fills = client.get_my_fills(
    pairs=['WETH-DAI', 'DAI-WETH'],
    limit=None,  # optional
    startingBefore=None  # optional
)

# Get all fills from one side of the book
all_fills = client.get_fills(
    pairs=['WETH-DAI'], # 'DAI-WETH' side of the book is not included
    makerAccountOwner='0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8',  # optional
    makerAccountNumber=0,  # optional
    limit=2,  # optional
    startingBefore=None  # optional
)
'''
fills = {
    "fills": [
        {
            "uuid": "29c11f80-3ccc-42f7-bc50-4bbebf1e4974",
            "messageId": "f911b6da-fc4c-474e-bd2d-d00bb9b6c14d",
            "status": "CONFIRMED",
            "orderId": "0x692160665bf33f072fe9f54103c171ef1572a0d067b4378f373072c8c5450d7d",
            "transactionSender": "0xf809e07870dca762b9536d61a4fbef1a17178092",
            "transactionNonce": "766",
            "transactionHash": "0x2a2923a6343a2aa7a454e0453ce824dbdd99679eaa6e1670c40314ed7d3472e6",
            "fillAmount": "100000000000000000",
            "createdAt": "2019-08-19T21:38:48.586Z",
            "order": {
                "uuid": "8e74f27e-d622-4e75-bddf-77640116bc93",
                "id": "0x692160665bf33f072fe9f54103c171ef1572a0d067b4378f373072c8c5450d7d",
                "makerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
                "makerAccountNumber": "0",
                "status": "OPEN",
                "price": "191.5",
                "fillOrKill": false,
                "postOnly": false,
                "rawData": "...",
                "makerAmount": "120000000000000000",
                "unfillableAt": "2019-08-19T23:53:19.627Z",
                "expiresAt": "2019-09-12T23:45:24.000Z",
                "unfillableReason": "USER_CANCELED",
                "takerAmount": "22980000000000000000",
                "makerAmountRemaining": "15500000000000000",
                "orderType": "dydexLimitV1",
                "takerAmountRemaining": "2968250000000000000",
                "createdAt": "2019-08-15T23:45:26.564Z",
                "pairUuid": "5a40f128-ced5-4947-ab10-2f5afee8e56b",
                "pair": {
                    "name": "WETH-DAI",
                    ...
                }
            }
        },
        {
            ...
        }
        ...
    ]
}
'''

# Get one order by id
order = client.get_order(
	orderId,
)
'''
order = {
	order = {
		"uuid": "6c2d9196-8b18-4749-9c80-3a40135ce325",
		"id": "0x1bd537b8ccfa22c4d37e33062a5d88996819720b4748be5bd621c38f34d59708",
		"makerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
		"makerAccountNumber": "0",
		"status": "OPEN",
		"price": "0.01",
		"fillOrKill": false,
        "postOnly": false,
		"rawData": "...",
		"makerAmount": "10000000000000000000",
		"unfillableAt": null,
		"expiresAt": "2019-09-16T21:34:38.000Z",
		"unfillableReason": null,
		"takerAmount": "100000000000000000",
		"makerAmountRemaining": "10000000000000000000",
		"orderType": "dydexLimitV1",
		"takerAmountRemaining": "100000000000000000",
		"createdAt": "2019-08-19T21:34:41.626Z",
		"pairUuid": "83b69358-a05e-4048-bc11-204da54a8b19",
		"pair": {
			"name": "DAI-WETH",
			...
		},
		"fills": []
	}
}
'''
```

#### Historical Trades

```python
# Get trades created by my account for both sides of the orderbook
my_trades = client.get_my_trades(
    pairs=['WETH-DAI', 'DAI-WETH'],
    limit=None,  # optional
    startingBefore=None  # optional
)

# Get all trades from one side of the book
all_trades = client.get_trades(
    pairs=['WETH-DAI'], # 'DAI-WETH' side of the book is not included
    makerAccountOwner='0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8',  # optional
    makerAccountNumber=0,  # optional
    limit=2,  # optional
    startingBefore=None  # optional
)
'''
trades = {
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
                "postOnly": false,
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
                "postOnly": false,
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
        },
        {
            ...
        }
        ...
    ]
}
'''
```

#### Create an Order

```python
# Create order to SELL 10 ETH for 2000 DAI (a price of 200 DAI/ETH)
created_order = client.create_order(
    makerMarket=consts.MARKET_WETH,
    takerMarket=consts.MARKET_DAI,
    makerAmount=utils.token_to_wei(10, consts.MARKET_WETH),
    takerAmount=utils.token_to_wei(2000, consts.MARKET_DAI)
)
'''
created_order = {
    "order": {
        "uuid": "c85fc2f9-8aba-4302-bac8-c0fafb4b5e9c",
        "id": "0x28676bc8f3b3ba651ccc928004f0fe315399a157bf57fd7e36188f7bc6172736",
        "makerAccountOwner": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        "makerAccountNumber": "0",
        "status": "PENDING",
        "price": "200",
        "fillOrKill": false,
        "postOnly": false,
        "orderType": "dydexLimitV1",
        "makerAmount": "10000000000000000",
        "makerAmountRemaining": "10000000000000000",
        "takerAmount": "2000000000000000000",
        "takerAmountRemaining": "2000000000000000000",
        "expiresAt": "2019-09-17T01:07:21.000Z",
        "unfillableAt": null,
        "unfillableReason": null,
        "pair": {
            "name": "WETH-DAI",
            ...
        },
        ...
    }
}
'''
```

#### Cancel an Order

```python
# Cancel the previously created order
order_hash = created_order['order']['id']
canceled_order = client.cancel_order(
    hash=order_hash
)
'''
canceled_order = {
    "order": {
        "uuid": "16746923-10e4-4d30-92d9-1d1b16b52009",
        "id": "0xbee3de265bed729a7b67a0393277508f89a58cb14c7789fbb826532fb93b2eaf",
        "makerAccountOwner": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        "makerAccountNumber": "0",
        "status": "OPEN",
        "price": "200",
        "fillOrKill": false,
        "postOnly": false,
        "orderType": "dydexLimitV1",
        "makerAmount": "10000000000000000",
        "makerAmountRemaining": "10000000000000000",
        "takerAmount": "2000000000000000000",
        "takerAmountRemaining": "2000000000000000000",
        "expiresAt": "2019-09-17T01:09:55.000Z",
        "unfillableAt": null,
        "unfillableReason": null,
        "pair": {
            "name": "WETH-DAI",
            ...
        },
        ...
    }
}
'''
```

#### Get Orderbook

```python
orderbook = client.get_orderbook(
    market='WETH-DAI'
)
'''
orderbook = {
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
'''
```

### Ethereum Transactions

```python
# deposit 10 ETH
# does not require set_allowance
tx_hash = client.eth.deposit(
  market=consts.MARKET_WETH,
  wei=utils.token_to_wei(10, consts.MARKET_WETH)
)
receipt = client.eth.get_receipt(tx_hash)


# deposit 100 DAI
tx_hash = client.eth.set_allowance(market=consts.MARKET_DAI) # must only be called once, ever
receipt = client.eth.get_receipt(tx_hash)

tx_hash = client.eth.deposit(
  market=consts.MARKET_DAI,
  wei=utils.token_to_wei(100, consts.MARKET_DAI)
)
receipt = client.eth.get_receipt(tx_hash)


# deposit 100 USDC
tx_hash = client.eth.set_allowance(market=consts.MARKET_USDC) # must only be called once, ever
receipt = client.eth.get_receipt(tx_hash)

tx_hash = client.eth.deposit(
  market=consts.MARKET_USDC,
  wei=utils.token_to_wei(100, consts.MARKET_USDC)
)
receipt = client.eth.get_receipt(tx_hash)


# withdraw 50 USDC
tx_hash = client.eth.withdraw(
  market=consts.MARKET_USDC,
  wei=utils.token_to_wei(50, consts.MARKET_USDC)
)
receipt = client.eth.get_receipt(tx_hash)


# withdraw all DAI (including interest)
tx_hash = client.eth.withdraw_to_zero(market=consts.MARKET_DAI)
receipt = client.eth.get_receipt(tx_hash)
```

### Ethereum Getters

Getting information directly from the blockchain by querying a node

```python
# get the USD value of one atomic unit of DAI
dai_price = client.eth.get_oracle_price(consts.MARKET_DAI)

# get dYdX balances
balances = client.eth.get_my_balances()
'''
balances = [
  -91971743707894,
  3741715702031854553560,
  2613206278
]
'''

# get Wallet balances
balance = client.eth.get_my_wallet_balance(consts.MARKET_DAI)
'''
balance = 1000000000000000000
'''

# get dYdX account collateralization
collateralization = client.eth.get_my_collateralization()
'''
collateralization = 2.5 or float('inf')
'''

# collateralization must remain above the minimum to prevent liquidation
assert(collateralization > consts.MINIMUM_COLLATERALIZATION)
'''
consts.MINIMUM_COLLATERALIZATION = 1.15
'''
```

## Testing
```
# Install the requirements
pip install -r requirements.txt

# Run the tests
docker-compose up
tox
```
