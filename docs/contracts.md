# Contracts

<br>
<a href='https://github.com/dydxprotocol/solo' style="text-decoration:none;">
  <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fsolo-lightgrey' alt='GitHub'/>
</a>

## Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`SoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/SoloMargin.sol)|Main dYdX contract|[0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e](https://etherscan.io/address/0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e)|
|[`PayableProxyForSoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/PayableProxyForSoloMargin.sol)|WETH wrapper proxy|[0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76](https://etherscan.io/address/0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76)|
|[`PolynomialInterestSetter`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[0xaEE83ca85Ad63DFA04993adcd76CB2B3589eCa49](https://etherscan.io/address/0xaEE83ca85Ad63DFA04993adcd76CB2B3589eCa49)|
|[`Expiry`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/Expiry.sol)|Handles account expiries|[0x0ECE224FBC24D40B446c6a94a142dc41fAe76f2d](https://etherscan.io/address/0x0ECE224FBC24D40B446c6a94a142dc41fAe76f2d)|
|[`ExpiryV2`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/ExpiryV2.sol)|Handles account expiries (version 2)|[0x739A1DF6725657f6a16dC2d5519DC36FD7911A12](https://etherscan.io/address/0x739A1DF6725657f6a16dC2d5519DC36FD7911A12)|
|[`DaiPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/DaiPriceOracle.sol)|Price oracle for DAI|[0x787F552BDC17332c98aA360748884513e3cB401a](https://etherscan.io/address/0x787F552BDC17332c98aA360748884513e3cB401a)|
|[`WethPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/WethPriceOracle.sol)|Price oracle for WETH|[0xf61AE328463CD997C7b58e7045CdC613e1cFdb69](https://etherscan.io/address/0xf61AE328463CD997C7b58e7045CdC613e1cFdb69)|
|[`UsdcPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/UsdcPriceOracle.sol)|Price oracle for USDC|[0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60](https://etherscan.io/address/0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60)|
|[`AdminImpl`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/impl/AdminImpl.sol)|SoloMargin library containing admin functions|[0x8a6629fEba4196E0A61B8E8C94D4905e525bc055](https://etherscan.io/address/0x8a6629fEba4196E0A61B8E8C94D4905e525bc055)|
|[`OperationImpl`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/impl/OperationImpl.sol)|SoloMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1)|
|[`LiquidatorProxyV1ForSoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/LiquidatorProxyV1ForSoloMargin.sol)|Proxy contract for liquidating other accounts|[0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686](https://etherscan.io/address/0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686)|
|[`LimitOrders`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/LimitOrders.sol)|Contract for making limit orders using dYdX funds|[0xDEf136D9884528e1EB302f39457af0E4d3AD24EB](https://etherscan.io/address/0xDEf136D9884528e1EB302f39457af0E4d3AD24EB)|
|[`SignedOperationProxy`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[0x2a842bC64343FAD4Ec4a8424ba7ff3c0A70b6e55](https://etherscan.io/address/0x2a842bC64343FAD4Ec4a8424ba7ff3c0A70b6e55)|
|[`Refunder`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/Refunder.sol)|Allows sending of funds to other accounts|[0x7454dF5d0758D4E7A538c3aCF4841FA9137F0f74](https://etherscan.io/address/0x7454dF5d0758D4E7A538c3aCF4841FA9137F0f74)|
