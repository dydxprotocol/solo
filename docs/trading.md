# Trading

## Programmatic trading

To programmatically trade on dYdX, you can use one of:

- [Python client](python.md)
- [TypeScript client](typescript.md)
- [HTTP API](api.md)

Also see this [basic intro guide to getting started](https://medium.com/dydxderivatives/programatic-trading-on-dydx-4c74b8e86d88)

The [WebSocket API](wensocket.md) is also useful for trading.

## Matching Specification

All orders are routed through our central matching engine. Orders are matched first by price, then by time priority.

When orders are matched, our matching engine sends a fill transaction to the Ethereum blockchain. Once this transaction is mined, balances are updated reflecting the trades.

It is possible that fill transactions can revert, though this should be very rare. When fill transactions revert, trades are not executed and balances are not updated. On reverts, unless an order has specified the `cancelAmountOnRevert` flag, it will be re-placed onto the orderbook (which could cause another fill to be executed).

A maximum of 10 orders can be matched at a time (due to the Ethereum block gas limit). If a taker order is large enough such that the first 10 maker orders on the orderbook are not large enough to fully fill the taker order, and there exist worse-priced orders that would also match the taker order, orders are matched as follows (pseudocode):

```javascript
const trades = [];

for (makerOrder in orderbook) {
  if (takerOrder.crosses(makerOrder)) {
    if (trades.length < 10) {
      trades.push(makeTrade(takerOrder, makerOrder));
    } else {
      // Find the smallest sized trade from trades
      smallestTrade = trades.findSmallestTrade();

      if (smallestTrade.size < makerOrder.remainingSize) {
        // If the smallest trade in trades is smaller than the current
        // maker order's remaining amount, replace it with makerOrder
        trades = trades.removeTrade(smallestTrade);
        trades.push(makeTrade(takerOrder, makerOrder));
      }
    }
  } else {
    sendFillTransaction(trades);
    return;
  }

  if (orderEntirelyFilled(takerOrder)) {
    sendFillTransaction(trades);
    return;
  }
}
```
