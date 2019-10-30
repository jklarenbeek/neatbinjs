const Binance = require('node-binance-api');
const TradePair = require('./tradepair');
const TradeAsset = require('./tradeasset');

const cleanTradeFeeds = new WeakMap();
const cleanDepthFeeds = new WeakMap();

class BinanceExchange {
  constructor(client, options = {}) {
    this.client = client;
    this.logger = options.logger || console;

    this.timezone = '';
    this.serverTime = 0;

    this.rateLimits = [];

    this.assets = new Map();
    this.pairs = new Map();
    this.fees = new Map();

    this.clean = {};
  }

  addAsset(base, available = 0.0, inorder = 0.0) {
    if (base == null || base === '' || base.constructor !== String)
      return null;

    const asset = new TradeAsset(base, available, inorder);
    this.assets.set(base, asset);
    return asset;
  }

  cloneAssets() {
    const assets = new Map();
    for (const [symbol, asset] in this.assets)
      assets.set(symbol, asset.clone());
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

  fetchTradePairs(callback) {
    const self = this;
    const pairs = self.pairs;
    const assets = self.assets;
    const logger = self.logger;

    const exchangeInfo = self.client.exchangeInfo;
    const recentTrades = self.client.recentTrades;
    // let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
    function parseTrades(trades) {
      const result = [];
      for (const trade of trades) {
        result.push({
          a: trade.id,
          m: trade.isBuyerMaker,
          E: trade.time,
          p: trade.price,
          q: trade.qty,
        })
      }
      return result;
    }

    return exchangeInfo(function (err, info) {
      logger.log('Fetched exchangeInfo.');

      // cleanup
      pairs.clear();

      // save time
      self.timezone = info.timezone;
      self.serverTime = info.serverTime;

      // save rateLimits
      self.rateLimits = info.rateLimits;

      // check if we have symbols
      const symbols = info.symbols;
      if (!(symbols instanceof Array)) {
        callback && callback(undefined, err);
        return;
      }

      const promises = [];
    
      // add trading pairs that are trading
      const len = symbols.length;
      for (let i = 0; i < len; ++i) {
        const json = symbols[i];
        if (json == null) continue;
        if (json.status !== 'TRADING') continue;
        if (!assets.has(json.baseAsset)) continue;
        if (!assets.has(json.quoteAsset)) continue;
        
        const symbol = json.symbol;

        logger.log('Fetching ' + symbol);

        promises.push(new Promise(function (resolve, reject) {
          recentTrades(
            symbol,
            function (err, trades) {
              if (err) {
                logger.error(err.toString());
                // something happend!
                reject(err);
              }
              else {
                logger.log('Fetched trades of ' + symbol);
                // create the trade pair and set its most recent trades
                const pair = new TradePair(
                  self,
                  parseTrades(trades),
                  json);
                pairs.set(symbol, pair);
                // we are clear
                resolve(pair);
              }
            },
            TradePair.config().MAX_TRADES_SIZE);
        }));
      }

      // fill all pair trades and tell callback we are done
      Promise.all(promises).then(_ => callback && callback(info));

    });
  }

  startTradePairFeeds(callback) {
    const self = this;
    self.stopTradePairFeeds();
  
    const logger = self.logger;
    const pairs = self.pairs;
    const symbols = Array.from(pairs.keys());
    
    logger.log('Starting Trades Feed');

    const tradeFeeds = self.client.websockets.trades;
    cleanTradeFeeds.set(this, tradeFeeds(
      symbols,
      trade => {
        const symbol = trade.s;
        const pair = pairs.get(symbol);
        pair.addTradeItem(trade);
        callback && callback(symbol, pair);
      },
    ));
  }
  
  stopTradePairFeeds() {
    if (cleanTradeFeeds.has(this)) {
      logger.warn('Stopping Trades Feed');

      const terminate = this.client.terminate;
      const endpointId = cleanTradeFeeds.get(this);
      cleanTradeFeeds.remove(this);
      terminate(endpointId);
    }
  }

  startOrderDepthFeeds(callback) {
    const self = this;
    self.stopOrderDepthFeeds();

    const logger = self.logger;
    const pairs = self.pairs;
    const symbols = Array.from(pairs.keys());

    logger.log('Starting OrderDepth Feed');

    const depthCache = self.client.websockets.depthCache
    cleanDepthFeeds.set(this, depthCache(
      symbols,
      (symbol, depth) => {
        const pair = pairs.get(symbol);
        pair.setDepthCache(depth);
        callback && callback(symbol, pair);
      }
    ));
  }

  stopOrderDepthFeeds() {
    if (cleanDepthFeeds.has(this)) {
      logger.warn('Stopping OrderDepth Feed');

      const terminate = this.client.terminate;
      const endpointId = cleanDepthFeeds.get(this);
      cleanDepthFeeds.remove(this);
      terminate(endpointId);
    }
  }
}

function createExchange(options) {
  const client = new Binance();
  if (options != null && typeof options === 'object')
    client.options(options);

  return new BinanceExchange(
    client,
    { logger: options.logger }
  );
}

module.exports = {
  BinanceExchange,
  createExchange,
}
