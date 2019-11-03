const { openPublicStream } = require('./streams');

const CONFIG = {
  TRADE_QUEUE_SIZE: 42,
  TICKER_QUEUE_SIZE: 42,
  DEPTH_QUEUE_SIZE: 2,
}

const ENDPOINT = {
  TRADE: 'trade',
  BOOKTICKER: 'bookTicker',
  DIFFDEPTH: 'diffDepth100ms', 
}

const OPTIONS = {
  symbols: 'BTCUSDT',
  endpoints: Object.values(ENDPOINTS),
  params: { level: 5 },
  ws: undefined,
};

class Queue {
  constructor(size, initValue = {}) {
    // init queue
    this.queue = new Array(size);
    for (let i = 0; i < this.queue.length; ++i)
      this.queue[i] = initValue;
  
    // init queue pointers
    this.size = 0;
    this.idx = 0;
  }

  isUpToDate() {
    return this.size >= this.queue.length;
  }

  addItem(item) {
    const idx = (this.idx + 1) % this.queue.length;
    this.idx = idx;
    this.size = Math.min((this.size + 1), this.queue.length);
    this.queue[idx] = item;
  }

  calcIndex(offset = 0) {
    if (Number.isNaN(offset))
      return 0;
    
    offset = (this.idx + offset) % this.size;
    return offset < 0
      ? this.size + offset
      : offset;
  }

  getItem(offset) {
    return this.queue[this.calcIndex(offset)];
  }

}

class MarketTradeQueue extends Queue {
  constructor() {
    super(CONFIG.TRADE_QUEUE_SIZE, {});
  }

  getStats() {
    // fetch first and last items
    const currentTrade = this.getItem();
    const firstTrade = this.getItem(1);
    const stats = {};

    // get event times
    const endEventTime = currentTrade.eventTime;
    const startEventTime = firstTrade.eventTime || endEventTime;

    // get interval size
    const size = this.size;

    // calculate and set trade interval
    stats.startEventTime = startEventTime;
    stats.endEventTime = endEventTime;
    stats.avgTradeTime = (endEventTime - startEventTime) / size;

    // get price and quantity
    let sumPrice = Number(currentTrade.price);
    let sumQty = Number(currentTrade.quantity);
    let sumVol = sumPrice * sumQty;

    // calculate volume of cache
    for (let i = 1; i < size; ++i) {
      const item = this.getItem(i);
      const price = Number(item.price);
      const qty = Number(item.quantity);
      sumPrice += price;
      sumQty += qty;
      sumVol += (price * qty);
    }

    // add sums to stats
    stats.sumPrice = sumPrice;
    stats.sumQty = sumQty;
    stats.sumVol = sumVol;
    stats.sumCount = size;
  
    // add volume averages to stats
    stats.avgPrice = sumPrice / size;
    stats.avgQty = sumQty / size;
    stats.avgVol = sumVol / size;
    stats.avgUnit = sumPrice / sumQty;

    return stats;
  }
}

class MarketTickerQueue extends Queue {
  constructor() {
    super(CONFIG.TICKER_QUEUE_SIZE, {});
  }

  getStats() {
    const stats = {};
    return stats;
  }

}

class MarketDepthQueue extends Queue {
  constructor() {
    super(CONFIG.DEPTH_QUEUE_SIZE, {});
  }

  getStats() {
    const stats = {};
    return stats;
  }

}

const tradeFeeds = new Map();
const tickerFeeds = new Map();
const depthFeeds = new Map();

function getMarketTradeQueue(symbol) {
  if (tradeFeeds.has(symbol))
    return tradeFeeds.get(symbol);
  
  const cache = new MarketTradeQueue();
  tradeFeeds.set(symbol, cache);
  return cache;
}

function getMarketTickerQueue(symbol) {
  if (tickerFeeds.has(symbol))
    return tickerFeeds.get(symbol);
  
  const cache = new MarketTickerQueue();
  tickerFeeds.set(symbol, cache);
  return cache;
}

function getMarketTradeQueue(symbol) {
  if (depthFeeds.has(symbol))
    return depthFeeds.get(symbol);
  
  const cache = new MarketDepthQueue();
  depthFeeds.set(symbol, cache);
  return cache;
}

function createPublicCollector(symbols, callback) {
  if (typeof symbols !== 'string')
    throw new Error('not implemented');
  
  return openPublicStream(
    {
      ...OPTIONS,
      symbols
    },
    function processPublicStream(err, json) {
      if (!err) {
        const symbol = json.symbol;
        // get cache for symbol
        let cache;
        switch (json.endpoint) {
          case ENDPOINT.TRADE:
            cache = getMarketTradeQueue(symbol)
            break;
          case ENDPOINT.BOOKTICKER:
            cache = getMarketTickerQueue(json);
            break;
          case ENDPOINT.DIFFDEPTH:
            cache = getMarketDepthQueue(json);
            break;
          default:
            callback('unknown endpoint response', json.endpoint);
            return;
        }
        // add trade item to the cache
        cache.addItem(json.data);
        callback(null, cache.getStats());
      }
      callback(err, json);
    });
}

module.exports = {
  createPublicCollector: createPublicCollector,
}
