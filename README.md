<p align="center">
<img src="./docs/dolomite-logo.png" width="256" />
</p>

<div align="center">
<!--   <a href="https://circleci.com/gh/dolomite-exchange/dolomite-v2-protocol/tree/master" style="text-decoration:none;">
    <img src="https://img.shields.io/circleci/project/github/dolomite--exchange/dolomite--margin.svg" alt='CI' />
  </a> -->
  <a href='https://www.npmjs.com/package/@dolomite-exchange/dolomite-margin' style="text-decoration:none;">
    <img src='https://img.shields.io/npm/v/@dolomite-exchange/dolomite-margin.svg' alt='NPM' />
  </a>
  <a href='https://coveralls.io/github/dolomite-exchange/dolomite-margin?branch=master'>
    <img src='https://coveralls.io/repos/github/dolomite-exchange/dolomite-margin/badge.svg?branch=master' alt='Coverage Status' />
  </a>
  <a href='https://github.com/dolomite-exchange/dolomite-margin/blob/master/LICENSE' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/Apache--2.0-llicense-red?longCache=true' alt='License' />
  </a>
  <a href='https://discord.com/invite/uDRzrB2YgP' style="text-decoration:none;">
    <img src='https://img.shields.io/badge/chat-on%20discord-7289DA.svg?longCache=true' alt='Discord' />
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

## Changes from dYdX's original deployment

Most of the changes made to the protocol are auxiliary and don't impact the core contracts. These core changes are
rooted in fixing a bug with the protocol and making the process of adding a large number of markets much more gas
efficient. Prior to the changes, adding a large number of markets, around 10+, would result in an `n` increase in gas
consumption, since all markets needed to be read into memory. With the changes outlined below, now only the necessary
markets are loaded into memory. This allows the protocol to support potentially hundreds of markets in the same deployment,
which will allow DolomiteMargin to become one of the most flexible and largest (in terms of number of non-isolated markets) 
margin systems in DeFi. The detailed changes are outlined below:

