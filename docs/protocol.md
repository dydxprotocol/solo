# Protocol

- [GitHub](https://github.com/dydxprotocol/solo)

Solo is an open protocol consisting of smart contracts that run on the Ethereum blockchain. Solo supports margin trading, borrowing, and lending. The Solo Typescript library makes it easy to interact with the smart contracts running on the blockchain.

Solo is built by dYdX, and is used by [trade.dydx.exchange](https://trade.dydx.exchange)


## Accounts

Solo is Account based. Each Account is referenced by its owner Ethereum address and an account number unique to that owner address. Accounts have balances on each asset supported by Solo, which can be either positive (indicating a net supply of the asset) or negative (indicating a net borrow of an asset). Accounts must maintain a certain level of collateralization or they will be liquidated.

#### Example

Ethereum Address `0x6b5Bb4E60821eCE7363CaFf836Be1A4f9e3559B3` has the following balances in its account number `123456`:

- ETH: 1,000
- DAI: -10,000
- USDC: -5,000

This account is borrowing 10,000 DAI and 5,000 USDC. These borrows are collateralized by 1,000 ETH. The account will earn interest on ETH and pay interest on DAI and USDC.

## Markets

Solo has a Market for each ERC20 token asset it supports. Each Market specifies the [Price Oracle](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/interfaces/IPriceOracle.sol) used to determine the price for its asset, and the [Interest Setter](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/interfaces/IInterestSetter.sol) contract which determines what the interest rates are for the Market.

Markets are referenced by their numerical IDs. Currently on Mainnet Solo has the following markets, but more will be added over time:

|id|Asset|
|---|---|
|0|WETH|
|1|DAI|
|2|USDC|

## Interest

Interest rates in Solo are dynamic and set per Market. Each interest rate is automatically and algorithmically set based on the the ratio of `(total borrow) / (total supply)` of that Market. Account balances either continuously earn (if positive) or pay (if negative) interest.

Interest is earned / paid continuously (down to the second). Rates on the protocol are denominated yearly in APR.

## Wei & Par

There are two types of balances amounts on Solo: Wei and Par.

#### Wei

Wei refers to the actual token amount of an asset held in or owed by an account. Wei amounts are constantly changing as interest accrues on the balance. For example, if Bob deposits 10 DAI to a Solo Account, its Wei balance would initially be 10. The balance would start increasing every second as Bob started earning interest on his DAI.

Likely, most times you will want to use Wei balances.

#### Par

Par refers to an interest adjusted amount that is static and does not change on the protocol. These are the balances that are actually stored on the protocol smart contracts. The protocol uses the current market index (see below) to transform Par to Wei values.

## Index

Each Market has a global borrow index and supply index. These indexes are used to transform Par <-> Wei values using the formula:

```
Borrow Wei Balance = (Borrow Par Balance) * (Borrow Market Index)
```

and

```
Supply Wei Balance = (Supply Par Balance) * (Supply Market Index)
```

Indexes start at 1 upon the addition of the Market to the protocol. They increase based on how much interest has accrued for that asset. For example upon adding USDC both the borrow index and supply index for USDC were 1. Say over the next month 2% interest accrues to borrowers and 1% interest accrues to lenders (based on the interest rates and time that has passed). After this, the supply index will be 1.01, and the borrow index will be 1.02. These indexes will keep increasing based on interest accrued, forever.

#### Example

Alice deposits 10 DAI to the protocol (10 DAI in Wei). The supply index on DAI is currently 2. Using `Supply Par Balance = (Supply Wei Balance) / (Supply Market Index) = 10 / 2 = 5`, the protocol credits 5 Par balance to Alice's account.

Later, interest has accrued for DAI on the protocol, and now the supply index for DAI is 3. Now, Alice goes to withdraw her DAI. Her DAI Par balance is still 5 (Par does not change over time). Now the protocol calculates `Supply Wei Balance = (Supply Par Balance) * (Supply Market Index) = 5 * 3 = 15`, and sends Alice 15 DAI.


## Actions

All state changes to accounts happen through Actions. Actions can modify the balances of 1 or more Accounts. There is no such thing as a "Borrow" action on Solo, Actions can automatically borrow funds if Account balances decrease. The following Actions are supported by Solo:

#### Deposit
Deposit funds into an Account. Funds are moved from the sender or an approved address to Solo, and the Account's balance is incremented.

#### Withdraw
Withdraw funds from an Account. Funds are sent from Solo to a specified address and the Account's balance is decremented.

#### Transfer
Transfer funds internally between two Solo accounts.

#### Buy
Buy an asset on a decentralized exchange using another asset. Uses dYdX's [Exchange Wrappers](https://github.com/dydxprotocol/exchange-wrappers) to interact with different decentralized exchanges. Causes the bought asset's balance to go up, and the asset used to do the buy's balance to go down. Example: Buy 1 WETH on eth2dai using DAI

#### Sell
Sell an asset on a decentralized exchange for another asset. Uses dYdX's [Exchange Wrappers](https://github.com/dydxprotocol/exchange-wrappers) to interact with different decentralized exchanges. Causes the sold asset's balance to go down, and the received assets balance to go up. Example: Sell 1 WETH on eth2dai for DAI

#### Trade
Trade assets with another account on Solo internally. No actual tokens are moved, but Account balances are updated. Uses the [`AutoTrader`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/interfaces/IAutoTrader.sol) interface, which allows a smart contract to be specified which is called to determine the price of the trade.

#### Call
Calls a function specified by the [`ICallee`](https://github.com/dydxprotocol/solo/blob/master/contracts/protocol/interfaces/ICallee.sol) interface through the context of an Account. Does not modify Account balances. An example of how this can be used is for setting expiration on the [`Expiry`](https://github.com/dydxprotocol/solo/blob/master/contracts/external/traders/Expiry.sol) contract.

#### Liquidate
Liquidates an undercollateralized Account. Operates on two Accounts: the liquidating Account, and the undercollateralized Account. Does not transfer any tokens, but just internally updates balances of accounts. Liquidates at the price specified by Example:

Starting Account Balances:

Liquidating Account (L): +100 DAI
Undercollateralized Account (U): -1 ETH, +150 DAI
ETH oracle price: $125
DAI oracle price: $1
Liquidation spread: 5%

The liquidate action causes 1 ETH to be transferred from L -> U, and `1 ETH * (($125/ETH) / ($1/DAI)) * 1.05 = 131.25 DAI` to be transferred from U -> L. After the liquidation the balances will be:

Liquidating Account (L): +231.25 DAI, -1 ETH
Undercollateralized Account (U): +18.75 DAI

#### Vaporize
Pulls funds from the insurance fund to recollateralize an underwater account with only negative balances.

## Operations

Every state changing action to the protocol occurs through an Operation. Operations contain a series of [Actions](#Actions) that each operate on an Account.

Multiple Actions can be strung together in an Operation to achieve more complex interactions with the protocol. For example, taking short ETH position on Solo could be achieved with an Operation containing the following Actions:

```
Sell ETH for DAI
Deposit DAI
```

Importantly collateralization is only checked at the end of an operation, so accounts are allowed to be transiently undercollateralized in the scope of one Operation. This allows for Operations like a Sell -> Trade, where an asset is first sold, and the collateral is locked up as the second Action in the Operation.

## Amounts

Amounts in Solo are denominated by 3 things:

- `value` the numerical value of the Amount
- `reference` One of:
  - `AmountReference.Delta` Indicates an amount relative to the existing balance
  - `AmountReference.Target` Indicates an absolute amount
- `denomination` One of:
  - `AmountDenomination.Wei` Indicates the amount is denominated in the actual units of the token being transferred (See [Wei](#Wei))
  - `AmountDenomination.Par` Indicates the amount is denominated in principal. Solo uses these types of amounts in its internal accounting, and they do not change over time (See [Par](#Par))

A very important thing to note is that amounts are always relative to how the balance of the Account being Operated on will change, not the amount of the Action occurring. So, for example you'd say [pseudocode] `withdraw(-10)`, because when you Withdraw, the balance of the Account will decrease.
