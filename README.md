<p align="center"><img src="https://s3.amazonaws.com/dydx-assets/logo_large_white.png" width="256" /></p>

<div align="center">
  <a href="https://circleci.com/gh/dydxprotocol/workflows/solo/tree/master" style="text-decoration:none;">
    <img src="https://img.shields.io/circleci/project/github/dydxprotocol/solo.svg" alt='CI' />
  </a>
  <a href='https://www.npmjs.com/package/@dydxprotocol/solo' style="text-decoration:none;">
    <img src='https://img.shields.io/npm/v/@dydxprotocol/solo.svg' alt='NPM' />
  </a>
  <a href='https://coveralls.io/github/dydxprotocol/solo' style="text-decoration:none;">
    <img src='https://coveralls.io/repos/github/dydxprotocol/solo/badge.svg?t=toKMwT' alt='Coverage Status' />
  </a>
  <a href='https://github.com/dydxprotocol/solo/blob/master/LICENSE' style="text-decoration:none;">
    <img src='https://img.shields.io/github/license/dydxprotocol/protocol.svg?longCache=true' alt='License' />
  </a>
  <a href='https://t.me/joinchat/GBnMlBb9mQblQck2pThTgw' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/chat-on%20telegram-9cf.svg?longCache=true' alt='Telegram' />
  </a>
</div>

