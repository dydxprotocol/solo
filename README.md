<p align="center">
<img src="https://dolomite.io/assets/img/logo.png" width="256" />
</p>

<div align="center">
  <a href="https://circleci.com/gh/dydxprotocol/workflows/solo/tree/master" style="text-decoration:none;">
    <img src="https://img.shields.io/circleci/project/github/dydxprotocol/solo.svg" alt='CI' />
  </a>
  <a href='https://www.npmjs.com/package/@dolomite-exchange/solo' style="text-decoration:none;">
    <img src='https://img.shields.io/npm/v/@dolomite-exchange/solo.svg' alt='NPM' />
  </a>
  <a href='https://coveralls.io/github/dolomite-exchange/solo?branch=master'>
    <img src='https://coveralls.io/repos/github/dolomite-exchange/solo/badge.svg?branch=master' alt='Coverage Status' />
  </a>
  <a href='https://github.com/dolomite-exchange/solo/blob/master/LICENSE' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/Apache--2.0-llicense-red?longCache=true' alt='License' />
  </a>
  <a href='https://t.me/dolomite_official' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/chat-on%20telegram-9cf.svg?longCache=true' alt='Telegram' />
  </a>
</div>

> Ethereum Smart Contracts and TypeScript library used for the Dolomite Trading Protocol. Currently used by [app.dolomite.io](https://app.dolomite.io)

**Full Documentation at [legacy-docs.dydx.exchange](https://legacy-docs.dydx.exchange)**

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

Check out our full documentation at [legacy-docs.dydx.exchange](https://legacy-docs.dydx.exchange)

## Install

`npm i -s @dolomite-exchange/solo`

## Contracts

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`SoloMargin`](https://github.com/dolomite-exchange/solo/blob/master/contracts/protocol/SoloMargin.sol)|Main dYdX contract|[](https://etherscan.io/address/)|
|[`PayableProxyForSoloMargin`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/proxies/PayableProxyForSoloMargin.sol)|WETH wrapper proxy|[](https://etherscan.io/address/)|
|[`PolynomialInterestSetter`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[](https://etherscan.io/address/)|
|[`Expiry`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/Expiry.sol)|Handles account expiries|[](https://etherscan.io/address/)|
|[`ExpiryV2`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/ExpiryV2.sol)|Handles account expiries (version 2)|[](https://etherscan.io/address/)|
|[`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)|Price oracle for all assets, utilizing Chainlink|[](https://etherscan.io/address/)|
|[`AdminImpl`](https://github.com/dolomite-exchange/solo/blob/master/contracts/protocol/impl/AdminImpl.sol)|SoloMargin library containing admin functions|[](https://etherscan.io/address/)|
|[`OperationImpl`](https://github.com/dolomite-exchange/solo/blob/master/contracts/protocol/impl/OperationImpl.sol)|SoloMargin library containing operation functions|[](https://etherscan.io/address/)|
|[`LiquidatorProxyV1ForSoloMargin`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/proxies/LiquidatorProxyV1ForSoloMargin.sol)|Proxy contract for liquidating other accounts|[](https://etherscan.io/address/)|
|[`LiquidatorProxyV1WithAmmForSoloMargin`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/proxies/LiquidatorProxyV1WithAmmForSoloMargin.sol)|Proxy contract for liquidating other accounts and automatically selling collateral using Dolomite's AMM pools|[](https://etherscan.io/address/)|
|[`LimitOrders`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/LimitOrders.sol)|Contract for making limit orders using Dolomite funds|[](https://etherscan.io/address/)|
|[`StopLimitOrders`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/StopLimitOrders.sol)|Contract for making stop limit orders using Dolomite funds|[](https://etherscan.io/address/)|
|[`CanonicalOrders`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/CanonicalOrders.sol)|Contract for making canonical limit and canonical stop-limit orders using Dolomite funds|[](https://etherscan.io/address/)|
|[`DolomiteAmmRouterProxy`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/DolomiteAmmRouterProxy.sol)|Routing contract for trading against Dolomite AMM pools|[](https://etherscan.io/address/)|
|[`SignedOperationProxy`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[](https://etherscan.io/address/)|
|[`TransferProxy`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/proxies/TransferProxy.sol)|Contract for transferring funds within Dolomite to other users|[](https://etherscan.io/address/)|
|[`Refunder`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/traders/Refunder.sol)|Allows sending of funds to other accounts|[](https://etherscan.io/address/)|
|[`SimpleFeeOwner`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/amm/SimpleFeeOwner.sol)|Owns the admin fees that are accrued by AMM liquidity providers (LPs)|[](https://etherscan.io/address/)|
|[`UniswapV2Factory`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/amm/UniswapV2Factory.sol)|The factory responsible for deploying new AMM pools|[](https://etherscan.io/address/)|
|[`UniswapV2Pair`](https://github.com/dolomite-exchange/solo/blob/master/contracts/external/amm/UniswapV2Pair.sol)|A templated AMM pool that allows users to trade with on-chain liquidity. These pools are natively integrated with Solo, so LPs also accrue interest from borrowers|[](https://etherscan.io/address/)|

## Security

### Independent Audits

The smart contracts were audited independently by both
[Zeppelin Solutions](https://zeppelin.solutions/) and Bramah Systems.

**[Zeppelin Solutions Audit Report](https://blog.zeppelin.solutions/solo-margin-protocol-audit-30ac2aaf6b10)**

**[Bramah Systems Audit Report](https://s3.amazonaws.com/dydx-assets/dYdX_Audit_Report_Bramah_Systems.pdf)**

### Code Coverage

All production smart contracts are tested and have 100% line and branch coverage.

### Vulnerability Disclosure Policy

The disclosure of security vulnerabilities helps us ensure the security of our users.

**How to report a security vulnerability?**

If you believe you’ve found a security vulnerability in one of our contracts or platforms,
send it to us by emailing [security@dolomite.io](mailto:security@dolomite.io).
Please include the following details with your report:

* A description of the location and potential impact of the vulnerability.

* A detailed description of the steps required to reproduce the vulnerability.

**Scope**

Any vulnerability not previously disclosed by us or our independent auditors in their reports.

**Guidelines**

We require that all reporters:

* Make every effort to avoid privacy violations, degradation of user experience,
disruption to production systems, and destruction of data during security testing.

* Use the identified communication channels to report vulnerability information to us.

* Keep information about any vulnerabilities you’ve discovered confidential between yourself and
dYdX until we’ve had 30 days to resolve the issue.

If you follow these guidelines when reporting an issue to us, we commit to:

* Not pursue or support any legal action related to your findings.

* Work with you to understand and resolve the issue quickly
(including an initial confirmation of your report within 72 hours of submission).

* Grant a monetary reward based on the [OWASP risk assessment methodology](https://medium.com/dydxderivatives/announcing-bug-bounties-for-the-dydx-margin-trading-protocol-d0c817d1cda4).


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

## Contributing

You may open a pull request with any added or modified code. The pull request should state the rationale behind any 
changes or the motivation behind any additions. All pull requests should contain adequate test coverage too. 

## Maintainers

 - **Corey Caplan**
 [@coreycaplan3](https://github.com/coreycaplan3)
 [`corey@dolomite.io`](mailto:corey@dolomite.io)

 - **Adam Knuckey**
 [@aknuck](https://github.com/aknuck)
 [`adam@dolomite.io`](mailto:adam@dolomite.io)

## License

[Apache-2.0](./blob/master/LICENSE)
