# Smart Contracts

## DolomiteMargin

<a href='https://github.com/dolomite-exchange/dolomite-margin' style="text-decoration:none;">
  <img src='https://img.shields.io/badge/GitHub-dolomite--exchange%2Fdolomite--margin-lightgrey' alt='GitHub'/>
</a>

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`DolomiteMargin`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/DolomiteMargin.sol)|Main DolomiteMargin contract. Serves as the entry point for most read / write functions|[0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e](https://etherscan.io/address/)|
|[`PayableProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol)|WETH wrapper proxy|[0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76](https://etherscan.io/address/)|
|[`PolynomialInterestSetter`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[0xaEE83ca85Ad63DFA04993adcd76CB2B3589eCa49](https://etherscan.io/address/)|
|[`Expiry`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/Expiry.sol)|Handles account expiration for borrowed markets|[0x739A1DF6725657f6a16dC2d5519DC36FD7911A12](https://etherscan.io/address/)|
|[`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)|Price oracle for USDC|[0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60](https://etherscan.io/address/)|
|[`AdminImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/AdminImpl.sol)|DolomiteMargin library containing admin functions|[0x8a6629fEba4196E0A61B8E8C94D4905e525bc055](https://etherscan.io/address/)|
|[`OperationImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/OperationImpl.sol)|DolomiteMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/)|
|[`LiquidateOrVaporizeImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/LiquidateOrVaporizeImpl.sol)|DolomiteMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/)|
|[`LiquidatorProxyV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1.sol)|Proxy contract for liquidating other accounts|[0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686](https://etherscan.io/address/)|
|[`SignedOperationProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[0x2a842bC64343FAD4Ec4a8424ba7ff3c0A70b6e55](https://etherscan.io/address/)|