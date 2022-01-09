# Smart Contracts

## DolomiteMargin

<a href='https://github.com/dolomite-exchange/dolomite-margin' style="text-decoration:none;">
  <img src='https://img.shields.io/badge/GitHub-dolomite--exchange%2Fdolomite--margin-lightgrey' alt='GitHub'/>
</a>

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`DolomiteMargin`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/DolomiteMargin.sol)|Main DolomiteMargin contract. Serves as the entry point for most read / write functions|[0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e](https://etherscan.io/address/0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e)|
|[`PayableProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol)|WETH wrapper proxy|[0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76](https://etherscan.io/address/0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76)|
|[`PolynomialInterestSetter`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[0xaEE83ca85Ad63DFA04993adcd76CB2B3589eCa49](https://etherscan.io/address/0xaEE83ca85Ad63DFA04993adcd76CB2B3589eCa49)|
|[`Expiry`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/Expiry.sol)|Handles account expiration for borrowed markets|[0x739A1DF6725657f6a16dC2d5519DC36FD7911A12](https://etherscan.io/address/0x739A1DF6725657f6a16dC2d5519DC36FD7911A12)|
|[`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)|Price oracle for USDC|[0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60](https://etherscan.io/address/0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60)|
|[`AdminImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/AdminImpl.sol)|DolomiteMargin library containing admin functions|[0x8a6629fEba4196E0A61B8E8C94D4905e525bc055](https://etherscan.io/address/0x8a6629fEba4196E0A61B8E8C94D4905e525bc055)|
|[`OperationImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/OperationImpl.sol)|DolomiteMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1)|
|[`LiquidateOrVaporizeImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/LiquidateOrVaporizeImpl.sol)|DolomiteMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1)|
|[`LiquidatorProxyV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1.sol)|Proxy contract for liquidating other accounts|[0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686](https://etherscan.io/address/0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686)|
|[`SignedOperationProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[0x2a842bC64343FAD4Ec4a8424ba7ff3c0A70b6e55](https://etherscan.io/address/0x2a842bC64343FAD4Ec4a8424ba7ff3c0A70b6e55)|

## Perpetual

<a href='https://github.com/dydxprotocol/perpetual' style="text-decoration:none;">
  <img src='https://img.shields.io/badge/GitHub-dydxprotocol%2Fperpetual-lightgrey' alt='GitHub'/>
</a>

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`PerpetualProxy`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/PerpetualProxy.sol)|Proxy contract and entrypoint for the core protocol|[0x07aBe965500A49370D331eCD613c7AC47dD6e547](https://etherscan.io/address/0x07aBe965500A49370D331eCD613c7AC47dD6e547)|
|[`PerpetualV1`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/PerpetualV1.sol)|Upgradeable logic contract for the core protocol|[0x364508A5cA0538d8119D3BF40A284635686C98c4](https://etherscan.io/address/0x364508A5cA0538d8119D3BF40A284635686C98c4)|
|[`P1FundingOracle`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/oracles/P1FundingOracle.sol)|Funding rate oracle|[0x4525D2B71f7f018c9EBddFcD336852A85404e75B](https://etherscan.io/address/0x4525D2B71f7f018c9EBddFcD336852A85404e75B)|
|[`P1MakerOracle`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/oracles/P1MakerOracle.sol)|Price oracle|[0x538038E526517680735568f9C5342c6E68bbDA12](https://etherscan.io/address/0x538038E526517680735568f9C5342c6E68bbDA12)|
|[`P1Orders`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/traders/P1Orders.sol)|Trader contract for limit and stop-limit orders|[0x3ea6F88eC8F7b24Bb3Ad206fa80124210e8e28F3](https://etherscan.io/address/0x3ea6F88eC8F7b24Bb3Ad206fa80124210e8e28F3)|
|[`P1Liquidation`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/traders/P1Liquidation.sol)|Trader contract for liquidations|[0x9C6C96727d1Cf2F183a8ef77E274621F26D728f8](https://etherscan.io/address/0x9C6C96727d1Cf2F183a8ef77E274621F26D728f8)|
|[`P1Deleveraging`](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/traders/P1Deleveraging.sol)|Trader contract for deleveraging|[0x1F8b4f89a5b8CA0BAa0eDbd0d928DD68B3357280](https://etherscan.io/address/0x1F8b4f89a5b8CA0BAa0eDbd0d928DD68B3357280)|
