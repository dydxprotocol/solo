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
 - [Development](#development)
 - [Maintainers](#maintainers)
 - [Contributing](#contributing)
 - [License](#license)

## Security

The smart contracts were audited independently by Bramah Systems and Zeppelin.

All production smart contracts are tested and have 100% branching code-coverage.

Please email any of the [maintainers](#Maintainers) if any security issues are found or suspected.

## Development

### Compile Contracts

You must be running Docker

```
npm run build
```

### Compile TypeScript

```
npm run build:js
```

### Test

Requires docker

Start test node:
```
docker-compose up
```

Deploy contracts to test node & run tests:
```
npm test
```

Just run tests (contracts must already be deployed to test node)
```
npm run test_only
```

Just deploy contracts to test node:
```
npm run deploy_test
```

## Maintainers

 - **Brendan Chou** `brendan@dydx.exchange`
 - **Antonio Juliano** `antonio@dydx.exchange`

## License

[Apache-2.0](./blob/master/LICENSE)