- Upgraded the Solidity compiler version from `0.5.7` to `0.5.16`. 
- Added a `getPartialRoundHalfUp` function that's used when converting between `Wei` & `Par` values. The reason for 
this change is that there would be truncation issues when using `getPartial` or `getPartialRoundUp`, which would lead to 
lossy conversions to and from `Wei` and `Par` that would be incorrect by 1 unit.
- Added a `numberOfMarketsWithBorrow` field to `Account.Storage`, which makes checking collateralization for accounts
that do not have an active borrow much more gas efficient. If `numberOfMarketsWithBorrow` is `0`, `state.isCollateralized(...)`
always returns `true`. Else, it does the normal collateralization check.
- Added a `marketsWithNonZeroBalanceSet` which function as an enumerable hash set. Its implementation mimics
[Open Zeppelin's](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol)
with adjustments made to support only the `uint256` type (for gas efficiency's sake). The purpose for this set is to
track, in `O(1)` time, a user's active markets, for reading markets into memory in `OperationImpl`. These markets are needed at 
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
- Added `isRecyclable` field to `Storage.Market` that denotes whether a market can be removed and reused. The 
technicalities of this implementation are intricate and cautious. Recyclable markets may only interact with DolomiteMargin
through the Recyclable smart contract itself, expirations, and liquidations. User accounts are partitioned by account number 
and thus are considered "sub accounts" under the contract itself. The recyclable smart contract contains logic 
for depositing, withdrawing, withdrawing after recycling, and trading with instances of `IExchangeWrapper`. Using this 
recyclable smart contract as a proxy, the implementation can finely control how a user interacts with DolomiteMargin via this 
market. However, there are two circumstances where control cannot be siloed - expirations and liquidations. After any action 
occurs, including an expiration or a liquidation, a check is done that ensures no collateral is held by a user whose address is not 
the same as the `IRecyclable` (recall, `IRecyclable` is the "user" in all other circumstances) smart contract. This ensures 
changing the market ID in the future does not mess up the mapping of user's balances, described as 
`user => account number => par`. Prior to removing a recyclable market, two new and important checks are
done. The first is that there are *no* active borrows for that market, where a user has borrowed the recyclable token.
The second is that the market has *expired* and a one-week buffer has passed, beyond the expiration timestamp. This will 
allow for more than enough time for the liquidation bots to close out any active margin positions that were opened 
involving the recyclable market. All recyclable markets must be expired in order to wind down any leverage used, to
prevent liquidations from occurring with clashing market IDs. Once the contract is expired, all control of the contract
is confined to the `IRecyclable` instance itself. Meaning, no more expirations or liquidations can occur for that market. Lastly, 
there is nothing forcing a market to be recycled as soon as it's expired and the one-week buffer passes. The protocol 
administrators may choose to recycle the market at any time after the buffer passes.
- Added a `recycledMarketIds` linked list to `Storage.State` that prepends all recycled/removed markets to this linked list.
This allows newly-added markets to reuse an old ID upon being added. IDs are reused by popping off the first value from the 
head of the linked list.
- Separated liquidation and vaporization logic into another library, `LiquidateOrVaporizeImpl`, to save bytecode (compilation 
size) in `OperationImpl`. Otherwise, the `OperationImpl` bytecode was too large and could not be deployed.
- Added a require statement in `OperationImpl` that forces liquidations to come from a *global operator*. This will 
allow for Chainlink nodes to be the sole liquidator in the future, allowing the DAO to receive liquidation rewards 
(thus, socializing the reward), instead of having gas wars amongst liquidators to receive the reward while simultaneously 
clogging the network.
- Similar to the prior point, added a require statement in `OperationImpl` that forces expirations to come from a 
*global operator*. This requirement is done by first checking if the internal trader is considered *special* through a 
new mapping `specialAutoTraders` `mapping (address => bool)`. If it is, interactions with *DolomiteMargin* must be 
done through a *global operator*.
- Added the option of limiting the quantity of deposits for a particular asset, via the addition of the `maxWei` field
in the `Market` struct in `Storage.sol`. This helps alleviate risk for assets that could be deposited in large quantity
into `DolomiteMargin` such that there isn't enough liquidity to perform timely liquidations. For example, if the current
market size were $50M in TVL, and a whale deposited $1B in UST, it would put too much stress on the system, since that
much LINK would outweigh every other asset deposited by orders of magnitude. If a `maxWei` is set that is higher than
the current TVL, all new actions involving that currency must lower the TVL or keep it the same.
- Added `accountMaxNumberOfMarketsWithBalances` to `RiskParams` which limits how many assets a user can hold in the same
account index, if the user has any active debt. This number was initialized to be sufficiently high, at `32`, meaning
a user could use up to 31 assets as collateral when borrowing one asset, or conversely, 1 asset as collateral and borrow
up to 31 different assets. This limits the stress that can be put on the system gas-wise, whereby a user could add many
unique assets to the same account index that has an active position, causing maintenance gas costs for any action that
interacts with that user's account index to increase.

## Documentation

Documentation can be found at [docs.dolomite.io](https://docs.dolomite.io).

## Install

`npm i @dolomite-exchange/dolomite-margin`

## Contracts

### Arbitrum One (Mainnet)

[https://docs.dolomite.io/#/contracts?id=arbitrum-mainnet](https://docs.dolomite.io/#/contracts?id=arbitrum-mainnet)

### Arbitrum Rinkeby

[https://docs.dolomite.io/#/contracts?id=arbitrum-rinkeby](https://docs.dolomite.io/#/contracts?id=arbitrum-rinkeby)

## Security

### Independent Audits

The original DolomiteMargin smart contracts were audited independently by both
[Zeppelin Solutions](https://zeppelin.solutions/) and Bramah Systems.

**[Zeppelin Solutions Audit Report](https://blog.zeppelin.solutions/solo-margin-protocol-audit-30ac2aaf6b10)**

**[Bramah Systems Audit Report](https://s3.amazonaws.com/dydx-assets/dYdX_Audit_Report_Bramah_Systems.pdf)**

Some changes discussed above were audited by [SECBIT Labs](https://secbit.io/). We plan on performing at least one more 
audit of the system before the new *Recyclable* feature is used in production.

**[SECBIT Audit Report](./docs/Dolomite_Protocol_V2_Report_EN.pdf)**

### Code Coverage

All production smart contracts are tested and have the vast majority of line and branch coverage.

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

[Apache-2.0](./LICENSE)
