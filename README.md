# dYdX Solo-Margin

<p align="center"><img src="https://dydx.exchange/images/logo.png" width="256" /></p>

<p align="center">
  <a href="https://circleci.com/gh/dydxprotocol/workflows/solo/tree/master">
    <img src="https://circleci.com/gh/dydxprotocol/solo/tree/master.svg?style=svg&circle-token=5f92a227c38113445186b0ecf2681be2fd86c9d4" alt='CI' />
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

> Ethereum Smart Contracts and TypeScript library used for the dYdX Solo-Margin Trading Protocol

## Table of Contents

 - [Security](#security)
 - [Install](#install)
 - [Development](#development)
 - [Maintainers](#maintainers)
 - [Contributing](#contributing)
 - [License](#license)

## Security

### Independent Audits

The smart contracts were audited independently by both Zeppelin Solutions and Bramah Systems.

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

* Grant a monetary reward based on the OWASP risk assessment methodology (similar to our [first
protocol release](https://medium.com/dydxderivatives/announcing-bug-bounties-for-the-dydx-margin-trading-protocol-d0c817d1cda4))

## Install

This project uses [node](https://nodejs.org) and [npm](https://npmjs.com).

`npm i @dydxprotocol/solo`

## Development

### Compile Contracts

You must be running Docker

`npm run build`

### Compile TypeScript

`npm run build:js`

### Test

Requires [docker](https://docker.com).

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
