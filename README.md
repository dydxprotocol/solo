<p align="center">
<img src="https://dolomite.io/assets/img/logo.png" width="256" />
</p>

<div align="center">
  <a href="https://circleci.com/gh/dolomite-exchange/dolomite-v2-protocol/tree/master" style="text-decoration:none;">
    <img src="https://img.shields.io/circleci/project/github/dolomite--exchange/dolomite--margin.svg" alt='CI' />
  </a>
  <a href='https://www.npmjs.com/package/@dolomite-exchange/dolomite-margin' style="text-decoration:none;">
    <img src='https://img.shields.io/npm/v/@dolomite-exchange/dolomite-margin.svg' alt='NPM' />
  </a>
  <a href='https://coveralls.io/github/dolomite-exchange/dolomite-margin?branch=master'>
    <img src='https://coveralls.io/repos/github/dolomite-exchange/dolomite-margin/badge.svg?branch=master' alt='Coverage Status' />
  </a>
  <a href='https://github.com/dolomite-exchange/dolomite-margin/blob/master/LICENSE' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/Apache--2.0-llicense-red?longCache=true' alt='License' />
  </a>
  <a href='https://t.me/dolomite_official' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/chat-on%20telegram-9cf.svg?longCache=true' alt='Telegram' />
  </a>
</div>