> Ethereum Smart Contracts and TypeScript library used for the dYdX Solo Trading Protocol. Currently used by [trade.dydx.exchange](https://trade.dydx.exchange)

**Full Documentation at [docs.dydx.exchange](https://docs.dydx.exchange)**

## Table of Contents

 - [Documentation](#documentation)
 - [Install](#install)
 - [Contracts](#contracts)
 - [Security](#security)
 - [Development](#development)
 - [Maintainers](#maintainers)
 - [Contributing](#contributing)
 - [License](#license)

## Documentation

Check out our full documentation at [docs.dydx.exchange](https://docs.dydx.exchange)

## Install

`npm i -s @dydxprotocol/solo`

## Contracts

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`SoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/SoloMargin.sol)|Main dYdX contract|[0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e](https://etherscan.io/address/0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e)|
|[`PayableProxyForSoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/PayableProxyForSoloMargin.sol)|WETH wrapper proxy|[0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76](https://etherscan.io/address/0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76)|
|[`PolynomialInterestSetter`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[0xae089c1c5de5ea6a1e8e77069c7a787172b2e460](https://etherscan.io/address/0xae089c1c5de5ea6a1e8e77069c7a787172b2e460)|
|[`Expiry`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/Expiry.sol)|Handles account expiries|[0x0ECE224FBC24D40B446c6a94a142dc41fAe76f2d](https://etherscan.io/address/0x0ECE224FBC24D40B446c6a94a142dc41fAe76f2d)|
|[`DaiPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/DaiPriceOracle.sol)|Price oracle for DAI|[0x787F552BDC17332c98aA360748884513e3cB401a](https://etherscan.io/address/0x787F552BDC17332c98aA360748884513e3cB401a)|
|[`WethPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/WethPriceOracle.sol)|Price oracle for WETH|[0xf61AE328463CD997C7b58e7045CdC613e1cFdb69](https://etherscan.io/address/0xf61AE328463CD997C7b58e7045CdC613e1cFdb69)|
|[`UsdcPriceOracle`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/oracles/UsdcPriceOracle.sol)|Price oracle for USDC|[0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60](https://etherscan.io/address/0x52f1c952A48a4588f9ae615d38cfdbf8dF036e60)|
|[`AdminImpl`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/impl/AdminImpl.sol)|SoloMargin library containing admin functions|[0x8a6629fEba4196E0A61B8E8C94D4905e525bc055](https://etherscan.io/address/0x8a6629fEba4196E0A61B8E8C94D4905e525bc055)|
|[`OperationImpl`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/impl/OperationImpl.sol)|SoloMargin library containing operation functions|[0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1](https://etherscan.io/address/0x56E7d4520ABFECf10b38368b00723d9BD3c21ee1)|
|[`LiquidatorProxyV1ForSoloMargin`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/LiquidatorProxyV1ForSoloMargin.sol)|Proxy contract for liquidating other accounts|[0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686](https://etherscan.io/address/0xD4B6cd147ad8A0D5376b6FDBa85fE8128C6f0686)|
|[`LimitOrders`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/LimitOrders.sol)|Contract for making limit orders using dYdX funds|[0xeb32d60A5cDED175cea9aFD0f2447297C125F2f4](https://etherscan.io/address/0xeb32d60A5cDED175cea9aFD0f2447297C125F2f4)|
|[`SignedOperationProxy`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[0x401dca7116d1CACb3c3bc1B4acE16fC87f7EfaBa](https://etherscan.io/address/0x401dca7116d1CACb3c3bc1B4acE16fC87f7EfaBa)|
|[`Refunder`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/Refunder.sol)|Allows sending of funds to other accounts|[0x0ECE224FBC24D40B446c6a94a142dc41fAe76f2d](https://etherscan.io/address/0x7454dF5d0758D4E7A538c3aCF4841FA9137F0f74)|

## Security

### Independent Audits

The smart contracts were audited independently by both
[Zeppelin Solutions](https://zeppelin.solutions/) and Bramah Systems.

**[Zeppelin Solutions Audit Report](https://blog.zeppelin.solutions/solo-margin-protocol-audit-30ac2aaf6b10)**

**[Bramah Systems Audit Report](https://s3.amazonaws.com/dydx-assets/dYdX_Audit_Report_Bramah_Systems.pdf)**

### Code Coverage

All production smart contracts are tested and have 100% branching code-coverage.

### Vulnerability Disclosure Policy

The disclosure of security vulnerabilities helps us ensure the security of our users.

**How to report a security vulnerability?**

If you believe you’ve found a security vulnerability in one of our contracts or platforms,
send it to us by emailing [security@dydx.exchange](mailto:security@dydx.exchange).
Please include the following details with your report:

* Description of the location and potential impact of the vulnerability;

* A detailed description of the steps required to reproduce the vulnerability

**Scope**

Any vulnerability not previously disclosed by us or our independent auditors in their reports

**Guidelines**  

We require that all reporters:

* Make every effort to avoid privacy violations, degradation of user experience,
disruption to production systems, and destruction of data during security testing

* Use the identified communication channels to report vulnerability information to us

* Keep information about any vulnerabilities you’ve discovered confidential between yourself and
dYdX until we’ve had 30 days to resolve the issue

If you follow these guidelines when reporting an issue to us, we commit to:

* Not pursue or support any legal action related to your findings

* Work with you to understand and resolve the issue quickly
(including an initial confirmation of your report within 72 hours of submission)

* Grant a monetary reward based on the [OWASP risk assessment methodology](https://medium.com/dydxderivatives/announcing-bug-bounties-for-the-dydx-margin-trading-protocol-d0c817d1cda4)


## Development

### Compile Contracts

Requires a running [docker](https://docker.com) engine.

`npm run build`

### Compile TypeScript

`npm run build:js`

### Test

Requires a running [docker](https://docker.com) engine.

**Start test node:**

`docker-compose up`

**Deploy contracts to test node & run tests:**

`npm test`

**Just run tests (contracts must already be deployed to test node):**

`npm run test_only`

**Just deploy contracts to test node:**

`npm run deploy_test`

## Maintainers

 - **Brendan Chou**
 [@brendanchou](https://github.com/BrendanChou)
 [`brendan@dydx.exchange`](mailto:brendan@dydx.exchange)

 - **Antonio Juliano**
 [@antoniojuliano](https://github.com/AntonioJuliano)
 [`antonio@dydx.exchange`](mailto:antonio@dydx.exchange)

## License

[Apache-2.0](./blob/master/LICENSE)
