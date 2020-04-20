# Perpetual Guide and Contract Specification

The dYdX Perpetual is a non-custodial, decentralized derivative product that gives traders synthetic exposure to assets that cannot normally be traded on the Ethereum blockchain. Like other margin trading products offered by dYdX, the market is primarily governed by Ethereum smart contracts, while hosting of the order book and matching of orders is handled off-chain by dYdX.

This article focuses on the technical information needed to trade the perpetual and compare it to other perpetual products. More details on the dYdX Perpetual Contracts Protocol and decentralization can be found [here](perpetual-protocol.md).

## BTC–USDC Contract Specification

* Underlying market: BTC–USD
* Margin/settlement asset: USDC
* Tick size: $0.50
* Min order size: 0.001 BTC (~$7.20)
* Quantity step: 0.00000001 BTC (1 satoshi)
* Max order size: None
* Max position size: None
* Expiry: Perpetual (no expiration)
* Maximum leverage: 10x
* Initial margin requirement: 10%
* Maintenance margin requirement: 7.5%
* Fees: -0.025% Maker, 0.075% Taker
* Custom fees for ‘Small’ orders: 0.5% Taker
* ‘Small’ order size: 0.01 BTC (~$72.00)
* Mark price for liquidations: The mark price is the on-chain index price, given by the [MakerDAO BTC–USD Oracle V2](https://blog.makerdao.com/introducing-oracles-v2-and-defi-feeds/) which reports a median of the following [seven spot exchanges](https://github.com/makerdao/setzer-mcd/blob/c528da640393a3d79ef314a7f86ae363d503a240/libexec/setzer/setzer-price-btcusd#L5-L11): Binance, Bitfinex, Bitstamp, Coinbase Pro, Gemini, Kraken, and Upbit.
* Funding: Funding payments are made every second according to a rate which is updated hourly. The funding premium is scaled so as to have a realization period of 8 hours.
* Contract loss mechanism: Deleveraging (centralized, but verifiable insurance fund is the first backstop before deleveraging)
* Trading hours: 24 x 7 x 365

Additional details are provided below.

## Margin

Each trader’s account consists of two balances: a margin balance (denominated in the margin asset, e.g. USDC) and a position balance (denominated in the underlying asset, e.g. BTC). Either balance may be positive or negative. Any trade executed by the trader will increase one balance and decrease the other. All withdrawals and deposits are made in the margin asset and affect only the margin balance. Positions (e.g. BTC) cannot be withdrawn directly.

Note that there is no isolated margin mode, as each account has only a single position balance. Also, an account cannot simultaneously hold positive and negative positions.

The “riskiness” of an account is measured via the margin percentage, defined as follows:

<pre>Margin Percentage = Collateralization Ratio - 1</pre>

Where the collateralization ratio of an account is defined as:

<pre>Collateralization Ratio = Value of Positive Balances / Absolute Value of Negative Balances</pre>

The relative value between currencies is determined by the on-chain index price. For example, in the BTC/USDC perpetual, margin percentage is a function of the BTC/USD index and the account’s BTC and USDC balances.

An account whose margin percentage falls below the maintenance margin requirement may be liquidated. Accounts are restricted from making trades or withdrawals that would bring their account below the initial margin requirement, which is set higher than the maintenance margin requirement. Movements in the index price may, however, cause an account to drop below the initial margin requirement and, eventually, the maintenance margin requirement.

Accounts which fall below the initial margin requirement are restricted from making withdrawals and certain trades until the account’s margin percentage is brought back to the initial margin requirement. These “risky” accounts are barred from making trades that do any of the following:

1. Decrease the account’s margin percentage.
1. Increase the absolute size of the account position.
1. Change the sign of the account position (long to short, or vice versa).

These restrictions apply whether the “risky” account is a taker or a maker in the trade.

### Margin Example

The following illustrates a hypothetical sequence of actions taken by a trader, and their margin percentage after each step. The on-chain index price at each point is given as well. We assume an initial margin requirement of 10% and a maintenance margin requirement of 7.5%.

<table>
  <thead>
    <tr>
      <th> Action </th>
      <th> Balances </th>
      <th> On-Chain Index </th>
      <th> Margin Percentage </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td> 1. Deposit 1000 USDC. </td>
      <td> +1000 USDC, 0 BTC </td>
      <td> 2000 USD / BTC </td>
      <td> Infinity </td>
    </tr>
    <tr>
      <td> 2. Buy 1 BTC for 2000 USDC. </td>
      <td> -1000 USDC, +1 BTC </td>
      <td> 2000 USD / BTC </td>
      <td> (1 BTC * 2000 USDC / BTC) / (1000 USDC) - 1 = <strong> 100% </strong> </td>
    </tr>
    <tr>
      <td> 3. Sell 2 BTC for 4000 USDC. </td>
      <td> +3000 USDC, -1 BTC </td>
      <td> 2000 USD / BTC </td>
      <td> (3000 USDC) / (1 BTC * 2000 USDC / BTC) - 1 = <strong> 50% </strong> </td>
    </tr>
    <tr>
      <td> 4. Withdraw 800 USDC. </td>
      <td> +2200 USDC, -1 BTC </td>
      <td> 2000 USD / BTC </td>
      <td> (2200 USDC) / (1 BTC * 2000 USDC / BTC) - 1 = <strong> 10% </strong> </td>
    </tr>
    <tr>
      <td> 5. (Movement in index price.) </td>
      <td> +2200 USDC, -1 BTC </td>
      <td> <strong> 2040 USD / BTC </strong> </td>
      <td> (2200 USDC) / (1 BTC * 2040 USDC / BTC) - 1 = <strong> 7.84% </strong> </td>
    </tr>
  </tbody>
</table>

In the final step, the on-chain index price increases while the trader holds a short position. This causes the margin percentage of the account to dip dangerously close to the maintenance margin requirement.

The account is not yet liquidatable, but may become so if the index price increases further. Since the margin percentage is below 10%, the account will be restricted from making withdrawals and certain trades, as described above, until the account is brought back above the initial margin requirement.

## Liquidations

An account whose margin percentage falls below the maintenance margin requirement may be liquidated. During a liquidation, the liquidator is allowed to take on the entire account balance of the liquidated account, leaving it with zero margin and position. Partial liquidation is also permitted, in which case the liquidator will take on proportional amounts of the account’s margin and position (one of which will be negative).

Liquidations occur on-chain, and any account may act as a liquidator, provided that their ending balance after the liquidation meets the maintenance margin requirement. We will open-source a new liquidator bot for the perpetual which anybody may run to participate in liquidations.

### Liquidation incentives

Since a liquidator may take on the liquidated account’s full balance, the incentive to liquidate is higher the closer the target account is to the liquidation threshold. Other factors impacting the liquidation reward are:

* Price direction and time to liquidation (e.g. account value may continue to fall, reducing the liquidation reward)
* Gas costs to win liquidation
* Costs of closing the liquidated position (in order to avoid taking on additional price exposure)

### Liquidation Examples

Assume an initial margin requirement of 10% and a maintenance margin requirement of 7.5%.

#### Example 1

Trader A deposits 1000 USDC, then opens a short position of 1 BTC at a price of 2000 USDC. Their account balance is +3000 USDC, -1 BTC. The on-chain index price is 2000 USDC/BTC making their margin percentage 50%.

Over time, the price of BTC increases, and the on-chain index price hits 2791 USDC, at which point Trader A’s position is below the maintenance margin requirement and becomes liquidatable. Trader B, who has a balance of +100 USDC, 0 BTC, liquidates A’s position successfully, leaving A with zero balance, and bringing B’s balance to +3100 USDC, -1 BTC. Trader B then closes the short position on the market at a price of 2800 USDC, bringing their final balance to +300 USDC, 0 BTC.

At the time of liquidation, using the index price of 2791 USDC, Trader A’s account had a nominal value of 209 USDC, therefore we may say that A’s liquidation penalty was 209 USDC.

Trader B’s profit, after closing the short position, and ignoring any trade fees, is 200 USDC.

#### Example 2 - Partial Liquidation

Suppose Trader A has an account balance of +3000 USDC, -1 BTC, but due to a rapidly increasing price in the underlying spot market, the on-chain index is now 2900 USDC, giving A a margin percentage of only 3.45%.

Trader B, who has a balance of +100 USDC, 0 BTC, wants to liquidate Trader A’s account. However, at the current index price, a full liquidation is not possible since it would leave B with a margin percentage of 6.90%. Trader B chooses to execute a partial liquidation, taking on 60% of Trader A’s balances. This leaves A with 1200 USDC, -0.4 BTC, and B with 1900 USDC, -0.6 BTC.

At an index price of 2900 USDC, Trader B’s account has a nominal value of 160 USDC, giving them a hypothetical profit of 60 USDC. Trader B’s position is currently fairly risky however, with a margin percentage of 9.20%.

Trader A’s remaining position still has a margin percentage of 3.45%, and their remaining balance may be liquidated if they don’t make a deposit or trade out of their position.

## Funding

Perpetual contracts are inspired by traditional futures contracts, but differ in that there is no expiry date and therefore no final settlement or delivery. Funding payments are therefore used to incentivize the price of the perpetual to trade at the price of the underlying.

Funding is calculated like an interest rate, and is determined by a funding rate which is calculated algorithmically based on the price of the underlying and market prices for the perpetual. When the rate is positive, traders who are long will make payments to traders who are short. When the rate is negative, this is reversed and shorts will pay longs. Traders make or receive payments in proportion to the size of their market position. These payments are exchanged solely between traders, and are neither paid nor received by the exchange.

### Funding Interval

Funding payments are exchanged continuously every second. The funding rate is updated every hour, but is represented as an 8-hour rate, indicating the amount of funding accounts may expect to pay/receive over an 8-hour period.

### Funding Payment Calculation

The funding amount paid or received by an account over some period of time of length T is calculated according to the formula:


<pre>F = (−1) * R * (T / 8 hours) * B * X</pre>

Where:
* **F** is the change in account balance over the given period
* **R** is the funding rate as an 8-hour rate
* **B** is the position balance of the account (positive or negative)
* **X** is the on-chain index price

Note that funding payments do not compound.

### Funding Rate Calculation

*Rates are represented as 8-hour rates unless stated otherwise.*

The funding rate has two components, the interest rate component and the premium component. The interest rate component aims to account for the interest rate differential between the base and quote currencies. We currently use the fixed rate:

<pre>Interest Rate Component = 0.01%</pre>

The premium component takes into account market activity for the perpetual. It is calculated at the start of every minute based on the current order book and off-chain index price according to the formula:


<pre>Premium = (Max(0, Impact Bid Price - Index Price) - Max(0, Index Price - Impact Ask Price)) / Index Price</pre>

Where the impact bid and impact ask prices are defined as:

<pre>
Impact Bid Price = Average execution price for a market sell of the impact notional value
Impact Ask Price = Average execution price for a market buy of the impact notional value
</pre>

And the impact notional amount is defined as:

<pre>Impact Notional Value = 500 USDC / Initial Margin Requirement</pre>

For example, at a 10% initial margin requirement, the impact notional value is 5000 USDC.

At the end of each hour, the 1-hour premium is calculated as the simple average (i.e. TWAP) of the 60 premiums calculated over the course of the last hour. The funding rate is then calculated as:


<pre>Funding Rate = One-Hour Premium + Interest Rate Component</pre>

### Index Price for Funding

Funding payments occur on-chain, so the calculation of funding payments from the funding rate uses an on-chain index given by a MakerDAO v2 oracle. The funding rate itself is calculated off-chain, and uses an off-chain index which is updated more frequently than the on-chain index. The indices are each calculated the same way, as the median spot price from seven exchanges: Binance, Bitfinex, Bitstamp, Coinbase Pro, Gemini, Kraken, and Upbit.

### Funding Rate Updates

After the funding rate is calculated by dYdX, it is immediately sent to the funding rate smart contract. Once the Ethereum transaction is mined, the new funding rate takes effect and is used to update account balances every second.

### Funding Rate Limits

The funding rate is limited in three ways. These limitations are enforced by the smart contract.
1. The max absolute funding rate is 0.75%.
1. The max change in a single smart contract update is 0.75%.
1. The max change over a 55-minute period is 0.75%.

### Funding Examples

#### Example 1

At 01:30 UTC, trader A opens a long position of 100 BTC at a price of 1990 USDC. The on-chain index price is 2000 USDC. Based on the premium from 00:00–01:00 UTC, the current funding rate is -0.06%. Trader A begins earning funding each second. After one second, funding earned is given by the formula:

<pre>F = (−1) * R * (T / 8 hours) * B * X</pre>

Where, in this case:
* **R** = -0.06%
* **T** = 1 second
* **B** = 100 BTC
* **X** = 2000 USDC / BTC

Resulting in a change in balance of F = +0.00416667 USDC.

Suppose the on-chain index price does not change over the next minute. We can use the same formula to calculate the funding accumulated, and find that the trader has earned:

<pre>F = (−1) * -0.0006 * (1 minute / (8 * 60 minutes)) * 100 BTC * 2000 USDC / BTC
  = +0.25 USDC
</pre>

A holds this long position for 8 hours until 09:30 UTC and the funding rate remains constant at -0.06%. Suppose that from 01:30–09:30 UTC the average on-chain index price is 2150 USDC. Then funding accumulated over this period is given by:

<pre>
F = (−1) * -0.0006 * (8 hours / 8 hours) * 100 BTC * 2150 USDC / BTC
  = +129 USDC.
</pre>

Note that over an 8-hour period, with a constant funding rate, the funding accumulated is simply equal to the funding rate times the value of the position at the average index price.

#### Example 2

At 01:59 UTC, trader A opens a long position of 100 BTC and trader B opens a short position of 50 BTC, both at a price of 1990 USDC. Based on the premium from 00:00–01:00 UTC, the current funding rate is 0.15%. Both traders begin accruing funding, with A paying funding and B receiving funding. For one minute, from 01:59–02:00 UTC, the funding rate remains at 0.15% and the on-chain index price averages 2000 USDC. Over this minute, balances are affected by funding as follows:

<pre>
F<sub>A</sub> = (−1) * 0.0015 * (1 minute / (8 * 60 minutes)) * 100 BTC * 2000 USDC / BTC
   = -0.625 USDC
F<sub>B</sub> = (−1) * 0.0015 * (1 minute / (8 * 60 minutes)) * -50 BTC * 2000 USDC / BTC
   = +0.3125 USDC
</pre>

At 2:00 UTC the funding rate increases to 0.30%. Suppose over the next minute, from 2:00–2:01 UTC, the on-chain index price averages 2050 USDC. Over this minute, balances are affected by funding as follows:

<pre>
F<sub>A</sub> = (−1) * 0.003 * (1 minute / (8 * 60 minutes)) * 100 BTC * 2050 USDC / BTC
   = -1.28125 USDC
F<sub>B</sub> = (−1) * 0.003 * (1 minute / (8 * 60 minutes)) * -50 BTC * 2050 USDC / BTC
   = +0.640625 USDC
</pre>

## Contract Loss Mechanisms

Offering the perpetual market with a high amount of leverage inevitably entails increased risk. In particular, during times of high volatility in the underlying spot markets, it is possible that the value of some accounts will drop below zero before they can be liquidated at a profit. Should these “underwater” accounts occur, they must be handled promptly in order to ensure the solvency of the system as a whole.

### Insurance Fund

At the time of launching the perpetual market, dYdX will seed an insurance fund that will be the initial backstop for any underwater accounts. This fund will be used before any deleveraging occurs.
* The initial seed amount for the fund will be 250,000 USD.
* The insurance fund account and its activities will be publicly auditable and verifiable.
* The insurance fund will not be decentralized at launch, and the dYdX team will be directly responsible for deposits to and withdrawals from the fund. In the future, we may decentralize some aspects of the fund; however, initially, our priority is to ensure that underwater accounts are dealt with in a timely manner.

### Deleveraging

Deleveraging is a feature made available by the perpetual smart contract, which is used as a last resort to close underwater positions if the insurance fund is depleted. Deleveraging works similarly to “auto-deleveraging” in other high-leverage futures and perpetual markets, and is a mechanism which requires profitable traders to contribute part of their profits to offset underwater accounts.
* Deleveraging will only be used if the insurance fund is depleted.
* Deleveraging is performed by automatically reducing the positions of some traders—prioritizing accounts with a combination of high profit and high leverage—and using their profits to offset underwater accounts.
* Deleveraging is chosen over a socialized loss mechanism to reduce the uncertainty faced by traders trading at lower risk levels.
* Any deleveraging that occurs will be public and auditable on-chain.

### Deleveraging Example

Assume an initial margin requirement of 10% and a maintenance margin requirement of 7.5%.

Trader A deposits 1000 USDC, then opens a long position of 1 BTC at a price of 2000 USDC. Their account balance is -1000 USDC, +1 BTC. During a period of intense and prolonged volatility, the on-chain index price reaches 1080 USDC. Trader A is in a risky position, but not yet liquidatable. The price then rapidly drops further, and before A can be liquidated, the on-chain index price reaches 900 USDC, making the nominal value of A’s account -100 USDC.

The insurance fund is already depleted due to recent price swings, so deleveraging kicks in. Trader B, whose current balance is 10000 USDC, -9 BTC, is selected as the counterparty, on the basis of B’s profit and leverage, and the fact that B’s short position can offset A’s long position.

Trader B receives A’s entire balance, leaving A with zero balance, and bringing B’s total balance to 9000 USDC, -8 BTC. Trader B’s nominal loss due to deleveraging is 100 USDC, at an index price of 900 USDC. Trader B’s margin percentage increased (and leverage decreased) as a result of deleveraging, from 23.46% to 25%.
