const BinanceExchange = require('./exchange').BinanceExchange;

class ExchangeDaemon {
  constructor(exchange /*: BinanceExchange */) {
    if (!(exchange instanceof BinanceExchange))
      throw new Error('the first param must be of type BinanceExchange')

    this.exchange = exchange;
    this.repaint = false;
  }

  addAssets(json) {
    const exchange = this.exchange;
    const keys = Object.keys(json);
    for (let key of keys) {
      const account = json[key];
      exchange.addAsset(key, account);
    }
  }

  getPairs() {
    return this.exchange.pairs;
  }
  
  start(callback) {
    const self = this;
    const exchange = this.exchange;
    exchange.fetchTradePairs(info => {
      // start websockets trades feed
      exchange.startTradePairFeeds(callback);
      // start order book depth feed
      exchange.startOrderDepthFeeds(callback);
    });
  }
};

module.exports = ExchangeDaemon;
