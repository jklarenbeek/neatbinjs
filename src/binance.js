const Binance = require('node-binance-api');

const tradeConfig = {
  MAX_TRADES_SIZE: 42,
}

class TradePair {
  constructor(exchange, info) {
    this.exchange = exchange;
    this.client = exchange.client;
    this.info = info;
  
    this.trades = new Array(tradeConfig.MAX_TRADES_SIZE);
    this.tradeIdx = -1;

    this.depthCache = {};
  }

  peekLastTrade() {
    const trades = this.trades;
    const idx = this.tradeIdx;
    return idx >= 0 ? trades[idx] : undefined;
  }

  addTradeFeed(trade) {
    const idx = (this.tradeIdx + 1) % tradeConfig.MAX_TRADES_SIZE;
    this.tradeIdx = idx
    this.trades[idx] = trade;
  }

  setDepthCache(depth) {
    this.depthCache = depth
  }
}

const cleanTradeFeeds = new WeakMap();
const cleanDepthFeeds = new WeakMap();

class BinanceExchange {
  constructor(client) {
    this.client = client;

    this.timezone = '';
    this.serverTime = 0;

    this.rateLimits = [];

    this.assets = new Map();
    this.pairs = new Map();
    this.fees = new Map();

    this.clean = {};
  }

  addAsset(base, available = 0.0, locked = 0.0) {
    if (base == null || base === '' || base.constructor !== String)
      return null;

    const asset = { base, available, locked };
    this.assets.set(base, asset);
    return asset;
  }

  fetchFees() {
    const self = this;
    const tradeFees = self.client.tradeFee;
    return tradeFees().then(function (fees) {
      const len = fees.length;
      for (let i = 0; i < len; ++i) {
        const fee = fees[i];
        if (fee == null) continue;
        // TODO:
        continue;
        if (!self.hasTradePair(fee.symbol)) continue;
        self.fees.set(fee.symbol, fee);
      }
      return fees;
    });
  }

  fetchTradePairs() {
    const self = this;
    const pairs = self.pairs;
    const assets = self.assets;
    const exchangeInfo = self.client.exchangeInfo;
    return exchangeInfo(function (err, info) {
      // save time
      self.timezone = info.timezone;
      self.serverTime = info.serverTime;

      // save rateLimits
      self.rateLimits = info.rateLimits;

      // add trading pairs that are trading
      pairs.clear();
      const symbols = info.symbols;
      const len = symbols.length;
      for (let i = 0; i < len; ++i) {
        const json = symbols[i];
        if (json == null) continue;
        if (json.status !== 'TRADING') continue;
        if (!assets.has(json.baseAsset)) continue;
        if (!assets.has(json.quoteAsset)) continue;
          
        pairs.set(json.symbol, new TradePair(self, json));
      }
      return info;
    });
  }

  startTradeFeeds(callback) {
    const self = this;
    self.stopTradeFeeds();
  
    const pairs = self.pairs;
    const symbols = Array.from(pairs.keys());
  
    const tradeFeeds = self.client.websockets.trades;
    cleanTradeFeeds.set(this, tradeFeeds(
      symbols,
      trade => {
        const symbol = trade.symbol;
        const pair = pairs.get(symbol);
        pair.addTradeFeed(trade);
        callback && callback(trade);
      },
    ));
  }
  
  stopTradeFeeds() {
    if (cleanTradeFeeds.has(this)) {
      const clean = cleanTradeFeeds.get(this);
      cleanTradeFeeds.remove(this);
      clean();
    }
  }

  startDepthFeeds(callback) {
    const self = this;
    self.stopDepthFeeds();

    const pairs = self.pairs;
    const symbols = Array.from(pairs.keys());

    const depthCache = self.client.websockets.depthCache
    depthCache(symbols, (symbol, depth) => {
      eventTime = new Date(depth.eventTime);
      bids = binance.sortBids(depth.bids);
      asks = binance.sortAsks(depth.asks);
    });

    const depthFeeds = self.client.ws.depth
    cleanDepthFeeds.set(this, depthFeeds(
      symbols,
      depth => {
        const symbol = depth.symbol;
        const pair = pairs.get(symbol);
        pair.setDepthCache(depth);
        callback(pair);
      })
    );
  }

  stopDepthFeeds() {
    if (cleanDepthFeeds.has(this)) {
      const clean = cleanDepthFeeds.get(this);
      cleanDepthFeeds.remove(this);
      clean();
    }

  }
}

module.exports = function createExchange(options) {
  const client = new Binance();
  if (options != null && typeof options === 'object')
    client.options(options);

  return new BinanceExchange(client, options);
}