> Ethereum Smart Contracts and TypeScript library used for the Dolomite Trading Protocol. Currently used by [app.dolomite.io](https://app.dolomite.io)

## TODO re-write API using subgraph data!

## Table of Contents

 - [Documentation](#documentation)
 - [Install](#install)
 - [Contracts](#contracts)
 - [Security](#security)
 - [Development](#development)
 - [Maintainers](#maintainers)
 - [Contributing](#contributing)
 - [License](#license)

## Changes from dYdX's deployment

Most of the changes made to the protocol are auxiliary and don't impact the core contracts. These core changes are
rooted in fixing a bug with the protocol and making the process of adding a large number of markets much more gas
efficient. Prior to the changes, adding a large number of markets, around 10+, would result in an `n` increase in gas
consumption, since all markets needed to be read into memory. With the changes outlined below, now only the necessary
markets are loaded into memory. This allows the protocol to support potentially hundreds of markets in the same deployment,
which will allow DolomiteMargin to become one of the most flexible and largest (in terms of number of non-partitioned markets) 
margin systems in DeFi. The detailed changes are outlined below:

 - Added a `getPartialRoundHalfUp` function that's used when converting between positive `Wei` & `Par` values. The reason for 
this change is that there would be truncation issues when using `getPartial`, which would lead to lossy conversions
to and from `Wei` and `Par` that would be off by 1.
 - Added a `numberOfMarketsWithBorrow` field to `Account.Storage`, which makes checking collateralization for accounts
that do not have an active borrow much more gas efficient. If `numberOfMarketsWithBorrow` is `0`, `state.isCollateralized(...)`
always returns `true`. Else, it does the normal collateralization check.
 - Added a `marketsWithNonZeroBalanceSet` which function as an enumerable hash set. Its implementation mimics
[Open Zeppelin's](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol)
with adjustments made to support only the `uint256` type (for gas efficiency's sake). The purpose for this set is to
track, in O(1) time, a user's active markets, for reading markets into memory in `OperationImpl`. These markets are needed at 
the end of each transaction for checking the user's collateralization. It's understood that reading this user's array into memory
can be more costly gas-wise than the old algorithm, but as the number of markets listed grows to the tens or hundreds,
the new algorithm will be much more efficient. Most importantly, it's understood that a user can inadvertently DOS
themselves by depositing too many unique markets into a single account number (recall, user's deposits are partitioned 
first by their `address` and second by a `uint256` account number). Through UI patterns and organizing the protocol 
such that a lot of these markets (at scale) won't be for ordinary use by end-users, the protocol will fight against 
these DOS attacks. Reading these markets into memory is done using initially populating a bitmap, where each index in 
the bitmap corresponds with the market's ID. Since IDs are auto-incremented, we can store 256 in just one `uint256` 
variable. Once populated, the bitmap is read into an array that's pre-sorted in `O(m)`, where `m` represents the number 
of items in the bitmap, not the total length of it (where the length equals the number of total bits, 256). This is done by 
reading the least significant bit, truncating it out of the bitmap, and repeating the process until the bitmap equals 0.
The process of reading the least significant bit is done in `O(1)` time using crafty bit math. Then, since the final
array that the bitmap is read into is sorted, it can be searched in later parts of `OperationImpl` in `O(log(n))` time, and 
iterated in its entirety in `O(m)`, where `m` represents the number of items. 
 - Added `isRecyclable` field to `Storage.Market` that denotes whether or not a market can be removed and reused. The 
technicalities of this implementation are intricate and cautious. Recyclable markets may only interact with DolomiteMargin
through the Recyclable smart contract itself, expirations, and liquidations. User accounts are partitioned by account number 
and thus are considered "sub accounts" under the contract itself. The recyclable smart contract contains logic 
for depositing, withdrawing, withdrawing after recycling, and trading with instances of `IExchangeWrapper`. Using this 
recyclable smart contract as a proxy, the implementation can finely control how a user interacts with DolomiteMargin via this 
market. However, there are two circumstances where control cannot be siloed - expirations and liquidations. If an 
expiration or liquidation occurs, a check is done that ensures no collateral is held in by a user whose address is not 
the same as the `IRecyclable` (recall, IRecyclable is the "user" in all other circumstances) smart contract. This ensures 
changing the market ID in the future does not mess up the mapping of user's balances, described as 
`user => account number => par`. Prior to removing a recyclable market, two new and important checks are
done. The first is that there are *no* active borrows for that market, where a user has borrowed the recyclable token.
The second is that the market has *expired* and a one-week buffer, beyond the expiration timestamp, has passed. This will 
allow for more than enough time for the liquidation bots to close out any active margin positions that were opened 
involving the recyclable markets. All recyclable markets must be expired in order to wind down any leverage used, to
prevent liquidations from occurring with clashing market IDs. Once the contract is expired, all control of the contract
is confined to the IRecyclable instance itself. Presumably, no more expirations or liquidations will occur. Lastly, there
is nothing forcing a market to be recycled as soon as the one-week buffer passes, after expiration. The protocol 
administrators may choose to recycle the market at any time after the buffer has passed.
 - Added a `recycledMarketIds` linked list to `Storage.State` that prepends all recycled/removed markets to this linked list.
This allows newly-added markets to reuse an old ID upon being added. IDs are reused by popping off the first value from the 
head of the linked list.
 - Separated liquidation and vaporization logic into another library, `LiquidateOrVaporizeImpl`, to save bytecode (compilation 
size) in `OperationImpl`. Otherwise, the `OperationImpl` bytecode was too large and could not be deployed.

## Documentation

Since the original codebase is a fork of dYdX's DolomiteMargin, check out the original documentation at 
[legacy-docs.dydx.exchange](https://legacy-docs.dydx.exchange).

New documentation will be written

## Install

`npm i @dolomite-exchange/dolomite-margin`

## Contracts

### Mainnet

|Contract Name|Description|Address|
|---|---|---|
|[`DolomiteMargin`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/DolomiteMargin.sol)|Main margin contract|[](https://etherscan.io/address/)|
|[`PayableProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol)|WETH wrapper proxy|[](https://etherscan.io/address/)|
|[`PolynomialInterestSetter`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/interestsetters/PolynomialInterestSetter.sol)|Sets interest rates|[](https://etherscan.io/address/)|
|[`Expiry`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/Expiry.sol)|Handles account expirations|[](https://etherscan.io/address/)|
|[`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)|Price oracle for all assets, utilizing Chainlink|[](https://etherscan.io/address/)|
|[`AdminImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/AdminImpl.sol)|DolomiteMargin library containing admin functions|[](https://etherscan.io/address/)|
|[`OperationImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/OperationImpl.sol)|DolomiteMargin library containing operation functions|[](https://etherscan.io/address/)|
|[`LiquidateOrVaporizeImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/LiquidateOrVaporizeImpl.sol)|DolomiteMargin library containing liquidation and vaporization functions. Designed to be used within `OperationImpl`|[](https://etherscan.io/address/)|
|[`LiquidatorProxyV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1.sol)|Proxy contract for liquidating other accounts|[](https://etherscan.io/address/)|
|[`LiquidatorProxyV1WithAmm`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1WithAmm.sol)|Proxy contract for liquidating other accounts and automatically selling collateral using Dolomite's AMM pools|[](https://etherscan.io/address/)|
|[`DolomiteAmmRouterProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/DolomiteAmmRouterProxy.sol)|Routing contract for trading against Dolomite AMM pools|[](https://etherscan.io/address/)|
|[`SignedOperationProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/SignedOperationProxy.sol)|Contract for sending signed operations on behalf of another account owner|[](https://etherscan.io/address/)|
|[`TransferProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/TransferProxy.sol)|Contract for transferring funds within Dolomite to other users|[](https://etherscan.io/address/)|
|[`SimpleFeeOwner`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/SimpleFeeOwner.sol)|Owns the admin fees that are accrued by AMM liquidity providers (LPs)|[](https://etherscan.io/address/)|
|[`DolomiteAmmFactory`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DolomiteAmmFactory.sol)|The factory responsible for deploying new AMM pools|[](https://etherscan.io/address/)|
|[`DolomiteAmmPair`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DolomiteAmmPair.sol)|A templated AMM pool that allows users to trade with on-chain liquidity. These pools are natively integrated with DolomiteMargin, so LPs also accrue interest from borrowers|[](https://etherscan.io/address/)|

## Security

### Independent Audits

The original DolomiteMargin smart contracts were audited independently by both
[Zeppelin Solutions](https://zeppelin.solutions/) and Bramah Systems.

**[Zeppelin Solutions Audit Report](https://blog.zeppelin.solutions/solo-margin-protocol-audit-30ac2aaf6b10)**

**[Bramah Systems Audit Report](https://s3.amazonaws.com/dydx-assets/dYdX_Audit_Report_Bramah_Systems.pdf)**

Some changes discussed above were audited by [SECBIT Labs](https://secbit.io/). We plan on performing at least one more 
audit of the system before the new *Recyclable* feature is used in production.

**[TODO add SECBIT audit link](https://)**

### Code Coverage

All production smart contracts are tested and have 100% line and branch coverage.

### Vulnerability Disclosure Policy

The disclosure of security vulnerabilities helps us ensure the security of all DolomiteMargin users.

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
Dolomite until we’ve had 30 days to resolve the issue.

If you follow these guidelines when reporting an issue to us, we commit to:

* Not pursue or support any legal action related to your findings.

* Work with you to understand and resolve the issue quickly
(including an initial confirmation of your report within 72 hours of submission).

# TODO FIX THE BELOW LINK WITH OUR OWN BOUNTY
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
