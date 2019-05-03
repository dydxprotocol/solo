<p align="center"><img src="https://s3.amazonaws.com/dydx-assets/logo_large_white.png" width="256" /></p>

<p align="center">
  <a href="https://circleci.com/gh/dydxprotocol/workflows/solo/tree/master">
    <img src="https://img.shields.io/circleci/project/github/dydxprotocol/solo.svg" alt='CI' />
  </a>
  <a href='https://www.npmjs.com/package/@dydxprotocol/solo'>
    <img src='https://img.shields.io/npm/v/@dydxprotocol/solo.svg' alt='NPM' />
  </a>
  <a href='https://coveralls.io/github/dydxprotocol/solo'>
    <img src='https://coveralls.io/repos/github/dydxprotocol/solo/badge.svg?t=toKMwT' alt='Coverage Status' />
  </a>
  <a href='https://github.com/dydxprotocol/solomargin/blob/master/LICENSE'>
    <img src='https://img.shields.io/github/license/dydxprotocol/protocol.svg?longCache=true' alt='License' />
  </a>
  <a href='https://slack.dydx.exchange/'>
    <img src='https://img.shields.io/badge/chat-on%20slack-brightgreen.svg?longCache=true' alt='Slack' />
  </a>
</p>

> Ethereum Smart Contracts and TypeScript library used for the dYdX Solo Trading Protocol. Currently used by [trade.dydx.exchange](https://trade.dydx.exchange)

## Table of Contents

 - [Install](#install)
 - [Usage](#usage)
 - [Security](#security)
 - [Development](#development)
 - [Maintainers](#maintainers)
 - [Contributing](#contributing)
 - [License](#license)

## Install

`npm i -s @dydxprotocol/solo`

## Usage

### Initialize

```javascript
const solo = new Solo(
  provider,  // Valid web3 provider
  networkId, // Ethereum network ID (1 - Mainnet, 42 - Kovan, etc.)
);
```

### Accounts

Solo is Account based. Each Account is referenced by its owner Ethereum address and an account number unique to that owner address. Accounts have balances on each asset supported by Solo, which can be either positive (indicating a net supply of the asset) or negative (indicating a net borrow of an asset). Accounts must maintain a certain level of collateralization or they will be liquidated.


### Amounts

Amounts in Solo are denominated by 3 things:

- `value` the numerical value of the Amount
- `reference` One of:
  - `AmountReference.Delta` Indicates an amount relative to the existing balance
  - `AmountReference.Target` Indicates an absolute amount
- `denomination` One of:
  - `AmountDenomination.Actual` Indicates the amount is denominated in the actual units of the token being transferred
  - `AmountDenomination.Principal` Indicates the amount is denominated in principal. Solo uses these types of amount in its internal accounting, and they do not change over time
  
A very important thing to note is that amounts are always relative to how the balance of the Account being Operated on will change, not the amount of the Action occurring. So, for example you'd say [pseudocode] `withdraw(-10)`, because when you Withdraw, the balance of the Account will decrease.


### Markets

Solo has a Market for each ERC20 token asset it supports. Interest Each Market has a specified interest

### Interest

Interest rates in Solo are dynamic and set per Market. Each interest rate is set based on the % utilization of that Market. Each Account's balances either continuously earns (if positive) or pays (if negative) interest.

### Operations

Every state changing action to the protocol occurs through an Operation. Operations contain a series of Actions that each operate on an Account. Some examples of Actions include (but are not limited to): Deposits, Withdrawals, Buys, Sells, Trades,  and Liquidates.

Importantly collateralization is only checked at the end of an operation, so accounts are allowed to be transiently undercollateralized in the scope of one Operation. This allows for Operations like a Sell -> Trade, where an asset is first sold, and the collateral is locked up as the second Action in the Operation.

#### Example

In this example 1 ETH is being withdrawn from an account, and then 200 DAI are being deposited into it:

```javascript
await solo.token.setMaximumSoloAllowance(
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI Contract Address
  '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
);

await solo.operation.initiate()
  .withdraw({
    primaryAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    primaryAccountId: new BigNumber('123456'),
    marketId: new BigNumber(0), // WETH Market ID
    amount: {
      value: new BigNumber('-1e18'),
      reference: AmountReference.Delta,
      denomination: AmountDenomination.Actual,
    },
    to: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5'
  })
  .deposit({
    primaryAccountOwner: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    primaryAccountId: new BigNumber('123456'),
    marketId: new BigNumber(1), // DAI Market ID
    amount: {
      value: new BigNumber('200e18'),
      reference: AmountReference.Delta,
      denomination: AmountDenomination.Actual,
    },
    from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
  })
  .commit({
    from: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
    gasPrice: '1000000000',
    confirmationType: ConfirmationType.Confirmed,
  });
```

### Web3

Solo uses [web3](https://web3js.readthedocs.io/en/1.0/index.html) under the hood. You can access it through `solo.web3`

## Security

### Independent Audits

The smart contracts were audited independently by both
[Zeppelin Solutions](https://zeppelin.solutions/) and Bramah Systems.

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
