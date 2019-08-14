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
from dydx-python.dydx.client import Client

# create a new client with a private key (string or bytearray)
client = Client('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d')

# get all trading pairs for dydx
trading_pairs = client.get_pairs()

# ...
```
