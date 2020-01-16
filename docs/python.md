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
    market=['WETH-DAI', 'DAI-USDC'],
    status=['OPEN', 'PARTIALLY_FILLED'],
    limit=None,
    startingBefore=None
)

# Get all orders for both sides of the book
ten_days_ago = datetime.datetime.now() - datetime.timedelta(days=10)
all_orders = client.get_orders(
    market=['WETH-DAI', 'DAI-USDC'],
    accountOwner=None,  # optional
    accountNumber=None,  # optional
    limit=2,  # optional
    startingBefore=ten_days_ago  # optional
)
'''
orders = {
    "orders":  [
    {
      "uuid": "38e8f1e3-22f3-41bc-ad0d-f00779b3474d",
      "id": "0x925f077fafa35a10616e10d5c0ca5862b77545d678b811f114ea7ca40730edec",
      "createdAt": "2020-01-10T01:44:40.139Z",
      "status": "CANCELED",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": true,
      "market": "WETH-DAI",
      "side": "SELL",
      "baseAmount": "100000000000000000",
      "quoteAmount": "13000000000000000000",
      "filledAmount": "0",
      "price": "130",
      "cancelReason": "POST_ONLY_WOULD_CROSS"
    },
    {
      "uuid": "80e052b9-0b33-4f8e-8e9a-0d6a712651fe",
      "id": "0x517d54f84b031ab7875cee494d12f268f0d97e5c9ca3a92b11c1c0c01afa11b6",
      "createdAt": "2020-01-10T01:44:20.268Z",
      "status": "CANCELED",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "orderType": "LIMIT",
      "fillOrKill": false,
      "postOnly": true,
      "market": "WETH-DAI",
      "side": "BUY",
      "baseAmount": "100000000000000000",
      "quoteAmount": "30000000000000000000",
      "filledAmount": "0",
      "price": "300",
      "cancelReason": "POST_ONLY_WOULD_CROSS"
    }
  ]
}
'''
```

#### Fills

```python
# Get fills created by my account for both sides of the orderbook
my_fills = client.get_my_fills(
    market=['WETH-DAI', 'DAI-USDC'],
    limit=None,  # optional
    startingBefore=None  # optional
)

# Get all fills from one side of the book
all_fills = client.get_fills(
    market=['WETH-DAI'], # 'DAI-WETH' side of the book is not included
    accountOwner='0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8',  # optional
    accountNumber=0,  # optional
    limit=2,  # optional
    startingBefore=None  # optional
)
'''
fills = {
    "fills":  [
    {
      "uuid": "9424d197-77a9-470a-b1d8-51eac46e4eff",
      "createdAt": "2020-01-10T01:26:06.479Z",
      "transactionHash": "0x4e562fefc4afae2dde672a8bba99345204ab1c7673b936e3a3551c8db2c6110e",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "SELL",
      "price": "136.75999999999997979",
      "amount": "100000000000000000",
      "orderId": "0x53c49cdad5a2212fa6d2cf21fe1ad9e7cf593d6451e73e1b6bf7f4fd5d957f58",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "liquidity": "TAKER"
    },
    {
      "uuid": "cad05563-727f-4ba4-b4d8-af871ab1c268",
      "createdAt": "2020-01-10T01:24:37.624Z",
      "transactionHash": "0x4bace650b6a99d48b252248c4e36f749e6d4ff5def83edbc79509dfb7377062c",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "BUY",
      "price": "137",
      "amount": "100000000000000000",
      "orderId": "0x56def376f5bf8c71802ba20f61af81bd019666004d622d762835c129cffafbae",
      "accountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "accountNumber": "0",
      "liquidity": "TAKER"
    },
    ...
    {
     ...
    }
  ]
}
'''

# Get one order by id
order = client.get_order(
	orderId,
)
'''
order = {
	"order" {
        "uuid": "01fa13e7-7dd4-47b8-aa8f-18da03e79ae6",
        "id": "0x5cf9718b4249920cce098b84315e308b0df653e8d28e0faae66b2e203b7f57ac",
        "createdAt": "2020-01-14T01:35:28.777Z",
        "status": "OPEN",
        "accountOwner": "0x000f7f22bfc28d940d4b68e13213ab17cf107790",
        "accountNumber": "0",
        "orderType": "LIMIT",
        "fillOrKill": false,
        "postOnly": null,
        "market": "WETH-DAI",
        "side": "BUY",
        "baseAmount": "224486720153652396032",
        "quoteAmount": "32773242800000001376256",
        "filledAmount": "0",
        "price": "145.99189999999998280518269339952438385515119545355521071773019312867197400928415149",
        "cancelReason": null
  }
}
}
'''
```

#### Trades

```python
# Get trades created by my account for both sides of the orderbook
my_trades = client.get_my_trades(
    market=['WETH-DAI', 'DAI-USDC'],
    limit=None,  # optional
    startingBefore=None  # optional
)

# Get all trades from one side of the book
all_trades = client.get_trades(
    market=['WETH-DAI'], # 'DAI-WETH' side of the book is not included
    accountOwner='0x5F5A46a8471F60b1E9F2eD0b8fc21Ba8b48887D8',  # optional
    accountNumber=0,  # optional
    limit=2,  # optional
    startingBefore=None  # optional
)
'''
trades = {
  "trades": [
    {
      "uuid": "28c09723-a304-480b-9109-c5921bee44c2",
      "createdAt": "2020-01-10T01:26:06.478Z",
      "transactionHash": "0x4e562fefc4afae2dde672a8bba99345204ab1c7673b936e3a3551c8db2c6110e",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "SELL",
      "price": "136.75999999999997979",
      "amount": "100000000000000000",
      "makerOrderId": "0x9d388f67f4453a7bbaaef7fcee66e0ce1446e76077c0d77499992d6a2e0364f3",
      "makerAccountOwner": "0x862821badb9c5800654015ba9a2d9d7894c83a7a",
      "makerAccountNumber": "0",
      "takerOrderId": "0x53c49cdad5a2212fa6d2cf21fe1ad9e7cf593d6451e73e1b6bf7f4fd5d957f58",
      "takerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "takerAccountNumber": "0"
    },
    {
      "uuid": "c202240d-8c02-465e-a39e-c82ac1d07549",
      "createdAt": "2020-01-10T01:24:37.623Z",
      "transactionHash": "0x4bace650b6a99d48b252248c4e36f749e6d4ff5def83edbc79509dfb7377062c",
      "status": "CONFIRMED",
      "market": "WETH-DAI",
      "side": "BUY",
      "price": "137",
      "amount": "100000000000000000",
      "makerOrderId": "0x307b9d2938b4ea115c04c149000fb4548bb95b571a9270a3f8802adade9cbe62",
      "makerAccountOwner": "0x6c4952a4aa6db823fba3b30d0fad85683dc90ee1",
      "makerAccountNumber": "0",
      "takerOrderId": "0x56def376f5bf8c71802ba20f61af81bd019666004d622d762835c129cffafbae",
      "takerAccountOwner": "0x5f5a46a8471f60b1e9f2ed0b8fc21ba8b48887d8",
      "takerAccountNumber": "0"
    }
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
