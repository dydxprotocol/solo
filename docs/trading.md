# Trading

## Programmatic Trading

To programmatically trade on Dolomite, you can use one of the following:

- TypeScript clients:
  - [DolomiteMargin](typescript.md)
- [Smart Contract Interface](contracts.md)

```javascript
// TODO
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
