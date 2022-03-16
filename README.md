<p align="center">
<img src="https://dolomite.io/assets/img/logo.png" width="256" />
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

## Documentation

Documentation can be found at [docs.dolomite.io](https://docs.dolomite.io).

## Install

`npm i @dolomite-exchange/dolomite-margin`

## Contracts

### Arbitrum One (Mainnet)

| Contract Name                                                                                                                                                          | Description                                                                                                                                                                                                                                                 | Address                                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| [`AdminImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/AdminImpl.sol)                                                  | DolomiteMargin library containing admin functions                                                                                                                                                                                                           | [](https://arbiscan.io/address/)                                                                                     |
| [`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)                     | Price oracle for all assets, utilizing Chainlink                                                                                                                                                                                                            | [](https://arbiscan.io/address/)                                                                                     |
| [`DelayedMultiSig`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DelayedMultiSig.sol)                                       | Multi-signature wallet that owns the `DolomiteMargin` protocol. On the testnet, all changes are time-gated for 48 hours. This multi-sig is a 1 of 1 (1 signer needed to broadcast transactions & is owned by 1 entity) wallet that is owned by `GnosisSafe` | [0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B](https://arbiscan.io/address/0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B) |
| [`DolomiteAmmFactory`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DolomiteAmmFactory.sol)                                 | Factory for creating templated AMM pools. These AMM pools allow users to trade with on-chain liquidity. They also are natively integrated with DolomiteMargin, so LPs also accrue interest from borrowers                                                   | [](https://arbiscan.io/address/)                                                                                     |
| [`DolomiteAmmRouterProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/DolomiteAmmRouterProxy.sol)                     | Routing contract for trading against Dolomite AMM pools                                                                                                                                                                                                     | [](https://arbiscan.io/address/)                                                                                     |
| [`DolomiteMargin`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/DolomiteMargin.sol)                                             | Main margin contract                                                                                                                                                                                                                                        | [](https://arbiscan.io/address/)                                                                                     |
| [`Expiry`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/Expiry.sol)                                                     | Handles account expirations                                                                                                                                                                                                                                 | [](https://arbiscan.io/address/)                                                                                     |
| GnosisSafe                                                                                                                                                             | Operational multi signature wallet that owns the `DelayedMultiSig` wallet                                                                                                                                                                                   | [0xa75c21C5BE284122a87A37a76cc6C4DD3E55a1D4](https://arbiscan.io/address/0xa75c21C5BE284122a87A37a76cc6C4DD3E55a1D4) |
| [`LiquidateOrVaporizeImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/LiquidateOrVaporizeImpl.sol)                      | DolomiteMargin library containing liquidation and vaporization functions. Designed to be used within `OperationImpl`                                                                                                                                        | [](https://arbiscan.io/address/)                                                                                     |
| [`LiquidatorProxyV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1.sol)                               | Proxy contract for liquidating other accounts                                                                                                                                                                                                               | [](https://arbiscan.io/address/)                                                                                     |
| [`LiquidatorProxyV1WithAmm`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1WithAmm.sol)                 | Proxy contract for liquidating other accounts and automatically selling collateral using Dolomite's AMM pools                                                                                                                                               | [](https://arbiscan.io/address/)                                                                                     |
| [`MultiCall`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/utils/MultiCall.sol)                                                 | A utility contract for aggregating calls to the RPC node                                                                                                                                                                                                    | [](https://arbiscan.io/address/)                                                                                     |
| [`OperationImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/OperationImpl.sol)                                          | DolomiteMargin library containing operation functions                                                                                                                                                                                                       | [](https://arbiscan.io/address/)                                                                                     |
| [`PayableProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol)                                         | WETH wrapper proxy                                                                                                                                                                                                                                          | [](https://arbiscan.io/address/)                                                                                     |
| [`DoubleExponentInterestSetter`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/interestsetters/DoubleExponentInterestSetter.sol) | Sets interest rates                                                                                                                                                                                                                                         | [](https://arbiscan.io/address/)                                                                                     |
| [`SignedOperationProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/SignedOperationProxy.sol)                         | Contract for sending signed operations on behalf of another account owner                                                                                                                                                                                   | [](https://arbiscan.io/address/)                                                                                     |
| [`SimpleFeeOwner`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/SimpleFeeOwner.sol)                                         | Owns the admin fees that are accrued by AMM liquidity providers (LPs)                                                                                                                                                                                       | [](https://arbiscan.io/address/)                                                                                     |
| [`TransferProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/TransferProxy.sol)                                       | Contract for transferring funds within Dolomite to other users                                                                                                                                                                                              | [](https://arbiscan.io/address/)                                                                                     |

### Arbitrum Rinkeby

| Contract Name                                                                                                                                                          | Description                                                                                                                                                                                               | Address                                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| [`AdminImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/AdminImpl.sol)                                                  | DolomiteMargin library containing admin functions                                                                                                                                                         | [0xa751FE3b02F9f387211A962B9b272ca5eAb94F6f](https://testnet.arbiscan.io/address/0xa751FE3b02F9f387211A962B9b272ca5eAb94F6f) |
| [`ChainlinkPriceOracleV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/oracles/ChainlinkPriceOracleV1.sol)                     | Price oracle for all assets, utilizing Chainlink                                                                                                                                                          | [0x3519c6231DFe5648E06865aDdd97e00F7D69FA3b](https://testnet.arbiscan.io/address/0x3519c6231DFe5648E06865aDdd97e00F7D69FA3b) |
| [`DelayedMultiSig`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DelayedMultiSig.sol)                                       | Multi-signature wallet that owns the `DolomiteMargin` protocol. On the testnet, all changes are time-gated for 60 seconds.                                                                                | [0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B](https://testnet.arbiscan.io/address/0xE412991Fb026df586C2f2F9EE06ACaD1A34f585B) |
| [`DolomiteAmmFactory`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/DolomiteAmmFactory.sol)                                 | Factory for creating templated AMM pools. These AMM pools allow users to trade with on-chain liquidity. They also are natively integrated with DolomiteMargin, so LPs also accrue interest from borrowers | [0xcD6b7A449b495339Db8cB84047cf7C9B53443f2F](https://testnet.arbiscan.io/address/0xcD6b7A449b495339Db8cB84047cf7C9B53443f2F) |
| [`DolomiteAmmRouterProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/DolomiteAmmRouterProxy.sol)                     | Routing contract for trading against Dolomite AMM pools                                                                                                                                                   | [0x3AF444Bd44f22dF7720e2C59b684E1aa529C265F](https://testnet.arbiscan.io/address/0x3AF444Bd44f22dF7720e2C59b684E1aa529C265F) |
| [`DolomiteMargin`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/DolomiteMargin.sol)                                             | Main margin contract                                                                                                                                                                                      | [0x80686433Fdb5F6030a3b3172a468A5539166d3f8](https://testnet.arbiscan.io/address/0x80686433Fdb5F6030a3b3172a468A5539166d3f8) |
| [`Expiry`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/traders/Expiry.sol)                                                     | Handles account expirations                                                                                                                                                                               | [0x26412B315e91705a212E08bdC0A096C29bC157cB](https://testnet.arbiscan.io/address/0x26412B315e91705a212E08bdC0A096C29bC157cB) |
| [`LiquidateOrVaporizeImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/LiquidateOrVaporizeImpl.sol)                      | DolomiteMargin library containing liquidation and vaporization functions. Designed to be used within `OperationImpl`                                                                                      | [0x2d3B3F17d6694d5AA643Cb89A82Ac9214a41536d](https://testnet.arbiscan.io/address/0x2d3B3F17d6694d5AA643Cb89A82Ac9214a41536d) |
| [`LiquidatorProxyV1`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1.sol)                               | Proxy contract for liquidating other accounts                                                                                                                                                             | [0x2e0fB9B9da78963295F7920DdA03118AF5f0600c](https://testnet.arbiscan.io/address/0x2e0fB9B9da78963295F7920DdA03118AF5f0600c) |
| [`LiquidatorProxyV1WithAmm`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/LiquidatorProxyV1WithAmm.sol)                 | Proxy contract for liquidating other accounts and automatically selling collateral using Dolomite's AMM pools                                                                                             | [0x21C6FeA3dB52be323E0f2Bd22C3485Bff9eb3DEB](https://testnet.arbiscan.io/address/0x21C6FeA3dB52be323E0f2Bd22C3485Bff9eb3DEB) |
| [`MultiCall`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/utils/MultiCall.sol)                                                 | A utility contract for aggregating calls to the RPC node                                                                                                                                                  | [0x7317eb743583250739862644cef74b982708ebb4](https://testnet.arbiscan.io/address/0x7317eb743583250739862644cef74b982708ebb4) |
| [`OperationImpl`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/protocol/impl/OperationImpl.sol)                                          | DolomiteMargin library containing operation functions                                                                                                                                                     | [0x6fA07522F1dd8D8cb5b400c957418b4bD2C96F80](https://testnet.arbiscan.io/address/0x6fA07522F1dd8D8cb5b400c957418b4bD2C96F80) |
| [`PayableProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/PayableProxy.sol)                                         | WETH wrapper proxy                                                                                                                                                                                        | [0x178D0B2Feb9A8aFFed7Cd646f29429c4f0126278](https://testnet.arbiscan.io/address/0x178D0B2Feb9A8aFFed7Cd646f29429c4f0126278) |
| [`DoubleExponentInterestSetter`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/interestsetters/DoubleExponentInterestSetter.sol) | Sets interest rates                                                                                                                                                                                       | [0xC033378c6eEa969C001CE9438973ca4d6460999a](https://testnet.arbiscan.io/address/0xC033378c6eEa969C001CE9438973ca4d6460999a) |
| [`SignedOperationProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/SignedOperationProxy.sol)                         | Contract for sending signed operations on behalf of another account owner                                                                                                                                 | [0x4De2f256dFc0Ce002d2d55F061cD7d2D32968352](https://testnet.arbiscan.io/address/0x4De2f256dFc0Ce002d2d55F061cD7d2D32968352) |
| [`SimpleFeeOwner`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/amm/SimpleFeeOwner.sol)                                         | Owns the admin fees that are accrued by AMM liquidity providers (LPs)                                                                                                                                     | [0xE82D868AbB3eb97ee588D2f86289d37edb8dc502](https://testnet.arbiscan.io/address/0xE82D868AbB3eb97ee588D2f86289d37edb8dc502) |
| [`TransferProxy`](https://github.com/dolomite-exchange/dolomite-margin/blob/master/contracts/external/proxies/TransferProxy.sol)                                       | Contract for transferring funds within Dolomite to other users                                                                                                                                            | [0x063611DcdB17F7cCDb053574D63eCd12c508D1ab](https://testnet.arbiscan.io/address/0x063611DcdB17F7cCDb053574D63eCd12c508D1ab) |

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

[Apache-2.0](./blob/master/LICENSE)
