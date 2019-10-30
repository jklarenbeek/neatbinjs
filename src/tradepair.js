const tradeConfig = Object.freeze({
  MAX_TRADES_SIZE: 42,
  MAX_DEPTH_SIZE: 42,
});

class TradePair {
  
  static config() { return tradeConfig };

  constructor(exchange, trades, info) {
    this.exchange = exchange;
    this.client = exchange.client;
    this.info = info;

    this.symbol = info.symbol;
    this.baseAsset = info.baseAsset;
    this.quoteAsset = info.quoteAsset;
  
    this.trades = trades.slice(0, tradeConfig.MAX_TRADES_SIZE);
    this.tradeIdx = this.trades.length - 1;

    this.depthCache = {};
  }

  addTradeItem(trade) {
    const idx = (this.tradeIdx + 1) % tradeConfig.MAX_TRADES_SIZE;
    this.tradeIdx = idx
    this.trades[idx] = trade;
  }

  setDepthCache(cache) {
    this.depthCache = cache;
  }

  peekTradeItem(idx = 0) {
    const tdx = this.tradeIdx;
    if (tdx == -1) return undefined;

    idx = (tdx + idx) % tradeConfig.MAX_TRADES_SIZE;
    if (idx < 0) idx = tradeConfig.MAX_TRADES_SIZE + idx;

    const trades = this.trades;
    return trades[idx];
  }

  getDepthVolume() {
    return this.client.depthVolume(this.symbol);
  }

  getAverageTradeTime() {
    const trades = this.trades;
    if (trades.length === 0) return -1;

    let idx = (this.tradeIdx + 1) % trades.length;

    let ltime = trades[idx].E;
    let total = 0;
    for (let i = 0; i < trades.length; ++i) {
      idx = (idx + i) % trades.length;

      const ntime = trades[idx].E;
      const ttime = ntime - ltime;
      if (ttime > 0) {
        total += ttime
      }
      ltime = ntime;
    }
    return total > 0 ? total / trades.length : -1;
  }

  currentInfo() {
    const trade = this.peekTradeItem() || {
      p: '0.0',
      q: '0.0',
    };
    if (trade == null) return {};

    const before = this.peekTradeItem(-1)
      || trade;

    const responseAvg = new Date(Math.round(this.getAverageTradeTime()));

    const symbol = this.info.symbol;
    const volume = this.getDepthVolume(symbol);
    const diff = Number(trade.p) - Number(before.p);
    return {
      symbol,
      price: trade.p,
      quantity: trade.q,
      diff: diff,
      responseAvg: responseAvg,
      asks: volume.asks,
      askQty: volume.askQty,
      bids: volume.bids,
      bidQty: volume.bidQty,
    }
  }

  normalise(level = 20) {
    const test = 'this is a test';
    return test;
  }
}

module.exports = TradePair;