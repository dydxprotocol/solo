# Python Client

<br>
<a href='https://github.com/dydxprotocol/dydx-python'>
  <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fdydx--python-lightgrey' alt='GitHub'/>
</a>
<br>
<a href='https://pypi.org/project/dydx-python'>
  <img src='https://img.shields.io/pypi/v/dydx-python.svg' alt='PyPi'/>
</a>

A python library for interacting with the Limit Order API.

The library is currently tested against Python versions 2.7, 3.4, 3.5, and 3.6

## Install
Install with `pip`:
```
pip install dydx-python
```

## Example Usage

```python
from dydx.client import Client

# create a new client with a private key (string or bytearray)
client = Client(
    private_key='0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    node='https://parity.expotrading.com'
)

# -----------------------------------------------------------
# API Calls
# -----------------------------------------------------------

# get all trading pairs for dydx
trading_pairs = client.get_pairs()

# ...

# -----------------------------------------------------------
# Ethereum Transactions
# -----------------------------------------------------------

# Enable Limit Orders
# must be called once, ever (only necessary during beta testing)
tx_hash = client.enable_limit_orders()

# deposit 10 ETH
# does not require set_allowance
tx_hash = client.deposit(market=0, wei=(10 * 1e18)) # ETH has 18 decimal places

# deposit 100 DAI
tx_hash = client.set_allowance(market=1) # must only be called once, ever
tx_hash = client.deposit(market=1, wei=(100 * 1e18)) # DAI has 18 decimal places

# deposit 100 USDC
tx_hash = client.set_allowance(market=2) # must only be called once, ever
tx_hash = client.deposit(market=2, wei=(100 * 1e6)) # USDC has 6 decimal places

# withdraw 50 USDC
tx_hash = client.withdraw(market=2, wei=(100 * 1e6)) # USDC has 6 decimal places

# withdraw all DAI (including interest)
tx_hash = client.withdraw_to_zero(market=1)
```
